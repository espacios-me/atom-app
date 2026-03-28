#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const workspace = process.cwd();
const configPath = path.join(workspace, 'config', 'trusted-workers', 'status-digest.config.json');

function readJson(file) {
  if (!fs.existsSync(file)) throw new Error(`Missing file: ${file}`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function parseProjectUrl(projectUrl) {
  const match = String(projectUrl).match(/^https:\/\/github\.com\/(users|orgs)\/([^/]+)\/projects\/(\d+)/i);
  if (!match) throw new Error('GITHUB_PROJECT_URL must look like https://github.com/orgs/<owner>/projects/<number>');
  return { scope: match[1].toLowerCase(), owner: match[2], number: Number(match[3]) };
}

async function githubGraphql(query, variables) {
  const token = process.env.GITHUB_TOKEN || process.env.PROJECTS_TOKEN;
  if (!token) throw new Error('Missing GITHUB_TOKEN or PROJECTS_TOKEN');

  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'trusted-status-digest-worker'
    },
    body: JSON.stringify({ query, variables })
  });

  const json = await response.json();
  if (!response.ok || json.errors) {
    throw new Error(`GitHub GraphQL error: ${JSON.stringify(json.errors || json, null, 2)}`);
  }

  return json.data;
}

function normalizeFieldValues(fieldNodes) {
  const output = {};
  for (const node of fieldNodes || []) {
    if (!node?.field?.name) continue;
    if (typeof node.text === 'string') output[node.field.name] = node.text;
    else if (typeof node.date === 'string') output[node.field.name] = node.date;
    else if (typeof node.name === 'string') output[node.field.name] = node.name;
  }
  return output;
}

async function fetchProjectItems(projectUrl) {
  const { scope, owner, number } = parseProjectUrl(projectUrl);
  const root = scope === 'orgs' ? 'organization' : 'user';
  const query = `
    query($owner: String!, $number: Int!, $after: String) {
      ${root}(login: $owner) {
        projectV2(number: $number) {
          title
          url
          items(first: 100, after: $after) {
            nodes {
              id
              content {
                __typename
                ... on DraftIssue {
                  title
                  body
                }
                ... on Issue {
                  title
                  number
                  url
                  repository { nameWithOwner }
                }
                ... on PullRequest {
                  title
                  number
                  url
                  repository { nameWithOwner }
                }
              }
              fieldValues(first: 50) {
                nodes {
                  ... on ProjectV2ItemFieldTextValue {
                    text
                    field { ... on ProjectV2FieldCommon { name } }
                  }
                  ... on ProjectV2ItemFieldDateValue {
                    date
                    field { ... on ProjectV2FieldCommon { name } }
                  }
                  ... on ProjectV2ItemFieldSingleSelectValue {
                    name
                    field { ... on ProjectV2FieldCommon { name } }
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
    }
  `;

  let after = null;
  const items = [];
  let title = '';
  let url = projectUrl;

  while (true) {
    const data = await githubGraphql(query, { owner, number, after });
    const project = data?.[root]?.projectV2;
    if (!project) throw new Error('Project not found or not accessible');
    title = project.title;
    url = project.url;
    items.push(...(project.items.nodes || []));
    if (!project.items.pageInfo.hasNextPage) break;
    after = project.items.pageInfo.endCursor;
  }

  return { title, url, items };
}

function bucketName(status, config) {
  const buckets = config.statusBuckets || {};
  if ((buckets.pending || []).includes(status)) return 'pending';
  if ((buckets.working || []).includes(status)) return 'working';
  if ((buckets.done || []).includes(status)) return 'done';
  return 'unclassified';
}

function detectDuplicates(mapped, fieldNames) {
  const byPage = new Map();
  const byTitle = new Map();

  for (const item of mapped) {
    const page = item.fields[fieldNames.page] || '';
    const title = (item.title || '').trim().toLowerCase();
    if (page) {
      if (!byPage.has(page)) byPage.set(page, []);
      byPage.get(page).push(item);
    }
    if (title) {
      if (!byTitle.has(title)) byTitle.set(title, []);
      byTitle.get(title).push(item);
    }
  }

  return {
    pages: [...byPage.entries()].filter(([, items]) => items.length > 1).map(([page, items]) => ({ page, count: items.length, items })),
    titles: [...byTitle.entries()].filter(([, items]) => items.length > 1).map(([title, items]) => ({ title, count: items.length, items }))
  };
}

function toMappedItem(item, fieldNames) {
  const fields = normalizeFieldValues(item.fieldValues?.nodes || []);
  const content = item.content || {};
  const title = content.title || 'Untitled item';
  const status = fields[fieldNames.status] || 'Unknown';
  return {
    id: item.id,
    title,
    status,
    bucket: null,
    url: content.url || null,
    repository: fields[fieldNames.repository] || content.repository?.nameWithOwner || null,
    fields
  };
}

function buildDigest(project, config) {
  const fieldNames = config.projectFieldNames || {};
  const mapped = project.items.map((item) => toMappedItem(item, fieldNames)).map((item) => ({ ...item, bucket: bucketName(item.status, config) }));
  const duplicates = detectDuplicates(mapped, fieldNames);
  const grouped = {
    pending: mapped.filter((item) => item.bucket === 'pending'),
    working: mapped.filter((item) => item.bucket === 'working'),
    done: mapped.filter((item) => item.bucket === 'done'),
    unclassified: mapped.filter((item) => item.bucket === 'unclassified')
  };
  return { projectTitle: project.title, projectUrl: project.url, grouped, duplicates };
}

function textList(items) {
  if (!items.length) return '- none';
  return items.map((item) => `- ${item.title}${item.repository ? ` [${item.repository}]` : ''}${item.url ? ` -> ${item.url}` : ''}`).join('\n');
}

function buildEmailBody(digest) {
  const duplicateLines = [];
  for (const dup of digest.duplicates.pages) duplicateLines.push(`- Duplicate page mapping: ${dup.page} (${dup.count} items)`);
  for (const dup of digest.duplicates.titles) duplicateLines.push(`- Duplicate title: ${dup.title} (${dup.count} items)`);

  return [
    `Project: ${digest.projectTitle}`,
    `URL: ${digest.projectUrl}`,
    '',
    'Pending',
    textList(digest.grouped.pending),
    '',
    'Being worked on now',
    textList(digest.grouped.working),
    '',
    'Done',
    textList(digest.grouped.done),
    '',
    'Unclassified',
    textList(digest.grouped.unclassified),
    '',
    'Duplicate warnings',
    duplicateLines.length ? duplicateLines.join('\n') : '- none',
    '',
    'Choices',
    '1) Best choice — fix duplicate items or unclassified statuses now.',
    '   Consequence: the board becomes easier to trust and summaries stay clear.',
    '2) Fastest choice — keep the digest running and clean up later.',
    '   Consequence: notifications still work, but some items may be confusing.',
    '3) Ignore duplicates and status drift.',
    '   Consequence: the updates become less trustworthy over time.'
  ].join('\n');
}

async function maybeSendEmail(config, digest, textBody) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const to = process.env.STATUS_NOTIFY_TO;
  const from = process.env.STATUS_NOTIFY_FROM || config.email?.preferredFrom || 'admin@espacios.me';
  const subjectPrefix = config.email?.subjectPrefix || '[Atom Ops]';

  if (!resendApiKey || !to) {
    return { sent: false, reason: 'Missing RESEND_API_KEY or STATUS_NOTIFY_TO' };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `${subjectPrefix} ${digest.projectTitle} status digest`,
      text: textBody
    })
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { sent: false, reason: `Email provider rejected the request: ${JSON.stringify(json)}` };
  }

  return { sent: true, providerResponse: json };
}

async function main() {
  const config = readJson(configPath);
  const projectUrl = process.env.GITHUB_PROJECT_URL;
  if (!projectUrl) throw new Error('Missing GITHUB_PROJECT_URL');

  const project = await fetchProjectItems(projectUrl);
  const digest = buildDigest(project, config);
  const textBody = buildEmailBody(digest);
  const email = await maybeSendEmail(config, digest, textBody);
  const wantsJson = process.argv.includes('--json');

  if (wantsJson) {
    console.log(JSON.stringify({ digest, email }, null, 2));
  } else {
    console.log('Trusted Status Digest');
    console.log('=====================');
    console.log(textBody);
    console.log('');
    if (email.sent) {
      console.log(`Notification sent from ${process.env.STATUS_NOTIFY_FROM || config.email?.preferredFrom || 'admin@espacios.me'} to ${process.env.STATUS_NOTIFY_TO}.`);
    } else {
      console.log(`Notification not sent: ${email.reason}`);
      console.log('Consequence: you still have the digest, but no email was delivered.');
    }
  }

  const hasDuplicates = digest.duplicates.pages.length > 0 || digest.duplicates.titles.length > 0;
  process.exit(hasDuplicates ? 1 : 0);
}

main().catch((error) => {
  console.error('Trusted Status Digest Worker failed.');
  console.error(`Reason: ${error instanceof Error ? error.message : String(error)}`);
  console.error('Choices:');
  console.error('1) Best choice — fix the GitHub token, project URL, or email provider settings now.');
  console.error('   Consequence: the notifications become reliable.');
  console.error('2) Fastest choice — run the digest locally without email until the provider is ready.');
  console.error('   Consequence: you still get visibility, but not inbox alerts.');
  process.exit(2);
});

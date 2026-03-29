import { brandTokens } from "../../packages/design-system/src";

export function renderComsPage(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Espacios /coms</title>
  <style>
    :root{--dark:${brandTokens.color.dark};--dark-2:${brandTokens.color.darkSoft};--muted:${brandTokens.color.muted};--line:${brandTokens.color.borderDark}}
    *{box-sizing:border-box} body{margin:0;background:radial-gradient(circle at top,#1a1a1a,var(--dark));color:rgba(255,255,255,.92);font-family:${brandTokens.font.sans}}
    .wrap{max-width:1100px;margin:0 auto;padding:24px} .nav{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
    .brand{font-size:30px;letter-spacing:-.03em}.muted{color:rgba(255,255,255,.56)}
    .grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
    .card{border:1px solid var(--line);background:rgba(255,255,255,.03);border-radius:14px;padding:14px}
    .kpi{font-size:34px;letter-spacing:-.04em;margin-top:8px}
    .panel{margin-top:12px;border:1px solid var(--line);border-radius:14px;padding:16px;background:rgba(255,255,255,.02)}
    .toolbar{display:flex;gap:8px;margin-bottom:8px}
    button{background:rgba(255,255,255,.1);border:1px solid var(--line);color:#fff;padding:8px 12px;border-radius:8px;cursor:pointer}
    @media (max-width:900px){.grid{grid-template-columns:1fr 1fr}}
  </style>
</head>
<body>
<div class="wrap">
  <div class="nav"><div class="brand">Espacios /coms</div><div class="muted">Cloudflare-native command center</div></div>
  <div class="grid">
    <div class="card"><div class="muted">GitHub repos</div><div id="repos" class="kpi">—</div></div>
    <div class="card"><div class="muted">Open PRs</div><div id="prs" class="kpi">—</div></div>
    <div class="card"><div class="muted">Cloudflare workers</div><div id="workers" class="kpi">—</div></div>
    <div class="card"><div class="muted">Pages projects</div><div id="pages" class="kpi">—</div></div>
  </div>
  <div class="panel">
    <div class="toolbar"><button id="refresh">Refresh</button><button id="insight">Gemini ops note</button></div>
    <div id="status" class="muted">Loading…</div>
    <div id="note" style="margin-top:10px"></div>
  </div>
</div>
<script>
  async function loadOverview(){
    const res=await fetch('/api/coms/overview');
    const data=await res.json();
    document.getElementById('repos').textContent=data.github.repositories;
    document.getElementById('prs').textContent=data.github.pullRequests;
    document.getElementById('workers').textContent=data.cloudflare.workers;
    document.getElementById('pages').textContent=data.cloudflare.pagesProjects;
    document.getElementById('status').textContent='Last update '+new Date(data.updatedAt).toLocaleString();
  }
  async function loadInsight(){
    const res=await fetch('/api/coms/insight');
    const data=await res.json();
    document.getElementById('note').textContent=data.note;
  }
  document.getElementById('refresh').onclick=loadOverview;
  document.getElementById('insight').onclick=loadInsight;
  loadOverview();
</script>
</body></html>`;
}

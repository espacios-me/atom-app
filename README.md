# BotSpace ID: botspace_5ed2f2b9-d7e2-444f-9dee-3411273c5848

> **Design System:** This repository follows the [espacios.me](https://espacios.me) high-contrast minimalist design system.

# Atom

**Your memory layer above everything.**

Atom is a conversational second brain for your messages, calendars, files, reminders, goals, and personal context.

It is built for one simple outcome: **you should never lose important context again**.

Talk to Atom the way you naturally think.
Drop a message.
Forward a file.
Save a thought.
Set a reminder.
Ask what matters.
Atom turns scattered input into memory, structure, and action.

## What Atom is

Atom is an AI memory and organization system that helps you:

- remember what matters
- organize what is scattered
- capture things instantly through conversation
- track goals, reminders, and commitments
- turn raw input into structured context
- resurface the right information at the right moment

Atom is not meant to feel like another dashboard you need to maintain.
It is meant to feel like a layer that sits above everything else.

## The idea

Most people live across too many surfaces:

- chat apps
- email
- notes
- files
- calendars
- project tools
- random screenshots
- thoughts captured too late or never at all

Atom is being built to unify that fragmented life into one memory system.

Instead of forcing users to manually organize everything, Atom is designed to:

1. capture through chat
2. understand intent
3. store useful memory
4. connect to outside tools
5. bring context back when it matters

## Core experience

Atom starts with a strong personal assistant foundation that already exists in this repo:

- conversational chat
- memories
- goals
- reminders
- settings and secure API key storage
- mobile + web app shell
- backend AI integration
- WhatsApp webhook groundwork

This is the base layer.

The bigger product is the memory layer above all your tools.

## What Atom becomes

Atom is being built into a system that can:

- create reminders in natural language
- store preferences, facts, people, projects, and notes as memory
- track goals and ongoing commitments
- turn chat into actions
- ingest context from WhatsApp, Gmail, Google Drive, Google Calendar, Linear, Vercel, and other sources
- generate briefings, summaries, and proactive resurfacing
- build a richer model of user context over time
- power a dashboard for memory search, profile context, relationships, goals, and insights

## How Atom works

### 1. Conversational capture
Atom starts with natural language.
Users should be able to say what they mean instead of filling out rigid forms.

### 2. Structured memory
Atom turns conversation and future external inputs into structured memory objects like reminders, goals, notes, and context.

### 3. Long-term context
Atom is designed to accumulate useful user context over time so it can become more relevant, more personal, and more helpful.

### 4. Cross-source ingestion
Atom’s roadmap extends beyond the app itself into email, messaging, files, calendars, and work tools.

### 5. Resurfacing
Atom is not just a place to store information.
It is being built to bring the right information back at the right moment.

### 6. Review and control
Fast capture happens through conversation.
Deeper review happens through a richer dashboard and future control surfaces.

## Why this repo matters

This repository is the foundation of Atom.

Today it already contains:

- an Expo / React Native app
- chat, memories, goals, and reminders
- local persistence and settings
- an Express + tRPC backend
- testing and deployment tooling
- the first backend steps for WhatsApp-based interaction

The roadmap expands this into a full second-brain platform with ingestion, analysis, dashboards, native surfaces, monitoring, security, and launch readiness.

## Tech stack

### App
- Expo
- React Native
- TypeScript
- expo-router
- AsyncStorage
- SecureStore

### Backend
- Node.js
- Express
- tRPC
- Zod
- Drizzle ORM
- MySQL

### Tooling
- pnpm
- Vitest
- TypeScript
- esbuild
- Wrangler

## Repo structure

```text
app/                App routes and screens
components/         UI components
contexts/           App state and data providers
server/             API server, routers, integrations
scripts/            Utility scripts
tests/              Test suite
assets/             Images, icons, branding
```

## Getting started

### Install

```bash
pnpm install
```

### Run locally

```bash
pnpm dev
```

### Useful scripts

```bash
pnpm test
pnpm lint
pnpm check
pnpm build
pnpm preview
pnpm deploy
```

## Positioning

**Atom is your conversational second brain.**

A memory layer above everything.
A system that remembers, organizes, and acts with context.

## Status

Atom already has a working product foundation in this repository.
The broader cross-channel memory platform is actively being built out.

---

Built for a future where memory, context, and action live in one place.

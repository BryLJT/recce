# Recce

**The forward deployed agent for solo consultants.**

Every mission starts with a recce. Send Recce to your client before the first meeting: it debriefs them in plain language, maps their workflow live, prices the waste with math they can edit, and returns two artifacts from one conversation — a value brief for the client, and a build dossier for you.

Built solo in one day at **BUIDL_OPC_Hackathon_SG** (July 2026).

## What it does

1. **Debrief** — the client rambles about their workflow; Recce (Claude Opus 4.8, structured outputs) breaks it into concrete steps, one question at a time, converting "it takes ages" into editable numbers.
2. **Signal** — a live waste meter: `minutes × frequency × hourly value`, computed deterministically in TypeScript (never by the model), recalculating instantly as the client corrects any number.
3. **Field report** (client view) — headline, fit points, a quote **range** (15–30% of first-year savings, floored, always "refined when we talk"), and net year-one savings.
4. **Run the pre-prototype — for real** — a live automation executes against Google Drive: copies a worksheet per student, shares it, constructs Kami viewer links by string interpolation, and appends them to a master Google Doc. Real files, created on click.
5. **Eyes only** (consultant view) — the same conversation reprojected as a build spec: per-step feasibility, integration surface, honest build-hours estimate, risk flags, questions for the human call — plus a silent below-minimum-engagement check.

**Positioning:** the agent primes the sales conversation; the human closes it. Recce compresses the funnel so one consultant can run many engagements — a one-person company with a scalable front door.

## Stack

- **Next.js 15** (App Router, TypeScript, Tailwind v4) — one app, three API routes
- **Claude Opus 4.8** — elicitation + analysis via `output_config` JSON-schema structured outputs, adaptive thinking, prompt caching
- **googleapis** — Drive copy/share + Docs write with a pre-minted OAuth refresh token (server-side, no browser auth)
- **Kami** — viewer links constructed from Drive file IDs; access governed purely by Drive permissions
- Deterministic quote engine in `lib/quote.ts` — all four pricing knobs consultant-configurable
- Mock mode: without `ANTHROPIC_API_KEY` the full flow runs on canned data (also the demo's disaster fallback)

## Run it

```bash
npm install
# .env.local: GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN
#             ANTHROPIC_API_KEY (optional — mock mode without it)
#             DEMO_TEMPLATE_FILE_ID / DEMO_MASTER_DOC_ID (for the live automation)
npm run dev
```

## Privacy

Session data exists to prepare the client's proposal and the consultant's dossier. Nothing is persisted — no database, React state only.

---

*Built with Claude Code. Design language: field-dossier — because reconnaissance deserves paperwork that looks the part.*

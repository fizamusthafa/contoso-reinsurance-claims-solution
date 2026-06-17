# Contoso Reinsurance Claims — code app

A Power Apps **code app** (React + TypeScript + Vite) that gives claims adjusters a
workbench over the three Dataverse tables created by the solution: **Claim**,
**Claim Document** and **Loss Classification**.

It lists claims with KPIs (total / open / complex / missing‑docs), a searchable and
status‑filtered list, and a detail panel showing the executive summary, the assigned
adjuster, the fast‑track reserve, the notifier, the document checklist and the cause‑of‑loss
classifications. Adjusters can set the triage status (New → In Review → Accepted →
Reassigned → Reserved → Closed) inline.

The data layer ([`src/claimsData.ts`](src/claimsData.ts)) uses the generated typed Dataverse
services when hosted in Power Apps and falls back to representative sample claims when run
locally, so the UI is always demonstrable.

## Prerequisites

- Node.js 20+ and npm
- Power Platform CLI (`pac`) with `pac code` (preview) — `winget install Microsoft.PowerPlatformCLI`
- The solution imported first (the app binds to its `uw_submission` / `uw_submissiondocument`
  / `uw_classificationmatch` tables)
- A Microsoft Dataverse connection in the target environment

## Run locally

```powershell
npm install
npm run dev      # http://localhost:3000  (uses sample data)
```

## Deploy to Power Apps

```powershell
# 1. Point the app at your environment + Dataverse
pac auth create --environment https://<your-org>.crm.dynamics.com/
pac code init --displayName "Contoso Reinsurance Claims"

# 2. Re-add the Dataverse data sources (generates src/generated/*)
pac code add-data-source --apiId dataverse --table uw_submission
pac code add-data-source --apiId dataverse --table uw_submissiondocument
pac code add-data-source --apiId dataverse --table uw_classificationmatch

# 3. Build and publish
npm install
npm run build
pac code push
```

`pac code push` prints the play URL. On first run the app prompts to allow its Dataverse
connection.

## Notes

- `src/generated/**` and `.power/schemas/**` are produced by `pac code add-data-source`.
  They're committed here so the app builds out of the box, but re‑running
  `add-data-source` against your environment refreshes them with your metadata.
- Use `--apiId dataverse` (the keyword), **not** the full connector path — the full path
  currently errors in the preview CLI.

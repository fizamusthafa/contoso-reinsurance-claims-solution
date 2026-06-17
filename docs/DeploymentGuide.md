# Deployment Guide

This guide takes you from an empty environment to a working **Contoso Reinsurance Claims
Processor** agent. The solution imports the tables, agent, sub‑agent, flows, AI model and
the model‑driven app in one shot; the remaining steps connect it to your Microsoft 365
services and switch everything on.

Total time is roughly 30–45 minutes, most of it waiting for imports and indexing.

---

## 0. Prerequisites

- Power Platform environment with Dataverse, and the System Administrator role on it
- Power Platform CLI: `winget install Microsoft.PowerPlatformCLI`
- Connectors available in the environment: Microsoft Dataverse, Office 365 Outlook,
  SharePoint, Microsoft Teams, Word Online (Business), Microsoft Copilot Studio
- A **shared mailbox** for incoming claims (for example `claims@yourtenant.onmicrosoft.com`).
  The account that creates the Office 365 Outlook connection must have **Full Access** to it.
- A SharePoint site (document library for the Word reports) and a Teams team/channel

---

## 1. Import the solution

```powershell
pac auth create --environment https://<your-org>.crm.dynamics.com/
pac auth select  --index <n>          # if you have multiple profiles

cd solution
pac solution import --path .\ContosoReinsuranceClaims_unmanaged.zip --publish-changes --force-overwrite
```

The import creates:

- 3 tables — **Claim**, **Claim Document**, **Loss Classification**
- the agent **Contoso Reinsurance Claims Processor** and the **Claims Adjuster Assignment Agent**
- 2 flows — **Generate & Deliver Report**, **Send Missing Docs Email**
- the **Extract Claim Data** prompt
- the **Contoso Reinsurance Claims** model‑driven app
- 6 knowledge documents

> If you re‑import over an existing copy, use a higher version number or `--force-overwrite`.

---

## 2. Create the connections

In **make.powerapps.com → your environment → Connections → New connection**, create one
connection each for: Microsoft Dataverse, Office 365 Outlook, SharePoint, Microsoft Teams,
Word Online (Business), Microsoft Copilot Studio. Sign in with an account that can reach the
shared mailbox, the SharePoint site and the Teams channel.

---

## 3. Bind the connection references

Open the solution → **Objects → Connection references**. For each reference, click **Edit**,
pick the matching connection from step 2, and **Save**:

| Connection reference | Connector |
| --- | --- |
| Microsoft Dataverse | Microsoft Dataverse |
| Office 365 Outlook | Office 365 Outlook |
| SharePoint | SharePoint |
| Microsoft Teams | Microsoft Teams |
| Word Online (Business) | Word Online (Business) |
| Microsoft Copilot Studio | Microsoft Copilot Studio |

---

## 4. Point the flows at your SharePoint / Teams / shared mailbox

The two flows ship with the demo tenant's site, channel and mailbox baked in. Open each flow
in **Power Automate** and update:

**Generate & Deliver Report**
- *Populate Word Template* and *Create file* → your SharePoint site + document library
- *Post adaptive card* → your Teams team (`groupId`) and channel (`channelId`)
- *Create Submission/Document/Classification row* → these already target this environment
  (no cross‑environment URL anymore); leave them as is

**Send Missing Docs Email**
- The *Send an email* step uses the connection owner's mailbox; no change needed unless you
  want a different sender

Save each flow and **turn it on**.

---

## 5. Add the shared‑mailbox trigger

The inbound trigger is added through Copilot Studio so it binds cleanly to the agent.

1. Open the agent in **Copilot Studio → Overview → Triggers → Add trigger**.
2. Choose **When a new email arrives in a shared mailbox (V2)** (Office 365 Outlook).
3. Sign in / pick the Office 365 Outlook connection.
4. Set **Original Mailbox Address** to your claims shared mailbox, for example
   `claims@yourtenant.onmicrosoft.com`. Optionally set a subject filter such as `Claim`.
5. In the message/payload step, keep the instruction that passes the email content to the
   agent (`Use content from <email>`).
6. **Create trigger**, then **turn the generated flow on** in Power Automate.

> Why this way: hand‑authored event triggers do not reliably bind to the agent on import,
> so the trigger is added in the UI where the binding and the connection are created for you.

---

## 6. Publish the agent

In **Copilot Studio → Publish**. The agent's channels (Teams, M365 Copilot) and the
generative orchestration go live.

---

## 7. Deploy the claims code app

The adjuster workbench is a Power Apps **code app** in [`/app`](../app). Deploy it after the
tables exist:

```powershell
cd app
pac code init --displayName "Contoso Reinsurance Claims"
pac code add-data-source --apiId dataverse --table uw_submission
pac code add-data-source --apiId dataverse --table uw_submissiondocument
pac code add-data-source --apiId dataverse --table uw_classificationmatch
npm install
npm run build
pac code push
```

`pac code push` prints the play URL. Wire that URL into the *Generate & Deliver Report*
flow's “Open in Claims app” adaptive‑card button so adjusters jump straight from Teams to the
claim. See [app/README.md](../app/README.md) for local dev.

---

## 8. Smoke test

- **Manual**: open the agent **Test** pane and paste a sample claim email (German or
  English). The agent should extract the data, name a *Bundesland* and language, classify the
  cause of loss, list missing documents, propose a fast‑track reserve where applicable, assign
  an adjuster, and call *Generate & Deliver Report*.
- **End‑to‑end**: send an email to the shared mailbox with a subject containing `Claim`. Within
  a minute you should see a new **Claim** row, child **Document** and **Loss Classification**
  rows, a Word assessment in SharePoint, and an adaptive card in Teams.
- Open the **Contoso Reinsurance Claims** app to triage the new claim.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Flow won't turn on: *"connection references need connections"* | Finish steps 2–3; for the trigger flow re‑pick the connection in the flow designer, then turn it on |
| Import fails on the email trigger flow | The shared‑mailbox trigger is added in step 5, not imported — make sure you're importing this solution, which omits the old trigger |
| Adaptive card / report not posted | Re‑point the SharePoint site and Teams channel in *Generate & Deliver Report* (step 4) |
| Agent answers in German | The instructions tell it to converse in English; re‑publish after any edit |
| Reserve / adjuster data looks wrong | These come from the knowledge files — see [KnowledgeSources.md](./KnowledgeSources.md) |

---

## Promoting to other environments

The provided zip is **unmanaged** (for dev). For test/production, export a **managed** copy
and convert the hard‑coded SharePoint site, Teams channel and shared‑mailbox address to
**environment variables** before you promote.

```powershell
pac solution export --name ContosoReinsuranceClaims --managed true --path .\out
```

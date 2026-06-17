# Knowledge Sources

The agent grounds its decisions in six Word documents attached as knowledge. The source
`.docx` files are in [`/solution/knowledge`](../solution/knowledge) so you can edit them and
re‑upload. After any edit, re‑index the knowledge in Copilot Studio and re‑publish the agent.

| File | Drives | Contents |
| --- | --- | --- |
| `Region_Mapping_Germany.docx` | Step 2 — region detection | German *Bundesländer* (Bayern, NRW, Baden‑Württemberg, Hessen, Berlin, Hamburg, Niedersachsen, Sachsen) with city/identifier lists and primary language |
| `Claims_Adjuster_Table.docx` | Adjuster assignment | Adjusters with email, seniority, region, languages, caseload, status, plus a fallback adjuster |
| `Cause_of_Loss_Reference.docx` | Step 4 — cause of loss | Peril taxonomy with codes (FIRE‑100, NATCAT‑FLD, WATER‑200, LIAB‑600, BI‑500 …), German terms and severity |
| `Required_Documents_Checklist.docx` | Step 6 — document check | Required documents per claim category (Property Damage, Liability, Fast‑Track) |
| `Fast_Track_Reserve_Rules.docx` | Step 7 — reserve estimate | Required fields, base factors, location factors, EUR reserve terms and the formula |

> The two agents each carry their own copy of `Claims_Adjuster_Table.docx` (the processor and
> the assignment sub‑agent), so update both if you change the adjuster roster.

## Editing tips

- **Keep the headings.** The agent reads the structure, so preserve the `Heading 1/2` layout
  and the `Key: Value` lines (for example `Region: Bayern`, `Caseload: 8 / 15`).
- **Reserve maths** lives entirely in `Fast_Track_Reserve_Rules.docx`:
  `Reserve = base_factor × estimated_loss × location_factor`, floored at €2,500, with a €1,000
  standard excess. Change the factors there, not in the agent instructions.
- **Cause‑of‑loss codes** in `Cause_of_Loss_Reference.docx` are the values the agent writes to
  the `Loss Classification` rows. If you add codes, the agent will start using them; no schema
  change is needed.
- **Adjuster emails** must be real mailboxes in your tenant — the assignment sub‑agent checks
  Outlook availability for the chosen adjuster, so a bad address breaks that step.

## Regenerating the documents

The knowledge files are plain Word documents. They were generated with `python-docx`; the
generator script (`gen-docs.py`) is included in [`/solution/knowledge`](../solution/knowledge)
if you'd rather edit the data in code and rebuild them.

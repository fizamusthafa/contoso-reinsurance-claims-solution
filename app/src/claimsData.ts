/**
 * Data access for the Contoso Reinsurance Claims app.
 *
 * Uses the generated typed Dataverse services when the app is hosted in
 * Power Apps. When running locally (or if the data call fails), it returns
 * representative sample claims so the UI is always demonstrable.
 */
import { Uw_submissionsService } from "./generated/services/Uw_submissionsService";
import { Uw_submissiondocumentsService } from "./generated/services/Uw_submissiondocumentsService";
import { Uw_classificationmatchsService } from "./generated/services/Uw_classificationmatchsService";
import type { Uw_submissions } from "./generated/models/Uw_submissionsModel";
import type { Uw_submissiondocuments } from "./generated/models/Uw_submissiondocumentsModel";
import type { Uw_classificationmatchs } from "./generated/models/Uw_classificationmatchsModel";

export type Claim = Uw_submissions;
export type ClaimDocument = Uw_submissiondocuments;
export type LossClassification = Uw_classificationmatchs;

export const TRIAGE_STATUS: Record<number, string> = {
  1: "New",
  2: "In Review",
  3: "Accepted",
  4: "Reassigned",
  5: "Reserved",
  6: "Closed",
};

export const COMPLEXITY: Record<number, string> = {
  1: "Simple",
  2: "Standard",
  3: "Complex",
};

export const CLAIM_TYPE: Record<number, string> = {
  1: "New Claim (FNOL)",
  2: "Supplementary Claim",
  3: "Reserve Adjustment",
  4: "Coverage Inquiry",
  5: "Reopened Claim",
};

export const DOC_STATUS: Record<number, string> = {
  1: "Provided",
  2: "Missing",
  3: "Unclear",
};

export const CONFIDENCE: Record<number, string> = {
  1: "High",
  2: "Medium",
  3: "Low",
};

export function asNum(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = typeof v === "number" ? v : parseInt(String(v), 10);
  return Number.isNaN(n) ? undefined : n;
}

// ---------------------------------------------------------------- live data

export async function loadClaims(): Promise<{ claims: Claim[]; live: boolean }> {
  try {
    const res = await Uw_submissionsService.getAll();
    const claims = (res?.data ?? []) as Claim[];
    if (claims.length === 0) return { claims: SAMPLE_CLAIMS, live: true };
    return { claims, live: true };
  } catch {
    return { claims: SAMPLE_CLAIMS, live: false };
  }
}

export async function loadDocuments(claimId: string): Promise<ClaimDocument[]> {
  try {
    const res = await Uw_submissiondocumentsService.getAll({
      filter: `_uw_submissionid_value eq ${claimId}`,
    });
    return (res?.data ?? []) as ClaimDocument[];
  } catch {
    return SAMPLE_DOCS[claimId] ?? [];
  }
}

export async function loadClassifications(claimId: string): Promise<LossClassification[]> {
  try {
    const res = await Uw_classificationmatchsService.getAll({
      filter: `_uw_submissionid_value eq ${claimId}`,
    });
    return (res?.data ?? []) as LossClassification[];
  } catch {
    return SAMPLE_CLASS[claimId] ?? [];
  }
}

export async function setTriageStatus(claimId: string, status: number): Promise<boolean> {
  try {
    await Uw_submissionsService.update(claimId, { uw_triagestatus: status } as Partial<Claim>);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------- sample data

/** Builds a typed sample record from a loose literal (system fields omitted). */
function mk<T>(o: Record<string, unknown>): T {
  return o as unknown as T;
}

export const SAMPLE_CLAIMS: Claim[] = [
  mk<Claim>({
    uw_submissionid: "s1",
    uw_caseid: "CLM-20260617-1A2B3C4D",
    uw_insuredname: "Bayerische Möbelwerke GmbH",
    uw_region: "Bayern",
    uw_language: "DE",
    uw_classification: "Fire & Explosion",
    uw_producttype: "Property Damage",
    uw_complexity: 3,
    uw_submissionstatus: 1,
    uw_triagestatus: 1,
    uw_assignedunderwriter: "Mario Rogers",
    uw_underwriteremail: "MarioR@M365CPI77548680.OnMicrosoft.com",
    uw_acsquote: "N/A",
    uw_executivesummary:
      "Fire in the finishing hall at the München plant. Estimated loss €4.2M. Complex due to business interruption exposure and multiple affected lines.",
    uw_missingdocuments: "Building inspection report; loss-of-profits worksheet",
    uw_missingdocscount: "2",
    uw_sendername: "Klaus Bauer",
    uw_senderemail: "k.bauer@bay-moebel.de",
    uw_emailsubject: "Schadenmeldung – Brand Produktionshalle München (Police BM-4471)",
    uw_emailreceived: "2026-06-17T08:42:00Z",
    uw_emailbody:
      "Sehr geehrte Damen und Herren,\n\nhiermit melden wir einen Brandschaden in unserer Finishing-Halle am Standort München. Das Feuer brach am 16.06. gegen 23:10 Uhr aus; die Halle sowie mehrere Fertigungslinien sind betroffen. Der Betrieb ist derzeit unterbrochen.\n\nErste Schätzung des Sachschadens: ca. 4,2 Mio. EUR, zzgl. Betriebsunterbrechung.\n\nBeigefügt finden Sie die Schadenanzeige sowie erste Fotos. Den Gutachterbericht und die Aufstellung des Ertragsausfalls reichen wir nach.\n\nMit freundlichen Grüßen\nKlaus Bauer\nLeiter Facility, Bayerische Möbelwerke GmbH",
    uw_assignmentreasoning:
      "Mario is the senior Bayern adjuster with capacity and German/English fluency.",
    statecode: "Active",
  }),
  mk<Claim>({
    uw_submissionid: "s2",
    uw_caseid: "CLM-20260617-5E6F7A8B",
    uw_insuredname: "Rhein Logistik AG",
    uw_region: "Nordrhein-Westfalen",
    uw_language: "DE",
    uw_classification: "Escape of Water",
    uw_producttype: "Fast-Track",
    uw_complexity: 1,
    uw_submissionstatus: 1,
    uw_triagestatus: 5,
    uw_assignedunderwriter: "Lisa Taylor",
    uw_underwriteremail: "LisaT@M365CPI77548680.OnMicrosoft.com",
    uw_acsquote: "DRAFT reserve €8,750 (base 0.85 × €10,000 × 1.05 NRW). Requires adjuster review.",
    uw_executivesummary:
      "Burst pipe flooded a Köln warehouse. Fast-track, all required fields present. Draft reserve proposed.",
    uw_missingdocuments: "",
    uw_missingdocscount: "0",
    uw_sendername: "Petra Schmidt",
    uw_senderemail: "p.schmidt@rhein-log.de",
    uw_emailsubject: "Wasserschaden Lager Köln – Rohrbruch (Police RL-2208)",
    uw_emailreceived: "2026-06-17T06:15:00Z",
    uw_emailbody:
      "Guten Morgen,\n\nin unserem Lager in Köln ist heute Nacht ein Rohr geplatzt. Das Wasser hat einen Teil der Lagerfläche überflutet. Die Reparatur ist bereits beauftragt.\n\nAlle erforderlichen Unterlagen (Schadenanzeige und Kostenvoranschlag) sind angehängt.\n\nBitte bestätigen Sie den Eingang.\n\nViele Grüße\nPetra Schmidt\nRhein Logistik AG",
    uw_assignmentreasoning: "Lisa covers NRW and had the lowest open caseload.",
    statecode: "Active",
  }),
  mk<Claim>({
    uw_submissionid: "s3",
    uw_caseid: "CLM-20260616-9C0D1E2F",
    uw_insuredname: "Frankfurt Tech Park Ltd.",
    uw_region: "Hessen",
    uw_language: "EN",
    uw_classification: "Third-Party Property Damage",
    uw_producttype: "Liability",
    uw_complexity: 2,
    uw_submissionstatus: 2,
    uw_triagestatus: 2,
    uw_assignedunderwriter: "Sydney Mattos",
    uw_underwriteremail: "SydneyM@M365CPI77548680.OnMicrosoft.com",
    uw_acsquote: "N/A",
    uw_executivesummary:
      "Crane contact damaged a neighbouring façade in Frankfurt. Standard liability claim, third-party demand attached.",
    uw_missingdocuments: "Witness statements",
    uw_missingdocscount: "1",
    uw_sendername: "Anna Becker",
    uw_senderemail: "a.becker@ftpark.com",
    uw_emailsubject: "Liability claim – crane damage to neighbouring façade (Policy FTP-9001)",
    uw_emailreceived: "2026-06-16T14:03:00Z",
    uw_emailbody:
      "Hello,\n\nWe are reporting a third-party liability claim. During construction work on 15 June, our crane made contact with the façade of the adjacent building, causing visible damage. The neighbouring owner has issued a demand letter (attached).\n\nWe are still collecting witness statements and will forward them once available.\n\nPlease let us know the next steps.\n\nBest regards,\nAnna Becker\nFrankfurt Tech Park Ltd.",
    uw_assignmentreasoning: "Sydney handles Hessen liability matters.",
    statecode: "Active",
  }),
];

const SAMPLE_DOCS: Record<string, ClaimDocument[]> = {
  s1: [
    mk<ClaimDocument>({ uw_submissiondocumentid: "d1", uw_name: "Loss Notification (FNOL)", uw_documenttype: "Notification", uw_status: 1, uw_submissionid: "s1" }),
    mk<ClaimDocument>({ uw_submissiondocumentid: "d2", uw_name: "Damage Photos", uw_documenttype: "Evidence", uw_status: 1, uw_submissionid: "s1" }),
    mk<ClaimDocument>({ uw_submissiondocumentid: "d3", uw_name: "Building Inspection Report", uw_documenttype: "Report", uw_status: 2, uw_submissionid: "s1" }),
    mk<ClaimDocument>({ uw_submissiondocumentid: "d4", uw_name: "Loss-of-Profits Worksheet", uw_documenttype: "Financial", uw_status: 2, uw_submissionid: "s1" }),
  ],
  s2: [
    mk<ClaimDocument>({ uw_submissiondocumentid: "d5", uw_name: "Loss Notification (FNOL)", uw_documenttype: "Notification", uw_status: 1, uw_submissionid: "s2" }),
    mk<ClaimDocument>({ uw_submissiondocumentid: "d6", uw_name: "Repair Estimate", uw_documenttype: "Financial", uw_status: 1, uw_submissionid: "s2" }),
  ],
  s3: [
    mk<ClaimDocument>({ uw_submissiondocumentid: "d7", uw_name: "Third-Party Demand Letter", uw_documenttype: "Legal", uw_status: 1, uw_submissionid: "s3" }),
    mk<ClaimDocument>({ uw_submissiondocumentid: "d8", uw_name: "Witness Statements", uw_documenttype: "Evidence", uw_status: 2, uw_submissionid: "s3" }),
  ],
};

const SAMPLE_CLASS: Record<string, LossClassification[]> = {
  s1: [
    mk<LossClassification>({ uw_classificationmatchid: "c1", uw_naicscode: "FIRE-100", uw_title: "Fire & Explosion", uw_confidence: 1, uw_isprimary: 1, uw_reasoning: "Fire originating in finishing hall", uw_submissionid: "s1" }),
    mk<LossClassification>({ uw_classificationmatchid: "c2", uw_naicscode: "BI-500", uw_title: "Business Interruption", uw_confidence: 2, uw_isprimary: 0, uw_reasoning: "Production halted across lines", uw_submissionid: "s1" }),
  ],
  s2: [
    mk<LossClassification>({ uw_classificationmatchid: "c3", uw_naicscode: "WATER-200", uw_title: "Escape of Water", uw_confidence: 1, uw_isprimary: 1, uw_reasoning: "Burst pipe flooding", uw_submissionid: "s2" }),
  ],
  s3: [
    mk<LossClassification>({ uw_classificationmatchid: "c4", uw_naicscode: "LIAB-610", uw_title: "Third-Party Property Damage", uw_confidence: 1, uw_isprimary: 1, uw_reasoning: "Crane contact with neighbouring façade", uw_submissionid: "s3" }),
  ],
};


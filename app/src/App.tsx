import { useEffect, useMemo, useState } from "react";
import {
  loadClaims,
  loadDocuments,
  loadClassifications,
  setTriageStatus,
  asNum,
  TRIAGE_STATUS,
  COMPLEXITY,
  CLAIM_TYPE,
  DOC_STATUS,
  CONFIDENCE,
  type Claim,
  type ClaimDocument,
  type LossClassification,
} from "./claimsData";

const TRIAGE_OPTIONS = [1, 2, 3, 4, 5, 6];

function StatusPill({ kind, label }: { kind: string; label: string }) {
  return <span className={`pill pill-${kind}`}>{label}</span>;
}

export default function App() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [docs, setDocs] = useState<ClaimDocument[]>([]);
  const [classes, setClasses] = useState<LossClassification[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<number | "all">("all");

  useEffect(() => {
    (async () => {
      const { claims, live } = await loadClaims();
      setClaims(claims);
      setLive(live);
      setLoading(false);
      if (claims[0]) setSelectedId(claims[0].uw_submissionid);
    })();
  }, []);

  const selected = useMemo(
    () => claims.find((c) => c.uw_submissionid === selectedId) ?? null,
    [claims, selectedId]
  );

  useEffect(() => {
    if (!selectedId) return;
    (async () => {
      setDocs(await loadDocuments(selectedId));
      setClasses(await loadClassifications(selectedId));
    })();
  }, [selectedId]);

  const filtered = useMemo(() => {
    return claims.filter((c) => {
      const q = query.trim().toLowerCase();
      const matchesQ =
        !q ||
        [c.uw_caseid, c.uw_insuredname, c.uw_region, c.uw_classification]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
      const st = asNum(c.uw_triagestatus);
      const matchesS = statusFilter === "all" || st === statusFilter;
      return matchesQ && matchesS;
    });
  }, [claims, query, statusFilter]);

  const counts = useMemo(() => {
    const open = claims.filter((c) => {
      const s = asNum(c.uw_triagestatus);
      return s !== 6;
    }).length;
    const complex = claims.filter((c) => asNum(c.uw_complexity) === 3).length;
    const missing = claims.filter((c) => (asNum(c.uw_missingdocscount) ?? 0) > 0).length;
    return { total: claims.length, open, complex, missing };
  }, [claims]);

  async function onSetStatus(status: number) {
    if (!selected) return;
    const ok = await setTriageStatus(selected.uw_submissionid, status);
    setClaims((prev) =>
      prev.map((c) =>
        c.uw_submissionid === selected.uw_submissionid
          ? ({ ...c, uw_triagestatus: status as never } as Claim)
          : c
      )
    );
    if (!ok && live) {
      // optimistic anyway; live update may have failed silently
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">CR</div>
          <div>
            <div className="brand-title">Contoso Reinsurance — Claims</div>
            <div className="brand-sub">Adjuster triage workbench</div>
          </div>
        </div>
        <div className={`data-badge ${live ? "data-live" : "data-sample"}`}>
          {live ? "Dataverse" : "Sample data"}
        </div>
      </header>

      <section className="kpis">
        <div className="kpi"><div className="kpi-num">{counts.total}</div><div className="kpi-label">Claims</div></div>
        <div className="kpi"><div className="kpi-num">{counts.open}</div><div className="kpi-label">Open</div></div>
        <div className="kpi"><div className="kpi-num">{counts.complex}</div><div className="kpi-label">Complex</div></div>
        <div className="kpi"><div className="kpi-num">{counts.missing}</div><div className="kpi-label">Missing docs</div></div>
      </section>

      <div className="layout">
        <aside className="list-pane">
          <div className="list-controls">
            <input
              className="search"
              placeholder="Search case, insured, region…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              className="filter"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value === "all" ? "all" : Number(e.target.value))
              }
            >
              <option value="all">All statuses</option>
              {TRIAGE_OPTIONS.map((s) => (
                <option key={s} value={s}>{TRIAGE_STATUS[s]}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="empty">Loading claims…</div>
          ) : filtered.length === 0 ? (
            <div className="empty">No claims match.</div>
          ) : (
            <ul className="claim-list">
              {filtered.map((c) => {
                const st = asNum(c.uw_triagestatus);
                const cx = asNum(c.uw_complexity);
                return (
                  <li
                    key={c.uw_submissionid}
                    className={`claim-item ${c.uw_submissionid === selectedId ? "active" : ""}`}
                    onClick={() => setSelectedId(c.uw_submissionid)}
                  >
                    <div className="claim-item-top">
                      <span className="case-id">{c.uw_caseid}</span>
                      {st ? <StatusPill kind={`s${st}`} label={TRIAGE_STATUS[st]} /> : null}
                    </div>
                    <div className="claim-item-name">{c.uw_insuredname}</div>
                    <div className="claim-item-meta">
                      <span>📍 {c.uw_region}</span>
                      <span>🌐 {c.uw_language}</span>
                      {cx ? <span>⚙ {COMPLEXITY[cx]}</span> : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <main className="detail-pane">
          {!selected ? (
            <div className="empty">Select a claim.</div>
          ) : (
            <ClaimDetail
              claim={selected}
              docs={docs}
              classes={classes}
              onSetStatus={onSetStatus}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function ClaimDetail({
  claim,
  docs,
  classes,
  onSetStatus,
}: {
  claim: Claim;
  docs: ClaimDocument[];
  classes: LossClassification[];
  onSetStatus: (s: number) => void;
}) {
  const st = asNum(claim.uw_triagestatus);
  const cx = asNum(claim.uw_complexity);
  const ct = asNum(claim.uw_submissionstatus);
  const missingCount = asNum(claim.uw_missingdocscount) ?? 0;

  return (
    <div className="detail">
      <div className="detail-head">
        <div>
          <h1>{claim.uw_insuredname}</h1>
          <div className="detail-sub">
            <span className="case-id">{claim.uw_caseid}</span>
            <span>📍 {claim.uw_region}</span>
            <span>🌐 {claim.uw_language}</span>
            {ct ? <span>🗂 {CLAIM_TYPE[ct]}</span> : null}
            {cx ? <StatusPill kind={cx === 3 ? "complex" : cx === 1 ? "simple" : "standard"} label={COMPLEXITY[cx]} /> : null}
          </div>
        </div>
        {st ? <StatusPill kind={`s${st}`} label={TRIAGE_STATUS[st]} /> : null}
      </div>

      <div className="triage-actions">
        {TRIAGE_OPTIONS.map((s) => (
          <button
            key={s}
            className={`triage-btn ${st === s ? "current" : ""}`}
            onClick={() => onSetStatus(s)}
            disabled={st === s}
          >
            {TRIAGE_STATUS[s]}
          </button>
        ))}
      </div>

      <div className="cards">
        <div className="card">
          <h3>Executive summary</h3>
          <p>{claim.uw_executivesummary || "—"}</p>
        </div>

        <div className="card">
          <h3>Assignment</h3>
          <p className="kv"><b>Adjuster</b> {claim.uw_assignedunderwriter || "—"}</p>
          <p className="kv"><b>Email</b> {claim.uw_underwriteremail || "—"}</p>
          <p className="kv"><b>Reasoning</b> {claim.uw_assignmentreasoning || "—"}</p>
        </div>

        <div className="card">
          <h3>Fast-Track reserve</h3>
          <p>{claim.uw_acsquote && claim.uw_acsquote !== "N/A" ? claim.uw_acsquote : "Not applicable for this claim."}</p>
        </div>

        <div className="card">
          <h3>Notifier</h3>
          <p className="kv"><b>Name</b> {claim.uw_sendername || "—"}</p>
          <p className="kv"><b>Email</b> {claim.uw_senderemail || "—"}</p>
        </div>
      </div>

      <div className="card">
        <h3>Documents {missingCount > 0 ? <span className="warn-tag">{missingCount} missing</span> : null}</h3>
        {docs.length === 0 ? (
          <p className="muted">No document rows.</p>
        ) : (
          <table className="grid">
            <thead><tr><th>Document</th><th>Type</th><th>Status</th></tr></thead>
            <tbody>
              {docs.map((d) => {
                const s = asNum(d.uw_status);
                return (
                  <tr key={d.uw_submissiondocumentid}>
                    <td>{d.uw_name}</td>
                    <td>{d.uw_documenttype || "—"}</td>
                    <td>{s ? <StatusPill kind={`doc${s}`} label={DOC_STATUS[s]} /> : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3>Cause of loss</h3>
        {classes.length === 0 ? (
          <p className="muted">No classification rows.</p>
        ) : (
          <table className="grid">
            <thead><tr><th>Code</th><th>Title</th><th>Confidence</th><th>Primary</th><th>Reasoning</th></tr></thead>
            <tbody>
              {classes.map((c) => {
                const conf = asNum(c.uw_confidence);
                const primary = asNum(c.uw_isprimary) === 1;
                return (
                  <tr key={c.uw_classificationmatchid}>
                    <td><code>{c.uw_naicscode}</code></td>
                    <td>{c.uw_title || "—"}</td>
                    <td>{conf ? CONFIDENCE[conf] : "—"}</td>
                    <td>{primary ? <span className="pill pill-primary">Primary</span> : ""}</td>
                    <td className="muted">{c.uw_reasoning || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {claim.uw_reporturl ? (
        <a className="report-link" href={claim.uw_reporturl} target="_blank" rel="noreferrer">
          📄 Open full assessment report
        </a>
      ) : null}
    </div>
  );
}

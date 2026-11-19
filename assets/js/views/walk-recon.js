// Walkthrough steps 7-8: statements and reconciliation, CBQ operations console.
import { esc, pill, surface, note, btn, table, fmt, kpis, section, int, illustrative } from "../ui.js";
import { withTrace, withAudit, withDone, pipe } from "../state.js";
import { STATEMENT_LINES, RECON_RULES, BATCH_ID } from "../data/payments.js";
import { TENANTS } from "../data/customers.js";
import { VOLUME_14D, LATENCY_24H, CONNECTOR_VERSIONS, INCIDENTS } from "../data/ops.js";
import { stackedBars, lines } from "../charts.js";
import { stepHead, waitFor } from "./walk-common.js";

const resKind = (r) => (r === "Matched" ? "ok" : r === "Exception" ? "warn" : r === "Resolved" ? "ok" : "neutral");

function recon(s) {
  if (s.progress < 5) return stepHead(s, "recon", "Statements in, reconciliation done by rules", "", false) + waitFor("Finish status updates in step 6 first.", "status", "Go to step 6");
  const linesNow = STATEMENT_LINES.map((l) => (l.exKey && s.exceptions[l.exKey] ? { ...l, res: "Resolved", how: `${l.how} · rule accepted by K.RAHMAN` } : l));
  const matched = linesNow.filter((l) => l.res === "Matched").length;
  const open = linesNow.filter((l) => l.res === "Exception").length;
  const credits = linesNow.filter((l) => l.res === "Unmatched").length;
  const tbl = table([
    { h: "Date", k: "d" }, { h: "Description", k: "desc" },
    { h: "Amount (QAR)", num: true, r: (l) => `<span style="color:${l.amt > 0 ? "var(--success)" : "inherit"}">${l.amt > 0 ? "+" : ""}${esc(fmt(l.amt))}</span>` },
    { h: "Bank reference", r: (l) => `<span class="ref">${esc(l.ref)}</span>` },
    { h: "Result", r: (l) => (s.recon ? pill(l.res, resKind(l.res)) : pill("Imported", "info")) },
    { h: "How", r: (l) => (s.recon ? `<span class="muted">${esc(l.how)}</span>${l.res === "Exception" ? ` ${btn("Accept suggestion", "resolveEx", { kind: "sm", data: { k: l.exKey } })}` : ""}` : "") },
  ], linesNow);
  const body = `<div class="row" style="margin-bottom:12px"><span>Statement for <span class="ref">QA58 CBQA … 5566 7</span>, 16.11.2026 · 13 entries</span><span class="sp"></span>
      ${s.stmt ? pill("camt.053.001.08 file ready for SAP", "ok", "file-check") : btn("Retrieve statement from CBQ", "stmt", { kind: "primary", ic: "download" })}
      ${s.stmt && !s.recon ? btn("Run reconciliation", "recon", { kind: "primary", ic: "scale" }) : ""}</div>
    ${s.stmt ? tbl : `<p class="muted">Retrieve today’s statement to continue.</p>`}`;
  const rules = table([{ h: "Rule", k: 0 }, { h: "Logic", k: 1 }, { h: "Outcome", k: 2 }], RECON_RULES.map((r) => ({ 0: r[0], 1: r[1], 2: r[2] })));
  return stepHead(s, "recon", "Statements in, reconciliation done by rules",
    "The platform pulls the statement from CBQ and matches it against payments it sent. The statement also goes to SAP as an ISO 20022 camt.053 file for standard bank statement processing.", s.recon) +
    (s.recon ? kpis([
      { label: "Auto-matched", value: `${matched} of 10`, ic: "circle-check", caption: "Outgoing payments" },
      { label: "Exceptions open", value: String(open), ic: "triangle-alert", caption: "Bank charges" },
      { label: "Credits to SAP", value: String(credits), ic: "arrow-down-left", caption: "For AR clearing" },
      { label: "Match rate", value: `${Math.round((matched / 10) * 100)}%`, ic: "percent", caption: "Target ≥ 95%" },
    ]) : "") +
    `<div data-tour="recon">${surface({ product: "CBQ ERP Connect", screen: "Platform reconciliation", chip: "K.RAHMAN · viewer", body })}</div>
     <div style="margin-top:24px">${section({ title: "Matching rules, applied in order", ic: "list-ordered", body: rules })}</div>` +
    note("In SAP the customer imports the camt.053 file with standard Electronic Bank Statement processing (FF_5 / FEBAN) and its own posting rules. Innoval can help configure this as an optional service.", "info");
}

function ops(s) {
  const sentN = s.sent ? s.pays.filter((p) => p.sel).length : 0;
  const tenants = TENANTS.map((t, i) => (i === 0 ? { ...t, pays: sentN, stp: sentN ? 0.82 : 0, status: s.offboard ? "Offboarded" : s.testOk ? "Live" : "Pending" } : t));
  const stKind = (st) => (st === "Live" ? "ok" : st === "Offboarded" ? "neutral" : st === "Pending" ? "info" : "warn");
  const tenantTbl = table([
    { h: "Tenant", k: "name" }, { h: "ERP", k: "erp" }, { h: "Connector", r: (t) => `<span class="ref">${esc(t.ver)}</span>` },
    { h: "Payments (7d)", num: true, r: (t) => esc(int(t.pays)) },
    { h: "STP rate", num: true, r: (t) => (t.stp ? `${Math.round(t.stp * 100)}%` : "-") },
    { h: "Live since (after go-live)", k: "since" }, { h: "Heartbeat", r: (t) => pill(t.status, stKind(t.status)) },
  ], tenants);
  const auditTbl = table([{ h: "Time", r: (a) => `<span class="ref">${esc(a.t)}</span>` }, { h: "Actor", k: "actor" }, { h: "Action", k: "action" }],
    s.audit.slice(0, 10), { empty: "Actions you take in steps 1–7 appear here." });
  const verTbl = table([{ h: "Version", r: (v) => `<span class="ref">${esc(v.ver)}</span>` }, { h: "Released", k: "released" }, { h: "Tenants", k: "tenants", num: true }, { h: "Notes", k: "notes" }, { h: "Status", r: (v) => pill(v.status[0], v.status[1]) }], CONNECTOR_VERSIONS);
  const incTbl = table([{ h: "Incident", r: (x) => `<span class="ref">${esc(x.id)}</span>` }, { h: "When", k: "when" }, { h: "Sev", k: "sev" }, { h: "What", k: "what" }, { h: "State", r: (x) => pill(x.state[0], x.state[1]) }], INCIDENTS);
  return stepHead(s, "ops", "CBQ sees and controls the whole service",
    "Health, volumes, connector versions, incidents and a complete audit trail in one console. Offboarding revokes certificates and tokens at once.", true) +
    illustrative() +
    kpis([
      { label: "Availability, 30 days", value: "99.97%", ic: "activity", delta: "Target 99.5%", dir: "up" },
      { label: "Payments today", value: int(1286 + sentN), ic: "send", delta: "+8.4% vs last week", dir: "up", caption: "All tenants" },
      { label: "CBQ API p95", value: "410 ms", ic: "gauge", delta: "-35 ms vs last week", dir: "up" },
      { label: "Connected tenants", value: String(tenants.filter((t) => !["Pending", "Offboarded"].includes(t.status)).length), ic: "building-2", caption: `${tenants.filter((t) => t.status === "Live").length} healthy · 2 upgrades due · 1 heartbeat late` },
      { label: "Open incidents", value: "1", ic: "siren", caption: "P3 · monitoring" },
    ]) +
    `<div class="grid g2" data-tour="ops-charts">
      ${section({ title: "Payments by day, all tenants", ic: "bar-chart-3", body: stackedBars(VOLUME_14D, [{ key: "stp", name: "STP" }, { key: "nonStp", name: "CBQ approval", ci: 1 }, { key: "rejected", name: "Rejected", ci: 4 }]), caption: "Platform metrics · illustrative, year 1 after go-live" })}
      ${section({ title: "CBQ API latency, last 24 h (ms)", ic: "timer", body: lines(LATENCY_24H, [{ key: "p95", name: "p95" }, { key: "p50", name: "p50" }]), caption: "OpenTelemetry · illustrative, year 1 after go-live" })}
    </div>
    <div style="margin-top:12px">${section({ title: "Tenants and connectors", ic: "building-2", body: tenantTbl })}</div>
    <div class="grid g2" style="margin-top:12px">
      ${section({ title: "Connector versions", ic: "git-branch", body: verTbl })}
      ${section({ title: "Incidents", ic: "siren", body: incTbl })}
    </div>
    <div style="margin-top:12px">${section({ title: "Audit trail of this demo", ic: "scroll-text", body: auditTbl,
      right: s.offboard ? pill("Access revoked, data export ready", "ok") : btn("Offboard Al Noor Trading", "offboard", { kind: "danger", ic: "user-x" }),
      caption: "Audit events are hash-chained, tamper-evident and forwarded to CBQ SIEM." })}</div>`;
}

export const pages = [
  { id: "recon", render: recon, persona: "viewer" },
  { id: "ops", render: ops, persona: "ops" },
];

export const actions = {
  stmt: (s) => pipe({ ...s, stmt: true },
    (x) => withAudit(x, "Platform", "Retrieved statement 16.11.2026"),
    (x) => withTrace(x, "CBQ API adapter → CBQ", "GET statement, QA58…5566 7, 16.11.2026", "13 entries; kept only for the reconciliation window", [2, 4]),
    (x) => withTrace(x, "Account services", "camt.053 file prepared for SAP import", "Customer imports with FF_5 / FEBAN", [2, 0])),
  recon: (s) => pipe({ ...s, recon: true },
    (x) => withDone(x, "recon"),
    (x) => withAudit(x, "Platform", "Reconciled 13 statement lines"),
    (x) => withTrace(x, "Reconciliation engine", "10 matched, 1 exception, 2 credits passed to SAP", `Rules in order: reference, then amount + date + beneficiary · batch ${BATCH_ID}`, [2, 3])),
  resolveEx: (s, d) => pipe({ ...s, exceptions: { ...s.exceptions, [d.k]: true } },
    (x) => withAudit(x, "K.RAHMAN (viewer → poster)", "Accepted suggested posting rule for bank charge"),
    (x) => withTrace(x, "Reconciliation engine → SAP", "Exception closed with a suggested posting rule", "Customer’s own EBS posting rules post it in SAP", [2, 0])),
  offboard: (s) => pipe({ ...s, offboard: true },
    (x) => withDone(x, "ops"),
    (x) => withAudit(x, "s.hamad (CBQ officer)", "Offboarded Al Noor Trading"),
    (x) => withTrace(x, "Admin portal → Platform", "Offboarding: certificate revoked, tokens invalidated", "Final reconciliation, data export prepared, deletion scheduled per CBQ policy", [2, 4])),
};

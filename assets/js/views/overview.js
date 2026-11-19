// Overview: proposed solution, key capabilities, agenda.
import { esc, icon, pill, section, table, btn } from "../ui.js";

const PARTS = [
  ["layout-panel-left", "Portals", "Onboarding and administration", "Registration, eligibility, account linkage, approvals, subscriptions, support and offboarding."],
  ["network", "Banking hub", "All banking logic", "Canonical API, payment orchestration, status, reconciliation, multi-tenancy, audit. Node.js on CBQ cloud."],
  ["server", "Phase 1 connector", "SAP S/4HANA and ECC", "ABAP add-on with screens inside SAP for payments, approvals, status and balance."],
  ["blocks", "Framework", "Connector SDK and test kit", "Canonical API spec, auth library, reference client and certification kit for every further ERP."],
];

const CAPS = [
  ["Onboarding and lifecycle", "Online registration, CBQ eligibility checks, dual-controlled approval, connector download, offboarding", "Phase 1", "onboard"],
  ["Balance and statements", "Live balance in the ERP; statements retrieved from CBQ, camt.053 for SAP", "Phase 1", "activate"],
  ["Domestic payments", "Single and bulk, STP and non-STP, maker-checker, CBQ OTP and Net Banking approval", "Phase 1", "pay"],
  ["Status and reconciliation", "Status and bank reference written back; rule-based matching with exception queues", "Phase 1", "status"],
  ["Monitoring and audit", "Operations console, SIEM-forwarded audit, one correlation ID end to end", "Phase 1", "ops"],
  ["Further services", "Alerts, name verification, bill payment, international, WPS payroll", "Priced option", "why"],
];

const AGENDA = [
  ["0–5", "Introductions and objectives", "Delivery lead", "overview"],
  ["5–15", "Proposed solution and key capabilities", "Solution architect", "overview"],
  ["15–40", "End-to-end functional walkthrough, live demo", "Solution architect, SAP lead", "onboard"],
  ["40–55", "Architecture and integration approach", "Platform lead", "architecture"],
  ["55–65", "Security and deployment considerations", "Platform lead", "security"],
  ["65–75", "Implementation approach and timelines", "Delivery lead", "plan"],
  ["75–90", "Differentiators, Q&A and clarifications", "All", "why"],
];

function overview() {
  const hero = `<section class="glass hero" data-tour="hero">
    <div class="eyebrow">Solution demo · The Commercial Bank (P.S.Q.C.)</div>
    <h1 class="big">Corporate Connected Banking from inside the customer’s ERP, with every CBQ control intact</h1>
    <p class="lead">Customers pay, check balances and reconcile without leaving SAP. CBQ keeps full control of every payment. One platform on CBQ’s cloud in Qatar, one canonical API for every ERP, and CBQ’s own approvals, limits and security reused rather than rebuilt.</p>
    <div class="row" style="margin-top:24px">
      <a class="btn primary" href="#onboard">${icon("play")}Start the walkthrough</a>
      ${btn("Guided presenter tour", "startTour", { ic: "compass" })}
      <a class="btn" href="#architecture">${icon("network")}See the architecture</a></div>
    <div class="meta">
      <div><b>All 18</b><span>Mandatory requirements addressed, as set out in the compliance matrix (proposal Section 18)</span></div>
      <div><b>9 months</b><span>Phase 1 to hypercare exit</span></div>
      <div><b>99.5%</b><span>Monthly availability</span></div>
      <div><b>Qatar</b><span>Data residency, CBQ cloud</span></div>
    </div></section>`;

  const asked = `<div class="grid g2">
    ${section({ title: "What CBQ asked for", ic: "file-text", body: `<p class="muted">An ERP Connector Platform (RFP V.10.7) so corporate customers can pay, check balances and reconcile from their ERP, starting with SAP, with a path to Tally, Zoho Books, Odoo and Dynamics, under CBQ’s identity, authorisation and security controls, hosted in Qatar.</p>` })}
    ${section({ title: "Our answer", ic: "lightbulb", body: `<ul class="checks">
      <li><span class="ic ok">${icon("check")}</span>Hub and spoke: thin ERP connectors, all banking logic in one platform</li>
      <li><span class="ic ok">${icon("check")}</span>One entry point (CBQ gateway) and one exit point (CBQ API adapter)</li>
      <li><span class="ic ok">${icon("check")}</span>CBQ limits, mandates, OTP, PKI, SIEM and PAM reused, never duplicated</li>
      <li><span class="ic ok">${icon("check")}</span>Built on Innoval’s SAP banking add-on, live with two large Indian banks</li></ul>` })}
  </div>`;

  const parts = `<div class="grid g4">${PARTS.map(([ic, k, t, d]) => `<div class="glass card hover"><div class="kicker">${esc(k)}</div><h3>${icon(ic)}${esc(t)}</h3><p>${esc(d)}</p></div>`).join("")}</div>
    <p class="caption" style="margin-top:10px">Connectors stay thin. A change to a CBQ API is made once, in the hub, never in each ERP.</p>`;

  const caps = table([
    { h: "Capability", r: (c) => `<b>${esc(c[0])}</b>` }, { h: "What it covers", r: (c) => `<span class="muted">${esc(c[1])}</span>` },
    { h: "Scope", r: (c) => pill(c[2], c[2] === "Phase 1" ? "gold" : "neutral", c[2] === "Phase 1" ? "check" : "tag") },
    { h: "", r: (c) => `<a href="#${esc(c[3])}" class="btn sm ghost">See it${icon("arrow-right")}</a>` },
  ], CAPS);

  const agenda = table([
    { h: "Minutes", r: (a) => `<span class="ref">${esc(a[0])}</span>` }, { h: "Topic", r: (a) => `<b>${esc(a[1])}</b>` },
    { h: "Presenter", r: (a) => `<span class="muted">[${esc(a[2])}]</span>` },
    { h: "", r: (a) => `<a href="#${esc(a[3])}" class="btn sm ghost">Open${icon("arrow-right")}</a>` },
  ], AGENDA);

  return `${hero}<div class="stack" style="margin-top:24px">
    ${asked}
    ${section({ title: "Four parts, one platform", ic: "boxes", body: parts })}
    <div data-tour="caps">${section({ title: "Key capabilities", ic: "list-checks", body: caps, caption: "All 18 mandatory requirements addressed. Compliance levels as in the compliance matrix, proposal Section 18." })}</div>
    ${section({ title: "Agenda for 90 minutes", ic: "calendar-clock", body: agenda, caption: "Follows the six areas requested in CBQ’s invitation." })}
  </div>`;
}

export const pages = [{ id: "overview", render: overview }];
export const actions = {};

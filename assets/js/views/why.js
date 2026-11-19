// Key differentiators of the proposal.
import { esc, icon, section, table, pageHead } from "../ui.js";

const DIFFS = [
  ["rocket", "Not a greenfield build", "The hub-and-spoke core already connects SAP to bank APIs in production at two of India’s largest private-sector banks."],
  ["shield-check", "CBQ stays in control", "CBQ’s identity, limits, OTP, Net Banking approval, PKI, SIEM and PAM are reused. The platform never makes an approval decision."],
  ["target", "One place to change", "Banking logic lives only in the platform; connectors stay thin. A CBQ API change touches one adapter, not every ERP."],
  ["map", "An honest ERP roadmap", "SAP S/4HANA and ECC in Phase 1. Every other ERP through a certified framework with fixed unit prices, ordered as demand appears."],
  ["git-commit-horizontal", "Traceable end to end", "One correlation ID from the SAP voucher to the CBQ transaction and the statement line, visible to CBQ operations."],
  ["calendar-check", "Built for five years", "Qatar-resident data, DR under 2 hours, 99.5% availability, new ERP releases supported within 90 days, source escrow."],
];

const REFS = [
  ["Large Indian private-sector bank A", "SAP-to-bank API connectivity for corporate customers", "Production"],
  ["Large Indian private-sector bank B", "SAP banking add-on, payments and statements", "Production"],
  ["SAP add-on delivery", "India, Saudi Arabia, Malaysia, Poland, Ghana", "Delivered"],
];

const CMP = [
  ["Customer experience", "Inside SAP: send, approve, see status and balance", "Export file, upload to Net Banking, re-key status", "Depends on what is built"],
  ["CBQ control", "CBQ limits, OTP, PKI, SIEM, PAM reused", "Partial; files bypass in-ERP controls", "Must be rebuilt and assured"],
  ["Change cost when CBQ API changes", "One adapter", "Each customer’s file mapping", "Every integration"],
  ["New ERP", "2–3 months, certified kit, fixed price", "New file format per customer", "New project each time"],
  ["Time to Phase 1", "9 months to hypercare exit", "Fast to start, slow to scale", "12–18 months typical"],
  ["Traceability", "One correlation ID end to end", "File names and manual logs", "Depends on design"],
];

function why() {
  return pageHead({ eyebrow: "Proposal · key differentiators", title: "Why this approach, and why Innoval",
    desc: "What sets the proposal apart from file-based host-to-host and from a greenfield build." }) +
  `<div class="stack">
    <div class="grid g3" data-tour="why">${DIFFS.map(([ic, t, d]) => `<div class="glass card hover"><h3>${icon(ic)}${esc(t)}</h3><p>${esc(d)}</p></div>`).join("")}</div>
    ${section({ title: "How it compares", ic: "columns-3", body: table([
      { h: "", r: (r) => `<b>${esc(r[0])}</b>` }, { h: "ERP Connector Platform", r: (r) => `<span class="gold">${esc(r[1])}</span>` },
      { h: "File-based host-to-host", r: (r) => `<span class="muted">${esc(r[2])}</span>` }, { h: "Greenfield build", r: (r) => `<span class="muted">${esc(r[3])}</span>` }], CMP) })}
    <div class="grid g2">
      ${section({ title: "References", ic: "award", body: table([{ h: "Where", k: 0 }, { h: "What", r: (r) => `<span class="muted">${esc(r[1])}</span>` }, { h: "Status", k: 2 }], REFS), caption: "Reference contacts shared at shortlisting or clarification stage, subject to client consent." })}
      ${section({ title: "Deep SAP expertise", ic: "server", body: `<ul class="checks">
        <li><span class="ic ok">${icon("check")}</span>ABAP add-ons in own namespace, tested against each new SAP release</li>
        <li><span class="ic ok">${icon("check")}</span>F110, F-53, FF_5 / FEBAN and house bank configuration</li>
        <li><span class="ic ok">${icon("check")}</span>Designed to carry over from ECC to S/4HANA with limited connector change</li>
        <li><span class="ic ok">${icon("check")}</span>RISE private cloud deployments</li></ul>` })}
    </div>
  </div>`;
}

export const pages = [{ id: "why", render: why }];
export const actions = {};

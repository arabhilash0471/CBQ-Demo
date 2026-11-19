// Architecture and integration: trust-zone diagram, sequence, canonical API, patterns.
import { esc, icon, section, table, pageHead, btn } from "../ui.js";
import { withUi } from "../state.js";
import { ENDPOINTS, PATTERNS, SAP_FACTS } from "../data/api.js";

const COMP = {
  sap: ["SAP add-on (customer)", "ABAP add-on in its own namespace, delivered as transports. Screens inside SAP for payments, approvals, status and balance. Per-customer certificate, no stored banking credentials.", "Control: certificate in STRUST, SAP authorisation objects, SAP maker-checker."],
  oth: ["Other ERPs (on order)", "Tally, Zoho Books, Odoo, Microsoft Dynamics and others are built on the same SDK and canonical API, certified with the same test kit, on CBQ’s order.", "Control: same certification kit and VAPT as SAP."],
  gw: ["CBQ API gateway and WAF", "The one entry point. mTLS termination, token validation, rate limits and WAF rules. No data at rest in the DMZ.", "Control: CBQ-owned gateway policies, rate limit 50 req/s per tenant."],
  portal: ["Onboarding and admin portals", "Customer registration, eligibility, account linkage, subscriptions; CBQ approvals, configuration, support and offboarding.", "Control: CBQ SSO + MFA, dual control on approvals and offboarding."],
  hub: ["Connector hub and canonical API", "One versioned REST API (OpenAPI 3) every connector implements. Tenant resolution, connector version enforcement, heartbeat.", "Control: minimum connector version enforced; unknown versions blocked."],
  orch: ["Payment orchestrator", "Validation, idempotency, bulk handling, STP and non-STP routing, and the payment status state machine.", "Control: idempotency keys stored before any CBQ call; no auto-retry after an uncertain outcome."],
  rec: ["Reconciliation engine", "Tiered matching rules, ERP updates and controlled exception queues.", "Control: rules versioned; every manual match audited."],
  adapt: ["CBQ API adapter", "The only component that calls CBQ. Maps canonical to CBQ formats, handles CBQ tokens and error codes. A CBQ API change touches only this.", "Control: one exit point to monitor; CBQ client credentials in vault."],
  obs: ["Audit and monitoring", "Tamper-evident audit to CBQ SIEM; OpenTelemetry traces with one correlation ID on every hop.", "Control: hash-chained audit log, SIEM forwarding in near real time."],
  data: ["Data zone", "PostgreSQL (or CBQ standard), Kafka or RabbitMQ, backups. Encrypted at rest; keys in CBQ HSM and vault; row-level tenant isolation.", "Control: RLS by tenant key, KMS-backed encryption, PITR backups."],
  core: ["CBQ Connected Banking and core services", "Connected Banking APIs, Net Banking and OTP, identity, PKI, SIEM and PAM. Owned and operated by CBQ.", "Control: CBQ remains the system of record for authorisation."],
};

const box = (id, x, y, w, h, label, sel, opt) =>
  `<g class="box${opt ? " opt" : ""}${sel === id ? " sel" : ""}" data-a="archSel" data-c="${id}" tabindex="0" role="button" aria-label="${esc(label)}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/><text x="${x + w / 2}" y="${y + h / 2 + 5}" text-anchor="middle">${esc(label)}</text></g>`;

function diagram(sel, hot) {
  const f = (d, p) => `<path class="flow${hot && p ? " hot" : ""}" d="${d}" marker-end="url(#ah)"/>`;
  return `<svg viewBox="0 0 1000 470" role="img" aria-label="Logical architecture in five trust zones">
    <defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="arrowhead" d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <g class="zonebg"><rect x="10" y="20" width="180" height="430" rx="12"/><text x="24" y="44">Customer</text></g>
    <g class="zonebg"><rect x="205" y="20" width="150" height="430" rx="12"/><text x="219" y="44">CBQ DMZ</text></g>
    <g class="zonebg"><rect x="370" y="20" width="330" height="430" rx="12"/><text x="384" y="44">Platform · CBQ cloud, Qatar</text></g>
    <g class="zonebg"><rect x="715" y="20" width="275" height="430" rx="12"/><text x="729" y="44">CBQ data zone and core</text></g>
    ${box("sap", 25, 110, 150, 58, "SAP S/4HANA / ECC", sel)}
    ${box("oth", 25, 300, 150, 58, "Other ERPs (on order)", sel, true)}
    ${box("gw", 220, 200, 120, 70, "API gateway, WAF", sel)}
    ${box("portal", 385, 70, 300, 46, "Onboarding and admin portals", sel)}
    ${box("hub", 385, 140, 140, 58, "Connector hub", sel)}
    ${box("orch", 545, 140, 140, 58, "Payment orchestrator", sel)}
    ${box("rec", 385, 225, 140, 58, "Reconciliation", sel)}
    ${box("adapt", 545, 225, 140, 58, "CBQ API adapter", sel)}
    ${box("obs", 385, 315, 300, 46, "Audit and monitoring", sel)}
    ${box("data", 730, 315, 245, 58, "Database, broker, vault, HSM", sel)}
    ${box("core", 730, 140, 245, 100, "CBQ Connected Banking APIs", sel)}
    ${f("M175,139 C200,139 200,225 220,225", 1)}${f("M175,329 C200,329 200,250 220,250")}
    ${f("M340,225 C360,225 365,169 385,169", 1)}${f("M525,169 L545,169", 1)}${f("M615,198 L615,225", 1)}
    ${f("M685,254 C710,254 705,200 730,195", 1)}${f("M455,198 L455,225")}${f("M685,338 L730,338")}${f("M340,215 C362,200 365,100 385,95")}
  </svg>`;
}

const ACTORS = ["SAP cockpit", "CBQ gateway", "Hub + orchestrator", "CBQ adapter", "CBQ Connected Banking"];
const MSGS = [
  [0, 1, "POST /v1/payment-batches (mTLS, signed)"], [1, 2, "Token valid, tenant TN-0042"], [2, 2, "Validate, idempotency, STP split"],
  [2, 3, "Submit bulk (canonical)"], [3, 4, "CBQ bulk payment API"], [4, 3, "202 Accepted, approval required", 1],
  [0, 4, "Checker OTP via CBQ"], [4, 3, "Status events, bank references", 1], [3, 2, "Map reason codes", 1], [2, 0, "Write back to SAP document", 1],
];
function sequence() {
  const W = 1000, colW = W / ACTORS.length, x = (i) => colW * i + colW / 2, rowH = 34, top = 60;
  const H = top + MSGS.length * rowH + 20;
  const actors = ACTORS.map((a, i) => `<g class="actor"><rect x="${x(i) - 80}" y="10" width="160" height="32" rx="8"/><text x="${x(i)}" y="31" text-anchor="middle">${esc(a)}</text></g><line class="life-line" x1="${x(i)}" x2="${x(i)}" y1="42" y2="${H}"/>`).join("");
  const msgs = MSGS.map(([a, b, t, ret], k) => {
    const y = top + k * rowH + 14;
    if (a === b) return `<g class="msg"><path d="M${x(a)},${y - 6} h40 v12 h-40" fill="none" stroke="var(--primary)" stroke-width="1.5"/><text x="${x(a) + 48}" y="${y + 4}"><tspan class="n">${k + 1}.</tspan> ${esc(t)}</text></g>`;
    const x1 = x(a), x2 = x(b), mid = (x1 + x2) / 2;
    return `<g class="msg${ret ? " ret" : ""}"><line x1="${x1}" x2="${x2}" y1="${y}" y2="${y}" marker-end="url(#ah2)"/><text x="${mid}" y="${y - 6}" text-anchor="middle"><tspan class="n">${k + 1}.</tspan> ${esc(t)}</text></g>`;
  }).join("");
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Payment sequence diagram"><defs><marker id="ah2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path class="arrowhead" d="M0,0 L10,5 L0,10 z"/></marker></defs>${actors}${msgs}</svg>`;
}

function architecture(s) {
  const sel = s.ui.arch, c = sel ? COMP[sel] : null;
  const ep = ENDPOINTS[s.ui.apiSel] || ENDPOINTS[0];
  const detail = c ? `<h3 class="section-title" style="font-size:16px">${esc(c[0])}</h3><p class="muted" style="margin-top:6px">${esc(c[1])}</p><p style="margin-top:10px" class="gold">${icon("shield")} ${esc(c[2])}</p>`
    : `<h3 class="section-title">Select a component</h3><p class="muted">Each box explains its role and the control it carries. Keyboard: Tab to a box, Enter to select.</p>`;
  const api = table([
    { h: "", r: (e, i) => `<input type="radio" name="ep" data-a="apiSel" data-i="${i}" aria-label="${esc(e.path)}" ${i === s.ui.apiSel ? "checked" : ""}>` },
    { h: "Method", r: (e) => `<span class="method ${esc(e.m)}">${esc(e.m.toUpperCase())}</span>` },
    { h: "Path", r: (e) => `<span class="ref">${esc(e.path)}</span>` }, { h: "Purpose", k: "purpose" },
  ], ENDPOINTS);
  return pageHead({ eyebrow: "Platform · architecture and integration", title: "One entry point, one exit point",
    desc: "Hub and spoke. Thin connectors in each ERP, all banking logic in one platform on CBQ’s cloud in Qatar. Select any component to see its role and control.",
    actions: btn(s.ui.archPath ? "Hide payment path" : "Highlight payment path", "archPath", { kind: s.ui.archPath ? "" : "primary", ic: "route" }) }) +
  `<div class="stack">
    <div class="grid g-2-1">
      <section class="glass section arch" data-tour="arch"><div class="table-wrap">${diagram(sel, s.ui.archPath)}</div><p class="caption">Dashed outline: built on order through the connector framework. Gold path: a payment from SAP to CBQ.</p></section>
      <section class="glass section">${detail}</section>
    </div>
    ${section({ title: "A payment, hop by hop", ic: "git-commit-horizontal", body: `<div class="seq table-wrap">${sequence()}</div>` })}
    <div class="grid g2" data-tour="api">
      ${section({ title: "Canonical API (OpenAPI 3, v1)", ic: "braces", body: api, caption: "Every connector implements the same API. Adding an ERP never changes the hub, the security model or the CBQ integration." })}
      ${section({ title: `${ep.m.toUpperCase()} ${ep.path}`, ic: "code", body: `<div class="flabel caption" style="margin-bottom:6px">REQUEST</div><pre class="code">${esc(ep.req)}</pre><div class="caption" style="margin:12px 0 6px">RESPONSE</div><pre class="code">${esc(ep.res)}</pre>` })}
    </div>
    ${section({ title: "Connector patterns", ic: "plug-zap", body: `<div class="grid g3">${PATTERNS.map((p) => `<div class="glass card"><div class="kicker">Pattern ${esc(p.k)}</div><h3>${esc(p.name)}</h3><p>${esc(p.how)}</p><p class="caption" style="margin-top:8px">Used for: ${esc(p.used)}</p></div>`).join("")}</div>` })}
    <div class="grid g2">
      ${section({ title: "SAP connector in Phase 1", ic: "server", body: `<div>${SAP_FACTS.map(([k, v]) => `<div class="layer"><b>${esc(k)}</b><span>${esc(v)}</span></div>`).join("")}</div>`, caption: "Built on Innoval’s SAP banking add-on, live with two large Indian private-sector banks." })}
      ${section({ title: "Reliability built in", ic: "shield-check", body: `<ul class="checks">
        <li><span class="ic ok">${icon("check")}</span>Idempotency keys from the ERP document, stored before any CBQ call</li>
        <li><span class="ic ok">${icon("check")}</span>Transactional outbox between orchestrator and broker; no duplicate payments</li>
        <li><span class="ic ok">${icon("check")}</span>No automatic retry after an uncertain payment outcome: status query first</li>
        <li><span class="ic ok">${icon("check")}</span>Circuit breaker on the CBQ adapter; requests queue, none are lost</li>
        <li><span class="ic ok">${icon("check")}</span>Uses CBQ’s reconciliation API if one exists; platform engine otherwise</li></ul>` })}
    </div>
  </div>`;
}

export const pages = [{ id: "architecture", render: architecture }];
export const actions = {
  archSel: (s, d) => withUi(s, { arch: d.c }),
  archPath: (s) => withUi(s, { archPath: !s.ui.archPath }),
  apiSel: (s, d) => withUi(s, { apiSel: Number(d.i) }),
};

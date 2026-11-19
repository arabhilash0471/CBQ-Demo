// Security and deployment considerations.
import { esc, icon, pill, section, table, kpis, pageHead } from "../ui.js";
import { withUi } from "../state.js";

const LAYERS = [
  ["fingerprint", "Identity and access", "CBQ identity platform and SSO for portal users; ERP users mapped to CBQ channel users; MFA; role-based access with segregation of duties."],
  ["badge-check", "Connector trust", "Per-customer certificate from CBQ PKI, mTLS through the CBQ gateway, short-lived OAuth tokens (15 min), signed packages, no stored banking credentials."],
  ["key-round", "Payment authority", "CBQ limits, mandates, OTP and Net Banking approval stay with CBQ. Idempotency keys stop duplicate payments; uncertain outcomes are never auto-retried."],
  ["lock", "Data protection", "TLS 1.2+ in transit; encryption at rest with keys in CBQ HSM and vault; tenant row-level isolation; data minimised to references, status and audit."],
  ["scroll-text", "Audit and monitoring", "Tamper-evident audit to CBQ SIEM; one correlation ID from ERP voucher to CBQ transaction to statement line."],
  ["shield-check", "Assurance", "Independent VAPT before every delivery, secure SDLC with SAST, DAST, SCA and secret scanning, CBQ third-party risk assessment, remote support only through CBQ PAM."],
];

const THREATS = [
  ["Stolen ERP user credentials", "Spoofing", "SAP maker-checker + CBQ OTP for non-STP; CBQ limits enforced at CBQ"],
  ["Tampered payment file or payload", "Tampering", "Signed payloads over mTLS; no files leave SAP; hash in audit"],
  ["Replayed or duplicate payment", "Tampering", "Idempotency key per SAP document; status query before any retry"],
  ["Cross-tenant data access", "Information disclosure", "PostgreSQL RLS by tenant key; per-tenant certificates; tested in VAPT"],
  ["Gateway flooding", "Denial of service", "CBQ WAF, per-tenant rate limits, queue back-pressure"],
  ["Insider changes connector config", "Elevation of privilege", "Dual control in admin portal; PAM-only production access; SIEM alerts"],
  ["Compromised connector certificate", "Spoofing", "Revocation in CBQ PKI; offboarding invalidates tokens instantly"],
];

const ENVS = [
  ["Development", "Innoval", "Build and unit test", "Synthetic only", "neutral"],
  ["SIT", "CBQ cloud, Qatar", "Integration with CBQ sandbox", "Synthetic or CBQ test data", "info"],
  ["UAT", "CBQ cloud, Qatar", "Business acceptance", "CBQ test data", "info"],
  ["Production", "CBQ cloud (primary), Qatar", "Live service", "Live", "ok"],
  ["Disaster recovery", "CBQ cloud (DR), Qatar", "Warm standby, identical configuration", "Replicated, RPO < 15 min", "warn"],
];

const COMPLIANCE = [
  ["QCB data residency: all customer data in Qatar", "ok"], ["Independent VAPT, high findings closed before go-live (Section 9.1)", "ok"],
  ["QCB outsourcing and cloud guidelines", "cbq"], ["CBQ third-party risk assessment", "cbq"],
  ["ISO 27001 alignment (Section 9.2)", "evidence"], ["OWASP ASVS level for portals and APIs", "evidence"],
  ["PCI DSS: out of scope (no card data)", "neutral"],
];

const TOPO = [
  ["Ingress", "CBQ API gateway + WAF (DMZ)", "globe"],
  ["Compute", "Containers on CBQ Kubernetes / OpenShift (or VMs), 3 nodes per zone", "container"],
  ["Services", "Hub, orchestrator, reconciliation, adapter, portals: Node.js, horizontally scaled", "boxes"],
  ["Messaging", "Kafka or RabbitMQ, 3 brokers, transactional outbox", "workflow"],
  ["Data", "PostgreSQL 16, streaming replica to DR, PITR backups 35 days", "database"],
  ["Secrets", "CBQ vault and HSM; no secrets in images or config", "key-square"],
  ["Observability", "OpenTelemetry → CBQ SIEM and monitoring", "activity"],
];

function security(s) {
  const tab = s.ui.secTab;
  const tabs = `<div class="tabs" role="tablist">${[["controls", "Control layers"], ["threats", "Threat model"], ["deploy", "Deployment"], ["compliance", "Compliance"]]
    .map(([k, l]) => `<button class="tab" role="tab" aria-selected="${tab === k}" data-a="secTab" data-k="${k}">${esc(l)}</button>`).join("")}</div>`;
  const body = {
    controls: section({ title: "CBQ’s controls, reused", ic: "shield", body: LAYERS.map(([ic, k, v]) => `<div class="layer"><b>${icon(ic)}${esc(k)}</b><span>${esc(v)}</span></div>`).join("") }),
    threats: section({ title: "STRIDE threat → control matrix (excerpt)", ic: "crosshair", body: table([{ h: "Threat", k: 0 }, { h: "STRIDE", r: (t) => pill(t[1], "gold", "tag") }, { h: "Control", r: (t) => `<span class="muted">${esc(t[2])}</span>` }], THREATS), caption: "Full threat model delivered at design sign-off (M2)." }),
    deploy: `<div class="grid g2">${section({ title: "Environments", ic: "layers", body: table([{ h: "Environment", r: (e) => `<b>${esc(e[0])}</b>` }, { h: "Where", k: 1 }, { h: "Purpose", k: 2 }, { h: "Data", r: (e) => pill(e[3], e[4]) }], ENVS) })}
      ${section({ title: "Deployment topology", ic: "network", body: TOPO.map(([k, v, ic]) => `<div class="layer"><b>${icon(ic)}${esc(k)}</b><span>${esc(v)}</span></div>`).join("") })}</div>`,
    compliance: section({ title: "Compliance checklist", ic: "clipboard-check", body: `<ul class="checks">${COMPLIANCE.map(([t, k]) => `<li><span class="ic ${k === "ok" ? "ok" : ""}">${icon(k === "ok" ? "check" : k === "neutral" ? "minus" : "circle-dashed")}</span>${esc(t)}<span class="meta">${k === "ok" ? "In proposal" : k === "cbq" ? "Per CBQ process" : k === "evidence" ? "To be evidenced" : "Not applicable"}</span></li>`).join("")}</ul>` }),
  }[tab];
  return pageHead({ eyebrow: "Platform · security and deployment", title: "CBQ’s controls, reused not duplicated",
    desc: "Everything runs on CBQ-provided cloud infrastructure in Qatar. The platform never stores banking credentials and never decides an approval." }) +
    kpis([
      { label: "Recovery time objective", value: "< 2 h", ic: "timer-reset" },
      { label: "Recovery point objective", value: "< 15 min", ic: "database-backup" },
      { label: "Monthly availability", value: "99.5%", ic: "activity" },
      { label: "Token lifetime", value: "15 min", ic: "key-round" },
      { label: "VAPT high findings", value: "Closed", ic: "bug-off", caption: "Before go-live (Section 9.1)" },
    ]) + tabs + `<div data-tour="security">${body}</div>`;
}

export const pages = [{ id: "security", render: security }];
export const actions = { secTab: (s, d) => withUi(s, { secTab: d.k }) };

// Walkthrough steps 1-3: register, approve, activate.
import { esc, pill, surface, field, check, note, btn, table, iban, qar } from "../ui.js";
import { withTrace, withAudit, withDone, ensureCid, pipe } from "../state.js";
import { ONBOARD_CUSTOMER as C, ONBOARD_ACCOUNTS, ERP_OPTIONS, SERVICES, ERP_USERS, APPROVAL_QUEUE, ELIGIBILITY } from "../data/customers.js";
import { stepHead, waitFor } from "./walk-common.js";

function onboard(s) {
  const o = s.onboard, locked = o.status !== "draft";
  const accRows = ONBOARD_ACCOUNTS.map((a, i) => ({ ...a, i }));
  const accounts = table([
    { h: "", r: (a) => `<input type="checkbox" data-a="toggleAcc" data-i="${Number(a.i)}" aria-label="Link ${esc(a.iban)}" ${o.accounts[a.i] ? "checked" : ""} ${locked ? "disabled" : ""}>` },
    { h: "Account (IBAN)", r: (a) => `<span class="ref">${iban(a.iban)}</span>` },
    { h: "Currency", k: "ccy" }, { h: "Type", k: "type" }, { h: "Purpose", k: "purpose" },
    { h: "Status", r: (a) => (o.accounts[a.i] ? pill("Link", "info", "link") : pill("Not linked", "neutral")) },
  ], accRows);
  const services = `<div class="grid g2">${SERVICES.map((sv) => {
    const opt = sv.scope !== "Phase 1";
    return `<label class="row" style="padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius-md)">
      <input type="checkbox" ${o.services[sv.k] ? "checked" : ""} ${opt || locked ? "disabled" : ""} data-a="toggleSvc" data-k="${esc(sv.k)}">
      <span>${esc(sv.label)}</span><span class="sp"></span>${opt ? pill(sv.scope, "neutral", "tag") : pill(sv.scope, "gold", "check")}</label>`;
  }).join("")}</div>`;
  const users = table([
    { h: "SAP user", r: (u) => `<span class="ref">${esc(u.sap)}</span>` }, { h: "Name", k: "name" }, { h: "Role", k: "role" },
    { h: "CBQ channel user", r: (u) => `<span class="ref">${esc(u.cbq)}</span>` },
    { h: "Limit (QAR)", num: true, r: (u) => (u.limit ? esc(u.limit.toLocaleString("en-US")) : "-") },
  ], ERP_USERS);
  const linked = o.accounts.filter(Boolean).length;
  const body = `
    <div class="grid g3">${field("Company", esc(C.name))}${field("Commercial registration", esc(C.cr))}${field("CBQ customer ID", esc(C.cbqId))}
      ${field("Segment", esc(C.segment))}${field("Relationship manager", esc(C.rm))}${field("Net Banking administrator", esc(C.admin))}</div>
    <h3 class="section-title" style="margin:20px 0 8px">ERP</h3>
    <div class="grid g2"><div class="field"><label for="erpSel">ERP and release</label><select id="erpSel" class="input" ${locked ? "disabled" : ""}>
      ${ERP_OPTIONS.map((e) => `<option ${e.v === "s4" ? "selected" : ""} ${e.phase !== "Phase 1" ? "disabled" : ""}>${esc(e.label)} · ${esc(e.phase)}</option>`).join("")}</select>
      <div class="hint">Other ERPs show as "on CBQ order" and join a waitlist CBQ can see.</div></div>
      ${field("SAP system", esc(C.sid), "Detected from the activation request later")}</div>
    <h3 class="section-title" style="margin:20px 0 8px">Accounts to link <span class="count">${linked}</span></h3>${accounts}
    <h3 class="section-title" style="margin:20px 0 8px">Banking services</h3>${services}
    <h3 class="section-title" style="margin:20px 0 8px">Users and roles mapped to CBQ channel users</h3>${users}
    <div class="row" style="margin-top:18px"><span class="caption">Declaration accepted by r.alkuwari · terms v3.2</span><span class="sp"></span>
      ${locked ? pill(s.approval >= 2 ? "Approved by CBQ" : "Submitted, awaiting CBQ approval", s.approval >= 2 ? "ok" : "warn")
        : btn("Submit for CBQ approval", "submitOnboard", { kind: "primary", ic: "send", disabled: !linked })}</div>`;
  return stepHead(s, "onboard", "A corporate customer applies online",
    "The customer picks its ERP, links CBQ accounts, chooses services and maps users. Eligibility is checked against CBQ’s records, not re-entered.", locked) +
    `<div data-tour="onboard-form">${surface({ product: "CBQ ERP Connect", screen: "Customer onboarding portal", chip: "Customer", body })}</div>` +
    note("CBQ configures which ERPs, services and accounts are offered. The portal reuses CBQ identity and Net Banking credentials; no new passwords are created.");
}

function approve(s) {
  if (s.onboard.status === "draft") return stepHead(s, "approve", "CBQ reviews and approves", "", false) + waitFor("No pending request yet. Submit the registration in step 1 first.", "onboard", "Go to step 1");
  const st = s.approval;
  const queue = table([
    { h: "Request", r: (q) => `<span class="ref">${esc(q.id)}</span>` }, { h: "Customer", k: "customer" }, { h: "ERP", k: "erp" },
    { h: "Accounts", k: "accounts", num: true }, { h: "Submitted", k: "submitted" }, { h: "Officer", k: "officer" },
    { h: "Status", r: (q) => (q.live ? (st >= 2 ? pill("Approved", "ok") : st === 1 ? pill("Awaiting checker", "warn") : pill("Pending review", "warn")) : pill(q.status[0], q.status[1])) },
  ], APPROVAL_QUEUE);
  const prov = ["Creates isolated tenant TN-0042", "Issues connector certificate from CBQ PKI", "Releases signed SAP add-on package 1.4.0", "Sends one-time activation code to the SAP administrator"];
  const body = `${queue}
    <div class="grid g2" style="margin-top:18px">
      <div><h3 class="section-title" style="margin-bottom:6px">Automatic eligibility checks · ONB-2026-0042</h3>
        <ul class="checks">${ELIGIBILITY.map(([t, m]) => check(t, "ok", m)).join("")}</ul></div>
      <div><h3 class="section-title" style="margin-bottom:6px">On approval the platform</h3>
        <ul class="checks">${prov.map((t) => check(t, st >= 2 ? "ok" : "")).join("")}</ul>
        <h3 class="section-title" style="margin:16px 0 6px">Dual control</h3>
        <ul class="checks">${check("Maker: s.hamad (Wholesale Banking operations)", st >= 1 ? "ok" : "wait", st >= 1 ? "Approved" : "To review")}
          ${check("Checker: a.alsulaiti (Digital channels)", st >= 2 ? "ok" : st === 1 ? "wait" : "", st >= 2 ? "Authorised" : "")}</ul></div></div>
    <div class="row" style="margin-top:16px"><span class="sp"></span>
      ${st === 0 ? btn("Request more information", "rejectInfo", { ic: "message-square" }) + btn("Approve as maker", "approve1", { kind: "primary", ic: "check" }) : ""}
      ${st === 1 ? btn("Authorise as checker", "approve2", { kind: "primary", ic: "shield-check" }) : ""}
      ${st >= 2 ? pill("Tenant TN-0042 created, activation code sent", "ok") : ""}</div>`;
  return stepHead(s, "approve", "CBQ reviews and approves",
    "A CBQ officer sees the checks already run and approves. A second officer authorises, so onboarding itself is maker-checker controlled.", st >= 2) +
    `<div data-tour="approve-queue">${surface({ product: "CBQ ERP Connect", screen: "CBQ administration portal · onboarding queue", chip: "CBQ staff", body })}</div>`;
}

function activate(s) {
  if (s.approval < 2) return stepHead(s, "activate", "The customer’s SAP team activates the connector", "", false) + waitFor("Waiting for CBQ approval in step 2.", "approve", "Go to step 2");
  const body = `<div class="grid g2"><div><h3 class="section-title" style="margin-bottom:6px">Set-up checklist</h3><ul class="checks">
      ${check("Innoval add-on transports imported (namespace /INNOVAL/)", "ok", "S4PK900412, S4PK900413")}
      ${check("Connector certificate installed in STRUST", "ok", "CN=TN-0042, valid 12 months")}
      ${check("House bank CBQA and 3 accounts mapped (FI12)", "ok")}
      ${check("Roles built from authorisation objects /INNOVAL/PAY, /INNOVAL/REL", "ok")}
      ${check("Activation code entered", s.activated ? "ok" : "wait")}
      ${check("Connection test", s.testOk ? "ok" : "")}</ul></div>
    <div>${field("Activation code", s.activated ? "<span class='ref'>••••-••••-7KQ2 (used)</span>" : "<span class='ref'>Q8MD-41TZ-7KQ2</span>", "Single use, expires in 72 hours")}
      <div style="height:12px"></div>${field("Platform endpoint", "<span class='ref'>https://erpconnect.cbq.qa/api/v1</span>", "Via CBQ API gateway, mTLS")}
      <div class="row" style="margin-top:16px">
        ${!s.activated ? btn("Activate", "activate", { kind: "primary", ic: "plug" }) : ""}
        ${s.activated && !s.testOk ? btn("Test connection", "testConn", { kind: "primary", ic: "zap" }) : ""}
        ${s.testOk ? pill(`Connected · balance ${qar(1284560.40)}`, "ok") : ""}</div></div></div>`;
  return stepHead(s, "activate", "The customer’s SAP team activates the connector",
    "Standard SAP transports and the customer’s own Basis team. The add-on stores no banking passwords; it authenticates with a per-customer certificate and short-lived tokens.", s.testOk) +
    `<div data-tour="activate">${surface({ product: "SAP S/4HANA", screen: "Transaction /INNOVAL/CBQ_SETUP", chip: "Customer SAP Basis", body })}</div>` +
    note("Supported: SAP ECC 6.0 EHP 7 SP 20 and above, and SAP S/4HANA 2020 and above, on-premises or private cloud (incl. RISE). TLS 1.2 required.", "info");
}

export const pages = [
  { id: "onboard", render: onboard, persona: "admin" },
  { id: "approve", render: approve, persona: "officer" },
  { id: "activate", render: activate, persona: "basis" },
];

export const actions = {
  toggleAcc: (s, d) => ({ ...s, onboard: { ...s.onboard, accounts: s.onboard.accounts.map((v, i) => (i === Number(d.i) ? !v : v)) } }),
  toggleSvc: (s, d) => ({ ...s, onboard: { ...s.onboard, services: { ...s.onboard.services, [d.k]: !s.onboard.services[d.k] } } }),
  submitOnboard: (s) => pipe({ ...s, onboard: { ...s.onboard, status: "submitted" } },
    (x) => withDone(x, "onboard"),
    (x) => withAudit(x, "r.alkuwari (customer)", "Submitted registration ONB-2026-0042"),
    (x) => withTrace(x, "Portal → Onboarding service", "Registration ONB-2026-0042 received", "Eligibility pre-checks queued against CBQ customer data", [2]),
    (x) => withTrace(x, "Onboarding service → CBQ core", "KYC, mandate, account ownership and screening checks", "6 of 6 passed in 1.4 s", [2, 4])),
  rejectInfo: (s) => withTrace(s, "Admin portal", "Officer can request more information; the customer is notified", "No change made in this demo", [2]),
  approve1: (s) => pipe({ ...s, approval: 1 },
    (x) => withAudit(x, "s.hamad (CBQ maker)", "Approved ONB-2026-0042"),
    (x) => withTrace(x, "Admin portal → Onboarding service", "Maker approval recorded", "Awaiting checker; same user cannot authorise", [2])),
  approve2: (s) => pipe({ ...s, approval: 2 },
    (x) => withDone(x, "approve"),
    (x) => withAudit(x, "a.alsulaiti (CBQ checker)", "Authorised ONB-2026-0042, tenant TN-0042"),
    (x) => withTrace(x, "Onboarding service", "Tenant TN-0042 created", "Row-level isolation key assigned", [2, 3]),
    (x) => withTrace(x, "Platform → CBQ PKI", "Connector certificate issued for TN-0042", "Key in CBQ HSM; certificate valid 12 months", [2, 4])),
  activate: (s) => pipe({ ...s, activated: true },
    (x) => withAudit(x, "SAP Basis (customer)", "Entered activation code"),
    (x) => withTrace(x, "SAP add-on → CBQ API gateway", "Activation request with one-time code", "mTLS with customer certificate from STRUST", [0, 1]),
    (x) => withTrace(x, "Gateway → Connector hub", "Connector registered, version 1.4.0", "Heartbeat every 5 minutes", [1, 2])),
  testConn: (s) => pipe({ ...s, testOk: true },
    (x) => withDone(x, "activate"), ensureCid,
    (x) => withTrace(x, "SAP add-on → Connector hub", "GET /v1/accounts/{id}/balance", "OAuth token, 15-minute lifetime", [0, 1, 2]),
    (x) => withTrace(x, "CBQ API adapter → CBQ", "Balance inquiry for QA58…5566 7", "200 OK in 182 ms", [2, 4])),
};


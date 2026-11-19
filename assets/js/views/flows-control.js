// Extra scenarios: cancel / recall a payment, and the balance and limits pre-check.
import { esc, pill, surface, check, note, btn, table, fmt, qar, kpis, section, bar } from "../ui.js";
import { withTrace, withAudit, newCid, pipe } from "../state.js";
import { RECALL_BATCH, RECALL_ITEMS, RECALL_STAGES, DAILY_LIMIT, EARLIER_TODAY, CUTOFF } from "../data/flows.js";
import { STP_LIMIT } from "../data/payments.js";
import { ONBOARD_ACCOUNTS, ERP_USERS } from "../data/customers.js";
import { scenarioHead, tracker } from "./flows-common.js";

/* ---------- Cancel and recall ---------- */
function recall(s) {
  const [a, b] = RECALL_ITEMS;
  const aDone = s.cxlA === 1, bAt = s.cxlB - 1;
  const rows = table([
    { h: "Document", r: (p) => `<span class="ref">${esc(p.doc)}</span>` },
    { h: "Vendor", r: (p) => `${esc(p.vendor)}<div class="caption">${esc(p.why)}</div>` },
    { h: "Amount (QAR)", num: true, r: (p) => esc(fmt(p.amt)) },
    { h: "Status", r: (p) => (p.key === "A" ? (aDone ? pill("Cancelled", "neutral", "ban") : pill(p.status, "warn")) : bAt >= 2 ? pill("Funds returned", "ok") : bAt >= 0 ? pill("Recall in progress", "warn") : pill(p.status, "ok")) },
    { h: "Option", r: (p) => (p.key === "A" ? (aDone ? `<span class="caption">Cancelled before execution</span>` : btn("Cancel payment", "cxlA", { kind: "sm", ic: "ban" }))
      : bAt < 0 ? btn("Request recall", "cxlB", { kind: "sm", ic: "undo-2" }) : bAt < 2 ? btn("Refresh recall status", "cxlB", { kind: "sm", ic: "refresh-cw" }) : `<span class="caption">Ref <span class="ref">${esc(p.ref)}</span> reversed</span>`) },
  ], RECALL_ITEMS);
  const body = `<div class="row" style="margin-bottom:12px"><span>Batch <b>${esc(RECALL_BATCH)}</b> · sent 15.11.2026 by F.HADDAD</span></div>${rows}
    ${s.cxlB > 0 ? `<div style="margin-top:16px"><b>Recall of ${esc(b.doc)}</b>${tracker(RECALL_STAGES, bAt)}</div>` : ""}`;
  return scenarioHead("recall", "Stop a payment before CBQ executes it, or recall one already paid",
    "From the same SAP cockpit the maker can cancel a scheduled payment while CBQ still holds it, or ask CBQ to recall an executed one. Each request goes through CBQ’s own controls and the outcome is written back to the SAP document.") +
    kpis([
      { label: "Cancellable now", value: aDone ? "0" : "1", ic: "ban", caption: "Not yet executed" },
      { label: "Recall requests", value: s.cxlB > 0 ? "1" : "0", ic: "undo-2", caption: "Needs beneficiary bank consent" },
      { label: "Value protected", value: qar((aDone ? a.amt : 0) + (bAt >= 2 ? b.amt : 0), 0), ic: "shield-check", caption: "Cancelled or returned" },
      { label: "SAP open items restored", value: String((aDone ? 1 : 0) + (bAt >= 2 ? 1 : 0)), ic: "rotate-ccw", caption: "Vendor line re-opened" },
    ]) +
    `<div data-tour="recall">${surface({ product: "SAP S/4HANA", screen: "CBQ Banking cockpit · cancel and recall", chip: "F.HADDAD · maker", body })}</div>` +
    `<div class="grid g2" style="margin-top:12px">
      ${section({ title: "Cancel (before execution)", ic: "ban", body: `<ul class="checks">${check("Allowed while CBQ status is Scheduled or Awaiting approval", "ok")}${check("Maker requests, checker confirms in SAP", "ok")}${check("CBQ confirms the cancellation; nothing is debited", "ok")}</ul>` })}
      ${section({ title: "Recall (after execution)", ic: "undo-2", body: `<ul class="checks">${check("CBQ sends the recall to the beneficiary bank (camt.056)", "ok")}${check("Funds come back only with beneficiary consent", "wait")}${check("Return arrives on the statement and reconciles by rule", "ok")}</ul>` })}
    </div>` +
    note("Recall depends on the CBQ APIs available for it; it is listed in the clarification log. Where an API is not offered, the request is raised as a case for CBQ operations from the same screen.", "info");
}

/* ---------- Balance and limits pre-check (view-local inputs) ---------- */
let limAmt = 180000;
let limUser = "F.HADDAD";

const sentTotal = (s) => (s.sent ? s.pays.filter((p) => p.sel).reduce((x, p) => x + p.amt, 0) : 0);

/** Pure: evaluate one proposed payment against funds, user limit, daily limit and STP route. */
export function evaluate(s, amount, sapUser) {
  const acct = ONBOARD_ACCOUNTS[0];
  const avail = acct.balance - (s.otp ? sentTotal(s) : 0);
  const used = EARLIER_TODAY + sentTotal(s);
  const user = ERP_USERS.find((u) => u.sap === sapUser) || ERP_USERS[0];
  const amt = Number.isFinite(amount) && amount > 0 ? amount : 0;
  const tests = [
    { t: "Amount entered", ok: amt > 0, m: amt > 0 ? qar(amt) : "Enter an amount above zero" },
    { t: "Available balance (live from CBQ)", ok: amt <= avail, m: `${qar(avail)} available` },
    { t: `${user.name}’s per-payment limit`, ok: amt <= user.limit, m: `Limit ${qar(user.limit, 0)}` },
    { t: "Customer daily limit", ok: used + amt <= DAILY_LIMIT, m: `${qar(DAILY_LIMIT - used, 0)} left today` },
    { t: `Same-day cut-off ${CUTOFF}`, ok: true, m: "Now 10:42 AST" },
  ];
  const blocked = tests.some((x) => !x.ok);
  const route = blocked ? "Blocked in SAP" : amt > STP_LIMIT ? "CBQ approval (OTP or Net Banking)" : "Straight-through";
  return { tests, blocked, route, avail, used, user };
}

function limitsOut(s) {
  const r = evaluate(s, limAmt, limUser);
  return `<ul class="checks">${r.tests.map((x) => check(x.t, x.ok ? "ok" : "bad", x.m)).join("")}</ul>
    <div class="row" style="margin-top:12px"><b>Result</b><span class="sp"></span>${pill(r.route, r.blocked ? "bad" : limAmt > STP_LIMIT ? "warn" : "ok", r.blocked ? "circle-x" : limAmt > STP_LIMIT ? "key-round" : "zap")}</div>`;
}

function limits(s) {
  const used = EARLIER_TODAY + sentTotal(s);
  const users = ERP_USERS.filter((u) => u.limit > 0);
  const acc = table([
    { h: "Account", r: (a) => `<span class="ref">${esc(a.iban.slice(0, 4))} … ${esc(a.iban.slice(-5))}</span>` }, { h: "Type", k: "type" }, { h: "Ccy", k: "ccy" },
    { h: "Available", num: true, r: (a, i) => `${esc(a.ccy)} ${esc(fmt(a.balance - (i === 0 && s.otp ? sentTotal(s) : 0)))}` },
    { h: "Linked", r: (a) => (a.defaultOn ? pill("Linked", "ok") : pill("Not linked", "neutral")) },
  ], ONBOARD_ACCOUNTS);
  const lim = table([
    { h: "SAP user", r: (u) => `<span class="ref">${esc(u.sap)}</span>` }, { h: "Name", k: "name" }, { h: "Role", k: "role" },
    { h: "Per-payment limit", num: true, r: (u) => esc(qar(u.limit, 0)) },
  ], users);
  const form = `<div class="grid g2">
      <label class="field"><span class="flabel">Proposed amount (QAR)</span><input id="limAmt" class="input" type="number" min="0" step="100" inputmode="decimal" value="${esc(limAmt)}"></label>
      <label class="field"><span class="flabel">Sent by SAP user</span><select id="limUser" class="input">${users.map((u) => `<option value="${esc(u.sap)}" ${u.sap === limUser ? "selected" : ""}>${esc(u.sap)} · ${esc(u.role)}</option>`).join("")}</select></label></div>
    <div id="limOut" style="margin-top:14px" aria-live="polite">${limitsOut(s)}</div>`;
  return scenarioHead("limits", "Know before you send: balance, limits and route from inside SAP",
    "Balances come live from CBQ. Before a payment leaves SAP the cockpit checks it against the same limits CBQ will apply, so the maker sees straight away whether it goes straight-through, needs CBQ approval or will be refused.") +
    kpis([
      { label: "Operating account", value: qar(ONBOARD_ACCOUNTS[0].balance - (s.otp ? sentTotal(s) : 0), 0), ic: "wallet", caption: "Live from CBQ · 10:42 AST" },
      { label: "Daily limit used", value: `${Math.round((used / DAILY_LIMIT) * 100)}%`, ic: "gauge", caption: `${qar(used, 0)} of ${qar(DAILY_LIMIT, 0)}` },
      { label: "STP limit", value: qar(STP_LIMIT, 0), ic: "zap", caption: "Per payment" },
      { label: "Cut-off", value: CUTOFF, ic: "clock", caption: "Same-day domestic" },
    ]) +
    `<div class="grid g-2-1">
      <div data-tour="limits">${surface({ product: "SAP S/4HANA", screen: "CBQ Banking cockpit · pre-check", chip: "Try any amount", body: form })}</div>
      ${section({ title: "Daily limit", ic: "gauge", body: `${bar((used / DAILY_LIMIT) * 100)}<p class="caption" style="margin-top:8px">${esc(qar(used, 0))} used today, including ${s.sent ? "batch BT-77310" : "earlier payments"}.</p>` })}
    </div>
    <div class="grid g2" style="margin-top:12px">
      ${section({ title: "Accounts", ic: "landmark", body: acc })}
      ${section({ title: "User limits (CBQ mandate)", ic: "user-check", body: lim, caption: "Limits are held by CBQ; SAP shows them, it never overrides them." })}
    </div>`;
}

function mountLimits(root) {
  const amt = root.querySelector("#limAmt"), usr = root.querySelector("#limUser"), out = root.querySelector("#limOut");
  if (!amt || !usr || !out) return;
  const update = () => {
    const v = Number(amt.value);
    limAmt = Number.isFinite(v) && v >= 0 ? Math.min(v, 1e10) : 0;
    limUser = usr.value;
    out.innerHTML = limitsOut(lastState);
    if (window.lucide) window.lucide.createIcons();
  };
  amt.addEventListener("input", update);
  usr.addEventListener("change", update);
}

let lastState = null;
const renderLimits = (s) => { lastState = s; return limits(s); };

export const pages = [
  { id: "recall", render: recall, persona: "maker" },
  { id: "limits", render: renderLimits, mount: mountLimits, persona: "maker" },
];

export const actions = {
  cxlA: (s) => pipe({ ...s, cxlA: 1, cid: newCid(), ui: { ...s.ui, toast: "Payment cancelled at CBQ" } },
    (x) => withAudit(x, "F.HADDAD (maker)", `Cancelled ${RECALL_ITEMS[0].doc} before execution`),
    (x) => withTrace(x, "SAP add-on → CBQ (via platform)", `POST /v1/payments/${RECALL_ITEMS[0].doc}:cancel`, "CBQ confirmed; nothing debited", [0, 1, 2, 4])),
  cxlB: (s) => {
    const n = Math.min(s.cxlB + 1, RECALL_STAGES.length);
    let x = { ...s, cxlB: n, cid: s.cxlB === 0 ? newCid() : s.cid };
    if (n === 1) x = withAudit(x, "F.HADDAD (maker)", `Requested recall of ${RECALL_ITEMS[1].doc}`);
    return withTrace(x, n === 1 ? "SAP add-on → CBQ (via platform)" : "CBQ → Status engine", RECALL_STAGES[n - 1][0], RECALL_STAGES[n - 1][1], n === 1 ? [0, 2, 4] : [4, 2, 0]);
  },
};

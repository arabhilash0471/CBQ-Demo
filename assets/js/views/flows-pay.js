// Extra scenarios: WPS payroll and international (SWIFT) payment with an FX quote.
import { esc, pill, surface, check, note, btn, table, fmt, qar, kpis, section } from "../ui.js";
import { withTrace, withAudit, newCid, pipe } from "../state.js";
import { WPS, WPS_SAMPLE, WPS_CHECKS, INTL, GPI } from "../data/flows.js";
import { STP_LIMIT } from "../data/payments.js";
import { scenarioHead, tracker } from "./flows-common.js";

/* ---------- WPS payroll ---------- */
const WPS_STAGES = [
  ["Imported from SAP payroll", WPS.run],
  ["Validated by the platform", "QID, IBAN, establishment ID, totals"],
  ["Approved at CBQ", "Net Banking approval by authorised signatory"],
  ["Paid and reported to WPS", "Salary information file accepted"],
];

function wps(s) {
  const st = s.wps;
  const paid = WPS.employees - 1, paidAmt = WPS.total - WPS.heldAmt;
  const rows = table([
    { h: "Employee", r: (e) => `<span class="ref">${esc(e.id)}</span>` },
    { h: "Name", k: "name" },
    { h: "QID", r: (e) => `<span class="ref">${esc(e.qid)}</span>` },
    { h: "Bank / IBAN", r: (e) => `<span class="ref">${esc(e.iban)}</span>` },
    { h: "Basic", num: true, r: (e) => esc(fmt(e.basic)) },
    { h: "Allowances", num: true, r: (e) => esc(fmt(e.allow)) },
    { h: "Deductions", num: true, r: (e) => esc(fmt(e.ded)) },
    { h: "Net (QAR)", num: true, r: (e) => `<b>${esc(fmt(e.net))}</b>` },
    { h: "Check", r: (e) => (st < 1 ? pill("Imported", "info") : e.flag ? pill(e.flag, "bad", "triangle-alert") : st >= 3 ? pill("Credited", "ok") : pill("Passed", "ok")) },
  ], WPS_SAMPLE);
  const checks = `<ul class="checks">${WPS_CHECKS.map(([t, m]) => check(t, st < 1 ? "" : m.includes("failed") ? "bad" : "ok", st < 1 ? "" : m)).join("")}</ul>`;
  const action = st === 0 ? btn("Validate payroll file", "wpsValidate", { kind: "primary", ic: "shield-check" })
    : st === 1 ? btn(`Submit ${WPS.employees - 1} salaries to CBQ`, "wpsSubmit", { kind: "primary", ic: "send" })
    : st === 2 ? btn("Approve in CBQ Net Banking", "wpsApprove", { kind: "primary", ic: "key-round" })
    : pill(`WPS acceptance ${WPS.acceptId}`, "ok", "file-check");
  const body = `<div class="row" style="margin-bottom:12px"><span>Payroll <b>${esc(WPS.month)}</b> · establishment <span class="ref">${esc(WPS.employerId)}</span> · ${esc(WPS.employees)} employees</span><span class="sp"></span>${action}</div>
    ${tracker(WPS_STAGES, st)}
    ${rows}<p class="caption" style="margin-top:8px">Showing 10 of ${esc(WPS.employees)} employees. QIDs and IBANs masked on screen; full values only inside CBQ’s data zone.</p>`;
  return scenarioHead("wps", "Monthly payroll paid under Qatar’s Wage Protection System",
    "Payroll posted in SAP goes to CBQ as one bulk salary batch. The platform validates every record before submission, builds the WPS salary information file, and returns each credit to SAP.") +
    kpis([
      { label: "Employees", value: String(WPS.employees), ic: "users-round", caption: WPS.month },
      { label: "Payroll total", value: qar(WPS.total, 0), ic: "banknote", caption: "Net salaries" },
      { label: "Held for correction", value: st >= 1 ? "1" : "–", ic: "triangle-alert", caption: st >= 1 ? `${WPS.heldEmp} · invalid IBAN` : "After validation" },
      { label: "Credited", value: st >= 3 ? `${paid} · ${qar(paidAmt, 0)}` : "–", ic: "circle-check", caption: "Same-day for CBQ accounts" },
    ]) +
    `<div class="stack"><div data-tour="wps">${surface({ product: "SAP S/4HANA", screen: "CBQ Banking cockpit · payroll", chip: "M.NASSER · payroll approver", body })}</div>
      ${section({ title: "Pre-submission checks", ic: "list-checks", body: checks })}</div>` +
    note(`One employee (${esc(WPS.heldEmp)}) is held back, not the whole file. HR corrects the bank details in SAP (PA30, infotype 0009) and pays the item in an off-cycle run. WPS payroll is a priced option on top of Phase 1.`, "info");
}

/* ---------- International payment ---------- */
const qarEq = () => Math.round(INTL.amt * INTL.rate * 100) / 100;

function intl(s) {
  const st = s.intl;
  const gpiAt = st >= 3 ? Math.min(st - 3, GPI.length - 1) : -1;
  const fields = table([{ h: "Field", k: 0 }, { h: "Value", r: (r) => `<span class="${r[2] ? "ref" : ""}">${esc(r[1])}</span>` }], [
    ["Vendor", `${INTL.vendor} (${INTL.vno}), ${INTL.city}`],
    ["SAP document / invoice", `${INTL.doc} · ${INTL.inv}`, 1],
    ["Beneficiary IBAN / BIC", `${INTL.iban.replace(/(.{4})/g, "$1 ").trim()} · ${INTL.bic}`, 1],
    ["Amount", `${INTL.ccy} ${fmt(INTL.amt)}`],
    ["Debit account", "QA58 CBQA … 5566 7 (QAR)", 1],
    ["Charges / purpose", `${INTL.charges} · ${INTL.purpose}`],
  ]);
  const quote = st >= 1 ? `<div class="glass section quote">
      <div class="section-head"><h3 class="section-title">CBQ FX quote</h3><span class="sp"></span>${st === 1 ? pill(`Valid ${INTL.validSecs} s`, "warn", "timer") : pill("Booked", "ok")}</div>
      <div class="grid g3">
        <div><span class="caption">Rate EUR/QAR</span><div class="big-num">${esc(INTL.rate.toFixed(4))}</div></div>
        <div><span class="caption">QAR equivalent</span><div class="big-num">${esc(fmt(qarEq()))}</div></div>
        <div><span class="caption">CBQ fee</span><div class="big-num">${esc(fmt(INTL.fee))}</div></div></div>
      <p class="caption">Quote <span class="ref">${esc(INTL.quoteId)}</span> from CBQ treasury. The platform never prices FX itself.</p></div>` : "";
  const action = st === 0 ? btn("Get FX quote from CBQ", "intlQuote", { kind: "primary", ic: "arrow-left-right" })
    : st === 1 ? btn("Book quote and send", "intlBook", { kind: "primary", ic: "send" })
    : st === 2 ? btn("Approve with CBQ OTP", "intlApprove", { kind: "primary", ic: "key-round" })
    : st < 3 + GPI.length - 1 ? btn("Refresh SWIFT gpi tracker", "intlTrack", { kind: "primary", ic: "refresh-cw" })
    : pill("Credited to beneficiary", "ok");
  const body = `${fields}${quote}
    <div class="row" style="margin-top:14px"><span class="caption">Sanctions screening and purpose-code checks run at CBQ before release.</span><span class="sp"></span>${action}</div>
    ${st >= 3 ? `<div style="margin-top:16px"><div class="row" style="margin-bottom:8px"><b>SWIFT gpi tracker</b><span class="sp"></span><span class="caption">UETR <span class="ref">${esc(INTL.uetr)}</span></span></div>${tracker(GPI, gpiAt)}</div>` : ""}`;
  return scenarioHead("intl", "A EUR supplier paid from SAP, with a live CBQ FX quote",
    "The maker picks the open item in SAP. CBQ quotes the rate, the customer books it, the payment above the STP limit is approved with a CBQ OTP, and SWIFT gpi status flows back to the SAP document.") +
    kpis([
      { label: "Amount", value: `EUR ${fmt(INTL.amt, 0)}`, ic: "euro", caption: INTL.vendor },
      { label: "QAR equivalent", value: st >= 1 ? qar(qarEq(), 0) : "–", ic: "arrow-left-right", caption: st >= 1 ? `@ ${INTL.rate.toFixed(4)}` : "After quote" },
      { label: "Route", value: "CBQ approval", ic: "key-round", caption: `Above STP limit ${qar(STP_LIMIT, 0)}` },
      { label: "Status", value: st < 3 ? ["Draft", "Quoted", "Awaiting OTP"][st] : GPI[gpiAt][0], ic: "radar", caption: st >= 3 ? `Bank ref ${INTL.ref}` : "Inside SAP" },
    ]) +
    `<div data-tour="intl">${surface({ product: "SAP S/4HANA", screen: "CBQ Banking cockpit · international", chip: "F.HADDAD · maker", body })}</div>` +
    note("International payments are a priced option. The same canonical API carries them; only the CBQ adapter mapping (pacs.008, purpose codes, gpi) is added.", "info");
}

export const pages = [
  { id: "wps", render: wps, persona: "checker" },
  { id: "intl", render: intl, persona: "maker" },
];

export const actions = {
  wpsValidate: (s) => pipe({ ...s, wps: 1, cid: newCid() },
    (x) => withTrace(x, "SAP add-on → CBQ API gateway", "POST /v1/payroll-batches:validate (148 records)", "Signed payload, records masked in logs", [0, 1]),
    (x) => withTrace(x, "Payment orchestrator", "147 passed, 1 held: IBAN check digit invalid", "Held item returned to SAP with reason", [2])),
  wpsSubmit: (s) => pipe({ ...s, wps: 2 },
    (x) => withAudit(x, "M.NASSER (payroll approver)", `Submitted WPS ${WPS.month}, 147 salaries`),
    (x) => withTrace(x, "CBQ API adapter → CBQ", "Bulk salary batch submitted", "202 Accepted; payroll always needs CBQ approval", [2, 4])),
  wpsApprove: (s) => pipe({ ...s, wps: 3, ui: { ...s.ui, toast: "Payroll approved and paid" } },
    (x) => withAudit(x, "Authorised signatory (CBQ Net Banking)", `Approved WPS ${WPS.month}`),
    (x) => withTrace(x, "CBQ → WPS", `Salary information file accepted: ${WPS.acceptId}`, "Credits confirmed and written back to SAP", [4, 2, 0])),
  intlQuote: (s) => pipe({ ...s, intl: 1, cid: newCid() },
    (x) => withTrace(x, "SAP add-on → CBQ (via platform)", "POST /v1/fx-quotes EUR 84,300.00", `Quote ${INTL.quoteId} @ ${INTL.rate}`, [0, 1, 2, 4])),
  intlBook: (s) => pipe({ ...s, intl: 2 },
    (x) => withAudit(x, "F.HADDAD (maker)", `Booked ${INTL.quoteId}, sent ${INTL.doc}`),
    (x) => withTrace(x, "Payment orchestrator → CBQ", "International payment submitted with booked quote", "Sanctions and purpose-code checks at CBQ", [2, 4])),
  intlApprove: (s) => pipe({ ...s, intl: 3, ui: { ...s.ui, toast: "Approved with CBQ OTP" } },
    (x) => withAudit(x, "M.NASSER (checker)", `Approved ${INTL.doc} with CBQ OTP`),
    (x) => withTrace(x, "CBQ → SWIFT", "pacs.008 sent", `UETR ${INTL.uetr}`, [4])),
  intlTrack: (s) => {
    const next = Math.min(s.intl + 1, 3 + GPI.length - 1);
    return withTrace({ ...s, intl: next }, "SWIFT gpi → Status engine", GPI[next - 3][0], "Status written to the SAP document", [4, 2, 0]);
  },
};

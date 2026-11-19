// Walkthrough steps 4-6: payment run, approvals, status write-back.
import { esc, pill, surface, check, note, btn, table, iban, fmt, qar, icon, kpis } from "../ui.js";
import { withTrace, withAudit, withDone, withUi, newCid, pipe } from "../state.js";
import { STP_LIMIT, RUN_ID, BATCH_ID, LIFE, REJECT } from "../data/payments.js";
import { stepHead, waitFor } from "./walk-common.js";

const selected = (s) => s.pays.filter((p) => p.sel);
const total = (list) => list.reduce((a, p) => a + p.amt, 0);
const needsOtp = (p) => p.amt > STP_LIMIT;

/** Derive each payment's lifecycle position from the refresh counter (pure). */
export function lifecycle(s) {
  return selected(s).map((p, i) => {
    if (s.progress === 0) return { ...p, stage: 0, status: "Sent", bad: false, ref: "" };
    if (p.willReject) {
      const bad = s.progress >= 3;
      return { ...p, stage: bad ? 2 : Math.min(s.progress, 2), status: bad ? "Rejected" : LIFE[Math.min(s.progress, 2)], bad, ref: bad ? `${REJECT.code} ${REJECT.text}` : "" };
    }
    const stage = s.progress >= 5 ? 4 : Math.min(s.progress - 1 + (i % 2 === 0 ? 1 : 0), 4);
    return { ...p, stage, status: stage >= 4 ? "Completed" : LIFE[Math.max(stage, 0)], bad: false, ref: stage >= 4 ? p.bankRef : "" };
  });
}

function pay(s) {
  if (!s.testOk) return stepHead(s, "pay", "A maker sends the SAP payment run to CBQ", "", false) + waitFor("Activate the connector in step 3 first.", "activate", "Go to step 3");
  const sel = selected(s), tot = total(sel);
  const rows = s.pays.map((p, i) => ({ ...p, i }));
  const tbl = table([
    { h: "", r: (p) => `<input type="checkbox" data-a="togglePay" data-i="${Number(p.i)}" aria-label="Select ${esc(p.vendor)}" ${p.sel ? "checked" : ""} ${s.sent ? "disabled" : ""}>` },
    { h: "Document", r: (p) => `<span class="ref">${esc(p.doc)}</span>` },
    { h: "Vendor", r: (p) => `${esc(p.vendor)}<div class="caption">${esc(p.vno)} · ${esc(p.inv)}</div>` },
    { h: "Beneficiary IBAN", r: (p) => `<span class="ref">${iban(p.iban)}</span>` },
    { h: "Amount (QAR)", num: true, r: (p) => esc(fmt(p.amt)) },
    { h: "Route", r: (p) => (needsOtp(p) ? pill("CBQ approval", "warn", "key-round") : pill("STP", "info", "zap")) },
    { h: "Check", r: (p) => (p.dupHint ? pill("Possible duplicate of 2000004513", "bad", "copy") : s.sent && p.sel ? pill("Sent to CBQ", "ok") : pill("Passed", "ok")) },
  ], rows, { foot: `<tr><td></td><td></td><td colspan="2">Total selected · ${sel.length} payments</td><td class="num">${esc(fmt(tot))}</td><td colspan="2"></td></tr>` });
  const body = `<div class="row" style="margin-bottom:12px"><span>Payment run <b>${esc(RUN_ID)}</b></span><span class="sp"></span>
      <span>Available balance <b>${esc(qar(1284560.40))}</b> <span class="caption">live from CBQ · 10:42 AST</span></span></div>
    ${tbl}
    <div class="row" style="margin-top:14px"><span class="caption">Also works for single manual payments posted with F-53. Cut-off for same-day domestic transfers: 13:30 AST.</span><span class="sp"></span>
      ${s.sent ? pill(`Batch ${BATCH_ID} submitted by maker`, "ok") : btn("Send to CBQ", "send", { kind: "primary", ic: "send", disabled: !sel.length })}</div>`;
  return stepHead(s, "pay", "A maker sends the SAP payment run to CBQ",
    "Vendor payments from the normal F110 run go to CBQ from inside SAP. No files to download, upload or re-key. The cockpit pre-checks duplicates, IBANs and cut-off before anything leaves SAP.", s.sent) +
    kpis([
      { label: "Payments in run", value: String(s.pays.length), ic: "list", caption: "Proposal ALN01" },
      { label: "Selected value", value: qar(tot, 0), ic: "banknote", caption: `${sel.length} selected` },
      { label: "Need CBQ approval", value: String(sel.filter(needsOtp).length), ic: "key-round", caption: `Above STP limit ${qar(STP_LIMIT, 0)}` },
      { label: "Pre-check flags", value: "1", ic: "copy", caption: "Duplicate held back" },
    ]) +
    `<div data-tour="pay-run">${surface({ product: "SAP S/4HANA", screen: "CBQ Banking cockpit · maker", chip: "F.HADDAD · maker", body })}</div>`;
}

function release(s) {
  if (!s.sent) return stepHead(s, "release", "Segregation of duties in SAP, final authority at CBQ", "", false) + waitFor("Send the payment run in step 4 first.", "pay", "Go to step 4");
  const sel = selected(s), otpList = sel.filter(needsOtp), stp = sel.filter((p) => !needsOtp(p));
  const body = `<ul class="checks">
      ${check(`Maker: F.HADDAD sent batch ${BATCH_ID} (${sel.length} payments, ${qar(total(sel))})`, "ok", "10:44")}
      ${check(`Checker in SAP: M.NASSER ${s.released ? "released the batch" : "to review and release"}`, s.released ? "ok" : "wait")}
      ${check(`CBQ approval: ${s.otp ? "OTP confirmed by CBQ" : `${otpList.length} payments above STP limit, CBQ asks for OTP`}`, s.otp ? "ok" : s.released ? "wait" : "")}</ul>
    <div class="grid g2" style="margin-top:16px">
      <div class="glass section"><div class="section-head">${icon("zap")}<h3 class="section-title">Straight-through · ${stp.length}</h3><span class="sp"></span><b>${esc(qar(total(stp)))}</b></div>
        <p class="caption">Below the customer’s STP limit of ${esc(qar(STP_LIMIT, 0))}. Released on checker approval.</p></div>
      <div class="glass section"><div class="section-head">${icon("key-round")}<h3 class="section-title">CBQ approval · ${otpList.length}</h3><span class="sp"></span><b>${esc(qar(total(otpList)))}</b></div>
        <p class="caption">${otpList.map((p) => esc(p.vendor)).join(", ")}</p></div></div>
    <div class="row" style="margin-top:14px"><span class="sp"></span>
      ${!s.released ? btn("Release as checker", "release", { kind: "primary", ic: "user-check" }) : ""}
      ${s.released && !s.otp ? btn("Approve with CBQ OTP", "openOtp", { kind: "primary", ic: "key-round" }) : ""}
      ${s.otp ? pill("Approved, CBQ is processing", "ok") : ""}</div>`;
  return stepHead(s, "release", "Segregation of duties in SAP, final authority at CBQ",
    "SAP maker-checker runs first. CBQ stays the system of record for authorisation: limits, mandates, OTP or Net Banking approval are CBQ’s own controls, reused, not rebuilt.", s.otp) +
    `<div data-tour="release">${surface({ product: "SAP S/4HANA", screen: "CBQ Banking cockpit · checker", chip: "M.NASSER · checker", body })}</div>` +
    note("Payments under the customer’s STP threshold go straight through. Others are approved with a CBQ OTP or in CBQ Net Banking. The platform never decides an approval itself.");
}

function status(s) {
  if (!s.otp) return stepHead(s, "status", "Status and bank reference flow back to SAP", "", false) + waitFor("Complete approvals in step 5 first.", "release", "Go to step 5");
  const list = lifecycle(s), done = s.progress >= 5;
  const tbl = table([
    { h: "Document", r: (p) => `<span class="ref">${esc(p.doc)}</span>` }, { h: "Vendor", k: "vendor" },
    { h: "Amount", num: true, r: (p) => esc(fmt(p.amt)) },
    { h: "Lifecycle", r: (p) => `<div class="life" aria-label="${esc(p.status)}">${LIFE.map((_, k) => `<i class="${p.bad && k === p.stage ? "bad" : k < p.stage || (k === p.stage && p.stage >= 4) ? "on" : k === p.stage ? "cur" : ""}"></i>`).join("")}</div>` },
    { h: "Status", r: (p) => pill(p.status, p.bad ? "bad" : p.status === "Completed" ? "ok" : "warn") },
    { h: "Bank reference / reason", r: (p) => `<span class="ref">${esc(p.ref)}</span>` },
  ], list);
  const nDone = list.filter((p) => p.status === "Completed").length, nBad = list.filter((p) => p.bad).length;
  const body = `${tbl}
    <div class="row" style="margin-top:14px"><span class="caption">Stages: ${LIFE.join(" → ")}. Polled every 60 s; event push used where CBQ offers it.</span><span class="sp"></span>
      ${done ? pill("All statuses written back to SAP documents", "ok") : btn("Refresh status from CBQ", "tick", { kind: "primary", ic: "refresh-cw" })}</div>
    ${nBad ? note(`<b>${esc(REJECT.code)} · ${esc(REJECT.text)}.</b> ${esc(REJECT.action)}`, "") : ""}`;
  return stepHead(s, "status", "Status and bank reference flow back to the SAP document",
    "The platform tracks each payment through one state machine and writes the outcome to the original voucher. A rejection comes back with CBQ’s reason code.", done) +
    kpis([
      { label: "Completed", value: String(nDone), ic: "circle-check", caption: "Bank reference on document" },
      { label: "In progress", value: String(list.length - nDone - nBad), ic: "loader", caption: "At CBQ or approval" },
      { label: "Rejected", value: String(nBad), ic: "circle-x", caption: "Reason code mapped" },
      { label: "Refresh cycles", value: `${s.progress} / 5`, ic: "refresh-cw", caption: "Demo time-lapse" },
    ]) +
    `<div data-tour="status">${surface({ product: "SAP S/4HANA", screen: "CBQ Banking cockpit · status", chip: "Visible in FBL1N", body })}</div>`;
}

export function otpModal() {
  return `<div class="modal-back" role="dialog" aria-modal="true" aria-labelledby="otpT"><div class="modal">
    <div class="eyebrow">CBQ Connected Banking</div><h3 id="otpT">CBQ approval</h3>
    <p class="muted">CBQ sent a one-time password to the registered mobile of M.NASSER (+974 •••• 4417) for batch ${esc(BATCH_ID)}. Demo code pre-filled.</p>
    <div class="otp">${"482916".split("").map((d, i) => `<input value="${d}" inputmode="numeric" maxlength="1" aria-label="Digit ${i + 1}">`).join("")}</div>
    <div class="row"><span class="caption">Expires in 02:59</span><span class="sp"></span>${btn("Cancel", "otpCancel")}${btn("Confirm", "otpOk", { kind: "primary", ic: "check" })}</div></div></div>`;
}

export const pages = [
  { id: "pay", render: pay, persona: "maker" },
  { id: "release", render: release, persona: "checker" },
  { id: "status", render: status, persona: "maker" },
];

export const modals = { otp: otpModal };

export const actions = {
  togglePay: (s, d) => ({ ...s, pays: s.pays.map((p, i) => (i === Number(d.i) ? { ...p, sel: !p.sel } : p)) }),
  send: (s) => {
    const n = selected(s).length;
    return pipe({ ...s, sent: true, cid: newCid() },
      (x) => withDone(x, "pay"),
      (x) => withAudit(x, "F.HADDAD (maker)", `Sent batch ${BATCH_ID}, ${n} payments`),
      (x) => withTrace(x, "SAP add-on → CBQ API gateway", `POST /v1/payment-batches (${n} payments)`, "Signed payload, idempotency key per document", [0, 1]),
      (x) => withTrace(x, "Payment orchestrator", "Schema, entitlement, duplicate and cut-off checks passed", "Idempotency keys stored before any CBQ call", [2, 3]));
  },
  release: (s) => pipe({ ...s, released: true },
    (x) => withAudit(x, "M.NASSER (checker)", `Released batch ${BATCH_ID} in SAP`),
    (x) => withTrace(x, "SAP add-on → Connector hub", "Checker release recorded", "SAP maker and checker are different users", [0, 2]),
    (x) => withTrace(x, "CBQ API adapter → CBQ", "Bulk payment submitted", "202 Accepted; 2 items need approval: above STP limit", [2, 4])),
  openOtp: (s) => withUi(s, { modal: "otp" }),
  otpCancel: (s) => withUi(s, { modal: null }),
  otpOk: (s) => pipe(withUi({ ...s, otp: true }, { modal: null, toast: "Approved with CBQ OTP" }),
    (x) => withDone(x, "release"),
    (x) => withAudit(x, "M.NASSER (checker)", `Approved ${BATCH_ID} with CBQ OTP`),
    (x) => withTrace(x, "SAP add-on → CBQ (via platform)", "OTP verified by CBQ", "CBQ is the system of record for authorisation", [0, 2, 4])),
  tick: (s) => {
    const p = s.progress + 1;
    let x = { ...s, progress: p };
    if (p === 1) x = withTrace(x, "CBQ → Status engine", `Status events received for ${BATCH_ID}`, "Polled every 60 s", [4, 2]);
    if (p === 3) x = withTrace(x, "CBQ → Status engine", `1 payment rejected: ${REJECT.code} ${REJECT.text}`, "Reason code mapped and sent to SAP", [4, 2]);
    if (p >= 5) {
      x = pipe(x, (y) => withDone(y, "status"),
        (y) => withAudit(y, "Platform", "Wrote status and bank references to SAP documents"),
        (y) => withTrace(y, "Connector hub → SAP add-on", "Status and bank references written back", `${selected(s).length - 1} completed, 1 rejected`, [2, 1, 0]));
    }
    return x;
  },
};

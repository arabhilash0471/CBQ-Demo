// Immutable demo state store. Every change returns a new state object.
import { PAYMENT_RUN } from "./data/payments.js";
import { ONBOARD_ACCOUNTS } from "./data/customers.js";

/** @typedef {{t:string, hop:string, msg:string, detail:string, zones:number[], id:number}} TraceEntry */

export const ZONES = ["Customer SAP", "CBQ API gateway", "Platform (CBQ cloud)", "CBQ data zone", "CBQ Connected Banking"];

export const freshState = () => Object.freeze({
  onboard: { status: "draft", accounts: ONBOARD_ACCOUNTS.map((a) => a.defaultOn), services: { bal: true, stmt: true, dom: true, bulk: true, status: true } },
  approval: 0,            // 0 pending, 1 approved by maker officer, 2 authorised by checker officer
  activated: false,
  testOk: false,
  pays: PAYMENT_RUN.map((p) => ({ ...p, sel: !p.dupHint, stage: -1, status: "Proposed", ref: "", bad: false })),
  sent: false,
  released: false,
  otp: false,
  progress: 0,
  stmt: false,
  recon: false,
  exceptions: { charge: false },
  offboard: false,
  wps: 0,                 // extra scenarios: 0..3
  intl: 0,                // 0..6 (quote, book, approve, gpi stages)
  cxlA: 0,
  cxlB: 0,
  cid: "",
  log: [],
  audit: [],
  done: {},
  ui: { arch: null, archPath: false, modal: null, toast: null, secTab: "controls", apiSel: 0, dashTab: "customer", faqCat: "All", planTab: "gantt", tour: null },
  seq: 0,
});

let current = freshState();
const listeners = new Set();

export const getState = () => current;

export function setState(next) {
  current = Object.freeze(next);
  listeners.forEach((fn) => fn(current));
}

/** Replace state without notifying listeners (for housekeeping such as clearing a shown toast). */
export function replaceState(next) { current = Object.freeze(next); }

export const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

const clock = () => new Date().toTimeString().slice(0, 8);

export function newCid() {
  const h = "0123456789abcdef";
  const out = [];
  for (let i = 0; i < 32; i++) {
    out.push(h[Math.floor(Math.random() * 16)]);
    if ([7, 11, 15, 19].includes(i)) out.push("-");
  }
  return out.join("");
}

/** Returns a new state with one trace entry prepended. */
export function withTrace(s, hop, msg, detail = "", zones = []) {
  const entry = { t: clock(), hop, msg, detail, zones, id: s.seq + 1 };
  return { ...s, seq: s.seq + 1, log: [entry, ...s.log].slice(0, 80) };
}

export function withAudit(s, actor, action) {
  return { ...s, audit: [{ t: clock(), actor, action }, ...s.audit].slice(0, 80) };
}

export const withDone = (s, id) => ({ ...s, done: { ...s.done, [id]: true } });
export const withUi = (s, patch) => ({ ...s, ui: { ...s.ui, ...patch } });
export const ensureCid = (s) => (s.cid ? s : { ...s, cid: newCid() });

/** Apply several state transforms in order. */
export const pipe = (s, ...fns) => fns.reduce((acc, fn) => fn(acc), s);

// Shared pieces for the eight walkthrough steps.
import { esc, icon, pageHead } from "../ui.js";

export const STEPS = [
  { id: "onboard", n: 1, title: "Customer registers", who: "Customer onboarding portal", ic: "user-plus" },
  { id: "approve", n: 2, title: "CBQ approves", who: "CBQ administration portal", ic: "stamp" },
  { id: "activate", n: 3, title: "Connector activated", who: "Inside SAP", ic: "plug" },
  { id: "pay", n: 4, title: "Payment run sent", who: "Inside SAP · maker", ic: "send" },
  { id: "release", n: 5, title: "Checker and CBQ approval", who: "SAP checker, CBQ OTP", ic: "shield-check" },
  { id: "status", n: 6, title: "Status written back", who: "Inside SAP", ic: "refresh-cw" },
  { id: "recon", n: 7, title: "Statements and reconciliation", who: "Platform and SAP", ic: "scale" },
  { id: "ops", n: 8, title: "CBQ operations view", who: "CBQ operations console", ic: "monitor" },
];

const nextOf = (id) => {
  const i = STEPS.findIndex((s) => s.id === id);
  return i >= 0 && i < STEPS.length - 1 ? STEPS[i + 1] : null;
};
const prevOf = (id) => {
  const i = STEPS.findIndex((s) => s.id === id);
  return i > 0 ? STEPS[i - 1] : null;
};

export function stepper(s, cur) {
  return `<nav class="stepper" aria-label="Walkthrough progress">${STEPS.map((st) =>
    `<a href="#${st.id}" class="${s.done[st.id] ? "done" : ""}" ${st.id === cur ? 'aria-current="step"' : ""}><b>${st.n}</b>${esc(st.title)}</a>`).join("")}</nav>`;
}

/** Page header for a step: eyebrow, title, description, prev/next. */
export function stepHead(s, id, title, desc, canNext) {
  const st = STEPS.find((x) => x.id === id);
  const nx = nextOf(id), pv = prevOf(id);
  const actions = `${pv ? `<a class="btn" href="#${pv.id}">${icon("arrow-left")}Back</a>` : ""}
    ${nx ? `<a class="btn ${canNext ? "primary" : ""}" href="#${nx.id}">Next: ${esc(nx.title)}${icon("arrow-right")}</a>` : `<a class="btn primary" href="#dashboards">Dashboards${icon("arrow-right")}</a>`}`;
  return stepper(s, id) + pageHead({
    eyebrow: `Walkthrough · step ${st.n} of 8 · ${st.who}`,
    title,
    desc,
    actions,
  });
}

export const waitFor = (msg, href, label) =>
  `<section class="glass section"><div class="row">${icon("lock")}<span class="muted">${esc(msg)}</span><span class="sp"></span><a class="btn" href="#${esc(href)}">${esc(label)}</a></div></section>`;

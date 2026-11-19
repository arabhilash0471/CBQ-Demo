// Shared header for the extra scenarios (beyond the eight-step walkthrough).
import { esc, icon, pageHead, pill } from "../ui.js";

// Balance and limits is Phase 1 and shown in the session; the rest are "if asked" screens.
export const SCENARIOS = [
  { id: "limits", title: "Balance and limits", sub: "Pre-check from SAP", ic: "gauge", scope: "Phase 1" },
  { id: "wps", title: "WPS payroll", sub: "Bulk salary file", ic: "users-round", scope: "Priced option" },
  { id: "intl", title: "International payment", sub: "SWIFT with FX quote", ic: "globe", scope: "Priced option" },
  { id: "recall", title: "Cancel and recall", sub: "Stop or reverse a payment", ic: "undo-2", scope: "Subject to CBQ API" },
];

export const isPhase1 = (sc) => sc.scope === "Phase 1";
/** Sidebar subtitle: scope first, so "if asked" screens are obvious in the nav. */
export const navSub = (sc) => (isPhase1(sc) ? `Phase 1 · ${sc.sub}` : `If asked · ${sc.scope}`);

const IF_ASKED = {
  "Priced option": "Shown if asked. A priced option on top of Phase 1, not part of the Phase 1 scope.",
  "Subject to CBQ API": "Shown if asked. Depends on the APIs CBQ offers for it; listed in the clarification log.",
};

/** Page header with scope pill and links to the other scenarios. */
export function scenarioHead(id, title, desc) {
  const sc = SCENARIOS.find((x) => x.id === id);
  const others = SCENARIOS.map((x) => `<a href="#${esc(x.id)}" ${x.id === id ? 'aria-current="step"' : ""}>${icon(x.ic)}${esc(x.title)}</a>`).join("");
  const banner = isPhase1(sc) ? "" : `<div class="scope-banner" role="note">${icon("tag")}<b>${esc(sc.scope)}</b><span>${esc(IF_ASKED[sc.scope])}</span></div>`;
  return `<nav class="stepper s4" aria-label="More scenarios">${others}</nav>` + banner +
    pageHead({
      eyebrow: `More scenarios · ${isPhase1(sc) ? "Phase 1" : "If asked"} · ${sc.sub}`,
      title,
      desc,
      actions: pill(sc.scope, isPhase1(sc) ? "gold" : "warn", isPhase1(sc) ? "check" : "tag"),
    });
}

/** Horizontal stage tracker. stages: [[title, detail, time?]], at: index reached (-1 none). */
export function tracker(stages, at, { bad = -1 } = {}) {
  return `<ol class="tracker">${stages.map(([t, d, tm], i) => {
    const cls = i === bad ? "bad" : i <= at ? "on" : i === at + 1 ? "cur" : "";
    return `<li class="${cls}"><span class="dot">${icon(i === bad ? "x" : i <= at ? "check" : "circle")}</span><b>${esc(t)}</b><small>${esc(d)}${tm && i <= at ? ` · ${esc(tm)}` : ""}</small></li>`;
  }).join("")}</ol>`;
}

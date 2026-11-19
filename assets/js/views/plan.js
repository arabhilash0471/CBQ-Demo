// Implementation approach and timelines.
import { esc, icon, pill, section, table, kpis, pageHead } from "../ui.js";
import { withUi } from "../state.js";
import { GANTT, MILESTONES, TEAM, GOVERNANCE, RAID, DEPENDENCIES, ROADMAP, CERT_PATH } from "../data/delivery.js";

function gantt() {
  const head = `<div class="h" style="text-align:left">Workstream</div>` + Array.from({ length: 9 }, (_, i) => `<div class="h">M${i + 1}</div>`).join("");
  const rows = GANTT.map((r) => `<div class="lab">${esc(r.name)}<small>${esc(r.sub)}</small></div>` +
    Array.from({ length: 9 }, (_, i) => {
      const m = i + 1, on = m >= r.s && m <= r.e;
      return `<div class="bar ${r.cbq ? "cbq" : ""}">${on ? `<i class="${m === r.s ? "s " : ""}${m === r.e ? "e" : ""}" title="${esc(r.name)}"></i>` : ""}</div>`;
    }).join("")).join("");
  const ms = `<div class="lab">Milestones</div>` + Array.from({ length: 9 }, (_, i) => {
    const xs = MILESTONES.filter((z) => z.m === i + 1);
    return `<div class="bar ms">${xs.length ? `<i title="${esc(xs.map((x) => `${x.id} ${x.name}`).join(", "))}"></i>` : ""}</div>`;
  }).join("");
  return `<div class="table-wrap"><div class="gantt">${head}${rows}${ms}</div></div>
    <div class="legend"><span><i style="background:var(--chart-1)"></i>Innoval</span><span><i style="background:var(--chart-2)"></i>CBQ-led</span><span><i style="border:2px solid var(--success)"></i>Milestone</span></div>`;
}

function plan(s) {
  const tab = s.ui.planTab;
  const tabs = `<div class="tabs" role="tablist">${[["gantt", "Timeline"], ["team", "Team and governance"], ["raid", "RAID log"], ["roadmap", "Further ERPs"]]
    .map(([k, l]) => `<button class="tab" role="tab" aria-selected="${tab === k}" data-a="planTab" data-k="${k}">${esc(l)}</button>`).join("")}</div>`;
  const msTbl = table([{ h: "Milestone", r: (m) => `<b>${esc(m.id)}</b> ${esc(m.name)}` }, { h: "Month", k: "when", num: true }, { h: "Exit criteria", r: (m) => `<span class="muted">${esc(m.exit)}</span>` }, { h: "Signed off by", k: "by" }], MILESTONES);
  const body = {
    gantt: section({ title: "Phase 1 in nine months", ic: "calendar-range", body: gantt(), caption: "Assumes CBQ API specifications and sandbox at kickoff." }) +
      `<div style="margin-top:12px">${section({ title: "Milestones and sign-off", ic: "flag", body: msTbl })}</div>
       <div style="margin-top:12px">${section({ title: "What Phase 1 needs from CBQ", ic: "handshake", body: table([{ h: "Dependency", k: 0 }, { h: "Needed by", r: (d) => pill(d[1], "gold", "calendar") }], DEPENDENCIES) })}</div>`,
    team: `<div class="grid g2">${section({ title: "Delivery team", ic: "users", body: table([{ h: "Role", k: "role" }, { h: "Count", k: "n", num: true }, { h: "Where", r: (t) => `<span class="muted">${esc(t.where)}</span>` }], TEAM), caption: "RACI and full team structure in the proposal." })}
      ${section({ title: "Governance", ic: "landmark", body: table([{ h: "Forum", r: (g) => `<b>${esc(g.forum)}</b>` }, { h: "Cadence", k: "cadence" }, { h: "Covers", r: (g) => `<span class="muted">${esc(g.covers)}</span>` }], GOVERNANCE) })}</div>`,
    raid: section({ title: "RAID log (live during delivery)", ic: "triangle-alert", body: table([
      { h: "ID", r: (r) => `<span class="ref">${esc(r.id)}</span>` }, { h: "Type", k: "type" }, { h: "Item", k: "text" }, { h: "Impact", k: "impact" },
      { h: "Owner", k: "owner" }, { h: "Mitigation", r: (r) => `<span class="muted">${esc(r.mit)}</span>` },
      { h: "RAG", r: (r) => pill(r.rag === "ok" ? "On track" : "Watch", r.rag) }], RAID) }),
    roadmap: section({ title: "Every other ERP, through one certified path", ic: "route", body:
      `<div class="grid g4">${CERT_PATH.map(([t, d, ic], i) => `<div class="glass card"><div class="kicker">Step ${i + 1}</div><h3>${icon(ic)}${esc(t)}</h3><p>${esc(d)}</p></div>`).join("")}</div>
       <div style="margin-top:16px">${table([{ h: "ERP", r: (r) => `<b>${esc(r.erp)}</b>` }, { h: "Pattern", k: "pattern" }, { h: "Lead time", k: "lead" }, { h: "Customers waiting", num: true, r: (r) => `<span class="count">${esc(r.demand)}</span>` }], ROADMAP)}</div>`,
      caption: "Fixed unit prices in the commercial proposal. Connectors can run in parallel with Phase 1." }),
  }[tab];
  return pageHead({ eyebrow: "Platform · implementation approach", title: "Phase 1 live in month 8, hypercare exit in month 9",
    desc: "Phase 1 delivers the hub and the SAP connector. Additional ERP connectors follow on CBQ’s order: about 2 to 3 months each, on the same SDK and test kit." }) +
    kpis([
      { label: "Go-live", value: "Month 8", ic: "rocket" }, { label: "Hypercare exit", value: "Month 9", ic: "badge-check" },
      { label: "Delivery team", value: "10", ic: "users", caption: "Incl. independent pen-tester" }, { label: "Milestones", value: "M2–M9", ic: "flag", caption: "Proposal Section 13.2" },
    ]) + tabs + `<div data-tour="plan">${body}</div>`;
}

export const pages = [{ id: "plan", render: plan }];
export const actions = { planTab: (s, d) => withUi(s, { planTab: d.k }) };

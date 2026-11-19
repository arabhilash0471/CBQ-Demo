// Customer value: time and cost a corporate finance team saves. Corporate side only, by design:
// CBQ's commercial case sits in the commercial proposal, which is evaluated separately.
import { esc, section, kpis, qarShort, int, note } from "../ui.js";
import { hbars } from "../charts.js";

/** Slider definitions: key, label, min, max, step, formatter. */
const INPUTS = [
  { k: "customers", l: "Corporates connected", min: 5, max: 200, step: 5, f: (v) => int(v) },
  { k: "paysPerMonth", l: "Payments per corporate per month", min: 50, max: 2000, step: 10, f: (v) => int(v) },
  { k: "manualMin", l: "Manual minutes per payment today", min: 2, max: 20, step: 0.5, f: (v) => `${v} min` },
  { k: "staffCost", l: "Finance staff cost per hour (QAR)", min: 50, max: 400, step: 10, f: (v) => `QAR ${int(v)}` },
  { k: "errPct", l: "Payments needing manual correction today (%)", min: 0, max: 5, step: 0.1, f: (v) => `${v.toFixed(1)}%` },
  { k: "fixMin", l: "Minutes to fix one error", min: 10, max: 120, step: 5, f: (v) => `${v} min` },
];

const PRESETS = {
  conservative: { customers: 20, paysPerMonth: 180, manualMin: 4, staffCost: 110, errPct: 0.8, fixMin: 30 },
  base: { customers: 60, paysPerMonth: 320, manualMin: 6, staffCost: 140, errPct: 1.2, fixMin: 45 },
  ambitious: { customers: 120, paysPerMonth: 600, manualMin: 8, staffCost: 180, errPct: 1.8, fixMin: 60 },
};

const AUTO_SHARE = 0.85;     // share of manual handling removed (export, upload, re-key status, match)
const ERR_AFTER_PCT = 0.1;   // residual correction rate with validated, straight-from-ERP payments
const FTE_HOURS = 1800;      // working hours in a finance FTE year

let vals = { ...PRESETS.base };
let preset = "base";

/** Pure model: yearly savings per corporate and across all connected corporates. */
export function model(v) {
  const pays = v.paysPerMonth * 12;
  const handling = (pays * v.manualMin * AUTO_SHARE) / 60;
  const errors = (pays * Math.max(v.errPct - ERR_AFTER_PCT, 0)) / 100;
  const fixing = (errors * v.fixMin) / 60;
  const hours = handling + fixing;
  return {
    per: { pays, handling, fixing, hours, cost: hours * v.staffCost, errors, fte: hours / FTE_HOURS },
    all: { hours: hours * v.customers, cost: hours * v.staffCost * v.customers, errors: errors * v.customers, fte: (hours / FTE_HOURS) * v.customers },
  };
}

function output() {
  const { per, all } = model(vals);
  return kpis([
    { label: "Hours saved per corporate", value: int(Math.round(per.hours)), ic: "timer", caption: "Per year" },
    { label: "Saving per corporate", value: qarShort(per.cost), ic: "piggy-bank", caption: "Per year, staff time" },
    { label: "Errors avoided per corporate", value: int(Math.round(per.errors)), ic: "shield-check", caption: "Per year" },
    { label: "Across all corporates", value: qarShort(all.cost), ic: "building-2", caption: `${int(Math.round(all.hours))} hours · ${all.fte.toFixed(1)} FTE a year` },
  ]) + `<div class="grid g2">
    ${section({ title: "Where a corporate’s hours go back (per year)", ic: "bar-chart-3", body: hbars([
      { label: "Export, upload and re-key removed", value: Math.round(per.handling) },
      { label: "Error correction avoided", value: Math.round(per.fixing) }], { fmt: (v) => `${int(v)} h` }) })}
    ${section({ title: "By size of corporate (per year)", ic: "table", body: `<div class="table-wrap"><table>
      <thead><tr><th>Payments a month</th><th class="num">Hours saved</th><th class="num">Saving</th><th class="num">FTE</th></tr></thead>
      <tbody>${[100, 300, 1000].map((n) => { const r = model({ ...vals, paysPerMonth: n }).per; return `<tr><td>${int(n)}</td><td class="num">${int(Math.round(r.hours))}</td><td class="num">${esc(qarShort(r.cost))}</td><td class="num">${r.fte.toFixed(2)}</td></tr>`; }).join("")}</tbody></table></div>` })}
  </div>`;
}

const slider = (d) => `<label class="slider"><span class="row"><span class="flabel">${esc(d.l)}</span><span class="sp"></span><output id="out-${d.k}">${esc(d.f(vals[d.k]))}</output></span>
  <input type="range" data-k="${d.k}" min="${d.min}" max="${d.max}" step="${d.step}" value="${vals[d.k]}" aria-label="${esc(d.l)}"></label>`;

function roi() {
  const presets = Object.keys(PRESETS).map((k) => `<button type="button" class="chip-btn" data-preset="${k}" aria-pressed="${preset === k}">${esc(k[0].toUpperCase() + k.slice(1))}</button>`).join("");
  return `<div class="page-head"><div class="txt"><div class="eyebrow">Insights · customer value</div>
      <h1 class="page-title">What corporate finance teams get back</h1>
      <p class="page-desc">Move the assumptions to see the time and cost a corporate saves when payments, status and reconciliation run from inside SAP instead of exporting, uploading and re-keying.</p></div>
    <div class="page-actions"><div class="chips" role="group" aria-label="Scenario">${presets}</div></div></div>
    <div class="stack">
      ${section({ title: "Assumptions", ic: "sliders-horizontal", body: `<div class="sliders">${INPUTS.map(slider).join("")}</div>
        <p class="caption" style="margin-top:12px">Fixed: ${Math.round(AUTO_SHARE * 100)}% of manual handling removed, residual correction rate ${ERR_AFTER_PCT}%, ${int(FTE_HOURS)} hours in a finance FTE year.</p>` })}
      <div id="roiOut" data-tour="roi">${output()}</div>
    </div>` +
    note("Illustrative, corporate side only. CBQ’s commercial case is covered in the commercial proposal, which is evaluated separately.", "info");
}

function mountRoi(root) {
  const out = root.querySelector("#roiOut");
  if (!out) return;
  const repaint = () => { out.innerHTML = output(); if (window.lucide) window.lucide.createIcons(); };
  const syncInputs = () => INPUTS.forEach((d) => {
    const el = root.querySelector(`input[data-k="${d.k}"]`);
    if (el) el.value = vals[d.k];
    const o = root.querySelector(`#out-${d.k}`);
    if (o) o.textContent = d.f(vals[d.k]);
  });
  root.querySelectorAll('input[type="range"][data-k]').forEach((el) => el.addEventListener("input", () => {
    const d = INPUTS.find((x) => x.k === el.dataset.k);
    const v = Number(el.value);
    if (!d || !Number.isFinite(v)) return;
    vals = { ...vals, [d.k]: Math.min(d.max, Math.max(d.min, v)) };
    preset = "";
    root.querySelector(`#out-${d.k}`).textContent = d.f(vals[d.k]);
    root.querySelectorAll("[data-preset]").forEach((b) => b.setAttribute("aria-pressed", "false"));
    repaint();
  }));
  root.querySelectorAll("[data-preset]").forEach((b) => b.addEventListener("click", () => {
    preset = b.dataset.preset;
    vals = { ...PRESETS[preset] };
    root.querySelectorAll("[data-preset]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    syncInputs();
    repaint();
  }));
}

export const pages = [{ id: "roi", render: roi, mount: mountRoi, persona: "panel" }];
export const actions = {};

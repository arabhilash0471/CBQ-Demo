// Inline-SVG charts. Tooltips via [data-tip] handled by a delegated listener in main.js.
import { esc, int } from "./ui.js";

const C = (i) => `var(--chart-${(i % 6) + 1})`;

/** Round an axis maximum up to a clean step so ticks read 0, 250, 500… */
function niceMax(v, steps = 4) {
  const raw = v / steps, mag = 10 ** Math.floor(Math.log10(raw || 1));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((m) => m >= raw) || raw;
  return step * steps;
}

const legend = (series) =>
  `<div class="chart-legend">${series.map((s, i) => `<span><i style="background:${C(s.ci ?? i)}"></i>${esc(s.name)}</span>`).join("")}</div>`;

/** Stacked bar chart. data: [{label, ...keys}], series: [{key, name}] */
export function stackedBars(data, series, { h = 220, fmt = int } = {}) {
  const W = 640, pad = { l: 44, r: 8, t: 10, b: 26 };
  const max = niceMax(Math.max(...data.map((d) => series.reduce((a, s) => a + d[s.key], 0))));
  const bw = (W - pad.l - pad.r) / data.length;
  const y = (v) => pad.t + (h - pad.t - pad.b) * (1 - v / max);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));
  const grid = ticks.map((t) => `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(t)}" y2="${y(t)}"/>`).join("");
  const yl = ticks.map((t) => `<text x="${pad.l - 6}" y="${y(t) + 4}" text-anchor="end">${esc(fmt(t))}</text>`).join("");
  const bars = data.map((d, i) => {
    let acc = 0;
    const x = pad.l + i * bw + bw * 0.18;
    const rects = series.map((s, si) => {
      const v = d[s.key];
      const r = `<rect x="${x}" y="${y(acc + v)}" width="${bw * 0.64}" height="${Math.max(0, y(acc) - y(acc + v))}" fill="${C(s.ci ?? si)}" rx="2" data-tip="${esc(`${d.label} · ${s.name}: ${fmt(v)}`)}"/>`;
      acc += v;
      return r;
    }).join("");
    const lab = i % 2 === 0 ? `<text x="${x + bw * 0.32}" y="${h - 8}" text-anchor="middle">${esc(d.label)}</text>` : "";
    return rects + lab;
  }).join("");
  return `<div class="chart"><svg viewBox="0 0 ${W} ${h}" role="img" aria-label="Stacked bar chart"><g class="grid">${grid}</g><g class="axis">${yl}</g>${bars}</svg>${legend(series)}</div>`;
}

/** Line / area chart. series: [{key, name, area}] */
export function lines(data, series, { h = 200, fmt = int, area = false } = {}) {
  const W = 640, pad = { l: 52, r: 8, t: 10, b: 26 };
  const vals = data.flatMap((d) => series.map((s) => d[s.key]));
  const vmin = Math.min(...vals), vmax = Math.max(...vals);
  const lo = vmin < 0 ? vmin : area ? vmin * 0.9 : 0;
  // One step for both ends, so the axis always contains every value (including mixed-sign series).
  const ystep = niceMax(Math.max(vmax - lo, 1), 4) / 4;
  const min = lo ? Math.floor(lo / ystep) * ystep : 0;
  const max = Math.max(Math.ceil(vmax / ystep) * ystep, min + ystep);
  const x = (i) => pad.l + (W - pad.l - pad.r) * (i / (data.length - 1));
  const y = (v) => pad.t + (h - pad.t - pad.b) * (1 - (v - min) / (max - min));
  const ticks = [0, 0.5, 1].map((f) => min + (max - min) * f);
  const zero = min < 0 && max > 0 && !ticks.includes(0) ? [0] : [];
  const grid = [...ticks, ...zero].map((t) => `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(t)}" y2="${y(t)}"/>`).join("");
  const yl = [...ticks, ...zero].map((t) => `<text x="${pad.l - 6}" y="${y(t) + 4}" text-anchor="end">${esc(fmt(t))}</text>`).join("");
  const step = Math.ceil(data.length / 7);
  const xl = data.map((d, i) => (i % step === 0 ? `<text x="${x(i)}" y="${h - 8}" text-anchor="middle">${esc(d.label)}</text>` : "")).join("");
  const paths = series.map((s, si) => {
    const pts = data.map((d, i) => `${x(i).toFixed(1)},${y(d[s.key]).toFixed(1)}`);
    const fill = area && si === 0 ? `<path d="M${pts[0]} L${pts.join(" L")} L${x(data.length - 1)},${y(Math.max(min, 0))} L${x(0)},${y(Math.max(min, 0))} Z" fill="${C(si)}" opacity="0.12"/>` : "";
    const dots = data.map((d, i) => `<circle cx="${x(i)}" cy="${y(d[s.key])}" r="6" fill="transparent" data-tip="${esc(`${d.label} · ${s.name}: ${fmt(d[s.key])}`)}"/>`).join("");
    return `${fill}<path d="M${pts.join(" L")}" fill="none" stroke="${C(si)}" stroke-width="2.2" stroke-linejoin="round"/>${dots}`;
  }).join("");
  return `<div class="chart"><svg viewBox="0 0 ${W} ${h}" role="img" aria-label="Line chart"><g class="grid">${grid}</g><g class="axis">${yl}${xl}</g>${paths}</svg>${legend(series)}</div>`;
}

/** Donut chart with legend. data: [{label, value}] */
export function donut(data, { size = 180, center = "", sub = "" } = {}) {
  const total = data.reduce((a, d) => a + d.value, 0);
  const r = 70, cx = 90, cy = 90, sw = 22, circ = 2 * Math.PI * r;
  let off = 0;
  const arcs = data.map((d, i) => {
    const len = (d.value / total) * circ;
    const a = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C(i)}" stroke-width="${sw}" stroke-dasharray="${len - 2} ${circ - len + 2}" stroke-dashoffset="${-off}" transform="rotate(-90 ${cx} ${cy})" data-tip="${esc(`${d.label}: ${d.value} (${Math.round((d.value / total) * 100)}%)`)}"/>`;
    off += len;
    return a;
  }).join("");
  return `<div class="chart" style="display:flex;gap:20px;align-items:center;flex-wrap:wrap">
    <svg viewBox="0 0 180 180" style="width:${size}px;flex:none" role="img" aria-label="Donut chart">${arcs}
      <text x="90" y="92" text-anchor="middle" style="font:600 28px var(--font-display);fill:var(--foreground)">${esc(center)}</text>
      <text x="90" y="112" text-anchor="middle" style="font:500 10px var(--font-sans);letter-spacing:.08em;fill:var(--muted-foreground)">${esc(sub)}</text></svg>
    <div class="chart-legend" style="flex-direction:column;gap:8px;margin:0">${data.map((d, i) => `<span><i style="background:${C(i)}"></i>${esc(d.label)} <b style="color:var(--foreground);margin-left:4px">${esc(d.value)}</b></span>`).join("")}</div></div>`;
}

/** Horizontal bars. data: [{label, value}] */
export function hbars(data, { fmt = int, ci = 0 } = {}) {
  const max = Math.max(...data.map((d) => d.value));
  return `<div class="chart" style="display:grid;gap:10px">${data.map((d) => `
    <div data-tip="${esc(`${d.label}: ${fmt(d.value)}`)}">
      <div class="row" style="font-size:13px;margin-bottom:4px"><span>${esc(d.label)}</span><span class="sp"></span><b>${esc(fmt(d.value))}</b></div>
      <div class="bar-track"><div style="height:100%;width:${(d.value / max) * 100}%;background:${C(ci)};border-radius:999px"></div></div>
    </div>`).join("")}</div>`;
}

/** Tiny sparkline. */
export function spark(values, { w = 120, h = 32, ci = 0 } = {}) {
  const min = Math.min(...values), max = Math.max(...values);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - 2 - ((v - min) / (max - min || 1)) * (h - 4)}`).join(" ");
  return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="${C(ci)}" stroke-width="2"/></svg>`;
}

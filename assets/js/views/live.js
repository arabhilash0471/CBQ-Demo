// Live simulation page: a hands-off operations screen that streams synthetic traffic.
// The simulation runs outside the app store so ticks never trigger a full re-render or get persisted.
import { esc, icon, pill, section, kpis, qarShort, int, note, illustrative } from "../ui.js";
import { lines, hbars } from "../charts.js";
import { initialSim, step, simClock } from "./live-engine.js";

const SPEEDS = [[1, "1×"], [4, "4×"], [10, "10×"]];
const WARMUP = 20; // minutes pre-run so charts are never empty

let sim = Array.from({ length: WARMUP }).reduce((s) => step(s), initialSim());

function body() {
  const stpRate = sim.pays ? Math.round((sim.stp / sim.pays) * 100) : 0;
  const lastP95 = sim.p95.length ? sim.p95[sim.p95.length - 1].v : 0;
  const top = Object.entries(sim.byTenant).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, value]) => ({ label, value }));
  const merged = sim.thru.map((d, i) => ({ label: d.label, n: d.n, p95: sim.p95[i].v }));
  const feed = sim.feed.map((e) => `<li class="feed-item ${esc(e.kind)}"><span class="ic">${icon(e.ic)}</span><div><b>${esc(e.title)}</b><small>${esc(e.sub)}</small></div><span class="t">${esc(e.t)}</span></li>`).join("");
  return kpis([
    { label: "Payments today", value: int(sim.pays), ic: "send", caption: `Simulated clock ${simClock(sim)} AST` },
    { label: "Value today", value: qarShort(sim.value), ic: "banknote", caption: "All tenants" },
    { label: "STP rate", value: `${stpRate}%`, ic: "zap", caption: `${int(sim.approval)} needed CBQ approval` },
    { label: "Rejected", value: int(sim.rejected), ic: "circle-x", caption: "Reason codes returned to ERP" },
    { label: "p95 latency", value: `${lastP95} ms`, ic: "timer", caption: sim.incident ? `${sim.incident.id} open` : "Within SLO (800 ms)", dir: sim.incident ? "down" : "flat" },
  ]) + `<div class="grid g-2-1">
    ${section({ title: "Throughput, payments per minute", ic: "activity", body: lines(merged, [{ key: "n", name: "Payments / min" }], { area: true, h: 180 }) })}
    ${section({ title: "Event feed", ic: "radio", body: `<ul class="feed" tabindex="0" role="region" aria-label="Event feed, newest first">${feed}</ul>` })}
  </div>
  <div class="grid g2" style="margin-top:12px">
    ${section({ title: "p95 latency, CBQ adapter (ms)", ic: "timer", body: lines(merged, [{ key: "p95", name: "p95 ms" }], { h: 160 }) })}
    ${section({ title: "Busiest tenants today", ic: "trophy", body: hbars(top, { ci: 1 }) })}
  </div>`;
}

function live() {
  return `<div class="page-head"><div class="txt"><div class="eyebrow">Insights · live simulation</div>
      <h1 class="page-title">The platform at work, minute by minute</h1>
      <p class="page-desc">A hands-off screen for the session: synthetic traffic from every connected customer streams through the hub, with CBQ approvals, rejections, statements and a self-healing incident. Nothing leaves the browser.</p></div>
    <div class="page-actions" id="liveCtl">
      <span class="live-dot ${sim.running ? "on" : ""}" id="liveDot" aria-hidden="true"></span>
      <button type="button" class="btn primary" id="livePlay">${icon(sim.running ? "pause" : "play")}${sim.running ? "Pause" : "Start"}</button>
      <div class="chips" role="group" aria-label="Speed">${SPEEDS.map(([v, l]) => `<button type="button" class="chip-btn" data-speed="${v}" aria-pressed="${sim.speed === v}">${l}</button>`).join("")}</div>
      <button type="button" class="btn" id="liveReset">${icon("rotate-ccw")}Restart day</button>
    </div></div>
    ${illustrative("Year 1 after go-live. Synthetic traffic across synthetic tenants; the platform is not yet connected to CBQ.")}
    <div id="liveBody" data-tour="live">${body()}</div>` +
    note(`Streams the same tenants shown in the operations console. Use it as a backdrop during Q&A, or pause to talk through an event. ${pill("Synthetic", "neutral", "flask-conical")}`, "info");
}

function mountLive(root) {
  const out = root.querySelector("#liveBody");
  const play = root.querySelector("#livePlay");
  const dot = root.querySelector("#liveDot");
  if (!out || !play) return () => {};
  let timer = null;
  const paint = () => { out.innerHTML = body(); if (window.lucide) window.lucide.createIcons(); };
  const syncCtl = () => {
    play.innerHTML = `${icon(sim.running ? "pause" : "play")}${sim.running ? "Pause" : "Start"}`;
    dot.classList.toggle("on", sim.running);
    root.querySelectorAll("[data-speed]").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.speed) === sim.speed)));
    if (window.lucide) window.lucide.createIcons();
  };
  // Repaint at most four times a second; faster speeds advance several simulated minutes per paint.
  const schedule = () => {
    clearInterval(timer);
    const every = Math.max(1000 / sim.speed, 250), perPaint = Math.max(1, Math.round((sim.speed * every) / 1000));
    timer = sim.running ? setInterval(() => {
      for (let i = 0; i < perPaint; i++) sim = step(sim);
      paint();
    }, every) : null;
  };
  play.addEventListener("click", () => { sim = { ...sim, running: !sim.running }; syncCtl(); schedule(); });
  root.querySelectorAll("[data-speed]").forEach((b) => b.addEventListener("click", () => { sim = { ...sim, speed: Number(b.dataset.speed) }; syncCtl(); schedule(); }));
  root.querySelector("#liveReset").addEventListener("click", () => {
    sim = { ...Array.from({ length: WARMUP }).reduce((s) => step(s), initialSim()), running: sim.running, speed: sim.speed };
    paint();
  });
  schedule();
  return () => clearInterval(timer);
}

export const pages = [{ id: "live", render: live, mount: mountLive, persona: "ops" }];
export const actions = {};

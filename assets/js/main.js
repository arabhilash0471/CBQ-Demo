// App shell: routing, navigation, theme, overlays, event delegation.
import { esc, icon } from "./ui.js";
import { getState, setState, replaceState, subscribe, freshState, withUi } from "./state.js";
import { renderTrace } from "./trace.js";
import { TOUR, tourCard, placeSpotlight } from "./tour.js";
import { PERSONAS, personaById, initials } from "./personas.js";
import { NOTIFICATIONS } from "./data/ops.js";
import { STEPS } from "./views/walk-common.js";
import * as overview from "./views/overview.js";
import * as walkOnboard from "./views/walk-onboard.js";
import * as walkPay from "./views/walk-pay.js";
import * as walkRecon from "./views/walk-recon.js";
import * as dashboards from "./views/dashboards.js";
import * as architecture from "./views/architecture.js";
import * as security from "./views/security.js";
import * as plan from "./views/plan.js";
import * as why from "./views/why.js";
import * as qa from "./views/qa.js";
import * as flowsPay from "./views/flows-pay.js";
import * as flowsControl from "./views/flows-control.js";
import * as live from "./views/live.js";
import * as roi from "./views/roi.js";
import { SCENARIOS, navSub } from "./views/flows-common.js";

const MODULES = [overview, walkOnboard, walkPay, walkRecon, flowsPay, flowsControl, dashboards, live, roi, architecture, security, plan, why, qa];
const PAGES = Object.fromEntries(MODULES.flatMap((m) => m.pages).map((p) => [p.id, p]));
const ACTIONS = Object.assign({}, ...MODULES.map((m) => m.actions));
const MODALS = { ...walkPay.modals };

const NAV = [
  { group: "Overview", items: [{ id: "overview", title: "Proposed solution", ic: "sparkles" }, { id: "about", title: "Reviewer brief", ic: "book-open-text" }] },
  { group: "End-to-end walkthrough", items: STEPS.map((s) => ({ id: s.id, title: s.title, sub: s.who, n: s.n })) },
  { group: "More scenarios", items: SCENARIOS.map((s) => ({ id: s.id, title: s.title, sub: navSub(s), ic: s.ic })) },
  { group: "Insights", items: [
    { id: "dashboards", title: "Dashboards", ic: "layout-dashboard" },
    { id: "live", title: "Live simulation", ic: "radio" },
    { id: "roi", title: "Customer value", ic: "calculator" }] },
  { group: "Platform", items: [
    { id: "architecture", title: "Architecture and integration", ic: "network" },
    { id: "security", title: "Security and deployment", ic: "shield-check" },
    { id: "plan", title: "Implementation and timeline", ic: "calendar-range" },
    { id: "why", title: "Key differentiators", ic: "award" }] },
  { group: "Session", items: [{ id: "qa", title: "Q&A and clarifications", ic: "message-circle-question" }] },
];
const ALL_ITEMS = NAV.flatMap((g) => g.items.map((i) => ({ ...i, group: g.group })));

const STORE_KEY = "cbq-demo-state-v1";
const THEME_KEY = "cbq-demo-theme";
const $ = (id) => document.getElementById(id);

let pop = null;            // "notif" | "persona" | "palette" | null (transient view state)
let paletteSel = 0;
let tourCleanup = () => {};
let pageCleanup = () => {};   // returned by a page's mount (timers, listeners outside the stage)
const personaOverride = null; // reserved: persona follows the current screen

/* ---------- persistence ---------- */
function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    const base = freshState();
    if (!saved || typeof saved !== "object" || !Array.isArray(saved.pays) || saved.pays.length !== base.pays.length) return;
    if (!saved.pays.every((p, i) => p && p.doc === base.pays[i].doc && typeof p.sel === "boolean")) return;
    // Take only known keys whose type matches the fresh state, so bad storage can never break rendering.
    const sameType = (a, b) => (Array.isArray(a) ? Array.isArray(b) : a !== null && b !== null && typeof a === typeof b);
    const picked = Object.fromEntries(Object.keys(base).filter((k) => k !== "ui" && sameType(base[k], saved[k])).map((k) => [k, saved[k]]));
    const ui = saved.ui && typeof saved.ui === "object" ? Object.fromEntries(Object.keys(base.ui).filter((k) => sameType(base.ui[k], saved.ui[k])).map((k) => [k, saved.ui[k]])) : {};
    // Stage counters for the extra scenarios must be whole numbers in range, or the pages would index past their stage lists.
    const RANGES = { wps: [0, 3], intl: [0, 6], cxlA: [0, 1], cxlB: [0, 3] };
    Object.entries(RANGES).forEach(([k, [lo, hi]]) => {
      if (!Number.isInteger(picked[k]) || picked[k] < lo || picked[k] > hi) delete picked[k];
    });
    setState({ ...base, ...picked, ui: { ...base.ui, ...ui, modal: null, toast: null, tour: null } });
  } catch { /* corrupt or blocked storage: start fresh */ }
}
function save(s) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify({ ...s, ui: { ...s.ui, modal: null, toast: null, tour: null } })); } catch { /* ignore */ }
}

/* ---------- routing ---------- */
const route = () => {
  let h = "";
  try { h = decodeURIComponent((location.hash || "").slice(1)); } catch { h = ""; }
  return PAGES[h] ? h : "overview";
};

function renderNav(cur, s) {
  $("nav").innerHTML = NAV.map((g) => `<div class="nav-group"><div class="nav-title">${esc(g.group)}</div>${g.items.map((it) => {
    const lead = it.n ? `<span class="num">${s.done[it.id] ? icon("check") : it.n}</span>` : icon(it.ic);
    return `<a href="#${it.id}" class="${s.done[it.id] ? "done" : ""}" ${cur === it.id ? 'aria-current="page"' : ""} title="${esc(it.title)}">${lead}<span class="lbl">${esc(it.title)}${it.sub ? `<span class="sub">${esc(it.sub)}</span>` : ""}</span></a>`;
  }).join("")}</div>`).join("");
}

function renderPersona(cur) {
  const p = personaById(personaOverride || PAGES[cur].persona || "panel");
  $("personaBtn").innerHTML = `<span class="avatar">${esc(initials(p.name))}</span><span class="txt"><span class="who">${esc(p.name)}</span><span class="role">${esc(p.role)}</span></span>${icon("chevron-down")}`;
}

/* ---------- overlays ---------- */
function popoverHtml(s, cur) {
  if (pop === "notif") {
    return `<div class="popover" aria-label="Notifications"><div class="grp">Notifications</div>${NOTIFICATIONS.map((n) =>
      `<div class="item">${icon(n.ic)}<div><b>${esc(n.title)}</b><small>${esc(n.sub)}</small></div></div>`).join("")}</div>`;
  }
  if (pop === "persona") {
    const active = personaOverride || PAGES[cur].persona || "panel";
    return `<div class="popover" aria-label="View as"><div class="grp">View the demo as</div>${PERSONAS.map((p) =>
      `<button class="item" data-a="persona" data-p="${esc(p.id)}" type="button"><span class="avatar">${esc(initials(p.name))}</span><div style="flex:1"><b>${esc(p.name)}</b><small>${esc(p.role)} · ${esc(p.org)}</small></div>${p.id === active ? icon("check") : ""}</button>`).join("")}
      <hr><button class="item" data-a="startTour">${icon("compass")}<div><b>Guided presenter tour</b><small>${TOUR.length} stops, follows the agenda</small></div></button>
      <button class="item" data-a="resetDemo">${icon("rotate-ccw")}<div><b>Reset demo data</b><small>Back to the original synthetic seed</small></div></button></div>`;
  }
  if (pop === "palette") {
    return `<div class="palette" data-close="1"><div class="box" role="dialog" aria-modal="true" aria-label="Jump to"><input id="palIn" placeholder="Jump to a page or walkthrough step" aria-label="Search pages"><ul id="palList"></ul></div></div>`;
  }
  return "";
}

function renderPalette(q) {
  const list = ALL_ITEMS.filter((i) => !q || `${i.title} ${i.group} ${i.sub || ""}`.toLowerCase().includes(q.toLowerCase()));
  paletteSel = Math.min(paletteSel, Math.max(0, list.length - 1));
  $("palList").innerHTML = list.length ? list.map((i, k) => `<li><a href="#${i.id}" class="${k === paletteSel ? "sel" : ""}" data-close="1">${i.n ? `<span class="count">${i.n}</span>` : icon(i.ic)}${esc(i.title)}<span class="grp">${esc(i.group)}</span></a></li>`).join("")
    : `<li class="muted" style="padding:10px">No match.</li>`;
  return list;
}

function renderOverlay(s, cur) {
  const modal = s.ui.modal && MODALS[s.ui.modal] ? MODALS[s.ui.modal](s) : "";
  const tour = s.ui.tour != null ? `<div class="tour-spot" id="tourSpot" hidden></div>${tourCard(s.ui.tour)}` : "";
  $("overlay").innerHTML = popoverHtml(s, cur) + modal + tour;
  if (pop === "palette") { renderPalette(""); $("palIn").focus(); }
  if (modal) $("overlay").querySelector(".modal [data-a='otpOk']")?.focus();
  tourCleanup();
  tourCleanup = s.ui.tour != null ? placeSpotlight(s.ui.tour, s.ui.tour !== lastTourStep) : () => {};
  if (s.ui.tour != null && s.ui.tour !== lastTourStep) $("tourCard")?.focus({ preventScroll: true });
  lastTourStep = s.ui.tour;
}

/* ---------- render ---------- */
let lastRoute = null;
let lastTourStep = null;
function render() {
  const s = getState(), cur = route(), page = PAGES[cur];
  renderNav(cur, s);
  renderPersona(cur);
  const item = ALL_ITEMS.find((i) => i.id === cur);
  $("crumb").textContent = item ? `${item.group} · ${item.title}` : "";
  document.title = `${item ? item.title : "Demo"} · CBQ ERP Connect Demo`;
  const stage = $("stage");
  const focusKey = focusSignature(document.activeElement);
  pageCleanup();
  stage.innerHTML = page.render(s);
  const cleanup = page.mount ? page.mount(stage) : null;
  pageCleanup = typeof cleanup === "function" ? cleanup : () => {};
  renderTrace($("trace"), s);
  renderOverlay(s, cur);
  if (s.ui.toast) { const msg = s.ui.toast; queueMicrotask(() => showToast(msg)); }
  if (lastRoute !== cur) { window.scrollTo(0, 0); lastRoute = cur; }
  if (window.lucide) window.lucide.createIcons();
  restoreFocus(focusKey);
}

/** Identify a focused control by its action and data attributes so focus survives re-render. */
function focusSignature(el) {
  if (!el || !el.dataset || !el.dataset.a) return null;
  return ["a", "i", "k", "c", "p"].filter((k) => el.dataset[k] != null).map((k) => `[data-${k}="${CSS.escape(el.dataset[k])}"]`).join("");
}
function restoreFocus(sig) {
  if (!sig || (document.activeElement && document.activeElement !== document.body)) return;
  const el = document.querySelector(sig) || $("stage");
  el.focus({ preventScroll: true });
}

function showToast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.innerHTML = `${icon("circle-check")}<span>${esc(msg)}</span>`;
  $("toasts").appendChild(t);
  if (window.lucide) window.lucide.createIcons();
  setTimeout(() => t.remove(), 2600);
  replaceState(withUi(getState(), { toast: null }));
}

/* ---------- shell actions ---------- */
const SHELL = {
  startTour: (s) => { pop = null; const st = TOUR[0]; if (route() !== st.route) location.hash = st.route; return withUi(s, { tour: 0 }); },
  tourNext: (s) => {
    const i = s.ui.tour + 1;
    if (i >= TOUR.length) return withUi(s, { tour: null, toast: "Tour finished" });
    if (route() !== TOUR[i].route) location.hash = TOUR[i].route;
    return withUi(s, { tour: i });
  },
  tourBack: (s) => { const i = Math.max(0, s.ui.tour - 1); if (route() !== TOUR[i].route) location.hash = TOUR[i].route; return withUi(s, { tour: i }); },
  tourStop: (s) => withUi(s, { tour: null }),
  persona: (s, d) => { pop = null; location.hash = personaById(d.p).home; return withUi(s, { toast: `Now viewing as ${personaById(d.p).name}` }); },
  resetDemo: () => { pop = null; location.hash = "overview"; return withUi(freshState(), { toast: "Demo data reset" }); },
};

function dispatch(name, data) {
  const fn = SHELL[name] || ACTIONS[name];
  if (!fn) return;
  try {
    setState(fn(getState(), data));
  } catch (err) {
    showToast("Something went wrong in the demo. Try Reset demo.");
    throw err;
  }
}

/* ---------- events ---------- */
function bind() {
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-a]");
    if (a && !a.disabled) { dispatch(a.dataset.a, { ...a.dataset }); return; }
    if (e.target.closest("a[data-close]") || e.target.classList.contains("palette")) { pop = null; render(); return; }
    if (pop && !e.target.closest(".popover, .palette .box, #notifBtn, #personaBtn, #searchBtn")) { pop = null; render(); }
  });
  document.addEventListener("keydown", (e) => {
    const s = getState();
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); pop = pop === "palette" ? null : "palette"; paletteSel = 0; render(); return; }
    if (e.key === "Escape") {
      if (pop) { const opener = { notif: "notifBtn", persona: "personaBtn", palette: "searchBtn" }[pop]; pop = null; render(); $(opener)?.focus(); return; }
      if (s.ui.modal) { setState(withUi(s, { modal: null })); return; }
      if (s.ui.tour != null) { setState(withUi(s, { tour: null })); return; }
    }
    if (s.ui.tour != null && !pop && !s.ui.modal && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
      if (e.key === "ArrowRight") { dispatch("tourNext"); return; }
      if (e.key === "ArrowLeft") { dispatch("tourBack"); return; }
    }
    const el = e.target.closest && e.target.closest("[role='button'][data-a]");
    if (el && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); dispatch(el.dataset.a, { ...el.dataset }); }
    if (pop === "palette" && ["ArrowDown", "ArrowUp", "Enter"].includes(e.key)) {
      e.preventDefault();
      const list = renderPalette($("palIn").value);
      if (e.key === "Enter" && list[paletteSel]) {
        pop = null;
        if (route() === list[paletteSel].id) render(); else location.hash = list[paletteSel].id;
        return;
      }
      paletteSel = (paletteSel + (e.key === "ArrowDown" ? 1 : -1) + list.length) % Math.max(list.length, 1);
      renderPalette($("palIn").value);
      if (window.lucide) window.lucide.createIcons();
    }
  });
  document.addEventListener("input", (e) => {
    if (e.target.id === "palIn") { paletteSel = 0; renderPalette(e.target.value); if (window.lucide) window.lucide.createIcons(); }
  });
  // chart tooltips
  document.addEventListener("mouseover", (e) => {
    const t = e.target.closest && e.target.closest("[data-tip]");
    const chart = t && t.closest(".chart");
    document.querySelectorAll(".chart .tip").forEach((n) => n.remove());
    if (!chart) return;
    const tip = document.createElement("div");
    tip.className = "tip";
    tip.textContent = t.dataset.tip;
    const cr = chart.getBoundingClientRect(), r = t.getBoundingClientRect();
    tip.style.left = `${r.left - cr.left + r.width / 2}px`;
    tip.style.top = `${r.top - cr.top}px`;
    chart.appendChild(tip);
  });

  $("themeBtn").addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem(THEME_KEY, next); } catch { /* ignore */ }
    syncThemeBtn();
  });
  $("collapseBtn").addEventListener("click", () => $("app").classList.toggle("collapsed"));
  $("menuBtn").addEventListener("click", () => $("app").classList.add("drawer-open"));
  $("scrim").addEventListener("click", () => $("app").classList.remove("drawer-open"));
  $("nav").addEventListener("click", (e) => { if (e.target.closest("a")) $("app").classList.remove("drawer-open"); });
  $("traceBtn").addEventListener("click", () => {
    const off = $("workspace").classList.toggle("no-trace");
    $("traceBtn").setAttribute("aria-pressed", String(!off));
  });
  $("searchBtn").addEventListener("click", (e) => { e.stopPropagation(); pop = "palette"; paletteSel = 0; render(); });
  $("notifBtn").addEventListener("click", (e) => { e.stopPropagation(); pop = pop === "notif" ? null : "notif"; $("notifCount").hidden = true; render(); });
  $("personaBtn").addEventListener("click", (e) => { e.stopPropagation(); pop = pop === "persona" ? null : "persona"; render(); });
  $("tourBtn").addEventListener("click", () => dispatch("startTour"));
  $("resetBtn").addEventListener("click", () => dispatch("resetDemo"));
  window.addEventListener("hashchange", render);
}

function syncThemeBtn() {
  const light = document.documentElement.getAttribute("data-theme") === "light";
  $("themeBtn").setAttribute("aria-label", light ? "Switch to dark theme" : "Switch to light theme");
  $("themeBtn").innerHTML = icon(light ? "moon" : "sun");
  if (window.lucide) window.lucide.createIcons();
}

load();
subscribe((s) => { save(s); render(); });
bind();
syncThemeBtn();
render();

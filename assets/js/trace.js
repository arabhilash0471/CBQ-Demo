// "Behind the scenes" panel: correlation ID, trust zones and the hop log.
import { esc, icon } from "./ui.js";
import { ZONES } from "./state.js";

let lastSeen = 0;

export function renderTrace(el, s) {
  const hot = s.log[0] ? s.log[0].zones : [];
  const items = s.log.length
    ? s.log.map((e) => `<li class="${e.id > lastSeen ? "new" : ""}"><span class="t">${esc(e.t)}</span> <span class="hop">${esc(e.hop)}</span><span class="m">${esc(e.msg)}</span>${e.detail ? `<span class="d">${esc(e.detail)}</span>` : ""}</li>`).join("")
    : `<li class="empty">Start the walkthrough. Each action appears here with the hop it took and the control applied.</li>`;
  el.innerHTML = `
    <header>
      <h2>${icon("activity")}Behind the scenes</h2>
      <p class="caption">Every call, as the platform logs it</p>
      <div class="cid">${s.cid ? `Correlation ID ${esc(s.cid)}` : "No request yet"}</div>
    </header>
    <div class="zones">${ZONES.map((z, i) => `<span class="zone${hot.includes(i) ? " hot" : ""}">${esc(z)}</span>`).join("")}</div>
    <ul class="log">${items}</ul>`;
  lastSeen = s.seq;
}

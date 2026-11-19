// Shared rendering helpers. Every dynamic string goes through esc().

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ESC[c]);

export const fmt = (n, dp = 2) =>
  Number(n).toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
export const qar = (n, dp = 2) => `QAR ${fmt(n, dp)}`;
export const qarShort = (n) => {
  const a = Math.abs(n);
  if (a >= 1e6) return `QAR ${(n / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `QAR ${(n / 1e3).toFixed(0)}k`;
  return `QAR ${fmt(n, 0)}`;
};
export const int = (n) => Number(n).toLocaleString("en-US");
export const iban = (s) => esc(String(s).replace(/(.{4})/g, "$1 ").trim());

export const icon = (name, label) =>
  label ? `<i data-lucide="${esc(name)}" role="img" aria-label="${esc(label)}"></i>`
        : `<i data-lucide="${esc(name)}" aria-hidden="true"></i>`;

const PILL_ICON = { ok: "circle-check", warn: "clock", bad: "circle-x", info: "info", neutral: "circle", gold: "star" };
export const pill = (text, kind = "neutral", ic) =>
  `<span class="pill ${esc(kind)}">${icon(ic || PILL_ICON[kind] || "circle")}${esc(text)}</span>`;

export const pageHead = ({ eyebrow, title, desc, actions = "" }) => `
  <div class="page-head">
    <div class="txt">
      <div class="eyebrow">${esc(eyebrow)}</div>
      <h1 class="page-title">${esc(title)}</h1>
      ${desc ? `<p class="page-desc">${desc}</p>` : ""}
    </div>
    ${actions ? `<div class="page-actions">${actions}</div>` : ""}
  </div>`;

export const kpi = ({ label, value, delta, dir = "flat", ic, caption }) => `
  <div class="glass kpi hover">
    <div class="label">${ic ? icon(ic) : ""}${esc(label)}</div>
    <div class="value">${esc(value)}</div>
    ${delta ? `<div class="delta ${esc(dir)}">${icon(dir === "up" ? "trending-up" : dir === "down" ? "trending-down" : "minus")}${esc(delta)}</div>` : ""}
    ${caption ? `<div class="caption">${esc(caption)}</div>` : ""}
  </div>`;

export const kpis = (items) => `<div class="kpis">${items.map(kpi).join("")}</div>`;

export const section = ({ title, ic, right = "", body, cls = "", caption }) => `
  <section class="glass section ${esc(cls)}">
    ${title ? `<div class="section-head">${ic ? icon(ic) : ""}<h2 class="section-title">${esc(title)}</h2><div class="sp"></div>${right}</div>` : ""}
    ${body}
    ${caption ? `<p class="caption" style="margin-top:12px">${esc(caption)}</p>` : ""}
  </section>`;

export const surface = ({ product, screen, chip, body, right = "" }) => `
  <section class="glass">
    <div class="surface-bar">${icon(product === "SAP S/4HANA" ? "server" : "layout-panel-left")}<span>${esc(product)}</span>
      <span class="tag">${esc(screen)}</span><div class="sp"></div>${right}${chip ? `<span class="chip">${esc(chip)}</span>` : ""}</div>
    <div class="section">${body}</div>
  </section>`;

export const field = (label, value, hint) =>
  `<div class="field"><span class="flabel">${esc(label)}</span><div class="v">${value}</div>${hint ? `<div class="hint">${esc(hint)}</div>` : ""}</div>`;

export const check = (text, st = "", meta = "") => {
  const ic = st === "ok" ? "check" : st === "wait" ? "loader" : st === "bad" ? "x" : "minus";
  return `<li><span class="ic ${esc(st)}">${icon(ic)}</span><span>${esc(text)}</span>${meta ? `<span class="meta">${esc(meta)}</span>` : ""}</li>`;
};

export const note = (html, kind = "") => `<div class="note ${esc(kind)}">${icon(kind === "info" ? "info" : "lightbulb")}<div>${html}</div></div>`;

export const btn = (label, action, { kind = "", ic, disabled = false, data = {} } = {}) => {
  const attrs = Object.entries(data).map(([k, v]) => ` data-${esc(k)}="${esc(v)}"`).join("");
  return `<button type="button" class="btn ${esc(kind)}" data-a="${esc(action)}"${attrs}${disabled ? " disabled" : ""}>${ic ? icon(ic) : ""}${esc(label)}</button>`;
};

/** Build a table from column defs [{h, k|r, num, cls}] and rows. */
export const table = (cols, rows, { foot = "", empty = "No records." } = {}) => `
  <div class="table-wrap"><table>
    <thead><tr>${cols.map((c) => `<th class="${c.num ? "num" : ""}">${esc(c.h)}</th>`).join("")}</tr></thead>
    <tbody>${rows.length ? rows.map((r, i) => `<tr>${cols.map((c) => {
      const raw = c.r ? c.r(r, i) : esc(r[c.k]);
      return `<td class="${c.num ? "num" : ""} ${c.cls || ""}">${raw}</td>`;
    }).join("")}</tr>`).join("") : `<tr><td colspan="${cols.length}" class="muted">${esc(empty)}</td></tr>`}</tbody>
    ${foot ? `<tfoot>${foot}</tfoot>` : ""}
  </table></div>`;

/** Banner for screens that show the service as it might look after go-live, not a running service today. */
export const illustrative = (text = "Year 1 after go-live. Tenants, versions and incidents are synthetic; the platform is not yet connected to CBQ.") =>
  `<div class="scope-banner info" role="note">${icon("flask-conical")}<b>Illustrative</b><span>${esc(text)}</span></div>`;

export const asOf = (src) => `${src} · as of 16 Nov 2026, 10:42 AST`;

export const bar = (pct) => `<div class="bar-track" role="progressbar" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100"><div class="bar-fill" style="width:${Math.max(0, Math.min(100, pct))}%"></div></div>`;

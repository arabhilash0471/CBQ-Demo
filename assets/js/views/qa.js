// Q&A and clarifications, plus the reviewer brief.
import { esc, icon, pill, section, table, pageHead } from "../ui.js";
import { withUi } from "../state.js";
import { FAQS, FAQ_CATS, CLARIFICATIONS, NEXT_STEPS } from "../data/faqs.js";

function qa(s) {
  const cat = s.ui.faqCat;
  const list = FAQS.filter((f) => cat === "All" || f.cat === cat);
  const chips = `<div class="chips" role="group" aria-label="Filter by topic">${FAQ_CATS.map((c) =>
    `<button class="chip-btn" aria-pressed="${c === cat}" data-a="faqCat" data-k="${esc(c)}">${esc(c)}${c === "All" ? "" : ` · ${FAQS.filter((f) => f.cat === c).length}`}</button>`).join("")}</div>`;
  const faqs = list.map((f) => `<details class="faq" data-q="${esc(`${f.q} ${f.a}`.toLowerCase())}"><summary>${icon("chevron-right").replace("<i ", '<i class="chev" ')}<span>${esc(f.q)}</span><span class="sp" style="flex:1"></span>${pill(f.cat, "neutral", "tag")}</summary><div class="ans">${esc(f.a)}</div></details>`).join("");
  return pageHead({ eyebrow: "Session · Q&A and clarifications", title: "Questions and clarifications",
    desc: "Answers to the questions evaluation panels usually ask, the clarification log, and proposed next steps." }) +
  `<div class="stack">
    ${section({ title: `Anticipated questions · ${list.length}`, ic: "message-circle-question", body: `
      <div class="row" style="margin-bottom:12px"><input id="faqSearch" class="input" type="search" placeholder="Search questions and answers" aria-label="Search questions" style="max-width:360px"><span class="sp"></span>${chips}</div>
      <div id="faqList" data-tour="faq">${faqs}</div><p id="faqEmpty" class="muted" hidden>No question matches that search.</p>` })}
    <div class="grid g2">
      ${section({ title: "Clarification log", ic: "clipboard-list", body: table([{ h: "ID", r: (c) => `<span class="ref">${esc(c.id)}</span>` }, { h: "Topic", k: "topic" }, { h: "Owner", k: "owner" }, { h: "Status", r: (c) => pill(c.st[0], c.st[1]) }], CLARIFICATIONS), caption: "Sent to CBQ on 27 October 2026." })}
      ${section({ title: "Proposed next steps", ic: "list-todo", body: `<ul class="checks">${NEXT_STEPS.map((n) => `<li><span class="ic">${icon("arrow-right")}</span>${esc(n)}</li>`).join("")}</ul>
        <div class="note">${icon("mail")}<div><b>Contact</b><br>Sunil Nair, General Manager, Innoval Digital Solutions · contact details as in the proposal cover letter</div></div>` })}
    </div>
  </div>`;
}

// The search text is view-only state; keep it across re-renders (toasts, tour, chips).
let faqQuery = "";

function applyFilter(root) {
  const q = faqQuery.trim().toLowerCase();
  let shown = 0;
  root.querySelectorAll("#faqList details").forEach((d) => {
    const hit = !q || d.dataset.q.includes(q);
    d.hidden = !hit;
    if (hit) shown += 1;
  });
  root.querySelector("#faqEmpty").hidden = shown > 0;
}

function mountQa(root) {
  const input = root.querySelector("#faqSearch");
  if (!input) return;
  input.value = faqQuery;
  applyFilter(root);
  input.addEventListener("input", () => { faqQuery = input.value; applyFilter(root); });
}

function about() {
  return pageHead({ eyebrow: "About this demo", title: "Reviewer brief",
    desc: "What this demo is, what it is not, and how to get the most from it in 15 minutes." }) +
  `<div class="stack"><div class="grid g2">
    ${section({ title: "What it is", ic: "info", body: `<p class="muted">A clickable mock of the proposed ERP Connector Platform for The Commercial Bank (P.S.Q.C.). It runs entirely in your browser. Every customer, account, IBAN, amount, reference and metric is synthetic. Nothing is sent anywhere.</p>` })}
    ${section({ title: "How to use it", ic: "compass", body: `<ul class="checks">
      <li><span class="ic">${icon("play")}</span>Start the guided tour from the overview, or press the compass in the top bar.</li>
      <li><span class="ic">${icon("user")}</span>Use the persona menu (top right) to view each screen as the customer, SAP maker or checker, CBQ officer or CBQ operations.</li>
      <li><span class="ic">${icon("activity")}</span>Keep “Behind the scenes” open to see every hop, trust zone and control.</li>
      <li><span class="ic">${icon("search")}</span>Press Ctrl K to jump anywhere. Reset demo starts again.</li></ul>` })}
    </div>
    ${section({ title: "What to assess", ic: "clipboard-check", body: `<ul class="checks">
      <li><span class="ic ok">${icon("check")}</span>Does every payment stay under CBQ’s own authorisation (limits, OTP, Net Banking)?</li>
      <li><span class="ic ok">${icon("check")}</span>Is the SAP user experience natural for treasury teams (F110, FBL1N, FEBAN)?</li>
      <li><span class="ic ok">${icon("check")}</span>Can CBQ operations see, trace and stop anything, end to end?</li>
      <li><span class="ic ok">${icon("check")}</span>Is the path to further ERPs realistic and fixed-price?</li></ul>` })}
  </div>`;
}

export const pages = [{ id: "qa", render: qa, mount: mountQa }, { id: "about", render: about }];
export const actions = { faqCat: (s, d) => withUi(s, { faqCat: d.k }) };

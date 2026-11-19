// Guided presenter tour: spotlight one element per step and explain it (follows the 90-minute agenda).
import { esc, icon } from "./ui.js";

export const TOUR = [
  { route: "overview", target: "hero", title: "The proposal in one line", body: "Corporate customers bank from inside SAP; CBQ keeps every control. One platform, one canonical API, CBQ’s own security reused." },
  { route: "overview", target: "caps", title: "Key capabilities", body: "Phase 1 covers onboarding, balance, statements, domestic payments, status, reconciliation and monitoring. Everything else is a priced option." },
  { route: "onboard", target: "onboard-form", title: "1 · Customer registers", body: "The customer’s Net Banking administrator applies online: ERP, accounts, services and user mapping. No new passwords." },
  { route: "approve", target: "approve-queue", title: "2 · CBQ approves with dual control", body: "Eligibility is pre-checked against CBQ data. A maker approves, a second officer authorises; the platform then issues tenant and certificate." },
  { route: "activate", target: "activate", title: "3 · Activation inside SAP", body: "Signed transports, certificate in STRUST, a one-time code. Balance is live from CBQ after the connection test." },
  { route: "pay", target: "pay-run", title: "4 · The F110 run goes to CBQ", body: "The maker sends the normal payment run. Duplicates are held back before anything leaves SAP; each document carries an idempotency key." },
  { route: "release", target: "release", title: "5 · SAP checker, then CBQ", body: "Segregation of duties in SAP first. Payments above the STP limit wait for CBQ’s own OTP or Net Banking approval." },
  { route: "status", target: "status", title: "6 · Status written back", body: "Each payment moves through one state machine. Completed items get the CBQ bank reference; rejections carry the CBQ reason code." },
  { route: "recon", target: "recon", title: "7 · Reconciliation by rules", body: "The statement comes in as camt.053; rules match by reference, then amount, date and beneficiary. Exceptions get a proposed posting." },
  { route: "ops", target: "ops-charts", title: "8 · CBQ operations", body: "Volumes, latency, tenant health, connector versions, incidents and a tamper-evident audit trail, with offboarding in one action." },
  { route: "live", target: "live", title: "Live simulation", body: "Press Start: synthetic traffic from every tenant streams through the hub, with CBQ approvals, rejections and a self-healing incident." },
  { route: "limits", target: "limits", title: "Balance and limits (Phase 1)", body: "Live balances and CBQ limits from inside SAP: any amount shows straight-through, CBQ approval or blocked before it is sent. WPS, international and recall sit next to it as if-asked screens." },
  { route: "architecture", target: "arch", title: "Architecture and integration", body: "Five trust zones. One entry point through CBQ’s gateway, one exit point through the CBQ API adapter. Click any box." },
  { route: "architecture", target: "api", title: "The canonical API", body: "Every connector speaks the same versioned API. Pick an endpoint to see the request and response." },
  { route: "security", target: "security", title: "Security and deployment", body: "CBQ identity, PKI, HSM, SIEM and PAM reused. Hosted on CBQ cloud in Qatar with DR under 2 hours." },
  { route: "plan", target: "plan", title: "Implementation and timeline", body: "Hub and SAP connector live in month 8, hypercare exit in month 9. Further ERPs about 2–3 months each." },
  { route: "why", target: "why", title: "Differentiators", body: "Not a greenfield build, CBQ stays in control, one place to change, an honest ERP roadmap." },
  { route: "roi", target: "roi", title: "Customer value", body: "Move the assumptions: hours, cost and errors a corporate finance team saves when banking runs from inside SAP." },
  { route: "qa", target: "faq", title: "Q&A", body: "Anticipated questions, searchable by topic, plus the clarification log and next steps." },
];

export function tourCard(i) {
  const st = TOUR[i];
  if (!st) return "";
  return `<div class="tour-card glass" role="dialog" aria-modal="false" aria-labelledby="tourT" tabindex="-1" id="tourCard">
    <div class="row" style="align-items:flex-start">
      <span class="tour-ic">${icon("compass")}</span>
      <div style="flex:1;min-width:0">
        <div class="eyebrow" style="margin:0 0 4px">Presenter tour · ${i + 1} of ${TOUR.length}</div>
        <h3 id="tourT" class="section-title" style="font-size:16px">${esc(st.title)}</h3>
        <p class="muted" style="margin-top:6px">${esc(st.body)}</p>
      </div>
      <button class="icon-btn" data-a="tourStop" aria-label="Close tour">${icon("x")}</button>
    </div>
    <div class="row" style="margin-top:14px"><span class="caption">← → to move, Esc to close</span><span class="sp"></span>
      <button class="btn sm" data-a="tourBack" ${i === 0 ? "disabled" : ""}>${icon("arrow-left")}Back</button>
      <button class="btn sm primary" data-a="tourNext">${i === TOUR.length - 1 ? "Finish" : "Next"}${icon("arrow-right")}</button></div>
  </div>`;
}

/** Position the spotlight over the step's target. Returns a cleanup function. */
export function placeSpotlight(i, scroll = true) {
  const st = TOUR[i];
  const spot = document.getElementById("tourSpot");
  if (!st || !spot) return () => {};
  const el = document.querySelector(`[data-tour="${st.target}"]`);
  if (!el) { spot.hidden = true; return () => {}; }
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (scroll) el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
  const measure = () => {
    const r = el.getBoundingClientRect(), pad = 6;
    spot.hidden = false;
    Object.assign(spot.style, { top: `${r.top - pad}px`, left: `${r.left - pad}px`, width: `${r.width + pad * 2}px`, height: `${Math.min(r.height + pad * 2, window.innerHeight - 40)}px` });
  };
  measure();
  const t = setTimeout(measure, 400);
  window.addEventListener("scroll", measure, true);
  window.addEventListener("resize", measure);
  return () => { clearTimeout(t); window.removeEventListener("scroll", measure, true); window.removeEventListener("resize", measure); };
}

# CBQ ERP Connector Platform — solution demo

An interactive demo of the **ERP Connector Platform** proposed by Innoval Digital Solutions for
**The Commercial Bank (P.S.Q.C.)**: corporate customers send payments, check balances and reconcile
from inside SAP, while CBQ keeps every authorisation, limit and security control.

> **Mock only.** Runs entirely in the browser. Every customer, account, IBAN, amount, reference and
> metric is synthetic. Nothing is sent anywhere.

Styled with the **IVL Executive Luxury Glass** design system: dark by default, light theme from the
sun/moon toggle, Cormorant Garamond + Inter, gold used sparingly.

## What it covers (mapped to CBQ's demo agenda)

| Agenda item | Where in the demo |
|---|---|
| Proposed solution and key capabilities | **Proposed solution** (`#overview`) |
| End-to-end functional walkthrough | **8 interactive steps** (`#onboard` → `#ops`) with a live "Behind the scenes" trace |
| Architecture and integration approach | **Architecture** (`#architecture`): trust-zone diagram, payment sequence, canonical API with sample payloads, connector patterns |
| Security and deployment considerations | **Security** (`#security`): control layers, STRIDE threat matrix, environments and topology, compliance |
| Implementation approach and timelines | **Plan** (`#plan`): 9-month Gantt, milestones, team, governance, RAID log, further-ERP roadmap |
| Key differentiators | **Why** (`#why`): differentiators, comparison with host-to-host and greenfield, references |
| Q&A and clarifications | **Q&A** (`#qa`): 25 searchable answers, clarification log, next steps |

Plus **Dashboards** (`#dashboards`): a corporate treasurer's cockpit and CBQ's portfolio view, and a
**Reviewer brief** (`#about`).

### More scenarios and insights

| Page | What it shows |
|---|---|
| **WPS payroll** (`#wps`) | 148-employee salary batch from SAP payroll: validation (QID, IBAN, establishment ID), one record held, CBQ approval, WPS acceptance. Priced option. |
| **International payment** (`#intl`) | EUR supplier: CBQ FX quote, book and send, CBQ OTP above the STP limit, SWIFT gpi tracker with UETR. Priced option. |
| **Cancel and recall** (`#recall`) | Cancel a scheduled payment before execution; recall an executed one (camt.056 → funds returned). Subject to CBQ API. |
| **Balance and limits** (`#limits`) | Live balances, user and daily limits; type any amount to see STP, CBQ approval or blocked. |
| **Live simulation** (`#live`) | Labelled illustrative (year 1 after go-live). Seeded, minute-by-minute synthetic traffic across all tenants: throughput, p95 latency, event feed, a self-healing incident. Start, pause, 1×/4×/10×. |
| **Customer value** (`#roi`) | Sliders and presets for a corporate finance team: hours, cost and errors saved per year, by corporate size. Corporate side only; CBQ commercials are in the separately evaluated commercial proposal. |

### The walkthrough

1. Customer registers (onboarding portal: ERP, 4 accounts, services, user mapping)
2. CBQ approves with dual control (maker + checker) after automatic eligibility checks
3. SAP Basis activates the connector (transports, STRUST certificate, activation code, connection test)
4. Maker sends a 12-item F110 run (one duplicate held back automatically)
5. SAP checker releases; two payments above the STP limit need a CBQ OTP
6. Status and bank references flow back; one payment is rejected with CBQ reason code R14
7. Statement arrives as camt.053; rule-based reconciliation with exception queue
8. CBQ operations console: volumes, latency, tenants, versions, incidents, audit trail, offboarding

## Presenting it

- **Guided presenter tour** (compass icon, top bar): 19 stops that follow the 90-minute agenda,
  spotlighting each screen. Arrow keys move, Esc closes.
- **View as** (persona menu, top right): jump to the screen of the customer admin, CBQ officer,
  SAP Basis, SAP maker, SAP checker, treasury analyst or CBQ operations.
- **Ctrl/⌘ K** jumps to any page or step. **Reset demo** starts again. Progress is kept in the browser.
- The activity icon toggles the "Behind the scenes" panel (correlation ID, trust zones, every hop).
- Balance and limits is Phase 1. WPS payroll, international payment and cancel/recall are "if asked" screens, labelled Priced option or Subject to CBQ API.
- Icons are bundled in `assets/vendor/`; the page carries `noindex` so search engines skip it.

## Run locally

No build step. Serve the folder with any static server (ES modules need http, not `file://`):

```bash
python -m http.server 5178
```

Then open http://localhost:5178.

## Structure

```
index.html                 app shell
assets/css/                tokens.css (both themes), base.css (shell), components.css
assets/js/main.js          routing, navigation, overlays, events
assets/js/state.js         immutable demo state store
assets/js/ui.js            escaping and rendering helpers
assets/js/charts.js        inline SVG charts
assets/js/tour.js          guided presenter tour
assets/js/personas.js      "view as" personas
assets/js/data/            synthetic data (customers, payments, ops, API, delivery, FAQs)
assets/js/views/           one module per page; walkthrough split into three modules
assets/img/                IVL logos
docs-source/               the original deck and first demo (kept in the repo, not published to Pages)
.github/workflows/         Pages deploy: publishes index.html, assets/ and .nojekyll only
tools/build-offline.mjs    builds the offline copy (see below)
```

Each view module exports `pages` (id + pure `render(state)`) and `actions`
(`(state, data) => newState`). Buttons declare `data-a="actionName"`; `main.js` dispatches them.

## Offline copy

For networks where GitHub Pages is slow or blocked, build a single self-contained HTML file:

```
node tools/build-offline.mjs
```

This needs internet once (it fetches esbuild and the two web fonts). It writes
`dist-offline/CBQ_ERP_Connect_Demo_offline.html`, which bundles the code, styles, icons, logos and fonts.
Double-click it to open in Edge or Chrome, with no web server and no internet. Zip `dist-offline/` to share it.
`dist-offline/` and zips are git-ignored.

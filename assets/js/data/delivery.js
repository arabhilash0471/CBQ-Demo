// Delivery plan, governance, risks and roadmap (from the proposal deck, expanded).

export const GANTT = [
  { name: "Mobilisation and design", sub: "Workshops, HLD/LLD, security design", s: 1, e: 2 },
  { name: "Environments ready on CBQ cloud", sub: "SIT, UAT; gateway, PKI, HSM onboarding", s: 2, e: 3, cbq: true },
  { name: "Build: hub, portals, CBQ adapter", sub: "Node.js services, admin and onboarding UIs", s: 2, e: 5 },
  { name: "Build: SAP connector", sub: "ABAP add-on, cockpit, camt.053", s: 3, e: 5 },
  { name: "SIT against CBQ sandbox", sub: "End-to-end with Connected Banking APIs", s: 5, e: 6 },
  { name: "Security and performance testing", sub: "Independent VAPT and performance testing", s: 6, e: 7 },
  { name: "UAT and business sign-off", sub: "CBQ business users, scripted and exploratory", s: 7, e: 7, cbq: true },
  { name: "Pilot with CBQ-selected customers", sub: "Customers on supported SAP releases", s: 7, e: 8 },
  { name: "Go-live and hypercare", sub: "On-site support in Doha", s: 8, e: 9 },
];

// Milestones as in proposal Section 13.2. "m" places the marker on the timeline (end month); "when" is shown.
export const MILESTONES = [
  { id: "M2", name: "Design sign-off", m: 2, when: "2", by: "CBQ architecture and security", exit: "HLD, LLD, threat model and API mapping approved" },
  { id: "M3", name: "Environments ready", m: 3, when: "3", by: "CBQ infrastructure", exit: "SIT and UAT environments on CBQ cloud, security services onboarded" },
  { id: "M4", name: "SIT exit", m: 6, when: "6", by: "CBQ technology", exit: "End-to-end SIT against CBQ APIs completed" },
  { id: "M5", name: "Security and performance", m: 7, when: "6–7", by: "CBQ security", exit: "Independent VAPT and performance testing completed" },
  { id: "M6", name: "UAT sign-off", m: 7, when: "7", by: "CBQ business", exit: "UAT completed and signed off" },
  { id: "M7", name: "Pilot", m: 8, when: "7–8", by: "CBQ product", exit: "Pilot with CBQ-selected customers completed" },
  { id: "M8", name: "Go-live", m: 8, when: "8", by: "CBQ go-live board", exit: "Production go-live approved" },
  { id: "M9", name: "Hypercare exit", m: 9, when: "9", by: "CBQ operations", exit: "Hypercare completed, exit report accepted" },
];

export const TEAM = [
  { role: "Technical architect and delivery lead", n: 1, where: "Doha / Bengaluru" },
  { role: "Project manager", n: 1, where: "Doha" },
  { role: "Business analyst", n: 1, where: "Doha" },
  { role: "Senior backend developers (Node.js)", n: 2, where: "Bengaluru" },
  { role: "Frontend developer", n: 1, where: "Bengaluru" },
  { role: "SAP ABAP lead", n: 1, where: "Bengaluru / Doha" },
  { role: "DevOps engineer", n: 1, where: "Remote via CBQ PAM" },
  { role: "QA engineer", n: 1, where: "Bengaluru / Doha" },
  { role: "Independent penetration tester", n: 1, where: "Third party" },
];

export const GOVERNANCE = [
  { forum: "Steering committee", cadence: "Monthly", who: "CBQ sponsor, CIO delegate, Innoval GM", covers: "Scope, milestones, risks, change requests" },
  { forum: "Project board", cadence: "Weekly", who: "PMs, architects, CBQ API owner", covers: "Plan, RAID log, CBQ API readiness, defects" },
  { forum: "Design authority", cadence: "Fortnightly", who: "CBQ architecture and security", covers: "Design decisions, exceptions, threat model" },
  { forum: "Daily stand-up", cadence: "Daily in SIT, UAT, pilot, hypercare", who: "Delivery team, CBQ testers", covers: "Blockers, defect triage" },
];

export const RAID = [
  { id: "R-01", type: "Risk", text: "CBQ API specifications or sandbox later than kickoff", impact: "High", owner: "CBQ API owner", mit: "Mock CBQ adapter from day 1; contract tests against spec", rag: "warn" },
  { id: "R-02", type: "Risk", text: "Pilot customers on unsupported SAP releases", impact: "Medium", owner: "CBQ product", mit: "Release check in onboarding; pre-pilot readiness call", rag: "ok" },
  { id: "R-03", type: "Risk", text: "Approval UX friction for non-STP payments", impact: "Medium", owner: "Innoval BA", mit: "Usability tests in UAT; Net Banking deep link", rag: "ok" },
  { id: "A-01", type: "Assumption", text: "CBQ provides Kubernetes/OpenShift namespaces in Qatar", impact: "High", owner: "CBQ infrastructure", mit: "VM-based fallback design documented", rag: "ok" },
  { id: "I-01", type: "Issue", text: "Clarification on reconciliation API availability open", impact: "Low", owner: "CBQ API owner", mit: "Platform engine used; CBQ API adopted if offered", rag: "warn" },
  { id: "D-01", type: "Dependency", text: "PKI, HSM, SIEM and PAM onboarding by month 3", impact: "High", owner: "CBQ security", mit: "Tracked weekly in project board", rag: "warn" },
];

export const DEPENDENCIES = [
  ["Connected Banking API specifications and sandbox access", "Kickoff"],
  ["Answers to the clarifications sent on 27 October", "Design sign-off, month 2"],
  ["Cloud environments for SIT and UAT, then production and DR, in Qatar", "Month 3"],
  ["Gateway, PKI certificates, HSM and vault, SIEM and PAM onboarding", "Month 3"],
  ["Pilot customers on supported SAP releases, with administrator access", "Month 6"],
  ["Test data, UAT team and business sign-off", "Months 6–7"],
];

export const ROADMAP = [
  { erp: "Tally ERP 9, Prime, Prime on Cloud", pattern: "TDL add-on and local agent", lead: "2–3 months", demand: 6 },
  { erp: "Zoho Books", pattern: "Cloud-to-cloud", lead: "2–3 months", demand: 3 },
  { erp: "Odoo Online", pattern: "Cloud-to-cloud", lead: "2–3 months", demand: 1 },
  { erp: "Odoo on-premises", pattern: "In-ERP extension", lead: "2–3 months", demand: 1 },
  { erp: "Dynamics 365 Business Central", pattern: "In-ERP extension", lead: "2–3 months", demand: 1 },
];

export const CERT_PATH = [
  ["Intake", "CBQ orders; feasibility and connector pattern confirmed", "clipboard-list"],
  ["Build on the SDK", "Same canonical API; hub and security model unchanged", "blocks"],
  ["Certify", "Automated test kit (212 cases), VAPT, SIT and UAT", "badge-check"],
  ["Release", "Via CBQ portal with version matrix; backup before import", "rocket"],
];

// Synthetic customers, accounts, onboarding queue and tenants. Illustrative only.

export const ONBOARD_CUSTOMER = {
  name: "Al Noor Trading W.L.L.",
  cr: "CR 145789",
  cbqId: "CORP-0081245",
  segment: "Mid-corporate, Wholesale Banking",
  rm: "Hessa Al-Marri (relationship manager)",
  admin: "r.alkuwari (Net Banking administrator, verified)",
  address: "Building 42, Street 230, Industrial Area, Doha",
  erp: "SAP S/4HANA 2022 FPS02, on-premises",
  sid: "S4P · client 100",
};

export const ONBOARD_ACCOUNTS = [
  { iban: "QA58CBQA000000001102334455667", ccy: "QAR", type: "Current", purpose: "Operating account, vendor payments", defaultOn: true, balance: 1284560.40 },
  { iban: "QA31CBQA000000001102334499001", ccy: "QAR", type: "Current", purpose: "Collections, statements only", defaultOn: true, balance: 642118.75 },
  { iban: "QA07CBQA000000001102334477120", ccy: "USD", type: "Current", purpose: "Import settlements, statements only", defaultOn: true, balance: 218440.10 },
  { iban: "QA92CBQA000000001102334400310", ccy: "QAR", type: "Call deposit", purpose: "Treasury, not linked", defaultOn: false, balance: 2500000.00 },
];

export const ERP_OPTIONS = [
  { v: "s4", label: "SAP S/4HANA 2020 and above", phase: "Phase 1" },
  { v: "ecc", label: "SAP ECC 6.0 EHP 7 SP 20 and above", phase: "Phase 1" },
  { v: "tally", label: "Tally Prime", phase: "On CBQ order" },
  { v: "zoho", label: "Zoho Books", phase: "On CBQ order" },
  { v: "odoo", label: "Odoo 17", phase: "On CBQ order" },
  { v: "bc", label: "Dynamics 365 Business Central", phase: "On CBQ order" },
];

export const SERVICES = [
  { k: "bal", label: "Balance inquiry", scope: "Phase 1" },
  { k: "stmt", label: "Statements (camt.053 for SAP)", scope: "Phase 1" },
  { k: "dom", label: "Domestic payments, single", scope: "Phase 1" },
  { k: "bulk", label: "Domestic payments, bulk (F110)", scope: "Phase 1" },
  { k: "status", label: "Payment status and bank reference", scope: "Phase 1" },
  { k: "wps", label: "WPS payroll", scope: "Priced option" },
  { k: "intl", label: "International payments (SWIFT)", scope: "Priced option" },
  { k: "alerts", label: "Alerts and name verification", scope: "Priced option" },
];

export const ERP_USERS = [
  { sap: "F.HADDAD", name: "Fadi Haddad", role: "Maker", cbq: "fhaddad.alnoor", limit: 250000 },
  { sap: "M.NASSER", name: "Mona Nasser", role: "Checker", cbq: "mnasser.alnoor", limit: 1000000 },
  { sap: "K.RAHMAN", name: "Karim Rahman", role: "Viewer", cbq: "krahman.alnoor", limit: 0 },
  { sap: "BASIS_ADM", name: "SAP Basis team", role: "Connector administrator", cbq: "-", limit: 0 },
];

export const APPROVAL_QUEUE = [
  { id: "ONB-2026-0042", customer: "Al Noor Trading W.L.L.", erp: "SAP S/4HANA 2022", accounts: 3, submitted: "Today 09:14", officer: "-", live: true },
  { id: "ONB-2026-0041", customer: "Qatar Marine Engineering", erp: "SAP ECC 6.0 EHP 8", accounts: 2, submitted: "15 Nov 2026", officer: "s.hamad", status: ["More information requested", "warn"] },
  { id: "ONB-2026-0040", customer: "Pearl Coast Hospitality Group", erp: "SAP S/4HANA 2023", accounts: 5, submitted: "14 Nov 2026", officer: "a.alsulaiti", status: ["Approved", "ok"] },
  { id: "ONB-2026-0039", customer: "Al Khor Cement Products", erp: "Tally Prime", accounts: 1, submitted: "13 Nov 2026", officer: "s.hamad", status: ["Waitlisted: ERP on order", "neutral"] },
  { id: "ONB-2026-0038", customer: "Al Bidda Contracting", erp: "SAP S/4HANA 2021", accounts: 4, submitted: "12 Nov 2026", officer: "a.alsulaiti", status: ["Rejected: KYC review due", "bad"] },
];

export const ELIGIBILITY = [
  ["Customer KYC active in CBQ core", "Core banking · CIF 0081245"],
  ["Net Banking administrator verified", "Identity platform"],
  ["All linked accounts belong to this CIF", "Core banking"],
  ["ERP and release supported (S/4HANA 2020+)", "Platform version matrix"],
  ["Payment mandate and limits on file", "Mandate repository · dual control"],
  ["No sanctions or adverse media hits", "Screening · 16 Nov 2026"],
];

const T = (name, erp, ver, status, pays, stp, since) => ({ name, erp, ver, status, pays, stp, since });
export const TENANTS = [
  T("Al Noor Trading", "S/4HANA 2022", "1.4.0", "Live", 0, 0, "Today"),
  T("Pearl Coast Hospitality", "S/4HANA 2023", "1.4.0", "Live", 214, 0.91, "Month 10"),
  T("Dukhan Packaging Industries", "ECC 6.0 EHP 8", "1.4.0", "Live", 168, 0.86, "Month 9"),
  T("Gulf Steel Supplies", "S/4HANA 2020", "1.3.2", "Upgrade due", 142, 0.88, "Month 8"),
  T("Doha Logistics Co.", "S/4HANA 2022", "1.4.0", "Live", 131, 0.94, "Month 8"),
  T("Lusail Facilities Services", "ECC 6.0 EHP 7", "1.4.0", "Live", 97, 0.82, "Month 7"),
  T("Al Wakra Foods", "S/4HANA 2021", "1.4.0", "Live", 88, 0.9, "Month 7"),
  T("Najma Medical Supplies", "S/4HANA 2022", "1.3.2", "Upgrade due", 76, 0.79, "Month 6"),
  T("Ras Laffan Industrial Services", "ECC 6.0 EHP 8", "1.4.0", "Live", 159, 0.84, "Month 6"),
  T("West Bay Property Mgmt", "S/4HANA 2023", "1.4.0", "Heartbeat late", 54, 0.93, "Month 5"),
  T("Mesaieed Chemicals Trading", "S/4HANA 2020", "1.4.0", "Live", 112, 0.81, "Month 5"),
  T("Education City Services", "S/4HANA 2022", "1.4.0", "Live", 45, 0.97, "Month 4"),
];

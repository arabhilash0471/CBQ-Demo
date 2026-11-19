// Synthetic data for the extra scenarios: WPS payroll, international payment, cancel/recall, limits.
// Every name, IBAN, ID and amount is illustrative only.

export const WPS = {
  employerId: "EST-2-104578",
  month: "November 2026",
  file: "ALN_WPS_202611.SIF",
  run: "SAP payroll posting · PY-2026-11",
  employees: 148,
  total: 1186420.0,
  heldEmp: "E-1093",
  heldAmt: 6150.0,
  acceptId: "WPS-QA-26-11-0048812",
};

const E = (id, name, qid, bank, ib, basic, allow, ded, flag) => ({ id, name, qid, bank, iban: ib, basic, allow, ded, net: basic + allow - ded, flag });
export const WPS_SAMPLE = [
  E("E-1001", "Ahmed Saleh Al-Mansoori", "284•••••1123", "CBQA", "QA•• CBQA •••• 4410", 18500, 6200, 0),
  E("E-1004", "Priya Raghunathan", "290•••••4471", "CBQA", "QA•• CBQA •••• 7781", 9800, 3100, 450),
  E("E-1012", "Joseph Mensah", "287•••••9035", "QNBA", "QA•• QNBA •••• 1290", 4200, 1600, 0),
  E("E-1027", "Mariam Khalid Al-Sulaiti", "293•••••2268", "CBQA", "QA•• CBQA •••• 0957", 14200, 5100, 0),
  E("E-1038", "Rizwan Ahmed Qureshi", "286•••••7714", "DOHB", "QA•• DOHB •••• 3384", 3600, 1400, 200),
  E("E-1051", "Ana Lucia Ferreira", "291•••••5502", "CBQA", "QA•• CBQA •••• 6620", 7600, 2400, 0),
  E("E-1066", "Samuel Okafor", "288•••••3349", "QIIB", "QA•• QIIB •••• 8812", 3900, 1350, 0),
  E("E-1079", "Hassan Abdullah Al-Kaabi", "285•••••6627", "CBQA", "QA•• CBQA •••• 2045", 21000, 7400, 1250),
  E("E-1093", "Dinesh Kumar Pillai", "289•••••8180", "MAFR", "QA•• MAFR •••• ????", 4600, 1550, 0, "IBAN check digit invalid"),
  E("E-1102", "Fatima Zahra Benali", "292•••••4093", "CBQA", "QA•• CBQA •••• 5518", 8800, 2900, 0),
];

export const WPS_CHECKS = [
  ["Records parsed from SAP payroll posting", "148 of 148"],
  ["Employer establishment ID matches CBQ mandate", "EST-2-104578"],
  ["QID format and expiry", "148 valid"],
  ["IBAN check digits", "147 valid · 1 failed"],
  ["Salary components add up to net pay", "148 balanced"],
  ["Funding account balance covers total", "QAR 1,186,420.00 available"],
];

export const INTL = {
  vendor: "Hansa Präzisionsteile GmbH",
  city: "Hamburg, Germany",
  vno: "V20410",
  doc: "2000004530",
  inv: "HP-2026-0917",
  iban: "DE89370400440532013000",
  bic: "HANSDEHHXXX",
  ccy: "EUR",
  amt: 84300.0,
  rate: 4.0842,
  quoteId: "FXQ-261116-00731",
  validSecs: 120,
  fee: 75.0,
  charges: "SHA",
  purpose: "GDS · Purchase of goods",
  uetr: "3f1c9b2e-7a44-4d8e-9c21-5b6e0a7d91f4",
  ref: "CBQ26111603310",
};

/** SWIFT gpi-style tracker stages shown after CBQ sends the pacs.008. */
export const GPI = [
  ["Debited at CBQ", "QAR account debited, pacs.008 sent", "10:58"],
  ["With EUR correspondent", "Received and forwarded, no deduction", "11:06"],
  ["Beneficiary bank received", "Funds at beneficiary bank", "11:21"],
  ["Credited to beneficiary", "Confirmed credit, EUR 84,300.00", "11:34"],
];

export const RECALL_BATCH = "BT-77188";
export const RECALL_ITEMS = [
  { key: "A", doc: "2000004498", vendor: "Al Khor Marine Services", amt: 14250.0, status: "Scheduled · value date 17.11", why: "Wrong invoice selected; not yet executed by CBQ", ref: "" },
  { key: "B", doc: "2000004501", vendor: "Mesaieed Chemicals Trading", amt: 36800.0, status: "Completed 15.11", why: "Duplicate of invoice MCT/8812 paid in October", ref: "CBQ26111500744" },
];

/** Recall stages for an executed payment (item B). */
export const RECALL_STAGES = [
  ["Recall requested", "camt.056 sent by CBQ to the beneficiary bank"],
  ["Beneficiary bank accepted", "Beneficiary consent received, camt.029 positive"],
  ["Funds returned", "QAR 36,800.00 credited back; open item restored in SAP"],
];

export const DAILY_LIMIT = 5000000;
export const EARLIER_TODAY = 412300;
export const CUTOFF = "13:30 AST";

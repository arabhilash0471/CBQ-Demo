// Synthetic F110 payment run and statement data. Illustrative only.

export const STP_LIMIT = 25000;
export const RUN_ID = "F110 · 16.11.2026 · ALN01";
export const BATCH_ID = "BT-77310";

// bankRef is what CBQ returns on completion; the statement in step 7 carries the same reference (Rule 1 matches on it).
const P = (doc, vendor, vno, ibanStr, amt, inv, extra = {}) => ({ doc, vendor, vno, iban: ibanStr, amt, inv, bankRef: "", ...extra });
export const PAYMENT_RUN = [
  P("2000004512", "Gulf Steel Supplies WLL", "V10021", "QA47QNBA000000000123456789012", 48250.00, "GSS/INV/9921", { bankRef: "CBQ26111600981" }),
  P("2000004513", "Doha Logistics Co.", "V10045", "QA21CBQA000000000987654321098", 12900.00, "DLC-55410", { bankRef: "CBQ26111600982" }),
  P("2000004514", "Al Wakra Facilities Management", "V10077", "QA62DOHB000000000456789123456", 7450.00, "AWF-2026-311", { bankRef: "CBQ26111600983" }),
  P("2000004515", "Dukhan Packaging Industries", "V10102", "QA90QIIB000000000321654987321", 23600.00, "DPI/1188", { bankRef: "CBQ26111600984" }),
  P("2000004516", "Lusail IT Services", "V10140", "QA15CBQA000000000555444333222", 5180.00, "LIT-7781", { willReject: true }),
  P("2000004517", "Corniche Office Supplies", "V10151", "QA83QNBA000000000777888999000", 3215.50, "COS-44102", { bankRef: "CBQ26111600985" }),
  P("2000004518", "Al Sadd Security Services", "V10163", "QA44CBQA000000000246813579024", 18400.00, "ASS/NOV/26", { bankRef: "CBQ26111600986" }),
  P("2000004519", "Gulfwave Telecom Business", "V10170", "QA36QNBA000000000135792468013", 9872.35, "GTB-88231", { bankRef: "CBQ26111600987" }),
  P("2000004520", "Industrial Area Fuel Station", "V10188", "QA19MAFR000000000864209753186", 4390.00, "IAF-0911", { bankRef: "CBQ26111600988" }),
  P("2000004521", "Al Ruwais Customs Brokers", "V10201", "QA70QIIB000000000975318642097", 61750.00, "ARC-2026-77", { bankRef: "CBQ26111600989" }),
  P("2000004522", "Simaisma Cleaning Co.", "V10214", "QA55DOHB000000000112233445566", 2780.00, "SCC/1610", { bankRef: "CBQ26111600990" }),
  P("2000004523", "Doha Logistics Co.", "V10045", "QA21CBQA000000000987654321098", 12900.00, "DLC-55410", { dupHint: true }),
];

export const LIFE = ["Sent", "Validated", "At CBQ", "Approval", "Completed"];

export const REJECT = { code: "CBQ-R14", text: "Beneficiary account closed", action: "Correct the vendor bank details in SAP (BP; XK02 on ECC) and include the item in the next run as a new payment." };

export const STATEMENT_LINES = [
  { d: "16.11", desc: "Gulf Steel Supplies WLL", amt: -48250.00, ref: "CBQ26111600981", res: "Matched", how: "Rule 1: bank reference" },
  { d: "16.11", desc: "Doha Logistics Co.", amt: -12900.00, ref: "CBQ26111600982", res: "Matched", how: "Rule 1: bank reference" },
  { d: "16.11", desc: "Al Wakra Facilities Management", amt: -7450.00, ref: "CBQ26111600983", res: "Matched", how: "Rule 1: bank reference" },
  { d: "16.11", desc: "Dukhan Packaging Industries", amt: -23600.00, ref: "CBQ26111600984", res: "Matched", how: "Rule 2: amount, date, beneficiary" },
  { d: "16.11", desc: "Corniche Office Supplies", amt: -3215.50, ref: "CBQ26111600985", res: "Matched", how: "Rule 1: bank reference" },
  { d: "16.11", desc: "Al Sadd Security Services", amt: -18400.00, ref: "CBQ26111600986", res: "Matched", how: "Rule 1: bank reference" },
  { d: "16.11", desc: "Gulfwave Telecom Business", amt: -9872.35, ref: "CBQ26111600987", res: "Matched", how: "Rule 1: bank reference" },
  { d: "16.11", desc: "Industrial Area Fuel Station", amt: -4390.00, ref: "CBQ26111600988", res: "Matched", how: "Rule 2: amount, date, beneficiary" },
  { d: "16.11", desc: "Al Ruwais Customs Brokers", amt: -61750.00, ref: "CBQ26111600989", res: "Matched", how: "Rule 1: bank reference" },
  { d: "16.11", desc: "Simaisma Cleaning Co.", amt: -2780.00, ref: "CBQ26111600990", res: "Matched", how: "Rule 1: bank reference" },
  { d: "16.11", desc: "Transfer charges, batch BT-77310", amt: -50.00, ref: "CBQ26111600991", res: "Exception", how: "Bank charge: suggested posting rule “Bank charges” for the customer’s EBS set-up", exKey: "charge" },
  { d: "16.11", desc: "Incoming: Al Rayyan Retail", amt: 31400.00, ref: "CBQ26111601102", res: "Unmatched", how: "Receipt: passed to SAP for customer AR clearing" },
  { d: "16.11", desc: "Incoming: Pearl Coast Hospitality", amt: 84500.00, ref: "CBQ26111601118", res: "Unmatched", how: "Receipt: passed to SAP for customer AR clearing" },
];

export const RECON_RULES = [
  ["Rule 1", "Exact bank reference returned by CBQ on the payment", "Auto-match"],
  ["Rule 2", "Amount + value date + beneficiary IBAN, single candidate", "Auto-match"],
  ["Rule 3", "Amount within tolerance + beneficiary name similarity ≥ 0.9", "Suggest, user confirms"],
  ["Rule 4", "Bank charges and FX differences by transaction code", "Exception queue with a suggested posting rule"],
  ["Rule 5", "Incoming credits", "Passed to SAP for AR clearing (FEBAN)"],
];

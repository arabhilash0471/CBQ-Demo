// Canonical API catalogue (illustrative). Every connector implements these.

const j = (o) => JSON.stringify(o, null, 2);

export const ENDPOINTS = [
  {
    m: "post", path: "/v1/registrations", purpose: "Register a corporate customer and its ERP",
    req: j({ customerId: "CORP-0081245", erp: { product: "SAP_S4HANA", release: "2022" }, accounts: ["QA58CBQA000000001102334455667"], services: ["BALANCE", "STATEMENT", "PAYMENT_DOMESTIC", "PAYMENT_BULK", "STATUS"] }),
    res: j({ registrationId: "ONB-2026-0042", status: "PENDING_APPROVAL", eligibility: { kyc: "PASS", mandate: "PASS", accountsOwned: "PASS" } }),
  },
  {
    m: "get", path: "/v1/accounts/{accountId}/balance", purpose: "Live available and ledger balance",
    req: "GET /v1/accounts/QA58CBQA000000001102334455667/balance\nAuthorization: Bearer <15-min token>\nX-Correlation-Id: 6f1c…",
    res: j({ accountId: "QA58CBQA000000001102334455667", currency: "QAR", available: 1284560.40, ledger: 1291010.40, asOf: "2026-11-16T10:42:07+03:00" }),
  },
  {
    m: "post", path: "/v1/payment-batches", purpose: "Submit a bulk payment run (idempotent per document)",
    req: j({ batchRef: "ALN01-20261116", debitAccount: "QA58CBQA000000001102334455667", payments: [{ erpDocument: "2000004512", idempotencyKey: "S4P-100-2000004512-2026", amount: 48250.00, currency: "QAR", beneficiary: { name: "Gulf Steel Supplies WLL", iban: "QA47QNBA000000000123456789012" }, remittance: "GSS/INV/9921" }] }),
    res: j({ batchId: "BT-77310", accepted: 11, rejected: 0, approval: { required: true, reason: "AMOUNT_ABOVE_STP_LIMIT", method: ["OTP", "NET_BANKING"] } }),
  },
  {
    m: "get", path: "/v1/payments/{paymentId}/status", purpose: "Status, bank reference, CBQ reason code",
    req: "GET /v1/payments/PMT-2000004516/status",
    res: j({ paymentId: "PMT-2000004516", erpDocument: "2000004516", state: "REJECTED", reason: { code: "CBQ-R14", text: "Beneficiary account closed" }, history: ["SENT", "VALIDATED", "AT_CBQ", "REJECTED"] }),
  },
  {
    m: "get", path: "/v1/accounts/{accountId}/statements", purpose: "Statement for a date, as JSON or camt.053",
    req: "GET /v1/accounts/QA58…5566 7/statements?date=2026-11-16&format=camt.053.001.08",
    res: "<?xml version=\"1.0\"?>\n<Document xmlns=\"urn:iso:std:iso:20022:tech:xsd:camt.053.001.08\">\n  <BkToCstmrStmt>\n    <Stmt><Id>CBQ-STMT-20261116-5566</Id>\n      <Ntry><Amt Ccy=\"QAR\">48250.00</Amt><CdtDbtInd>DBIT</CdtDbtInd>\n        <AcctSvcrRef>CBQ26111600981</AcctSvcrRef></Ntry>\n      …\n</Document>",
  },
  {
    m: "post", path: "/v1/reconciliations", purpose: "Run rule-based matching for an account and date",
    req: j({ accountId: "QA58CBQA000000001102334455667", date: "2026-11-16", ruleset: "DEFAULT_V3" }),
    res: j({ reconciliationId: "RC-55120", matched: 10, exceptions: 1, unmatchedCredits: 2, rules: { R1: 8, R2: 2 } }),
  },
  {
    m: "post", path: "/v1/connectors/heartbeat", purpose: "Connector health and version (every 5 min)",
    req: j({ tenantId: "TN-0042", connector: "SAP-ABAP", version: "1.4.0", sapRelease: "S4HANA 2022 FPS02", queue: 0 }),
    res: j({ status: "OK", minimumVersion: "1.3.2", upgradeAvailable: false }),
  },
  {
    m: "delete", path: "/v1/tenants/{tenantId}", purpose: "Offboard: revoke certificate, invalidate tokens",
    req: "DELETE /v1/tenants/TN-0042  (CBQ admin, dual-controlled)",
    res: j({ tenantId: "TN-0042", certificate: "REVOKED", tokens: "INVALIDATED", export: "READY", deletionScheduled: "2027-11-16" }),
  },
];

export const PATTERNS = [
  { k: "A", name: "In-ERP plugin", used: "SAP (Phase 1); later Tally, Odoo on-premises, Business Central", how: "Extension inside the ERP calls the canonical API over mTLS with a per-customer certificate." },
  { k: "B", name: "Cloud-to-cloud", used: "Zoho Books, Odoo Online", how: "Platform adapter calls the ERP vendor API with tenant OAuth; nothing installed at the customer." },
  { k: "C", name: "File-based", used: "ERPs without a usable API", how: "ISO 20022 pain.001 / camt.053 files through the same platform controls and audit." },
];

export const SAP_FACTS = [
  ["Supported releases", "SAP ECC 6.0 EHP 7 SP 20 and above; SAP S/4HANA 2020 and above. On-premises or private cloud including RISE. TLS 1.2 required."],
  ["Payments", "F110 payment runs and F-53 manual payments, sent from the CBQ Banking cockpit (/INNOVAL/CBQ_COCKPIT)."],
  ["Status", "Status, bank reference and CBQ reason codes written to the payment document and visible in FBL1N."],
  ["Statements", "ISO 20022 camt.053 for standard Electronic Bank Statement import (FF_5 / FEBAN)."],
  ["Security", "Own namespace /INNOVAL/ and authorisation objects; per-customer certificate in STRUST; no stored banking credentials."],
  ["Delivery", "Signed transports, imported by the customer's Basis team; rollback by restoring the system backup taken before the transport import; a backup is recommended before every upgrade."],
];

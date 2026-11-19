// Synthetic operations, portfolio and dashboard series. Deterministic, illustrative only.

// Small seeded PRNG so every reload shows the same numbers.
function seeded(seed) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

const days = (n, endDay = 16) => Array.from({ length: n }, (_, i) => {
  const d = new Date(Date.UTC(2026, 10, endDay - (n - 1 - i)));
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" });
});

const rnd = seeded(42);
export const VOLUME_14D = days(14).map((label, i) => {
  const weekend = i % 7 === 4 || i % 7 === 5; // Fri/Sat in Qatar
  const base = weekend ? 220 : 1050 + i * 14;
  const stp = Math.round(base * (0.84 + rnd() * 0.08));
  const nonStp = Math.round(base * (0.1 + rnd() * 0.04));
  const rejected = Math.round(base * (0.008 + rnd() * 0.01));
  return { label, stp, nonStp, rejected };
});

const rnd2 = seeded(7);
export const LATENCY_24H = Array.from({ length: 24 }, (_, h) => ({
  label: `${String(h).padStart(2, "0")}:00`,
  p95: Math.round(320 + (h >= 8 && h <= 14 ? 90 : 0) + rnd2() * 70),
  p50: Math.round(140 + (h >= 8 && h <= 14 ? 30 : 0) + rnd2() * 30),
}));

const rnd3 = seeded(99);
const CASH_RAW = days(30).map((label, i) => ({
  label,
  value: Math.round(3_600_000 + Math.sin(i / 4) * 380_000 + i * 9_500 + rnd3() * 120_000),
}));
// Scale so today's closing balance equals the linked accounts on the cockpit
// (QAR 1,284,560.40 + 642,118.75 + USD 218,440.10 at the 3.64 peg = QAR 2,721,803).
const CASH_TODAY = 2721803;
export const CASH_30D = CASH_RAW.map((d) => ({ ...d, value: Math.round((d.value * CASH_TODAY) / CASH_RAW[CASH_RAW.length - 1].value) }));

export const ERP_MIX = [
  { label: "SAP S/4HANA", value: 8 },
  { label: "SAP ECC 6.0", value: 4 },
  { label: "Waitlist: Tally", value: 6 },
  { label: "Waitlist: Zoho Books", value: 3 },
  { label: "Waitlist: Odoo / BC", value: 2 },
];

export const REJECT_REASONS = [
  { label: "CBQ-R14 Account closed", value: 11 },
  { label: "CBQ-R03 Invalid IBAN", value: 8 },
  { label: "CBQ-R21 Cut-off passed", value: 6 },
  { label: "CBQ-R09 Limit exceeded", value: 4 },
  { label: "CBQ-R30 Name mismatch", value: 3 },
];

export const TOP_BENEFICIARIES = [
  { label: "Al Ruwais Customs Brokers", value: 412300 },
  { label: "Gulf Steel Supplies WLL", value: 356900 },
  { label: "Dukhan Packaging Industries", value: 211450 },
  { label: "Al Sadd Security Services", value: 147200 },
  { label: "Doha Logistics Co.", value: 129000 },
];

export const CONNECTOR_VERSIONS = [
  { ver: "1.4.0", released: "Month 11", tenants: 10, notes: "camt.053 v08, F-53 single payments, heartbeat v2", status: ["Current", "ok"] },
  { ver: "1.3.2", released: "Month 9", tenants: 2, notes: "Security patch: token refresh hardening", status: ["Upgrade due this month", "warn"] },
  { ver: "1.2.x", released: "Month 6", tenants: 0, notes: "Retired; blocked by hub version enforcement", status: ["Blocked", "bad"] },
];

export const INCIDENTS = [
  { id: "INC-0114", when: "Mon 09:02", sev: "P3", what: "West Bay Property Mgmt heartbeat late (SAP job suspended by customer)", state: ["Monitoring", "warn"] },
  { id: "INC-0101", when: "Last month", sev: "P4", what: "Statement for one USD account delayed 40 min at source", state: ["Resolved", "ok"] },
];

export const NOTIFICATIONS = [
  { ic: "user-plus", title: "New registration ONB-2026-0042", sub: "Al Noor Trading W.L.L. · awaiting CBQ approval" },
  { ic: "triangle-alert", title: "2 connectors on 1.3.2", sub: "Upgrade window closes at month end" },
  { ic: "calendar-clock", title: "Monthly service review", sub: "Availability and incident report due Friday" },
];

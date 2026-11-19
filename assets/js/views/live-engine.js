// Live simulation engine: a pure step function over an immutable snapshot.
// One tick = one simulated minute of platform traffic across all tenants. Seeded, so runs repeat.
import { TENANTS } from "../data/customers.js";
import { STP_LIMIT } from "../data/payments.js";

const WINDOW = 30;     // points kept on the rolling charts
const FEED_MAX = 14;   // events kept in the feed
const REASONS = [
  ["CBQ-R03", "Invalid beneficiary IBAN"],
  ["CBQ-R14", "Beneficiary account closed"],
  ["CBQ-R22", "Insufficient funds"],
  ["CBQ-R31", "Received after cut-off"],
];
const LIVE_TENANTS = TENANTS.filter((t) => t.pays > 0);
const WEIGHT_SUM = LIVE_TENANTS.reduce((a, t) => a + t.pays, 0);

/** mulberry32: returns [value in 0..1, next seed]. */
function rand(seed) {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, (seed + 0x6d2b79f5) | 0];
}

/** Draw n random numbers from a seed. */
function draws(seed, n) {
  const out = [];
  let s = seed;
  for (let i = 0; i < n; i++) { const [v, next] = rand(s); out.push(v); s = next; }
  return [out, s];
}

const pickTenant = (r) => {
  let acc = r * WEIGHT_SUM;
  return LIVE_TENANTS.find((t) => (acc -= t.pays) <= 0) || LIVE_TENANTS[0];
};

const clock = (minute) => {
  const m = 8 * 60 + minute;
  return `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

export const initialSim = () => Object.freeze({
  minute: 0, seed: 20261116, running: false, speed: 1,
  pays: 0, value: 0, stp: 0, approval: 0, rejected: 0,
  thru: [], p95: [], feed: [], byTenant: {}, incident: null, incidents: 0,
});

/** Advance the simulation by one minute. Pure: returns a new snapshot. */
export function step(sim) {
  const [r, seed] = draws(sim.seed, 40);
  const busy = sim.minute >= 60 && sim.minute <= 330 ? 1.6 : 1; // 09:00–13:30 peak before cut-off
  const n = Math.round((6 + r[0] * 10) * busy);
  let value = 0, stp = 0, approval = 0, rejected = 0;
  const byTenant = { ...sim.byTenant };
  const events = [];
  for (let i = 0; i < n; i++) {
    const t = pickTenant(r[(i * 3 + 1) % 40]);
    // Long-tailed amounts: roughly 1 in 8 lands above the STP limit, matching the portfolio STP rate.
    const amt = Math.round(800 + r[(i * 3 + 2) % 40] ** 10 * 90000);
    value += amt;
    byTenant[t.name] = (byTenant[t.name] || 0) + 1;
    if (r[(i * 3 + 3) % 40] < 0.012) {
      rejected += 1;
      const [code, text] = REASONS[Math.floor(r[(i + 7) % 40] * REASONS.length)];
      events.push({ kind: "bad", ic: "circle-x", title: `${t.name} · payment rejected`, sub: `${code} ${text} · returned to ${t.erp}` });
    } else if (amt > STP_LIMIT) approval += 1;
    else stp += 1;
  }
  const lead = pickTenant(r[30]);
  events.unshift({ kind: "info", ic: "send", title: `${lead.name} · batch received`, sub: `${Math.max(1, Math.round(n / 3))} payments via ${lead.erp}` });
  if (approval && r[31] < 0.5) events.push({ kind: "warn", ic: "key-round", title: `${pickTenant(r[32]).name} · CBQ approval`, sub: `${approval} payment(s) above STP limit approved with OTP` });
  if (r[33] < 0.08) events.push({ kind: "ok", ic: "file-check", title: `${pickTenant(r[34]).name} · statement delivered`, sub: "camt.053 ready for SAP, auto-reconciled" });

  // Occasional latency incident on the CBQ adapter that self-heals after a few minutes.
  let incident = sim.incident, incidents = sim.incidents;
  if (!incident && r[35] < 0.025) {
    incident = { id: `INC-${2611 + incidents}`, left: 4 };
    incidents += 1;
    events.push({ kind: "bad", ic: "siren", title: `${incident.id} · p95 above 800 ms on CBQ adapter`, sub: "Auto-scaled adapter pods; CBQ operations paged" });
  } else if (incident) {
    incident = incident.left > 1 ? { ...incident, left: incident.left - 1 } : null;
    if (!incident) events.push({ kind: "ok", ic: "circle-check", title: `${sim.incident.id} · resolved`, sub: "Latency back within SLO" });
  }
  const p95 = Math.round((incident ? 820 : 300) + r[36] * 120 + (busy > 1 ? 60 : 0));
  const time = clock(sim.minute + 1);

  return Object.freeze({
    ...sim,
    minute: sim.minute + 1, seed,
    pays: sim.pays + n, value: sim.value + value, stp: sim.stp + stp, approval: sim.approval + approval, rejected: sim.rejected + rejected,
    thru: [...sim.thru, { label: time, n }].slice(-WINDOW),
    p95: [...sim.p95, { label: time, v: p95 }].slice(-WINDOW),
    feed: [...events.map((e) => ({ ...e, t: time })), ...sim.feed].slice(0, FEED_MAX),
    byTenant, incident, incidents,
  });
}

export const simClock = (sim) => clock(sim.minute);

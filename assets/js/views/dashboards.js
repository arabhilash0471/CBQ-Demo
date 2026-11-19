// Dashboards: corporate customer cockpit and CBQ portfolio view.
import { esc, pill, section, table, kpis, iban, fmt, qarShort, asOf, int, illustrative } from "../ui.js";
import { withUi } from "../state.js";
import { ONBOARD_ACCOUNTS, TENANTS } from "../data/customers.js";
import { CASH_30D, VOLUME_14D, TOP_BENEFICIARIES, ERP_MIX, REJECT_REASONS } from "../data/ops.js";
import { lines, stackedBars, donut, hbars, spark } from "../charts.js";

// Cash KPI reads from the same series as the chart, so the two always agree.
const CASH_NOW = CASH_30D[CASH_30D.length - 1].value;
const CASH_CHANGE = ((CASH_NOW - CASH_30D[0].value) / CASH_30D[0].value) * 100;

const tabs = (cur) => `<div class="tabs" role="tablist">
  ${[["customer", "Customer cockpit · Al Noor Trading"], ["portfolio", "CBQ portfolio view"]].map(([k, l]) =>
    `<button class="tab" role="tab" aria-selected="${cur === k}" data-a="dashTab" data-k="${k}">${esc(l)}</button>`).join("")}</div>`;

function customer() {
  const linked = ONBOARD_ACCOUNTS.filter((a) => a.defaultOn);
  const acc = table([
    { h: "Account", r: (a) => `<span class="ref">${iban(a.iban)}</span>` }, { h: "Type", k: "type" }, { h: "Ccy", k: "ccy" },
    { h: "Available", num: true, r: (a) => `${esc(a.ccy)} ${esc(fmt(a.balance))}` },
    { h: "7 days", r: (a, i) => spark([3, 5, 4, 6, 5, 7, 6].map((v) => v * (i + 2) + (a.balance % 7)), { ci: i }) },
  ], linked);
  return kpis([
    { label: "Cash position (QAR eq.)", value: qarShort(CASH_NOW), ic: "wallet", delta: `${CASH_CHANGE >= 0 ? "+" : ""}${CASH_CHANGE.toFixed(1)}% vs 30 days ago`, dir: CASH_CHANGE >= 0 ? "up" : "down", caption: asOf("CBQ") },
    { label: "Paid this month", value: "QAR 1.92M", ic: "send", delta: "214 payments", dir: "flat" },
    { label: "STP rate", value: "86%", ic: "zap", delta: "+3 pts", dir: "up" },
    { label: "Auto-reconciled", value: "96%", ic: "scale", delta: "Target 95%", dir: "up" },
    { label: "Avg. approval time", value: "11 min", ic: "timer", delta: "-6 min vs Oct", dir: "up" },
  ]) + `<div class="grid g-2-1">
    ${section({ title: "Cash position, 30 days (QAR eq.)", ic: "line-chart", body: lines(CASH_30D, [{ key: "value", name: "Closing balance" }], { area: true, fmt: qarShort }), caption: asOf("CBQ statements") })}
    ${section({ title: "Top beneficiaries, month to date", ic: "users", body: hbars(TOP_BENEFICIARIES, { fmt: qarShort }) })}
  </div>
  <div style="margin-top:12px">${section({ title: "Linked accounts", ic: "landmark", body: acc, caption: "Live balance inquiry through the connector · CBQ is the source" })}</div>`;
}

function portfolio() {
  const live = TENANTS.filter((t) => t.pays > 0);
  const avgStp = live.reduce((a, t) => a + t.stp, 0) / live.length;
  const total14 = VOLUME_14D.reduce((a, d) => a + d.stp + d.nonStp + d.rejected, 0);
  const top = [...live].sort((a, b) => b.pays - a.pays).slice(0, 6);
  return kpis([
    { label: "Onboarded customers", value: "12", ic: "building-2", delta: "+3 this quarter", dir: "up" },
    { label: "Waitlist, other ERPs", value: "11", ic: "list-plus", caption: "Tally 6 · Zoho 3 · Odoo/BC 2" },
    { label: "Payments, 14 days", value: int(total14), ic: "send", delta: "+8.4%", dir: "up" },
    { label: "Average STP rate", value: `${Math.round(avgStp * 100)}%`, ic: "zap", caption: "Across live tenants" },
    { label: "Value, 14 days", value: "QAR 41.6M", ic: "banknote", delta: "+12%", dir: "up" },
  ]) + `<div class="grid g3">
    ${section({ title: "Customers by ERP", ic: "pie-chart", body: donut(ERP_MIX, { center: "23", sub: "CUSTOMERS" }) })}
    ${section({ title: "Rejection reasons, 30 days", ic: "circle-x", body: hbars(REJECT_REASONS, { ci: 4 }) })}
    ${section({ title: "Most active tenants (7d)", ic: "trophy", body: hbars(top.map((t) => ({ label: t.name, value: t.pays })), { ci: 1 }) })}
  </div>
  <div style="margin-top:12px">${section({ title: "Payments by route, 14 days", ic: "bar-chart-3", body: stackedBars(VOLUME_14D, [{ key: "stp", name: "STP" }, { key: "nonStp", name: "CBQ approval", ci: 1 }, { key: "rejected", name: "Rejected", ci: 4 }]), caption: "Platform metrics · illustrative, year 1 after go-live" })}</div>
  <div style="margin-top:12px">${section({ title: "Tenant health", ic: "heart-pulse", body: table([
    { h: "Tenant", k: "name" }, { h: "ERP", k: "erp" }, { h: "Connector", r: (t) => `<span class="ref">${esc(t.ver)}</span>` },
    { h: "Payments (7d)", num: true, r: (t) => esc(int(t.pays)) }, { h: "STP", num: true, r: (t) => (t.stp ? `${Math.round(t.stp * 100)}%` : "-") },
    { h: "Status", r: (t) => pill(t.status, t.status === "Live" ? "ok" : "warn") }], TENANTS.slice(1)) })}</div>`;
}

function dashboards(s) {
  const cur = s.ui.dashTab;
  return `<div class="page-head"><div class="txt"><div class="eyebrow">Dashboards · synthetic data</div><h1 class="page-title">What customers and CBQ see every day</h1>
    <p class="page-desc">The same data that drives the walkthrough, rolled up: a corporate treasurer’s cockpit, and CBQ’s view across every connected customer.</p></div></div>
    ${illustrative("Year 1 after go-live. Customers, balances and volumes are synthetic.")}${tabs(cur)}<div data-tour="dash">${cur === "customer" ? customer() : portfolio()}</div>`;
}

export const pages = [{ id: "dashboards", render: dashboards }];
export const actions = { dashTab: (s, d) => withUi(s, { dashTab: d.k }) };

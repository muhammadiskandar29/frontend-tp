"use client";

import "@/styles/sales/dashboard.css";
import Layout from "@/components/Layout";
import GreetingBanner from "@/components/GreetingBanner";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  ShoppingCart,
  CreditCard,
  Percent,
  Package,
  DollarSign,
  Truck,
  Wallet,
  PiggyBank,
} from "lucide-react";
import dynamic from "next/dynamic";

// Lazy load heavy components
const LazyChart = dynamic(
  () => import("recharts").then((mod) => mod.LineChart),
  { ssr: false }
);
const LazyLine = dynamic(
  () => import("recharts").then((mod) => mod.Line),
  { ssr: false }
);
const LazyResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);
const LazyXAxis = dynamic(
  () => import("recharts").then((mod) => mod.XAxis),
  { ssr: false }
);
const LazyTooltip = dynamic(
  () => import("recharts").then((mod) => mod.Tooltip),
  { ssr: false }
);
const LazyCartesianGrid = dynamic(
  () => import("recharts").then((mod) => mod.CartesianGrid),
  { ssr: false }
);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activityRangeDays, setActivityRangeDays] = useState(30);
  const [financeRangeDays, setFinanceRangeDays] = useState(30);

  const requestDays = useMemo(() => Math.max(activityRangeDays, financeRangeDays), [activityRangeDays, financeRangeDays]);

  const makeRangeLabel = (days) => `Last ${days} days`;

  const formatShortDay = (date) => {
    try {
      return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(date);
    } catch {
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }
  };

  const buildSeriesForLastNDays = useCallback(
    (points, days) => {
      const list = Array.isArray(points) ? points : [];
      const byKey = new Map();
      for (const p of list) {
        if (!p) continue;
        const key = p.date || p.tanggal || p.label;
        if (key != null) byKey.set(String(key), p);
      }

      const out = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const iso = d.toISOString().slice(0, 10);
        const label = formatShortDay(d);

        const hit = byKey.get(iso) || byKey.get(label);
        out.push({
          label,
          orders: hit?.order ?? hit?.orders ?? 0,
          transactions: hit?.transaksi ?? hit?.transactions ?? 0,
        });
      }
      return out;
    },
    [formatShortDay]
  );

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/sales/dashboard?days=${encodeURIComponent(requestDays)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error("Gagal memuat data dashboard");
      }

      const json = await response.json();
      setData(json.data);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  }, [requestDays]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const overview = data?.overview;
  const financial = data?.financial;
  const statistik = data?.statistik;

  const summaryCards = useMemo(() => {
    return [
      {
        title: "Total Orders",
        value: overview?.orders_total?.toLocaleString("id-ID") ?? (loading ? "…" : "0"),
        icon: <ShoppingCart size={22} />,
        color: "accent-orange",
      },
      {
        title: "Total Paid",
        value: overview?.orders_paid?.toLocaleString("id-ID") ?? (loading ? "…" : "0"),
        icon: <CreditCard size={22} />,
        color: "accent-orange",
      },
      {
        title: "Paid Ratio",
        value: overview?.paid_ratio_formatted ?? (loading ? "…" : "0%"),
        icon: <Percent size={22} />,
        color: "accent-orange",
      },
      {
        title: "Unpaid Orders",
        value: overview?.orders_unpaid?.toLocaleString("id-ID") ?? (loading ? "…" : "0"),
        icon: <Package size={22} />,
        color: "accent-orange",
      },
    ];
  }, [overview, loading]);

  const revenueCards = useMemo(() => {
    return [
      {
        title: "Gross Revenue",
        value: financial?.gross_revenue_formatted ?? (loading ? "…" : "Rp0"),
        icon: <DollarSign size={22} />,
        color: "accent-orange",
      },
      {
        title: "Shipping Cost",
        value: financial?.shipping_cost_formatted ?? (loading ? "…" : "Rp0"),
        icon: <Truck size={22} />,
        color: "accent-orange",
      },
      {
        title: "Net Revenue",
        value: financial?.net_revenue_formatted ?? (loading ? "…" : "Rp0"),
        icon: <Wallet size={22} />,
        color: "accent-orange",
      },
      {
        title: "Gross Profit",
        value: financial?.gross_profit_formatted ?? (loading ? "…" : "Rp0"),
        icon: <PiggyBank size={22} />,
        color: "accent-orange",
      },
      {
        title: "Net Profit",
        value: financial?.net_profit_formatted ?? (loading ? "…" : "Rp0"),
        icon: <TrendingUp size={22} />,
        color: "accent-orange",
      },
    ];
  }, [financial, loading]);

  const activityTrend = useMemo(() => {
    const raw =
      data?.chart_transaksi_order?.map((point) => ({
        label: point.label,
        order: point.order,
        transaksi: point.transaksi,
        date: point.date,
        tanggal: point.tanggal,
      })) ?? [];

    // If API provides dated points (ideal), build a full N-day series.
    // If API only provides limited points (e.g., weekday buckets), we still show them as-is.
    const hasDateKey = raw.some((p) => p?.date || p?.tanggal);
    if (hasDateKey) return buildSeriesForLastNDays(raw, activityRangeDays);

    return raw.map((p) => ({
      label: p.label,
      orders: p.order ?? 0,
      transactions: p.transaksi ?? 0,
    }));
  }, [data, activityRangeDays, buildSeriesForLastNDays]);

  const chartHasData = activityTrend.length > 0;

  return (
    <Layout title="Dashboard" aboveContent={<GreetingBanner />}>
      <div className="dashboard-shell">
        {error && <div className="dashboard-alert">{error}</div>}
        <section className="dashboard-hero">
          <div className="dashboard-main-layout">
            <div className="dashboard-summary">
              {summaryCards.map((card, index) => (
                <article className="summary-card" key={card.title}>
                  <div className={`summary-card__icon ${card.color}`}>{card.icon}</div>
                  <div>
                    <p className="summary-card__label">{card.title}</p>
                    <p className="summary-card__value">{card.value}</p>
                  </div>
                </article>
              ))}
            </div>

            <article className="panel panel--revenue">
              <div className="panel__header">
                <div>
                  <p className="panel__eyebrow">Revenue breakdown</p>
                  <h3 className="panel__title">Financial Snapshot</h3>
                </div>
                <label className="panel__filter" aria-label="Filter range for Financial Snapshot">
                  <select
                    className="panel__select"
                    value={financeRangeDays}
                    onChange={(e) => setFinanceRangeDays(Number(e.target.value))}
                  >
                    <option value={7}>{makeRangeLabel(7)}</option>
                    <option value={14}>{makeRangeLabel(14)}</option>
                    <option value={30}>{makeRangeLabel(30)}</option>
                  </select>
                </label>
              </div>

              <div className="revenue-grid">
                {revenueCards.map((card) => (
                  <article className="revenue-card" key={card.title}>
                    <div className={`revenue-card__icon ${card.color}`}>{card.icon}</div>
                    <div>
                      <p className="revenue-card__label">{card.title}</p>
                      <p className="revenue-card__value">{card.value}</p>
                    </div>
                  </article>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="dashboard-panels">
          <article className="panel panel--chart">
            <div className="panel__header">
              <div>
                <p className="panel__eyebrow">Orders vs Transactions</p>
                <h3 className="panel__title">Sales Activity</h3>
              </div>
              <label className="panel__filter" aria-label="Filter range for Sales Activity">
                <select
                  className="panel__select"
                  value={activityRangeDays}
                  onChange={(e) => setActivityRangeDays(Number(e.target.value))}
                >
                  <option value={7}>Last 7 days</option>
                  <option value={14}>Last 14 days</option>
                  <option value={30}>Last 30 days</option>
                </select>
              </label>
            </div>

            {LazyResponsiveContainer && LazyChart && LazyLine && LazyXAxis && LazyTooltip && LazyCartesianGrid ? (
              <LazyResponsiveContainer width="100%" height={280}>
                <LazyChart data={chartHasData ? activityTrend : [{ label: "-", orders: 0, transactions: 0 }]}>
                  <LazyCartesianGrid stroke="#F1F5F9" vertical={false} />
                  <LazyXAxis dataKey="label" stroke="#94A3B8" fontSize={12} tickMargin={12} />
                  <LazyTooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0" }}
                    formatter={(value, name) => [value, name === "orders" ? "Order" : "Transaksi"]}
                  />
                  <LazyLine type="monotone" dataKey="orders" stroke="#ff6c00" strokeWidth={3} dot={false} name="orders" />
                  <LazyLine
                    type="monotone"
                    dataKey="transactions"
                    stroke="#c85400"
                    strokeWidth={3}
                    dot={false}
                    name="transactions"
                  />
                </LazyChart>
              </LazyResponsiveContainer>
            ) : (
              <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                Loading chart...
              </div>
            )}
            {!chartHasData && <p className="panel__empty">Belum ada data transaksi untuk periode ini.</p>}
          </article>

        </section>
      </div>
    </Layout>
  );
}

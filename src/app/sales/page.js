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

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/sales/dashboard", {
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
  }, []);

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
        color: "accent-blue",
      },
      {
        title: "Total Paid",
        value: overview?.orders_paid?.toLocaleString("id-ID") ?? (loading ? "…" : "0"),
        icon: <CreditCard size={22} />,
        color: "accent-emerald",
      },
      {
        title: "Paid Ratio",
        value: overview?.paid_ratio_formatted ?? (loading ? "…" : "0%"),
        icon: <Percent size={22} />,
        color: "accent-amber",
      },
      {
        title: "Unpaid Orders",
        value: overview?.orders_unpaid?.toLocaleString("id-ID") ?? (loading ? "…" : "0"),
        icon: <Package size={22} />,
        color: "accent-red",
      },
    ];
  }, [overview, loading]);

  const revenueCards = useMemo(() => {
    return [
      {
        title: "Gross Revenue",
        value: financial?.gross_revenue_formatted ?? (loading ? "…" : "Rp0"),
        icon: <DollarSign size={22} />,
        color: "accent-emerald",
      },
      {
        title: "Shipping Cost",
        value: financial?.shipping_cost_formatted ?? (loading ? "…" : "Rp0"),
        icon: <Truck size={22} />,
        color: "accent-purple",
      },
      {
        title: "Net Revenue",
        value: financial?.net_revenue_formatted ?? (loading ? "…" : "Rp0"),
        icon: <Wallet size={22} />,
        color: "accent-indigo",
      },
      {
        title: "Gross Profit",
        value: financial?.gross_profit_formatted ?? (loading ? "…" : "Rp0"),
        icon: <PiggyBank size={22} />,
        color: "accent-pink",
      },
      {
        title: "Net Profit",
        value: financial?.net_profit_formatted ?? (loading ? "…" : "Rp0"),
        icon: <TrendingUp size={22} />,
        color: "accent-teal",
      },
    ];
  }, [financial, loading]);

  const activityTrend = useMemo(() => {
    return (
      data?.chart_transaksi_order?.map((point) => ({
        label: point.label,
        orders: point.order,
        transactions: point.transaksi,
      })) ?? []
    );
  }, [data]);

  const chartHasData = activityTrend.length > 0;

  return (
    <Layout title="Dashboard | Sales Panel">
      <div className="dashboard-shell">
        <GreetingBanner />
        {error && <div className="dashboard-alert">{error}</div>}
        <section className="dashboard-hero">
          <div className="dashboard-hero__copy">
            <p className="dashboard-hero__eyebrow">Performance</p>
            <h2 className="dashboard-hero__title">Sales Dashboard Overview</h2>
            <p className="dashboard-hero__subtitle">Sales pipeline, revenue, and fulfillment.</p>
            <span className="dashboard-hero__meta">
              <span role="img" aria-label="calendar">
                📅
              </span>{" "}
              {statistik?.total_penjualan_hari_ini_formatted
                ? `Hari ini: ${statistik.total_penjualan_hari_ini_formatted}`
                : "Last 30 Days"}
            </span>
          </div>

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
        </section>

        <section className="dashboard-panels">
          <article className="panel panel--chart">
            <div className="panel__header">
              <div>
                <p className="panel__eyebrow">Orders vs Transactions</p>
                <h3 className="panel__title">Sales Activity</h3>
              </div>
              <span className="panel__meta">Last 30 days</span>
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
                  <LazyLine type="monotone" dataKey="orders" stroke="#6366F1" strokeWidth={3} dot={false} name="orders" />
                  <LazyLine
                    type="monotone"
                    dataKey="transactions"
                    stroke="#F97316"
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

          <article className="panel panel--revenue">
            <div className="panel__header">
              <div>
                <p className="panel__eyebrow">Revenue breakdown</p>
                <h3 className="panel__title">Financial Snapshot</h3>
              </div>
              <span className="panel__meta accent-green">Stable</span>
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
        </section>
      </div>
    </Layout>
  );
}

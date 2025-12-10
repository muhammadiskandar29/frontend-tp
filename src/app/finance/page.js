"use client";

import "@/styles/finance/dashboard.css";
import Layout from "@/components/Layout";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Wallet,
  PiggyBank,
  CreditCard,
  FileCheck,
  AlertCircle,
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

export default function FinanceDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Dummy data untuk finance dashboard
  const DUMMY_DATA = {
    overview: {
      orders_pending: 25,
      orders_approved: 128,
      orders_rejected: 5,
      orders_dp: 12,
      approval_ratio: 85.5,
    },
    financial: {
      total_revenue: 125000000,
      total_approved_amount: 98000000,
      total_pending_amount: 15000000,
      total_rejected_amount: 5000000,
      total_dp_amount: 7000000,
    },
    statistik: {
      approval_today: 8,
    },
    chart_transaksi_order: [
      { label: "Week 1", order: 45, transaksi: 38 },
      { label: "Week 2", order: 52, transaksi: 45 },
      { label: "Week 3", order: 38, transaksi: 32 },
      { label: "Week 4", order: 61, transaksi: 55 },
    ],
  };

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      // const token = localStorage.getItem("token");
      // const response = await fetch("/api/finance/dashboard", {
      //   method: "GET",
      //   headers: {
      //     "Content-Type": "application/json",
      //     "Accept": "application/json",
      //     ...(token ? { Authorization: `Bearer ${token}` } : {}),
      //   },
      // });
      // const json = await response.json();
      // setData(json.data);

      // Using dummy data for now
      setTimeout(() => {
        setData(DUMMY_DATA);
        setLoading(false);
      }, 500);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat memuat data");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const overview = data?.overview;
  const financial = data?.financial;
  const statistik = data?.statistik;

  const formatCurrency = (value) => {
    if (!value) return "Rp0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const summaryCards = useMemo(() => {
    return [
      {
        title: "Pending Approval",
        value: overview?.orders_pending?.toLocaleString("id-ID") ?? (loading ? "…" : "0"),
        icon: <Clock size={22} />,
        color: "accent-amber",
      },
      {
        title: "Approved Orders",
        value: overview?.orders_approved?.toLocaleString("id-ID") ?? (loading ? "…" : "0"),
        icon: <CheckCircle size={22} />,
        color: "accent-emerald",
      },
      {
        title: "Rejected Orders",
        value: overview?.orders_rejected?.toLocaleString("id-ID") ?? (loading ? "…" : "0"),
        icon: <XCircle size={22} />,
        color: "accent-red",
      },
      {
        title: "DP Orders",
        value: overview?.orders_dp?.toLocaleString("id-ID") ?? (loading ? "…" : "0"),
        icon: <FileCheck size={22} />,
        color: "accent-blue",
      },
    ];
  }, [overview, loading]);

  const revenueCards = useMemo(() => {
    return [
      {
        title: "Total Revenue",
        value: financial?.total_revenue ? formatCurrency(financial.total_revenue) : (loading ? "…" : "Rp0"),
        icon: <DollarSign size={22} />,
        color: "accent-emerald",
      },
      {
        title: "Approved Amount",
        value: financial?.total_approved_amount ? formatCurrency(financial.total_approved_amount) : (loading ? "…" : "Rp0"),
        icon: <CheckCircle size={22} />,
        color: "accent-green",
      },
      {
        title: "Pending Amount",
        value: financial?.total_pending_amount ? formatCurrency(financial.total_pending_amount) : (loading ? "…" : "Rp0"),
        icon: <Clock size={22} />,
        color: "accent-amber",
      },
      {
        title: "Rejected Amount",
        value: financial?.total_rejected_amount ? formatCurrency(financial.total_rejected_amount) : (loading ? "…" : "Rp0"),
        icon: <XCircle size={22} />,
        color: "accent-red",
      },
      {
        title: "DP Amount",
        value: financial?.total_dp_amount ? formatCurrency(financial.total_dp_amount) : (loading ? "…" : "Rp0"),
        icon: <CreditCard size={22} />,
        color: "accent-purple",
      },
      {
        title: "Approval Ratio",
        value: overview?.approval_ratio ? `${overview.approval_ratio}%` : (loading ? "…" : "0%"),
        icon: <TrendingUp size={22} />,
        color: "accent-indigo",
      },
    ];
  }, [financial, overview, loading]);

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
    <Layout title="Dashboard | Finance Panel">
      <div className="dashboard-shell">
        {error && <div className="dashboard-alert">{error}</div>}
        <section className="dashboard-hero">
          <div className="dashboard-hero__copy">
            <p className="dashboard-hero__eyebrow">Financial Control</p>
            <h2 className="dashboard-hero__title">Finance Dashboard Overview</h2>
            <p className="dashboard-hero__subtitle">Payment approvals, revenue tracking, and financial insights.</p>
            <span className="dashboard-hero__meta">
              <span role="img" aria-label="calendar">
                📅
              </span>{" "}
              {statistik?.approval_today
                ? `Hari ini: ${statistik.approval_today} approvals`
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
                <h3 className="panel__title">Approval Activity</h3>
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
                <p className="panel__eyebrow">Financial breakdown</p>
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

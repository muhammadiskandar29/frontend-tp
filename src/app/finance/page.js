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

  // Dummy data untuk finance dashboard - Data finansial, bukan order
  const DUMMY_DATA = {
    overview: {
      total_pemasukan: 250000000,
      total_pengeluaran: 180000000,
      net_profit: 70000000,
      cash_flow: 45000000,
    },
    financial: {
      pemasukan_bulan_ini: 85000000,
      pemasukan_bulan_lalu: 72000000,
      pengeluaran_bulan_ini: 55000000,
      pengeluaran_bulan_lalu: 48000000,
      outstanding_payments: 35000000,
      pending_approvals: 15000000,
    },
    statistik: {
      profit_margin: 28.0,
      growth_rate: 18.5,
    },
    chart_financial: [
      { label: "Week 1", pemasukan: 45000000, pengeluaran: 32000000 },
      { label: "Week 2", pemasukan: 52000000, pengeluaran: 38000000 },
      { label: "Week 3", pemasukan: 48000000, pengeluaran: 35000000 },
      { label: "Week 4", pemasukan: 61000000, pengeluaran: 42000000 },
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
        title: "Pemasukan Bulan Ini",
        value: financial?.pemasukan_bulan_ini ? formatCurrency(financial.pemasukan_bulan_ini) : (loading ? "…" : "Rp0"),
        icon: <TrendingUp size={22} />,
        color: "accent-emerald",
      },
      {
        title: "Pemasukan Bulan Lalu",
        value: financial?.pemasukan_bulan_lalu ? formatCurrency(financial.pemasukan_bulan_lalu) : (loading ? "…" : "Rp0"),
        icon: <DollarSign size={22} />,
        color: "accent-green",
      },
      {
        title: "Pengeluaran Bulan Ini",
        value: financial?.pengeluaran_bulan_ini ? formatCurrency(financial.pengeluaran_bulan_ini) : (loading ? "…" : "Rp0"),
        icon: <Wallet size={22} />,
        color: "accent-red",
      },
      {
        title: "Pengeluaran Bulan Lalu",
        value: financial?.pengeluaran_bulan_lalu ? formatCurrency(financial.pengeluaran_bulan_lalu) : (loading ? "…" : "Rp0"),
        icon: <CreditCard size={22} />,
        color: "accent-amber",
      },
      {
        title: "Outstanding Payments",
        value: financial?.outstanding_payments ? formatCurrency(financial.outstanding_payments) : (loading ? "…" : "Rp0"),
        icon: <AlertCircle size={22} />,
        color: "accent-purple",
      },
      {
        title: "Pending Approvals",
        value: financial?.pending_approvals ? formatCurrency(financial.pending_approvals) : (loading ? "…" : "Rp0"),
        icon: <Clock size={22} />,
        color: "accent-indigo",
      },
    ];
  }, [financial, loading]);

  const activityTrend = useMemo(() => {
    return (
      data?.chart_financial?.map((point) => ({
        label: point.label,
        pemasukan: point.pemasukan / 1000000, // Convert to millions for display
        pengeluaran: point.pengeluaran / 1000000,
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
              {statistik?.profit_margin
                ? `Profit Margin: ${statistik.profit_margin}% | Growth: ${statistik.growth_rate}%`
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
                <p className="panel__eyebrow">Pemasukan vs Pengeluaran</p>
                <h3 className="panel__title">Financial Activity</h3>
              </div>
              <span className="panel__meta">Last 30 days</span>
            </div>

            {LazyResponsiveContainer && LazyChart && LazyLine && LazyXAxis && LazyTooltip && LazyCartesianGrid ? (
              <LazyResponsiveContainer width="100%" height={280}>
                <LazyChart data={chartHasData ? activityTrend : [{ label: "-", pemasukan: 0, pengeluaran: 0 }]}>
                  <LazyCartesianGrid stroke="#F1F5F9" vertical={false} />
                  <LazyXAxis dataKey="label" stroke="#94A3B8" fontSize={12} tickMargin={12} />
                  <LazyTooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0" }}
                    formatter={(value, name) => [
                      `Rp${Number(value).toLocaleString("id-ID")}M`,
                      name === "pemasukan" ? "Pemasukan" : "Pengeluaran"
                    ]}
                  />
                  <LazyLine type="monotone" dataKey="pemasukan" stroke="#10b981" strokeWidth={3} dot={false} name="pemasukan" />
                  <LazyLine
                    type="monotone"
                    dataKey="pengeluaran"
                    stroke="#ef4444"
                    strokeWidth={3}
                    dot={false}
                    name="pengeluaran"
                  />
                </LazyChart>
              </LazyResponsiveContainer>
            ) : (
              <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                Loading chart...
              </div>
            )}
            {!chartHasData && <p className="panel__empty">Belum ada data finansial untuk periode ini.</p>}
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

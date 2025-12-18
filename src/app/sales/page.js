"use client";

import "@/styles/sales/dashboard-premium.css";
import Layout from "@/components/Layout";
import GreetingBanner from "@/components/GreetingBanner";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
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
  User,
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
        icon: <ShoppingCart size={24} />,
        color: "accent-orange",
      },
      {
        title: "Total Paid",
        value: overview?.orders_paid?.toLocaleString("id-ID") ?? (loading ? "…" : "0"),
        icon: <CreditCard size={24} />,
        color: "accent-orange",
      },
      {
        title: "Paid Ratio",
        value: overview?.paid_ratio_formatted ?? (loading ? "…" : "0%"),
        icon: <Percent size={24} />,
        color: "accent-orange",
      },
      {
        title: "Unpaid Orders",
        value: overview?.orders_unpaid?.toLocaleString("id-ID") ?? (loading ? "…" : "0"),
        icon: <Package size={24} />,
        color: "accent-orange",
      },
    ];
  }, [overview, loading]);

  const revenueCards = useMemo(() => {
    return [
      {
        title: "Gross Revenue",
        value: financial?.gross_revenue_formatted ?? (loading ? "…" : "Rp0"),
        icon: <DollarSign size={24} />,
        color: "accent-orange",
      },
      {
        title: "Shipping Cost",
        value: financial?.shipping_cost_formatted ?? (loading ? "…" : "Rp0"),
        icon: <Truck size={24} />,
        color: "accent-orange",
      },
      {
        title: "Net Revenue",
        value: financial?.net_revenue_formatted ?? (loading ? "…" : "Rp0"),
        icon: <Wallet size={24} />,
        color: "accent-orange",
      },
      {
        title: "Gross Profit",
        value: financial?.gross_profit_formatted ?? (loading ? "…" : "Rp0"),
        icon: <PiggyBank size={24} />,
        color: "accent-orange",
      },
      {
        title: "Net Profit",
        value: financial?.net_profit_formatted ?? (loading ? "…" : "Rp0"),
        icon: <TrendingUp size={24} />,
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
  const staffCardsRef = useRef([]);

  // Dummy data untuk staff sales dengan data lengkap
  const staffSalesData = [
    {
      name: "Salsa",
      totalLeads: 45,
      totalClosing: 28,
      conversionRate: 62.22,
      totalRevenue: 125000000,
      averageDealSize: 4464286,
      responseTime: "2.5 jam",
      activeDeals: 12,
      closedThisMonth: 8,
      targetAchievement: 87.5,
      customerSatisfaction: 4.6,
    },
    {
      name: "Budi",
      totalLeads: 52,
      totalClosing: 35,
      conversionRate: 67.31,
      totalRevenue: 158000000,
      averageDealSize: 4514286,
      responseTime: "1.8 jam",
      activeDeals: 15,
      closedThisMonth: 10,
      targetAchievement: 95.2,
      customerSatisfaction: 4.8,
    },
    {
      name: "Rina",
      totalLeads: 38,
      totalClosing: 24,
      conversionRate: 63.16,
      totalRevenue: 98000000,
      averageDealSize: 4083333,
      responseTime: "3.2 jam",
      activeDeals: 9,
      closedThisMonth: 6,
      targetAchievement: 75.0,
      customerSatisfaction: 4.4,
    },
  ];

  // Scroll effect untuk staff cards
  useEffect(() => {
    // Set semua cards sebagai visible secara default
    staffCardsRef.current.forEach((card) => {
      if (card) {
        card.classList.add("visible");
      }
    });

    const observerOptions = {
      root: null,
      rootMargin: "50px",
      threshold: 0.1,
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe cards untuk animasi saat scroll
    setTimeout(() => {
      staffCardsRef.current.forEach((card) => {
        if (card) {
          // Check initial visibility
          const rect = card.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            card.classList.add("visible");
          }
          observer.observe(card);
        }
      });
    }, 50);

    return () => {
      staffCardsRef.current.forEach((card) => {
        if (card) observer.unobserve(card);
      });
    };
  }, []);

  return (
    <Layout title="Dashboard" aboveContent={<GreetingBanner />}>
      <div className="dashboard-shell">
        {error && <div className="dashboard-alert">{error}</div>}
        <section className="dashboard-hero">
          <div className="dashboard-summary-horizontal">
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

        <section className="dashboard-staff-section">
          <div className="dashboard-staff-layout">
            <article className="panel panel--staff">
              <div className="panel__header">
                <div>
                  <p className="panel__eyebrow">Data per staff sales</p>
                  <h3 className="panel__title">Sales Performance</h3>
                </div>
              </div>

              <div className="staff-cards-container">
                {staffSalesData.map((staff, index) => (
                  <article
                    ref={(el) => (staffCardsRef.current[index] = el)}
                    className="staff-card"
                    key={staff.name}
                    data-index={index}
                  >
                    <div className="staff-card__header">
                      <div className="staff-card__avatar">
                        <User size={24} />
                      </div>
                      <div className="staff-card__header-info">
                        <h4 className="staff-card__name">{staff.name}</h4>
                        <p className="staff-card__role">Sales Representative</p>
                      </div>
                    </div>
                    
                    <div className="staff-card__stats">
                      <div className="staff-card__stat-row">
                        <div className="staff-card__stat">
                          <p className="staff-card__stat-label">Total Leads</p>
                          <p className="staff-card__stat-value">{staff.totalLeads}</p>
                        </div>
                        <div className="staff-card__stat">
                          <p className="staff-card__stat-label">Total Closing</p>
                          <p className="staff-card__stat-value">{staff.totalClosing}</p>
                        </div>
                      </div>
                      
                      <div className="staff-card__stat-row">
                        <div className="staff-card__stat">
                          <p className="staff-card__stat-label">Conversion Rate</p>
                          <p className="staff-card__stat-value">{staff.conversionRate.toFixed(2)}%</p>
                        </div>
                        <div className="staff-card__stat">
                          <p className="staff-card__stat-label">Total Revenue</p>
                          <p className="staff-card__stat-value">Rp {staff.totalRevenue.toLocaleString("id-ID")}</p>
                        </div>
                      </div>
                      
                      <div className="staff-card__stat-row">
                        <div className="staff-card__stat">
                          <p className="staff-card__stat-label">Average Deal Size</p>
                          <p className="staff-card__stat-value">Rp {staff.averageDealSize.toLocaleString("id-ID")}</p>
                        </div>
                        <div className="staff-card__stat">
                          <p className="staff-card__stat-label">Response Time</p>
                          <p className="staff-card__stat-value">{staff.responseTime}</p>
                        </div>
                      </div>
                      
                      <div className="staff-card__stat-row">
                        <div className="staff-card__stat">
                          <p className="staff-card__stat-label">Active Deals</p>
                          <p className="staff-card__stat-value">{staff.activeDeals}</p>
                        </div>
                        <div className="staff-card__stat">
                          <p className="staff-card__stat-label">Closed This Month</p>
                          <p className="staff-card__stat-value">{staff.closedThisMonth}</p>
                        </div>
                      </div>
                      
                      <div className="staff-card__stat-row">
                        <div className="staff-card__stat">
                          <p className="staff-card__stat-label">Target Achievement</p>
                          <p className="staff-card__stat-value">{staff.targetAchievement}%</p>
                        </div>
                        <div className="staff-card__stat">
                          <p className="staff-card__stat-label">Customer Satisfaction</p>
                          <p className="staff-card__stat-value">{staff.customerSatisfaction}/5.0</p>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </article>

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

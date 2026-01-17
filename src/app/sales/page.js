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
import { getOrders } from "@/lib/sales/orders";
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

  // State for Sales Statistics
  const [salesStatistics, setSalesStatistics] = useState([]);
  const [loadingStatistics, setLoadingStatistics] = useState(true);
  const [periodInfo, setPeriodInfo] = useState(null);

  // State for Recent Activity Lists
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentFollowups, setRecentFollowups] = useState([]);

  // Helper formatter
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("id-ID", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  // Load Recent Activity (Orders & Followups)
  const loadRecentActivity = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      // 1. Fetch Recent Orders
      const ordersRes = await getOrders(1, 10);
      if (ordersRes && Array.isArray(ordersRes.data)) {
        setRecentOrders(ordersRes.data.slice(0, 10));
      }

      // 2. Fetch Recent Followups (Last 30 days to ensure data visibility)
      const d = new Date();
      d.setDate(d.getDate() - 30);
      const dateFrom = d.toISOString().split("T")[0];
      const dateTo = new Date().toISOString().split("T")[0];

      const fpRes = await fetch(`/api/sales/logs-follup?date_from=${dateFrom}&date_to=${dateTo}`, {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (fpRes.ok) {
        const json = await fpRes.json();
        if (json.success && Array.isArray(json.data)) {
          // Sort by created_at desc
          const sorted = json.data.sort((a, b) => new Date(b.created_at || b.create_at) - new Date(a.created_at || a.create_at));
          setRecentFollowups(sorted.slice(0, 10));
        }
      }
    } catch (e) {
      console.error("Ordered/Followup fetch error:", e);
    }
  }, []);

  useEffect(() => {
    loadRecentActivity();
  }, [loadRecentActivity]);

  // Load Sales Statistics
  const loadSalesStatistics = useCallback(async () => {
    setLoadingStatistics(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/sales/statistics", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        console.error("Gagal memuat statistik sales");
        return;
      }

      const json = await response.json();
      if (json.success && json.data?.statistics) {
        setSalesStatistics(json.data.statistics);
        if (json.data.period) setPeriodInfo(json.data.period);
      }
    } catch (err) {
      console.error("Error loading sales statistics:", err);
    } finally {
      setLoadingStatistics(false);
    }
  }, []);

  useEffect(() => {
    loadSalesStatistics();
  }, [loadSalesStatistics]);

  // Scroll effect untuk staff cards
  useEffect(() => {
    if (loadingStatistics || salesStatistics.length === 0) return;

    // Reset visibility just in case
    staffCardsRef.current.forEach((card) => {
      if (card) card.classList.remove("visible");
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
    }, 100);

    return () => {
      staffCardsRef.current.forEach((card) => {
        if (card) observer.unobserve(card);
      });
    };
  }, [salesStatistics, loadingStatistics]);

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
                  <p className="panel__eyebrow">
                    Data per staff sales
                    {periodInfo && (
                      <span style={{ fontWeight: 'normal', opacity: 0.8, marginLeft: '4px' }}>
                        ({new Date(periodInfo.start_date).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' })} - {new Date(periodInfo.end_date).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' })})
                      </span>
                    )}
                  </p>
                  <h3 className="panel__title">Sales Performance</h3>
                </div>
              </div>

              <div className="staff-cards-container">
                {loadingStatistics ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading data performa sales...</div>
                ) : salesStatistics.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Belum ada data sales.</div>
                ) : (
                  salesStatistics.map((staff, index) => (
                    <article
                      ref={(el) => (staffCardsRef.current[index] = el)}
                      className="staff-card"
                      key={staff.sales_id || index}
                      data-index={index}
                    >
                      <div className="staff-card__header">
                        <div className="staff-card__avatar">
                          <User size={24} />
                        </div>
                        <div className="staff-card__header-info">
                          <h4 className="staff-card__name">{staff.sales_nama}</h4>
                          <p className="staff-card__role">
                            {staff.sales_level === "2" ? "Sales Representative" : "Sales Staff"}
                          </p>
                          {staff.sales_email && (
                            <p className="staff-card__email" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              {staff.sales_email}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="staff-card__stats">
                        {/* Customer Stats */}
                        <div className="staff-card__stat-row">
                          <div className="staff-card__stat">
                            <p className="staff-card__stat-label">Total Customers</p>
                            <p className="staff-card__stat-value">{staff.customers?.total ?? 0}</p>
                          </div>
                          <div className="staff-card__stat">
                            <p className="staff-card__stat-label">New (This Period)</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <p className="staff-card__stat-value">{staff.customers?.new_this_period ?? 0}</p>
                              {staff.customers?.growth !== 0 && (
                                <span style={{
                                  fontSize: '0.75rem',
                                  color: staff.customers?.growth > 0 ? '#10b981' : '#ef4444',
                                  fontWeight: 500
                                }}>
                                  {staff.customers?.growth_formatted}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Order Stats */}
                        <div className="staff-card__stat-row">
                          <div className="staff-card__stat">
                            <p className="staff-card__stat-label">Total Orders</p>
                            <p className="staff-card__stat-value">{staff.orders?.total ?? 0}</p>
                          </div>
                          <div className="staff-card__stat">
                            <p className="staff-card__stat-label">Orders (This Period)</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <p className="staff-card__stat-value">{staff.orders?.this_period ?? 0}</p>
                              {staff.orders?.growth !== 0 && (
                                <span style={{
                                  fontSize: '0.75rem',
                                  color: staff.orders?.growth > 0 ? '#10b981' : '#ef4444',
                                  fontWeight: 500
                                }}>
                                  {staff.orders?.growth_formatted}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Revenue Stats */}
                        <div className="staff-card__stat-row">
                          <div className="staff-card__stat">
                            <p className="staff-card__stat-label">Total Revenue</p>
                            <p className="staff-card__stat-value" style={{ fontSize: '0.9rem' }}>
                              {staff.revenue?.total_formatted ?? "Rp 0"}
                            </p>
                          </div>
                          <div className="staff-card__stat">
                            <p className="staff-card__stat-label">Revenue (This Period)</p>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                              <p className="staff-card__stat-value" style={{ fontSize: '0.9rem' }}>
                                {staff.revenue?.this_period_formatted ?? "Rp 0"}
                              </p>
                              {staff.revenue?.growth !== 0 && (
                                <span style={{
                                  fontSize: '0.75rem',
                                  color: staff.revenue?.growth > 0 ? '#10b981' : '#ef4444',
                                  fontWeight: 500
                                }}>
                                  {staff.revenue?.growth_formatted} vs prev
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Efficiency Stats */}
                        <div className="staff-card__stat-row">
                          <div className="staff-card__stat">
                            <p className="staff-card__stat-label">Conversion Rate</p>
                            <p className="staff-card__stat-value">
                              {staff.conversion_rates?.customer_to_order_formatted ?? "0%"}
                            </p>
                          </div>
                          <div className="staff-card__stat">
                            <p className="staff-card__stat-label">Avg Order Value</p>
                            <p className="staff-card__stat-value" style={{ fontSize: '0.9rem' }}>
                              {staff.average_order_value?.this_period_formatted ?? "Rp 0"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))
                )}
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
            {!chartHasData && <p className="panel__empty">Belum ada data transaksi untuk periode ini.</p>}
          </article>
        </section>

        {/* TWO TABLES: FOLLOW UP HISTORY & RECENT ORDERS */}
        <section className="dashboard-panels">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', width: '100%' }} className="recent-activity-grid">

            <style jsx>{`
                @media (max-width: 1024px) {
                  .recent-activity-grid {
                    grid-template-columns: 1fr !important;
                  }
                }
              `}</style>

            {/* TABLE 1: RECENT FOLLOW UP */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, padding: '1.5rem 1.5rem 1rem 1.5rem', color: '#1e293b' }}>
                Riwayat Terakhir Follow Up
              </h3>
              <div className="table-wrapper" style={{ margin: 0 }}>
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ background: '#f97316', padding: '0.875rem 1.5rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase' }}>CUSTOMER</th>
                      <th style={{ background: '#f97316', padding: '0.875rem 1.5rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase' }}>FOLLOW UP</th>
                      <th style={{ background: '#f97316', padding: '0.875rem 1.5rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase' }}>TANGGAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentFollowups.length > 0 ? (
                      recentFollowups.map((log, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', fontWeight: 500, color: '#334155' }}>
                            {log.customer_rel?.nama || log.customer_nama || log.customer?.nama || "-"}
                          </td>
                          <td style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', color: '#334155' }}>
                            {log.type_label || log.type || (log.follup ? `Type ${log.follup}` : "-")}
                          </td>
                          <td style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>
                            {formatDateTime(log.create_at || log.created_at)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="table-empty" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Belum ada follow up terbaru.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* TABLE 2: RECENT ORDERS */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, padding: '1.5rem 1.5rem 1rem 1.5rem', color: '#1e293b' }}>
                Pembelian Terakhir
              </h3>
              <div className="table-wrapper" style={{ margin: 0 }}>
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ background: '#f97316', padding: '0.875rem 1.5rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase' }}>CUSTOMER</th>
                      <th style={{ background: '#f97316', padding: '0.875rem 1.5rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase' }}>PRODUK</th>
                      <th style={{ background: '#f97316', padding: '0.875rem 1.5rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase' }}>TOTAL</th>
                      <th style={{ background: '#f97316', padding: '0.875rem 1.5rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase' }}>TANGGAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.length > 0 ? (
                      recentOrders.map((order, idx) => {
                        const productName = Array.isArray(order.items) && order.items[0]
                          ? order.items[0].nama_produk || order.items[0].nama
                          : (order.produk_nama || "-");

                        return (
                          <tr key={idx}>
                            <td style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', fontWeight: 500, color: '#334155' }}>
                              {order.nama_customer || order.customer?.nama || order.nama || "-"}
                            </td>
                            <td style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#334155' }}>
                              {productName}
                            </td>
                            <td style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: '#0f172a' }}>
                              {formatCurrency(order.total_harga)}
                            </td>
                            <td style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>
                              {formatDateTime(order.created_at || order.create_at || order.tanggal_dibuat)}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="4" className="table-empty" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Belum ada order terbaru.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </section>
      </div>
    </Layout>
  );
}

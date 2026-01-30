"use client";

import "@/styles/sales/dashboard-premium.css";
import "@/styles/sales/orders-page.css";
import Layout from "@/components/Layout";
import GreetingBanner from "@/components/GreetingBanner";
import { useState, useEffect, useCallback } from "react";
import {
  User,
  CheckCircle,
  Clock,
  Package,
  ShoppingCart,
  AlertCircle,
  Target,
  Calendar,
  Wallet,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { getOrders, getOrderStatisticPerSales } from "@/lib/sales/orders";
import Link from "next/link";
import axios from "axios";

const BASE_URL = "/api";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState({
    leadsAssignedToday: 0,
    leadsAssignedThisMonth: 0,
    followUpDoneToday: 0,
    followUpOverdue: 0,
    activeDeals: 0,
    closedThisMonth: 0,
    avgResponseTime: "N/A",
    monthlyTarget: 0,
    monthlyProgress: 0,
    closingTarget: 0,
    closingProgress: 0,
  });

  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    totalRevenue: 0, // Based on fetched data
    prosesCount: 0,
    successCount: 0,
    upsellingCount: 0,
    batalCount: 0,
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [followUpHistory, setFollowUpHistory] = useState([]);
  const [mePerformance, setMePerformance] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [productStats, setProductStats] = useState([]);
  const [productSummary, setProductSummary] = useState(null);

  // Status mapping matching orders page
  const STATUS_ORDER_MAP = {
    "1": { label: "Proses", class: "proses", color: "warning" },
    "2": { label: "Processing", class: "sukses", color: "success" },
    "3": { label: "Failed", class: "failed", color: "danger" },
    "4": { label: "Upselling", class: "upselling", color: "info" },
    "N": { label: "Dihapus", class: "dihapus", color: "secondary" },
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      // Get current user ID from localStorage
      const userDataStr = localStorage.getItem("user");
      let currentUserId = null;
      if (userDataStr) {
        try {
          const user = JSON.parse(userDataStr);
          currentUserId = user.id;
          console.log("Dashboard - Fetching for User ID:", currentUserId);
        } catch (e) {
          console.error("Error parsing user data:", e);
        }
      }

      // 1. Process Individual Sales Statistics (Using same logic as Orders page)
      const statsPromise = getOrderStatisticPerSales();

      // 2. Process Dashboard Data (Activity & Recent)
      const dashPromise = axios.get(`${BASE_URL}/sales/dashboard`, {
        params: { sales_id: currentUserId },
        headers: { Authorization: `Bearer ${token}` }
      });

      // 3. Fetch Product Statistics
      const prodStatsPromise = axios.get(`${BASE_URL}/sales/dashboard/produk-statistics`, {
        params: { sales_id: currentUserId },
        headers: { Authorization: `Bearer ${token}` }
      });

      // 4. Fetch Recent Orders per Sales (New Source)
      const salesOrdersPromise = axios.get(`${BASE_URL}/sales/order/sales`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const [statsData, dashRes, prodRes, salesOrdersRes] = await Promise.all([
        statsPromise.catch(() => []),
        dashPromise.catch(() => ({ data: { success: false } })),
        prodStatsPromise.catch(() => ({ data: { success: false } })),
        salesOrdersPromise.catch(() => ({ data: { success: false } }))
      ]);

      // Handle Order Stats
      if (statsData && Array.isArray(statsData) && statsData.length > 0) {
        const myStats = statsData.find(s => Number(s.sales_id) === Number(currentUserId)) || statsData[0];
        if (myStats) {
          setOrderStats(prev => ({
            ...prev,
            totalOrders: Number(myStats.total_order) || 0,
            unpaidCount: Number(myStats.total_order_unpaid) || 0,
            prosesCount: Number(myStats.total_order_menunggu) || 0,
            paidCount: Number(myStats.total_order_sudah_diapprove) || 0,
            totalRevenue: Number(myStats.revenue) || 0,
            totalRevenueFormatted: formatCurrency(myStats.revenue),
            conversionRateFormatted: myStats.total_order > 0
              ? `${((myStats.total_order_sudah_diapprove / myStats.total_order) * 100).toFixed(2)}%`
              : "0.00%",
          }));
          setMePerformance({
            ...myStats,
            conversion_rate_formatted: myStats.total_order > 0
              ? `${((myStats.total_order_sudah_diapprove / myStats.total_order) * 100).toFixed(2)}%`
              : "0.00%"
          });
        }
      }

      // Handle Dashboard Data
      const dashJson = dashRes.data;
      if (dashJson.success) {
        const data = dashJson.data || dashJson;
        setDashboardStats(data);
        // setRecentOrders(data.pembelian_terakhir || []); // No longer using this for recent orders
        setFollowUpHistory(data.riwayat_follow_up || []);
      }

      // Handle Product Stats
      const prodJson = prodRes.data;
      if (prodJson.success && prodJson.data) {
        setProductStats(prodJson.data.produk_statistics || []);
        setProductSummary(prodJson.data.summary || null);
      }

      // Handle Recent Sales Orders (New Source)
      const salesOrdersJson = salesOrdersRes.data;
      if (salesOrdersJson.success) {
        // Limit to 10 for "Recent"
        const orders = salesOrdersJson.data?.data || salesOrdersJson.data || [];
        setRecentOrders(orders.slice(0, 10));
      }

    } catch (err) {
      console.error("Critical error fetching dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Format date and time
  const formatDate = (date) => {
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  // Grouped activity cards
  const leadsCards = [
    {
      label: "Leads Assigned (Hari Ini)",
      value: loading ? "..." : stats.leadsAssignedToday.toLocaleString("id-ID"),
      icon: <User size={24} />,
      color: "accent-blue",
    },
    {
      label: "Leads Assigned (Bulan Ini)",
      value: loading ? "..." : stats.leadsAssignedThisMonth.toLocaleString("id-ID"),
      icon: <User size={24} />,
      color: "accent-blue",
    },
  ];

  const followUpCards = [
    {
      label: "Follow Up Selesai Hari Ini",
      value: loading ? "..." : stats.followUpDoneToday.toLocaleString("id-ID"),
      icon: <CheckCircle size={24} />,
      color: "accent-emerald",
    },
    {
      label: "Follow Up Terlambat",
      value: loading ? "..." : stats.followUpOverdue.toLocaleString("id-ID"),
      icon: <AlertCircle size={24} />,
      color: "accent-red",
    },
  ];

  const dealsCards = [
    {
      label: "Active Deals",
      value: loading ? "..." : stats.activeDeals.toLocaleString("id-ID"),
      icon: <Package size={24} />,
      color: "accent-orange",
    },
    {
      label: "Closed Bulan Ini",
      value: loading ? "..." : stats.closedThisMonth.toLocaleString("id-ID"),
      icon: <ShoppingCart size={24} />,
      color: "accent-orange",
    },
    {
      label: "Avg Response Time",
      value: loading ? "..." : stats.avgResponseTime,
      icon: <Clock size={24} />,
      color: "accent-cyan",
    },
  ];

  // Calculate progress percentages
  const monthlyProgressPercent = stats.monthlyTarget > 0
    ? Math.min((stats.monthlyProgress / stats.monthlyTarget) * 100, 100)
    : 0;

  const closingProgressPercent = stats.closingTarget > 0
    ? Math.min((stats.closingProgress / stats.closingTarget) * 100, 100)
    : 0;

  // New Order Cards
  const orderCards = [
    {
      label: "Total Revenue",
      value: orderStats.totalRevenueFormatted || formatCurrency(orderStats.totalRevenue),
      icon: <Wallet size={24} />,
      color: "accent-emerald",
      desc: "Total Pendapatan"
    },
    {
      label: "Total Orders",
      value: (orderStats.totalOrders || 0).toLocaleString("id-ID"),
      icon: <ShoppingCart size={24} />,
      color: "accent-blue",
      desc: "Total Pesanan"
    },
    {
      label: "Unpaid Orders",
      value: (orderStats.unpaidCount || 0).toLocaleString("id-ID"),
      icon: <AlertCircle size={24} />,
      color: "accent-red",
      desc: "Belum Dibayar"
    },
    {
      label: "Conversion Rate",
      value: mePerformance?.conversion_rate_formatted || orderStats.conversionRateFormatted || "0.00%",
      icon: <TrendingUp size={24} />,
      color: "accent-cyan",
      desc: "Success / Total"
    }
  ];

  return (
    <Layout title="Dashboard" aboveContent={<GreetingBanner />}>
      <div className="dashboard-shell">

        {/* --- ORDERS OVERVIEW (NEW) --- */}
        <section className="dashboard-panels">
          <article className="panel panel--summary">
            <div className="panel__header">
              <div>
                <p className="panel__eyebrow">Sales Performance</p>
                <h3 className="panel__title">Order Overview</h3>
              </div>
              <Link href="/sales/staff/orders" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: '#3b82f6', fontWeight: 500, textDecoration: 'none' }}>
                Lihat Semua Order <ArrowRight size={16} />
              </Link>
            </div>
            <div className="dashboard-summary-horizontal">
              {orderCards.map((card) => (
                <article className="summary-card" key={card.label}>
                  <div className={`summary-card__icon ${card.color}`}>{card.icon}</div>
                  <div>
                    <p className="summary-card__label">{card.label}</p>
                    <p className="summary-card__value">{card.value}</p>
                    {card.desc && <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>{card.desc}</p>}
                  </div>
                </article>
              ))}
            </div>
          </article>
        </section>

        {/* --- PRODUCT PERFORMANCE (NEW & WIDE) --- */}
        <section className="dashboard-panels" style={{ marginTop: '1rem' }}>
          <article className="panel">
            <div className="panel__header">
              <div>
                <p className="panel__eyebrow">Product Performance</p>
                <h3 className="panel__title">Statistik Produk Terlaris Anda</h3>
                <p className="panel__subtitle">Analisis performa penjualan berdasarkan kategori produk</p>
              </div>
              {productSummary && (
                <div className="summary-pills">
                  <div className="pill">
                    <span className="pill-label">Total Produk:</span>
                    <span className="pill-value">{productSummary.total_produk}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: '1rem' }}>Informasi Produk</th>
                    <th style={{ textAlign: "center", padding: '1rem' }}>Total Leads</th>
                    <th style={{ textAlign: "center", padding: '1rem' }}>Conversion</th>
                    <th style={{ textAlign: "right", padding: '1rem' }}>Revenue (Paid)</th>
                    <th style={{ textAlign: "right", padding: '1rem' }}>Potential (Unpaid)</th>
                  </tr>
                </thead>
                <tbody>
                  {productStats.length > 0 ? (
                    productStats.map((prod, idx) => (
                      <tr key={prod.produk_id || idx}>
                        <td style={{ padding: '1rem' }}>
                          <div className="product-info-cell">
                            <div className="product-icon-box">
                              <Package size={18} />
                            </div>
                            <div>
                              <p className="product-name-txt">{prod.produk_nama}</p>
                              <span className="product-code-badge">{prod.produk_kode}</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <span className="stat-value-main">{prod.total_customers}</span>
                          <p className="stat-sub-txt">Customers</p>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div className="conversion-container">
                            <div className="conversion-text">
                              <span className="paid-count">{prod.total_paid}</span>
                              <span className="total-count">/ {prod.total_customers}</span>
                              <span className="percent-badge">
                                {prod.total_customers > 0
                                  ? `${((prod.total_paid / prod.total_customers) * 100).toFixed(0)}%`
                                  : '0%'}
                              </span>
                            </div>
                            <div className="progress-bar-bg">
                              <div
                                className="progress-bar-fill"
                                style={{
                                  width: `${prod.total_customers > 0 ? (prod.total_paid / prod.total_customers) * 100 : 0}%`,
                                  backgroundColor: prod.total_paid > 0 ? '#10b981' : '#e2e8f0'
                                }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <p className="revenue-paid">{prod.total_revenue_formatted}</p>
                          <span className="revenue-count">{prod.total_paid} Closing</span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <p className="revenue-pending">{prod.total_pending_revenue_formatted}</p>
                          <span className="revenue-count">{prod.total_unpaid} Pending</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="table-empty">
                        {loading ? "Memuat data statistik produk..." : "Belum ada statistik produk tersedia."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </section>

        {/* --- RECENT ACTIVITY GRID --- */}
        <div className="dashboard-grid-two-columns">
          {/* LEFT: RECENT ORDERS (Moved/Merged) */}
          <section className="dashboard-panels">
            <article className="panel">
              <div className="panel__header">
                <div>
                  <h3 className="panel__title">Recent Orders</h3>
                  <p className="panel__subtitle">Daftar transaksi pelanggan terakhir</p>
                </div>
              </div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: '1rem' }}>Customer</th>
                      <th style={{ textAlign: "left", padding: '1rem' }}>Status</th>
                      <th style={{ textAlign: "right", padding: '1rem' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.length > 0 ? (
                      recentOrders.map((order, idx) => (
                        <tr key={order.id || idx}>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <div className="customer-cell">
                              <div className="avatar-small">
                                {order.customer_rel?.nama?.charAt(0) || order.customer_nama?.charAt(0) || order.customer?.charAt(0) || "C"}
                              </div>
                              <div>
                                <span className="customer-name" style={{ fontSize: '0.85rem' }}>
                                  {order.customer_rel?.nama || order.customer_nama || order.customer || "-"}
                                </span>
                                <p style={{ fontSize: '0.65rem', color: '#94a3b8', margin: 0 }}>
                                  {order.tanggal_order || order.tanggal || order.create_at || "-"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span className={`status-badge ${String(order.status_pembayaran) === '2' ? 'paid' : 'unpaid'}`} style={{ fontSize: '0.65rem' }}>
                              {String(order.status_pembayaran) === '2' ? 'Paid' : 'Unpaid'}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: '#1e293b', fontSize: '0.8rem' }}>
                            {order.total_harga_formatted || formatCurrency(order.total_harga)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="table-empty">Belum ada order terbaru.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>
          </section>

          {/* RIGHT: FOLLOW UP HISTORY */}
          <section className="dashboard-panels">
            <article className="panel">
              <div className="panel__header">
                <div>
                  <h3 className="panel__title">Aktivitas Follow-Up</h3>
                  <p className="panel__subtitle">Riwayat interaksi terakhir Anda</p>
                </div>
              </div>
              <div className="activity-feed">
                {followUpHistory.length > 0 ? (
                  followUpHistory.map((log, idx) => (
                    <div className="activity-item" key={log.id || idx}>
                      <div className={`activity-status-dot ${log.status === "1" ? 'success' : 'failed'}`}></div>
                      <div className="activity-content">
                        <div className="activity-meta">
                          <span className="a-customer">{log.customer}</span>
                          <span className="a-time">{log.tanggal}</span>
                        </div>
                        <p className="a-type">{log.follup}</p>
                        <p className="a-desc">{log.keterangan?.substring(0, 60)}...</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-activity">Belum ada riwayat follow up.</div>
                )}
              </div>
            </article>
          </section>
        </div>
      </div>


      <style jsx>{`
        .dashboard-grid-two-columns {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 2rem;
          margin-top: 1rem;
        }

        /* Product Stats Premium Styles */
        .product-info-cell { display: flex; align-items: center; gap: 12px; }
        .product-icon-box {
          width: 36px; height: 36px; background: #eff6ff; color: #3b82f6; 
          border-radius: 8px; display: flex; align-items: center; justify-content: center;
        }
        .product-name-txt { font-weight: 700; color: #1e293b; margin: 0; font-size: 0.9rem; }
        .product-code-badge { 
          font-size: 0.65rem; font-weight: 700; color: #64748b; background: #f1f5f9; 
          padding: 2px 6px; border-radius: 4px; text-transform: uppercase;
        }

        .stat-value-main { font-size: 1.1rem; font-weight: 800; color: #1e293b; }
        .stat-sub-txt { font-size: 0.75rem; color: #94a3b8; margin: 0; }

        .summary-card__value { font-size: 1.15rem; font-weight: 800; color: #1e293b; }

        .conversion-container { width: 100%; max-width: 140px; }
        .conversion-text { display: flex; align-items: baseline; gap: 4px; margin-bottom: 6px; }
        .paid-count { font-weight: 800; color: #10b981; font-size: 0.9rem; }
        .total-count { color: #94a3b8; font-size: 0.75rem; }
        .percent-badge { 
          margin-left: auto; font-size: 0.7rem; font-weight: 700; color: #3b82f6;
          background: #eff6ff; padding: 1px 5px; border-radius: 4px;
        }
        .progress-bar-bg { width: 100%; height: 6px; background: #f1f5f9; border-radius: 10px; overflow: hidden; }
        .progress-bar-fill { height: 100%; border-radius: 10px; transition: width 0.5s ease; }

        .revenue-paid { font-weight: 800; color: #059669; font-size: 0.95rem; margin: 0; }
        .revenue-pending { font-weight: 800; color: #d97706; font-size: 0.95rem; margin: 0; }
        .revenue-count { font-size: 0.75rem; color: #94a3b8; font-weight: 500; }

        .summary-pills { display: flex; gap: 10px; }
        .pill { background: #f8fafc; border: 1px solid #e2e8f0; padding: 4px 12px; border-radius: 20px; display: flex; gap: 6px; align-items: center; }
        .pill-label { font-size: 0.7rem; color: #64748b; font-weight: 600; }
        .pill-value { font-size: 0.75rem; color: #1e293b; font-weight: 800; }

        .status-badge {
          font-size: 0.7rem; font-weight: 700; padding: 3px 8px; border-radius: 5px; text-transform: uppercase;
        }
        .status-badge.paid { background: #dcfce7; color: #15803d; }
        .status-badge.unpaid { background: #fee2e2; color: #b91c1c; }

        .customer-name { font-weight: 700; color: #1e293b; font-size: 0.9rem; }
        .avatar-small {
          width: 32px; height: 32px; background: #f1f5f9; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; color: #475569; font-size: 11px; flex-shrink: 0;
        }
        .customer-cell { display: flex; align-items: center; gap: 10px; }

        .panel__subtitle { font-size: 0.85rem; color: #94a3b8; margin-top: 4px; }

        /* Activity Feed Styles */
        .activity-feed {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          padding: 1rem 0;
        }
        .activity-item {
          display: flex;
          gap: 16px;
          position: relative;
        }
        .activity-item:not(:last-child):after {
          content: '';
          position: absolute;
          left: 5px;
          top: 20px;
          bottom: -20px;
          width: 1px;
          background: #f1f5f9;
        }
        .activity-status-dot {
          width: 12px; height: 12px; border-radius: 50%; border: 3px solid #fff;
          z-index: 10; flex-shrink: 0; margin-top: 5px;
          box-shadow: 0 0 0 1px #e2e8f0;
        }
        .activity-status-dot.success { background: #10b981; }
        .activity-status-dot.failed { background: #ef4444; }
        
        .activity-content { flex: 1; }
        .activity-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
        .a-customer { font-weight: 700; color: #334155; font-size: 0.9rem; }
        .a-time { font-size: 0.725rem; color: #94a3b8; }
        .a-type { font-size: 0.775rem; font-weight: 600; color: #ff7a00; margin-bottom: 4px; }
        .a-desc { font-size: 0.8rem; color: #64748b; line-height: 1.5; }
        
        @media (max-width: 1280px) {
          .dashboard-grid-two-columns { grid-template-columns: 1fr; }
        }
      `}</style>
    </Layout>
  );
}

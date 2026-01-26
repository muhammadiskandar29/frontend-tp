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
import { getOrders } from "@/lib/sales/orders";
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

  // Status mapping matching orders page
  const STATUS_ORDER_MAP = {
    "1": { label: "Proses", class: "proses", color: "warning" },
    "2": { label: "Sukses", class: "sukses", color: "success" },
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
        } catch (e) {
          console.error("Error parsing user data:", e);
        }
      }

      const response = await axios.get(`${BASE_URL}/sales/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        const data = response.data.data;

        // 1. Overview & Statistik
        setDashboardStats(data);

        // 2. Find "Me" in sales_performance
        if (data.sales_performance && currentUserId) {
          const me = data.sales_performance.find(s => Number(s.sales_id) === Number(currentUserId));
          setMePerformance(me);
        }

        // 3. Update Order Stats for Cards
        setOrderStats({
          totalOrders: data.overview?.orders_total || 0,
          totalRevenue: data.statistik?.total_penjualan_bulan_ini || 0,
          totalRevenueFormatted: data.statistik?.total_penjualan_bulan_ini_formatted || "Rp 0",
          prosesCount: data.overview?.orders_unpaid || 0, // In this context maybe unpaid is pending
          paidCount: data.overview?.orders_paid || 0,
          unpaidCount: data.overview?.orders_unpaid || 0,
          conversionRate: data.overview?.paid_ratio || 0,
          conversionRateFormatted: data.overview?.paid_ratio_formatted || "0.00%",
        });

        // 4. Recent Orders
        setRecentOrders(data.pembelian_terakhir || []);

        // 5. Follow Up History
        setFollowUpHistory(data.riwayat_follow_up || []);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
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
    },
    {
      label: "Pending Orders",
      value: (orderStats.prosesCount || 0).toLocaleString("id-ID"),
      icon: <Clock size={24} />,
      color: "accent-orange",
      desc: "Menunggu Proses"
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

        {/* --- RECENT ORDERS & FOLLOWUP (NEW) --- */}
        <div className="dashboard-grid-two-columns">
          {/* LEFT: RECENT ORDERS */}
          <section className="dashboard-panels">
            <article className="panel">
              <div className="panel__header">
                <div>
                  <h3 className="panel__title">Recent Orders</h3>
                  <p className="panel__subtitle">10 Transaksi terbaru milik Anda</p>
                </div>
              </div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: '1rem' }}>Customer</th>
                      <th style={{ textAlign: "left", padding: '1rem' }}>Produk</th>
                      <th style={{ textAlign: "left", padding: '1rem' }}>Total</th>
                      <th style={{ textAlign: "left", padding: '1rem' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.length > 0 ? (
                      recentOrders.map((order, idx) => (
                        <tr key={order.id || idx}>
                          <td style={{ padding: '1rem' }}>
                            <div className="customer-cell">
                              <div className="avatar-small">
                                {order.customer?.charAt(0) || "C"}
                              </div>
                              <span className="customer-name">{order.customer || "-"}</span>
                            </div>
                          </td>
                          <td style={{ padding: '1rem', color: '#4b5563', fontSize: '0.9rem' }}>
                            {order.produk || "-"}
                          </td>
                          <td style={{ padding: '1rem', fontWeight: 700, color: '#111827' }}>
                            {order.total_harga_formatted || formatCurrency(order.total_harga)}
                          </td>
                          <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.85rem' }}>
                            {order.tanggal || "-"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="table-empty">Belum ada order terbaru.</td>
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
                  <p className="panel__subtitle">Riwayat interaksi terakhir dengan leads</p>
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
                        <p className="a-desc">{log.keterangan?.substring(0, 80)}...</p>
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


        <style jsx>{`
        .dashboard-grid-two-columns {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 2rem;
          margin-top: 1rem;
        }

        .customer-name { font-weight: 700; color: #1e293b; }
        .avatar-small {
          width: 32px; height: 32px; background: #f1f5f9; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; color: #475569; font-size: 12px;
        }
        .customer-cell { display: flex; align-items: center; gap: 12px; }

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
        .a-customer { font-weight: 700; color: #334155; font-size: 0.95rem; }
        .a-time { font-size: 0.75rem; color: #94a3b8; }
        .a-type { font-size: 0.8rem; font-weight: 600; color: #ff7a00; margin-bottom: 4px; }
        .a-desc { font-size: 0.85rem; color: #64748b; line-height: 1.5; }
        
        @media (max-width: 1024px) {
          .dashboard-grid-two-columns { grid-template-columns: 1fr; }
        }
      `}</style>
    </Layout>
  );
}

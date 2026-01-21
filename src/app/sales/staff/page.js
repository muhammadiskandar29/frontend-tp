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
  XCircle,
} from "lucide-react";
import { getOrders, getOrderStatisticPerSales } from "@/lib/sales/orders";
import Link from "next/link";

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
    unpaidCount: 0,
    pendingCount: 0,
    successCount: 0,
    rejectedCount: 0,
    revenue: 0,
    totalRevenue: 0,
  });

  const [recentOrders, setRecentOrders] = useState([]);

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

      // Get current user ID
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

      // --- NEW: FETCH ORDERS DATA ---
      try {
        const ordersRes = await getOrders(1, 10, currentUserId);
        if (ordersRes && Array.isArray(ordersRes.data)) {
          setRecentOrders(ordersRes.data);
        }
      } catch (err) {
        console.error("Error fetching orders for dashboard:", err);
      }
      // ------------------------------

      // Fetch sales statistics (Replacing old fetch)
      try {
        const statsData = await getOrderStatisticPerSales();
        if (statsData && Array.isArray(statsData)) {
          // Filter by current logged-in Sales ID
          const myStats = statsData.find(
            (s) => Number(s.sales_id) === Number(currentUserId)
          );

          if (myStats) {
            console.log("📊 [STATISTICS] Found my stats:", myStats);
            setOrderStats({
              totalOrders: Number(myStats.total_order || 0),
              unpaidCount: Number(myStats.total_order_unpaid || 0),
              pendingCount: Number(myStats.total_order_menunggu || 0),
              successCount: Number(myStats.total_order_sudah_diapprove || 0),
              rejectedCount: Number(myStats.total_order_ditolak || 0),
              revenue: Number(myStats.revenue || 0),
              totalRevenue: Number(myStats.total_revenue || 0),
            });
          } else {
            console.warn("⚠️ [STATISTICS] No stats found for sales ID:", currentUserId);
          }
        }
      } catch (err) {
        console.error("Error fetching statistics:", err);
      }

      // Fetch follow-up done today from follow-up logs
      // This is a simplified approach - you may need to adjust based on your API
      const followUpParams = new URLSearchParams();
      if (currentUserId) {
        followUpParams.append("sales_id", currentUserId.toString());
      }
      const todayStr = new Date().toISOString().split("T")[0];
      followUpParams.append("date_from", todayStr);
      followUpParams.append("date_to", todayStr);

      try {
        const followUpRes = await fetch(`${BASE_URL}/sales/logs-follup?${followUpParams.toString()}`, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (followUpRes.ok) {
          const followUpData = await followUpRes.json();
          if (followUpData.success && followUpData.data) {
            const followUps = Array.isArray(followUpData.data) ? followUpData.data : [];
            setStats(prev => ({
              ...prev,
              followUpDoneToday: followUps.length,
            }));
          }
        }
      } catch (err) {
        console.log("Could not fetch follow-up logs:", err);
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

  return (
    <Layout title="Dashboard" aboveContent={<GreetingBanner />}>
      <div className="dashboard-shell">

        {/* --- ORDERS OVERVIEW (NEW) --- */}
        <section className="orders-summary">
          <article className="summary-card summary-card--combined">
            <div className="summary-card__column">
              <div className="summary-card__icon accent-orange">
                <ShoppingCart size={22} />
              </div>
              <div>
                <p className="summary-card__label">Total orders</p>
                <p className="summary-card__value">{(orderStats.totalOrders || 0).toLocaleString("id-ID")}</p>
              </div>
            </div>

            <div className="summary-card__divider"></div>

            <div className="summary-card__column">
              <div className="summary-card__icon accent-orange">
                <Clock size={22} />
              </div>
              <div>
                <p className="summary-card__label">Unpaid</p>
                <p className="summary-card__value">{(orderStats.unpaidCount || 0).toLocaleString("id-ID")}</p>
              </div>
            </div>

            <div className="summary-card__divider"></div>

            <div className="summary-card__column">
              <div className="summary-card__icon accent-orange">
                <Clock size={22} />
              </div>
              <div>
                <p className="summary-card__label">Pending</p>
                <p className="summary-card__value">{(orderStats.pendingCount || 0).toLocaleString("id-ID")}</p>
              </div>
            </div>

            <div className="summary-card__divider"></div>

            <div className="summary-card__column">
              <div className="summary-card__icon accent-orange">
                <CheckCircle size={22} />
              </div>
              <div>
                <p className="summary-card__label">Sukses</p>
                <p className="summary-card__value">{(orderStats.successCount || 0).toLocaleString("id-ID")}</p>
              </div>
            </div>

            <div className="summary-card__divider"></div>

            <div className="summary-card__column">
              <div className="summary-card__icon accent-orange">
                <XCircle size={22} />
              </div>
              <div>
                <p className="summary-card__label">Ditolak</p>
                <p className="summary-card__value">{(orderStats.rejectedCount || 0).toLocaleString("id-ID")}</p>
              </div>
            </div>
          </article>
        </section>

        {/* --- RECENT ORDERS (NEW) --- */}
        <section className="dashboard-panels">
          <article className="panel">
            <div className="panel__header">
              <div>
                <h3 className="panel__title">Recent Orders</h3>
              </div>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: '0.75rem' }}>Customer</th>
                    <th style={{ textAlign: "left", padding: '0.75rem' }}>Produk</th>
                    <th style={{ textAlign: "left", padding: '0.75rem' }}>Total</th>
                    <th style={{ textAlign: "left", padding: '0.75rem' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length > 0 ? (
                    recentOrders.map((order, idx) => {
                      // Logic matched from sales/page.js
                      const produkNama = order.produk_rel?.nama ||
                        (Array.isArray(order.items) && order.items[0]
                          ? order.items[0].nama_produk || order.items[0].nama
                          : (order.produk_nama || "-"));

                      const customerNama = order.customer_rel?.nama ||
                        order.nama_customer ||
                        order.customer?.nama ||
                        order.nama ||
                        "-";

                      const dateVal = order.created_at || order.create_at || order.tanggal || order.tanggal_dibuat;

                      return (
                        <tr key={idx}>
                          <td style={{ fontWeight: 500, padding: '0.75rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ color: 'var(--dash-text-dark)', fontWeight: 600, fontSize: '0.9rem' }}>{customerNama}</span>
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#4b5563' }}>
                            {produkNama}
                          </td>
                          <td style={{ fontFamily: 'monospace', fontWeight: 600, textAlign: "left", padding: '0.75rem', fontSize: '0.9rem' }}>
                            {formatCurrency(order.total_harga)}
                          </td>
                          <td style={{ fontSize: '0.85rem', color: '#6b7280', padding: '0.75rem' }}>
                            {dateVal ? new Date(dateVal).toLocaleDateString("id-ID", {
                              day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                            }) : "-"}
                          </td>
                        </tr>
                      );
                    })
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


      </div >
    </Layout >
  );
}

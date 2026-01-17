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
        // Fetch last 100 orders for this specific sales staff
        const ordersRes = await getOrders(1, 100, currentUserId);

        if (ordersRes && Array.isArray(ordersRes.data)) {
          const orders = ordersRes.data;

          // Total Orders (from pagination metadata if available, else length)
          const totalOrders = ordersRes.total || orders.length;

          // Calculate stats from the fetched batch
          let revenue = 0;
          let proses = 0;
          let success = 0;
          let upselling = 0;
          let batal = 0;

          orders.forEach(o => {
            // Sum revenue (only if status is Sukses/Proses/Upselling? Usually Revenue is counted on Success. But let's sum all 'potential' or just 'success'?)
            // Safest: Sum 'Success' orders for Revenue.
            // Or sum everything except Cancelled.
            // Let's sum Success (2) and Upselling (4) [Assuming upselling is a valid state of purchase].
            if (o.status === "2" || o.status === 2 || o.status === "4" || o.status === 4) {
              revenue += Number(o.total_harga || 0);
            }

            const s = String(o.status);
            if (s === "1") proses++;
            else if (s === "2") success++;
            else if (s === "4") upselling++;
            else if (s === "N" || s === "3") batal++;
          });

          setOrderStats({
            totalOrders, // Trusting the API total
            totalRevenue: revenue,
            prosesCount: proses,
            successCount: success,
            upsellingCount: upselling,
            batalCount: batal,
          });

          // Recent 10 orders
          setRecentOrders(orders.slice(0, 10));
        }
      } catch (err) {
        console.error("Error fetching orders for dashboard:", err);
      }
      // ------------------------------

      // Fetch leads statistics
      const leadsParams = new URLSearchParams();
      if (currentUserId) {
        leadsParams.append("sales_id", currentUserId.toString());
      }

      const leadsRes = await fetch(`${BASE_URL}/sales/lead?${leadsParams.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (leadsRes.ok) {
        const leadsData = await leadsRes.json();
        if (leadsData.success && leadsData.data) {
          const leads = Array.isArray(leadsData.data) ? leadsData.data : [];
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const thisMonth = new Date();
          thisMonth.setDate(1);
          thisMonth.setHours(0, 0, 0, 0);

          // Calculate statistics
          const leadsAssignedToday = leads.filter(lead => {
            if (!lead.created_at) return false;
            const leadDate = new Date(lead.created_at);
            leadDate.setHours(0, 0, 0, 0);
            return leadDate.getTime() === today.getTime();
          }).length;

          const leadsAssignedThisMonth = leads.filter(lead => {
            if (!lead.created_at) return false;
            const leadDate = new Date(lead.created_at);
            return leadDate >= thisMonth;
          }).length;

          // Active deals (leads with status CONTACTED, QUALIFIED, or CONVERTED)
          const activeDeals = leads.filter(lead => {
            const status = lead.status?.toUpperCase();
            return status === "CONTACTED" || status === "QUALIFIED" || status === "CONVERTED";
          }).length;

          // Closed this month (CONVERTED leads this month)
          const closedThisMonth = leads.filter(lead => {
            if (lead.status?.toUpperCase() !== "CONVERTED") return false;
            if (!lead.updated_at) return false;
            const leadDate = new Date(lead.updated_at);
            return leadDate >= thisMonth;
          }).length;

          // Overdue follow-ups (leads with follow_up_date in the past and status not CONVERTED/LOST)
          const followUpOverdue = leads.filter(lead => {
            if (!lead.follow_up_date) return false;
            const followUpDate = new Date(lead.follow_up_date);
            const status = lead.status?.toUpperCase();
            return followUpDate < today && status !== "CONVERTED" && status !== "LOST";
          }).length;

          setStats(prev => ({
            ...prev,
            leadsAssignedToday,
            leadsAssignedThisMonth,
            activeDeals,
            closedThisMonth,
            followUpOverdue,
          }));
        }
      }

      // Fetch dashboard statistics if available
      const dashboardRes = await fetch(`${BASE_URL}/sales/dashboard`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (dashboardRes.ok) {
        const dashboardData = await dashboardRes.json();
        if (dashboardData.success && dashboardData.data) {
          const data = dashboardData.data;

          // Extract follow-up done today if available
          // This would need to come from follow-up logs API
          // For now, we'll set it to 0 and can be enhanced later

          // Extract target and progress if available
          if (data.monthly_target) {
            setStats(prev => ({
              ...prev,
              monthlyTarget: data.monthly_target,
              monthlyProgress: data.monthly_progress || 0,
            }));
          }

          if (data.closing_target) {
            setStats(prev => ({
              ...prev,
              closingTarget: data.closing_target,
              closingProgress: data.closing_progress || 0,
            }));
          }

          // Average response time
          if (data.avg_response_time) {
            setStats(prev => ({
              ...prev,
              avgResponseTime: data.avg_response_time,
            }));
          }
        }
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

  // New Order Cards
  const orderCards = [
    {
      label: "Total Order",
      value: orderStats.totalOrders.toLocaleString("id-ID"),
      icon: <ShoppingCart size={24} />,
      color: "accent-blue",
      desc: "All Time"
    },
    {
      label: "Revenue (Est.)",
      value: formatCurrency(orderStats.totalRevenue),
      icon: <Wallet size={24} />,
      color: "accent-emerald",
      desc: "From Recent 100 Orders"
    },
    {
      label: "Menunggu Proses",
      value: orderStats.prosesCount.toLocaleString("id-ID"),
      icon: <Clock size={24} />,
      color: "accent-orange",
      desc: "Status: Proses"
    },
    {
      label: "Conversion (Sukses)",
      value: orderStats.successCount.toLocaleString("id-ID"),
      icon: <TrendingUp size={24} />,
      color: "accent-cyan",
      desc: "Status: Sukses"
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
                          <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#4b5563' }} title={produkNama}>
                            {produkNama.length > 13 ? produkNama.substring(0, 13) + "..." : produkNama}
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


      </div>
    </Layout>
  );
}

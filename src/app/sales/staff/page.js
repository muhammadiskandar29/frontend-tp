"use client";

import "@/styles/sales/dashboard-premium.css";
import "@/styles/sales/orders-page.css";
import Layout from "@/components/Layout";
import GreetingBanner from "@/components/GreetingBanner";
import { useState, useEffect, useCallback } from "react";
import SummaryStats from "@/components/salesStaff/SummaryStats";
import ProductPerformance from "@/components/salesStaff/ProductPerformance";
import RecentOrders from "@/components/salesStaff/RecentOrders";
import FollowUpActivity from "@/components/salesStaff/FollowUpActivity";
import { getOrderStatisticPerSales } from "@/lib/sales/orders";
import axios from "axios";

const BASE_URL = "/api";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    prosesCount: 0,
    successCount: 0,
    upsellingCount: 0,
    batalCount: 0,
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [followUpHistory, setFollowUpHistory] = useState([]);
  const [mePerformance, setMePerformance] = useState(null);
  const [productStats, setProductStats] = useState([]);
  const [productSummary, setProductSummary] = useState(null);

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

      const statsPromise = getOrderStatisticPerSales();
      const dashPromise = axios.get(`${BASE_URL}/sales/dashboard`, {
        params: { sales_id: currentUserId },
        headers: { Authorization: `Bearer ${token}` }
      });
      const prodStatsPromise = axios.get(`${BASE_URL}/sales/dashboard/produk-statistics`, {
        params: { sales_id: currentUserId },
        headers: { Authorization: `Bearer ${token}` }
      });
      const salesOrdersPromise = axios.get(`${BASE_URL}/sales/order/sales`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const [statsData, dashRes, prodRes, salesOrdersRes] = await Promise.all([
        statsPromise.catch(() => []),
        dashPromise.catch(() => ({ data: { success: false } })),
        prodStatsPromise.catch(() => ({ data: { success: false } })),
        salesOrdersPromise.catch(() => ({ data: { success: false } }))
      ]);

      // Order Statistics
      if (statsData && Array.isArray(statsData) && statsData.length > 0) {
        const myStats = statsData.find(s => Number(s.sales_id) === Number(currentUserId)) || statsData[0];
        if (myStats) {
          setOrderStats({
            totalOrders: Number(myStats.total_order) || 0,
            unpaidCount: Number(myStats.total_order_unpaid) || 0,
            prosesCount: Number(myStats.total_order_menunggu) || 0,
            paidCount: Number(myStats.total_order_sudah_diapprove) || 0,
            totalRevenue: Number(myStats.revenue) || 0,
            totalRevenueFormatted: formatCurrency(myStats.revenue),
            conversionRateFormatted: myStats.total_order > 0
              ? `${((myStats.total_order_sudah_diapprove / myStats.total_order) * 100).toFixed(2)}%`
              : "0.00%",
          });
          setMePerformance({
            ...myStats,
            conversion_rate_formatted: myStats.total_order > 0
              ? `${((myStats.total_order_sudah_diapprove / myStats.total_order) * 100).toFixed(2)}%`
              : "0.00%"
          });
        }
      }

      // Activity Feed (Dashboard Data)
      if (dashRes.data.success) {
        setFollowUpHistory(dashRes.data.data.riwayat_follow_up || []);
      }

      // Product Statistics
      if (prodRes.data.success && prodRes.data.data) {
        setProductStats(prodRes.data.data.produk_statistics || []);
        setProductSummary(prodRes.data.data.summary || null);
      }

      // Recent Sales Orders
      if (salesOrdersRes.data.success) {
        const orders = salesOrdersRes.data.data?.data || salesOrdersRes.data.data || [];
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

  return (
    <Layout title="Dashboard" aboveContent={<GreetingBanner />}>
      <div className="dashboard-shell">

        {/* 1. Summary Cards (Total Revenue, Orders, etc) */}
        <SummaryStats
          orderStats={orderStats}
          mePerformance={mePerformance}
        />

        {/* 2. Product Performance Wide Table */}
        <ProductPerformance
          productStats={productStats}
          productSummary={productSummary}
          loading={loading}
        />

        {/* 3. Grid for Recent Orders and Activity Feed */}
        <div className="dashboard-grid-two-columns">
          <RecentOrders
            recentOrders={recentOrders}
            formatCurrency={formatCurrency}
          />

          <FollowUpActivity
            followUpHistory={followUpHistory}
          />
        </div>

      </div>

      <style jsx>{`
        .dashboard-grid-two-columns {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 2rem;
          margin-top: 1rem;
        }

        /* Product Performance Section */
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

        /* FollowUp Activity Section */
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

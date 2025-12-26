"use client";

import "@/styles/sales/dashboard-premium.css";
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
} from "lucide-react";

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

  // Activity summary cards
  const activityCards = [
    {
      label: "Leads Assigned (Hari Ini)",
      value: loading ? "..." : stats.leadsAssignedToday.toLocaleString("id-ID"),
      icon: <User size={20} />,
      color: "#3B82F6",
      bgColor: "#DBEAFE",
    },
    {
      label: "Leads Assigned (Bulan Ini)",
      value: loading ? "..." : stats.leadsAssignedThisMonth.toLocaleString("id-ID"),
          icon: <User size={20} />,
          color: "#3B82F6",
          bgColor: "#DBEAFE",
        },
        {
      label: "Follow Up Selesai Hari Ini",
      value: loading ? "..." : stats.followUpDoneToday.toLocaleString("id-ID"),
          icon: <CheckCircle size={20} />,
          color: "#10B981",
          bgColor: "#D1FAE5",
        },
        {
      label: "Follow Up Terlambat",
      value: loading ? "..." : stats.followUpOverdue.toLocaleString("id-ID"),
      icon: <AlertCircle size={20} />,
      color: "#EF4444",
      bgColor: "#FEE2E2",
        },
        {
          label: "Active Deals",
      value: loading ? "..." : stats.activeDeals.toLocaleString("id-ID"),
          icon: <Package size={20} />,
          color: "#14B8A6",
          bgColor: "#CCFBF1",
        },
        {
      label: "Closed Bulan Ini",
      value: loading ? "..." : stats.closedThisMonth.toLocaleString("id-ID"),
          icon: <ShoppingCart size={20} />,
          color: "#F97316",
          bgColor: "#FFEDD5",
    },
    {
      label: "Avg Response Time",
      value: loading ? "..." : stats.avgResponseTime,
      icon: <Clock size={20} />,
      color: "#06B6D4",
      bgColor: "#CFFAFE",
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
        <style jsx>{`
          .staff-dashboard {
            padding: 0;
            max-width: 1400px;
            margin: 0 auto;
          }

          .time-context {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 2rem;
            padding: 0.75rem 1rem;
            background: #f9fafb;
            border-radius: 8px;
            font-size: 0.875rem;
            color: #6b7280;
          }

          .time-context-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .time-context-item svg {
            width: 16px;
            height: 16px;
          }

          .activity-summary {
            margin-bottom: 2rem;
          }

          .activity-summary-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 1.5rem;
          }

          .activity-cards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
          }

          .activity-card {
            background: white;
            border-radius: 8px;
            padding: 1.25rem;
            border: 1px solid #e5e7eb;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }

          .activity-card-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }

          .activity-card-icon {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .activity-card-content {
            flex: 1;
            min-width: 0;
          }

          .activity-card-label {
            font-size: 0.75rem;
            color: #6b7280;
            font-weight: 500;
            margin-bottom: 0.25rem;
            line-height: 1.3;
          }

          .activity-card-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1f2937;
            line-height: 1.2;
          }

          .progress-section {
            background: white;
            border-radius: 8px;
            padding: 1.5rem;
            border: 1px solid #e5e7eb;
            margin-bottom: 2rem;
          }

          .progress-section-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 1.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .progress-section-title svg {
            width: 20px;
            height: 20px;
            color: #6b7280;
          }

          .progress-item {
            margin-bottom: 1.5rem;
          }

          .progress-item:last-child {
            margin-bottom: 0;
          }

          .progress-item-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
          }

          .progress-item-label {
            font-size: 0.875rem;
            color: #6b7280;
            font-weight: 500;
          }

          .progress-item-value {
            font-size: 0.875rem;
            color: #1f2937;
            font-weight: 600;
          }

          .progress-bar-container {
            width: 100%;
            height: 8px;
            background: #f3f4f6;
            border-radius: 4px;
            overflow: hidden;
          }

          .progress-bar-fill {
            height: 100%;
            background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
            border-radius: 4px;
            transition: width 0.3s ease;
          }

          .progress-bar-fill.warning {
            background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
          }

          .progress-bar-fill.success {
            background: linear-gradient(90deg, #10b981 0%, #059669 100%);
          }

          @media (max-width: 1024px) {
            .activity-cards-grid {
              grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            }
          }

          @media (max-width: 768px) {
            .activity-cards-grid {
              grid-template-columns: repeat(2, 1fr);
            }

            .time-context {
              flex-direction: column;
              align-items: flex-start;
              gap: 0.5rem;
            }
            }

          @media (max-width: 480px) {
            .activity-cards-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>

        <div className="staff-dashboard">
          {/* Time Context */}
          <div className="time-context">
            <div className="time-context-item">
              <Calendar size={16} />
              <span>{formatDate(currentTime)}</span>
            </div>
            <div className="time-context-item">
              <Clock size={16} />
              <span>{formatTime(currentTime)}</span>
                    </div>
                  </div>
                  
          {/* Activity Summary */}
          <div className="activity-summary">
            <h2 className="activity-summary-title">Ringkasan Aktivitas</h2>
            <div className="activity-cards-grid">
              {activityCards.map((card, index) => (
                <div key={index} className="activity-card">
                  <div className="activity-card-header">
                    <div
                      className="activity-card-icon"
                        style={{
                        backgroundColor: card.bgColor,
                        color: card.color,
                      }}
                    >
                      {card.icon}
                      </div>
                    <div className="activity-card-content">
                      <div className="activity-card-label">{card.label}</div>
                      <div className="activity-card-value">{card.value}</div>
                    </div>
                  </div>
                </div>
                ))}
              </div>
          </div>

          {/* Progress Section */}
          {(stats.monthlyTarget > 0 || stats.closingTarget > 0) && (
            <div className="progress-section">
              <h2 className="progress-section-title">
                <Target size={20} />
                Progress Target
              </h2>
              
              {stats.monthlyTarget > 0 && (
                <div className="progress-item">
                  <div className="progress-item-header">
                    <span className="progress-item-label">Target Bulanan</span>
                    <span className="progress-item-value">
                      {stats.monthlyProgress.toLocaleString("id-ID")} / {stats.monthlyTarget.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="progress-bar-container">
                    <div
                      className={`progress-bar-fill ${
                        monthlyProgressPercent >= 100
                          ? "success"
                          : monthlyProgressPercent >= 75
                          ? "warning"
                          : ""
                      }`}
                      style={{ width: `${monthlyProgressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {stats.closingTarget > 0 && (
                <div className="progress-item">
                  <div className="progress-item-header">
                    <span className="progress-item-label">Target Closing</span>
                    <span className="progress-item-value">
                      {stats.closingProgress.toLocaleString("id-ID")} / {stats.closingTarget.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="progress-bar-container">
                    <div
                      className={`progress-bar-fill ${
                        closingProgressPercent >= 100
                          ? "success"
                          : closingProgressPercent >= 75
                          ? "warning"
                          : ""
                      }`}
                      style={{ width: `${closingProgressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

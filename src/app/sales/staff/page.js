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
        {/* Time Context */}
        <section className="dashboard-hero" style={{ marginBottom: "2rem" }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "1rem",
            padding: "0.75rem 1rem",
            background: "var(--dash-surface)",
            border: "1px solid var(--dash-border)",
            borderRadius: "var(--radius-lg)",
            fontSize: "0.875rem",
            color: "var(--dash-muted)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Calendar size={16} />
              <span>{formatDate(currentTime)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Clock size={16} />
              <span>{formatTime(currentTime)}</span>
            </div>
          </div>
        </section>

        {/* Leads Activity Panel */}
        <section className="dashboard-panels">
          <article className="panel panel--summary">
            <div className="panel__header">
              <div>
                <p className="panel__eyebrow">Leads Management</p>
                <h3 className="panel__title">Leads Activity</h3>
              </div>
            </div>
            <div className="dashboard-summary-horizontal">
              {leadsCards.map((card) => (
                <article className="summary-card" key={card.label}>
                  <div className={`summary-card__icon ${card.color}`}>{card.icon}</div>
                  <div>
                    <p className="summary-card__label">{card.label}</p>
                    <p className="summary-card__value">{card.value}</p>
                  </div>
                </article>
              ))}
            </div>
          </article>
        </section>

        {/* Follow Up Activity Panel */}
        <section className="dashboard-panels">
          <article className="panel panel--summary">
            <div className="panel__header">
              <div>
                <p className="panel__eyebrow">Follow Up Tracking</p>
                <h3 className="panel__title">Follow Up Activity</h3>
              </div>
            </div>
            <div className="dashboard-summary-horizontal">
              {followUpCards.map((card) => (
                <article className="summary-card" key={card.label}>
                  <div className={`summary-card__icon ${card.color}`}>{card.icon}</div>
                  <div>
                    <p className="summary-card__label">{card.label}</p>
                    <p className="summary-card__value">{card.value}</p>
                  </div>
                </article>
              ))}
            </div>
          </article>
        </section>

        {/* Deals & Performance Panel */}
        <section className="dashboard-panels">
          <article className="panel panel--summary">
            <div className="panel__header">
              <div>
                <p className="panel__eyebrow">Deals & Performance</p>
                <h3 className="panel__title">Deals Overview</h3>
              </div>
            </div>
            <div className="dashboard-summary-horizontal">
              {dealsCards.map((card) => (
                <article className="summary-card" key={card.label}>
                  <div className={`summary-card__icon ${card.color}`}>{card.icon}</div>
                  <div>
                    <p className="summary-card__label">{card.label}</p>
                    <p className="summary-card__value">{card.value}</p>
                  </div>
                </article>
              ))}
            </div>
          </article>
        </section>

        {/* Progress Target Panel */}
        {(stats.monthlyTarget > 0 || stats.closingTarget > 0) && (
          <section className="dashboard-panels">
            <article className="panel panel--summary">
              <div className="panel__header">
                <div>
                  <p className="panel__eyebrow">Target Progress</p>
                  <h3 className="panel__title">Monthly Goals</h3>
                </div>
              </div>
              
              <div style={{ padding: "1.5rem" }}>
                {stats.monthlyTarget > 0 && (
                  <div style={{ marginBottom: "1.5rem" }}>
                    <div style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center",
                      marginBottom: "0.5rem"
                    }}>
                      <span style={{ 
                        fontSize: "0.875rem", 
                        color: "var(--dash-muted)",
                        fontWeight: 500
                      }}>
                        Target Bulanan
                      </span>
                      <span style={{ 
                        fontSize: "0.875rem", 
                        color: "var(--dash-text-dark)",
                        fontWeight: 600
                      }}>
                        {stats.monthlyProgress.toLocaleString("id-ID")} / {stats.monthlyTarget.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div style={{
                      width: "100%",
                      height: "8px",
                      background: "var(--dash-border)",
                      borderRadius: "4px",
                      overflow: "hidden"
                    }}>
                      <div style={{
                        height: "100%",
                        width: `${monthlyProgressPercent}%`,
                        background: monthlyProgressPercent >= 100
                          ? "linear-gradient(90deg, #10b981 0%, #059669 100%)"
                          : monthlyProgressPercent >= 75
                          ? "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)"
                          : "linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)",
                        borderRadius: "4px",
                        transition: "width 0.3s ease"
                      }} />
                    </div>
                  </div>
                )}

                {stats.closingTarget > 0 && (
                  <div>
                    <div style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center",
                      marginBottom: "0.5rem"
                    }}>
                      <span style={{ 
                        fontSize: "0.875rem", 
                        color: "var(--dash-muted)",
                        fontWeight: 500
                      }}>
                        Target Closing
                      </span>
                      <span style={{ 
                        fontSize: "0.875rem", 
                        color: "var(--dash-text-dark)",
                        fontWeight: 600
                      }}>
                        {stats.closingProgress.toLocaleString("id-ID")} / {stats.closingTarget.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div style={{
                      width: "100%",
                      height: "8px",
                      background: "var(--dash-border)",
                      borderRadius: "4px",
                      overflow: "hidden"
                    }}>
                      <div style={{
                        height: "100%",
                        width: `${closingProgressPercent}%`,
                        background: closingProgressPercent >= 100
                          ? "linear-gradient(90deg, #10b981 0%, #059669 100%)"
                          : closingProgressPercent >= 75
                          ? "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)"
                          : "linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)",
                        borderRadius: "4px",
                        transition: "width 0.3s ease"
                      }} />
                    </div>
                  </div>
                )}
              </div>
            </article>
          </section>
        )}
      </div>
    </Layout>
  );
}

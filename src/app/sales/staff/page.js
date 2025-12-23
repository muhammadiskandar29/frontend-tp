"use client";

import "@/styles/sales/dashboard-premium.css";
import Layout from "@/components/Layout";
import GreetingBanner from "@/components/GreetingBanner";
import { useEffect, useState } from "react";
import {
  TrendingUp,
  ShoppingCart,
  Percent,
  DollarSign,
  Clock,
  Package,
  Target,
  Star,
  User,
  CheckCircle,
} from "lucide-react";

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Ambil data user dari localStorage
    const userDataStr = localStorage.getItem("user");
    if (userDataStr) {
      try {
        const user = JSON.parse(userDataStr);
        setUserData({
          name: user.name || "Eka",
          role: "Sales Representative",
        });
      } catch (e) {
        console.error("Error parsing user data:", e);
        setUserData({
          name: "Eka",
          role: "Sales Representative",
        });
      }
    } else {
      setUserData({
        name: "Eka",
        role: "Sales Representative",
      });
    }
  }, []);

  // Dummy data statistik performa
  const performanceStats = {
    totalLeads: 0,
    totalClosing: 0,
    conversionRate: 0.0,
    totalRevenue: 0,
    averageDealSize: 0,
    responseTime: "N/A",
    activeDeals: 0,
    closedThisMonth: 0,
    targetAchievement: 0,
    customerSatisfaction: 0,
  };

  const statsCards = [
    {
      label: "Total Leads",
      value: performanceStats.totalLeads.toLocaleString("id-ID"),
      icon: <User size={20} />,
      color: "#3B82F6",
      bgColor: "#DBEAFE",
    },
    {
      label: "Total Closing",
      value: performanceStats.totalClosing.toLocaleString("id-ID"),
      icon: <CheckCircle size={20} />,
      color: "#10B981",
      bgColor: "#D1FAE5",
    },
    {
      label: "Conversion Rate",
      value: `${performanceStats.conversionRate.toFixed(2)}%`,
      icon: <Percent size={20} />,
      color: "#F59E0B",
      bgColor: "#FEF3C7",
    },
    {
      label: "Total Revenue",
      value: `Rp ${performanceStats.totalRevenue.toLocaleString("id-ID")}`,
      icon: <DollarSign size={20} />,
      color: "#8B5CF6",
      bgColor: "#EDE9FE",
    },
    {
      label: "Average Deal Size",
      value: `Rp ${performanceStats.averageDealSize.toLocaleString("id-ID")}`,
      icon: <TrendingUp size={20} />,
      color: "#EC4899",
      bgColor: "#FCE7F3",
    },
    {
      label: "Response Time",
      value: performanceStats.responseTime,
      icon: <Clock size={20} />,
      color: "#06B6D4",
      bgColor: "#CFFAFE",
    },
    {
      label: "Active Deals",
      value: performanceStats.activeDeals.toLocaleString("id-ID"),
      icon: <Package size={20} />,
      color: "#14B8A6",
      bgColor: "#CCFBF1",
    },
    {
      label: "Closed This Month",
      value: performanceStats.closedThisMonth.toLocaleString("id-ID"),
      icon: <ShoppingCart size={20} />,
      color: "#F97316",
      bgColor: "#FFEDD5",
    },
    {
      label: "Target Achievement",
      value: `${performanceStats.targetAchievement}%`,
      icon: <Target size={20} />,
      color: "#EF4444",
      bgColor: "#FEE2E2",
    },
    {
      label: "Customer Satisfaction",
      value: `${performanceStats.customerSatisfaction}/5.0`,
      icon: <Star size={20} />,
      color: "#FBBF24",
      bgColor: "#FEF3C7",
    },
  ];

  if (!userData) {
    return (
      <Layout title="Dashboard" aboveContent={<GreetingBanner />}>
        <div className="dashboard-shell">
          <div style={{ padding: "2rem", textAlign: "center" }}>
            <p>Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard" aboveContent={<GreetingBanner />}>
      <div className="dashboard-shell">
        <style jsx>{`
          .staff-dashboard {
            padding: 0;
          }

          .staff-header {
            background: linear-gradient(135deg, #fb8500 0%, #ff9500 100%);
            border-radius: 16px;
            padding: 2rem;
            margin-bottom: 2rem;
            color: white;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          }

          .staff-header-content {
            display: flex;
            align-items: center;
            gap: 1.5rem;
          }

          .staff-avatar {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid rgba(255, 255, 255, 0.3);
            flex-shrink: 0;
          }

          .staff-avatar svg {
            color: white;
          }

          .staff-info h2 {
            font-size: 1.75rem;
            font-weight: 700;
            margin: 0 0 0.5rem 0;
            color: white;
          }

          .staff-info p {
            font-size: 1rem;
            margin: 0;
            color: rgba(255, 255, 255, 0.9);
            font-weight: 500;
          }

          .stats-section {
            margin-top: 2rem;
          }

          .stats-section-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 1.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1.5rem;
          }

          .stat-card {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
            transition: all 0.2s ease;
            border: 1px solid #e5e7eb;
          }

          .stat-card:hover {
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            transform: translateY(-2px);
          }

          .stat-card-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;
          }

          .stat-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .stat-card-content {
            flex: 1;
          }

          .stat-label {
            font-size: 0.875rem;
            color: #6b7280;
            font-weight: 500;
            margin-bottom: 0.5rem;
          }

          .stat-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1f2937;
            line-height: 1.2;
          }

          @media (max-width: 768px) {
            .stats-grid {
              grid-template-columns: 1fr;
            }

            .staff-header-content {
              flex-direction: column;
              text-align: center;
            }

            .staff-avatar {
              width: 64px;
              height: 64px;
            }

            .staff-info h2 {
              font-size: 1.5rem;
            }
          }
        `}</style>

        <div className="staff-dashboard">
          {/* Header dengan nama dan role */}
          <div className="staff-header">
            <div className="staff-header-content">
              <div className="staff-avatar">
                <User size={40} />
              </div>
              <div className="staff-info">
                <h2>{userData.name}</h2>
                <p>{userData.role}</p>
              </div>
            </div>
          </div>

          {/* Section Statistik Performa */}
          <div className="stats-section">
            <h3 className="stats-section-title">
              <TrendingUp size={24} />
              Statistik Performa Follow Up & Kinerja
            </h3>

            <div className="stats-grid">
              {statsCards.map((stat, index) => (
                <div key={index} className="stat-card">
                  <div className="stat-card-header">
                    <div
                      className="stat-icon"
                      style={{
                        backgroundColor: stat.bgColor,
                        color: stat.color,
                      }}
                    >
                      {stat.icon}
                    </div>
                    <div className="stat-card-content">
                      <div className="stat-label">{stat.label}</div>
                      <div className="stat-value">{stat.value}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

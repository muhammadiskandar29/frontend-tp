"use client";

import "@/styles/sales/dashboard-premium.css";
import Layout from "@/components/Layout";
import GreetingBanner from "@/components/GreetingBanner";
import { useState } from "react";
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
  BarChart3,
  Wallet,
  Activity,
  Award,
} from "lucide-react";

export default function Dashboard() {
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

  // Kelompokkan statistik berdasarkan fungsi/indikator
  const statGroups = [
    {
      title: "Lead Performance",
      icon: <BarChart3 size={20} />,
      description: "Kinerja dalam mengelola dan mengkonversi leads",
      cards: [
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
      ],
    },
    {
      title: "Revenue Performance",
      icon: <Wallet size={20} />,
      description: "Pencapaian revenue dan nilai transaksi",
      cards: [
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
      ],
    },
    {
      title: "Activity & Engagement",
      icon: <Activity size={20} />,
      description: "Tingkat aktivitas dan responsivitas",
      cards: [
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
      ],
    },
    {
      title: "Goals & Satisfaction",
      icon: <Award size={20} />,
      description: "Pencapaian target dan kepuasan customer",
      cards: [
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
      ],
    },
  ];

  return (
    <Layout title="Dashboard" aboveContent={<GreetingBanner />}>
      <div className="dashboard-shell">
        <style jsx>{`
          .staff-dashboard {
            padding: 0;
          }

          .stats-section {
            margin-top: 0;
          }

          .stats-section-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 2rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }

          .stat-groups-container {
            display: flex;
            flex-direction: column;
            gap: 2.5rem;
          }

          .stat-group {
            background: white;
            border-radius: 16px;
            padding: 2rem;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
            border: 1px solid #e5e7eb;
            transition: all 0.2s ease;
          }

          .stat-group:hover {
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          }

          .stat-group-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 0.5rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid #f3f4f6;
          }

          .stat-group-icon {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            background: linear-gradient(135deg, #fb8500 0%, #ff9500 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            flex-shrink: 0;
          }

          .stat-group-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: #1f2937;
            margin: 0;
          }

          .stat-group-description {
            font-size: 0.875rem;
            color: #6b7280;
            margin: 0;
            margin-top: 0.25rem;
          }

          .stat-group-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.25rem;
            margin-top: 1.5rem;
          }

          .stat-card {
            background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
            border-radius: 12px;
            padding: 1.5rem;
            border: 1px solid #e5e7eb;
            transition: all 0.2s ease;
            position: relative;
            overflow: hidden;
          }

          .stat-card::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
            background: var(--card-accent-color);
            transition: width 0.2s ease;
          }

          .stat-card:hover {
            box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.1);
            transform: translateY(-2px);
            border-color: var(--card-accent-color);
          }

          .stat-card:hover::before {
            width: 100%;
            opacity: 0.05;
          }

          .stat-card-header {
            display: flex;
            align-items: flex-start;
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
            transition: all 0.2s ease;
          }

          .stat-card:hover .stat-icon {
            transform: scale(1.1);
          }

          .stat-card-content {
            flex: 1;
            min-width: 0;
          }

          .stat-label {
            font-size: 0.875rem;
            color: #6b7280;
            font-weight: 500;
            margin-bottom: 0.5rem;
            line-height: 1.4;
          }

          .stat-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1f2937;
            line-height: 1.2;
            word-break: break-word;
          }

          @media (max-width: 1024px) {
            .stat-group-cards {
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            }
          }

          @media (max-width: 768px) {
            .stat-group {
              padding: 1.5rem;
            }

            .stat-group-cards {
              grid-template-columns: 1fr;
              gap: 1rem;
            }

            .stat-group-header {
              flex-direction: column;
              align-items: flex-start;
              gap: 0.5rem;
            }

            .stats-section-title {
              font-size: 1.25rem;
            }
          }
        `}</style>

        <div className="staff-dashboard">
          {/* Section Statistik Performa */}
          <div className="stats-section">
            <h3 className="stats-section-title">
              <TrendingUp size={28} />
              Statistik Performa Follow Up & Kinerja
            </h3>

            <div className="stat-groups-container">
              {statGroups.map((group, groupIndex) => (
                <div key={groupIndex} className="stat-group">
                  <div className="stat-group-header">
                    <div className="stat-group-icon">{group.icon}</div>
                    <div>
                      <h4 className="stat-group-title">{group.title}</h4>
                      <p className="stat-group-description">{group.description}</p>
                    </div>
                  </div>
                  
                  <div className="stat-group-cards">
                    {group.cards.map((stat, cardIndex) => (
                      <div
                        key={cardIndex}
                        className="stat-card"
                        style={{
                          "--card-accent-color": stat.color,
                        }}
                      >
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
                ))}
              </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

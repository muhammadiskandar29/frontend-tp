"use client";

import "@/styles/sales/dashboard-premium.css";
import Layout from "@/components/Layout";
import GreetingBanner from "@/components/GreetingBanner";
import { useEffect, useMemo, useState, useRef } from "react";
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

export default function Dashboard() {
  const [loading, setLoading] = useState(false);

  // Dummy data untuk staff sales individual
  const staffSalesData = [
    {
      name: "Salsa",
      totalLeads: 45,
      totalClosing: 28,
      conversionRate: 62.22,
      totalRevenue: 125000000,
      averageDealSize: 4464286,
      responseTime: "2.5 jam",
      activeDeals: 12,
      closedThisMonth: 8,
      targetAchievement: 87.5,
      customerSatisfaction: 4.6,
    },
    {
      name: "Budi",
      totalLeads: 52,
      totalClosing: 35,
      conversionRate: 67.31,
      totalRevenue: 158000000,
      averageDealSize: 4514286,
      responseTime: "1.8 jam",
      activeDeals: 15,
      closedThisMonth: 10,
      targetAchievement: 95.2,
      customerSatisfaction: 4.8,
    },
    {
      name: "Rina",
      totalLeads: 38,
      totalClosing: 24,
      conversionRate: 63.16,
      totalRevenue: 98000000,
      averageDealSize: 4083333,
      responseTime: "3.2 jam",
      activeDeals: 9,
      closedThisMonth: 6,
      targetAchievement: 75.0,
      customerSatisfaction: 4.4,
    },
  ];

  // Dummy data untuk current user (ambil dari localStorage atau default)
  const [currentUserData, setCurrentUserData] = useState(null);

  useEffect(() => {
    // Ambil data user dari localStorage
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        // Cari data staff berdasarkan nama atau ID
        const staffData = staffSalesData.find((s) => 
          s.name.toLowerCase() === user.name?.toLowerCase() || 
          s.name === user.name
        );
        if (staffData) {
          setCurrentUserData(staffData);
        } else {
          // Default data jika tidak ditemukan
          setCurrentUserData({
            name: user.name || "Staff Sales",
            totalLeads: 0,
            totalClosing: 0,
            conversionRate: 0,
            totalRevenue: 0,
            averageDealSize: 0,
            responseTime: "N/A",
            activeDeals: 0,
            closedThisMonth: 0,
            targetAchievement: 0,
            customerSatisfaction: 0,
          });
        }
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    } else {
      // Default data jika tidak ada user
      setCurrentUserData({
        name: "Staff Sales",
        totalLeads: 0,
        totalClosing: 0,
        conversionRate: 0,
        totalRevenue: 0,
        averageDealSize: 0,
        responseTime: "N/A",
        activeDeals: 0,
        closedThisMonth: 0,
        targetAchievement: 0,
        customerSatisfaction: 0,
      });
    }
  }, []);

  const summaryCards = useMemo(() => {
    if (!currentUserData) return [];
    
    return [
      {
        title: "Total Leads",
        value: currentUserData.totalLeads.toLocaleString("id-ID"),
        icon: <User size={24} />,
        color: "accent-orange",
      },
      {
        title: "Total Closing",
        value: currentUserData.totalClosing.toLocaleString("id-ID"),
        icon: <ShoppingCart size={24} />,
        color: "accent-orange",
      },
      {
        title: "Conversion Rate",
        value: `${currentUserData.conversionRate.toFixed(2)}%`,
        icon: <Percent size={24} />,
        color: "accent-orange",
      },
      {
        title: "Total Revenue",
        value: `Rp ${currentUserData.totalRevenue.toLocaleString("id-ID")}`,
        icon: <DollarSign size={24} />,
        color: "accent-orange",
      },
    ];
  }, [currentUserData]);

  const detailCards = useMemo(() => {
    if (!currentUserData) return [];
    
    return [
      {
        title: "Average Deal Size",
        value: `Rp ${currentUserData.averageDealSize.toLocaleString("id-ID")}`,
        icon: <TrendingUp size={24} />,
        color: "accent-orange",
      },
      {
        title: "Response Time",
        value: currentUserData.responseTime,
        icon: <CreditCard size={24} />,
        color: "accent-orange",
      },
      {
        title: "Active Deals",
        value: currentUserData.activeDeals.toLocaleString("id-ID"),
        icon: <Package size={24} />,
        color: "accent-orange",
      },
      {
        title: "Closed This Month",
        value: currentUserData.closedThisMonth.toLocaleString("id-ID"),
        icon: <Wallet size={24} />,
        color: "accent-orange",
      },
      {
        title: "Target Achievement",
        value: `${currentUserData.targetAchievement}%`,
        icon: <PiggyBank size={24} />,
        color: "accent-orange",
      },
      {
        title: "Customer Satisfaction",
        value: `${currentUserData.customerSatisfaction}/5.0`,
        icon: <Truck size={24} />,
        color: "accent-orange",
      },
    ];
  }, [currentUserData]);

  const staffCardsRef = useRef([]);

  // Scroll effect untuk staff cards
  useEffect(() => {
    staffCardsRef.current.forEach((card) => {
      if (card) {
        card.classList.add("visible");
      }
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

    setTimeout(() => {
      staffCardsRef.current.forEach((card) => {
        if (card) {
          const rect = card.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            card.classList.add("visible");
          }
          observer.observe(card);
        }
      });
    }, 50);

    return () => {
      staffCardsRef.current.forEach((card) => {
        if (card) observer.unobserve(card);
      });
    };
  }, []);

  if (!currentUserData) {
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
                  <p className="panel__eyebrow">Data per staff sales</p>
                  <h3 className="panel__title">My Sales Performance</h3>
                </div>
              </div>

              <div className="staff-cards-container">
                <article
                  ref={(el) => (staffCardsRef.current[0] = el)}
                  className="staff-card"
                  key={currentUserData.name}
                  data-index={0}
                >
                  <div className="staff-card__header">
                    <div className="staff-card__avatar">
                      <User size={24} />
                    </div>
                    <div className="staff-card__header-info">
                      <h4 className="staff-card__name">{currentUserData.name}</h4>
                      <p className="staff-card__role">Sales Representative</p>
                    </div>
                  </div>
                  
                  <div className="staff-card__stats">
                    <div className="staff-card__stat-row">
                      <div className="staff-card__stat">
                        <p className="staff-card__stat-label">Total Leads</p>
                        <p className="staff-card__stat-value">{currentUserData.totalLeads}</p>
                      </div>
                      <div className="staff-card__stat">
                        <p className="staff-card__stat-label">Total Closing</p>
                        <p className="staff-card__stat-value">{currentUserData.totalClosing}</p>
                      </div>
                    </div>
                    
                    <div className="staff-card__stat-row">
                      <div className="staff-card__stat">
                        <p className="staff-card__stat-label">Conversion Rate</p>
                        <p className="staff-card__stat-value">{currentUserData.conversionRate.toFixed(2)}%</p>
                      </div>
                      <div className="staff-card__stat">
                        <p className="staff-card__stat-label">Total Revenue</p>
                        <p className="staff-card__stat-value">Rp {currentUserData.totalRevenue.toLocaleString("id-ID")}</p>
                      </div>
                    </div>
                    
                    <div className="staff-card__stat-row">
                      <div className="staff-card__stat">
                        <p className="staff-card__stat-label">Average Deal Size</p>
                        <p className="staff-card__stat-value">Rp {currentUserData.averageDealSize.toLocaleString("id-ID")}</p>
                      </div>
                      <div className="staff-card__stat">
                        <p className="staff-card__stat-label">Response Time</p>
                        <p className="staff-card__stat-value">{currentUserData.responseTime}</p>
                      </div>
                    </div>
                    
                    <div className="staff-card__stat-row">
                      <div className="staff-card__stat">
                        <p className="staff-card__stat-label">Active Deals</p>
                        <p className="staff-card__stat-value">{currentUserData.activeDeals}</p>
                      </div>
                      <div className="staff-card__stat">
                        <p className="staff-card__stat-label">Closed This Month</p>
                        <p className="staff-card__stat-value">{currentUserData.closedThisMonth}</p>
                      </div>
                    </div>
                    
                    <div className="staff-card__stat-row">
                      <div className="staff-card__stat">
                        <p className="staff-card__stat-label">Target Achievement</p>
                        <p className="staff-card__stat-value">{currentUserData.targetAchievement}%</p>
                      </div>
                      <div className="staff-card__stat">
                        <p className="staff-card__stat-label">Customer Satisfaction</p>
                        <p className="staff-card__stat-value">{currentUserData.customerSatisfaction}/5.0</p>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </article>

            <article className="panel panel--revenue">
              <div className="panel__header">
                <div>
                  <p className="panel__eyebrow">Detail metrics</p>
                  <h3 className="panel__title">Performance Details</h3>
                </div>
              </div>

              <div className="revenue-grid">
                {detailCards.map((card) => (
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
      </div>
    </Layout>
  );
}

"use client";

import "@/styles/dashboard.css";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip, CartesianGrid } from "recharts";

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboard() {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/admin/sales/dashboard", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          throw new Error("Gagal memuat data dashboard");
        }

        const json = await response.json();
        if (isMounted) {
          setDashboardData(json.data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Terjadi kesalahan saat memuat data");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const overview = dashboardData?.overview;
  const financial = dashboardData?.financial;
  const statistik = dashboardData?.statistik;

  const summaryCards = [
    {
      title: "Total Orders",
      value: overview?.orders_total?.toLocaleString("id-ID") ?? (loading ? "…" : "0"),
      icon: <ShoppingCart size={22} />,
      color: "accent-blue",
    },
    {
      title: "Total Paid",
      value: overview?.orders_paid?.toLocaleString("id-ID") ?? (loading ? "…" : "0"),
      icon: <CreditCard size={22} />,
      color: "accent-emerald",
    },
    {
      title: "Paid Ratio",
      value: overview?.paid_ratio_formatted ?? (loading ? "…" : "0%"),
      icon: <Percent size={22} />,
      color: "accent-amber",
    },
    {
      title: "Unpaid Orders",
      value: overview?.orders_unpaid?.toLocaleString("id-ID") ?? (loading ? "…" : "0"),
      icon: <Package size={22} />,
      color: "accent-red",
    },
  ];

  const revenueCards = [
    {
      title: "Gross Revenue",
      value: financial?.gross_revenue_formatted ?? (loading ? "…" : "Rp0"),
      icon: <DollarSign size={22} />,
      color: "accent-emerald",
    },
    {
      title: "Shipping Cost",
      value: financial?.shipping_cost_formatted ?? (loading ? "…" : "Rp0"),
      icon: <Truck size={22} />,
      color: "accent-purple",
    },
    {
      title: "Net Revenue",
      value: financial?.net_revenue_formatted ?? (loading ? "…" : "Rp0"),
      icon: <Wallet size={22} />,
      color: "accent-indigo",
    },
    {
      title: "Gross Profit",
      value: financial?.gross_profit_formatted ?? (loading ? "…" : "Rp0"),
      icon: <PiggyBank size={22} />,
      color: "accent-pink",
    },
    {
      title: "Net Profit",
      value: financial?.net_profit_formatted ?? (loading ? "…" : "Rp0"),
      icon: <TrendingUp size={22} />,
      color: "accent-teal",
    },
  ];

  const activityTrend = useMemo(() => {
    return (
      dashboardData?.chart_transaksi_order?.map((point) => ({
        label: point.label,
        orders: point.order,
        transactions: point.transaksi,
      })) ?? []
    );
  }, [dashboardData]);

  const chartHasData = activityTrend.length > 0;

  return (
    <Layout title="Dashboard | Admin Panel">
      <div className="dashboard-shell">
        {error && <div className="dashboard-alert">{error}</div>}
        <section className="dashboard-hero">
          <motion.div
            className="dashboard-hero__copy"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="dashboard-hero__eyebrow">Performance</p>
            <h2 className="dashboard-hero__title">Sales Dashboard Overview</h2>
            <span className="dashboard-hero__meta">
              <span role="img" aria-label="calendar">
                📅
              </span>{" "}
              {statistik?.total_penjualan_hari_ini_formatted
                ? `Hari ini: ${statistik.total_penjualan_hari_ini_formatted}`
                : "Last 30 Days"}
            </span>
          </motion.div>

          <motion.div
            className="dashboard-summary"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {summaryCards.map((card, index) => (
              <article className="summary-card" key={card.title}>
                <div className={`summary-card__icon ${card.color}`}>{card.icon}</div>
                <div>
                  <p className="summary-card__label">{card.title}</p>
                  <p className="summary-card__value">{card.value}</p>
                </div>
              </article>
            ))}
          </motion.div>
        </section>

        <section className="dashboard-panels">
          <motion.article
            className="panel panel--chart"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="panel__header">
              <div>
                <p className="panel__eyebrow">Orders vs Transactions</p>
                <h3 className="panel__title">Sales Activity</h3>
              </div>
              <span className="panel__meta">Last 30 days</span>
            </div>

            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartHasData ? activityTrend : [{ label: "-", orders: 0, transactions: 0 }]}>
                <CartesianGrid stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="label" stroke="#94A3B8" fontSize={12} tickMargin={12} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0" }}
                  formatter={(value, name) => [value, name === "orders" ? "Order" : "Transaksi"]}
                />
                <Line type="monotone" dataKey="orders" stroke="#6366F1" strokeWidth={3} dot={false} name="orders" />
                <Line
                  type="monotone"
                  dataKey="transactions"
                  stroke="#F97316"
                  strokeWidth={3}
                  dot={false}
                  name="transactions"
                />
              </LineChart>
            </ResponsiveContainer>
            {!chartHasData && <p className="panel__empty">Belum ada data transaksi untuk periode ini.</p>}
          </motion.article>

          <motion.article
            className="panel panel--revenue"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="panel__header">
              <div>
                <p className="panel__eyebrow">Revenue breakdown</p>
                <h3 className="panel__title">Financial Snapshot</h3>
              </div>
              <span className="panel__meta accent-green">Stable</span>
            </div>

            <div className="revenue-grid">
              {revenueCards.map((card) => (
                <article className="revenue-card" key={card.title}>
                  <div className={`revenue-card__icon ${card.color}`}>{card.icon}</div>
                  <div>
                    <p className="revenue-card__label">{card.title}</p>
                    <p className="revenue-card__value">{card.value}</p>
                  </div>
                </article>
              ))}
            </div>
          </motion.article>
        </section>
      </div>
    </Layout>
  );
}

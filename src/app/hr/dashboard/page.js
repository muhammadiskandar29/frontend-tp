"use client";

import "@/styles/hr-dashboard.css";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import {
  Users,
  UserPlus,
  UserMinus,
  ClipboardCheck,
  Briefcase,
  HeartPulse,
  ShieldCheck,
  Clock4,
  Target,
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid } from "recharts";

const workforceTrend = [
  { label: "Jan", headcount: 120, attrition: 4 },
  { label: "Feb", headcount: 122, attrition: 3 },
  { label: "Mar", headcount: 126, attrition: 2 },
  { label: "Apr", headcount: 129, attrition: 3 },
  { label: "May", headcount: 132, attrition: 4 },
  { label: "Jun", headcount: 134, attrition: 2 },
];

const pipelineStages = [
  { stage: "Sourcing", candidates: 48, status: "+6 vs last week" },
  { stage: "Screening", candidates: 21, status: "On track" },
  { stage: "Interviews", candidates: 12, status: "2 offers out" },
  { stage: "Offers", candidates: 4, status: "75% acceptance" },
];

const complianceTasks = [
  { title: "Annual policy acknowledgement", due: "Due in 5 days", owner: "People Ops" },
  { title: "Health & safety refresher", due: "Due in 12 days", owner: "Facilities" },
  { title: "Benefits renewal window", due: "Opens next week", owner: "HR Admin" },
];

const spotlightMetrics = [
  { label: "Avg. time to hire", value: "32 days", delta: "-3 days MoM", icon: <Clock4 size={18} /> },
  { label: "Engagement score", value: "8.4 / 10", delta: "+0.4 QoQ", icon: <HeartPulse size={18} /> },
  { label: "Policy completion", value: "92%", delta: "+5% this week", icon: <ShieldCheck size={18} /> },
  { label: "Internal mobility", value: "14%", delta: "+2% YTD", icon: <Target size={18} /> },
];

export default function HrDashboard() {
  const summaryCards = [
    { title: "Active employees", value: "134", icon: <Users size={22} />, tone: "accent-indigo" },
    { title: "Open requisitions", value: "11", icon: <Briefcase size={22} />, tone: "accent-emerald" },
    { title: "New hires (30d)", value: "9", icon: <UserPlus size={22} />, tone: "accent-blue" },
    { title: "Attrition (30d)", value: "3", icon: <UserMinus size={22} />, tone: "accent-rose" },
  ];

  return (
    <Layout title="Dashboard | Human Resources">
      <div className="hr-dashboard-shell">
        <section className="hr-hero">
          <motion.div
            className="hr-hero__copy"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="hr-hero__eyebrow">People Pulse</p>
            <h2 className="hr-hero__title">Human Resources Dashboard</h2>
            <span className="hr-hero__meta">Tracking workforce health & hiring velocity</span>
          </motion.div>

          <motion.div
            className="hr-summary-grid"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {summaryCards.map((card) => (
              <article className="hr-summary-card" key={card.title}>
                <div className={`hr-summary-card__icon ${card.tone}`}>{card.icon}</div>
                <div>
                  <p className="hr-summary-card__label">{card.title}</p>
                  <p className="hr-summary-card__value">{card.value}</p>
                </div>
              </article>
            ))}
          </motion.div>
        </section>

        <section className="hr-panels">
          <motion.article
            className="hr-panel hr-panel--chart"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="hr-panel__header">
              <div>
                <p className="hr-panel__eyebrow">Workforce</p>
                <h3 className="hr-panel__title">Headcount vs Attrition</h3>
              </div>
              <span className="hr-panel__meta">Rolling 6 months</span>
            </div>

            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={workforceTrend}>
                <CartesianGrid stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="label" stroke="#94A3B8" fontSize={12} tickMargin={12} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0" }}
                  formatter={(value) => [value, "Value"]}
                />
                <Bar dataKey="headcount" fill="#4F46E5" radius={[8, 8, 0, 0]} />
                <Bar dataKey="attrition" fill="#F97316" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.article>

          <motion.article
            className="hr-panel hr-panel--pipeline"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="hr-panel__header">
              <div>
                <p className="hr-panel__eyebrow">Talent flow</p>
                <h3 className="hr-panel__title">Hiring pipeline</h3>
              </div>
              <span className="hr-panel__meta">Auto-refresh every hour</span>
            </div>

            <div className="pipeline-grid">
              {pipelineStages.map((stage) => (
                <article className="pipeline-card" key={stage.stage}>
                  <div>
                    <p className="pipeline-card__label">{stage.stage}</p>
                    <p className="pipeline-card__value">{stage.candidates} candidates</p>
                  </div>
                  <span className="pipeline-card__status">{stage.status}</span>
                </article>
              ))}
            </div>
          </motion.article>

          <motion.article
            className="hr-panel hr-panel--spotlight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="hr-panel__header">
              <div>
                <p className="hr-panel__eyebrow">Focus</p>
                <h3 className="hr-panel__title">Spotlight metrics</h3>
              </div>
              <span className="hr-panel__meta">Updated daily</span>
            </div>

            <div className="spotlight-grid">
              {spotlightMetrics.map((metric) => (
                <article className="spotlight-card" key={metric.label}>
                  <div className="spotlight-card__icon">{metric.icon}</div>
                  <div>
                    <p className="spotlight-card__label">{metric.label}</p>
                    <p className="spotlight-card__value">{metric.value}</p>
                    <span className="spotlight-card__delta">{metric.delta}</span>
                  </div>
                </article>
              ))}
            </div>
          </motion.article>

          <motion.article
            className="hr-panel hr-panel--compliance"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="hr-panel__header">
              <div>
                <p className="hr-panel__eyebrow">People ops</p>
                <h3 className="hr-panel__title">Compliance checklist</h3>
              </div>
              <span className="hr-panel__meta">Next 30 days</span>
            </div>

            <div className="compliance-list">
              {complianceTasks.map((task) => (
                <div className="compliance-item" key={task.title}>
                  <div>
                    <p className="compliance-item__title">{task.title}</p>
                    <p className="compliance-item__owner">{task.owner}</p>
                  </div>
                  <span className="compliance-item__due">{task.due}</span>
                </div>
              ))}
            </div>
          </motion.article>
        </section>
      </div>
    </Layout>
  );
}


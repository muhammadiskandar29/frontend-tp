"use client";

import "@/styles/finance/dashboard.css";
import Layout from "@/components/Layout";

export default function FinanceDashboard() {
  return (
    <Layout>
      <div className="finance-dashboard">
        <div className="finance-dashboard__header">
          <h1>Finance Dashboard</h1>
          <p>Welcome to Finance Division</p>
        </div>
        
        <div className="finance-dashboard__content">
          {/* Content akan ditambahkan nanti */}
        </div>
      </div>
    </Layout>
  );
}

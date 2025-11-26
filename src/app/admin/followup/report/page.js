"use client";

import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import "@/styles/dashboard.css";
import "@/styles/admin.css";
import "@/styles/followup.css";
import { getLogsFollowUp } from "@/lib/logsFollowUp";

function useDebouncedValue(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// Status mapping
const STATUS_MAP = {
  pending: { label: "Pending", color: "#f59e0b", bg: "#fef3c7" },
  terkirim: { label: "Terkirim", color: "#10b981", bg: "#d1fae5" },
  gagal: { label: "Tidak Terkirim", color: "#ef4444", bg: "#fee2e2" },
};

// Determine status from log item
const getLogStatus = (item) => {
  // Check keterangan first for explicit status
  const keterangan = (item.keterangan || "").toLowerCase();
  
  if (keterangan.includes("terkirim") || keterangan.includes("sukses") || keterangan.includes("success")) {
    return "terkirim";
  }
  
  if (keterangan.includes("gagal") || keterangan.includes("failed") || keterangan.includes("error")) {
    return "gagal";
  }
  
  // Check status field
  if (item.status === "Y" || item.status === "1" || item.status === 1) {
    return "terkirim";
  }
  
  if (item.status === "N" || item.status === "0" || item.status === 0) {
    return "gagal";
  }
  
  // Check follup_rel status
  if (item.follup_rel?.status === "1") {
    return "terkirim";
  }
  
  // Default to pending if no clear status
  return "pending";
};

export default function FollowupReportPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState("all"); // all, pending, terkirim, gagal
  const itemsPerPage = 25;

  useEffect(() => {
    async function loadLogs() {
      try {
        const res = await getLogsFollowUp();
        const mappedLogs = (res.data || []).map((item) => {
          const status = getLogStatus(item);
          return {
            id: item.id,
            customerName: item.customer_rel?.nama || "-",
            customerPhone: item.customer_rel?.wa || "-",
            customerEmail: item.customer_rel?.email || "-",
            customer: `${item.customer_rel?.nama || "-"} / ${item.customer_rel?.wa || "-"}`,
            keterangan: item.keterangan || "-",
            event: item.follup_rel?.nama || "-",
            type: item.follup_rel?.type || "-",
            status: status,
            statusLabel: STATUS_MAP[status]?.label || status,
            waktu: item.create_at || item.follup_rel?.create_at || "-",
            produk: item.follup_rel?.produk_rel?.nama || "-",
          };
        });
        setLogs(mappedLogs);
      } catch (err) {
        console.error("Gagal ambil data log follow up:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    loadLogs();
  }, []);

  // Filter by status and search
  const filteredLogs = useMemo(() => {
    let result = logs;
    
    // Filter by status tab
    if (activeFilter !== "all") {
      result = result.filter((log) => log.status === activeFilter);
    }
    
    // Filter by search
    if (debouncedSearch.trim()) {
      const term = debouncedSearch.trim().toLowerCase();
      result = result.filter((log) =>
        [log.customerName, log.customerPhone, log.keterangan, log.event, log.produk]
          .join(" ")
          .toLowerCase()
          .includes(term)
      );
    }
    
    return result;
  }, [logs, debouncedSearch, activeFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = useMemo(() => {
    return filteredLogs.slice(startIndex, endIndex);
  }, [filteredLogs, startIndex, endIndex]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, activeFilter]);

  // Count by status
  const countByStatus = useMemo(() => ({
    all: logs.length,
    pending: logs.filter((log) => log.status === "pending").length,
    terkirim: logs.filter((log) => log.status === "terkirim").length,
    gagal: logs.filter((log) => log.status === "gagal").length,
  }), [logs]);

  const summaryCards = [
    {
      label: "Total Log",
      value: countByStatus.all,
      icon: "📑",
      accent: "accent-indigo",
    },
    {
      label: "Pending",
      value: countByStatus.pending,
      icon: "⏳",
      accent: "accent-amber",
    },
    {
      label: "Terkirim",
      value: countByStatus.terkirim,
      icon: "✅",
      accent: "accent-emerald",
    },
    {
      label: "Tidak Terkirim",
      value: countByStatus.gagal,
      icon: "❌",
      accent: "accent-rose",
    },
  ];

  const filterTabs = [
    { key: "all", label: "Semua", count: countByStatus.all },
    { key: "pending", label: "Pending", count: countByStatus.pending },
    { key: "terkirim", label: "Terkirim", count: countByStatus.terkirim },
    { key: "gagal", label: "Tidak Terkirim", count: countByStatus.gagal },
  ];

  const columns = ["#", "Customer", "Keterangan", "Event", "Produk", "Status", "Waktu"];

  return (
    <Layout title="Report Follow Up | One Dashboard">
      <div className="dashboard-shell followup-shell">
        <section className="dashboard-hero followup-hero">
          <div className="dashboard-hero__copy">
            <p className="dashboard-hero__eyebrow">Follow-up</p>
            <h2 className="dashboard-hero__title">Report Follow Up</h2>
            <span className="dashboard-hero__meta">
              Lihat ringkasan aktivitas follow up broadcast WhatsApp.
            </span>
          </div>

          <div className="customers-toolbar">
            <div className="customers-search">
              <input
                type="search"
                placeholder="Cari customer, event, produk, atau keterangan"
                className="customers-search__input"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <span className="customers-search__icon pi pi-search" />
            </div>
          </div>
        </section>

        <section className="dashboard-summary orders-summary">
          {summaryCards.map((card) => (
            <article className="summary-card" key={card.label}>
              <div className={`summary-card__icon ${card.accent}`}>
                {card.icon}
              </div>
              <div>
                <p className="summary-card__label">{card.label}</p>
                <p className="summary-card__value">{card.value}</p>
              </div>
            </article>
          ))}
        </section>

        {/* Filter Tabs */}
        <section className="followup-filter-section">
          <div className="followup-filter-tabs">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                className={`followup-filter-tab ${activeFilter === tab.key ? "active" : ""}`}
                onClick={() => setActiveFilter(tab.key)}
              >
                {tab.label}
                <span className="followup-filter-count">{tab.count}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="panel users-panel">
          <div className="panel__header">
            <div>
              <p className="panel__eyebrow">Report</p>
              <h3 className="panel__title">Log follow up {activeFilter !== "all" ? `- ${filterTabs.find(t => t.key === activeFilter)?.label}` : ""}</h3>
            </div>
            <span className="panel__meta">
              {filteredLogs.length} log ditampilkan
            </span>
          </div>

          <div className="users-table__wrapper">
            <div className="users-table">
              <div className="users-table__head">
                {columns.map((column) => (
                  <span key={column}>{column}</span>
                ))}
              </div>
              <div className="users-table__body">
                {loading ? (
                  <p className="users-empty">Memuat data...</p>
                ) : error ? (
                  <p className="users-empty">
                    Gagal memuat data log follow up
                  </p>
                ) : filteredLogs.length === 0 ? (
                  <p className="users-empty">
                    {logs.length
                      ? "Tidak ada log yang cocok dengan filter."
                      : "Belum ada data log follow up."}
                  </p>
                ) : (
                  paginatedData.map((log, i) => (
                    <div className="users-table__row" key={log.id}>
                      <div className="users-table__cell" data-label="#">
                        {startIndex + i + 1}
                      </div>
                      <div className="users-table__cell users-table__cell--profile" data-label="Customer">
                        <div className="users-meta">
                          <p className="users-name">{log.customerName}</p>
                          <p className="users-email">{log.customerPhone}</p>
                        </div>
                      </div>
                      <div className="users-table__cell" data-label="Keterangan">
                        <p className="users-contact-line" style={{ 
                          maxWidth: "250px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }} title={log.keterangan}>
                          {log.keterangan}
                        </p>
                      </div>
                      <div className="users-table__cell" data-label="Event">
                        <p className="users-contact-line">{log.event}</p>
                      </div>
                      <div className="users-table__cell" data-label="Produk">
                        <p className="users-contact-line" style={{
                          maxWidth: "150px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }} title={log.produk}>
                          {log.produk}
                        </p>
                      </div>
                      <div className="users-table__cell" data-label="Status">
                        <span
                          className={`followup-status-pill followup-status-pill--${log.status}`}
                          style={{
                            background: STATUS_MAP[log.status]?.bg,
                            color: STATUS_MAP[log.status]?.color,
                          }}
                        >
                          {log.statusLabel}
                        </span>
                      </div>
                      <div className="users-table__cell" data-label="Waktu">
                        <span className="users-contact-line users-contact-line--muted">
                          {log.waktu !== "-"
                            ? new Date(log.waktu).toLocaleString("id-ID", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="customers-pagination">
              <button
                className="customers-pagination__btn"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <i className="pi pi-chevron-left" />
              </button>
              <span className="customers-pagination__info">
                Page {currentPage} of {totalPages} ({filteredLogs.length} total)
              </span>
              <button
                className="customers-pagination__btn"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <i className="pi pi-chevron-right" />
              </button>
            </div>
          )}
        </section>
      </div>

      <style>{`
        .followup-filter-section {
          margin-bottom: 20px;
        }
        
        .followup-filter-tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          background: white;
          padding: 12px 16px;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .followup-filter-tab {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          font-size: 14px;
          color: #374151;
          transition: all 0.2s;
        }
        
        .followup-filter-tab:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
        }
        
        .followup-filter-tab.active {
          background: #2563eb;
          color: white;
          border-color: #2563eb;
        }
        
        .followup-filter-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 24px;
          height: 24px;
          padding: 0 8px;
          background: rgba(0,0,0,0.1);
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .followup-filter-tab.active .followup-filter-count {
          background: rgba(255,255,255,0.2);
        }
        
        .followup-status-pill {
          display: inline-flex;
          align-items: center;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .followup-status-pill--pending {
          background: #fef3c7 !important;
          color: #d97706 !important;
        }
        
        .followup-status-pill--terkirim {
          background: #d1fae5 !important;
          color: #059669 !important;
        }
        
        .followup-status-pill--gagal {
          background: #fee2e2 !important;
          color: #dc2626 !important;
        }
        
        .accent-rose {
          background: linear-gradient(135deg, #fda4af, #fb7185);
          color: white;
        }
      `}</style>
    </Layout>
  );
}

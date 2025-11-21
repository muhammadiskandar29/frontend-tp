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

export default function FollowupReportPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  useEffect(() => {
    async function loadLogs() {
      try {
        const res = await getLogsFollowUp();
        const mappedLogs = (res.data || []).map((item) => ({
          id: item.id,
          customerName: item.customer_rel?.nama || "-",
          customerPhone: item.customer_rel?.wa || "-",
          customer: `${item.customer_rel?.nama || "-"} / ${item.customer_rel?.wa || "-"}`,
          keterangan: item.keterangan || "-",
          event: item.follup_rel?.nama || "-",
          status: item.follup_rel?.status === "1" ? "Terkirim" : "Gagal",
          waktu: item.follup_rel?.create_at || item.create_at || "-",
        }));
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

  const filteredLogs = useMemo(() => {
    if (!debouncedSearch.trim()) return logs;
    const term = debouncedSearch.trim().toLowerCase();
    return logs.filter((log) =>
      [log.customerName, log.customerPhone, log.keterangan, log.event]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [logs, debouncedSearch]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = useMemo(() => {
    return filteredLogs.slice(startIndex, endIndex);
  }, [filteredLogs, startIndex, endIndex]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const summaryCards = [
    {
      label: "Total log",
      value: logs.length,
      icon: "📑",
      accent: "accent-indigo",
    },
    {
      label: "Terkirim",
      value: logs.filter((log) => log.status === "Terkirim").length,
      icon: "✅",
      accent: "accent-emerald",
    },
    {
      label: "Gagal",
      value: logs.filter((log) => log.status !== "Terkirim").length,
      icon: "⚠️",
      accent: "accent-amber",
    },
  ];

  const columns = ["#", "Customer", "Keterangan", "Event", "Status", "Waktu"];

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
                placeholder="Cari customer, event, atau keterangan"
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

        <section className="panel orders-panel">
          <div className="panel__header">
            <div>
              <p className="panel__eyebrow">Report</p>
              <h3 className="panel__title">Log follow up terbaru</h3>
            </div>
            <span className="panel__meta">
              {filteredLogs.length} log ditampilkan
            </span>
          </div>

          <div className="products-table__wrapper" style={{ overflowX: "auto", maxWidth: "100%" }}>
            <div className="products-table" style={{ minWidth: "100%", tableLayout: "fixed", width: "100%" }}>
              <div className="products-table__head" style={{ display: "grid", gridTemplateColumns: "60px 1.5fr 2fr 1.5fr 120px 180px" }}>
                {columns.map((column) => (
                  <span key={column} style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", fontWeight: "600" }}>
                    {column}
                  </span>
                ))}
              </div>

              <div className="products-table__body">
                {loading ? (
                  <p className="products-empty">Memuat data...</p>
                ) : error ? (
                  <p className="products-empty">
                    Gagal memuat data log follow up
                  </p>
                ) : filteredLogs.length === 0 ? (
                  <p className="products-empty">
                    {logs.length
                      ? "Tidak ada log yang cocok."
                      : "Belum ada data log follow up."}
                  </p>
                ) : (
                  paginatedData.map((log, i) => (
                    <div 
                      className="products-table__row" 
                      key={log.id}
                      style={{ display: "grid", gridTemplateColumns: "60px 1.5fr 2fr 1.5fr 120px 180px" }}
                    >
                      <div className="products-table__cell" data-label="#" style={{ padding: "0.75rem 1rem", fontSize: "0.875rem" }}>
                        {startIndex + i + 1}
                      </div>
                      <div
                        className="products-table__cell products-table__cell--strong"
                        data-label="Customer"
                        style={{ padding: "0.75rem 1rem", minWidth: 0 }}
                      >
                        <div className="product-table__info" style={{ minWidth: 0 }}>
                          <span className="product-table__name" style={{ 
                            display: "block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontSize: "0.875rem",
                            fontWeight: "500"
                          }}>
                            {log.customerName}
                          </span>
                          <span className="product-table__meta" style={{ 
                            fontSize: "0.75rem", 
                            color: "#6b7280",
                            display: "block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          }}>
                            {log.customerPhone}
                          </span>
                        </div>
                      </div>
                      <div className="products-table__cell" data-label="Keterangan" style={{ padding: "0.75rem 1rem", minWidth: 0 }}>
                        <p style={{ 
                          overflow: "hidden", 
                          textOverflow: "ellipsis", 
                          whiteSpace: "nowrap",
                          margin: 0,
                          fontSize: "0.875rem"
                        }}>
                          {log.keterangan}
                        </p>
                      </div>
                      <div className="products-table__cell" data-label="Event" style={{ padding: "0.75rem 1rem", minWidth: 0 }}>
                        <span style={{
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontSize: "0.875rem"
                        }}>
                          {log.event}
                        </span>
                      </div>
                      <div className="products-table__cell" data-label="Status" style={{ padding: "0.75rem 1rem" }}>
                        <span
                          className={`followup-status-pill ${
                            log.status === "Terkirim"
                              ? "followup-status-pill--success"
                              : "followup-status-pill--danger"
                          }`}
                          style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                        >
                          {log.status}
                        </span>
                      </div>
                      <div className="products-table__cell" data-label="Waktu" style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", color: "#6b7280" }}>
                        {log.waktu !== "-"
                          ? new Date(log.waktu).toLocaleString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
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
    </Layout>
  );
}

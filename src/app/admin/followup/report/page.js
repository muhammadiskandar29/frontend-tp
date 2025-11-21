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

        <section className="panel users-panel">
          <div className="panel__header">
            <div>
              <p className="panel__eyebrow">Report</p>
              <h3 className="panel__title">Log follow up terbaru</h3>
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
                      ? "Tidak ada log yang cocok."
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
                          maxWidth: "300px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}>
                          {log.keterangan}
                        </p>
                      </div>
                      <div className="users-table__cell" data-label="Event">
                        <p className="users-contact-line">{log.event}</p>
                      </div>
                      <div className="users-table__cell" data-label="Status">
                        <span
                          className={`followup-status-pill ${
                            log.status === "Terkirim"
                              ? "followup-status-pill--success"
                              : "followup-status-pill--danger"
                          }`}
                        >
                          {log.status}
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
    </Layout>
  );
}

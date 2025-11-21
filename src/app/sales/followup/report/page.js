"use client";

import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import "@/styles/dashboard.css";
import "@/styles/admin.css";
import "@/styles/followup.css";
import { getLogsFollowUp } from "@/lib/logsFollowUp";

export default function FollowupReportPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState("");

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
    if (!searchInput.trim()) return logs;
    const term = searchInput.trim().toLowerCase();
    return logs.filter((log) =>
      [log.customerName, log.customerPhone, log.keterangan, log.event]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [logs, searchInput]);

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

          <div className="orders-toolbar">
            <div className="orders-search">
              <input
                type="search"
                placeholder="Cari customer, event, atau keterangan"
                className="orders-search__input"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <span className="orders-search__icon pi pi-search" />
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

          <div className="products-table__wrapper">
            <div className="products-table">
              <div className="products-table__head">
                {columns.map((column) => (
                  <span key={column}>{column}</span>
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
                  filteredLogs.map((log, i) => (
                    <div className="products-table__row" key={log.id}>
                      <div className="products-table__cell" data-label="#">
                        {i + 1}
                      </div>
                      <div
                        className="products-table__cell products-table__cell--strong"
                        data-label="Customer"
                      >
                        <div className="product-table__info">
                          <span className="product-table__name">
                            {log.customerName}
                          </span>
                          <span className="product-table__meta" style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                            {log.customerPhone}
                          </span>
                        </div>
                      </div>
                      <div className="products-table__cell" data-label="Keterangan">
                        <p style={{ 
                          maxWidth: "300px", 
                          overflow: "hidden", 
                          textOverflow: "ellipsis", 
                          whiteSpace: "nowrap",
                          margin: 0 
                        }}>
                          {log.keterangan}
                        </p>
                      </div>
                      <div className="products-table__cell" data-label="Event">
                        {log.event}
                      </div>
                      <div className="products-table__cell" data-label="Status">
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
                      <div className="products-table__cell" data-label="Waktu">
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
        </section>
      </div>
    </Layout>
  );
}

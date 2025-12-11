"use client";

import { useEffect, useState, useCallback } from "react";
import Layout from "@/components/Layout";
import dynamic from "next/dynamic";
import "primereact/resources/themes/lara-light-cyan/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "@/styles/sales/dashboard.css";
import "@/styles/sales/admin.css";
import "@/styles/sales/broadcast.css";

// Lazy load modal
const ViewPenerima = dynamic(() => import("./viewPenerima"), { ssr: false });

export default function BroadcastPage() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showViewPenerima, setShowViewPenerima] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState(null);

  const fetchBroadcasts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Token tidak ditemukan");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/sales/broadcast", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const json = await res.json();

      if (json.success && json.data) {
        setBroadcasts(Array.isArray(json.data) ? json.data : []);
      } else {
        setError(json.message || "Gagal memuat data broadcast");
      }
    } catch (err) {
      console.error("Error fetching broadcasts:", err);
      setError(err.message || "Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBroadcasts();
  }, [fetchBroadcasts]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateString;
    }
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      "1": "Draft",
      "2": "Terjadwal",
      "3": "Terkirim",
      "4": "Dibatalkan",
    };
    return statusMap[status?.trim()] || status || "-";
  };

  const getStatusClass = (status) => {
    const statusMap = {
      "1": "pending",
      "2": "pending",
      "3": "sukses",
      "4": "failed",
    };
    return statusMap[status?.trim()] || "default";
  };

  return (
    <Layout title="Broadcast | Sales Dashboard">
      <div className="dashboard-shell orders-shell">
        <section className="dashboard-hero orders-hero">
          <div className="dashboard-hero__copy">
            <p className="dashboard-hero__eyebrow">Broadcast</p>
            <h2 className="dashboard-hero__title">Broadcast Management</h2>
            <span className="dashboard-hero__meta">
              Kelola dan kirim broadcast pesan ke customer.
            </span>
          </div>

          <div className="broadcast-toolbar">
            <div></div>
            <div className="broadcast-toolbar-buttons">
              <button className="broadcast-button broadcast-button--primary">
                + Tambah Broadcast
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="dashboard-alert" style={{ marginTop: "1rem" }}>
            {error}
          </div>
        )}

        <section className="panel orders-panel">
          <div className="panel__header">
            <div>
              <p className="panel__eyebrow">Directory</p>
              <h3 className="panel__title">Broadcast List</h3>
            </div>
          </div>

          <div className="broadcast-table__wrapper">
            {loading ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--dash-muted)" }}>
                Memuat data...
              </div>
            ) : broadcasts.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--dash-muted)" }}>
                Belum ada data broadcast
              </div>
            ) : (
              <div className="broadcast-table">
                <div className="broadcast-table__head">
                  <span>#</span>
                  <span>Nama</span>
                  <span>Pesan</span>
                  <span>Tanggal Kirim</span>
                  <span>Target</span>
                  <span>Total Target</span>
                  <span>Status</span>
                  <span>Dibuat</span>
                  <span>Actions</span>
                </div>
                <div className="broadcast-table__body">
                  {broadcasts.map((broadcast, i) => {
                    let targetData = {};
                    try {
                      if (broadcast.target) {
                        targetData = JSON.parse(broadcast.target);
                      }
                    } catch (e) {
                      console.error("Error parsing target:", e);
                    }

                    return (
                      <div className="broadcast-table__row" key={broadcast.id}>
                        <div className="broadcast-table__cell" data-label="#">
                          {i + 1}
                        </div>
                        <div className="broadcast-table__cell broadcast-table__cell--strong" data-label="Nama">
                          {broadcast.nama || "-"}
                        </div>
                        <div className="broadcast-table__cell" data-label="Pesan">
                          {broadcast.pesan || "-"}
                        </div>
                        <div className="broadcast-table__cell" data-label="Tanggal Kirim">
                          {formatDate(broadcast.tanggal_kirim)}
                        </div>
                        <div className="broadcast-table__cell" data-label="Target">
                          {targetData.produk ? `Produk: ${targetData.produk.join(", ")}` : "-"}
                          {targetData.status_order ? ` | Status: ${targetData.status_order}` : ""}
                        </div>
                        <div className="broadcast-table__cell" data-label="Total Target">
                          {broadcast.total_target || "0"}
                        </div>
                        <div className="broadcast-table__cell" data-label="Status">
                          <span className={`orders-status-badge orders-status-badge--${getStatusClass(broadcast.status)}`}>
                            {getStatusLabel(broadcast.status)}
                          </span>
                        </div>
                        <div className="broadcast-table__cell" data-label="Dibuat">
                          {formatDate(broadcast.create_at)}
                        </div>
                        <div className="broadcast-table__cell broadcast-table__cell--actions" data-label="Actions">
                          <button
                            className="broadcast-action-btn"
                            title="View Penerima"
                            onClick={() => {
                              setSelectedBroadcast(broadcast);
                              setShowViewPenerima(true);
                            }}
                          >
                            <i className="pi pi-eye" style={{ fontSize: "0.9rem" }} />
                            View
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Modal View Penerima */}
      {showViewPenerima && selectedBroadcast && (
        <ViewPenerima
          broadcast={selectedBroadcast}
          onClose={() => {
            setShowViewPenerima(false);
            setSelectedBroadcast(null);
          }}
        />
      )}
    </Layout>
  );
}

"use client";

import { useEffect, useState } from "react";
import "primeicons/primeicons.css";
import "@/styles/sales/pesanan.css";

export default function ViewPenerima({ broadcast, onClose }) {
  const [penerima, setPenerima] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!broadcast?.id) return;

    const fetchPenerima = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Token tidak ditemukan");
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/sales/broadcast/${broadcast.id}/penerima`, {
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
          setPenerima(Array.isArray(json.data) ? json.data : []);
        } else {
          setError(json.message || "Gagal memuat data penerima");
        }
      } catch (err) {
        console.error("Error fetching penerima:", err);
        setError(err.message || "Terjadi kesalahan saat memuat data");
      } finally {
        setLoading(false);
      }
    };

    fetchPenerima();
  }, [broadcast]);

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
      "1": "Terkirim",
      "2": "Gagal",
      "3": "Pending",
    };
    return statusMap[status?.trim()] || status || "-";
  };

  const getStatusClass = (status) => {
    const statusMap = {
      "1": "sukses",
      "2": "failed",
      "3": "pending",
    };
    return statusMap[status?.trim()] || "default";
  };

  if (!broadcast) return null;

  return (
    <>
      <style>{`
        /* Responsive Styles untuk ViewPenerima */
        @media (max-width: 768px) {
          .view-penerima-modal .orders-modal-card {
            max-width: 95vw !important;
            max-height: 95vh !important;
            margin: 1rem !important;
          }
          
          .view-penerima-modal table {
            font-size: 0.875rem !important;
          }
          
          .view-penerima-modal th,
          .view-penerima-modal td {
            padding: 0.5rem !important;
            font-size: 0.8125rem !important;
          }
        }
        
        @media (max-width: 480px) {
          .view-penerima-modal .orders-modal-card {
            max-width: 100vw !important;
            max-height: 100vh !important;
            margin: 0 !important;
            border-radius: 0 !important;
          }
          
          .view-penerima-modal .orders-modal-header {
            padding: 1rem !important;
          }
          
          .view-penerima-modal .orders-modal-body {
            padding: 1rem !important;
          }
          
          .view-penerima-modal .orders-modal-footer {
            padding: 1rem !important;
          }
          
          .view-penerima-modal .orders-modal-footer button {
            width: 100% !important;
          }
          
          .view-penerima-modal table {
            display: block !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
          }
          
          .view-penerima-modal thead {
            display: none !important;
          }
          
          .view-penerima-modal tbody {
            display: block !important;
          }
          
          .view-penerima-modal tr {
            display: block !important;
            margin-bottom: 1rem !important;
            border: 1px solid #e5e7eb !important;
            border-radius: 8px !important;
            padding: 0.75rem !important;
          }
          
          .view-penerima-modal td {
            display: flex !important;
            justify-content: space-between !important;
            padding: 0.5rem 0 !important;
            border: none !important;
            text-align: left !important;
          }
          
          .view-penerima-modal td::before {
            content: attr(data-label) ": " !important;
            font-weight: 600 !important;
            margin-right: 0.5rem !important;
          }
        }
        
        @media (max-width: 200px) {
          .view-penerima-modal .orders-modal-card {
            padding: 0.5rem !important;
          }
          
          .view-penerima-modal .orders-modal-header {
            padding: 0.5rem !important;
          }
          
          .view-penerima-modal .orders-modal-body {
            padding: 0.5rem !important;
          }
          
          .view-penerima-modal .orders-modal-footer {
            padding: 0.5rem !important;
          }
          
          .view-penerima-modal td {
            font-size: 0.75rem !important;
          }
        }
      `}</style>
      <div className="orders-modal-overlay view-penerima-modal">
      <div className="orders-modal-card" style={{ maxWidth: "900px", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div className="orders-modal-header">
          <div>
            <p className="orders-modal-eyebrow">Data Penerima</p>
            <h2>{broadcast.nama || "Broadcast"}</h2>
          </div>
          <button className="orders-modal-close" onClick={onClose} type="button" aria-label="Tutup">
            <i className="pi pi-times" />
          </button>
        </div>

        {/* Body */}
        <div className="orders-modal-body" style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--dash-muted)" }}>
              Memuat data...
            </div>
          ) : error ? (
            <div style={{ padding: "1rem", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "0.5rem", color: "#b91c1c" }}>
              {error}
            </div>
          ) : penerima.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--dash-muted)" }}>
              Belum ada data penerima
            </div>
          ) : (
            <div className="orders-section">
              <div style={{ marginBottom: "1rem", padding: "1rem", background: "#f8f9fa", borderRadius: "8px" }}>
                <p style={{ margin: 0, fontSize: "0.9rem", color: "#6b7280" }}>
                  <strong>Total Penerima:</strong> {penerima.length}
                </p>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                      <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", color: "#6b7280" }}>#</th>
                      <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", color: "#6b7280" }}>Customer</th>
                      <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", color: "#6b7280" }}>No. Telp</th>
                      <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", color: "#6b7280" }}>Pesan</th>
                      <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", color: "#6b7280" }}>Response</th>
                      <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", color: "#6b7280" }}>Status</th>
                      <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", color: "#6b7280" }}>Dikirim</th>
                    </tr>
                  </thead>
                  <tbody>
                    {penerima.map((item, i) => (
                      <tr key={item.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td data-label="#" style={{ padding: "0.75rem", fontSize: "0.875rem" }}>{i + 1}</td>
                        <td data-label="Customer" style={{ padding: "0.75rem", fontSize: "0.875rem" }}>
                          {item.customer_rel?.nama || "-"}
                        </td>
                        <td data-label="No. Telp" style={{ padding: "0.75rem", fontSize: "0.875rem" }}>
                          {item.notelp || item.customer_rel?.wa || "-"}
                        </td>
                        <td data-label="Pesan" style={{ padding: "0.75rem", fontSize: "0.875rem", maxWidth: "200px", wordBreak: "break-word" }}>
                          {item.pesan || "-"}
                        </td>
                        <td data-label="Response" style={{ padding: "0.75rem", fontSize: "0.875rem", maxWidth: "200px", wordBreak: "break-word" }}>
                          {item.response && item.response !== "null" ? item.response : "-"}
                        </td>
                        <td data-label="Status" style={{ padding: "0.75rem", fontSize: "0.875rem" }}>
                          <span className={`orders-status-badge orders-status-badge--${getStatusClass(item.status)}`}>
                            {getStatusLabel(item.status)}
                          </span>
                        </td>
                        <td data-label="Dikirim" style={{ padding: "0.75rem", fontSize: "0.875rem" }}>
                          {formatDate(item.send_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="orders-modal-footer">
          <button
            className="orders-btn orders-btn--ghost"
            onClick={onClose}
            type="button"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
    </>
  );
}

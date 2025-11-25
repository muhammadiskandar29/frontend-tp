"use client";

import { useEffect, useState } from "react";
import "@/styles/customer.css";

const FOLLOWUP_TYPES = {
  1: { label: "Follow Up 1", name: "Follow Up 1" },
  2: { label: "Follow Up 2", name: "Follow Up 2" },
  3: { label: "Follow Up 3", name: "Follow Up 3" },
  4: { label: "Follow Up 4", name: "Follow Up 4" },
  5: { label: "Register", name: "Register" },
  6: { label: "Processing", name: "Processing" },
  7: { label: "Selesai", name: "Selesai" },
  8: { label: "Upselling", name: "Upselling" },
  9: { label: "Redirect", name: "Redirect" },
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function FollowupLogModal({ customer, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [followupData, setFollowupData] = useState([]);
  const [customerData, setCustomerData] = useState(null);

  useEffect(() => {
    if (!customer?.id) return;
    fetchFollowupLog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer?.id]);

  const fetchFollowupLog = async () => {
    if (!customer?.id) return;
    setLoading(true);
    setError("");
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(`/api/admin/customer/followup/${customer.id}`, {
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Gagal memuat log follow up");
      }

      setFollowupData(Array.isArray(data.data) ? data.data : []);
      setCustomerData(data.customer || customer);
    } catch (err) {
      console.error("❌ [FOLLOWUP LOG] fetch error:", err);
      setError(err.message || "Terjadi kesalahan saat memuat data");
      setFollowupData([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper untuk replace template variables
  const replaceTemplate = (text, customerName = "") => {
    if (!text) return "";
    return text
      .replace(/\{\{customer_name\}\}/gi, customerName || customer?.nama || "Customer")
      .replace(/\{\{nama_customer\}\}/gi, customerName || customer?.nama || "Customer");
  };

  // Buat mapping data followup berdasarkan type
  const getFollowupByType = () => {
    const typeMap = {};
    followupData.forEach((item) => {
      const typeNum = Number(item.follup_rel?.type || item.type || item.follup);
      if (!Number.isNaN(typeNum) && typeNum >= 1 && typeNum <= 9) {
        typeMap[typeNum] = item;
      }
    });
    return typeMap;
  };

  const followupByType = getFollowupByType();
  const customerName = customerData?.nama || customer?.nama || "";

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: "800px", maxHeight: "90vh" }}>
        <div className="modal-header">
          <h2>Log Follow Up — {customerName}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Tutup modal">
            <i className="pi pi-times" />
          </button>
        </div>

        <div className="modal-body" style={{ overflowY: "auto", maxHeight: "calc(90vh - 140px)" }}>
          {loading ? (
            <p style={{ textAlign: "center", color: "#6b7280" }}>Memuat log follow up...</p>
          ) : error ? (
            <div className="history-error">
              <p>{error}</p>
              <button type="button" className="btn-primary" onClick={fetchFollowupLog}>
                Coba Lagi
              </button>
            </div>
          ) : (
            <div className="followup-log-list">
              {Object.keys(FOLLOWUP_TYPES).map((typeKey) => {
                const typeNum = Number(typeKey);
                const followupItem = followupByType[typeNum];
                const isSent =
                  followupItem &&
                  (followupItem.status === "Y" ||
                    followupItem.keterangan?.toLowerCase().includes("terkirim"));
                const followupInfo = followupItem?.follup_rel || {};
                const message = followupInfo.text || "";

                return (
                  <div
                    key={typeNum}
                    className={`followup-log-item ${isSent ? "followup-log-item--sent" : "followup-log-item--pending"}`}
                  >
                    <div className="followup-log-header">
                      <h3 className="followup-log-title">
                        {FOLLOWUP_TYPES[typeNum].label}
                        {isSent && (
                          <span className="followup-log-badge">
                            <i className="pi pi-check-circle" /> Terkirim
                          </span>
                        )}
                        {!isSent && followupItem && (
                          <span className="followup-log-badge followup-log-badge--pending">
                            Belum Terkirim
                          </span>
                        )}
                      </h3>
                      {followupItem?.create_at && (
                        <span className="followup-log-date">
                          {formatDateTime(followupItem.create_at)}
                        </span>
                      )}
                    </div>
                    {message ? (
                      <div className="followup-log-message">
                        <pre>{replaceTemplate(message, customerName)}</pre>
                      </div>
                    ) : (
                      <div className="followup-log-message followup-log-message--empty">
                        <p>Belum ada pesan follow up untuk type ini.</p>
                      </div>
                    )}
                    {followupInfo.produk_rel && (
                      <div className="followup-log-product">
                        <strong>Produk:</strong> {followupInfo.produk_rel.nama}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-cancel" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>

      <style>{`
        .followup-log-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .followup-log-item {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
          background: #f9fafb;
          transition: all 0.2s;
        }
        .followup-log-item--sent {
          border-color: #3b82f6;
          background: #eff6ff;
        }
        .followup-log-item--pending {
          border-color: #d1d5db;
          background: #f9fafb;
          opacity: 0.7;
        }
        .followup-log-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          flex-wrap: wrap;
          gap: 8px;
        }
        .followup-log-title {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: #111827;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .followup-log-item--sent .followup-log-title {
          color: #1e40af;
        }
        .followup-log-item--pending .followup-log-title {
          color: #6b7280;
        }
        .followup-log-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          padding: 4px 10px;
          border-radius: 12px;
          background: #3b82f6;
          color: white;
        }
        .followup-log-badge--pending {
          background: #9ca3af;
        }
        .followup-log-badge i {
          font-size: 0.7rem;
        }
        .followup-log-date {
          font-size: 0.85rem;
          color: #6b7280;
        }
        .followup-log-message {
          margin-top: 12px;
          padding: 12px;
          background: white;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }
        .followup-log-item--sent .followup-log-message {
          border-color: #bfdbfe;
          background: #ffffff;
        }
        .followup-log-message pre {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          font-size: 0.9rem;
          line-height: 1.6;
          color: #374151;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        .followup-log-item--pending .followup-log-message pre {
          color: #9ca3af;
        }
        .followup-log-message--empty {
          background: #f3f4f6;
          border-color: #e5e7eb;
        }
        .followup-log-message--empty p {
          margin: 0;
          color: #9ca3af;
          font-style: italic;
          font-size: 0.9rem;
        }
        .followup-log-product {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
          font-size: 0.85rem;
          color: #6b7280;
        }
        .followup-log-product strong {
          color: #374151;
          margin-right: 6px;
        }
        .history-error {
          text-align: center;
          color: #b91c1c;
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
        }
        .btn-primary {
          background: #2563eb;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
        }
        .btn-primary:hover {
          background: #1d4ed8;
        }
      `}</style>
    </div>
  );
}


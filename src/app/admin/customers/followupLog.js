"use client";

import { useEffect, useState } from "react";
import "@/styles/customer.css";

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

const getStatusBadge = (status) => {
  // Status dari backend: "1" = terkirim, "0" = gagal, null = pending/belum terkirim
  if (status === "1" || status === 1 || status === "Y") {
    return { label: "Terkirim", className: "badge-success" };
  }
  if (status === "0" || status === 0 || status === "N") {
    return { label: "Gagal", className: "badge-danger" };
  }
  // null atau undefined = belum terkirim / pending
  return { label: "Pending", className: "badge-warning" };
};

export default function FollowupLogModal({ customer, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(""); // Filter by event

  useEffect(() => {
    if (!customer?.id) return;
    fetchLogsFollup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer?.id, selectedEvent]);

  const fetchLogsFollup = async () => {
    if (!customer?.id) return;
    setLoading(true);
    setError("");
    
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      
      // POST /api/admin/logs-follup
      // Request: { customer: id_customer (integer), event: integer (optional) }
      // PENTING: customer harus integer, bukan string
      const customerId = Number(customer.id);
      
      const requestBody = {
        customer: customerId,
      };
      
      // Tambahkan event filter jika dipilih
      if (selectedEvent) {
        requestBody.event = Number(selectedEvent);
      }

      console.log("📤 [FOLLOWUP LOG] Request:", {
        customerId: customerId,
        customerName: customer.nama,
        body: JSON.stringify(requestBody)
      });

      const res = await fetch("/api/admin/logs-follup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json().catch(() => ({}));
      
      console.log("📥 [FOLLOWUP LOG] Response:", {
        status: res.status,
        message: data?.message,
        total: data?.total,
        dataCount: data?.data?.length || 0,
        data: data?.data
      });
      
      // API response: { message, total, data: [...] }
      if (!res.ok) {
        throw new Error(data?.message || "Gagal memuat log follow up");
      }

      // Filter data untuk memastikan hanya log milik customer ini yang ditampilkan
      const logsData = Array.isArray(data.data) ? data.data : [];
      const filteredLogs = logsData.filter(log => {
        const logCustomerId = Number(log.customer);
        const isMatch = logCustomerId === customerId;
        if (!isMatch) {
          console.warn("⚠️ [FOLLOWUP LOG] Skipping log not belonging to customer:", {
            logId: log.id,
            logCustomerId: log.customer,
            expectedCustomerId: customerId
          });
        }
        return isMatch;
      });
      
      console.log("✅ [FOLLOWUP LOG] Filtered logs:", filteredLogs.length, "of", logsData.length);
      setLogs(filteredLogs);
    } catch (err) {
      console.error("❌ [FOLLOWUP LOG] Error:", err);
      setError(err.message || "Terjadi kesalahan saat memuat data");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const customerName = customer?.nama || "";
  const customerId = customer?.id || "";

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: "900px", maxHeight: "90vh" }}>
        <div className="modal-header">
          <div>
            <h2>Log Follow Up — {customerName}</h2>
            <p className="modal-subtitle">Customer ID: {customerId}</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Tutup modal">
            <i className="pi pi-times" />
          </button>
        </div>

        <div className="modal-body" style={{ overflowY: "auto", maxHeight: "calc(90vh - 140px)" }}>
          {/* Summary */}
          <div className="followup-summary">
            <div className="summary-item">
              <span className="summary-icon">📊</span>
              <div>
                <p className="summary-label">Total Log</p>
                <p className="summary-value">{logs.length}</p>
              </div>
            </div>
            <div className="summary-item summary-success">
              <span className="summary-icon">✅</span>
              <div>
                <p className="summary-label">Terkirim</p>
                <p className="summary-value">
                  {logs.filter(l => l.status === "1" || l.status === 1).length}
                </p>
              </div>
            </div>
            <div className="summary-item summary-pending">
              <span className="summary-icon">⏳</span>
              <div>
                <p className="summary-label">Pending</p>
                <p className="summary-value">
                  {logs.filter(l => l.status === null || l.status === undefined).length}
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Memuat log follow up...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <span className="error-icon">⚠️</span>
              <p>{error}</p>
              <button type="button" className="btn-retry" onClick={fetchLogsFollup}>
                Coba Lagi
              </button>
            </div>
          ) : logs.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📭</span>
              <p>Belum ada log follow up untuk customer ini.</p>
            </div>
          ) : (
            <div className="followup-log-table">
              <div className="log-table-header">
                <span className="col-event">Event Follow Up</span>
                <span className="col-status">Status</span>
                <span className="col-keterangan">Keterangan</span>
                <span className="col-date">Tanggal</span>
              </div>
              <div className="log-table-body">
                {logs.map((log, index) => {
                  const statusBadge = getStatusBadge(log.status);
                  const eventName = log.follup_rel?.nama || `Follow Up ${log.follup || index + 1}`;
                  const eventPeriod = log.follup_rel?.event || "";
                  
                  return (
                    <div key={log.id || index} className="log-table-row">
                      <div className="col-event">
                        <span className="event-name">{eventName}</span>
                        {eventPeriod && <span className="event-period">{eventPeriod}</span>}
                      </div>
                      <div className="col-status">
                        <span className={`status-badge ${statusBadge.className}`}>
                          {statusBadge.label}
                        </span>
                      </div>
                      <div className="col-keterangan">
                        {log.keterangan || "-"}
                      </div>
                      <div className="col-date">
                        {formatDateTime(log.create_at || log.update_at)}
                      </div>
                    </div>
                  );
                })}
              </div>
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
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .modal-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
        }
        .modal-subtitle {
          margin: 4px 0 0 0;
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }
        .followup-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }
        .summary-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }
        .summary-item.summary-success {
          background: #f0fdf4;
          border-color: #bbf7d0;
        }
        .summary-item.summary-pending {
          background: #fefce8;
          border-color: #fef08a;
        }
        .summary-icon {
          font-size: 24px;
        }
        .summary-label {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }
        .summary-value {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .loading-state, .error-state, .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          text-align: center;
          gap: 12px;
        }
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e2e8f0;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .error-icon, .empty-icon {
          font-size: 48px;
        }
        .error-state p, .empty-state p {
          color: #64748b;
          margin: 0;
        }
        .btn-retry {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }
        .btn-retry:hover {
          background: #2563eb;
        }

        .followup-log-table {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
        }
        .log-table-header {
          display: grid;
          grid-template-columns: 1.5fr 100px 2fr 150px;
          gap: 12px;
          padding: 14px 16px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          font-weight: 600;
          font-size: 13px;
          color: #475569;
        }
        .log-table-body {
          max-height: 400px;
          overflow-y: auto;
        }
        .log-table-row {
          display: grid;
          grid-template-columns: 1.5fr 100px 2fr 150px;
          gap: 12px;
          padding: 14px 16px;
          border-bottom: 1px solid #f1f5f9;
          align-items: center;
          transition: background 0.15s;
        }
        .log-table-row:last-child {
          border-bottom: none;
        }
        .log-table-row:hover {
          background: #f8fafc;
        }
        .col-event {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .event-name {
          font-weight: 600;
          color: #1e293b;
          font-size: 14px;
        }
        .event-period {
          font-size: 12px;
          color: #64748b;
        }
        .col-keterangan {
          font-size: 13px;
          color: #475569;
        }
        .col-date {
          font-size: 12px;
          color: #64748b;
        }
        .status-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }
        .badge-success {
          background: #dcfce7;
          color: #166534;
        }
        .badge-danger {
          background: #fee2e2;
          color: #991b1b;
        }
        .badge-warning {
          background: #fef3c7;
          color: #92400e;
        }
        .badge-secondary {
          background: #f1f5f9;
          color: #475569;
        }

        @media (max-width: 768px) {
          .log-table-header {
            display: none;
          }
          .log-table-row {
            grid-template-columns: 1fr;
            gap: 8px;
            padding: 16px;
          }
          .col-event, .col-status, .col-keterangan, .col-date {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .col-event::before { content: "Event: "; font-weight: 600; color: #64748b; }
          .col-status::before { content: "Status: "; font-weight: 600; color: #64748b; }
          .col-keterangan::before { content: "Keterangan: "; font-weight: 600; color: #64748b; }
          .col-date::before { content: "Tanggal: "; font-weight: 600; color: #64748b; }
        }
      `}</style>
    </div>
  );
}

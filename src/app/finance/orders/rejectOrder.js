"use client";
import React, { useState } from "react";
import "@/styles/finance/pesanan.css";

export default function RejectOrder({ order, onClose, onReject }) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");

  const handleReject = async () => {
    // Fungsi akan diisi nanti
    if (!reason.trim()) {
      alert("Mohon isi alasan penolakan");
      return;
    }

    setLoading(true);
    try {
      // Placeholder - akan diisi fungsi reject nanti
      if (onReject) {
        await onReject(order, reason);
      }
      onClose();
    } catch (error) {
      console.error("Error rejecting order:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!order) return null;

  return (
    <div className="orders-modal-overlay">
      <div className="orders-modal-card">
        {/* Header */}
        <div className="orders-modal-header">
          <div>
            <p className="orders-modal-eyebrow">Konfirmasi</p>
            <h2>Tolak Pesanan</h2>
          </div>
          <button className="orders-modal-close" onClick={onClose} type="button" aria-label="Tutup">
            <i className="pi pi-times" />
          </button>
        </div>

        {/* Body */}
        <div className="orders-modal-body">
          <div className="orders-section">
            <p style={{ marginBottom: "1rem", color: "var(--dash-text)" }}>
              Apakah Anda yakin ingin menolak pesanan ini?
            </p>
            
            <div className="orders-row">
              <p>Customer</p>
              <span>{order.customer_rel?.nama || "-"}</span>
            </div>
            <div className="orders-row">
              <p>Produk</p>
              <span>{order.produk_rel?.nama || "-"}</span>
            </div>
            <div className="orders-row">
              <p>Total Harga</p>
              <span>Rp {Number(order.total_harga || 0).toLocaleString()}</span>
            </div>
            <div className="orders-row">
              <p>Status Pembayaran</p>
              <span>
                {order.status_pembayaran === 0 || order.status_pembayaran === null
                  ? "Unpaid"
                  : order.status_pembayaran === 1
                  ? "Menunggu"
                  : order.status_pembayaran === 2
                  ? "Paid"
                  : order.status_pembayaran === 3
                  ? "Ditolak"
                  : order.status_pembayaran === 4
                  ? "DP"
                  : "-"}
              </span>
            </div>

            <div className="orders-field" style={{ marginTop: "1rem" }}>
              <label htmlFor="reject-reason">Alasan Penolakan *</label>
              <textarea
                id="reject-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Masukkan alasan penolakan pesanan..."
                rows={4}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="orders-modal-footer">
          <button
            className="orders-btn orders-btn--ghost"
            onClick={onClose}
            type="button"
            disabled={loading}
          >
            Batal
          </button>
          <button
            className="orders-btn orders-btn--primary"
            onClick={handleReject}
            type="button"
            disabled={loading || !reason.trim()}
            style={{ background: "#ef4444", color: "#fff" }}
          >
            {loading ? (
              <>
                <i className="pi pi-spin pi-spinner" style={{ marginRight: "0.5rem" }} />
                Memproses...
              </>
            ) : (
              <>
                <i className="pi pi-times" style={{ marginRight: "0.5rem" }} />
                Tolak
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import "@/styles/sales/customer.css";
import "@/styles/sales/admin.css";
import "@/styles/sales/leads-modal.css";
import { toastSuccess, toastError } from "@/lib/toast";

const BASE_URL = "/api";

export default function SendWhatsAppModal({ lead, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    pesan: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Get customer info from lead
  const customer = lead?.customer_rel || {};
  const customerName = customer.nama || lead?.nama || "-";
  const customerPhone = customer.wa || lead?.wa || "";
  const customerEmail = customer.email || lead?.email || "-";
  const customerPendapatan = customer.pendapatan_bln || lead?.pendapatan || "-";

  useEffect(() => {
    if (lead) {
      // Reset form when lead changes
      setFormData({ pesan: "" });
    }
  }, [lead]);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.pesan || !formData.pesan.trim()) {
      toastError("Pesan WhatsApp wajib diisi");
      return;
    }

    if (!customerPhone) {
      toastError("Nomor WhatsApp customer tidak tersedia");
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${BASE_URL}/sales/leads/send-whatsapp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lead_id: lead?.id,
          customer_id: customer.id || lead?.customer_id,
          phone: customerPhone,
          message: formData.pesan.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal mengirim WhatsApp");
      }

      toastSuccess(data.message || "WhatsApp berhasil dikirim");
      setTimeout(() => {
        onSuccess(data.message || "WhatsApp berhasil dikirim");
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
      toastError("Gagal mengirim WhatsApp: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatPendapatan = (pendapatan) => {
    if (!pendapatan || pendapatan === "-" || pendapatan === 0) return "-";
    if (typeof pendapatan === "number") {
      return `Rp ${pendapatan.toLocaleString("id-ID")}`;
    }
    if (typeof pendapatan === "string") {
      const num = parseInt(pendapatan.replace(/[^\d]/g, ""));
      if (isNaN(num)) return "-";
      return `Rp ${num.toLocaleString("id-ID")}`;
    }
    return "-";
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card" style={{ width: "min(500px, 95vw)", maxHeight: "90vh" }}>
        {/* Header */}
        <div className="modal-header">
          <h2>Kirim WhatsApp</h2>
          <button className="modal-close" onClick={onClose} type="button" aria-label="Tutup modal">
            <i className="pi pi-times" />
          </button>
        </div>

        {/* Body */}
        <form className="modal-body modal-body--form" onSubmit={handleSubmit} style={{ overflowY: "auto" }}>
          {/* Customer Info */}
          <div className="leads-whatsapp-customer-info">
            <div className="leads-whatsapp-customer-name">{customerName}</div>
            <div className="leads-whatsapp-customer-detail">
              <div className="leads-whatsapp-detail-row">
                <span className="leads-whatsapp-detail-label">WhatsApp:</span>
                <span className="leads-whatsapp-detail-value">{customerPhone || "-"}</span>
              </div>
              <div className="leads-whatsapp-detail-row">
                <span className="leads-whatsapp-detail-label">Email:</span>
                <span className="leads-whatsapp-detail-value">{customerEmail}</span>
              </div>
              <div className="leads-whatsapp-detail-row">
                <span className="leads-whatsapp-detail-label">Pendapatan:</span>
                <span className="leads-whatsapp-detail-value">{formatPendapatan(customerPendapatan)}</span>
              </div>
            </div>
          </div>

          {/* Pesan WhatsApp */}
          <div className="form-group form-group--primary">
            <label>
              Pesan WhatsApp <span className="required">*</span>
            </label>
            <textarea
              placeholder="Tulis pesan yang akan dikirim ke customer..."
              value={formData.pesan}
              onChange={(e) => handleChange("pesan", e.target.value)}
              className="form-input"
              rows={6}
              required
            />
          </div>
        </form>

        {/* Footer */}
        <div className="modal-footer modal-footer--form">
          <button type="button" className="customers-button customers-button--secondary" onClick={onClose}>
            Batal
          </button>
          <button
            type="submit"
            className="customers-button customers-button--primary"
            onClick={handleSubmit}
            disabled={submitting || !customerPhone}
          >
            {submitting ? "Mengirim..." : "Kirim WhatsApp"}
          </button>
        </div>
      </div>
    </div>
  );
}


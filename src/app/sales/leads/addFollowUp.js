"use client";

import { useState, useEffect } from "react";
import { Dropdown } from "primereact/dropdown";
import "@/styles/sales/customer.css";
import "@/styles/sales/admin.css";
import "@/styles/sales/leads-modal.css";
import "primereact/resources/themes/lara-light-cyan/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { toastSuccess, toastError } from "@/lib/toast";

const BASE_URL = "/api";

// Channel options
const CHANNEL_OPTIONS = [
  { value: "", label: "Pilih Channel" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "telepon", label: "Telepon" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "lainnya", label: "Lainnya" },
];

// Type Aktivitas options
const TYPE_AKTIVITAS_OPTIONS = [
  { value: "", label: "Pilih Type" },
  { value: "whatsapp_out", label: "WhatsApp Out" },
  { value: "call_out", label: "Call Out" },
  { value: "send_price", label: "Send Price" },
  { value: "interested", label: "Interested" },
  { value: "thinking", label: "Thinking" },
  { value: "closed_won", label: "Closed Won" },
  { value: "closed_lost", label: "Closed Lost" },
];

export default function AddFollowUpModal({ lead, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    channel: "",
    type_aktivitas: "",
    keterangan: "",
  });

  const [submitting, setSubmitting] = useState(false);

  // Get customer info from lead
  const customer = lead?.customer_rel || {};
  const customerName = customer.nama || lead?.nama || "-";
  const customerPhone = customer.wa || lead?.wa || "";
  const customerEmail = customer.email || lead?.email || "-";

  useEffect(() => {
    if (lead) {
      // Reset form when lead changes
      setFormData({
        channel: "",
        type_aktivitas: "",
        keterangan: "",
      });
    }
  }, [lead]);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.channel) {
      toastError("Channel wajib dipilih");
      return;
    }

    if (!formData.type_aktivitas) {
      toastError("Type Aktivitas wajib dipilih");
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${BASE_URL}/sales/leads/follow-up`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lead_id: lead?.id,
          customer_id: customer.id || lead?.customer_id,
          channel: formData.channel,
          type_aktivitas: formData.type_aktivitas,
          keterangan: formData.keterangan || "",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal menambahkan follow up");
      }

      toastSuccess(data.message || "Follow up berhasil ditambahkan");
      setTimeout(() => {
        onSuccess(data.message || "Follow up berhasil ditambahkan");
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
      toastError("Gagal menambahkan follow up: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card" style={{ width: "min(500px, 95vw)", maxHeight: "90vh" }}>
        {/* Header */}
        <div className="modal-header">
          <h2>Input Follow Up</h2>
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
            </div>
          </div>

          {/* Channel Dropdown */}
          <div className="form-group form-group--primary">
            <label>
              Channel <span className="required">*</span>
            </label>
            <Dropdown
              value={formData.channel}
              options={CHANNEL_OPTIONS}
              onChange={(e) => handleChange("channel", e.value)}
              placeholder="Pilih Channel"
              className="w-full"
              style={{ width: "100%" }}
            />
          </div>

          {/* Type Aktivitas Dropdown */}
          <div className="form-group form-group--primary">
            <label>
              Type Aktivitas <span className="required">*</span>
            </label>
            <Dropdown
              value={formData.type_aktivitas}
              options={TYPE_AKTIVITAS_OPTIONS}
              onChange={(e) => handleChange("type_aktivitas", e.value)}
              placeholder="Pilih Type"
              className="w-full"
              style={{ width: "100%" }}
            />
          </div>

          {/* Keterangan (Optional) */}
          <div className="form-group form-group--secondary">
            <label>Keterangan</label>
            <textarea
              placeholder="Tambahkan keterangan (opsional)..."
              value={formData.keterangan}
              onChange={(e) => handleChange("keterangan", e.target.value)}
              className="form-input"
              rows={4}
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
            disabled={submitting}
          >
            {submitting ? "Menyimpan..." : "Simpan Follow Up"}
          </button>
        </div>
      </div>
    </div>
  );
}


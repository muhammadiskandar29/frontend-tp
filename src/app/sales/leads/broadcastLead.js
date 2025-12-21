"use client";

import { useState, useEffect } from "react";
import { Dropdown } from "primereact/dropdown";
import "@/styles/sales/customer.css";
import "@/styles/sales/admin.css";
import "primereact/resources/themes/lara-light-cyan/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { toastSuccess, toastError } from "@/lib/toast";

const BASE_URL = "/api";

// Label options
const LABEL_OPTIONS = [
  { value: "all", label: "Semua Label" },
  { value: "hot", label: "Hot" },
  { value: "warm", label: "Warm" },
  { value: "cold", label: "Cold" },
];

// Status options
const STATUS_OPTIONS = [
  { value: "all", label: "Semua Status" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
];

export default function BroadcastLeadModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    pesan: "",
    filter_label: "all",
    filter_status: "all",
    filter_assign_sales: "all",
  });

  const [salesList, setSalesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch sales list
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) return;

        // Fetch sales list (mock for now, adjust based on your API)
        // TODO: Replace with actual API call
        setSalesList([
          { value: "all", label: "Semua Sales" },
          { value: "sales1", label: "Sales 1" },
          { value: "sales2", label: "Sales 2" },
        ]);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.pesan || !formData.pesan.trim()) {
      toastError("Pesan WhatsApp wajib diisi");
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${BASE_URL}/sales/leads/broadcast`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal mengirim broadcast");
      }

      toastSuccess(data.message || "Broadcast berhasil dikirim");
      setTimeout(() => {
        onSuccess(data.message || "Broadcast berhasil dikirim");
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
      toastError("Gagal mengirim broadcast: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card" style={{ width: "min(600px, 95vw)", maxHeight: "90vh" }}>
        {/* Header */}
        <div className="modal-header">
          <h2>Broadcast Lead</h2>
          <button className="modal-close" onClick={onClose} type="button" aria-label="Tutup modal">
            <i className="pi pi-times" />
          </button>
        </div>

        {/* Body */}
        <form className="modal-body modal-body--form" onSubmit={handleSubmit} style={{ overflowY: "auto" }}>
          {/* Pesan WhatsApp */}
          <div className="form-group form-group--primary">
            <label>
              Pesan WhatsApp <span className="required">*</span>
            </label>
            <textarea
              placeholder="Masukkan pesan yang akan dikirim..."
              value={formData.pesan}
              onChange={(e) => handleChange("pesan", e.target.value)}
              className="form-input"
              rows={6}
            />
          </div>

          {/* Filter Label Lead */}
          <div className="form-group form-group--secondary">
            <label>Filter Label Lead</label>
            <Dropdown
              value={formData.filter_label}
              options={LABEL_OPTIONS}
              onChange={(e) => handleChange("filter_label", e.value)}
              className="w-full"
              style={{ width: "100%" }}
            />
          </div>

          {/* Filter Status Lead */}
          <div className="form-group form-group--secondary">
            <label>Filter Status Lead</label>
            <Dropdown
              value={formData.filter_status}
              options={STATUS_OPTIONS}
              onChange={(e) => handleChange("filter_status", e.value)}
              className="w-full"
              style={{ width: "100%" }}
            />
          </div>

          {/* Filter Assign Sales */}
          <div className="form-group form-group--secondary">
            <label>Filter Assign Sales</label>
            <Dropdown
              value={formData.filter_assign_sales}
              options={salesList}
              onChange={(e) => handleChange("filter_assign_sales", e.value)}
              className="w-full"
              style={{ width: "100%" }}
            />
          </div>

          {/* Info */}
          <div
            style={{
              padding: "0.875rem",
              background: "rgba(59, 130, 246, 0.1)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
              borderRadius: "0.5rem",
              marginTop: "1rem",
            }}
          >
            <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--dash-text)", lineHeight: 1.6 }}>
              <strong>Info:</strong> Broadcast akan mengirim pesan ke semua lead yang sesuai dengan filter, mengubah
              status menjadi CONTACTED, dan mencatat aktivitas serta follow up.
            </p>
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
            {submitting ? "Mengirim..." : "Kirim Broadcast"}
          </button>
        </div>
      </div>
    </div>
  );
}


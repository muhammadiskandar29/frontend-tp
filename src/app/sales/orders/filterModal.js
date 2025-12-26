"use client";

import { useState } from "react";
import { Calendar } from "primereact/calendar";

const STATUS_ORDER_OPTIONS = [
  { value: "1", label: "Proses" },
  { value: "2", label: "Sukses" },
  { value: "3", label: "Failed" },
  { value: "4", label: "Upselling" },
  { value: "N", label: "Dihapus" },
];

const STATUS_PEMBAYARAN_OPTIONS = [
  { value: "0", label: "Unpaid" },
  { value: "1", label: "Menunggu" },
  { value: "2", label: "Paid" },
  { value: "3", label: "Ditolak" },
  { value: "4", label: "DP" },
];

export default function FilterModal({ isOpen, onClose, filters, onApplyFilters }) {
  const [localFilters, setLocalFilters] = useState({
    statusOrder: filters?.statusOrder || [],
    statusPembayaran: filters?.statusPembayaran || [],
    sumber: filters?.sumber || [],
    tanggalRange: filters?.tanggalRange || null,
    waktuPembayaranRange: filters?.waktuPembayaranRange || null,
  });

  if (!isOpen) return null;

  const handleCheckboxChange = (category, value) => {
    setLocalFilters((prev) => {
      const current = prev[category] || [];
      const newValue = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [category]: newValue };
    });
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      statusOrder: [],
      statusPembayaran: [],
      sumber: [],
      tanggalRange: null,
      waktuPembayaranRange: null,
    };
    setLocalFilters(resetFilters);
    onApplyFilters(resetFilters);
    onClose();
  };

  const hasActiveFilters = 
    localFilters.statusOrder.length > 0 ||
    localFilters.statusPembayaran.length > 0 ||
    localFilters.sumber.length > 0 ||
    localFilters.tanggalRange !== null ||
    localFilters.waktuPembayaranRange !== null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card" style={{ width: "min(600px, 95vw)", maxHeight: "90vh" }}>
        <div className="modal-header">
          <h2>Filter Orders</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Tutup modal">
            <i className="pi pi-times" />
          </button>
        </div>

        <div className="modal-body" style={{ overflowY: "auto", maxHeight: "calc(90vh - 140px)" }}>
          {/* Status Order */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.75rem", fontWeight: 600, fontSize: "0.9rem", color: "#111827" }}>
              Status Order
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {STATUS_ORDER_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                    padding: "0.5rem",
                    borderRadius: "0.5rem",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <input
                    type="checkbox"
                    checked={localFilters.statusOrder.includes(option.value)}
                    onChange={() => handleCheckboxChange("statusOrder", option.value)}
                    style={{
                      width: "18px",
                      height: "18px",
                      cursor: "pointer",
                      accentColor: "#ff6c00",
                    }}
                  />
                  <span style={{ fontSize: "0.875rem", color: "#374151" }}>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Status Pembayaran */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.75rem", fontWeight: 600, fontSize: "0.9rem", color: "#111827" }}>
              Status Pembayaran
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {STATUS_PEMBAYARAN_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                    padding: "0.5rem",
                    borderRadius: "0.5rem",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <input
                    type="checkbox"
                    checked={localFilters.statusPembayaran.includes(option.value)}
                    onChange={() => handleCheckboxChange("statusPembayaran", option.value)}
                    style={{
                      width: "18px",
                      height: "18px",
                      cursor: "pointer",
                      accentColor: "#ff6c00",
                    }}
                  />
                  <span style={{ fontSize: "0.875rem", color: "#374151" }}>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sumber */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.75rem", fontWeight: 600, fontSize: "0.9rem", color: "#111827" }}>
              Sumber
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <label
                  key={num}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                    padding: "0.5rem",
                    borderRadius: "0.5rem",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <input
                    type="checkbox"
                    checked={localFilters.sumber.includes(String(num))}
                    onChange={() => handleCheckboxChange("sumber", String(num))}
                    style={{
                      width: "18px",
                      height: "18px",
                      cursor: "pointer",
                      accentColor: "#ff6c00",
                    }}
                  />
                  <span style={{ fontSize: "0.875rem", color: "#374151" }}>#{num}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tanggal Order */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.75rem", fontWeight: 600, fontSize: "0.9rem", color: "#111827" }}>
              Tanggal Order
            </label>
            <Calendar
              value={localFilters.tanggalRange}
              onChange={(e) => setLocalFilters((prev) => ({ ...prev, tanggalRange: e.value }))}
              selectionMode="range"
              readOnlyInput
              showIcon
              icon="pi pi-calendar"
              placeholder="Pilih range tanggal"
              dateFormat="dd M yyyy"
              monthNavigator
              yearNavigator
              yearRange="2020:2030"
              style={{ width: "100%" }}
              inputStyle={{
                width: "100%",
                padding: "0.55rem 2.2rem 0.55rem 0.75rem",
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem",
                fontSize: "0.85rem",
                background: "#fff",
                color: "#111827",
                cursor: "pointer",
              }}
            />
          </div>

          {/* Waktu Pembayaran */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.75rem", fontWeight: 600, fontSize: "0.9rem", color: "#111827" }}>
              Waktu Pembayaran
            </label>
            <Calendar
              value={localFilters.waktuPembayaranRange}
              onChange={(e) => setLocalFilters((prev) => ({ ...prev, waktuPembayaranRange: e.value }))}
              selectionMode="range"
              readOnlyInput
              showIcon
              icon="pi pi-calendar"
              placeholder="Pilih range waktu pembayaran"
              dateFormat="dd M yyyy"
              monthNavigator
              yearNavigator
              yearRange="2020:2030"
              style={{ width: "100%" }}
              inputStyle={{
                width: "100%",
                padding: "0.55rem 2.2rem 0.55rem 0.75rem",
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem",
                fontSize: "0.85rem",
                background: "#fff",
                color: "#111827",
                cursor: "pointer",
              }}
            />
          </div>
        </div>

        <div className="modal-footer" style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
          <button
            type="button"
            className="btn-cancel"
            onClick={handleReset}
            style={{ background: "#f3f4f6", color: "#374151" }}
          >
            Reset
          </button>
          <button
            type="button"
            className="btn-save"
            onClick={handleApply}
            style={{
              background: hasActiveFilters ? "#ff6c00" : "#9ca3af",
              color: "#fff",
              cursor: hasActiveFilters ? "pointer" : "not-allowed",
            }}
            disabled={!hasActiveFilters}
          >
            Terapkan Filter
          </button>
        </div>
      </div>
    </div>
  );
}


"use client";

import { useState, useEffect } from "react";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import "@/styles/sales/customer.css";
import "@/styles/sales/admin.css";
import "primereact/resources/themes/lara-light-cyan/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { toastSuccess, toastError } from "@/lib/toast";

const BASE_URL = "/api";

export default function AddLeadModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    customer_id: null,
    assign_sales: "",
    label: "",
    minat_produk: "",
    alasan_tertarik: "",
    alasan_belum_membeli: "",
    harapan_customer: "",
    last_contact: null,
    next_followup: null,
  });

  const [customers, setCustomers] = useState([]);
  const [salesList, setSalesList] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch customers and sales list
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) return;

        // Fetch customers
        const customersRes = await fetch(`${BASE_URL}/sales/customer`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (customersRes.ok) {
          const customersData = await customersRes.json();
          if (customersData.success && customersData.data) {
            setCustomers(customersData.data);
          }
        }

        // Fetch sales list (mock for now, adjust based on your API)
        // TODO: Replace with actual API call
        setSalesList([
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

  // Filter customers based on search
  const filteredCustomers = customers.filter((customer) => {
    if (!customerSearch) return true;
    const searchLower = customerSearch.toLowerCase();
    return (
      customer.nama?.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.wa?.toLowerCase().includes(searchLower)
    );
  });

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.customer_id) {
      toastError("Customer wajib dipilih");
      return;
    }

    if (!formData.label || !formData.label.trim()) {
      toastError("Label Lead wajib diisi");
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${BASE_URL}/sales/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal menambahkan lead");
      }

      toastSuccess(data.message || "Lead berhasil ditambahkan");
      setTimeout(() => {
        onSuccess(data.message || "Lead berhasil ditambahkan");
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
      toastError("Gagal menambahkan lead: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCustomer = customers.find((c) => c.id === formData.customer_id);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card" style={{ width: "min(600px, 95vw)", maxHeight: "90vh" }}>
        {/* Header */}
        <div className="modal-header">
          <h2>Tambah Lead Baru</h2>
          <button className="modal-close" onClick={onClose} type="button" aria-label="Tutup modal">
            <i className="pi pi-times" />
          </button>
        </div>

        {/* Body */}
        <form className="modal-body modal-body--form" onSubmit={handleSubmit} style={{ overflowY: "auto" }}>
          {/* Customer */}
          <div className="form-group form-group--primary">
            <label>
              Customer <span className="required">*</span>
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Cari customer..."
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setShowCustomerDropdown(true);
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                className="form-input"
                style={{ width: "100%" }}
              />
              {showCustomerDropdown && filteredCustomers.length > 0 && (
                <div
                  className="leads-customer-dropdown"
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    background: "white",
                    border: "1px solid var(--dash-border)",
                    borderRadius: "0.5rem",
                    boxShadow: "var(--shadow-lg)",
                    zIndex: 1000,
                    maxHeight: "200px",
                    overflowY: "auto",
                    marginTop: "0.25rem",
                  }}
                >
                  {filteredCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => {
                        handleChange("customer_id", customer.id);
                        setCustomerSearch(customer.nama || "");
                        setShowCustomerDropdown(false);
                      }}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        textAlign: "left",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        borderBottom: "1px solid var(--dash-border)",
                      }}
                      onMouseEnter={(e) => (e.target.style.background = "rgba(251, 133, 0, 0.08)")}
                      onMouseLeave={(e) => (e.target.style.background = "transparent")}
                    >
                      <div style={{ fontWeight: 600 }}>{customer.nama}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--dash-muted)" }}>
                        {customer.email} | {customer.wa}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedCustomer && (
              <small style={{ color: "var(--dash-muted)", marginTop: "0.25rem", display: "block" }}>
                Dipilih: {selectedCustomer.nama}
              </small>
            )}
          </div>

          {/* Assign Sales */}
          <div className="form-group form-group--primary">
            <label>Assign Sales</label>
            <Dropdown
              value={formData.assign_sales}
              options={salesList}
              onChange={(e) => handleChange("assign_sales", e.value)}
              placeholder="Pilih Sales"
              className="w-full"
              style={{ width: "100%" }}
            />
          </div>

          {/* Label Lead */}
          <div className="form-group form-group--primary">
            <label>
              Label Lead <span className="required">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Promo Akhir Tahun 2024"
              value={formData.label}
              onChange={(e) => handleChange("label", e.target.value)}
              className="form-input"
            />
          </div>

          {/* Minat Produk */}
          <div className="form-group form-group--secondary">
            <label>Minat Produk</label>
            <input
              type="text"
              placeholder="Produk yang diminati customer"
              value={formData.minat_produk}
              onChange={(e) => handleChange("minat_produk", e.target.value)}
              className="form-input"
            />
          </div>

          {/* Alasan Tertarik */}
          <div className="form-group form-group--secondary">
            <label>Alasan Tertarik</label>
            <textarea
              placeholder="Alasan customer tertarik..."
              value={formData.alasan_tertarik}
              onChange={(e) => handleChange("alasan_tertarik", e.target.value)}
              className="form-input"
              rows={3}
            />
          </div>

          {/* Alasan Belum Membeli */}
          <div className="form-group form-group--secondary">
            <label>Alasan Belum Membeli</label>
            <textarea
              placeholder="Alasan customer belum membeli..."
              value={formData.alasan_belum_membeli}
              onChange={(e) => handleChange("alasan_belum_membeli", e.target.value)}
              className="form-input"
              rows={3}
            />
          </div>

          {/* Harapan Customer */}
          <div className="form-group form-group--secondary">
            <label>Harapan Customer</label>
            <textarea
              placeholder="Harapan dari customer..."
              value={formData.harapan_customer}
              onChange={(e) => handleChange("harapan_customer", e.target.value)}
              className="form-input"
              rows={3}
            />
          </div>

          {/* Last Contact */}
          <div className="form-group form-group--secondary">
            <label>Last Contact</label>
            <Calendar
              value={formData.last_contact}
              onChange={(e) => handleChange("last_contact", e.value)}
              showTime
              hourFormat="24"
              dateFormat="dd/mm/yy"
              placeholder="dd/mm/yyyy --:--"
              className="w-full"
              style={{ width: "100%" }}
            />
          </div>

          {/* Next Follow Up */}
          <div className="form-group form-group--secondary">
            <label>Next Follow Up</label>
            <Calendar
              value={formData.next_followup}
              onChange={(e) => handleChange("next_followup", e.value)}
              showTime
              hourFormat="24"
              dateFormat="dd/mm/yy"
              placeholder="dd/mm/yyyy --:--"
              className="w-full"
              style={{ width: "100%" }}
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
            {submitting ? "Memproses..." : "Tambah Lead"}
          </button>
        </div>
      </div>
    </div>
  );
}


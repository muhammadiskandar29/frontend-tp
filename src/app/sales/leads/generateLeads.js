"use client";

import { useState, useEffect } from "react";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { MultiSelect } from "primereact/multiselect";
import "@/styles/sales/customer.css";
import "@/styles/sales/admin.css";
import "primereact/resources/themes/lara-light-cyan/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { toastSuccess, toastError } from "@/lib/toast";

const BASE_URL = "/api";

export default function GenerateLeadsModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    label: "",
    assign_sales: "",
    generate_all: true,
    filter_pendapatan_min: null,
    filter_produk: [],
  });

  const [salesList, setSalesList] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch sales and products
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) return;

        // Fetch sales list (mock for now, adjust based on your API)
        // TODO: Replace with actual API call
        setSalesList([
          { value: "sales1", label: "Sales 1" },
          { value: "sales2", label: "Sales 2" },
        ]);

        // Fetch products
        const productsRes = await fetch(`${BASE_URL}/sales/produk`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (productsRes.ok) {
          const productsData = await productsRes.json();
          if (productsData.success && productsData.data) {
            const productOptions = productsData.data.map((p) => ({
              value: p.id,
              label: p.nama || p.name,
            }));
            setProducts(productOptions);
          }
        }
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

    if (!formData.label || !formData.label.trim()) {
      toastError("Label Lead wajib diisi");
      return;
    }

    if (!formData.assign_sales) {
      toastError("Assign Sales wajib dipilih");
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${BASE_URL}/sales/leads/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal generate leads");
      }

      toastSuccess(data.message || "Leads berhasil di-generate");
      setTimeout(() => {
        onSuccess(data.message || "Leads berhasil di-generate");
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
      toastError("Gagal generate leads: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card" style={{ width: "min(600px, 95vw)", maxHeight: "90vh" }}>
        {/* Header */}
        <div className="modal-header">
          <h2>Generate Leads dari Customer</h2>
          <button className="modal-close" onClick={onClose} type="button" aria-label="Tutup modal">
            <i className="pi pi-times" />
          </button>
        </div>

        {/* Body */}
        <form className="modal-body modal-body--form" onSubmit={handleSubmit} style={{ overflowY: "auto" }}>
          <p style={{ color: "var(--dash-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
            Generate leads otomatis berdasarkan data customer. Customer yang sudah memiliki lead dengan label yang sama
            akan di-skip.
          </p>

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

          {/* Assign Sales */}
          <div className="form-group form-group--primary">
            <label>
              Assign Sales <span className="required">*</span>
            </label>
            <Dropdown
              value={formData.assign_sales}
              options={salesList}
              onChange={(e) => handleChange("assign_sales", e.value)}
              placeholder="Pilih Sales"
              className="w-full"
              style={{ width: "100%" }}
            />
          </div>

          {/* Generate dari Semua Customer */}
          <div className="form-group form-group--secondary">
            <label>
              <input
                type="checkbox"
                checked={formData.generate_all}
                onChange={(e) => handleChange("generate_all", e.target.checked)}
                style={{ marginRight: "0.5rem" }}
              />
              Generate dari Semua Customer
            </label>
          </div>

          {/* Filter Pendapatan Minimum */}
          <div className="form-group form-group--secondary">
            <label>Filter Pendapatan Minimum</label>
            <InputNumber
              value={formData.filter_pendapatan_min}
              onValueChange={(e) => handleChange("filter_pendapatan_min", e.value)}
              placeholder="Tidak ada filter"
              mode="currency"
              currency="IDR"
              locale="id-ID"
              className="w-full"
              style={{ width: "100%" }}
              useGrouping={true}
            />
            {!formData.filter_pendapatan_min && (
              <small style={{ color: "var(--dash-muted)", marginTop: "0.25rem", display: "block" }}>
                Tidak ada filter
              </small>
            )}
          </div>

          {/* Filter Produk yang Pernah Dibeli */}
          <div className="form-group form-group--secondary">
            <label>Filter Produk yang Pernah Dibeli</label>
            <MultiSelect
              value={formData.filter_produk}
              options={products}
              onChange={(e) => handleChange("filter_produk", e.value)}
              placeholder="Tidak ada filter"
              className="w-full"
              style={{ width: "100%" }}
              display="chip"
            />
            {(!formData.filter_produk || formData.filter_produk.length === 0) && (
              <small style={{ color: "var(--dash-muted)", marginTop: "0.25rem", display: "block" }}>
                Tidak ada filter
              </small>
            )}
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
            {submitting ? "Memproses..." : "Generate Leads"}
          </button>
        </div>
      </div>
    </div>
  );
}


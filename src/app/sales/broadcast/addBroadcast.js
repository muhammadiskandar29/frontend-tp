"use client";

import { useState, useEffect } from "react";
import { Calendar } from "primereact/calendar";
import "@/styles/sales/pesanan.css";
import "primereact/resources/themes/lara-light-cyan/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

// Status Order Options
const STATUS_ORDER_OPTIONS = [
  { value: "1", label: "Proses" },
  { value: "2", label: "Sukses" },
  { value: "3", label: "Failed" },
  { value: "4", label: "Upselling" },
];

// Status Pembayaran Options
const STATUS_PEMBAYARAN_OPTIONS = [
  { value: "0", label: "Unpaid" },
  { value: "1", label: "Menunggu" },
  { value: "2", label: "Paid" },
  { value: "3", label: "Ditolak" },
  { value: "4", label: "DP" },
];

export default function AddBroadcast({ onClose, onAdd }) {
  const [formData, setFormData] = useState({
    nama: "",
    pesan: "",
    langsung_kirim: true,
    tanggal_kirim: null,
    target: {
      produk: [],
      status_order: [],
      status_pembayaran: [],
    },
  });

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Token tidak ditemukan");
          setLoading(false);
          return;
        }

        const res = await fetch("/api/sales/produk", {
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
          // Filter hanya produk aktif (status === "1" atau status === 1)
          const activeProducts = Array.isArray(json.data)
            ? json.data.filter((p) => p.status === "1" || p.status === 1)
            : [];
          setProducts(activeProducts);
        } else {
          setError(json.message || "Gagal memuat daftar produk");
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Gagal memuat daftar produk");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRadioChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      langsung_kirim: value,
      tanggal_kirim: value ? null : new Date(),
    }));
  };

  const handleDateChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      tanggal_kirim: e.value,
    }));
  };

  // Toggle produk selection
  const toggleProduk = (productId) => {
    setFormData((prev) => {
      const currentProduk = prev.target.produk || [];
      const isSelected = currentProduk.includes(productId);
      return {
        ...prev,
        target: {
          ...prev.target,
          produk: isSelected
            ? currentProduk.filter((id) => id !== productId)
            : [...currentProduk, productId],
        },
      };
    });
  };

  // Toggle status order selection (single select - radio-like)
  const toggleStatusOrder = (status) => {
    setFormData((prev) => {
      const currentStatus = prev.target.status_order || [];
      const isSelected = currentStatus.includes(status);
      return {
        ...prev,
        target: {
          ...prev.target,
          // If clicking the same status, deselect it (allow none)
          // Otherwise, replace with new selection (single select)
          status_order: isSelected ? [] : [status],
        },
      };
    });
  };

  // Toggle status pembayaran selection (single select - radio-like)
  const toggleStatusPembayaran = (status) => {
    setFormData((prev) => {
      const currentStatus = prev.target.status_pembayaran || [];
      const isSelected = currentStatus.includes(status);
      return {
        ...prev,
        target: {
          ...prev.target,
          // If clicking the same status, deselect it (allow none)
          // Otherwise, replace with new selection (single select)
          status_pembayaran: isSelected ? [] : [status],
        },
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.nama.trim()) {
      setError("Nama broadcast wajib diisi");
      return;
    }
    if (!formData.pesan.trim()) {
      setError("Pesan broadcast wajib diisi");
      return;
    }
    if (!formData.langsung_kirim && !formData.tanggal_kirim) {
      setError("Tanggal kirim wajib diisi jika memilih 'Kirim Nanti'");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Token tidak ditemukan");
        return;
      }

      // Prepare request body
      const targetObj = {};
      
      // Produk: array of IDs (bisa lebih dari 1)
      if (formData.target.produk && formData.target.produk.length > 0) {
        targetObj.produk = formData.target.produk;
      }
      
      // Status Order: string (hanya satu nilai, ambil yang pertama jika ada)
      if (formData.target.status_order && formData.target.status_order.length > 0) {
        targetObj.status_order = formData.target.status_order[0];
      }
      
      // Status Pembayaran: string (hanya satu nilai, ambil yang pertama jika ada)
      if (formData.target.status_pembayaran && formData.target.status_pembayaran.length > 0) {
        targetObj.status_pembayaran = formData.target.status_pembayaran[0];
      }

      // Format tanggal_kirim: convert Date to ISO string or null
      let tanggalKirim = null;
      if (!formData.langsung_kirim && formData.tanggal_kirim) {
        if (formData.tanggal_kirim instanceof Date) {
          // Convert to ISO string format
          tanggalKirim = formData.tanggal_kirim.toISOString();
        } else {
          tanggalKirim = formData.tanggal_kirim;
        }
      }

      const requestBody = {
        nama: formData.nama.trim(),
        pesan: formData.pesan.trim(),
        langsung_kirim: formData.langsung_kirim,
        tanggal_kirim: tanggalKirim,
        target: targetObj,
      };

      console.log("📤 [BROADCAST] Submitting:", requestBody);

      const res = await fetch("/api/sales/broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal membuat broadcast");
      }

      console.log("✅ [BROADCAST] Success:", json);
      if (onAdd) onAdd(json.data);
      onClose();
    } catch (err) {
      console.error("❌ [BROADCAST] Error:", err);
      setError(err.message || "Terjadi kesalahan saat membuat broadcast");
    } finally {
      setSubmitting(false);
    }
  };

  const getSelectedProductName = (productId) => {
    const product = products.find((p) => p.id === productId);
    return product ? product.nama : `Produk #${productId}`;
  };

  const getStatusOrderLabel = (value) => {
    const option = STATUS_ORDER_OPTIONS.find((opt) => opt.value === value);
    return option ? option.label : value;
  };

  const getStatusPembayaranLabel = (value) => {
    const option = STATUS_PEMBAYARAN_OPTIONS.find((opt) => opt.value === value);
    return option ? option.label : value;
  };

  return (
    <div className="orders-modal-overlay" onClick={onClose}>
      <div className="orders-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "800px", maxHeight: "90vh" }}>
        <div className="orders-modal-header">
          <h2>Tambah Broadcast</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Tutup modal">
            <i className="pi pi-times" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="orders-modal-body" style={{ overflowY: "auto", flex: 1 }}>
          {error && (
            <div className="dashboard-alert" style={{ marginBottom: "1rem" }}>
              {error}
            </div>
          )}

          {/* Nama Broadcast */}
          <label className="orders-field">
            Nama Broadcast *
            <input
              type="text"
              name="nama"
              value={formData.nama}
              onChange={handleChange}
              placeholder="Contoh: Promo Bulan Desember"
              required
            />
          </label>

          {/* Pesan Broadcast */}
          <label className="orders-field">
            Pesan Broadcast *
            <textarea
              name="pesan"
              value={formData.pesan}
              onChange={handleChange}
              rows={4}
              placeholder="Tulis pesan yang akan dikirim ke customer..."
              required
            />
          </label>

          {/* Radio: Kirim Sekarang / Kirim Nanti */}
          <div className="orders-field">
            <label style={{ display: "block", marginBottom: "0.75rem", fontWeight: 600 }}>
              Waktu Pengiriman *
            </label>
            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="langsung_kirim"
                  checked={formData.langsung_kirim === true}
                  onChange={() => handleRadioChange(true)}
                />
                <span>Kirim Sekarang</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="langsung_kirim"
                  checked={formData.langsung_kirim === false}
                  onChange={() => handleRadioChange(false)}
                />
                <span>Kirim Nanti</span>
              </label>
            </div>
          </div>

          {/* Date & Time Picker (muncul jika Kirim Nanti) */}
          {!formData.langsung_kirim && (
            <label className="orders-field">
              Tanggal & Waktu Kirim *
              <Calendar
                value={formData.tanggal_kirim}
                onChange={handleDateChange}
                showTime
                hourFormat="24"
                dateFormat="dd/mm/yy"
                placeholder="Pilih tanggal dan waktu"
                style={{ width: "100%" }}
                required
              />
            </label>
          )}

          {/* Filter Produk */}
          <div className="orders-field">
            <label style={{ display: "block", marginBottom: "0.75rem", fontWeight: 600 }}>
              Target Produk
              <small style={{ fontWeight: 400, color: "#6b7280", marginLeft: "0.5rem" }}>
                (Pilih satu atau lebih produk, kosongkan untuk semua produk)
              </small>
            </label>
            {loading ? (
              <div style={{ padding: "1rem", textAlign: "center", color: "#6b7280" }}>
                Memuat produk...
              </div>
            ) : products.length === 0 ? (
              <div style={{ padding: "1rem", textAlign: "center", color: "#6b7280" }}>
                Tidak ada produk tersedia
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
                {products.map((product) => {
                  const isSelected = formData.target.produk.includes(product.id);
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => toggleProduk(product.id)}
                      style={{
                        padding: "0.5rem 1rem",
                        borderRadius: "999px",
                        border: `2px solid ${isSelected ? "#f1a124" : "#e5e7eb"}`,
                        background: isSelected ? "#fef3e2" : "#fff",
                        color: isSelected ? "#f1a124" : "#374151",
                        fontWeight: isSelected ? 600 : 400,
                        cursor: "pointer",
                        transition: "all 0.2s",
                        fontSize: "0.875rem",
                      }}
                    >
                      {product.nama}
                    </button>
                  );
                })}
              </div>
            )}
            {formData.target.produk.length > 0 && (
              <div style={{ marginTop: "0.5rem", padding: "0.75rem", background: "#f9fafb", borderRadius: "8px" }}>
                <strong style={{ fontSize: "0.875rem", color: "#374151" }}>Produk Terpilih:</strong>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
                  {formData.target.produk.map((productId) => (
                    <span
                      key={productId}
                      style={{
                        padding: "0.25rem 0.75rem",
                        background: "#f1a124",
                        color: "#fff",
                        borderRadius: "999px",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                      }}
                    >
                      {getSelectedProductName(productId)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Filter Status Order */}
          <div className="orders-field">
            <label style={{ display: "block", marginBottom: "0.75rem", fontWeight: 600 }}>
              Status Order
              <small style={{ fontWeight: 400, color: "#6b7280", marginLeft: "0.5rem" }}>
                (Pilih status, kosongkan untuk semua status)
              </small>
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {STATUS_ORDER_OPTIONS.map((option) => {
                const isSelected = formData.target.status_order.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleStatusOrder(option.value)}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "999px",
                      border: `2px solid ${isSelected ? "#f1a124" : "#e5e7eb"}`,
                      background: isSelected ? "#fef3e2" : "#fff",
                      color: isSelected ? "#f1a124" : "#374151",
                      fontWeight: isSelected ? 600 : 400,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      fontSize: "0.875rem",
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            {formData.target.status_order.length > 0 && (
              <div style={{ marginTop: "0.5rem", padding: "0.75rem", background: "#f9fafb", borderRadius: "8px" }}>
                <strong style={{ fontSize: "0.875rem", color: "#374151" }}>Status Terpilih:</strong>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
                  {formData.target.status_order.map((status) => (
                    <span
                      key={status}
                      style={{
                        padding: "0.25rem 0.75rem",
                        background: "#f1a124",
                        color: "#fff",
                        borderRadius: "999px",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                      }}
                    >
                      {getStatusOrderLabel(status)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Filter Status Pembayaran */}
          <div className="orders-field">
            <label style={{ display: "block", marginBottom: "0.75rem", fontWeight: 600 }}>
              Status Pembayaran
              <small style={{ fontWeight: 400, color: "#6b7280", marginLeft: "0.5rem" }}>
                (Pilih status, kosongkan untuk semua status)
              </small>
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {STATUS_PEMBAYARAN_OPTIONS.map((option) => {
                const isSelected = formData.target.status_pembayaran.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleStatusPembayaran(option.value)}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "999px",
                      border: `2px solid ${isSelected ? "#f1a124" : "#e5e7eb"}`,
                      background: isSelected ? "#fef3e2" : "#fff",
                      color: isSelected ? "#f1a124" : "#374151",
                      fontWeight: isSelected ? 600 : 400,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      fontSize: "0.875rem",
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            {formData.target.status_pembayaran.length > 0 && (
              <div style={{ marginTop: "0.5rem", padding: "0.75rem", background: "#f9fafb", borderRadius: "8px" }}>
                <strong style={{ fontSize: "0.875rem", color: "#374151" }}>Status Terpilih:</strong>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
                  {formData.target.status_pembayaran.map((status) => (
                    <span
                      key={status}
                      style={{
                        padding: "0.25rem 0.75rem",
                        background: "#f1a124",
                        color: "#fff",
                        borderRadius: "999px",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                      }}
                    >
                      {getStatusPembayaranLabel(status)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </form>

        <div className="orders-modal-footer">
          <button type="button" className="orders-button orders-button--ghost" onClick={onClose} disabled={submitting}>
            Batal
          </button>
          <button type="submit" className="orders-button orders-button--primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Menyimpan..." : "Simpan Broadcast"}
          </button>
        </div>
      </div>
    </div>
  );
}

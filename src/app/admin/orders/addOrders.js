"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import useOrders from "@/hooks/useOrders";
import { api } from "@/lib/api"; // ✅ supaya handleSearchCustomer & handleSearchProduct ikut pakai api()

export default function AddOrders({ onClose, onAdd, setToast }) {
  const [formData, setFormData] = useState({
    nama: "",
    wa: "",
    email: "",
    alamat: "",
    customer: "",
    produk: "",
    harga: "",
    ongkir: "",
    total_harga: 0,
    sumber: "",
    notif: true,
  });

  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [customerResults, setCustomerResults] = useState([]);
  const [productResults, setProductResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { createOrder } = useOrders();

  // === 🔍 Search Customer pakai api() ===
  const handleSearchCustomer = async (keyword) => {
    setCustomerSearch(keyword);
    if (!keyword.trim()) return setCustomerResults([]);

    const res = await api("/admin/customer", { method: "GET" });
    if (res?.success && Array.isArray(res.data)) {
      const filtered = res.data.filter((cust) =>
        cust.nama?.toLowerCase().split(" ").some((w) => w.startsWith(keyword.toLowerCase())) ||
        cust.wa?.toLowerCase().startsWith(keyword.toLowerCase())
      );
      setCustomerResults(filtered);
    } else {
      setCustomerResults([]);
    }
  };

  // === 🔍 Search Produk pakai api() ===
  const handleSearchProduct = async (keyword) => {
    setProductSearch(keyword);
    if (!keyword.trim()) return setProductResults([]);

    const res = await api("/admin/produk", { method: "GET" });
    if (res?.success && Array.isArray(res.data)) {
      const filtered = res.data.filter((prod) =>
        prod.nama?.toLowerCase().split(" ").some((w) => w.startsWith(keyword.toLowerCase()))
      );
      setProductResults(filtered);
    } else {
      setProductResults([]);
    }
  };

  useEffect(() => {
    if (customerSearch.trim().length >= 2) handleSearchCustomer(customerSearch);
  }, [customerSearch]);

  useEffect(() => {
    if (productSearch.trim().length >= 2) handleSearchProduct(productSearch);
  }, [productSearch]);

  // === 🧍 Pilih Customer ===
  const handleSelectCustomer = (cust) => {
    setFormData((prev) => ({
      ...prev,
      customer: cust.id,
      nama: cust.nama || "",
      wa: cust.wa || "",
      email: cust.email || "",
      alamat: cust.alamat || "",
    }));
    setCustomerSearch(`${cust.nama} | ${cust.wa}`);
    setCustomerResults([]);
    setShowCustomerForm(false);
  };

  // === 📦 Pilih Produk ===
  const handleSelectProduct = (prod) => {
    setFormData((prev) => ({
      ...prev,
      produk: prod.id,
      harga: Number(prod.harga) || 0,
      total_harga: Number(prod.harga || 0) + Number(prev.ongkir || 0),
    }));
    setProductSearch(prod.nama);
    setProductResults([]);
  };

  // === ✏️ Handle Change ===
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "harga" || name === "ongkir") {
      const harga = name === "harga" ? Number(value) : Number(formData.harga);
      const ongkir = name === "ongkir" ? Number(value) : Number(formData.ongkir);
      setFormData({
        ...formData,
        [name]: Number(value) || 0,
        total_harga: harga + ongkir,
      });
    } else if (type === "checkbox") {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value || "" });
    }
  };

  // === 💾 Submit ===
  // === 💾 Submit ===
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setMessage("");

  // 🧩 ubah angka ke string hanya saat kirim ke backend
  const payload = {
    ...formData,
    harga: String(formData.harga ?? "0"),
    ongkir: String(formData.ongkir ?? "0"),
    total_harga: String(formData.total_harga ?? "0"),
  };

  const res = await createOrder(payload);

  // Handle success (termasuk jika ada warning tapi data berhasil masuk)
  if (res?.success || (res?.warning && res?.data)) {
    onAdd?.(res.data);
    setToast?.({
      show: true,
      type: "success",
      message: res.warning 
        ? `✅ Order berhasil dibuat! (${res.warning})`
        : res.message || "✅ Order berhasil dibuat!",
    });
    setTimeout(() => {
      setToast?.((prev) => ({ ...prev, show: false }));
      onClose();
    }, 1500);
  } else {
    setToast?.({
      show: true,
      type: "error",
      message: res?.message || "❌ Gagal membuat order.",
    });
  }

  setLoading(false);
};

  // Render modal menggunakan Portal langsung ke document.body untuk menghindari stacking context issues
  const modalContent = (
    <div 
      className="update-modal-overlay add-order-modal-overlay"
      onClick={(e) => {
        // Close modal when clicking on overlay (not on modal content)
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="update-modal-card add-order-modal-card" 
        style={{ width: "100%", maxWidth: 650 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="update-modal-header">
          <h2>Tambah Order</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="update-modal-body">
          {/* ==== CUSTOMER ==== */}
          <div className="update-section">
            <h4>Informasi Customer</h4>

            <label>
              Cari Customer (Nama / WA)
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setShowCustomerForm(false);
                }}
                placeholder="Ketik minimal 2 huruf..."
              />
            </label>

            {customerResults.length > 0 && (
              <div style={{ border: "1px solid #ccc", borderRadius: 6, marginTop: 4 }}>
                {customerResults.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCustomer(c)}
                    style={{
                      padding: "6px 10px",
                      cursor: "pointer",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    {c.nama} | {c.wa}
                  </div>
                ))}
              </div>
            )}

            {customerResults.length === 0 && customerSearch && !showCustomerForm && (
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    nama: "",
                    wa: "",
                    email: "",
                    alamat: "",
                    customer: "",
                  }));
                  setShowCustomerForm(true);
                }}
                style={{
                  marginTop: 8,
                  color: "#2563eb",
                  fontSize: 14,
                  cursor: "pointer",
                  background: "none",
                  border: "none",
                  textAlign: "left",
                }}
              >
                + Tambah Customer Baru
              </button>
            )}

            {showCustomerForm && (
              <div
                style={{
                  marginTop: 10,
                  padding: 12,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  background: "#fafafa",
                }}
              >
                <h5 style={{ marginBottom: 8 }}>Tambah Customer Baru</h5>
                <label>
                  Nama
                  <input type="text" name="nama" value={formData.nama} onChange={handleChange} />
                </label>
                <label>
                  Nomor WA
                  <input type="text" name="wa" value={formData.wa} onChange={handleChange} />
                </label>
                <label>
                  Email
                  <input type="email" name="email" value={formData.email} onChange={handleChange} />
                </label>
                <label>
                  Alamat
                  <textarea name="alamat" rows="2" value={formData.alamat} onChange={handleChange} />
                </label>
              </div>
            )}
          </div>

          {/* ==== PRODUK ==== */}
          <div className="update-section">
            <h4>Detail Order</h4>

            <label>
              Cari Produk
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Ketik minimal 2 huruf..."
              />
            </label>

            {productResults.length > 0 && (
              <div style={{ border: "1px solid #ccc", borderRadius: 6, marginTop: 4 }}>
                {productResults.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProduct(p)}
                    style={{
                      padding: "6px 10px",
                      cursor: "pointer",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    {p.nama} (Rp{p.harga})
                  </div>
                ))}
              </div>
            )}

            <label>
              Harga Produk
              <input type="number" name="harga" value={formData.harga ?? ""} onChange={handleChange} />
            </label>

            <label>
              Ongkir
              <input type="number" name="ongkir" value={formData.ongkir ?? ""} onChange={handleChange} />
            </label>

            <label>
              Total Harga
              <input type="number" name="total_harga" value={formData.total_harga ?? ""} readOnly />
            </label>

            <label>
              Sumber Order
              <input
                type="text"
                name="sumber"
                value={formData.sumber}
                onChange={handleChange}
                placeholder="Instagram, Website, dll"
              />
            </label>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <input type="checkbox" name="notif" id="notif" checked={formData.notif} onChange={handleChange} />
              <label htmlFor="notif" style={{ fontSize: 14 }}>Kirim notifikasi WhatsApp ke customer</label>
            </div>
          </div>

          {message && (
            <p
              style={{
                marginTop: 8,
                fontSize: 14,
                textAlign: "center",
                color: message.startsWith("✅") ? "green" : "red",
              }}
            >
              {message}
            </p>
          )}

          <div className="update-modal-footer">
            <button type="button" onClick={onClose} className="btn-cancel" disabled={loading}>
              Batal
            </button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Render menggunakan Portal ke document.body untuk memastikan modal selalu di atas
  if (typeof window !== "undefined") {
    return createPortal(modalContent, document.body);
  }
  
  return null;
}

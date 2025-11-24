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

  const modalContent = (
    <div
      className="orders-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="orders-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="orders-modal-header">
          <div>
            <p className="orders-modal-eyebrow">Kelola Pesanan</p>
            <h2>Tambah Order</h2>
          </div>
          <button type="button" className="orders-modal-close" onClick={onClose} aria-label="Tutup modal">
            <i className="pi pi-times" />
          </button>
        </div>

        <div className="orders-modal-body">
          <form onSubmit={handleSubmit} className="orders-form-grid">
            <div className="orders-section">
              <h4>Informasi Customer</h4>

              <label className="orders-field">
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
                <div className="orders-suggestion">
                  {customerResults.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="orders-suggestion-item"
                      onClick={() => handleSelectCustomer(c)}
                    >
                      <strong>{c.nama}</strong>
                      <span>{c.wa}</span>
                    </button>
                  ))}
                </div>
              )}

              <label className="orders-field">
                Nama
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  placeholder="Nama customer"
                />
              </label>

              <div className="orders-dual-grid">
                <label className="orders-field">
                  WA (gunakan 62)
                  <input type="text" name="wa" value={formData.wa} onChange={handleChange} />
                </label>
                <label className="orders-field">
                  Email
                  <input type="email" name="email" value={formData.email} onChange={handleChange} />
                </label>
              </div>

              <label className="orders-field">
                Alamat
                <textarea
                  name="alamat"
                  rows={2}
                  value={formData.alamat}
                  onChange={handleChange}
                  placeholder="Alamat lengkap customer"
                />
              </label>

              {!customerResults.length && !formData.nama && (
                <label className="orders-checkbox">
                  <input
                    type="checkbox"
                    checked={showCustomerForm}
                    onChange={() => setShowCustomerForm((prev) => !prev)}
                  />
                  Input customer tanpa data otomatis (manual)
                </label>
              )}
            </div>

            <div className="orders-section">
              <h4>Detail Order</h4>

              <label className="orders-field">
                Cari Produk
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Ketik minimal 2 huruf..."
                />
              </label>

              {productResults.length > 0 && (
                <div className="orders-suggestion">
                  {productResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="orders-suggestion-item"
                      onClick={() => handleSelectProduct(p)}
                    >
                      <strong>{p.nama}</strong>
                      <span>Rp {Number(p.harga).toLocaleString("id-ID")}</span>
                    </button>
                  ))}
                </div>
              )}

              <label className="orders-field">
                Produk (ID)
                <input
                  type="text"
                  name="produk"
                  value={formData.produk}
                  onChange={handleChange}
                  placeholder="ID produk"
                  readOnly
                />
              </label>

              <div className="orders-dual-grid">
                <label className="orders-field">
                  Harga Produk
                  <input
                    type="number"
                    name="harga"
                    value={formData.harga ?? ""}
                    onChange={handleChange}
                    min={0}
                    required
                  />
                </label>
                <label className="orders-field">
                  Ongkir
                  <input
                    type="number"
                    name="ongkir"
                    value={formData.ongkir ?? ""}
                    onChange={handleChange}
                    min={0}
                  />
                </label>
              </div>

              <label className="orders-field">
                Total Harga
                <input type="number" name="total_harga" value={formData.total_harga ?? ""} readOnly />
              </label>

              <label className="orders-field">
                Sumber Order
                <select name="sumber" value={formData.sumber} onChange={handleChange}>
                  <option value="">Pilih sumber</option>
                  <option value="website">Website</option>
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="sales">Sales</option>
                  <option value="event">Event</option>
                </select>
              </label>

              <label className="orders-checkbox">
                <input
                  type="checkbox"
                  name="notif"
                  checked={formData.notif}
                  onChange={handleChange}
                />
                Kirim notifikasi WhatsApp ke customer
              </label>
            </div>

            {message && <p className="orders-error">{message}</p>}

            <div className="orders-modal-footer">
              <button type="button" className="orders-btn orders-btn--ghost" onClick={onClose} disabled={loading}>
                Batal
              </button>
              <button type="submit" className="orders-btn orders-btn--primary" disabled={loading}>
                {loading ? "Menyimpan..." : "Simpan Order"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  if (typeof window !== "undefined") {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}

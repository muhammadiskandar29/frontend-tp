"use client";

import { useState, useEffect } from "react";
import useOrders from "@/hooks/sales/useOrders";
import { api } from "@/lib/api"; // supaya handleSearchCustomer & handleSearchProduct ikut pakai api()
import "@/styles/sales/orders.css";
import "@/styles/sales/pesanan.css";

export default function AddOrders({ onClose, onAdd }) {
  const [formData, setFormData] = useState({
    nama: "",
    wa: "",
    email: "",
    alamat: "",
    customer: "",
    produk: "",
    harga: "",
    ongkir: "",
    total_harga: "",
    sumber: "",
    notif: true,
    status_pembayaran: null, // null/0 untuk Full, 4 untuk Bertahap
  });

  const [showCustomerForm, setShowCustomerForm] = useState(true);
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [customerResults, setCustomerResults] = useState([]);
  const [productResults, setProductResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { createOrder } = useOrders();

  // === Search Customer pakai api() ===
  const handleSearchCustomer = async (keyword) => {
    setCustomerSearch(keyword);
    if (!keyword.trim()) return setCustomerResults([]);

    const res = await api("/sales/customer", { method: "GET" });
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

  // === Search Produk pakai api() ===
  const handleSearchProduct = async (keyword) => {
    setProductSearch(keyword);
    if (!keyword.trim()) return setProductResults([]);

    const res = await api("/sales/produk", { method: "GET" });
    if (res?.success && Array.isArray(res.data)) {
      const filtered = res.data.filter((prod) =>
        // Filter hanya produk AKTIF (status === "1" atau status === 1)
        (prod.status === "1" || prod.status === 1) &&
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

  const resetCustomerSelection = () => {
    setFormData((prev) => ({
      ...prev,
      customer: "",
      nama: "",
      wa: "",
      email: "",
      alamat: "",
    }));
    setCustomerSearch("");
    setCustomerResults([]);
    setShowCustomerForm(true);
  };

  // === Format currency helper ===
  const formatCurrency = (value) => {
    if (!value && value !== 0) return "";
    const numValue = typeof value === "string" ? value.replace(/,/g, "") : value;
    const num = Number(numValue);
    if (isNaN(num)) return "";
    return num.toLocaleString("id-ID");
  };

  // === Parse currency to number ===
  const parseCurrency = (value) => {
    if (!value && value !== 0) return 0;
    if (value === "" || value === null || value === undefined) return 0;
    // Remove all non-numeric characters (commas, spaces, etc)
    const numValue = typeof value === "string" ? value.replace(/\D/g, "") : String(value).replace(/\D/g, "");
    if (!numValue || numValue === "") return 0;
    const num = Number(numValue);
    return isNaN(num) ? 0 : num;
  };

  // === Pilih Produk ===
  const handleSelectProduct = (prod) => {
    const hargaValue = Number(prod.harga) || 0;
    const ongkirValue = parseCurrency(formData.ongkir || "");
    setFormData((prev) => ({
      ...prev,
      produk: prod.id,
      harga: hargaValue ? formatCurrency(hargaValue) : "",
      total_harga: (hargaValue + ongkirValue) > 0 ? formatCurrency(hargaValue + ongkirValue) : "",
    }));
    setProductSearch(prod.nama);
    setProductResults([]);
  };

  // === Handle Change ===
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "harga" || name === "ongkir") {
      // Remove all non-numeric characters (including commas)
      const numericValue = value.replace(/\D/g, "");
      
      // Format with thousand separator if has value
      const formattedValue = numericValue ? formatCurrency(numericValue) : "";
      
      // Calculate total - parse both values correctly
      // For the field being edited, use the numericValue directly (already cleaned)
      // For the other field, parse from formData (which may have commas)
      let hargaNum = 0;
      let ongkirNum = 0;
      
      if (name === "harga") {
        hargaNum = numericValue ? Number(numericValue) : 0;
        // Parse ongkir from formData (remove commas and convert to number)
        ongkirNum = parseCurrency(formData.ongkir || "");
      } else {
        // Parse harga from formData (remove commas and convert to number)
        hargaNum = parseCurrency(formData.harga || "");
        ongkirNum = numericValue ? Number(numericValue) : 0;
      }
      
      const total = hargaNum + ongkirNum;
      
      setFormData({
        ...formData,
        [name]: formattedValue,
        total_harga: total > 0 ? formatCurrency(total) : "",
      });
    } else if (type === "checkbox") {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value || "" });
    }
  };

  // === 💾 Submit ===
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Validasi alamat (required untuk order)
    if (!formData.alamat?.trim()) {
      setMessage("Alamat pengiriman wajib diisi untuk order");
      setLoading(false);
      return;
    }

    const payload = {
      ...formData,
      harga: String(parseCurrency(formData.harga) || "0"),
      ongkir: String(parseCurrency(formData.ongkir) || "0"),
      total_harga: String(parseCurrency(formData.total_harga) || "0"),
      // Tambahkan status_pembayaran: null/0 untuk Full, 4 untuk Bertahap
      status_pembayaran: formData.status_pembayaran === 4 ? 4 : (formData.status_pembayaran === null ? null : 0),
    };

    console.log("[ADD_ORDERS] Payload sebelum kirim:", JSON.stringify(payload, null, 2));

    const res = await createOrder(payload);

    if (res?.success) {
      // Sukses tanpa warning
      setMessage(res?.message || "Order berhasil dibuat!");
      onAdd?.(res.data);
      onClose?.();
    } else if (res?.warning && res?.data) {
      // Sukses dengan warning (tetap lanjut, tapi beri tahu)
      console.warn("Order warning:", res.warning);
      setMessage("Order berhasil dibuat!");
      onAdd?.(res.data);
      onClose?.();
    } else {
      setMessage(res?.message || "Gagal membuat order.");
    }

    setLoading(false);
  };

  const customerId = formData.customer;
  const hasSelectedCustomer = Boolean(customerId);
  const isSearchActive = customerSearch.trim().length >= 2;
  const noCustomerFound = isSearchActive && customerResults.length === 0;
  const displayCustomerForm = showCustomerForm || !hasSelectedCustomer || noCustomerFound;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-card"
        style={{
          width: "min(920px, 95vw)",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Tambah Order</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Tutup modal">
            <i className="pi pi-times" />
          </button>
        </div>

        <div
          className="modal-body orders-modal-scroll"
          style={{ paddingBottom: "1.75rem", overflowY: "auto", flex: 1 }}
        >
          <form onSubmit={handleSubmit} className="orders-form-grid">
            <div className="orders-columns">
              <section className="orders-section orders-section--customer">
                <div className="orders-panel-header">
                  <div>
                    <h4>Data Customer</h4>
                    <p>Temukan customer atau tambah data baru.</p>
                  </div>
                  {hasSelectedCustomer && (
                    <button
                      type="button"
                      className="orders-link-btn"
                      onClick={resetCustomerSelection}
                    >
                      Ganti Customer
                    </button>
                  )}
                </div>

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

                {noCustomerFound && (
                  <div className="orders-empty-state">
                    Customer tidak ditemukan. Isi formulir di bawah untuk menambah data baru.
                  </div>
                )}

                {hasSelectedCustomer && (
                  <div className="customer-selected-card">
                    <div>
                      <span>Customer Terpilih</span>
                      <strong>{formData.nama || "-"}</strong>
                    </div>
                    <ul>
                      <li>WA: {formData.wa || "-"}</li>
                      <li>Email: {formData.email || "-"}</li>
                      <li>Alamat: {formData.alamat || "-"}</li>
                    </ul>
                    <button
                      type="button"
                      className="orders-link-btn"
                      onClick={() => setShowCustomerForm(true)}
                    >
                      Ubah Data Customer
                    </button>
                  </div>
                )}

                {/* Field alamat selalu ditampilkan (required untuk order) */}
                {hasSelectedCustomer && (
                  <label className="orders-field" style={{ marginTop: "12px" }}>
                    Alamat Pengiriman *
                    <textarea
                      name="alamat"
                      rows={2}
                      value={formData.alamat}
                      onChange={handleChange}
                      placeholder="Alamat lengkap untuk pengiriman order (wajib diisi)"
                      required
                    />
                    <small style={{ color: "#6b7280", fontSize: "12px", marginTop: "4px", display: "block" }}>
                      Alamat ini digunakan untuk order, bisa berbeda dengan alamat customer
                    </small>
                  </label>
                )}

                {displayCustomerForm && (
                  <div className="customer-form-card">
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
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                        />
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

                    {!hasSelectedCustomer && (
                      <p className="customer-hint">
                        Simpan order akan otomatis menambahkan customer baru.
                      </p>
                    )}
                  </div>
                )}
              </section>

              <section className="orders-section orders-section--order">
                <div className="orders-panel-header">
                  <div>
                    <h4>Detail Order</h4>
                    <p>Pilih produk dan lengkapi informasi order.</p>
                  </div>
                </div>

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
                    <div style={{ position: "relative" }}>
                      <span style={{
                        position: "absolute",
                        left: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#6b7280",
                        fontSize: "14px",
                        fontWeight: "500",
                      }}>Rp</span>
                      <input
                        type="text"
                        name="harga"
                        value={formData.harga ?? ""}
                        onChange={handleChange}
                        placeholder="0"
                        style={{ paddingLeft: "40px" }}
                        required
                      />
                    </div>
                  </label>
                  <label className="orders-field">
                    Ongkir
                    <div style={{ position: "relative" }}>
                      <span style={{
                        position: "absolute",
                        left: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#6b7280",
                        fontSize: "14px",
                        fontWeight: "500",
                      }}>Rp</span>
                      <input
                        type="text"
                        name="ongkir"
                        value={formData.ongkir ?? ""}
                        onChange={handleChange}
                        placeholder="0"
                        style={{ paddingLeft: "40px" }}
                      />
                    </div>
                  </label>
                </div>

                <label className="orders-field">
                  Total Harga
                  <div style={{ position: "relative" }}>
                    <span style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#6b7280",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}>Rp</span>
                    <input 
                      type="text" 
                      name="total_harga" 
                      value={formData.total_harga ?? ""} 
                      readOnly 
                      placeholder="0"
                      style={{ paddingLeft: "40px", background: "#f9fafb" }}
                    />
                  </div>
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

                {/* Form Pembayaran */}
                <div className="orders-field" style={{ marginTop: "16px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "#374151" }}>
                    Metode Pembayaran
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label className="orders-radio-option">
                      <input
                        type="radio"
                        name="status_pembayaran"
                        value="0"
                        checked={formData.status_pembayaran === null || formData.status_pembayaran === 0}
                        onChange={(e) => {
                          setFormData({ ...formData, status_pembayaran: null });
                        }}
                      />
                      <div>
                        <strong>Pembayaran Full</strong>
                        <span style={{ display: "block", fontSize: "13px", color: "#6b7280", marginTop: "2px" }}>
                          Pembayaran dilakukan sekaligus (Lunas)
                        </span>
                      </div>
                    </label>
                    <label className="orders-radio-option">
                      <input
                        type="radio"
                        name="status_pembayaran"
                        value="4"
                        checked={formData.status_pembayaran === 4}
                        onChange={(e) => {
                          setFormData({ ...formData, status_pembayaran: 4 });
                        }}
                      />
                      <div>
                        <strong>Pembayaran Bertahap</strong>
                        <span style={{ display: "block", fontSize: "13px", color: "#6b7280", marginTop: "2px" }}>
                          Pembayaran dilakukan secara bertahap (Down Payment)
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                <label className="orders-checkbox">
                  <input
                    type="checkbox"
                    name="notif"
                    checked={formData.notif}
                    onChange={handleChange}
                  />
                  Kirim notifikasi WhatsApp ke customer
                </label>
              </section>
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
      <style jsx>{`
        .orders-columns {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 20px;
        }
        .orders-section--customer,
        .orders-section--order {
          border: 1px solid #eef2ff;
          border-radius: 16px;
          padding: 20px;
          background: #fff;
        }
        .orders-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 16px;
        }
        .orders-panel-header h4 {
          margin: 0;
        }
        .orders-panel-header p {
          margin: 4px 0 0;
          color: #6b7280;
          font-size: 13px;
        }
        .orders-link-btn {
          border: none;
          background: transparent;
          color: #c85400;
          font-weight: 600;
          cursor: pointer;
        }
        
        .orders-link-btn:hover {
          color: #c85400;
          opacity: 0.8;
        }
        .orders-empty-state {
          background: #fef3c7;
          border: 1px solid #fde68a;
          color: #92400e;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 13px;
          margin-bottom: 12px;
        }
        .customer-form-card {
          margin-top: 12px;
          padding: 16px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .customer-selected-card {
          margin: 16px 0;
          padding: 16px;
          border-radius: 12px;
          background: #eef2ff;
          border: 1px solid #c7d2fe;
        }
        .customer-selected-card span {
          font-size: 13px;
          color: #6366f1;
        }
        .customer-selected-card strong {
          display: block;
          font-size: 18px;
          margin-top: 4px;
        }
        .customer-selected-card ul {
          margin: 12px 0;
          padding-left: 18px;
          color: #374151;
          font-size: 14px;
        }
        .customer-selected-card ul li {
          margin-bottom: 4px;
        }
        .customer-hint {
          margin: 0;
          font-size: 13px;
          color: #6b7280;
        }
        .orders-radio-option {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          background: #fff;
        }
        .orders-radio-option:hover {
          border-color: #c85400;
          background: #fff7ed;
        }
        .orders-radio-option input[type="radio"] {
          margin-top: 2px;
          cursor: pointer;
        }
        .orders-radio-option input[type="radio"]:checked + div strong {
          color: #c85400;
        }
        .orders-radio-option:has(input[type="radio"]:checked) {
          border-color: #c85400;
          background: #fff7ed;
        }
        @media (max-width: 640px) {
          .orders-section--customer,
          .orders-section--order {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
}

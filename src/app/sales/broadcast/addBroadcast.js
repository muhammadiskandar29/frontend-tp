"use client";

import { useState, useEffect } from "react";
import { Calendar } from "primereact/calendar";
import { normalizeBroadcastPayload } from "@/lib/sales/broadcast";
import "@/styles/sales/pesanan.css";
import "primereact/resources/themes/lara-light-cyan/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

// Status Order Mapping
const STATUS_ORDER_MAP = {
  "1": "Proses",
  "2": "Sukses",
  "3": "Failed",
  "4": "Upselling",
  "N": "Dihapus",
};

// Status Pembayaran Mapping
const STATUS_PEMBAYARAN_MAP = {
  null: "Unpaid",
  "0": "Unpaid",   // string
  0: "Unpaid",     // number (untuk jaga-jaga)

  "1": "Menunggu",
  1: "Menunggu",

  "2": "Paid",
  2: "Paid",

  "3": "Ditolak",
  3: "Ditolak",

  "4": "DP",
  4: "DP",
};


export default function AddBroadcast({ onClose, onAdd }) {
  const [formData, setFormData] = useState({
    nama: "",
    pesan: "",
    langsung_kirim: true,
    tanggal_kirim: null,
    target: {
      produk: [],
      status_order: "",
      status_pembayaran: "",
    },
  });

  const [products, setProducts] = useState([]);
  const [statusOrderOptions, setStatusOrderOptions] = useState([]);
  const [statusPembayaranOptions, setStatusPembayaranOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [estimatedTarget, setEstimatedTarget] = useState(null);
  const [checkingTarget, setCheckingTarget] = useState(false);

  // Fetch products and orders data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Token tidak ditemukan");
          setLoading(false);
          return;
        }

        // Fetch products
        const productsRes = await fetch("/api/sales/produk", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!productsRes.ok) {
          throw new Error(`HTTP error! status: ${productsRes.status}`);
        }

        const productsJson = await productsRes.json();

        if (productsJson.success && productsJson.data) {
          // Filter hanya produk aktif (status === "1" atau status === 1)
          const activeProducts = Array.isArray(productsJson.data)
            ? productsJson.data.filter((p) => p.status === "1" || p.status === 1)
            : [];
          setProducts(activeProducts);
        }

        // Fetch orders to get unique status_order and status_pembayaran
        const ordersRes = await fetch("/api/sales/order?page=1&per_page=1000", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (ordersRes.ok) {
          const ordersJson = await ordersRes.json();

          if (ordersJson.success && ordersJson.data && Array.isArray(ordersJson.data)) {
            // Extract unique status_order
            const uniqueStatusOrder = new Set();
            ordersJson.data.forEach((order) => {
              if (order.status_order) {
                const status = String(order.status_order);
                if (status && status !== "null" && status !== "undefined") {
                  uniqueStatusOrder.add(status);
                }
              }
            });

            // Extract unique status_pembayaran
            const uniqueStatusPembayaran = new Set();
            ordersJson.data.forEach((order) => {
              let status = order.status_pembayaran;
              if (status === null || status === undefined) {
                status = 0;
              }
              const statusStr = String(status);
              if (statusStr && statusStr !== "null" && statusStr !== "undefined") {
                uniqueStatusPembayaran.add(statusStr);
              }
            });

            // Convert to options array
            const statusOrderOpts = Array.from(uniqueStatusOrder)
              .sort()
              .map((value) => ({
                value,
                label: STATUS_ORDER_MAP[value] || value,
              }));

            const statusPembayaranOpts = Array.from(uniqueStatusPembayaran)
              .sort((a, b) => Number(a) - Number(b))
              .map((value) => ({
                value,
                label: STATUS_PEMBAYARAN_MAP[value] || value,
              }));

            setStatusOrderOptions(statusOrderOpts);
            setStatusPembayaranOptions(statusPembayaranOpts);

            console.log("📊 Status Order Options:", statusOrderOpts);
            console.log("📊 Status Pembayaran Options:", statusPembayaranOpts);
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Gagal memuat data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
      const currentStatus = prev.target.status_order || "";
      return {
        ...prev,
        target: {
          ...prev.target,
          // If clicking the same status, deselect it (allow none)
          // Otherwise, replace with new selection (single select)
          status_order: currentStatus === status ? "" : status,
        },
      };
    });
  };

  // Toggle status pembayaran selection (single select - radio-like)
  const toggleStatusPembayaran = (status) => {
    setFormData((prev) => {
      const currentStatus = prev.target.status_pembayaran || "";
      return {
        ...prev,
        target: {
          ...prev.target,
          // If clicking the same status, deselect it (allow none)
          // Otherwise, replace with new selection (single select)
          status_pembayaran: currentStatus === status ? "" : status,
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

      // Validate produk is selected
      if (!formData.target.produk || formData.target.produk.length === 0) {
        setError("Pilih minimal satu produk");
        return;
      }

      // Normalize payload using helper function
      const requestBody = normalizeBroadcastPayload(formData);

      console.log("📤 [BROADCAST] Normalized payload:", JSON.stringify(requestBody, null, 2));
      console.log("📤 [BROADCAST] Target produk:", requestBody.target.produk);
      console.log("📤 [BROADCAST] Target status_order:", requestBody.target.status_order);
      console.log("📤 [BROADCAST] Target status_pembayaran:", requestBody.target.status_pembayaran);

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

      // Check if total_target is 0
      if (json.data?.total_target === 0) {
        const filterInfo = [];
        if (requestBody.target.produk?.length > 0) {
          const productNames = requestBody.target.produk
            .map((id) => getSelectedProductName(id))
            .join(", ");
          filterInfo.push(`Produk: ${productNames}`);
        }
        if (requestBody.target.status_order) {
          filterInfo.push(`Status Order: ${getStatusOrderLabel(requestBody.target.status_order)}`);
        }
        if (requestBody.target.status_pembayaran) {
          filterInfo.push(`Status Pembayaran: ${getStatusPembayaranLabel(requestBody.target.status_pembayaran)}`);
        }

        const warningMessage = `⚠️ Broadcast berhasil dibuat, tetapi tidak ada customer yang sesuai dengan filter:\n\n${filterInfo.join("\n")}\n\nSilakan kurangi filter atau pilih kombinasi filter yang berbeda.`;
        
        alert(warningMessage);
      } else {
        // Show success message if there are targets
        alert(`✅ Broadcast berhasil dibuat!\nTotal Target: ${json.data?.total_target || 0} customer`);
      }

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
    return STATUS_ORDER_MAP[value] || value;
  };

  const getStatusPembayaranLabel = (value) => {
    return STATUS_PEMBAYARAN_MAP[value] || value;
  };

  // Check estimated target count (optional helper function)
  const checkEstimatedTarget = async () => {
    if (!formData.target.produk || formData.target.produk.length === 0) {
      setEstimatedTarget(null);
      return;
    }

    setCheckingTarget(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Create a test payload to check target
      const testPayload = normalizeBroadcastPayload({
        ...formData,
        nama: "test",
        pesan: "test",
      });

      // Call backend to get estimated count (if backend supports it)
      // For now, we'll just show a message based on filters
      const filterInfo = [];
      if (testPayload.target.produk?.length > 0) {
        filterInfo.push(`${testPayload.target.produk.length} produk`);
      }
      if (testPayload.target.status_order) {
        filterInfo.push(`Status Order: ${getStatusOrderLabel(testPayload.target.status_order)}`);
      }
      if (testPayload.target.status_pembayaran) {
        filterInfo.push(`Status Pembayaran: ${getStatusPembayaranLabel(testPayload.target.status_pembayaran)}`);
      }

      setEstimatedTarget({
        filters: filterInfo,
        note: "Estimasi akan muncul setelah broadcast dibuat",
      });
    } catch (err) {
      console.error("Error checking target:", err);
    } finally {
      setCheckingTarget(false);
    }
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
            {statusOrderOptions.length === 0 ? (
              <div style={{ padding: "1rem", textAlign: "center", color: "#6b7280" }}>
                Memuat status order...
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {statusOrderOptions.map((option) => {
                  const isSelected = formData.target.status_order === option.value;
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
            )}
            {formData.target.status_order && (
              <div style={{ marginTop: "0.5rem", padding: "0.75rem", background: "#f9fafb", borderRadius: "8px" }}>
                <strong style={{ fontSize: "0.875rem", color: "#374151" }}>Status Terpilih:</strong>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <span
                    style={{
                      padding: "0.25rem 0.75rem",
                      background: "#f1a124",
                      color: "#fff",
                      borderRadius: "999px",
                      fontSize: "0.75rem",
                      fontWeight: 500,
                    }}
                  >
                    {getStatusOrderLabel(formData.target.status_order)}
                  </span>
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
            {statusPembayaranOptions.length === 0 ? (
              <div style={{ padding: "1rem", textAlign: "center", color: "#6b7280" }}>
                Memuat status pembayaran...
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {statusPembayaranOptions.map((option) => {
                  const isSelected = formData.target.status_pembayaran === option.value;
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
            )}
            {formData.target.status_pembayaran && (
              <div style={{ marginTop: "0.5rem", padding: "0.75rem", background: "#f9fafb", borderRadius: "8px" }}>
                <strong style={{ fontSize: "0.875rem", color: "#374151" }}>Status Terpilih:</strong>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <span
                    style={{
                      padding: "0.25rem 0.75rem",
                      background: "#f1a124",
                      color: "#fff",
                      borderRadius: "999px",
                      fontSize: "0.75rem",
                      fontWeight: 500,
                    }}
                  >
                    {getStatusPembayaranLabel(formData.target.status_pembayaran)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Info Box: Summary Filter yang Dipilih */}
          {(formData.target.produk.length > 0 || 
            formData.target.status_order || 
            formData.target.status_pembayaran) && (
            <div style={{ 
              marginTop: "1.5rem", 
              padding: "1rem", 
              background: "#f0f9ff", 
              borderRadius: "8px",
              border: "1px solid #bae6fd"
            }}>
              <strong style={{ fontSize: "0.875rem", color: "#0369a1", display: "block", marginBottom: "0.5rem" }}>
                📋 Filter yang Dipilih:
              </strong>
              <div style={{ fontSize: "0.875rem", color: "#0369a1" }}>
                {formData.target.produk.length > 0 && (
                  <div style={{ marginBottom: "0.25rem" }}>
                    • Produk: {formData.target.produk.map((id) => getSelectedProductName(id)).join(", ")}
                  </div>
                )}
                {formData.target.status_order && (
                  <div style={{ marginBottom: "0.25rem" }}>
                    • Status Order: {getStatusOrderLabel(formData.target.status_order)}
                  </div>
                )}
                {formData.target.status_pembayaran && (
                  <div style={{ marginBottom: "0.25rem" }}>
                    • Status Pembayaran: {getStatusPembayaranLabel(formData.target.status_pembayaran)}
                  </div>
                )}
                <div style={{ marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid #bae6fd", fontStyle: "italic" }}>
                  💡 Semua filter harus terpenuhi (AND logic). Jika tidak ada customer yang match, total_target akan 0.
                </div>
              </div>
            </div>
          )}
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

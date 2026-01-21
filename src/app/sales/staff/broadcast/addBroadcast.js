"use client";

import { useState, useEffect, useRef } from "react";
import { Calendar } from "primereact/calendar";
import { normalizeBroadcastPayload } from "@/lib/sales/broadcast";
import dynamic from "next/dynamic";
import "@/styles/sales/pesanan.css";
import "primereact/resources/themes/lara-light-cyan/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

// Dynamic import untuk EmojiPicker
const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
});

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
  0: { label: "Unpaid", class: "unpaid" },
  null: { label: "Unpaid", class: "unpaid" },
  1: { label: "Waiting Approval", class: "pending" }, // Menunggu approve finance
  2: { label: "Paid", class: "paid" },             // Finance approved
  3: { label: "Rejected", class: "rejected" },
  4: { label: "Partial Payment", class: "partial" },
};

// Autotext Options untuk variable
const AUTOTEXT_OPTIONS = [
  { label: "Pilih Variable", value: "" },
  { label: "{{customer_name}}", value: "{{customer_name}}" },
  { label: "{{product_name}}", value: "{{product_name}}" },
  { label: "{{order_date}}", value: "{{order_date}}" },
  { label: "{{order_total}}", value: "{{order_total}}" },
];

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
  // State untuk search produk
  const [produkSearchQuery, setProdukSearchQuery] = useState("");
  const [showProdukDropdown, setShowProdukDropdown] = useState(false);
  // State untuk autotext dan emoji
  const [selectedAutotext, setSelectedAutotext] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const textareaRef = useRef(null);

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
            // Keep null as null (Unpaid), don't convert to 0
            const uniqueStatusPembayaran = new Set();
            ordersJson.data.forEach((order) => {
              let status = order.status_pembayaran;
              // Keep null as null, undefined as null
              if (status === undefined) {
                status = null;
              }
              // Use null for Unpaid instead of 0
              uniqueStatusPembayaran.add(status);
            });

            // Convert to options array
            const statusOrderOpts = Array.from(uniqueStatusOrder)
              .sort()
              .map((value) => ({
                value,
                label: STATUS_ORDER_MAP[value] || value,
              }));

            const statusPembayaranOpts = Array.from(uniqueStatusPembayaran)
              .sort((a, b) => {
                // Handle null first (Unpaid should be first)
                if (a === null) return -1;
                if (b === null) return 1;
                // Then sort numbers
                return Number(a) - Number(b);
              })
              .map((value) => ({
                value,
                label: STATUS_PEMBAYARAN_MAP[value] || value
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
    // Reset search dan tutup dropdown setelah pilih
    setProdukSearchQuery("");
    setShowProdukDropdown(false);
  };

  // Filter produk berdasarkan search query
  const filteredProducts = products.filter((product) => {
    const query = produkSearchQuery.toLowerCase();
    const isSelected = formData.target.produk.includes(product.id);
    // Jangan tampilkan produk yang sudah dipilih
    if (isSelected) return false;
    // Filter berdasarkan nama produk
    return product.nama.toLowerCase().includes(query);
  });

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

  // Insert text at cursor position
  const insertAtCursor = (value) => {
    if (!value) return;
    const textarea = textareaRef.current;
    if (!textarea) {
      setFormData((prev) => ({
        ...prev,
        pesan: (prev.pesan || "") + value,
      }));
      return;
    }
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? textarea.value.length;
    const before = formData.pesan.slice(0, start);
    const after = formData.pesan.slice(end);
    const newValue = `${before}${value}${after}`;
    setFormData((prev) => ({
      ...prev,
      pesan: newValue,
    }));
    requestAnimationFrame(() => {
      const newPos = start + value.length;
      textarea.focus();
      textarea.setSelectionRange(newPos, newPos);
    });
  };

  // Handle insert autotext variable
  const handleInsertAutotext = () => {
    if (!selectedAutotext) {
      return;
    }
    insertAtCursor(selectedAutotext);
    setSelectedAutotext(""); // Reset selection after insert
  };

  // Handle emoji click
  const handleEmojiClick = (emojiData) => {
    const emoji = emojiData?.emoji;
    if (emoji) {
      insertAtCursor(emoji);
    }
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
        // Handle null as valid value (Unpaid) - null should be included
        if (requestBody.target.status_pembayaran !== undefined && requestBody.target.status_pembayaran !== "") {
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
      // Handle null as valid value (Unpaid) - null should be included
      if (testPayload.target.status_pembayaran !== undefined && testPayload.target.status_pembayaran !== "") {
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
              ref={textareaRef}
              name="pesan"
              value={formData.pesan}
              onChange={handleChange}
              rows={6}
              placeholder="Tulis pesan yang akan dikirim ke customer..."
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "0.875rem",
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
          </label>

          {/* Control Row: Autotext & Emoji */}
          <div style={{
            display: "flex",
            gap: "0.5rem",
            marginTop: "-0.5rem",
            marginBottom: "1rem",
            flexWrap: "wrap",
            alignItems: "center",
            position: "relative",
          }}>
            {/* Autotext Buttons */}
            {AUTOTEXT_OPTIONS.filter(opt => opt.value).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => insertAtCursor(option.value)}
                style={{
                  padding: "0.4rem 0.75rem",
                  borderRadius: "20px",
                  border: "1px solid #e5e7eb",
                  background: "#f9fafb",
                  color: "#4b5563",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#e5e7eb";
                  e.currentTarget.style.color = "#1f2937";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#f9fafb";
                  e.currentTarget.style.color = "#4b5563";
                }}
              >
                {option.label}
              </button>
            ))}

            <div style={{ width: "1px", height: "24px", background: "#e5e7eb", margin: "0 0.25rem" }}></div>

            {/* Emoji Picker */}
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  border: "none",
                  background: "#f1a124",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  transition: "all 0.2s",
                  boxShadow: "0 2px 4px rgba(241, 161, 36, 0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#d98e1d";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#f1a124";
                }}
              >
                😊
                <span>Emoticon</span>
              </button>
              {showEmojiPicker && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: "0.5rem",
                  zIndex: 1000,
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  boxShadow: "0 20px 45px rgba(15, 23, 42, 0.15)",
                  padding: "6px",
                }}>
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    height={320}
                    width={280}
                    searchDisabled={false}
                    previewConfig={{ showPreview: false }}
                    skinTonesDisabled
                  />
                </div>
              )}
            </div>
          </div>

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
              Target Produk *
              <small style={{ fontWeight: 400, color: "#6b7280", marginLeft: "0.5rem" }}>
                (Pilih satu atau lebih produk)
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
              <>
                {/* Input Search Produk */}
                <div style={{ position: "relative", marginBottom: "0.75rem" }}>
                  <input
                    type="text"
                    placeholder="Cari produk..."
                    value={produkSearchQuery}
                    onChange={(e) => {
                      setProdukSearchQuery(e.target.value);
                      setShowProdukDropdown(true);
                    }}
                    onFocus={() => setShowProdukDropdown(true)}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                      outline: "none",
                      transition: "border-color 0.2s",
                    }}
                    onBlur={() => {
                      // Delay untuk allow click on dropdown items
                      setTimeout(() => setShowProdukDropdown(false), 200);
                    }}
                  />

                  {/* Dropdown Hasil Search */}
                  {showProdukDropdown && produkSearchQuery && filteredProducts.length > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        marginTop: "0.25rem",
                        background: "#fff",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                        maxHeight: "200px",
                        overflowY: "auto",
                        zIndex: 1000,
                      }}
                    >
                      {filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          onClick={() => toggleProduk(product.id)}
                          style={{
                            padding: "0.75rem 1rem",
                            cursor: "pointer",
                            transition: "background-color 0.2s",
                            borderBottom: "1px solid #f3f4f6",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#f9fafb";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#fff";
                          }}
                        >
                          {product.nama}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pesan jika tidak ada hasil */}
                  {showProdukDropdown && produkSearchQuery && filteredProducts.length === 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        marginTop: "0.25rem",
                        background: "#fff",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        padding: "0.75rem 1rem",
                        color: "#6b7280",
                        fontSize: "0.875rem",
                        zIndex: 1000,
                      }}
                    >
                      Tidak ada produk ditemukan
                    </div>
                  )}
                </div>

                {/* Produk Terpilih (Chips dengan tombol X) */}
                {formData.target.produk.length > 0 && (
                  <div style={{ marginTop: "0.75rem" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                      {formData.target.produk.map((productId) => (
                        <span
                          key={productId}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.5rem 0.75rem",
                            background: "#f1a124",
                            color: "#fff",
                            borderRadius: "999px",
                            fontSize: "0.875rem",
                            fontWeight: 500,
                          }}
                        >
                          {getSelectedProductName(productId)}
                          <button
                            type="button"
                            onClick={() => toggleProduk(productId)}
                            style={{
                              background: "rgba(255, 255, 255, 0.2)",
                              border: "none",
                              borderRadius: "50%",
                              width: "20px",
                              height: "20px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              color: "#fff",
                              fontSize: "0.875rem",
                              lineHeight: 1,
                              padding: 0,
                              transition: "background-color 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.3)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
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
                {statusPembayaranOptions.map((option, index) => {
                  const isSelected = formData.target.status_pembayaran === option.value;
                  return (
                    <button
                      key={option.value !== null ? option.value : `null-${index}`}
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
            {/* Handle null as valid value (Unpaid) - null should be displayed */}
            {(formData.target.status_pembayaran !== undefined && formData.target.status_pembayaran !== "") && (
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
          {/* Handle null as valid value (Unpaid) - null should be included */}
          {(formData.target.produk.length > 0 ||
            formData.target.status_order ||
            (formData.target.status_pembayaran !== undefined && formData.target.status_pembayaran !== "")) && (
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
                  {/* Handle null as valid value (Unpaid) - null should be included */}
                  {(formData.target.status_pembayaran !== undefined && formData.target.status_pembayaran !== "") && (
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

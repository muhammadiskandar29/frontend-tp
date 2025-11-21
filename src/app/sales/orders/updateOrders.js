"use client";

import { useState, useEffect } from "react";
import "@/styles/pesanan.css";

// Use Next.js proxy to avoid CORS
const BASE_URL = "/api";

// Helper function to clean order data
const cleanOrderData = (orderData) => {
  if (!orderData) return {};
  
  const cleaned = { ...orderData };
  
  // Ensure customer is an ID, not an object
  if (cleaned.customer && typeof cleaned.customer === "object") {
    cleaned.customer = cleaned.customer.id || cleaned.customer_rel?.id || null;
  }
  
  // Ensure produk is an ID, not an object
  if (cleaned.produk && typeof cleaned.produk === "object") {
    cleaned.produk = cleaned.produk.id || cleaned.produk_rel?.id || null;
  }
  
  return cleaned;
};

export default function UpdateOrders({ order, onClose, onSave, setToast }) {
  const [updatedOrder, setUpdatedOrder] = useState(order ? cleanOrderData(order) : {});
  const [showKonfirmasiModal, setShowKonfirmasiModal] = useState(false);
  const [bukti, setBukti] = useState(
    order?.bukti_pembayaran
      ? { name: order.bukti_pembayaran, existing: true, url: order.bukti_pembayaran }
      : null
  );
  const [metodeBayar, setMetodeBayar] = useState(order?.metode_bayar ?? "");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (order) {
      setUpdatedOrder(cleanOrderData(order));
      setBukti(
        order.bukti_pembayaran
          ? { name: order.bukti_pembayaran, existing: true, url: order.bukti_pembayaran }
          : null
      );
      setMetodeBayar(order.metode_bayar ?? "");
      setErrorMsg("");
    }
  }, [order]);

  const computedStatus = () => {
    if (
      updatedOrder.bukti_pembayaran &&
      updatedOrder.waktu_pembayaran &&
      updatedOrder.bukti_pembayaran !== ""
    )
      return 1;
    return 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUpdatedOrder((prev) => ({ ...prev, [name]: value }));
    setErrorMsg("");
  };

  const handleKonfirmasiFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setBukti({ name: file.name, file, existing: false, url: previewUrl });
    }
  };

  const getPaymentStatus = (orderData) => {
    if (orderData.bukti_pembayaran && orderData.waktu_pembayaran && orderData.metode_bayar) return 1;
    return Number(orderData.status_pembayaran) || 0;
  };

  const handleKonfirmasiSubmit = async (e) => {
  e.preventDefault();
  setErrorMsg("");

  if (!order?.id) return setErrorMsg("Order ID tidak valid.");
  if (!bukti) return setErrorMsg("Harap upload bukti pembayaran.");
  if (!metodeBayar) return setErrorMsg("Isi metode pembayaran di bagian depan terlebih dahulu.");

  try {
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, "0");
    const waktuPembayaran = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const formData = new FormData();
    if (!bukti.existing) formData.append("bukti_pembayaran", bukti.file);
    formData.append("waktu_pembayaran", waktuPembayaran);
    formData.append("metode_pembayaran", metodeBayar);

    const token = localStorage.getItem("token");
    const url = `${BASE_URL}/admin/order-konfirmasi/${order.id}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      return setErrorMsg("Gagal konfirmasi pembayaran: " + text);
    }

    const data = await res.json();
    const konfirmasiOrder = data.data;

    const finalOrder = {
      ...konfirmasiOrder,
      bukti_pembayaran: bukti.name || konfirmasiOrder.bukti_pembayaran,
      waktu_pembayaran: waktuPembayaran,
      metode_bayar: metodeBayar,
      status_pembayaran: 1,
    };

    setUpdatedOrder(finalOrder);
    setBukti((prev) => ({ ...prev, existing: true, url: finalOrder.bukti_pembayaran }));
    onSave(finalOrder);
    setShowKonfirmasiModal(false);

    // ✅ tampilkan toast sukses
    setToast({
      show: true,
      type: "success",
      message: "✅ Pembayaran berhasil dikonfirmasi!",
    });

    // ✅ tutup modal utama setelah delay sedikit
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
      onClose();
    }, 1000);
  } catch (err) {
    console.error(err);
    setErrorMsg("Terjadi kesalahan saat konfirmasi pembayaran.");

    // optional: tampilkan toast error juga
    setToast({
      show: true,
      type: "error",
      message: "❌ Gagal mengkonfirmasi pembayaran.",
    });

    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 2000);
  }
};


const handleSubmitUpdate = async (e) => {
  e.preventDefault();

  try {
    const token = localStorage.getItem("token");

    const res = await fetch(`${BASE_URL}/admin/order/${order.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...updatedOrder,
        metode_bayar: metodeBayar,
      }),
    });

    const json = await res.json();
    const newOrder = json.data;   // ⬅️ full data

    onSave(newOrder);             // ⬅️ langsung update parent
    onClose();
  } catch (err) {
    console.error(err);
  }
};



  return (
    <>
      <div className="update-modal-overlay">
        <div className="update-modal-card" style={{ width: "100%", maxWidth: 900 }}>
          <div className="update-modal-header">
            <h2>Update Pesanan</h2>
            <button className="close-btn" onClick={onClose}>
              ✕
            </button>
          </div>

          <form className="update-modal-body" onSubmit={handleSubmitUpdate}>
            <div className="update-section">
              <h4>Informasi Order</h4>
              <label>
                Customer
                <input
                  type="text"
                  value={
                    order.customer_rel?.nama ||
                    (typeof order.customer === "object" ? order.customer?.nama : String(order.customer || "-")) ||
                    "-"
                  }
                  disabled
                />
              </label>
              <label>
                Produk
                <input
                  type="text"
                  value={
                    order.produk_rel?.nama ||
                    (typeof order.produk === "object" ? order.produk?.nama : String(order.produk || "-")) ||
                    "-"
                  }
                  disabled
                />
              </label>
              <label>
                Alamat
                <textarea
                  name="alamat"
                  rows="3"
                  value={updatedOrder.alamat ?? order.alamat ?? ""}
                  onChange={handleChange}
                />
              </label>
              <label>
                Sumber Order
                <input
                  type="text"
                  name="sumber"
                  value={updatedOrder.sumber ?? order.sumber ?? ""}
                  onChange={handleChange}
                />
              </label>
            </div>

            <div className="update-section">
              <h4>Detail Pembayaran</h4>
              <label>
                Harga Produk
                <input
                  type="number"
                  name="harga"
                  value={updatedOrder.harga ?? order.harga ?? ""}
                  onChange={handleChange}
                />
              </label>
              <label>
                Ongkir
                <input
                  type="number"
                  name="ongkir"
                  value={updatedOrder.ongkir ?? order.ongkir ?? ""}
                  onChange={handleChange}
                />
              </label>
              <label>
                Total Harga
                <input
                  type="number"
                  name="total_harga"
                  value={updatedOrder.total_harga ?? order.total_harga ?? ""}
                  onChange={handleChange}
                />
              </label>

              <label>
                Metode Pembayaran
                <input
                  type="text"
                  value={metodeBayar}
                  onChange={(e) => setMetodeBayar(e.target.value)}
                  placeholder="Masukkan metode bayar"
                />
              </label>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 14,
                }}
              >
                <span>
                  Status Pembayaran:{" "}
                  {computedStatus() === 1 ? (
                    <span style={{ color: "green" }}>Paid</span>
                  ) : (
                    <span style={{ color: "orange" }}>Unpaid</span>
                  )}
                </span>

                {computedStatus() === 0 ? (
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={!metodeBayar}
                    onClick={() => setShowKonfirmasiModal(true)}
                    style={{
                      opacity: !metodeBayar ? 0.5 : 1,
                      cursor: !metodeBayar ? "not-allowed" : "pointer",
                    }}
                  >
                    Konfirmasi Pembayaran
                  </button>
                ) : (
                  <span style={{ color: "green", fontWeight: 500 }}>
                    ✅ Pembayaran Terkonfirmasi
                  </span>
                )}
              </div>

              {bukti && (
                <div style={{ marginTop: 10 }}>
                  <p style={{ fontSize: "0.9rem", color: "#374151" }}>
                    📎 Bukti Pembayaran (
                    {order.customer_rel?.nama ||
                      (typeof order.customer === "object" ? order.customer?.nama : String(order.customer || "-")) ||
                      "-"}
                    )
                  </p>
                  <img
                    src={
                      bukti.url.startsWith("blob:")
                        ? bukti.url
                        : `${BASE_URL.replace("/api", "/storage/")}${bukti.url}`
                    }
                    alt="Bukti"
                    style={{
                      marginTop: 6,
                      borderRadius: 6,
                      maxHeight: 180,
                      border: "1px solid #e5e7eb",
                    }}
                  />
                </div>
              )}
            </div>

            {errorMsg && (
              <div
                style={{
                  background: "#fee2e2",
                  color: "#991b1b",
                  padding: "0.75rem 1rem",
                  borderRadius: 6,
                  marginTop: 8,
                }}
              >
                ⚠️ {errorMsg}
              </div>
            )}

            <div className="update-modal-footer">
              <button type="button" onClick={onClose} className="btn-cancel">
                Batal
              </button>
              <button type="submit" className="btn-save">
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal Konfirmasi Pembayaran */}
      {showKonfirmasiModal && (
        <div className="update-modal-overlay">
          <div
            className="update-modal-card"
            style={{
              maxWidth: 450,
              padding: "1.5rem",
              borderRadius: 10,
              boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            }}
          >
            <div
              className="update-modal-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h3 style={{ fontSize: "1.1rem", fontWeight: 600 }}>Konfirmasi Pembayaran</h3>
              <button
                className="close-btn"
                onClick={() => setShowKonfirmasiModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 20,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleKonfirmasiSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <label>
                <span style={{ fontWeight: 500, fontSize: 14 }}>Upload Bukti Pembayaran</span>
                <input type="file" accept="image/*" onChange={handleKonfirmasiFileChange} />
              </label>

              <label>
                <span style={{ fontWeight: 500, fontSize: 14 }}>Metode Pembayaran</span>
                <input
                  type="text"
                  value={metodeBayar}
                  disabled
                  style={{ background: "#f3f4f6", cursor: "not-allowed" }}
                />
              </label>

              {bukti?.url && (
                <img
                  src={bukti.url}
                  alt="Preview Bukti"
                  style={{
                    borderRadius: 6,
                    maxHeight: 200,
                    border: "1px solid #e5e7eb",
                    marginTop: 6,
                    objectFit: "contain",
                  }}
                />
              )}

              {errorMsg && (
                <p style={{ color: "red", fontSize: 14, marginTop: 6 }}>{errorMsg}</p>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  marginTop: 10,
                }}
              >
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowKonfirmasiModal(false)}
                >
                  Batal
                </button>
                <button type="submit" className="btn-save">
                  Konfirmasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

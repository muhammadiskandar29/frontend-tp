"use client";

import { useEffect, useState, useCallback } from "react";
import Layout from "@/components/Layout";
import dynamic from "next/dynamic";
import "primereact/resources/themes/lara-light-cyan/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "@/styles/sales/dashboard.css";
import "@/styles/sales/admin.css";

// Lazy load modals
const ViewPenerima = dynamic(() => import("./viewPenerima"), { ssr: false });
const AddBroadcast = dynamic(() => import("./addBroadcast"), { ssr: false });
const SendBroadcast = dynamic(() => import("./sendBroadcast"), { ssr: false });

export default function BroadcastPage() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showViewPenerima, setShowViewPenerima] = useState(false);
  const [showAddBroadcast, setShowAddBroadcast] = useState(false);
  const [showSendBroadcast, setShowSendBroadcast] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [sendingId, setSendingId] = useState(null);

  const fetchBroadcasts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Token tidak ditemukan");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/sales/broadcast", {
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
        setBroadcasts(Array.isArray(json.data) ? json.data : []);
      } else {
        setError(json.message || "Gagal memuat data broadcast");
      }
    } catch (err) {
      console.error("Error fetching broadcasts:", err);
      setError(err.message || "Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBroadcasts();
  }, [fetchBroadcasts]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateString;
    }
  };

  const getStatusLabel = (status, broadcast) => {
    // Jika status "1" (Draft) tapi sudah ada sent_to_queue, berarti sedang diproses
    if (status?.trim() === "1" && broadcast?.sent_to_queue > 0) {
      return "Sedang Diproses";
    }
    
    const statusMap = {
      "1": "Draft",
      "2": "Terjadwal",
      "3": "Terkirim",
      "4": "Dibatalkan",
    };
    return statusMap[status?.trim()] || status || "-";
  };

  const getStatusClass = (status, broadcast) => {
    // Jika status "1" (Draft) tapi sudah ada sent_to_queue, gunakan class "processing"
    if (status?.trim() === "1" && broadcast?.sent_to_queue > 0) {
      return "processing";
    }
    
    const statusMap = {
      "1": "pending",
      "2": "pending",
      "3": "sukses",
      "4": "failed",
    };
    return statusMap[status?.trim()] || "default";
  };

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
    0: "Unpaid",
    1: "Pending",
    2: "Paid",
    3: "Ditolak",
    4: "DP",
  };

  // Fetch products untuk mendapatkan nama produk
  const [products, setProducts] = useState([]);
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch("/api/sales/produk", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setProducts(Array.isArray(json.data) ? json.data : []);
          }
        }
      } catch (err) {
        console.error("Error fetching products:", err);
      }
    };

    fetchProducts();
  }, []);

  // Helper function untuk mendapatkan nama produk dari ID
  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    return product?.nama || `Produk ID: ${productId}`;
  };

  // Helper function untuk mendapatkan label status order
  const getStatusOrderLabel = (status) => {
    if (Array.isArray(status)) {
      return status.map(s => STATUS_ORDER_MAP[s] || s).join(", ");
    }
    return STATUS_ORDER_MAP[status] || status || "-";
  };

  // Helper function untuk mendapatkan label status pembayaran
  const getStatusPembayaranLabel = (status) => {
    if (Array.isArray(status)) {
      return status.map(s => STATUS_PEMBAYARAN_MAP[s] || s).join(", ");
    }
    return STATUS_PEMBAYARAN_MAP[status] || status || "-";
  };

  // Format target untuk ditampilkan
  const formatTarget = (targetData) => {
    if (!targetData || Object.keys(targetData).length === 0) {
      return "-";
    }

    const parts = [];
    
    // Format Produk
    if (targetData.produk) {
      const produkList = Array.isArray(targetData.produk) ? targetData.produk : [targetData.produk];
      const validProduk = produkList.filter(id => id !== null && id !== undefined && id !== "");
      if (validProduk.length > 0) {
        const produkNames = validProduk.map(id => getProductName(id));
        parts.push(
          <div key="produk" style={{ marginBottom: produkNames.length > 1 ? "0.5rem" : "0.25rem" }}>
            <strong>Produk:</strong>
            {produkNames.length === 1 ? (
              <span style={{ marginLeft: "0.5rem" }}>{produkNames[0]}</span>
            ) : (
              produkNames.map((name, idx) => (
                <div key={idx} style={{ marginLeft: "1rem", marginTop: idx === 0 ? "0.25rem" : "0.125rem" }}>
                  {name}
                </div>
              ))
            )}
          </div>
        );
      }
    }

    // Format Status Order
    if (targetData.status_order !== undefined && targetData.status_order !== null && targetData.status_order !== "") {
      const statusOrderList = Array.isArray(targetData.status_order) 
        ? targetData.status_order 
        : [targetData.status_order];
      const validStatus = statusOrderList.filter(s => s !== null && s !== undefined && s !== "");
      if (validStatus.length > 0) {
        const statusLabels = validStatus.map(s => STATUS_ORDER_MAP[s] || s);
        parts.push(
          <div key="status_order" style={{ marginBottom: statusLabels.length > 1 ? "0.5rem" : "0.25rem" }}>
            <strong>Status Order:</strong>
            {statusLabels.length === 1 ? (
              <span style={{ marginLeft: "0.5rem" }}>{statusLabels[0]}</span>
            ) : (
              statusLabels.map((label, idx) => (
                <div key={idx} style={{ marginLeft: "1rem", marginTop: idx === 0 ? "0.25rem" : "0.125rem" }}>
                  {label}
                </div>
              ))
            )}
          </div>
        );
      }
    }

    // Format Status Pembayaran
    if (targetData.status_pembayaran !== undefined && targetData.status_pembayaran !== null && targetData.status_pembayaran !== "") {
      const statusPembayaranList = Array.isArray(targetData.status_pembayaran)
        ? targetData.status_pembayaran
        : [targetData.status_pembayaran];
      const validStatus = statusPembayaranList.filter(s => s !== null && s !== undefined && s !== "");
      if (validStatus.length > 0) {
        const statusLabels = validStatus.map(s => STATUS_PEMBAYARAN_MAP[s] || s || "Unpaid");
        parts.push(
          <div key="status_pembayaran" style={{ marginBottom: statusLabels.length > 1 ? "0.5rem" : "0.25rem" }}>
            <strong>Status Pembayaran:</strong>
            {statusLabels.length === 1 ? (
              <span style={{ marginLeft: "0.5rem" }}>{statusLabels[0]}</span>
            ) : (
              statusLabels.map((label, idx) => (
                <div key={idx} style={{ marginLeft: "1rem", marginTop: idx === 0 ? "0.25rem" : "0.125rem" }}>
                  {label}
                </div>
              ))
            )}
          </div>
        );
      }
    }

    return parts.length > 0 ? parts : "-";
  };

  // Handle Delete Broadcast
  const handleDelete = async (broadcastId, broadcastNama) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus broadcast "${broadcastNama}"?`)) {
      return;
    }

    setDeletingId(broadcastId);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Token tidak ditemukan");
        return;
      }

      const res = await fetch(`/api/sales/broadcast/${broadcastId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal menghapus broadcast");
      }

      // Refresh list
      fetchBroadcasts();
    } catch (err) {
      console.error("Error deleting broadcast:", err);
      setError(err.message || "Terjadi kesalahan saat menghapus broadcast");
    } finally {
      setDeletingId(null);
    }
  };

  // Handle Send Broadcast
  const handleSend = async (broadcastId) => {
    setSendingId(broadcastId);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Token tidak ditemukan");
        setSendingId(null);
        return;
      }

      const res = await fetch(`/api/sales/broadcast/${broadcastId}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal mengirim broadcast");
      }

      // Show success message
      alert(`Broadcast berhasil dikirim!\nTotal Target: ${json.data?.total_target || 0}\nSent to Queue: ${json.data?.sent_to_queue || 0}\nFailed: ${json.data?.failed || 0}`);

      // Refresh list
      fetchBroadcasts();
    } catch (err) {
      console.error("Error sending broadcast:", err);
      setError(err.message || "Terjadi kesalahan saat mengirim broadcast");
      throw err; // Re-throw untuk ditangani di modal
    } finally {
      setSendingId(null);
    }
  };

  // Handle open send modal
  const handleOpenSend = (broadcast) => {
    setSelectedBroadcast(broadcast);
    setShowSendBroadcast(true);
  };

  return (
    <Layout title="Manage Broadcast">
      <style jsx>{`
        .orders-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding: 1.25rem 1.5rem;
          border-top: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .orders-modal-footer .orders-button {
          padding: 0.625rem 1.25rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          border: 1px solid #e5e7eb;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .orders-modal-footer .orders-button--ghost {
          background: #ffffff;
          color: #374151;
          border-color: #d1d5db;
        }

        .orders-modal-footer .orders-button--ghost:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .orders-modal-footer .orders-button--primary {
          background: #c85400;
          color: #ffffff;
          border-color: #c85400;
        }

        .orders-modal-footer .orders-button--primary:hover:not(:disabled) {
          background: #b04800;
          border-color: #b04800;
        }

        .orders-modal-footer .orders-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
      <div className="dashboard-shell orders-shell">
        <section className="dashboard-hero orders-hero">
          <div className="orders-toolbar">
            <div></div>
            <div className="orders-toolbar-buttons">
            </div>
          </div>
        </section>

        {error && (
          <div className="dashboard-alert" style={{ marginTop: "1rem" }}>
            {error}
          </div>
        )}

        <section className="panel orders-panel">
          <div className="panel__header">
            <div>
              <p className="panel__eyebrow">Directory</p>
              <h3 className="panel__title">Broadcast List</h3>
            </div>
            <button
                type="button"
                className="customers-button customers-button--primary"
                onClick={() => setShowAddBroadcast(true)}
              >
                + Tambah Broadcast
            </button>
          </div>

          <div className="orders-table__wrapper">
            {loading ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--dash-muted)" }}>
                Memuat data...
              </div>
            ) : broadcasts.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--dash-muted)" }}>
                Belum ada data broadcast
              </div>
            ) : (
              <div className="orders-table broadcast-table">
                <div className="orders-table__head">
                  <span>#</span>
                  <span>Nama</span>
                  <span>Pesan</span>
                  <span>Tanggal Kirim</span>
                  <span>Target</span>
                  <span>Total Target</span>
                  <span>Status</span>
                  <span>Dibuat</span>
                  <span>Actions</span>
                </div>
                <div className="orders-table__body">
                  {broadcasts.map((broadcast, i) => {
                    let targetData = {};
                    try {
                      if (broadcast.target) {
                        targetData = JSON.parse(broadcast.target);
                      }
                    } catch (e) {
                      console.error("Error parsing target:", e);
                    }

                    return (
                      <div className="orders-table__row" key={broadcast.id}>
                        <div className="orders-table__cell" data-label="#">
                          {i + 1}
                        </div>
                        <div className="orders-table__cell orders-table__cell--strong" data-label="Nama">
                          {broadcast.nama || "-"}
                        </div>
                        <div className="orders-table__cell" data-label="Pesan">
                          {broadcast.pesan || "-"}
                        </div>
                        <div className="orders-table__cell" data-label="Tanggal Kirim">
                          {formatDate(broadcast.tanggal_kirim)}
                        </div>
                        <div className="orders-table__cell" data-label="Target" style={{ fontSize: "0.875rem", lineHeight: "1.5" }}>
                          {formatTarget(targetData)}
                        </div>
                        <div className="orders-table__cell" data-label="Total Target">
                          {broadcast.total_target || "0"}
                        </div>
                        <div className="orders-table__cell" data-label="Status">
                          <span className={`orders-status-badge orders-status-badge--${getStatusClass(broadcast.status, broadcast)}`}>
                            {getStatusLabel(broadcast.status, broadcast)}
                          </span>
                        </div>
                        <div className="orders-table__cell" data-label="Dibuat">
                          {formatDate(broadcast.create_at)}
                        </div>
                        <div className="orders-table__cell orders-table__cell--actions" data-label="Actions">
                          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                            <button
                              className="orders-action-btn"
                              title="View Penerima"
                              onClick={() => {
                                setSelectedBroadcast(broadcast);
                                setShowViewPenerima(true);
                              }}
                            >
                              <i className="pi pi-eye" />
                              View
                            </button>
                            <button
                              className="orders-action-btn orders-action-btn--ghost"
                              title="Send Broadcast"
                              onClick={() => handleOpenSend(broadcast)}
                              disabled={sendingId === broadcast.id}
                            >
                              <i className="pi pi-send" />
                              Send
                            </button>
                            <button
                              className="orders-action-btn orders-action-btn--danger"
                              title="Hapus Broadcast"
                              onClick={() => handleDelete(broadcast.id, broadcast.nama)}
                              disabled={deletingId === broadcast.id}
                            >
                              <i className="pi pi-trash" />
                              {deletingId === broadcast.id ? "Deleting..." : "Hapus"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Modal View Penerima */}
      {showViewPenerima && selectedBroadcast && (
        <ViewPenerima
          broadcast={selectedBroadcast}
          onClose={() => {
            setShowViewPenerima(false);
            setSelectedBroadcast(null);
          }}
        />
      )}

      {/* Modal Add Broadcast */}
      {showAddBroadcast && (
        <AddBroadcast
          onClose={() => setShowAddBroadcast(false)}
          onAdd={(newBroadcast) => {
            // Refresh broadcasts list
            fetchBroadcasts();
            setShowAddBroadcast(false);
          }}
        />
      )}

      {/* Modal Send Broadcast */}
      {showSendBroadcast && selectedBroadcast && (
        <SendBroadcast
          broadcast={selectedBroadcast}
          onClose={() => {
            setShowSendBroadcast(false);
            setSelectedBroadcast(null);
          }}
          onSend={handleSend}
        />
      )}
    </Layout>
  );
}

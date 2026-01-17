"use client";

import { useState, useEffect } from "react";

export default function SendWhatsappModal({ order, isOpen, onClose }) {
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        if (isOpen) {
            setMessage("");
            setError("");
            setSuccess("");
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!order?.id) return;

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Token tidak ditemukan");

            const res = await fetch(`/api/sales/order/${order.id}/send-whatsapp`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
                body: JSON.stringify({ message }),
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Gagal mengirim pesan");

            setSuccess("Pesan WhatsApp berhasil dikirim");
            setTimeout(() => {
                onClose();
                // Reset state
                setSuccess("");
                setMessage("");
            }, 1500);

        } catch (err) {
            console.error(err);
            setError(err.message || "Terjadi kesalahan");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const customerName = order?.customer_rel?.nama || order?.customer || "-";
    const customerEmail = order?.customer_rel?.email || "-";
    const customerWA = order?.customer_rel?.wa || order?.customer_rel?.telepon || "-";

    return (
        <div
            className="orders-modal-overlay"
            onClick={(e) => e.target === e.currentTarget && onClose()}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem"
            }}
        >
            <div
                className="orders-modal-card"
                style={{
                    width: "min(500px, 95vw)",
                    maxHeight: "90vh",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    zIndex: 10000,
                    backgroundColor: "#fff",
                    borderRadius: "12px",
                    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)"
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="orders-modal-header" style={{
                    padding: "1.5rem",
                    borderBottom: "1px solid #e5e7eb",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}>
                    <h2 style={{
                        margin: 0,
                        fontSize: "1.25rem",
                        fontWeight: 600,
                        color: "#111827"
                    }}>Kirim WhatsApp</h2>
                    <button
                        className="orders-modal-close"
                        onClick={onClose}
                        type="button"
                        style={{
                            background: "none",
                            border: "none",
                            fontSize: "1.25rem",
                            cursor: "pointer",
                            color: "#6b7280",
                            padding: "0.25rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "4px",
                        }}
                    >
                        <i className="pi pi-times" />
                    </button>
                </div>

                {/* Body */}
                <div className="orders-modal-body" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

                    {error && (
                        <div style={{ padding: "0.75rem", background: "#fee2e2", color: "#991b1b", borderRadius: "6px", fontSize: "0.875rem" }}>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div style={{ padding: "0.75rem", background: "#d1fae5", color: "#065f46", borderRadius: "6px", fontSize: "0.875rem" }}>
                            {success}
                        </div>
                    )}

                    {/* Customer Info */}
                    <div style={{ padding: "1rem", background: "#f9fafb", borderRadius: "8px", fontSize: "0.875rem" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.5rem" }}>
                            <div>
                                <span style={{ color: "#6b7280" }}>Customer:</span>
                                <strong style={{ display: "block", color: "#111827" }}>{customerName}</strong>
                            </div>
                            <div>
                                <span style={{ color: "#6b7280" }}>Email:</span>
                                <strong style={{ display: "block", color: "#111827" }}>{customerEmail}</strong>
                            </div>
                            <div>
                                <span style={{ color: "#6b7280" }}>WhatsApp:</span>
                                <strong style={{ display: "block", color: "#111827" }}>{customerWA}</strong>
                            </div>
                        </div>
                    </div>

                    {/* Message Input */}
                    <div>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500, color: "#374151" }}>Pesan</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Tulis pesan..."
                            rows={5}
                            style={{
                                width: "100%",
                                padding: "0.75rem",
                                border: "1px solid #d1d5db",
                                borderRadius: "6px",
                                fontSize: "0.875rem",
                                resize: "vertical",
                                outline: "none",
                            }}
                            required
                        />
                    </div>

                </div>

                {/* Footer */}
                <div className="orders-modal-footer" style={{
                    padding: "1rem 1.5rem",
                    borderTop: "1px solid #e5e7eb",
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "0.75rem"
                }}>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        style={{
                            padding: "0.625rem 1.25rem",
                            background: "#fff",
                            color: "#374151",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: 500,
                            fontSize: "0.875rem",
                        }}
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading || !message.trim()}
                        style={{
                            padding: "0.625rem 1.25rem",
                            background: loading ? "#fdba74" : "#f1a124",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            cursor: loading ? "not-allowed" : "pointer",
                            fontWeight: 500,
                            fontSize: "0.875rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem"
                        }}
                    >
                        {loading && <i className="pi pi-spin pi-spinner" />}
                        {loading ? "Mengirim..." : "Kirim"}
                    </button>
                </div>
            </div>
        </div>
    );
}

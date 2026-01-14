'use client';

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { ExternalLink, Image as ImageIcon } from 'lucide-react';
import './table-orders.css';
import { getOrders, getOrderStatistics } from "@/lib/sales/orders"; // Adjust import path if needed
import { api } from "@/lib/api";

// Status Pembayaran Mapping
const STATUS_PEMBAYARAN_MAP = {
    0: { label: "Unpaid", class: "unpaid" },
    null: { label: "Unpaid", class: "unpaid" },
    1: { label: "Pending", class: "pending" },
    2: { label: "Paid", class: "paid" },
    3: { label: "Ditolak", class: "rejected" },
    4: { label: "DP", class: "dp" },
};

// Status Order Mapping
const STATUS_ORDER_MAP = {
    "1": { label: "Pending", class: "pending" },
    "2": { label: "Sukses", class: "sukses" },
    "3": { label: "Failed", class: "failed" },
    "4": { label: "Upselling", class: "upselling" },
    "N": { label: "Dihapus", class: "dihapus" },
};

// Helper component untuk WA Bubble Chat dengan deteksi status
const WABubbleChat = ({ customerId, orderId, orderStatus, statusPembayaran }) => {
    const [followupLogs, setFollowupLogs] = useState([]);

    // Simple fetch logs effect
    useEffect(() => {
        if (!customerId) return;
        const fetchFollowupLogs = async () => {
            try {
                const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
                const res = await fetch("/api/sales/logs-follup", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({ customer: Number(customerId) }),
                });
                const data = await res.json();
                if (res.ok && Array.isArray(data.data)) {
                    let filtered = data.data;
                    if (orderId) {
                        filtered = data.data.filter(log => {
                            const logOrderId = log.order || log.order_id || log.orderId;
                            return logOrderId && Number(logOrderId) === Number(orderId);
                        });
                    }
                    setFollowupLogs(filtered);
                }
            } catch (err) {
                console.error("Error fetching followup logs:", err);
            }
        };
        fetchFollowupLogs();
    }, [customerId, orderId]);

    const isSent = (eventType) => {
        const log = followupLogs.find(l => {
            const logEvent = l.follup || l.type || l.follup_rel?.id || l.event;
            return Number(logEvent) === Number(eventType);
        });
        return log && (log.status === "1" || log.status === 1);
    };

    const createBubble = (content, eventType, className = "") => {
        const sent = isSent(eventType);

        let bubbleClass = "wa-bubble inactive";
        if (content === "W") bubbleClass = "wa-bubble active"; // W is special (usually green)
        else if (sent) bubbleClass = "wa-bubble active"; // Number active if sent

        return (
            <div key={`bubble-${eventType}`} className={bubbleClass}>
                {content}
            </div>
        );
    };

    const bubbles = [];

    // WA icon bubble
    bubbles.push(
        <div key="wa-logo" className={`wa-bubble-icon ${isSent(5) ? 'active' : ''}`}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
        </div>
    );

    // W bubble (event 5)
    bubbles.push(createBubble("W", 5));

    // 1-4
    for (let i = 1; i <= 4; i++) {
        bubbles.push(createBubble(i.toString(), i));
    }

    // P bubble (event 6 = Pembayaran)
    if (statusPembayaran === 2 || statusPembayaran === "2") {
        bubbles.push(createBubble("P", 6));
    }

    // 7 bubble (Selesai/Sukses) - status order 2
    if (orderStatus === "2" || orderStatus === 2) {
        bubbles.push(createBubble("7", 7));
    }

    // Menu dots (placeholder for other actions if any)
    bubbles.push(
        <div key="menu" className="wa-bubble menu">:</div>
    );

    return (
        <div className="follow-up-container">
            {bubbles}
        </div>
    );
};

export default function TableExperiment() {
    // State for real data
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const perPage = 15;

    // Fetch Data Logic
    const fetchOrders = useCallback(async (pageNumber = 1) => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setLoading(false);
                return;
            }

            const params = new URLSearchParams({
                page: String(pageNumber),
                per_page: String(perPage),
            });

            const res = await fetch(`/api/sales/order?${params.toString()}`, {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

            const json = await res.json();

            if (json.success && json.data && Array.isArray(json.data)) {
                // Normalize data similar to main page
                const normalizedData = json.data.map((order) => {
                    const totalHarga = Number(order.total_harga || 0);
                    const totalPaid = Number(order.total_paid || 0);
                    const remaining = order.remaining !== undefined ? Number(order.remaining) : (totalHarga - totalPaid);

                    let statusPembayaran = order.status_pembayaran;
                    if (totalPaid >= totalHarga && totalHarga > 0) statusPembayaran = 2;
                    else if (totalPaid > 0 && totalPaid < totalHarga) statusPembayaran = 4;
                    else statusPembayaran = order.status_pembayaran ?? 0;

                    let statusOrder = order.status_order ?? order.status ?? "1";

                    return {
                        ...order,
                        status_pembayaran: statusPembayaran,
                        status_order: statusOrder,
                        total_paid: totalPaid,
                        remaining: remaining,
                    };
                });

                setOrders(normalizedData);
            } else {
                setOrders([]);
            }
        } catch (err) {
            console.error("Error fetching orders:", err);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders(1);
    }, [fetchOrders]);

    // Formatters
    const formatCurrency = (val) => {
        return "Rp " + Number(val || 0).toLocaleString("id-ID");
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const buildImageUrl = (path) => {
        if (!path) return null;
        const cleanPath = path.replace(/^\/?(storage\/)?/, "");
        return `/api/image?path=${encodeURIComponent(cleanPath)}`;
    };

    const getBuktiPembayaran = (order) => {
        if (!order.order_payment_rel || order.order_payment_rel.length === 0) return null;
        // Cari yang ada file bukti
        const paymentWithProof = order.order_payment_rel.find(p => p.bukti);
        return paymentWithProof ? paymentWithProof.bukti : null;
    };

    return (
        <div className="table-experiment-container">
            <div className="table-experiment-header">
                <h1>Table Experiment - Sticky Columns (Real Data)</h1>
                <p>Testing HTML table structure dengan sticky columns: Checkbox & Order ID (Kiri), Actions (Kanan)</p>
            </div>

            <div className="table-wrapper">
                <table className="table-orders">
                    <thead>
                        <tr>
                            {/* STICKY LEFT 1: Checkbox */}
                            <th className="sticky-left-1" style={{ width: '50px', minWidth: '50px' }}>
                                <input type="checkbox" className="checkbox-custom" />
                            </th>

                            {/* STICKY LEFT 2: Order ID */}
                            <th className="sticky-left-2">
                                Order ID
                            </th>

                            <th>Customer</th>
                            <th>Status (Order)</th>
                            <th>Payment Status</th>
                            <th>Store</th>
                            <th>Follow Up Text</th>
                            <th style={{ textAlign: 'center' }}>Proof of Payment</th>
                            <th>Gross Revenue</th>

                            {/* STICKY RIGHT: Action */}
                            <th className="sticky-right"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>Loading data...</td>
                            </tr>
                        ) : orders.length === 0 ? (
                            <tr>
                                <td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>Tidak ada data order.</td>
                            </tr>
                        ) : (
                            orders.map((order, index) => {
                                const customerNama = order.customer_rel?.nama || "-";
                                const customerEmail = order.customer_rel?.email || "-";
                                const customerPhone = order.customer_rel?.wa ? `+${order.customer_rel.wa}` : "-";
                                const statusOrderInfo = STATUS_ORDER_MAP[order.status_order] || STATUS_ORDER_MAP["1"];
                                const statusPaymentInfo = STATUS_PEMBAYARAN_MAP[order.status_pembayaran] || STATUS_PEMBAYARAN_MAP[0];
                                const buktiPath = getBuktiPembayaran(order);
                                const buktiUrl = buildImageUrl(buktiPath);
                                const sourceStore = order.source_transaksi || "Ternak Properti";

                                return (
                                    <tr key={order.id || index}>
                                        {/* STICKY LEFT 1: Checkbox */}
                                        <td className="sticky-left-1">
                                            <input type="checkbox" className="checkbox-custom" />
                                        </td>

                                        {/* STICKY LEFT 2: Order ID + External Link */}
                                        <td className="sticky-left-2">
                                            <div className="order-id-cell">
                                                <div className="order-id-content">
                                                    <div>
                                                        <a href={`/order/${order.id}`} className="order-id-link">
                                                            <p className="order-id-text">{order.id}</p>
                                                            <p className="order-date-text">{formatDate(order.tanggal || order.create_at)}</p>
                                                        </a>
                                                    </div>
                                                    <ExternalLink
                                                        size={16}
                                                        className="external-link-icon"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            window.open(`/sales/orders/${order.id}`, '_blank');
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </td>

                                        {/* SCROLLABLE COLUMNS */}
                                        <td>
                                            <div className="customer-cell">
                                                <p className="customer-name">{customerNama}</p>
                                                <p className="customer-detail">{customerEmail}</p>
                                                <p className="customer-detail">{customerPhone}</p>
                                            </div>
                                        </td>

                                        <td>
                                            <span className={`status-badge status-${statusOrderInfo.class}`}>
                                                {statusOrderInfo.label}
                                            </span>
                                        </td>

                                        <td>
                                            <span className={`status-badge payment-${statusPaymentInfo.class}`}>
                                                {statusPaymentInfo.label}
                                            </span>
                                        </td>

                                        <td>
                                            <p className="store-text">{sourceStore}</p>
                                        </td>

                                        <td>
                                            <WABubbleChat
                                                customerId={order.customer_id}
                                                orderId={order.id}
                                                orderStatus={order.status_order}
                                                statusPembayaran={order.status_pembayaran}
                                            />
                                        </td>

                                        <td style={{ textAlign: 'center' }}>
                                            {buktiUrl ? (
                                                <ImageIcon
                                                    size={20}
                                                    className="proof-icon"
                                                    onClick={() => window.open(buktiUrl, '_blank')}
                                                />
                                            ) : (
                                                <span className="no-data">-</span>
                                            )}
                                        </td>

                                        <td className="revenue-text">
                                            {formatCurrency(order.total_harga || 0)}
                                        </td>

                                        {/* STICKY RIGHT COLUMN: Actions */}
                                        <td className="sticky-right">
                                            <div className="action-menu">
                                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="action-icon">
                                                    <circle cx="10" cy="10" r="1.5" fill="currentColor" />
                                                    <circle cx="10" cy="4" r="1.5" fill="currentColor" />
                                                    <circle cx="10" cy="16" r="1.5" fill="currentColor" />
                                                </svg>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <div className="instructions">
                <h3>Fitur Table:</h3>
                <ul>
                    <li>✅ <b>Data Real:</b> Data diambil dari API `/api/sales/order`</li>
                    <li>✅ <b>Sticky Left 1:</b> Kolom Checkbox statis di kiri</li>
                    <li>✅ <b>Sticky Left 2:</b> Kolom Order ID statis di sebelah checkbox</li>
                    <li>✅ <b>Sticky Right:</b> Kolom Action (...) statis di kanan</li>
                    <li>✅ <b>Scrollable:</b> Kolom tengah bisa discroll horizontal</li>
                </ul>
            </div>
        </div>
    );
}

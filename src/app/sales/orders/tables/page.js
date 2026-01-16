"use client";

import { useEffect, useState } from "react";
import "../table/table-orders.css"; // Reuse existing CSS
import { ExternalLink, Image as ImageIcon } from "lucide-react";

// --- Mock WABubbleChat for Dummy Data ---
// Removed API calls, just renders static status
const WABubbleChat = ({ orderStatus, statusPembayaran }) => {

    // Bubble definitions
    const bubbles = [
        { type: "W", label: "W" },
        { type: "1", label: "1" },
        { type: "2", label: "2" },
        { type: "3", label: "3" },
        { type: "4", label: "4" },
    ];

    const getBubbleClass = (type) => {
        // Randomly activate some bubbles for dummy effect
        // specific logic: W always active. 
        if (type === "W") return "wa-bubble active";
        if (type === "1") return "wa-bubble active";

        return "wa-bubble inactive";
    };

    return (
        <div className="follow-up-container">
            <div className={`wa-bubble-icon active`}>
                <i className="pi pi-whatsapp" style={{ fontSize: '14px' }}></i>
            </div>
            {bubbles.map((b) => (
                <div key={b.type} className={getBubbleClass(b.type)}>
                    {b.label}
                </div>
            ))}
            <div className="wa-bubble menu">
                <span>⋮</span>
            </div>
        </div>
    );
};

// --- Constants ---
const STATUS_PEMBAYARAN_MAP = {
    0: { label: "Unpaid", class: "unpaid" },
    1: { label: "Pending", class: "pending" },
    2: { label: "Paid", class: "paid" },
    3: { label: "Ditolak", class: "rejected" },
    4: { label: "DP", class: "dp" },
};

const STATUS_ORDER_MAP = {
    "1": { label: "Pending", class: "pending" },
    "2": { label: "Sukses", class: "sukses" },
    "3": { label: "Failed", class: "failed" },
    "4": { label: "Dihapus", class: "dihapus" },
};

// --- Helper Functions ---
const formatOrderDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

// Dummy Data
const DUMMY_ORDERS = [
    {
        id: "ORD-2024001",
        tanggal: "2024-01-14T09:00:00",
        customer_rel: {
            id: 101,
            nama: "Andi Wijaya",
            wa: "62812345678",
            sales_rel: { nama: "Sales Team A" }
        },
        produk_rel: { nama: "Paket Premium A" },
        status_pembayaran: 2, // Paid
        status: "2", // Sukses
        total_harga: 1500000,
        bukti_pembayaran: "https://via.placeholder.com/150"
    },
    {
        id: "ORD-2024002",
        tanggal: "2024-01-15T10:30:00",
        customer_rel: {
            id: 102,
            nama: "Budi Santoso",
            wa: "62898765432",
            sales_rel: { nama: "Sales Team B" }
        },
        produk_rel: { nama: "Paket Basic" },
        status_pembayaran: 0, // Unpaid
        status: "1", // Pending
        total_harga: 500000,
        bukti_pembayaran: null
    },
    {
        id: "ORD-2024003",
        tanggal: "2024-01-16T14:15:00",
        customer_rel: {
            id: 103,
            nama: "Citra Lestari",
            wa: "62855512345",
            sales_rel: { nama: "Sales Team A" }
        },
        produk_rel: { nama: "Paket Gold" },
        status_pembayaran: 1, // Pending
        status: "1", // Pending
        total_harga: 2500000,
        bukti_pembayaran: "https://via.placeholder.com/150"
    },
    {
        id: "ORD-2024004",
        tanggal: "2024-01-16T16:00:00",
        customer_rel: {
            id: 104,
            nama: "Dewi Putri",
            wa: "62811223344",
            sales_rel: { nama: "Sales Team C" }
        },
        produk_rel: { nama: "Paket Trial" },
        status_pembayaran: 3, // Ditolak
        status: "3", // Failed
        total_harga: 100000,
        bukti_pembayaran: "https://via.placeholder.com/150"
    },
    {
        id: "ORD-2024005",
        tanggal: "2024-01-17T08:45:00",
        customer_rel: {
            id: 105,
            nama: "Eko Prasetyo",
            wa: "62877889900",
            sales_rel: { nama: "Sales Team A" }
        },
        produk_rel: { nama: "Paket Premium B" },
        status_pembayaran: 4, // DP
        status: "1", // Pending
        total_harga: 750000,
        bukti_pembayaran: "https://via.placeholder.com/150"
    }
];

export default function DummyTablePage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate loading
        const timer = setTimeout(() => {
            setOrders(DUMMY_ORDERS);
            setLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    // Placeholder handlers
    const handleView = (order) => { console.log("View", order.id); };
    const handleEdit = (order) => { console.log("Edit", order.id); };
    const handleOpenImageModal = (url) => { window.open(url, "_blank"); };

    return (
        <div className="table-experiment-container" style={{ padding: '20px' }}>
            <div className="table-experiment-header">
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Dummy Orders Table</h1>
                <p style={{ marginBottom: '1rem', color: '#666' }}>This table displays hardcoded dummy data for testing purposes.</p>
            </div>

            <div className="table-wrapper">
                <table className="table-orders">
                    <thead>
                        <tr>
                            {/* Sticky left 1: Checkbox */}
                            <th className="sticky-left-1" style={{ width: '50px', minWidth: '50px' }}>
                                <input type="checkbox" className="checkbox-custom" />
                            </th>

                            {/* Sticky left 2: Order ID */}
                            <th className="sticky-left-2">Order ID</th>

                            <th>Customer</th>
                            <th>Produk</th>
                            <th>Status Pembayaran</th>
                            <th>Status Order</th>
                            <th>Follow Up Text</th>
                            <th style={{ textAlign: 'center' }}>Bukti Pembayaran</th>
                            <th>Gross Revenue</th>
                            <th>Sales</th>

                            {/* Sticky right: Action */}
                            <th className="sticky-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="11" style={{ textAlign: 'center', padding: '2rem' }}>Loading Dummy Data...</td></tr>
                        ) : orders.length === 0 ? (
                            <tr><td colSpan="11" style={{ textAlign: 'center', padding: '2rem' }}>No orders found.</td></tr>
                        ) : (
                            orders.map((order, index) => {
                                const produkNama = order.produk_rel?.nama || "-";
                                const customerNama = order.customer_rel?.nama || "-";

                                const statusOrderRaw = order.status;
                                const statusOrderInfo = STATUS_ORDER_MAP[statusOrderRaw] || { label: "-", class: "default" };

                                const statusPembayaranInfo = STATUS_PEMBAYARAN_MAP[Number(order.status_pembayaran) || 0];

                                return (
                                    <tr key={order.id || index}>
                                        {/* Sticky left 1: Checkbox */}
                                        <td className="sticky-left-1">
                                            <input type="checkbox" className="checkbox-custom" />
                                        </td>

                                        {/* Sticky left 2: Order ID + External Link */}
                                        <td className="sticky-left-2">
                                            <div className="order-id-cell">
                                                <div className="order-id-content">
                                                    <div>
                                                        <a href="#" className="order-id-link" onClick={(e) => e.preventDefault()}>
                                                            <p className="order-id-text">{order.id}</p>
                                                            <p className="order-date-text">{formatOrderDate(order.tanggal)}</p>
                                                        </a>
                                                    </div>
                                                    <ExternalLink
                                                        size={16}
                                                        className="external-link-icon"
                                                        onClick={(e) => { e.stopPropagation(); handleView(order); }}
                                                    />
                                                </div>
                                            </div>
                                        </td>

                                        {/* Scrollable Columns */}
                                        <td>
                                            <div className="customer-cell">
                                                <span className="customer-name">{customerNama}</span>
                                                <span className="customer-detail">{order.customer_rel?.wa ? `+${order.customer_rel.wa}` : "-"}</span>
                                            </div>
                                        </td>

                                        <td>{produkNama}</td>

                                        <td>
                                            <span className={`status-badge payment-${statusPembayaranInfo.class}`}>
                                                {statusPembayaranInfo.label}
                                            </span>
                                        </td>

                                        <td>
                                            <span className={`status-badge status-${statusOrderInfo.class}`}>
                                                {statusOrderInfo.label}
                                            </span>
                                        </td>

                                        <td>
                                            <WABubbleChat
                                                orderStatus={order.status}
                                                statusPembayaran={order.status_pembayaran}
                                            />
                                        </td>

                                        <td style={{ textAlign: 'center' }}>
                                            {order.bukti_pembayaran ? (
                                                <ImageIcon size={20} className="proof-icon" onClick={() => handleOpenImageModal(order.bukti_pembayaran)} />
                                            ) : <span className="no-data">-</span>}
                                        </td>

                                        <td className="revenue-text">
                                            Rp {Number(order.total_harga || 0).toLocaleString("id-ID")}
                                        </td>

                                        <td>
                                            {order.customer_rel?.sales_rel?.nama || "-"}
                                        </td>

                                        {/* Sticky Right: Action */}
                                        <td className="sticky-right">
                                            <div className="action-menu">
                                                <button
                                                    style={{
                                                        padding: "0.4rem 0.75rem",
                                                        fontSize: "0.8rem",
                                                        whiteSpace: "nowrap",
                                                        background: "#f1a124",
                                                        color: "white",
                                                        border: "none",
                                                        borderRadius: "0.5rem",
                                                        cursor: "pointer"
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEdit(order);
                                                    }}
                                                >
                                                    Action
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

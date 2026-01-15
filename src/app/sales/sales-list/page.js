"use client";

import { useEffect, useState, useMemo } from "react";
import Layout from "@/components/Layout";
import dynamic from "next/dynamic";
import "@/styles/sales/admin.css";
import "@/styles/sales/shared-table.css";
import "./sales-list.css";

// Dynamic import for modals to ensure client-side rendering
const AddSalesModal = dynamic(() => import("./addSales"), { ssr: false });
const EditSalesModal = dynamic(() => import("./editSales"), { ssr: false });
const DeleteSalesModal = dynamic(() => import("./deleteSales"), { ssr: false });

export default function SalesListPage() {
    const [salesData, setSalesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
    const [search, setSearch] = useState("");

    // Modal states
    const [showAdd, setShowAdd] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [selectedSales, setSelectedSales] = useState(null);

    const fetchSalesData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const res = await fetch("/api/sales/sales-list", {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const json = await res.json();
                if (json.success && Array.isArray(json.data)) {
                    setSalesData(json.data);

                    // Client-side stats calculation
                    const total = json.data.length;
                    const active = json.data.filter(item => item.user_rel?.status === "1").length;
                    setStats({
                        total: total,
                        active: active,
                        inactive: total - active
                    });
                }
            }
        } catch (err) {
            console.error("Error fetching sales list:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSalesData();
    }, []);

    const handleAddSuccess = () => {
        setShowAdd(false);
        fetchSalesData();
    };

    const handleEdit = (item) => {
        setSelectedSales(item);
        setShowEdit(true);
    };

    const handleEditSuccess = () => {
        setShowEdit(false);
        setSelectedSales(null);
        fetchSalesData();
    };

    const handleDelete = (item) => {
        setSelectedSales(item);
        setShowDelete(true);
    };

    const handleDeleteSuccess = () => {
        setShowDelete(false);
        setSelectedSales(null);
        fetchSalesData();
    };


    const formatDate = (dateString) => {
        if (!dateString) return "-";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("id-ID", {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateString;
        }
    };

    // Filter displayed data based on search
    const filteredData = useMemo(() => {
        if (!search) return salesData;
        const lowerSearch = search.toLowerCase();
        return salesData.filter(item =>
            item.user_rel?.nama?.toLowerCase().includes(lowerSearch) ||
            item.user_rel?.email?.toLowerCase().includes(lowerSearch)
        );
    }, [search, salesData]);

    return (
        <Layout title="Sales Team Management">
            <div className="dashboard-shell table-shell">
                {/* Hero / Toolbar */}
                <section className="dashboard-hero">
                    <div className="customers-toolbar" style={{ display: 'flex', width: '100%', marginBottom: '1.5rem' }}>
                        <div className="customers-search" style={{ position: 'relative', maxWidth: '400px', width: '100%' }}>
                            <input
                                type="search"
                                placeholder="Cari nama atau email..."
                                className="customers-search__input"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem 0.75rem 0.75rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '0.875rem'
                                }}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </section>

                {/* Main Panel & Table */}
                <section className="panel">
                    <div className="panel__header">
                        <div>
                            <p className="panel__eyebrow">Team Management</p>
                            <h3 className="panel__title">Daftar Sales</h3>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                className="customers-button customers-button--primary"
                                onClick={() => setShowAdd(true)}
                                style={{
                                    background: '#fb8500',
                                    color: 'white',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '0.5rem',
                                    fontWeight: 600,
                                    fontSize: '0.875rem',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                + Tambah Sales
                            </button>
                        </div>
                    </div>

                    <div className="table-wrapper sales-list-table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Urutan</th>
                                    <th>Nama Sales</th>
                                    <th>Email</th>
                                    <th>Woowa Key</th>
                                    <th>Last Update Lead</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="table-empty">Loading data...</td>
                                    </tr>
                                ) : filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="table-empty">Tidak ada data sales ditemukan.</td>
                                    </tr>
                                ) : (
                                    filteredData.map((item) => (
                                        <tr key={item.id}>
                                            <td>
                                                <span style={{ fontWeight: 500, color: '#475569' }}>
                                                    {item.urutan || "-"}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{ fontWeight: 600, color: '#0f172a' }}>
                                                    {item.user_rel?.nama || "-"}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ color: '#475569' }}>{item.user_rel?.email || "-"}</div>
                                            </td>
                                            <td>
                                                {item.woowa_key ? (
                                                    <div style={{
                                                        fontFamily: 'monospace',
                                                        background: '#f8fafc',
                                                        padding: '0.25rem 0.5rem',
                                                        borderRadius: '0.25rem',
                                                        fontSize: '0.75rem',
                                                        color: '#475569',
                                                        border: '1px solid #cbd5e1',
                                                        display: 'inline-block',
                                                        maxWidth: '200px',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }} title={item.woowa_key}>
                                                        {item.woowa_key}
                                                    </div>
                                                ) : (
                                                    <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Not Configured</span>
                                                )}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569' }}>
                                                    <span>{formatDate(item.last_update_lead)}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        className="table-shell action-btn action-btn--primary"
                                                        title="Edit"
                                                        onClick={() => handleEdit(item)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="table-shell action-btn action-btn--danger"
                                                        title="Delete"
                                                        onClick={() => handleDelete(item)}
                                                    >
                                                        Hapus
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination - Visual Placeholder matching image style */}
                    <div className="customers-pagination" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem", padding: "1.5rem", flexWrap: "wrap", borderTop: "1px solid #e2e8f0" }}>
                        <button
                            className="customers-pagination__btn"
                            disabled
                            style={{
                                padding: "0.5rem 1rem",
                                minWidth: "100px",
                                background: "#e5e7eb",
                                color: "#9ca3af",
                                border: "none",
                                borderRadius: "0.5rem",
                                cursor: "not-allowed",
                                fontWeight: 600,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}
                        >
                            Previous
                        </button>

                        <div style={{
                            fontSize: "0.9rem",
                            color: "#475569",
                            fontWeight: 500
                        }}>
                            Page 1 of 1 ({salesData.length} total)
                        </div>

                        <button
                            className="customers-pagination__btn"
                            disabled
                            style={{
                                padding: "0.5rem 1rem",
                                minWidth: "100px",
                                background: "#e5e7eb",
                                color: "#9ca3af",
                                border: "none",
                                borderRadius: "0.5rem",
                                cursor: "not-allowed",
                                fontWeight: 600,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}
                        >
                            Next
                        </button>
                    </div>
                </section>

                {/* Modals */}
                {showAdd && (
                    <AddSalesModal
                        onClose={() => setShowAdd(false)}
                        onSuccess={handleAddSuccess}
                    />
                )}

                {showEdit && selectedSales && (
                    <EditSalesModal
                        sales={selectedSales}
                        onClose={() => {
                            setShowEdit(false);
                            setSelectedSales(null);
                        }}
                        onSuccess={handleEditSuccess}
                    />
                )}

                {showDelete && selectedSales && (
                    <DeleteSalesModal
                        sales={selectedSales}
                        onClose={() => {
                            setShowDelete(false);
                            setSelectedSales(null);
                        }}
                        onSuccess={handleDeleteSuccess}
                    />
                )}
            </div>
        </Layout>
    );
}

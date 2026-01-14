"use client";

import { useEffect, useState, useMemo } from "react";
import Layout from "@/components/Layout";
import {

    XCircle,
    Search,
    Edit2,
    Trash2,
    Database
} from "lucide-react";

import "@/styles/sales/dashboard-premium.css";
import "@/styles/sales/admin.css";
import "@/styles/sales/shared-table.css";
import "./sales-list.css";

export default function SalesListPage() {
    const [salesData, setSalesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
    const [search, setSearch] = useState("");

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
                    // Assuming user_rel.status "1" is active
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
                {/* Stats Summary Cards */}
                <section className="dashboard-summary">
                    <article className="summary-card summary-card--combined summary-card--three-cols">
                        <div className="summary-card__column">
                            <div className="summary-card__icon accent-blue">
                                <Users size={22} />
                            </div>
                            <div>
                                <p className="summary-card__label">Total Sales</p>
                                <p className="summary-card__value">{stats.total}</p>
                            </div>
                        </div>
                        <div className="summary-card__divider"></div>
                        <div className="summary-card__column">
                            <div className="summary-card__icon accent-emerald">
                                <CheckCircle size={22} />
                            </div>
                            <div>
                                <p className="summary-card__label">Active</p>
                                <p className="summary-card__value">{stats.active}</p>
                            </div>
                        </div>
                        <div className="summary-card__divider"></div>
                        <div className="summary-card__column">
                            <div className="summary-card__icon accent-red">
                                <XCircle size={22} />
                            </div>
                            <div>
                                <p className="summary-card__label">Inactive</p>
                                <p className="summary-card__value">{stats.inactive}</p>
                            </div>
                        </div>
                    </article>
                </section>

                {/* Hero / Toolbar */}
                <section className="dashboard-hero">
                    <div className="customers-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '1.5rem' }}>
                        <div className="customers-search" style={{ position: 'relative', maxWidth: '400px', width: '100%' }}>
                            <input
                                type="search"
                                placeholder="Cari nama atau email..."
                                className="customers-search__input"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '0.875rem'
                                }}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        </div>
                        <button className="customers-button customers-button--primary" style={{
                            background: '#0f172a',
                            color: 'white',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.5rem',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            border: 'none',
                            cursor: 'pointer'
                        }}>
                            + Tambah Sales
                        </button>
                    </div>
                </section>

                {/* Main Panel & Table */}
                <section className="panel">
                    <div className="panel__header">
                        <div>
                            <p className="panel__eyebrow">Team Management</p>
                            <h3 className="panel__title">Daftar Sales</h3>
                        </div>
                    </div>

                    <div className="table-wrapper sales-list-table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
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
                                        <td colSpan="5" className="table-empty">Loading data...</td>
                                    </tr>
                                ) : filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="table-empty">Tidak ada data sales ditemukan.</td>
                                    </tr>
                                ) : (
                                    filteredData.map((item) => (
                                        <tr key={item.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '50%',
                                                        background: '#f1f5f9',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: '#64748b'
                                                    }}>
                                                        <User size={16} />
                                                    </div>
                                                    <div>
                                                        <span style={{ display: 'block', fontWeight: 600, color: '#0f172a' }}>
                                                            {item.user_rel?.nama || "-"}
                                                        </span>
                                                        {item.urutan && (
                                                            <span style={{ fontSize: '0.7rem', color: '#64748b', background: '#f8fafc', padding: '1px 6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                                                Urutan: {item.urutan}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
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
                                                    <Database size={14} />
                                                    <span>{formatDate(item.last_update_lead)}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        className="table-shell action-btn action-btn--primary"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        className="table-shell action-btn action-btn--danger"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </Layout>
    );
}

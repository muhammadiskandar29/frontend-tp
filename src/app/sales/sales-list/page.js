"use client";

import "@/styles/sales/dashboard-premium.css";
import "@/styles/sales/shared-table.css"; // Use shared table styles
import "./sales-list.css";
import Layout from "@/components/Layout";
import { Edit2, Trash2, Search, User, Mail, Phone, Briefcase, Calendar } from "lucide-react";
import { useState, useEffect } from "react";

export default function SalesListPage() {
    const [salesData, setSalesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSalesData = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("token");
                // Note: In a real app, you might need to handle token absence

                const res = await fetch("/api/sales/sales-list", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (!res.ok) {
                    throw new Error(`Error fetching data: ${res.statusText}`);
                }

                const json = await res.json();
                if (json.success && Array.isArray(json.data)) {
                    setSalesData(json.data);
                } else {
                    console.warn("Unexpected API response format:", json);
                    setSalesData([]);
                }

            } catch (err) {
                console.error("Failed to fetch sales list:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSalesData();
    }, []);

    const handleEdit = (id) => {
        console.log("Edit sales with id:", id);
        // Add edit logic here
    };

    const handleDelete = (id) => {
        console.log("Delete sales with id:", id);
        if (confirm("Are you sure you want to delete this sales?")) {
            // Add delete logic here
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("id-ID", {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    };

    return (
        <Layout title="Daftar Sales">
            <div className="dashboard-shell table-shell" style={{ padding: '2rem' }}>
                <div className="sales-list-header">
                    <h1>Sales Team</h1>
                    <p>Manage your sales team members and their configurations.</p>
                </div>

                <div className="table-wrapper sales-list-table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nama Sales</th>
                                <th>Email</th>
                                <th>No WA</th>
                                <th>Profesi</th>
                                <th>Terdaftar</th>
                                {/* Status is common in sales lists, showing if active */}
                                {/* Based on data 'status': "1" usually means active */}
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="table-empty">Loading sales data...</td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan="6" className="table-empty" style={{ color: 'red' }}>Error: {error}</td>
                                </tr>
                            ) : salesData.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="table-empty">Tidak ada data sales.</td>
                                </tr>
                            ) : (
                                salesData.map((sales, index) => (
                                    <tr key={sales.id || index}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '50%',
                                                    background: '#e0f2fe',
                                                    color: '#0284c7',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <User size={16} />
                                                </div>
                                                <div>
                                                    <span style={{ display: 'block', fontWeight: 600, color: '#0f172a' }}>{sales.nama}</span>
                                                    {sales.nama_panggilan && <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({sales.nama_panggilan})</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
                                                <Mail size={14} />
                                                <span>{sales.email || "-"}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
                                                <Phone size={14} />
                                                <span>{sales.wa || "-"}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
                                                <Briefcase size={14} />
                                                <span style={{ textTransform: 'capitalize' }}>{sales.profesi || "-"}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
                                                <Calendar size={14} />
                                                <span>{formatDate(sales.create_at)}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`sales-badge ${sales.status === "1" ? "active" : "inactive"}`}>
                                                {sales.status === "1" ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="table-shell action-btn action-btn--primary"
                                                    onClick={() => handleEdit(sales.id)}
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    className="table-shell action-btn action-btn--danger"
                                                    onClick={() => handleDelete(sales.id)}
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
            </div>
        </Layout>
    );
}

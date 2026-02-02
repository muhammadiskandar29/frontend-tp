"use client";

import { useState, useEffect } from "react";
import { X, Calendar as CalendarIcon, Search } from "lucide-react";
import { Calendar } from "primereact/calendar";
import "@/styles/sales/customer.css"; // Reuse styling for consistency

export default function FilterOrdersModal({
    onClose,
    onApply,
    currentFilters,
    onSearchProducts,
    productResults = []
}) {
    // Local state for filters
    const [filterState, setFilterState] = useState({
        dateRange: currentFilters.dateRange || null,
        statusOrder: currentFilters.statusOrder || [],
        statusPembayaran: currentFilters.statusPembayaran || [],
        products: currentFilters.products || [], // Array of IDs
    });

    // Local state for UI
    const [productSearch, setProductSearch] = useState("");
    const [selectedProductData, setSelectedProductData] = useState([]); // To show selected badges

    // Status Options
    const STATUS_ORDER_OPTIONS = [
        { value: "1", label: "Pending", color: "#f59e0b" },
        { value: "2", label: "Processing", color: "#3b82f6" },
        { value: "3", label: "Failed", color: "#ef4444" },
        { value: "4", label: "Completed", color: "#10b981" },
        { value: "N", label: "Deleted", color: "#64748b" },
    ];

    const STATUS_PEMBAYARAN_OPTIONS = [
        { value: "0", label: "Unpaid", color: "#94a3b8" },
        { value: "1", label: "Waiting Approval", color: "#f59e0b" },
        { value: "2", label: "Paid", color: "#10b981" },
        { value: "3", label: "Rejected", color: "#ef4444" },
        { value: "4", label: "Partial Payment", color: "#8b5cf6" },
    ];

    // Handle Search Product
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (onSearchProducts && productSearch.trim().length >= 2) {
                onSearchProducts(productSearch);
            }
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [productSearch, onSearchProducts]);

    const handleCheckboxChange = (field, value) => {
        setFilterState(prev => {
            const current = [...prev[field]];
            if (current.includes(value)) {
                return { ...prev, [field]: current.filter(item => item !== value) };
            } else {
                return { ...prev, [field]: [...current, value] };
            }
        });
    };

    const handleProductToggle = (product) => {
        const productId = product.id;

        setFilterState(prev => {
            const current = [...prev.products];
            if (current.includes(productId)) {
                return { ...prev, products: current.filter(id => id !== productId) };
            } else {
                return { ...prev, products: [...current, productId] };
            }
        });

        // Maintain local data for display
        setSelectedProductData(prev => {
            if (prev.find(p => p.id === productId)) {
                return prev.filter(p => p.id !== productId);
            }
            return [...prev, product];
        });
    };

    const handleApply = () => {
        onApply(filterState);
        onClose();
    };

    const handleReset = () => {
        setFilterState({
            dateRange: null,
            statusOrder: [],
            statusPembayaran: [],
            products: [],
        });
        setProductSearch("");
        setSelectedProductData([]); // Should reset logic if complex
    };

    return (
        <div className="modal-overlay">
            <div className="modal-card" style={{ maxWidth: "600px", borderRadius: "12px", overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
                {/* HEADER */}
                <div className="modal-header" style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                        <Search size={18} />
                        Filter Pesanan (Staff)
                    </h2>
                    <button className="modal-close" onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer" }}>
                        <X size={20} color="#64748b" />
                    </button>
                </div>

                {/* BODY */}
                <div className="modal-body" style={{ padding: "20px", overflowY: "auto", flex: 1 }}>
                    <div className="form-grid" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

                        {/* Date Range */}
                        <div className="form-group">
                            <label style={{ fontSize: "0.9rem", fontWeight: 600, color: "#334155", marginBottom: "8px", display: "block" }}>
                                Rentang Tanggal
                            </label>
                            <Calendar
                                value={filterState.dateRange}
                                onChange={(e) => setFilterState(prev => ({ ...prev, dateRange: e.value }))}
                                selectionMode="range"
                                readOnlyInput
                                showIcon
                                placeholder="Pilih rentang tanggal"
                                dateFormat="dd M yyyy"
                                style={{ width: "100%" }}
                                inputStyle={{ borderRadius: "6px" }}
                            />
                        </div>

                        {/* Status Order */}
                        <div className="form-group">
                            <label style={{ fontSize: "0.9rem", fontWeight: 600, color: "#334155", marginBottom: "8px", display: "block" }}>
                                Status Order
                            </label>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                {STATUS_ORDER_OPTIONS.map(opt => (
                                    <label
                                        key={opt.value}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            padding: "6px 12px",
                                            border: `1px solid ${filterState.statusOrder.includes(opt.value) ? opt.color : "#e2e8f0"}`,
                                            borderRadius: "20px",
                                            cursor: "pointer",
                                            fontSize: "0.85rem",
                                            background: filterState.statusOrder.includes(opt.value) ? `${opt.color}15` : "white",
                                            color: filterState.statusOrder.includes(opt.value) ? opt.color : "#64748b",
                                            transition: "all 0.2s"
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={filterState.statusOrder.includes(opt.value)}
                                            onChange={() => handleCheckboxChange("statusOrder", opt.value)}
                                            style={{ display: "none" }}
                                        />
                                        {opt.label}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Status Pembayaran */}
                        <div className="form-group">
                            <label style={{ fontSize: "0.9rem", fontWeight: 600, color: "#334155", marginBottom: "8px", display: "block" }}>
                                Status Pembayaran
                            </label>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                {STATUS_PEMBAYARAN_OPTIONS.map(opt => (
                                    <label
                                        key={opt.value}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            padding: "6px 12px",
                                            border: `1px solid ${filterState.statusPembayaran.includes(opt.value) ? opt.color : "#e2e8f0"}`,
                                            borderRadius: "20px",
                                            cursor: "pointer",
                                            fontSize: "0.85rem",
                                            background: filterState.statusPembayaran.includes(opt.value) ? `${opt.color}15` : "white",
                                            color: filterState.statusPembayaran.includes(opt.value) ? opt.color : "#64748b",
                                            transition: "all 0.2s"
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={filterState.statusPembayaran.includes(opt.value)}
                                            onChange={() => handleCheckboxChange("statusPembayaran", opt.value)}
                                            style={{ display: "none" }}
                                        />
                                        {opt.label}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Product Filter */}
                        <div className="form-group">
                            <label style={{ fontSize: "0.9rem", fontWeight: 600, color: "#334155", marginBottom: "8px", display: "block" }}>
                                Filter Produk
                            </label>
                            <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
                                <div style={{ padding: "8px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
                                    <input
                                        type="text"
                                        placeholder="Cari produk..."
                                        value={productSearch}
                                        onChange={(e) => setProductSearch(e.target.value)}
                                        style={{ width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.85rem", outline: "none" }}
                                    />
                                </div>
                                <div style={{ maxHeight: "150px", overflowY: "auto" }}>
                                    {productResults.length > 0 ? productResults.map(product => (
                                        <label key={product.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderBottom: "1px solid #f1f5f9", cursor: "pointer", fontSize: "0.9rem", color: "#334155", background: filterState.products.includes(product.id) ? "#f0f9ff" : "transparent" }}>
                                            <input
                                                type="checkbox"
                                                checked={filterState.products.includes(product.id)}
                                                onChange={() => handleProductToggle(product)}
                                                style={{ accentColor: "#3b82f6" }}
                                            />
                                            {product.nama}
                                        </label>
                                    )) : (
                                        <div style={{ padding: "15px", textAlign: "center", color: "#94a3b8", fontSize: "0.85rem" }}>
                                            {productSearch.length < 2 ? "Ketik minimal 2 karakter" : "Tidak ditemukan"}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Selected Products Badges */}
                            {filterState.products.length > 0 && (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
                                    <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Terpilih ({filterState.products.length}):</span>
                                    {/* We might not have names for all IDs if they were selected previously and not in search results. 
                                        Ideally we should pass selectedProductsData to this component. 
                                        For now, just show count or rely on current results + memory logic in parent */}
                                </div>
                            )}
                        </div>

                    </div>
                </div>

                {/* FOOTER */}
                <div className="modal-footer" style={{ borderTop: "1px solid #f1f5f9", padding: "16px 20px", display: "flex", justifyContent: "space-between", gap: "12px", background: "white" }}>
                    <button
                        type="button"
                        onClick={handleReset}
                        style={{
                            padding: "8px 16px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            background: "white",
                            color: "#475569",
                            fontWeight: 600,
                            cursor: "pointer",
                            fontSize: "0.9rem",
                            display: "flex", alignItems: "center", gap: "6px"
                        }}
                    >
                        <X size={16} /> Reset
                    </button>
                    <button
                        type="button"
                        onClick={handleApply}
                        style={{
                            padding: "8px 24px",
                            borderRadius: "6px",
                            border: "none",
                            background: "#3b82f6",
                            color: "white",
                            fontWeight: 600,
                            cursor: "pointer",
                            fontSize: "0.9rem",
                            boxShadow: "0 2px 4px rgba(59, 130, 246, 0.2)"
                        }}
                    >
                        Terapkan Filter
                    </button>
                </div>
            </div>
        </div>
    );
}

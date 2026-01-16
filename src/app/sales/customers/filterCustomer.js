"use client";

import { useState } from "react";
import "@/styles/sales/customer.css";
import { X } from "lucide-react";

export default function FilterCustomerModal({ onClose, onApply, currentFilters, salesOptions }) {
    const [filterState, setFilterState] = useState({
        verifikasi: currentFilters.verifikasi || "all",
        sales_id: currentFilters.sales_id || "all",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilterState(prev => ({ ...prev, [name]: value }));
    };

    const handleApply = () => {
        onApply(filterState);
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-card" style={{ maxWidth: "400px" }}>
                {/* HEADER */}
                <div className="modal-header">
                    <h2>Filter Customer</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* BODY */}
                <div className="modal-body">
                    <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>

                        {/* Verifikasi Filter */}
                        <div className="form-group">
                            <label>Status Verifikasi</label>
                            <select
                                name="verifikasi"
                                value={filterState.verifikasi}
                                onChange={handleChange}
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    borderRadius: "6px",
                                    border: "1px solid #d1d5db",
                                    backgroundColor: "white"
                                }}
                            >
                                <option value="all">Semua Status</option>
                                <option value="verified">Verified</option>
                                <option value="unverified">Unverified</option>
                            </select>
                        </div>

                        {/* Sales Filter */}
                        <div className="form-group">
                            <label>Sales Handling</label>
                            <select
                                name="sales_id"
                                value={filterState.sales_id}
                                onChange={handleChange}
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    borderRadius: "6px",
                                    border: "1px solid #d1d5db",
                                    backgroundColor: "white"
                                }}
                            >
                                <option value="all">Semua Sales</option>
                                {salesOptions && salesOptions.map(sales => (
                                    <option key={sales.id} value={sales.id}>
                                        {sales.text}
                                    </option>
                                ))}
                            </select>
                        </div>

                    </div>
                </div>

                {/* FOOTER */}
                <div className="modal-footer">
                    <button
                        type="button"
                        className="btn-cancel"
                        onClick={onClose}
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        className="btn-save"
                        onClick={handleApply}
                        style={{ backgroundColor: "#f97316" }} // Orange color per request context
                    >
                        Terapkan Filter
                    </button>
                </div>

            </div>
        </div>
    );
}

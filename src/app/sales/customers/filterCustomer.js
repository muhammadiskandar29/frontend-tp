"use client";

import { useState } from "react";
import "@/styles/sales/customer.css";
import { X } from "lucide-react";

export default function FilterCustomerModal({ onClose, onApply, currentFilters, salesOptions }) {
    const [filterState, setFilterState] = useState({
        verifikasi: currentFilters.verifikasi === "all" ? ["verified", "unverified"] : (Array.isArray(currentFilters.verifikasi) ? currentFilters.verifikasi : [currentFilters.verifikasi]),
        sales_id: currentFilters.sales_id || "all",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilterState(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (value) => {
        setFilterState(prev => {
            const current = [...prev.verifikasi];
            if (current.includes(value)) {
                return { ...prev, verifikasi: current.filter(item => item !== value) };
            } else {
                return { ...prev, verifikasi: [...current, value] };
            }
        });
    };

    const handleApply = () => {
        // Convert array back to "all", "verified", "unverified" or "" for parent logic compatibility
        // Or keep parent logic flexible. Assuming parent expects "all", "verified", "unverified"
        let verifikasiValue = "all";
        if (filterState.verifikasi.length === 2) verifikasiValue = "all";
        else if (filterState.verifikasi.length === 0) verifikasiValue = "none"; // Should handle this case
        else verifikasiValue = filterState.verifikasi[0];

        onApply({ ...filterState, verifikasi: verifikasiValue });
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

                        {/* Verifikasi Filter - Checkbox */}
                        <div className="form-group">
                            <label>Status Verifikasi</label>
                            <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", cursor: "pointer" }}>
                                    <input
                                        type="checkbox"
                                        checked={filterState.verifikasi.includes("verified")}
                                        onChange={() => handleCheckboxChange("verified")}
                                    />
                                    Verified
                                </label>
                                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", cursor: "pointer" }}>
                                    <input
                                        type="checkbox"
                                        checked={filterState.verifikasi.includes("unverified")}
                                        onChange={() => handleCheckboxChange("unverified")}
                                    />
                                    Unverified
                                </label>
                            </div>
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

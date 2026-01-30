import { Package } from "lucide-react";

export default function ProductPerformance({ productStats, productSummary, loading }) {
    return (
        <section className="dashboard-panels" style={{ marginTop: '1rem' }}>
            <article className="panel">
                <div className="panel__header">
                    <div>
                        <p className="panel__eyebrow">Product Performance</p>
                        <h3 className="panel__title">Statistik Produk Terlaris Anda</h3>
                        <p className="panel__subtitle">Analisis performa penjualan berdasarkan kategori produk</p>
                    </div>
                    {productSummary && (
                        <div className="summary-pills">
                            <div className="pill">
                                <span className="pill-label">Total Produk:</span>
                                <span className="pill-value">{productSummary.total_produk}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Informasi Produk</th>
                                <th style={{ textAlign: "center" }}>Total Leads</th>
                                <th style={{ textAlign: "center" }}>Conversion</th>
                                <th style={{ textAlign: "right" }}>Revenue (Paid)</th>
                                <th style={{ textAlign: "right" }}>Potential (Unpaid)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {productStats.length > 0 ? (
                                productStats.map((prod, idx) => (
                                    <tr key={prod.produk_id || idx}>
                                        <td>
                                            <div className="product-info-cell">
                                                <div className="product-icon-box">
                                                    <Package size={18} />
                                                </div>
                                                <div>
                                                    <p className="product-name-txt">{prod.produk_nama}</p>
                                                    <span className="product-code-badge">{prod.produk_kode}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className="stat-value-main">{prod.total_customers}</span>
                                            <p className="stat-sub-txt">Customers</p>
                                        </td>
                                        <td>
                                            <div className="conversion-container">
                                                <div className="conversion-text">
                                                    <span className="paid-count">{prod.total_paid}</span>
                                                    <span className="total-count">/ {prod.total_customers}</span>
                                                    <span className="percent-badge">
                                                        {prod.total_customers > 0
                                                            ? `${((prod.total_paid / prod.total_customers) * 100).toFixed(0)}%`
                                                            : '0%'}
                                                    </span>
                                                </div>
                                                <div className="progress-bar-bg">
                                                    <div
                                                        className="progress-bar-fill"
                                                        style={{
                                                            width: `${prod.total_customers > 0 ? (prod.total_paid / prod.total_customers) * 100 : 0}%`,
                                                            backgroundColor: prod.total_paid > 0 ? '#10b981' : '#e2e8f0'
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <p className="revenue-paid">{prod.total_revenue_formatted}</p>
                                            <span className="revenue-count">{prod.total_paid} Closing</span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <p className="revenue-pending">{prod.total_pending_revenue_formatted}</p>
                                            <span className="revenue-count">{prod.total_unpaid} Pending</span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="table-empty">
                                        {loading ? "Memuat data statistik produk..." : "Belum ada statistik produk tersedia."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </article>

            <style jsx>{`
                .data-table th {
                    background-color: #f97316;
                    color: #fff;
                    font-weight: 700;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    padding: 12px 16px;
                }
                .data-table th:first-child { border-top-left-radius: 8px; border-bottom-left-radius: 8px; }
                .data-table th:last-child { border-top-right-radius: 8px; border-bottom-right-radius: 8px; }
                .data-table td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; }
                
                .product-info-cell { display: flex; align-items: center; gap: 12px; }
                .product-icon-box {
                    width: 36px; height: 36px; background: #eff6ff; color: #3b82f6; 
                    border-radius: 8px; display: flex; align-items: center; justify-content: center;
                }
                .product-name-txt { font-weight: 700; color: #1e293b; margin: 0; font-size: 0.9rem; }
                .product-code-badge { 
                    font-size: 0.65rem; font-weight: 700; color: #64748b; background: #f1f5f9; 
                    padding: 2px 6px; border-radius: 4px; text-transform: uppercase;
                }

                .stat-value-main { font-size: 1.1rem; font-weight: 800; color: #1e293b; }
                .stat-sub-txt { font-size: 0.75rem; color: #94a3b8; margin: 0; }

                .conversion-container { width: 100%; max-width: 140px; }
                .conversion-text { display: flex; align-items: baseline; gap: 4px; margin-bottom: 6px; }
                .paid-count { font-weight: 800; color: #10b981; font-size: 0.9rem; }
                .total-count { color: #94a3b8; font-size: 0.75rem; }
                .percent-badge { 
                    margin-left: auto; font-size: 0.7rem; font-weight: 700; color: #3b82f6;
                    background: #eff6ff; padding: 1px 5px; border-radius: 4px;
                }
                .progress-bar-bg { width: 100%; height: 6px; background: #f1f5f9; border-radius: 10px; overflow: hidden; }
                .progress-bar-fill { height: 100%; border-radius: 10px; transition: width 0.5s ease; }

                .revenue-paid { font-weight: 800; color: #059669; font-size: 0.95rem; margin: 0; }
                .revenue-pending { font-weight: 800; color: #d97706; font-size: 0.95rem; margin: 0; }
                .revenue-count { font-size: 0.75rem; color: #94a3b8; font-weight: 500; }

                .summary-pills { display: flex; gap: 10px; }
                .pill { background: #f8fafc; border: 1px solid #e2e8f0; padding: 4px 12px; border-radius: 20px; display: flex; gap: 6px; align-items: center; }
                .pill-label { font-size: 0.7rem; color: #64748b; font-weight: 600; }
                .pill-value { font-size: 0.75rem; color: #1e293b; font-weight: 800; }
                .panel__subtitle { font-size: 0.85rem; color: #94a3b8; margin-top: 4px; }
            `}</style>
        </section>
    );
}

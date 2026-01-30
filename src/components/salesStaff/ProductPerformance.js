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
                                <th style={{ textAlign: "left", padding: '1rem' }}>Informasi Produk</th>
                                <th style={{ textAlign: "center", padding: '1rem' }}>Total Leads</th>
                                <th style={{ textAlign: "center", padding: '1rem' }}>Conversion</th>
                                <th style={{ textAlign: "right", padding: '1rem' }}>Revenue (Paid)</th>
                                <th style={{ textAlign: "right", padding: '1rem' }}>Potential (Unpaid)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {productStats.length > 0 ? (
                                productStats.map((prod, idx) => (
                                    <tr key={prod.produk_id || idx}>
                                        <td style={{ padding: '1rem' }}>
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
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <span className="stat-value-main">{prod.total_customers}</span>
                                            <p className="stat-sub-txt">Customers</p>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
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
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <p className="revenue-paid">{prod.total_revenue_formatted}</p>
                                            <span className="revenue-count">{prod.total_paid} Closing</span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
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
        </section>
    );
}

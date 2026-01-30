import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function RecentOrders({ recentOrders, formatCurrency }) {
    return (
        <section className="dashboard-panels">
            <article className="panel">
                <div className="panel__header">
                    <div>
                        <h3 className="panel__title">Recent Orders</h3>
                        <p className="panel__subtitle">Daftar transaksi pelanggan terakhir</p>
                    </div>
                    <Link href="/sales/staff/orders" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: '#3b82f6', fontWeight: 500, textDecoration: 'none' }}>
                        Lihat Semua Order <ArrowRight size={16} />
                    </Link>
                </div>
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ textAlign: "left", padding: '1rem' }}>Customer</th>
                                <th style={{ textAlign: "left", padding: '1rem' }}>Status</th>
                                <th style={{ textAlign: "right", padding: '1rem' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentOrders.length > 0 ? (
                                recentOrders.map((order, idx) => (
                                    <tr key={order.id || idx}>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <div className="customer-cell">
                                                <div className="avatar-small">
                                                    {order.customer_rel?.nama?.charAt(0) || order.customer_nama?.charAt(0) || order.customer?.charAt(0) || "C"}
                                                </div>
                                                <div>
                                                    <span className="customer-name" style={{ fontSize: '0.85rem' }}>
                                                        {order.customer_rel?.nama || order.customer_nama || order.customer || "-"}
                                                    </span>
                                                    <p style={{ fontSize: '0.65rem', color: '#94a3b8', margin: 0 }}>
                                                        {order.tanggal_order || order.tanggal || order.create_at || "-"}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <span className={`status-badge ${String(order.status_pembayaran) === '2' ? 'paid' : 'unpaid'}`} style={{ fontSize: '0.65rem' }}>
                                                {String(order.status_pembayaran) === '2' ? 'Paid' : 'Unpaid'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: '#1e293b', fontSize: '0.8rem' }}>
                                            {order.total_harga_formatted || formatCurrency(order.total_harga)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="table-empty">Belum ada order terbaru.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </article>
        </section>
    );
}

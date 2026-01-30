import Link from "next/link";
import { Wallet, ShoppingCart, AlertCircle, TrendingUp, ArrowRight } from "lucide-react";

export default function SummaryStats({ orderStats, mePerformance }) {
    const formatCurrency = (val) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(Number(val) || 0);
    };

    const orderCards = [
        {
            label: "Total Revenue",
            value: orderStats.totalRevenueFormatted || formatCurrency(orderStats.totalRevenue),
            icon: <Wallet size={24} />,
            color: "accent-emerald",
            desc: "Total Pendapatan"
        },
        {
            label: "Total Orders",
            value: (orderStats.totalOrders || 0).toLocaleString("id-ID"),
            icon: <ShoppingCart size={24} />,
            color: "accent-blue",
            desc: "Total Pesanan"
        },
        {
            label: "Unpaid Orders",
            value: (orderStats.unpaidCount || 0).toLocaleString("id-ID"),
            icon: <AlertCircle size={24} />,
            color: "accent-red",
            desc: "Belum Dibayar"
        },
        {
            label: "Conversion Rate",
            value: mePerformance?.conversion_rate_formatted || orderStats.conversionRateFormatted || "0.00%",
            icon: <TrendingUp size={24} />,
            color: "accent-cyan",
            desc: "Success / Total"
        }
    ];

    return (
        <section className="dashboard-panels">
            <article className="panel panel--summary">
                <div className="panel__header">
                    <div>
                        <p className="panel__eyebrow">Sales Performance</p>
                        <h3 className="panel__title">Order Overview</h3>
                    </div>
                    <Link href="/sales/staff/orders" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: '#3b82f6', fontWeight: 500, textDecoration: 'none' }}>
                        Lihat Semua Order <ArrowRight size={16} />
                    </Link>
                </div>
                <div className="dashboard-summary-horizontal">
                    {orderCards.map((card) => (
                        <article className="summary-card" key={card.label}>
                            <div className={`summary-card__icon ${card.color}`}>{card.icon}</div>
                            <div>
                                <p className="summary-card__label">{card.label}</p>
                                <p className="summary-card__value">{card.value}</p>
                                {card.desc && <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>{card.desc}</p>}
                            </div>
                        </article>
                    ))}
                </div>
            </article>

            <style jsx>{`
                .summary-card__value { font-size: 1.15rem; font-weight: 800; color: #1e293b; }
                .summary-card__label { font-size: 0.75rem; color: #64748b; font-weight: 500; text-transform: uppercase; margin-bottom: 2px; }
                .summary-card__icon {
                    width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
                }
                .summary-card__icon.accent-emerald { background: #ecfdf5; color: #10b981; }
                .summary-card__icon.accent-blue { background: #eff6ff; color: #3b82f6; }
                .summary-card__icon.accent-red { background: #fef2f2; color: #ef4444; }
                .summary-card__icon.accent-cyan { background: #ecfeff; color: #0891b2; }
            `}</style>
        </section>
    );
}

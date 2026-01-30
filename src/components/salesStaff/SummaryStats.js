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
                                {card.desc && <p className="summary-card__desc">{card.desc}</p>}
                            </div>
                        </article>
                    ))}
                </div>
            </article>

            <style jsx>{`
                .dashboard-summary-horizontal {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1.5rem;
                    margin-top: 1.5rem;
                }

                .summary-card {
                    background: #ffffff;
                    border: 1px solid #f1f5f9;
                    border-radius: 1.25rem;
                    padding: 1.25rem;
                    display: flex;
                    align-items: center;
                    gap: 1.25rem;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.03), 0 4px 6px -2px rgba(0, 0, 0, 0.02);
                    transition: all 0.3s ease;
                }

                .summary-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                }

                .summary-card__icon {
                    width: 52px;
                    height: 52px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    position: relative;
                }

                .summary-card__icon.accent-emerald { 
                    background: #ecfdf5; color: #10b981; 
                    box-shadow: 0 8px 16px -4px rgba(16, 185, 129, 0.2);
                }
                .summary-card__icon.accent-blue { 
                    background: #eff6ff; color: #3b82f6; 
                    box-shadow: 0 8px 16px -4px rgba(59, 130, 246, 0.2);
                }
                .summary-card__icon.accent-red { 
                    background: #fef2f2; color: #ef4444; 
                    box-shadow: 0 8px 16px -4px rgba(239, 68, 68, 0.2);
                }
                .summary-card__icon.accent-cyan { 
                    background: #ecfeff; color: #0891b2; 
                    box-shadow: 0 8px 16px -4px rgba(8, 145, 178, 0.2);
                }

                .summary-card__label { 
                    font-size: 0.7rem; 
                    color: #94a3b8; 
                    font-weight: 700; 
                    text-transform: uppercase; 
                    letter-spacing: 0.05em;
                    margin-bottom: 2px; 
                }

                .summary-card__value { 
                    font-size: 1.35rem; 
                    font-weight: 850; 
                    color: #1e293b; 
                    line-height: 1.2;
                }

                .summary-card__desc { 
                    font-size: 0.75rem; 
                    color: #64748b; 
                    margin-top: 4px; 
                    font-weight: 500;
                }

                .panel--summary {
                    padding: 1.75rem;
                }

                @media (max-width: 1024px) {
                    .dashboard-summary-horizontal {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                @media (max-width: 640px) {
                    .dashboard-summary-horizontal {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </section>
    );
}

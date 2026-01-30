import { Wallet, ShoppingCart, AlertCircle, TrendingUp } from "lucide-react";

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
        </section>
    );
}

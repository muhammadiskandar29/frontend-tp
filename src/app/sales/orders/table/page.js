'use client';

import React from 'react';
import { ExternalLink, Image as ImageIcon } from 'lucide-react';
import './table-orders.css';

export default function TableExperiment() {
    // Dummy data untuk testing
    const dummyOrders = [
        {
            id: '260114KWZIZCH',
            date: '14 Jan 2026, 15.13',
            customer: { name: 'Yoel Iman', email: 'yoelimansg@gmail.com', phone: '+6283820611496' },
            status: 'Processing',
            paymentStatus: 'Paid',
            store: 'Ternak Properti',
            revenue: 'Rp 150.000',
            hasProof: true
        },
        {
            id: '260114THLQTGE',
            date: '14 Jan 2026, 14.19',
            customer: { name: 'Yosri Santi', email: 'yosrisanti@hotmail.com', phone: '+6281510051006' },
            status: 'Processing',
            paymentStatus: 'Paid',
            store: 'Ternak Properti',
            revenue: 'Rp 250.000',
            hasProof: true
        },
        {
            id: '260114HIWJDXN',
            date: '14 Jan 2026, 13.28',
            customer: { name: 'Taryani', email: 'taryani2801@gmail.com', phone: '+6287885463372' },
            status: 'Processing',
            paymentStatus: 'Paid',
            store: 'Ternak Properti',
            revenue: 'Rp 150.000',
            hasProof: true
        },
        {
            id: '260114LAMIODR',
            date: '14 Jan 2026, 13.23',
            customer: { name: 'Ina F', email: 'inafero123@gmail.com', phone: '+62811973095' },
            status: 'Pending',
            paymentStatus: 'Unpaid',
            store: 'Ternak Properti',
            revenue: 'Rp 250.000',
            hasProof: false
        },
        {
            id: '260114HTAEJSE',
            date: '14 Jan 2026, 12.04',
            customer: { name: 'Setiawan Jati Utomo', email: 'jati.nextlevel@gmail.com', phone: '+6285640018141' },
            status: 'Pending',
            paymentStatus: 'Unpaid',
            store: 'Ternak Properti',
            revenue: 'Rp 150.000',
            hasProof: false
        }
    ];

    return (
        <div className="table-experiment-container">
            <div className="table-experiment-header">
                <h1>Table Experiment - Sticky Columns</h1>
                <p>Testing HTML table structure dengan sticky columns seperti contoh</p>
            </div>

            <div className="table-wrapper">
                <table className="table-orders">
                    <thead>
                        <tr>
                            <th className="sticky-col sticky-col-1">
                                Order ID
                            </th>
                            <th>Customer</th>
                            <th>Status</th>
                            <th>Payment Status</th>
                            <th>Store</th>
                            <th>Follow Up Text</th>
                            <th style={{ textAlign: 'center' }}>Proof of Payment</th>
                            <th>Gross Revenue</th>
                            <th className="sticky-col-right"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {dummyOrders.map((order, index) => (
                            <tr key={order.id}>
                                {/* STICKY COLUMN: Order ID + External Link */}
                                <td className="sticky-col sticky-col-1">
                                    <div className="order-id-cell">
                                        <div className="order-id-content">
                                            <div>
                                                <a href={`/order/${order.id}`} className="order-id-link">
                                                    <p className="order-id-text">{order.id}</p>
                                                    <p className="order-date-text">{order.date}</p>
                                                </a>
                                            </div>
                                            <ExternalLink
                                                size={18}
                                                className="external-link-icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.open(`/sales/orders/${order.id}`, '_blank');
                                                }}
                                            />
                                        </div>
                                    </div>
                                </td>

                                {/* SCROLLABLE COLUMNS */}
                                <td>
                                    <p className="customer-name">{order.customer.name}</p>
                                    <p className="customer-detail">{order.customer.email}</p>
                                    <p className="customer-detail">{order.customer.phone}</p>
                                </td>

                                <td>
                                    <span className={`status-badge status-${order.status.toLowerCase()}`}>
                                        {order.status}
                                    </span>
                                </td>

                                <td>
                                    <span className={`status-badge payment-${order.paymentStatus.toLowerCase()}`}>
                                        {order.paymentStatus}
                                    </span>
                                </td>

                                <td>
                                    <p className="store-text">{order.store}</p>
                                </td>

                                <td>
                                    <div className="follow-up-icons">
                                        <div className="icon-circle icon-wa">W</div>
                                        <div className="icon-circle">1</div>
                                        <div className="icon-circle">2</div>
                                        <div className="icon-circle">3</div>
                                        <div className="icon-circle">O</div>
                                    </div>
                                </td>

                                <td style={{ textAlign: 'center' }}>
                                    {order.hasProof ? (
                                        <ImageIcon
                                            size={24}
                                            className="proof-icon"
                                            style={{ margin: '0 auto', cursor: 'pointer' }}
                                        />
                                    ) : (
                                        <span>-</span>
                                    )}
                                </td>

                                <td className="revenue-text">
                                    {order.revenue}
                                </td>

                                {/* STICKY RIGHT COLUMN: Actions */}
                                <td className="sticky-col-right">
                                    <div className="action-menu">
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 20 20"
                                            fill="none"
                                            className="action-icon"
                                        >
                                            <circle cx="10" cy="10" r="1.5" fill="currentColor" />
                                            <circle cx="10" cy="4" r="1.5" fill="currentColor" />
                                            <circle cx="10" cy="16" r="1.5" fill="currentColor" />
                                        </svg>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="instructions">
                <h3>Testing Instructions:</h3>
                <ul>
                    <li>✅ Scroll horizontal - Order ID column harus tetap stay di kiri</li>
                    <li>✅ Scroll horizontal - Action column (titik 3) harus tetap stay di kanan</li>
                    <li>✅ Kolom Customer sampai Gross Revenue harus bisa scroll</li>
                    <li>✅ Background sticky columns harus solid white, tidak transparan</li>
                    <li>✅ Tidak ada visual glitch atau content peeking through</li>
                </ul>
            </div>
        </div>
    );
}

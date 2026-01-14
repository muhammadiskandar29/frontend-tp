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
                <p>Testing HTML table structure dengan sticky columns: Checkbox & Order ID (Kiri), Actions (Kanan)</p>
            </div>

            <div className="table-wrapper">
                <table className="table-orders">
                    <thead>
                        <tr>
                            {/* STICKY LEFT 1: Checkbox */}
                            <th className="sticky-left-1" style={{ width: '50px', minWidth: '50px' }}>
                                <input type="checkbox" className="checkbox-custom" />
                            </th>

                            {/* STICKY LEFT 2: Order ID */}
                            <th className="sticky-left-2">
                                Order ID
                            </th>

                            <th>Customer</th>
                            <th>Status</th>
                            <th>Payment Status</th>
                            <th>Store</th>
                            <th>Follow Up Text</th>
                            <th style={{ textAlign: 'center' }}>Proof of Payment</th>
                            <th>Gross Revenue</th>

                            {/* STICKY RIGHT: Action */}
                            <th className="sticky-right"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {dummyOrders.map((order, index) => (
                            <tr key={order.id}>
                                {/* STICKY LEFT 1: Checkbox */}
                                <td className="sticky-left-1">
                                    <input type="checkbox" className="checkbox-custom" />
                                </td>

                                {/* STICKY LEFT 2: Order ID + External Link */}
                                <td className="sticky-left-2">
                                    <div className="order-id-cell">
                                        <div className="order-id-content">
                                            <div>
                                                <a href={`/order/${order.id}`} className="order-id-link">
                                                    <p className="order-id-text">{order.id}</p>
                                                    <p className="order-date-text">{order.date}</p>
                                                </a>
                                            </div>
                                            <ExternalLink
                                                size={16}
                                                className="external-link-icon"
                                            />
                                        </div>
                                    </div>
                                </td>

                                {/* SCROLLABLE COLUMNS */}
                                <td>
                                    <div className="customer-cell">
                                        <p className="customer-name">{order.customer.name}</p>
                                        <p className="customer-detail">{order.customer.email}</p>
                                        <p className="customer-detail">{order.customer.phone}</p>
                                    </div>
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
                                    <div className="follow-up-container">
                                        {/* Example Bubble Chat UI based on image */}
                                        <div className="wa-bubble-icon active">
                                            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                        </div>
                                        <div className="wa-bubble active">W</div>
                                        <div className="wa-bubble inactive">1</div>
                                        <div className="wa-bubble inactive">2</div>
                                        <div className="wa-bubble inactive">3</div>
                                        <div className="wa-bubble inactive">0</div>
                                        <div className="wa-bubble menu">:</div>
                                    </div>
                                </td>

                                <td style={{ textAlign: 'center' }}>
                                    {order.hasProof ? (
                                        <ImageIcon
                                            size={20}
                                            className="proof-icon"
                                        />
                                    ) : (
                                        <span className="no-data">-</span>
                                    )}
                                </td>

                                <td className="revenue-text">
                                    {order.revenue}
                                </td>

                                {/* STICKY RIGHT COLUMN: Actions */}
                                <td className="sticky-right">
                                    <div className="action-menu">
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="action-icon">
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
                <h3>Fitur Table:</h3>
                <ul>
                    <li>✅ <b>Sticky Left 1:</b> Kolom Checkbox statis di kiri</li>
                    <li>✅ <b>Sticky Left 2:</b> Kolom Order ID statis di sebelah checkbox</li>
                    <li>✅ <b>Sticky Right:</b> Kolom Action (...) statis di kanan</li>
                    <li>✅ <b>Scrollable:</b> Kolom tengah (Customer s/d Revenue) bisa discroll</li>
                    <li>✅ <b>Design:</b> Menyesuaikan referensi gambar (backgrounds, badges, bubbles)</li>
                </ul>
            </div>
        </div>
    );
}

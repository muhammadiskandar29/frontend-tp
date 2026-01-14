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

        <div className="orders-table__wrapper">
                    <div className="orders-table">
                      <div className="orders-table__head">
                        {ORDERS_COLUMNS.map((column, idx) => {
                          if (column === null) {
                            return <span key={idx}></span>; // Kolom kosong
                          }
                          return (
                            <span key={idx} style={{ display: "flex", flexDirection: "column", gap: "0.1rem", alignItems: "flex-start" }}>
                              <span>{column.line1}</span>
                              {column.line2 && <span>{column.line2}</span>}
                            </span>
                          );
                        })}
                      </div>
                      <div className="orders-table__body">
                        {orders.length > 0 ? (
                          orders.map((order, i) => {
                            // Handle produk name - dari produk_rel
                            const produkNama = order.produk_rel?.nama || "-";
        
                            // Handle customer name - dari customer_rel
                            const customerNama = order.customer_rel?.nama || "-";
        
                            // Get Status Order
                            const statusOrderRaw = order.status_order ?? order.status; // fallback ke order.status jika status_order kosong
                            const statusOrderValue = statusOrderRaw !== undefined && statusOrderRaw !== null
                              ? statusOrderRaw.toString()
                              : "";
                            const statusOrderInfo = STATUS_ORDER_MAP[statusOrderValue] || { label: "-", class: "default" };
        
                            // Get Status Pembayaran
                            // Handle string "4" atau number 4
                            let statusPembayaranValue = order.status_pembayaran;
                            if (statusPembayaranValue === null || statusPembayaranValue === undefined) {
                              statusPembayaranValue = 0;
                            } else {
                              // Konversi ke number untuk konsistensi
                              statusPembayaranValue = Number(statusPembayaranValue);
                              if (isNaN(statusPembayaranValue)) {
                                statusPembayaranValue = 0;
                              }
                            }
                            const statusPembayaranInfo = STATUS_PEMBAYARAN_MAP[statusPembayaranValue] || STATUS_PEMBAYARAN_MAP[0];
        
                            // Get bukti pembayaran
                            const buktiPembayaranPath = getBuktiPembayaran(order);
                            const buktiUrl = buildImageUrl(buktiPembayaranPath);
        
                            return (
                              <div className="orders-table__row" key={order.id || `${order.id}-${i}`}>
                                {/* Order ID */}
                                <div className="orders-table__cell" data-label="Order ID">
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                    <span style={{
                                      fontSize: "0.9rem",
                                      color: "#2563eb",
                                      fontWeight: 500
                                    }}>
                                      {order.id || "-"}
                                    </span>
                                    <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                                      {formatOrderDate(order.tanggal || order.create_at)}
                                    </span>
                                  </div>
                                </div>
        
                                {/* ExternalLink (kolom terpisah tanpa header) */}
                                <div className="orders-table__cell" style={{ padding: 0 }}>
                                  <ExternalLink
                                    size={18}
                                    style={{
                                      color: "#6b7280",
                                      cursor: "pointer",
                                      transition: "color 0.2s ease"
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleView(order);
                                    }}
                                    onMouseEnter={(e) => {
                                      e.target.style.color = "#2563eb";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.color = "#6b7280";
                                    }}
                                  />
                                </div>
        
                                {/* Customer */}
                                <div className="orders-table__cell orders-table__cell--strong" data-label="Customer">
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                    <span style={{ fontSize: "0.875rem", color: "#111827" }}>{customerNama}</span>
                                    <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                                      {order.customer_rel?.wa ? `+${order.customer_rel.wa}` : "-"}
                                    </span>
                                  </div>
                                </div>
        
                                {/* Produk */}
                                <div className="orders-table__cell" data-label="Produk">
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                    <span style={{ fontSize: "0.875rem", color: "#111827" }}>{produkNama}</span>
                                    <span style={{ fontSize: "0.875rem", color: "#111827" }}></span>
                                  </div>
                                </div>
        
                                {/* Status Pembayaran */}
                                <div className="orders-table__cell" data-label="Status Pembayaran">
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                    <span className={`orders-status-badge orders-status-badge--${statusPembayaranInfo.class}`}>
                                      {statusPembayaranInfo.label}
                                    </span>
                                    <span style={{ fontSize: "0.875rem", color: "#111827" }}></span>
                                  </div>
                                </div>
        
                                {/* Status Order */}
                                <div className="orders-table__cell" data-label="Status Order">
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                    <span className={`orders-status-badge orders-status-badge--${statusOrderInfo.class}`}>
                                      {statusOrderInfo.label}
                                    </span>
                                    <span style={{ fontSize: "0.875rem", color: "#111827" }}></span>
                                  </div>
                                </div>
        
                                {/* Follow Up Text */}
                                <div className="orders-table__cell" data-label="Follow Up Text">
                                  <WABubbleChat
                                    customerId={order.customer_rel?.id || order.customer}
                                    orderId={order.id}
                                    orderStatus={statusOrderValue}
                                    statusPembayaran={statusPembayaranValue}
                                  />
                                </div>
        
                                {/* Bukti Pembayaran */}
                                <div className="orders-table__cell" data-label="Bukti Pembayaran">
                                  {buktiUrl ? (
                                    <ImageIcon
                                      size={16}
                                      style={{
                                        color: "#6b7280",
                                        cursor: "pointer",
                                        transition: "color 0.2s ease"
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenImageModal(buktiUrl);
                                      }}
                                      onMouseEnter={(e) => {
                                        e.target.style.color = "#2563eb";
                                      }}
                                      onMouseLeave={(e) => {
                                        e.target.style.color = "#6b7280";
                                      }}
                                    />
                                  ) : (
                                    <span style={{ fontSize: "0.875rem", color: "#9ca3af" }}>-</span>
                                  )}
                                </div>
        
                                {/* Gross Revenue */}
                                <div className="orders-table__cell" data-label="Gross Revenue">
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                    <span style={{ fontSize: "0.875rem", color: "#111827", fontWeight: 600 }}>
                                      Rp {Number(order.total_harga || 0).toLocaleString("id-ID")}
                                    </span>
                                    <span style={{ fontSize: "0.875rem", color: "#111827" }}></span>
                                  </div>
                                </div>
        
                                {/* Sales */}
                                <div className="orders-table__cell" data-label="Sales">
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                    <span style={{ fontSize: "0.875rem", color: "#111827" }}>
                                      {order.customer_rel?.sales_rel?.nama || order.customer_rel?.sales_nama || "-"}
                                    </span>
                                    <span style={{ fontSize: "0.875rem", color: "#111827" }}></span>
                                  </div>
                                </div>
        
                                {/* Update/Konfirmasi Button */}
                                <div className="orders-table__cell" data-label="">
                                  <button
                                    className="orders-action-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEdit(order);
                                    }}
                                    style={{
                                      width: "100%",
                                      padding: "0.4rem 0.75rem",
                                      fontSize: "0.8rem",
                                      whiteSpace: "nowrap"
                                    }}
                                  >
                                    Update / Konfirmasi
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="orders-empty">
                            {orders.length ? "Tidak ada hasil pencarian." : "Loading data..."}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
    );
}


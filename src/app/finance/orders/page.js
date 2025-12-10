"use client";

import { useState } from "react";
import Layout from "@/components/Layout";
import "primereact/resources/themes/lara-light-cyan/theme.css";
import "primereact/resources/primereact.min.css";
import "@/styles/finance/dashboard.css";
import "@/styles/finance/admin.css";

// Status Pembayaran Mapping
const STATUS_PEMBAYARAN_MAP = {
  0:    { label: "Unpaid", class: "unpaid" },
  null: { label: "Unpaid", class: "unpaid" },
  1:    { label: "Menunggu", class: "pending" },
  2:    { label: "Paid", class: "paid" },
  3:    { label: "Ditolak", class: "rejected" },
  4:    { label: "DP", class: "dp" },
};

// Status Order Mapping
const STATUS_ORDER_MAP = {
  "1": { label: "Proses", class: "proses" },
  "2": { label: "Sukses", class: "sukses" },
  "3": { label: "Failed", class: "failed" },
  "4": { label: "Upselling", class: "upselling" },
  "N": { label: "Dihapus", class: "dihapus" },
};

// Dummy Data
const DUMMY_ORDERS = [
  {
    id: 1,
    customer_rel: { nama: "John Doe" },
    produk_rel: { nama: "Product A" },
    total_harga: 500000,
    status_order: "1",
    status_pembayaran: 1,
    tanggal: "2025-01-15",
    sumber: "website",
    waktu_pembayaran: "2025-01-15 10:30:00",
    metode_bayar: "Transfer Bank",
    bukti_pembayaran: null,
  },
  {
    id: 2,
    customer_rel: { nama: "Jane Smith" },
    produk_rel: { nama: "Product B" },
    total_harga: 750000,
    status_order: "1",
    status_pembayaran: 2,
    tanggal: "2025-01-16",
    sumber: "instagram",
    waktu_pembayaran: "2025-01-16 14:20:00",
    metode_bayar: "E-Wallet",
    bukti_pembayaran: "bukti1.jpg",
  },
  {
    id: 3,
    customer_rel: { nama: "Bob Johnson" },
    produk_rel: { nama: "Product C" },
    total_harga: 1200000,
    status_order: "2",
    status_pembayaran: 2,
    tanggal: "2025-01-17",
    sumber: "website",
    waktu_pembayaran: "2025-01-17 09:15:00",
    metode_bayar: "Transfer Bank",
    bukti_pembayaran: "bukti2.jpg",
  },
  {
    id: 4,
    customer_rel: { nama: "Alice Brown" },
    produk_rel: { nama: "Product D" },
    total_harga: 300000,
    status_order: "1",
    status_pembayaran: 4,
    tanggal: "2025-01-18",
    sumber: "website",
    waktu_pembayaran: "2025-01-18 11:45:00",
    metode_bayar: "Transfer Bank",
    bukti_pembayaran: "bukti3.jpg",
  },
  {
    id: 5,
    customer_rel: { nama: "Charlie Wilson" },
    produk_rel: { nama: "Product E" },
    total_harga: 900000,
    status_order: "1",
    status_pembayaran: 3,
    tanggal: "2025-01-19",
    sumber: "instagram",
    waktu_pembayaran: null,
    metode_bayar: null,
    bukti_pembayaran: null,
  },
];

const ORDERS_COLUMNS = [
  "#",
  "Customer",
  "Produk",
  "Total Harga",
  "Status Order",
  "Status Pembayaran",
  "Tanggal",
  "Sumber",
  "Waktu Pembayaran",
  "Metode Bayar",
  "Bukti Bayar",
  "Actions",
];

export default function FinanceOrders() {
  const [orders] = useState(DUMMY_ORDERS);

  return (
    <Layout>
      <div className="finance-orders">
        <div className="finance-orders__header">
          <h1>Orders</h1>
          <p>Daftar pesanan untuk divisi Finance</p>
        </div>

        <div className="finance-orders__table-wrapper">
          <div className="finance-orders__table">
            <div className="finance-orders__table-head">
              {ORDERS_COLUMNS.map((column) => (
                <span key={column}>{column}</span>
              ))}
            </div>
            <div className="finance-orders__table-body">
              {orders.map((order, i) => {
                const statusPembayaranValue = order.status_pembayaran ?? 0;
                const statusPembayaranInfo = STATUS_PEMBAYARAN_MAP[statusPembayaranValue] || STATUS_PEMBAYARAN_MAP[0];
                const statusOrderInfo = STATUS_ORDER_MAP[order.status_order] || STATUS_ORDER_MAP["1"];

                return (
                  <div className="finance-orders__table-row" key={order.id}>
                    <div className="finance-orders__table-cell" data-label="#">
                      {i + 1}
                    </div>
                    <div className="finance-orders__table-cell" data-label="Customer">
                      {order.customer_rel?.nama || "-"}
                    </div>
                    <div className="finance-orders__table-cell" data-label="Produk">
                      {order.produk_rel?.nama || "-"}
                    </div>
                    <div className="finance-orders__table-cell" data-label="Total Harga">
                      Rp {Number(order.total_harga || 0).toLocaleString()}
                    </div>
                    <div className="finance-orders__table-cell" data-label="Status Order">
                      <span className={`finance-status-badge finance-status-badge--${statusOrderInfo.class}`}>
                        {statusOrderInfo.label}
                      </span>
                    </div>
                    <div className="finance-orders__table-cell" data-label="Status Pembayaran">
                      <span className={`finance-status-badge finance-status-badge--${statusPembayaranInfo.class}`}>
                        {statusPembayaranInfo.label}
                      </span>
                    </div>
                    <div className="finance-orders__table-cell" data-label="Tanggal">
                      {order.tanggal || "-"}
                    </div>
                    <div className="finance-orders__table-cell" data-label="Sumber">
                      {order.sumber ? `#${order.sumber}` : "-"}
                    </div>
                    <div className="finance-orders__table-cell" data-label="Waktu Pembayaran">
                      {order.waktu_pembayaran || "-"}
                    </div>
                    <div className="finance-orders__table-cell" data-label="Metode Bayar">
                      {order.metode_bayar || "-"}
                    </div>
                    <div className="finance-orders__table-cell" data-label="Bukti Bayar">
                      {order.bukti_pembayaran ? (
                        <a
                          href="#"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="finance-link"
                        >
                          Lihat Bukti
                        </a>
                      ) : (
                        "-"
                      )}
                    </div>
                    <div className="finance-orders__table-cell" data-label="Actions">
                      <button className="finance-action-btn" title="View">
                        <i className="pi pi-eye" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

"use client";

import React from 'react';
import Image from 'next/image';

export default function UnpaidOrdersModal({ isOpen, onClose, orders = [], onPaymentAction, isPaymentLoading }) {
    if (!isOpen) return null;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const formatPrice = (price) => {
        if (!price) return "0";
        const numPrice = typeof price === "string" ? parseInt(price.replace(/[^\d]/g, "")) : price;
        return (isNaN(numPrice) ? 0 : numPrice).toLocaleString("id-ID");
    };

    return (
        <div className="unpaid-modal-overlay" onClick={handleOverlayClick}>
            <div className="unpaid-modal" onClick={(e) => e.stopPropagation()}>
                <div className="unpaid-modal__header">
                    <div className="header-content">
                        <h2 className="modal-title">Tagihan Belum Dibayar</h2>
                        <p className="modal-subtitle">Segera selesaikan pembayaran untuk menikmati akses produk.</p>
                    </div>
                    <button onClick={onClose} className="close-btn" aria-label="Tutup">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="unpaid-modal__body">
                    {orders.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">🎉</div>
                            <h3>Semua Tagihan Lunas</h3>
                            <p>Anda tidak memiliki tagihan yang tertunda saat ini.</p>
                        </div>
                    ) : (
                        <div className="unpaid-list">
                            {orders.map((order) => (
                                <div key={order.id} className="unpaid-item">
                                    <div className="unpaid-item__info">
                                        <div className="product-badge">{order.type}</div>
                                        <h4 className="product-name">{order.title}</h4>
                                        <div className="order-meta">
                                            <span>Order: {order.orderDate}</span>
                                            <span className="dot"></span>
                                            <span className="total-amount">Rp {order.total}</span>
                                        </div>
                                    </div>
                                    <div className="unpaid-item__action">
                                        <button
                                            className="pay-now-btn"
                                            onClick={() => onPaymentAction(order)}
                                            disabled={isPaymentLoading}
                                        >
                                            {isPaymentLoading ? (
                                                <span className="btn-loading">Memproses...</span>
                                            ) : (
                                                <>
                                                    <span>Bayar Sekarang</span>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                        <path d="M5 12h14m-7-7l7 7-7 7" />
                                                    </svg>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="unpaid-modal__footer">
                    <button onClick={onClose} className="secondary-btn">Tutup</button>
                </div>
            </div>

            <style jsx>{`
        .unpaid-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 16, 18, 0.7);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1100;
          padding: 1.5rem;
          animation: fadeIn 0.3s ease-out;
        }

        .unpaid-modal {
          width: min(600px, 100%);
          background: #ffffff;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .unpaid-modal__header {
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          background: linear-gradient(to right, #ffffff, #f8fafc);
        }

        .modal-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .modal-subtitle {
          font-size: 0.875rem;
          color: #64748b;
          margin: 4px 0 0 0;
        }

        .close-btn {
          padding: 8px;
          background: #f1f5f9;
          border: none;
          border-radius: 10px;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: #e2e8f0;
          color: #0f172a;
          transform: rotate(90deg);
        }

        .unpaid-modal__body {
          padding: 1.5rem 2rem;
          max-height: 60vh;
          overflow-y: auto;
          background: #ffffff;
        }

        .unpaid-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .unpaid-item {
          padding: 1.25rem;
          border: 1px solid #f1f5f9;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #ffffff;
          transition: all 0.2s;
        }

        .unpaid-item:hover {
          border-color: #f1a124;
          box-shadow: 0 8px 20px -6px rgba(241, 161, 36, 0.15);
        }

        .product-badge {
          display: inline-flex;
          padding: 4px 10px;
          background: #fff7ed;
          color: #ea580c;
          font-size: 0.75rem;
          font-weight: 700;
          border-radius: 6px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .product-name {
          font-size: 1rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 6px 0;
          line-height: 1.4;
        }

        .order-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8125rem;
          color: #64748b;
        }

        .dot {
          width: 4px;
          height: 4px;
          background: #cbd5e1;
          border-radius: 50%;
        }

        .total-amount {
          color: #0f172a;
          font-weight: 700;
          font-size: 0.875rem;
        }

        .pay-now-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: #f1a124;
          color: #ffffff;
          border: none;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .pay-now-btn:hover:not(:disabled) {
          background: #e8911a;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(241, 161, 36, 0.3);
        }

        .pay-now-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btn-loading {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-loading::before {
          content: "";
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .empty-state {
          padding: 3rem 0;
          text-align: center;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .empty-state h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 8px 0;
        }

        .empty-state p {
          color: #64748b;
          font-size: 0.9375rem;
          margin: 0;
        }

        .unpaid-modal__footer {
          padding: 1.25rem 2rem;
          background: #f8fafc;
          border-top: 1px solid #f1f5f9;
          display: flex;
          justify-content: flex-end;
        }

        .secondary-btn {
          padding: 10px 24px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #475569;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .secondary-btn:hover {
          background: #f1f5f9;
          color: #0f172a;
          border-color: #cbd5e1;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
          .unpaid-modal-overlay {
            padding: 0;
            align-items: flex-end;
          }

          .unpaid-modal {
            width: 100%;
            border-radius: 24px 24px 0 0;
            max-height: 90vh;
          }

          .unpaid-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .unpaid-item__action {
            width: 100%;
          }

          .pay-now-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
        </div>
    );
}

"use client";

import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Send, User, Phone, MessageSquare } from 'lucide-react';

export default function SupportWidget({ customerInfo }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    nama: "",
    wa: ""
  });

  // Target WhatsApp Number (Support Central)
  const SUPPORT_WA = "6281234567890"; // Ganti dengan nomor CS yang sesuai

  useEffect(() => {
    if (customerInfo) {
      setFormData({
        nama: customerInfo.nama || customerInfo.nama_lengkap || "",
        wa: customerInfo.wa || ""
      });
    }
  }, [customerInfo]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const text = `Halo Admin, Saya butuh bantuan.\n\n` +
      `*Nama:* ${formData.nama}\n` +
      `*No. Telp:* ${formData.wa}\n` +
      `*Pesan:* ${message}`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/${SUPPORT_WA}?text=${encoded}`, "_blank");
    setIsOpen(false);
    setMessage("");
  };

  return (
    <div className="support-widget-container">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          className="support-fab"
          onClick={() => setIsOpen(true)}
          aria-label="Butuh Bantuan"
        >
          <div className="fab-icon-wrapper">
            <MessageCircle size={24} />
            <span className="fab-text">Butuh Bantuan?</span>
          </div>
        </button>
      )}

      {/* Small Support Modal/Popover */}
      {isOpen && (
        <div className="support-popover">
          <div className="popover-header">
            <div className="header-icon-bg">
              <MessageSquare size={18} />
            </div>
            <div className="header-text">
              <h4>Customer Support</h4>
              <p>Kami siap membantu Anda</p>
            </div>
            <button className="close-popover" onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <form className="popover-body" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>
                <User size={14} /> Nama Anda
              </label>
              <input
                type="text"
                value={formData.nama}
                readOnly
                className="readonly-input"
              />
            </div>

            <div className="form-group">
              <label>
                <Phone size={14} /> No. WhatsApp
              </label>
              <input
                type="text"
                value={formData.wa}
                readOnly
                className="readonly-input"
              />
            </div>

            <div className="form-group">
              <label>
                <Send size={14} /> Isi Pesan
              </label>
              <textarea
                placeholder="Ceritakan masalah atau kendala Anda..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={3}
              />
            </div>

            <button type="submit" className="submit-support-btn">
              <span>Kirim ke WhatsApp</span>
              <Send size={16} />
            </button>
          </form>

          <div className="popover-footer">
            Respon rata-rata: &lt; 15 Menit
          </div>
        </div>
      )}

      <style jsx>{`
        .support-widget-container {
          position: fixed;
          bottom: 40px; /* Turunkan sedikit agar tidak terlalu tinggi */
          right: 30px;
          z-index: 9999; /* Maksimalkan z-index agar di atas segalanya */
          pointer-events: auto;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        /* FAB Button */
        .support-fab {
          background: #f1a124;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 50px;
          box-shadow: 0 10px 25px rgba(241, 161, 36, 0.4);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .support-fab:hover {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 15px 30px rgba(241, 161, 36, 0.5);
        }

        .fab-icon-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .fab-text {
          font-weight: 700;
          font-size: 0.95rem;
          letter-spacing: -0.01em;
        }

        /* Popover Form */
        .support-popover {
          width: 320px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.15);
          border: 1px solid #f1f5f9;
          overflow: hidden;
          animation: popIn 0.3s cubic-bezier(0.19, 1, 0.22, 1);
        }

        .popover-header {
          background: #0f172a;
          color: white;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
        }

        .header-icon-bg {
          background: rgba(241, 161, 36, 0.2);
          padding: 8px;
          border-radius: 10px;
          color: #f1a124;
        }

        .header-text h4 {
          margin: 0;
          font-size: 0.9375rem;
          font-weight: 700;
        }

        .header-text p {
          margin: 0;
          font-size: 0.75rem;
          opacity: 0.7;
        }

        .close-popover {
          position: absolute;
          top: 15px;
          right: 15px;
          background: transparent;
          border: none;
          color: white;
          opacity: 0.5;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .close-popover:hover {
          opacity: 1;
        }

        .popover-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .readonly-input {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 0.875rem;
          color: #1e293b;
          font-weight: 500;
          cursor: not-allowed;
        }

        textarea {
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          padding: 12px;
          font-size: 0.9375rem;
          font-family: inherit;
          resize: none;
          transition: all 0.2s;
          color: #1e293b;
        }

        textarea:focus {
          outline: none;
          border-color: #f1a124;
          box-shadow: 0 0 0 4px rgba(241, 161, 36, 0.1);
          background: #fffcf5;
        }

        .submit-support-btn {
          background: #0f172a;
          color: white;
          border: none;
          padding: 14px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.875rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.2s;
          margin-top: 4px;
        }

        .submit-support-btn:hover {
          background: #1e293b;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2);
        }

        .popover-footer {
          padding: 12px;
          text-align: center;
          font-size: 0.7rem;
          color: #94a3b8;
          background: #f8fafc;
          border-top: 1px solid #f1f5f9;
        }

        @keyframes popIn {
          from { 
            opacity: 0; 
            transform: scale(0.9) translateY(20px);
            transform-origin: bottom right;
          }
          to { 
            opacity: 1; 
            transform: scale(1) translateY(0);
          }
        }

        @media (max-width: 640px) {
          .support-widget-container {
            right: 20px;
            bottom: 80px;
          }
          .support-popover {
            width: calc(100vw - 40px);
          }
        }
      `}</style>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, Info } from "lucide-react";
import Link from "next/link";

export default function HeroSection({ customerInfo, isLoading }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    if (customerInfo?.id) {
      navigator.clipboard.writeText(String(customerInfo.id));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <header className="customer-dashboard__hero">
        <div className="hero-content">
          <div className="hero-greeting skeleton-loader" style={{ width: '60%', height: '40px', marginBottom: '1rem' }} />
          <div className="hero-member-card skeleton-loader" style={{ width: '100%', height: '200px' }} />
        </div>
      </header>
    );
  }

  // Get data safely
  const displayName = customerInfo?.nama_panggilan || customerInfo?.nama || "Member";
  const memberId = customerInfo?.id ? String(customerInfo.id).padStart(6, '0') : "-";
  const email = customerInfo?.email || "-";
  const phone = customerInfo?.no_hp || customerInfo?.wa || "-";
  const status = customerInfo?.status === "1" ? "Active" : "Inactive";
  const joinDate = customerInfo?.create_at || customerInfo?.created_at
    ? new Date(customerInfo.create_at || customerInfo.created_at).toLocaleDateString("id-ID", {
      day: 'numeric', month: 'long', year: 'numeric'
    })
    : "-";

  // Verification status check (matching page logic)
  // Logic: unverified if specifically 0, false, or null. Verified if 1 or true.
  const isVerified = customerInfo?.verifikasi === "1" || customerInfo?.verifikasi === true;

  return (
    <header className="customer-dashboard__hero">
      <div className="hero-content">
        <div className="hero-text">
          <p className="hero-eyebrow">Dashboard Member</p>
          <h1 className="hero-title">
            Halo, <span className="hero-name-highlight">{displayName}</span>
          </h1>
          <p className="hero-subtitle">
            Selamat datang kembali! Berikut adalah ringkasan aktivitas dan status keanggotaan Anda.
          </p>
        </div>

        {/* MEMBER CARD */}
        <div className="hero-card-wrapper">
          <div className="member-card">
            <div className="member-card__header">
              <div className="member-card__brand">
                <span className="brand-logo">🔹</span>
                <span className="brand-name">MEMBER CARD</span>
              </div>
              <div className={`member-status-badge ${isVerified ? 'verified' : 'unverified'}`}>
                {isVerified ? (
                  <>
                    <Check size={12} strokeWidth={3} /> VERIFIED
                  </>
                ) : (
                  <>UNVERIFIED</>
                )}
              </div>
            </div>

            <div className="member-card__body">
              <div className="member-info-group">
                <label>Nama Lengkap</label>
                <div className="info-value reset-text">{customerInfo?.nama || displayName}</div>
              </div>

              <div className="member-info-row">
                <div className="member-info-group">
                  <label>Member ID</label>
                  <div className="info-value id-value">
                    <span>{memberId}</span>
                    <button
                      onClick={handleCopyId}
                      className="copy-btn"
                      title="Salin ID"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
                <div className="member-info-group">
                  <label>Bergabung Sejak</label>
                  <div className="info-value date-value">{joinDate}</div>
                </div>
              </div>
            </div>

            <div className="member-card__footer">
              <div className="contact-info">
                <span className="info-item">{email}</span>
                <span className="info-separator">•</span>
                <span className="info-item">{phone}</span>
              </div>
            </div>

            {/* Decorative Patterns */}
            <div className="card-pattern pattern-1"></div>
            <div className="card-pattern pattern-2"></div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .customer-dashboard__hero {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          margin-bottom: 2rem;
        }
        
        @media (min-width: 768px) {
          .hero-content {
            display: grid;
            grid-template-columns: 1.2fr 1fr;
            gap: 3rem;
            align-items: center;
          }
        }

        .hero-text {
          flex: 1;
        }

        .hero-eyebrow {
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
          margin-bottom: 0.5rem;
          font-weight: 600;
        }

        .hero-title {
          font-size: 2rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 0.75rem;
          line-height: 1.2;
        }

        .hero-name-highlight {
          background: linear-gradient(120deg, #2563eb, #06b6d4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
          color: #64748b;
          font-size: 1rem;
          line-height: 1.6;
          max-width: 500px;
        }

        /* MEMBER CARD STYLES */
        .member-card {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border-radius: 16px;
          padding: 1.5rem;
          color: white;
          position: relative;
          overflow: hidden;
          box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.3), 0 8px 10px -6px rgba(15, 23, 42, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
          min-height: 220px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: transform 0.3s ease;
        }

        .member-card:hover {
          transform: translateY(-5px);
        }

        .member-card__header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
          position: relative;
          z-index: 2;
        }

        .brand-logo {
          font-size: 1.25rem;
          margin-right: 0.5rem;
        }

        .brand-name {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: rgba(255, 255, 255, 0.8);
        }

        .member-status-badge {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 0.25rem 0.6rem;
          border-radius: 9999px;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .member-status-badge.verified {
          background: rgba(34, 197, 94, 0.2);
          color: #4ade80;
          border: 1px solid rgba(34, 197, 94, 0.4);
        }

        .member-status-badge.unverified {
          background: rgba(239, 68, 68, 0.2);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.4);
        }

        .member-card__body {
          position: relative;
          z-index: 2;
        }

        .member-info-group {
          margin-bottom: 1rem;
        }

        .member-info-group label {
          display: block;
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 0.25rem;
        }

        .info-value {
          font-size: 1rem;
          font-weight: 600;
          color: #ffffff;
        }
        
        .reset-text {
             font-size: 1.125rem;
             letter-spacing: 0.01em;
        }

        .member-info-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .id-value {
          font-family: 'Courier New', monospace;
          letter-spacing: 0.1em;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .copy-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          padding: 2px;
          transition: color 0.2s;
        }

        .copy-btn:hover {
          color: white;
        }

        .member-card__footer {
          margin-top: auto;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          position: relative;
          z-index: 2;
        }

        .contact-info {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          align-items: center;
        }

        .info-separator {
          opacity: 0.5;
        }

        .card-pattern {
          position: absolute;
          border-radius: 50%;
          filter: blur(40px);
          z-index: 1;
        }

        .pattern-1 {
          width: 150px;
          height: 150px;
          background: rgba(37, 99, 235, 0.3);
          top: -50px;
          right: -50px;
        }

        .pattern-2 {
          width: 120px;
          height: 120px;
          background: rgba(6, 182, 212, 0.2);
          bottom: -30px;
          left: -30px;
        }
      `}</style>
    </header>
  );
}

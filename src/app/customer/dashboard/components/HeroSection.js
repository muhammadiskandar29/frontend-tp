"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, Info, CreditCard, ShieldCheck, ShieldAlert } from "lucide-react";
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
          <div className="hero-text">
            <div className="skeleton-loader" style={{ width: '150px', height: '20px', marginBottom: '1rem' }} />
            <div className="skeleton-loader" style={{ width: '300px', height: '40px', marginBottom: '1rem' }} />
            <div className="skeleton-loader" style={{ width: '100%', height: '60px' }} />
          </div>
          <div className="hero-member-card skeleton-loader" style={{ width: '100%', height: '220px', borderRadius: '16px' }} />
        </div>
      </header>
    );
  }

  // Get data safely
  const displayName = customerInfo?.nama_panggilan || customerInfo?.nama || "Member";
  const memberId = customerInfo?.id ? String(customerInfo.id).padStart(6, '0') : "-";
  const email = customerInfo?.email || "-";
  const phone = customerInfo?.no_hp || customerInfo?.wa || "-";

  // Verification logic matches DashboardPage (strict check)
  const isVerified = customerInfo?.verifikasi === "1" || customerInfo?.verifikasi === true;

  return (
    <header className="customer-dashboard__hero">
      <div className="hero-content">

        {/* LEFT COLUMN: TEXT */}
        <div className="hero-text">
          <p className="hero-eyebrow">Dashboard Member</p>
          <h1 className="hero-title">
            Halo, <span className="hero-name-highlight">{displayName}</span>
          </h1>
          <p className="hero-subtitle">
            Selamat datang kembali! Berikut adalah ringkasan aktivitas dan status keanggotaan Anda.
          </p>
        </div>

        {/* RIGHT COLUMN: MEMBER CARD */}
        <div className="hero-card-wrapper">
          <div className={`member-card ${isVerified ? 'card-verified' : 'card-unverified-theme'}`}>

            {/* Background Texture */}
            <div className="card-texture"></div>

            <div className="member-card__header">
              <div className="member-card__brand">
                <CreditCard size={20} className="brand-icon" />
                <span className="brand-name">MEMBER CARD</span>
              </div>
              <div className={`member-status-badge ${isVerified ? 'verified' : 'unverified'}`}>
                {isVerified ? (
                  <>
                    <ShieldCheck size={14} strokeWidth={2.5} /> VERIFIED
                  </>
                ) : (
                  <>
                    <ShieldAlert size={14} strokeWidth={2.5} /> UNVERIFIED
                  </>
                )}
              </div>
            </div>

            <div className="member-card__body">
              <div className="member-info-group">
                <label>Nama Lengkap</label>
                <div className="info-value reset-text" title={customerInfo?.nama || displayName}>
                  {customerInfo?.nama || displayName}
                </div>
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
                  <div className="info-value">
                    {customerInfo?.create_at || customerInfo?.created_at
                      ? new Date(customerInfo.create_at || customerInfo.created_at).getFullYear()
                      : "-"}
                  </div>
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

          </div>
        </div>
      </div>

      <style jsx>{`
        .customer-dashboard__hero {
          margin-bottom: 2rem;
          width: 100%;
        }
        
        .hero-content {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        @media (min-width: 900px) {
          .hero-content {
            display: grid;
            grid-template-columns: 1fr 420px; /* Text takes space, Card fixed width */
            gap: 4rem;
            align-items: start; /* Align tops */
          }
        }

        .hero-text {
          padding-top: 1rem; /* Slight offset visually */
        }

        .hero-eyebrow {
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
          margin-bottom: 0.75rem;
          font-weight: 700;
        }

        .hero-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 1rem;
          line-height: 1.1;
          letter-spacing: -0.02em;
        }

        .hero-name-highlight {
          color: #0ea5e9; /* Sky blue matching design */
        }

        .hero-subtitle {
          color: #64748b;
          font-size: 1.125rem;
          line-height: 1.6;
          max-width: 90%;
        }

        /* MEMBER CARD STYLES */
        .hero-card-wrapper {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }

        .member-card {
          width: 100%;
          max-width: 420px;
          min-height: 240px;
          border-radius: 20px;
          padding: 1.75rem;
          color: white;
          position: relative;
          overflow: hidden;
          box-shadow: 0 20px 40px -10px rgba(249, 115, 22, 0.4); /* Orange shadow */
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: linear-gradient(135deg, #fb923c 0%, #ea580c 40%, #c2410c 100%); /* Orange Gradient */
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .member-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 25px 50px -12px rgba(249, 115, 22, 0.5);
        }
        
        .card-texture {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background-image: 
            radial-gradient(circle at 100% 0%, rgba(255,255,255,0.15) 0%, transparent 30%),
            radial-gradient(circle at 0% 100%, rgba(0,0,0,0.1) 0%, transparent 30%);
          pointer-events: none;
        }

        .member-card__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          position: relative;
          z-index: 2;
        }

        .member-card__brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(0,0,0,0.1);
          padding: 0.5rem 0.75rem;
          border-radius: 12px;
          backdrop-filter: blur(4px);
        }
        
        .brand-icon {
          color: rgba(255,255,255,0.9);
        }

        .brand-name {
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.15em;
          color: rgba(255, 255, 255, 0.95);
        }

        .member-status-badge {
          font-size: 0.65rem;
          font-weight: 800;
          padding: 0.35rem 0.75rem;
          border-radius: 9999px;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          gap: 6px;
          text-transform: uppercase;
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255,255,255,0.2);
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }
        
        .member-status-badge.unverified {
             background: rgba(220, 38, 38, 0.25);
             border-color: rgba(254, 202, 202, 0.4);
             color: #fee2e2;
        }

        .member-card__body {
          position: relative;
          z-index: 2;
          flex: 1;
        }

        .member-info-group {
          margin-bottom: 1.25rem;
        }

        .member-info-group label {
          display: block;
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 0.35rem;
          font-weight: 600;
        }

        .info-value {
          font-size: 1.125rem;
          font-weight: 700;
          color: white;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .reset-text {
             font-size: 1.5rem;
             white-space: nowrap;
             overflow: hidden;
             text-overflow: ellipsis;
             max-width: 100%;
        }

        .member-info-row {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 1rem;
          margin-top: 1rem;
        }

        .id-value {
          font-family: 'Courier New', monospace;
          letter-spacing: 0.15em;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(255,255,255,0.1);
          width: fit-content;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
        }

        .copy-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          padding: 2px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
        }

        .copy-btn:hover {
          color: white;
          transform: scale(1.1);
        }

        .member-card__footer {
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          position: relative;
          z-index: 2;
        }

        .contact-info {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.8);
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          align-items: center;
          font-weight: 500;
        }

        .info-separator {
          opacity: 0.5;
        }
        
        /* Loading skeleton overrides */
        .skeleton-loader {
            background: #e2e8f0;
            border-radius: 8px;
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: .5; }
        }
      `}</style>
    </header>
  );
}

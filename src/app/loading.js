"use client";

import "@/styles/loading.css";

export default function Loading({ message = "Memuat..." }) {
  return (
    <div className="loading-fullscreen">
      <div className="loading-content">
        {/* Modern Spinner */}
        <div className="loading-spinner-modern">
          <div className="spinner-circle"></div>
          <div className="spinner-circle"></div>
          <div className="spinner-circle"></div>
        </div>
        
        {/* Brand Logo or Icon */}
        <div className="loading-brand">
          <span className="brand-icon">🏠</span>
        </div>
        
        {/* Loading Text */}
        <p className="loading-message">{message}</p>
        
        {/* Progress Bar */}
        <div className="loading-progress">
          <div className="progress-bar"></div>
        </div>
      </div>
    </div>
  );
}

// Loading Overlay untuk form submissions (prevent double click)
export function LoadingOverlay({ isLoading, message = "Memproses..." }) {
  if (!isLoading) return null;
  
  return (
    <div className="loading-overlay">
      <div className="loading-overlay-content">
        <div className="loading-spinner-small">
          <div className="spinner-dot"></div>
          <div className="spinner-dot"></div>
          <div className="spinner-dot"></div>
        </div>
        <p className="loading-overlay-text">{message}</p>
      </div>
    </div>
  );
}

// Inline Loading untuk sections
export function LoadingInline({ message = "Memuat data..." }) {
  return (
    <div className="loading-inline">
      <div className="loading-spinner-inline"></div>
      <span>{message}</span>
    </div>
  );
}

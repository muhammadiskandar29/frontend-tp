"use client";

import "@/styles/loading.css";

export default function Loading() {
  return (
    <div className="loading-container">
      <div className="loading-circle">
        <div className="loading-glow"></div>
      </div>
      <p className="loading-text">Sedang memuat...</p>
    </div>
  );
}

"use client";

import Link from "next/link";
import "@/styles/error404.css";

export default function NotFoundPage() {
  return (
    <div className="error404-container">
      <div className="error404-box">
        <h1 className="error404-title">404</h1>
        <p className="error404-subtitle">Halaman Tidak Ditemukan</p>
        <p className="error404-desc">
          Sepertinya halaman yang kamu cari tidak tersedia atau sudah dipindahkan.
        </p>
        <Link href="/admin" className="error404-btn">
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}

"use client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import "@/styles/transfer.css";

export default function BankTransferPage() {
  const params = useSearchParams();
  const product = params.get("product");
  const harga = params.get("harga");
  const via = params.get("via");
  const sumber = params.get("sumber");

  // Nomor rekening (bisa dipindahkan ke env atau database)
  const rekeningInfo = [
    {
      bank: "BCA",
      logo: "/assets/bca.png",
      nomor: "1234567890",
      atasNama: "PT Dukung Dunia Akademi",
    },
    {
      bank: "Mandiri",
      logo: "/assets/mandiri.png",
      nomor: "9876543210",
      atasNama: "PT Dukung Dunia Akademi",
    },
    {
      bank: "BNI",
      logo: "/assets/bni.png",
      nomor: "1122334455",
      atasNama: "PT Dukung Dunia Akademi",
    },
  ];

  // Nomor WhatsApp admin (bisa dipindahkan ke env)
  const adminWA = "6281234567890"; // Format: 62xxxxxxxxxx (tanpa +)

  const handleSudahTransfer = () => {
    const message = encodeURIComponent(
      `Halo, saya sudah melakukan transfer untuk:\n\n` +
      `Produk: ${product || "Produk"}\n` +
      `Harga: Rp ${Number(harga || 0).toLocaleString("id-ID")}\n` +
      `Via: ${via || "Manual Transfer"}\n` +
      `Sumber: ${sumber || "Website"}`
    );
    window.open(`https://wa.me/${adminWA}?text=${message}`, "_blank");
  };

  return (
    <div className="transfer-container">
      <div className="transfer-header">
        <h2>Bank Transfer (Manual)</h2>
        <p className="subtitle">Silakan transfer sesuai total tagihan</p>
      </div>

      {/* Info Produk */}
      {product && (
        <div className="product-info">
          <h3>Detail Pesanan</h3>
          <p><strong>Produk:</strong> {product}</p>
          {sumber && <p><strong>Sumber:</strong> {sumber}</p>}
        </div>
      )}

      {/* Total Tagihan */}
      <div className="total-box">
        <p className="label">Total Tagihan</p>
        <p className="tagihan">Rp {Number(harga || 0).toLocaleString("id-ID")}</p>
      </div>

      {/* Rekening Bank */}
      <div className="rekening-section">
        <h3>Rekening Tujuan</h3>
        {rekeningInfo.map((rek, idx) => (
          <div key={idx} className="rekening-box">
            <img src={rek.logo} alt={rek.bank} className="bank-logo" />
            <p className="label">Nomor Rekening {rek.bank}</p>
            <p className="number">{rek.nomor}</p>
            <p className="atas-nama">a.n {rek.atasNama}</p>
          </div>
        ))}
      </div>

      {/* Instruksi */}
      <div className="instruksi">
        <h3>Instruksi Pembayaran:</h3>
        <ul>
          <li>Transfer sesuai total tagihan agar proses verifikasi lebih cepat.</li>
          <li>Tim kami akan cek dan verifikasi pembayaran maksimal 1×24 jam.</li>
          <li>Jangan lupa kirim bukti transfer setelah melakukan pembayaran.</li>
          <li>Pastikan nomor rekening dan nominal transfer sudah benar.</li>
        </ul>
      </div>

      {/* Tombol Sudah Transfer */}
      <div className="action-buttons">
        <button className="btn-primary" onClick={handleSudahTransfer}>
          📱 Sudah Transfer (Kirim Bukti via WA)
        </button>
        <button
          className="btn-secondary"
          onClick={() => window.history.back()}
        >
          Kembali
        </button>
      </div>
    </div>
  );
}

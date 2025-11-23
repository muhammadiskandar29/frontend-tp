"use client";
import { useSearchParams } from "next/navigation";
import "@/styles/transfer.css";

export default function BankTransferPage() {
  const params = useSearchParams();
  const product = params.get("product");
  const harga = params.get("harga");

  // Nomor rekening BCA (bisa dipindahkan ke env)
  const rekeningBCA = {
    bank: "BCA",
    logo: "/assets/bca.png",
    nomor: "1234567890",
    atasNama: "PT Dukung Dunia Akademi",
  };

  // Nomor WhatsApp admin (bisa dipindahkan ke env)
  const adminWA = "6281234567890"; // Format: 62xxxxxxxxxx (tanpa +)

  const handleSudahTransfer = () => {
    const message = encodeURIComponent(
      `Halo, saya sudah melakukan transfer untuk:\n\n` +
      `Produk: ${product || "Produk"}\n` +
      `Harga: Rp ${Number(harga || 0).toLocaleString("id-ID")}`
    );
    window.open(`https://wa.me/${adminWA}?text=${message}`, "_blank");
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert("Nomor rekening berhasil disalin!");
    }).catch(() => {
      alert("Gagal menyalin. Silakan salin manual: " + text);
    });
  };

  return (
    <div className="payment-page">
      <div className="payment-container">
        {/* Header */}
        <div className="payment-header">
          <div className="payment-icon">💳</div>
          <h1>Pembayaran Bank Transfer</h1>
          <p className="payment-subtitle">Silakan transfer sesuai total tagihan</p>
        </div>

        {/* Product Info Card */}
        {product && (
          <div className="product-card">
            <div className="product-icon">📦</div>
            <div className="product-details">
              <p className="product-label">Produk</p>
              <p className="product-name">{product}</p>
            </div>
          </div>
        )}

        {/* Total Tagihan Card */}
        <div className="total-card">
          <p className="total-label">Total Tagihan</p>
          <p className="total-amount">Rp {Number(harga || 0).toLocaleString("id-ID")}</p>
        </div>

        {/* Rekening BCA Card */}
        <div className="rekening-card">
          <div className="rekening-header">
            <img src={rekeningBCA.logo} alt={rekeningBCA.bank} className="bank-logo-large" />
            <h3>Rekening Tujuan</h3>
          </div>
          
          <div className="rekening-content">
            <div className="rekening-item">
              <span className="rekening-label">Nomor Rekening</span>
              <div className="rekening-number-wrapper">
                <span className="rekening-number">{rekeningBCA.nomor}</span>
                <button 
                  className="copy-btn" 
                  onClick={() => copyToClipboard(rekeningBCA.nomor)}
                  title="Salin nomor rekening"
                >
                  📋
                </button>
              </div>
            </div>
            
            <div className="rekening-item">
              <span className="rekening-label">Atas Nama</span>
              <span className="rekening-name">{rekeningBCA.atasNama}</span>
            </div>
          </div>
        </div>

        {/* Instruksi Card */}
        <div className="instruksi-card">
          <h3 className="instruksi-title">📋 Instruksi Pembayaran</h3>
          <ul className="instruksi-list">
            <li>
              <span className="instruksi-icon">✓</span>
              Transfer sesuai total tagihan agar proses verifikasi lebih cepat
            </li>
            <li>
              <span className="instruksi-icon">✓</span>
              Tim kami akan cek dan verifikasi pembayaran maksimal 1×24 jam
            </li>
            <li>
              <span className="instruksi-icon">✓</span>
              Sales kami akan menghubungi Anda untuk follow-up pembayaran
            </li>
            <li>
              <span className="instruksi-icon">✓</span>
              Pastikan nomor rekening dan nominal transfer sudah benar
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="action-section">
          <button className="btn-primary" onClick={handleSudahTransfer}>
            <span className="btn-icon">💬</span>
            <span>Hubungi Sales via WhatsApp</span>
          </button>
          <button
            className="btn-secondary"
            onClick={() => window.history.back()}
          >
            Kembali
          </button>
        </div>

        {/* Info Box */}
        <div className="info-box">
          <p className="info-text">
            💡 <strong>Tips:</strong> Setelah transfer, klik tombol di atas untuk menghubungi sales kami. 
            Sales akan membantu proses verifikasi pembayaran Anda.
          </p>
        </div>
      </div>
    </div>
  );
}

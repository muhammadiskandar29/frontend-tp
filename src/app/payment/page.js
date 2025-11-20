"use client";
import { useSearchParams } from "next/navigation";
import "@/styles/transfer.css";

export default function BankTransferPage() {
  const params = useSearchParams();
  const totalHarga = params.get("harga"); // << ambil total harga dari query

  return (
    <div className="transfer-container">
      <h2>Bank Transfer (Manual)</h2>

      <div className="rekening-box">
        <img src="/assets/bca.png" className="bank-logo" />
        <p className="label">Nomor Rekening</p>
        <p className="number">1234567890</p>
        <p className="atas-nama">a.n PT Dukung Dunia Akademi</p>
      </div>

      {/* tampilkan total harga */}
      <div className="total-box">
        <p className="label">Total Tagihan</p>
        <p className="tagihan">Rp {Number(totalHarga).toLocaleString("id-ID")}</p>
      </div>

      <div className="instruksi">
        <h3>Instruksi Pembayaran:</h3>
        <ul>
          <li>Transfer sesuai total tagihan ya, agar proses verifikasi lebih cepat.</li>
          <li>Tim kami akan cek dan verifikasi pembayaran maksimal 1×24 jam.</li>
          <li>Jangan lupa kirim bukti transfer setelah melakukan pembayaran.</li>
        </ul>
      </div>
    </div>
  );
}

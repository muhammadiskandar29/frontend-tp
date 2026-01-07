"use client";

import "@/styles/sales/customer.css";

// Helper untuk display pendapatan dalam format readable
const formatPendapatan = (value) => {
  if (!value) return "—";
  const mapping = {
    "10-20jt": "10 - 20 Juta",
    "20-30jt": "20 - 30 Juta",
    "30-40jt": "30 - 40 Juta",
    "40-50jt": "40 - 50 Juta",
    "50-60jt": "50 - 60 Juta",
    "60-70jt": "60 - 70 Juta",
    "70-80jt": "70 - 80 Juta",
    "80-90jt": "80 - 90 Juta",
    "90-100jt": "90 - 100 Juta",
    ">100jt": "> 100 Juta",
  };
  return mapping[value] || value;
};

// Helper untuk format value dengan placeholder
const formatValue = (value) => {
  return value || "—";
};

// Helper untuk format tanggal lahir dengan pemisah
const formatTanggalLahir = (tanggal) => {
  if (!tanggal) return "—";
  
  // Jika sudah ada pemisah, biarkan seperti itu
  if (tanggal.includes("-") || tanggal.includes("/")) {
    return tanggal;
  }
  
  // Jika tidak ada pemisah, format menjadi dd-mm-yyyy
  const digits = tanggal.replace(/\D/g, "");
  if (digits.length === 8) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 8)}`;
  }
  
  // Jika format tidak sesuai, kembalikan asli
  return tanggal;
};

// Helper untuk format Instagram
const formatInstagram = (value) => {
  if (!value) return "—";
  return value.startsWith("@") ? value : "@" + value;
};

// Helper untuk format jenis kelamin
const formatJenisKelamin = (value) => {
  if (value === "l") return "Laki-laki";
  if (value === "p") return "Perempuan";
  return "—";
};

export default function ViewCustomerModal({ customer, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-card">
        {/* HEADER */}
        <div className="modal-header">
          <h2>Detail Data Customer</h2>
          <button className="modal-close" onClick={onClose}>
            <i className="pi pi-times"></i>
          </button>
        </div>

        {/* BODY - Label : Value Format */}
        <div className="modal-body">
          <div className="detail-list">
            <div className="detail-item">
              <span className="detail-label">Nama</span>
              <span className="detail-colon">:</span>
              <span className="detail-value">{formatValue(customer.nama)}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Email</span>
              <span className="detail-colon">:</span>
              <span className="detail-value">{formatValue(customer.email)}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">No. HP</span>
              <span className="detail-colon">:</span>
              <span className="detail-value">{formatValue(customer.wa)}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Nama Panggilan</span>
              <span className="detail-colon">:</span>
              <span className="detail-value">{formatValue(customer.nama_panggilan)}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Instagram</span>
              <span className="detail-colon">:</span>
              <span className="detail-value">{formatInstagram(customer.instagram)}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Profesi</span>
              <span className="detail-colon">:</span>
              <span className="detail-value">{formatValue(customer.profesi)}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Pendapatan per Bulan</span>
              <span className="detail-colon">:</span>
              <span className="detail-value">{formatPendapatan(customer.pendapatan_bln)}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Industri Pekerjaan</span>
              <span className="detail-colon">:</span>
              <span className="detail-value">{formatValue(customer.industri_pekerjaan)}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Jenis Kelamin</span>
              <span className="detail-colon">:</span>
              <span className="detail-value">{formatJenisKelamin(customer.jenis_kelamin)}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Tanggal Lahir</span>
              <span className="detail-colon">:</span>
              <span className="detail-value">{formatTanggalLahir(customer.tanggal_lahir)}</span>
            </div>

            {/* Alamat - Format Baru (Provinsi, Kabupaten/Kota, Kecamatan, Kode Pos) */}
            {/* Backward compatibility: jika ada alamat lama, tampilkan juga */}
            {customer.alamat && (!customer.provinsi || !customer.kabupaten || !customer.kecamatan || !customer.kode_pos) && (
              <div className="detail-item">
                <span className="detail-label">Alamat</span>
                <span className="detail-colon">:</span>
                <span className="detail-value">{formatValue(customer.alamat)}</span>
              </div>
            )}

            <div className="detail-item">
              <span className="detail-label">Provinsi</span>
              <span className="detail-colon">:</span>
              <span className="detail-value">{formatValue(customer.provinsi)}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Kabupaten/Kota</span>
              <span className="detail-colon">:</span>
              <span className="detail-value">{formatValue(customer.kabupaten)}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Kecamatan</span>
              <span className="detail-colon">:</span>
              <span className="detail-value">{formatValue(customer.kecamatan)}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Kode Pos</span>
              <span className="detail-colon">:</span>
              <span className="detail-value">{formatValue(customer.kode_pos)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

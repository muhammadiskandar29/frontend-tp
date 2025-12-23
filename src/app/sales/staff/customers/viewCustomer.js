"use client";

import "@/styles/sales/customer.css";

// Helper untuk display pendapatan dalam format readable
const formatPendapatan = (value) => {
  if (!value) return "—";
  const mapping = {
    "<1jt": "< 1 Juta",
    "1-5jt": "1 - 5 Juta",
    "5-10jt": "5 - 10 Juta",
    "10-15jt": "10 - 15 Juta",
    "15-20jt": "15 - 20 Juta",
    ">20jt": "> 20 Juta",
  };
  return mapping[value] || value;
};

// Helper untuk format value dengan placeholder
const formatValue = (value) => {
  return value || "—";
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
              <span className="detail-value">{formatValue(customer.tanggal_lahir)}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Alamat</span>
              <span className="detail-colon">:</span>
              <span className="detail-value">{formatValue(customer.alamat)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

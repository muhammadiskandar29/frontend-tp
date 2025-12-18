"use client";

import "@/styles/sales/customer.css";

// Helper untuk display pendapatan dalam format readable
const formatPendapatan = (value) => {
  if (!value) return "-";
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

        {/* BODY */}
        <div className="modal-body">
          <div className="detail-list">
            <div className="detail-item">
              <span className="detail-label">Nama</span>
              <span className="detail-value">{customer.nama || "-"}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Email</span>
              <span className="detail-value">{customer.email || "-"}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">No. HP</span>
              <span className="detail-value">{customer.wa || "-"}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Nama Panggilan</span>
              <span className="detail-value">{customer.nama_panggilan || "-"}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Instagram</span>
              <span className="detail-value">
                {customer.instagram
                  ? customer.instagram.startsWith("@")
                    ? customer.instagram
                    : "@" + customer.instagram
                  : "-"}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Profesi</span>
              <span className="detail-value">{customer.profesi || "-"}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Pendapatan per Bulan</span>
              <span className="detail-value">{formatPendapatan(customer.pendapatan_bln)}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Industri Pekerjaan</span>
              <span className="detail-value">{customer.industri_pekerjaan || "-"}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Jenis Kelamin</span>
              <span className="detail-value">
                {customer.jenis_kelamin === "l"
                  ? "Laki-laki"
                  : customer.jenis_kelamin === "p"
                  ? "Perempuan"
                  : "-"}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Tanggal Lahir</span>
              <span className="detail-value">{customer.tanggal_lahir || "-"}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Alamat</span>
              <span className="detail-value">{customer.alamat || "-"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

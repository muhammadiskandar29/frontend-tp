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
          <div className="form-grid">
            <div className="form-group">
              <label>Nama</label>
              <input value={customer.nama || "-"} readOnly />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input value={customer.email || "-"} readOnly />
            </div>

            <div className="form-group">
              <label>WA</label>
              <input value={customer.wa || "-"} readOnly />
            </div>

            <div className="form-group">
              <label>Nama Panggilan</label>
              <input value={customer.nama_panggilan || "-"} readOnly />
            </div>

<div className="form-group">
  <label>Instagram</label>
  <input
    value={
      customer.instagram
        ? customer.instagram.startsWith("@")
          ? customer.instagram
          : "@" + customer.instagram
        : "-"
    }
    readOnly
  />
</div>
            <div className="form-group">
              <label>Profesi</label>
              <input value={customer.profesi || "-"} readOnly />
            </div>

            <div className="form-group">
              <label>Pendapatan per Bulan</label>
              <input value={formatPendapatan(customer.pendapatan_bln)} readOnly />
            </div>

            <div className="form-group">
              <label>Industri Pekerjaan</label>
              <input value={customer.industri_pekerjaan || "-"} readOnly />
            </div>

            <div className="form-group">
              <label>Jenis Kelamin</label>
              <input
                value={
                  customer.jenis_kelamin === "l"
                    ? "Laki-laki"
                    : customer.jenis_kelamin === "p"
                    ? "Perempuan"
                    : "-"
                }
                readOnly
              />
            </div>

            <div className="form-group full-width">
              <label>Tanggal Lahir</label>
              <input value={customer.tanggal_lahir || "-"} readOnly />
            </div>

            <div className="form-group full-width">
              <label>Alamat</label>
              <textarea value={customer.alamat || "-"} readOnly />
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="modal-footer">
          <button type="button" className="btn-cancel" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

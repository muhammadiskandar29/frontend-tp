"use client";

import "@/styles/admin.css";

const DIVISI_MAP = {
  1: "Admin",
  2: "Sales",
  3: "Multimedia",
  4: "Finance",
};

const LEVEL_MAP = {
  1: "Leader",
  2: "Staff",
};

const formatDate = (value) => {
  if (!value) return "-";
  const normalized = value.toString().replace(/-/g, "/");
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return value;
  const day = String(parsed.getDate()).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const year = parsed.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function ViewUserModal({ user, onClose }) {
  if (!user) return null;

  const divisiLabel = DIVISI_MAP[user.divisi] || user.divisi || "-";
  const levelLabel = LEVEL_MAP[user.level] || user.level || "-";

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h2>User Details</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close view modal">
            <i className="pi pi-times" />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group">
              <label>Nama</label>
              <input value={user.nama || "-"} readOnly />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input value={user.email || "-"} readOnly />
            </div>
            <div className="form-group">
              <label>No. Telepon / WA</label>
              <input value={user.no_telp || "-"} readOnly />
            </div>
            <div className="form-group">
              <label>Divisi</label>
              <input value={divisiLabel} readOnly />
            </div>
            <div className="form-group">
              <label>Level</label>
              <input value={levelLabel} readOnly />
            </div>
            <div className="form-group">
              <label>Tanggal Join</label>
              <input value={formatDate(user.tanggal_join)} readOnly />
            </div>
            <div className="form-group">
              <label>Tanggal Lahir</label>
              <input value={formatDate(user.tanggal_lahir)} readOnly />
            </div>
            <div className="form-group full-width">
              <label>Alamat</label>
              <textarea value={user.alamat || "-"} readOnly rows={3} />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-cancel" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}


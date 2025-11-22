"use client";

import { useState } from "react";
import "@/styles/admin.css";

export default function EditUserModal({ user, onClose, onSave }) {
  // === FORMAT TANGGAL UTIL ===
  const toInputFormat = (val) => {
    if (!val) return "";
    if (/^\d{2}-\d{2}-\d{4}$/.test(val)) {
      const [day, month, year] = val.split("-");
      return `${year}-${month}-${day}`; // buat input type=date
    }
    const d = new Date(val);
    if (isNaN(d)) return "";
    return d.toISOString().split("T")[0];
  };

  const toBackendFormat = (val) => {
    if (!val) return "";
    const d = new Date(val);
    if (isNaN(d)) return val;
    const day = String(d.getDate()).padStart(2, "0");
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const y = d.getFullYear();
    return `${day}-${m}-${y}`; // buat dikirim ke backend
  };

  // === STATE ===
  const [formData, setFormData] = useState({
    nama: user?.nama || "",
    email: user?.email || "",
    tanggal_lahir: toInputFormat(user?.tanggal_lahir),
    tanggal_join: toInputFormat(user?.tanggal_join),
    alamat: user?.alamat || "",
    divisi: user?.divisi?.toString() || "",
    level: user?.level?.toString() || "",
    no_telp: user?.no_telp || "",
  });

  // === TOAST NOTIFICATION ===
  const showToast = (message, type = "success") => {
    const toast = document.createElement("div");
    toast.className = `toast ${
      type === "error" ? "toast-error" : type === "warning" ? "toast-warning" : ""
    }`;
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  };

  // === HANDLE INPUT ===
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // === SUBMIT ===
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nama || !formData.email || !formData.divisi || !formData.level) {
      showToast("Semua field wajib diisi!", "warning");
      return;
    }

    if (!formData.no_telp || formData.no_telp.trim().length < 10) {
      showToast("Nomor telepon minimal 10 digit!", "error");
      return;
    }

    const payload = {
      nama: formData.nama.trim(),
      email: formData.email.trim(),
      tanggal_lahir: toBackendFormat(formData.tanggal_lahir),
      tanggal_join: toBackendFormat(formData.tanggal_join),
      alamat: formData.alamat.trim(),
      divisi: parseInt(formData.divisi, 10), // Convert to integer
      level: parseInt(formData.level, 10), // Convert to integer
      no_telp: formData.no_telp.trim(),
    };

    console.log("🟡 Payload update user:", payload);

    try {
      await onSave(payload);
      showToast("Perubahan berhasil disimpan!");
      onClose();
    } catch (err) {
      console.error("Error update user:", err);
      showToast(err.message || "Gagal menyimpan perubahan", "error");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h2>Edit User</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label>Nama</label>
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  placeholder="Masukkan nama lengkap"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contoh@email.com"
                />
              </div>

              <div className="form-group">
                <label>No. Telepon</label>
                <input
                  type="text"
                  name="no_telp"
                  value={formData.no_telp}
                  onChange={handleChange}
                  placeholder="08123456789"
                />
              </div>

              <div className="form-group">
                <label>Tanggal Lahir</label>
                <input
                  type="date"
                  name="tanggal_lahir"
                  value={formData.tanggal_lahir}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Tanggal Join</label>
                <input
                  type="date"
                  name="tanggal_join"
                  value={formData.tanggal_join}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group full-width">
                <label>Alamat</label>
                <textarea
                  name="alamat"
                  rows="2"
                  value={formData.alamat}
                  onChange={handleChange}
                  placeholder="Alamat lengkap..."
                />
              </div>

              <div className="form-group">
                <label>Divisi</label>
                <select name="divisi" value={formData.divisi} onChange={handleChange}>
                  <option value="">Pilih Divisi</option>
                  <option value="1">Admin</option>
                  <option value="2">Sales</option>
                  <option value="3">Multimedia</option>
                  <option value="4">Finance</option>
                </select>
              </div>

              <div className="form-group">
                <label>Level</label>
                <select name="level" value={formData.level} onChange={handleChange}>
                  <option value="">Pilih Level</option>
                  <option value="1">Leader</option>
                  <option value="2">Staff</option>
                </select>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn-save">
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

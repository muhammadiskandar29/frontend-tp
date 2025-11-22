"use client";

import { useState } from "react";
import "@/styles/admin.css";

export default function AddUserModal({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    tanggal_lahir: "",
    tanggal_join: "",
    alamat: "",
    divisi: "",
    level: "",
    no_telp: "",
  });

  // === FUNGSI TOAST NOTIFIKASI ===
  const showToast = (message, type = "success") => {
    const toast = document.createElement("div");
    toast.className = `toast ${type === "error" ? "toast-error" : type === "warning" ? "toast-warning" : ""}`;
    toast.innerText = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 2500);
  };

  // === HANDLE FORM INPUT ===
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // === FORMAT TANGGAL (dd-mm-yyyy) ===
  const normalizeTanggal = (val) => {
    if (!val) return "";
    const d = new Date(val);
    const day = String(d.getDate()).padStart(2, "0");
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const y = d.getFullYear();
    return `${day}-${m}-${y}`;
  };

  // === HANDLE SUBMIT ===
  const handleSubmit = async (e) => {
    e.preventDefault();

    // validasi wajib diisi
    if (!formData.nama || !formData.email || !formData.divisi || !formData.level) {
      showToast("Semua field wajib diisi!", "warning");
      return;
    }

    // validasi no telp minimal 10 digit
    if (!formData.no_telp || formData.no_telp.trim().length < 10) {
      showToast("Nomor telepon minimal 10 digit!", "error");
      return;
    }

    const payload = {
      nama: formData.nama.trim(),
      email: formData.email.trim(),
      tanggal_lahir: normalizeTanggal(formData.tanggal_lahir),
      tanggal_join: normalizeTanggal(formData.tanggal_join),
      alamat: formData.alamat.trim(),
      divisi: formData.divisi.toString(), // String sesuai requirement backend
      level: formData.level.toString(), // String sesuai requirement backend
      no_telp: formData.no_telp.trim(),
    };

    console.log("🟢 Payload dikirim ke API:", payload);

    try {
      await onSave(payload);
      showToast("User baru berhasil dibuat!");
      onClose();
    } catch (err) {
      console.error("Error submit:", err);
      showToast(err.message || "Terjadi kesalahan saat menyimpan data", "error");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h2>Tambah User Baru</h2>
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
                  value={formData.alamat}
                  onChange={handleChange}
                  rows="2"
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
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

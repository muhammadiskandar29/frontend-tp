"use client";

import { useState } from "react";
import "@/styles/customer.css";

const BASE_URL = "https://onedashboardapi-production.up.railway.app/api";

export default function EditCustomerModal({ customer, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    nama: customer.nama || "",
    email: customer.email || "",
    wa: customer.wa || "",
    nama_panggilan: customer.nama_panggilan || "",
    instagram: customer.instagram?.replace(/^@/, "") || "",
    profesi: customer.profesi || "",
    pendapatan_bln: customer.pendapatan_bln || "",
    industri_pekerjaan: customer.industri_pekerjaan || "",
    jenis_kelamin: customer.jenis_kelamin || "l",
    tanggal_lahir: customer.tanggal_lahir || "",
    alamat: customer.alamat || "",
  });

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // 🔹 Toast helper
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type }), 2500);
  };

  // 🔹 Validasi WA minimal 10 digit
  const validatePhone = (phone) => {
    const digitsOnly = phone.replace(/\D/g, "");
    return digitsOnly.length >= 10;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "instagram" ? value.replace(/^@/, "") : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validatePhone(formData.wa)) {
      showToast("Nomor WA harus minimal 10 angka!", "error");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${BASE_URL}/admin/customer/${customer.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      showToast("Berhasil memperbarui data customer");
      setTimeout(() => {
        onSuccess(data.message || "Data customer berhasil diperbarui");
        onClose();
      }, 1000);
    } catch (err) {
      showToast("Gagal memperbarui data: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        {/* HEADER */}
        <div className="modal-header">
          <h2>Edit Data Customer</h2>
          <button className="modal-close" onClick={onClose}>
            <i className="pi pi-times"></i>
          </button>
        </div>

        {/* BODY */}
        <div className="modal-body">
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Nama</label>
              <input name="nama" value={formData.nama} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input name="email" value={formData.email} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>WA</label>
              <input
                name="wa"
                value={formData.wa}
                onChange={handleChange}
                required
                placeholder="cth: 081234567890"
              />
            </div>

            <div className="form-group">
              <label>Nama Panggilan</label>
              <input
                name="nama_panggilan"
                value={formData.nama_panggilan}
                onChange={handleChange}
                placeholder="cth: Budi"
              />
            </div>

            <div className="form-group">
              <label>Instagram</label>
              <input
                name="instagram"
                value={
                  formData.instagram
                    ? formData.instagram.startsWith("@")
                      ? formData.instagram
                      : `@${formData.instagram}`
                    : ""
                }
                onChange={handleChange}
                placeholder="@username"
              />
            </div>

            <div className="form-group">
              <label>Profesi</label>
              <input name="profesi" value={formData.profesi} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Pendapatan per Bulan</label>
              <select
                name="pendapatan_bln"
                value={formData.pendapatan_bln}
                onChange={handleChange}
              >
                <option value="">Pilih Range Pendapatan</option>
                <option value="<1jt">&lt; 1 Juta</option>
                <option value="1-5jt">1 - 5 Juta</option>
                <option value="5-10jt">5 - 10 Juta</option>
                <option value="10-15jt">10 - 15 Juta</option>
                <option value="15-20jt">15 - 20 Juta</option>
                <option value=">20jt">&gt; 20 Juta</option>
              </select>
            </div>

            <div className="form-group">
              <label>Industri Pekerjaan</label>
              <input
                name="industri_pekerjaan"
                value={formData.industri_pekerjaan}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Jenis Kelamin</label>
              <select
                name="jenis_kelamin"
                value={formData.jenis_kelamin}
                onChange={handleChange}
              >
                <option value="l">Laki-laki</option>
                <option value="p">Perempuan</option>
              </select>
            </div>

            <div className="form-group full-width">
              <label>Tanggal Lahir</label>
              <input
                name="tanggal_lahir"
                value={formData.tanggal_lahir}
                onChange={handleChange}
                placeholder="dd-mm-yyyy"
              />
            </div>

            <div className="form-group full-width">
              <label>Alamat</label>
              <textarea
                name="alamat"
                value={formData.alamat}
                onChange={handleChange}
                rows={3}
              />
            </div>
          </form>
        </div>

        {/* FOOTER */}
        <div className="modal-footer">
          <button type="button" className="btn-cancel" onClick={onClose}>
            Batal
          </button>
          <button type="submit" className="btn-save" onClick={handleSubmit} disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>

        {/* TOAST */}
        {toast.show && (
          <div
            className={`toast ${toast.type === "error" ? "toast-error" : ""} ${
              toast.type === "warning" ? "toast-warning" : ""
            }`}
          >
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
}

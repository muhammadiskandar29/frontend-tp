"use client";

import { useState } from "react";
import "@/styles/sales/customer.css";
import { toastSuccess, toastError } from "@/lib/toast";

// Use Next.js proxy to avoid CORS
const BASE_URL = "/api";

export default function AddCustomerModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    nama: "",
    nama_panggilan: "",
    email: "",
    alamat: "",
    wa: "",
    instagram: "",
    profesi: "",
    pendapatan_bln: "",
    industri_pekerjaan: "",
    jenis_kelamin: "l",
    tanggal_lahir: "",
  });

  const [loading, setLoading] = useState(false);

  const validatePhone = (phone) => {
    const digitsOnly = phone.replace(/\D/g, "");
    return digitsOnly.length >= 10;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // format tanggal lahir otomatis dd-mm-yyyy
    if (name === "tanggal_lahir") {
      let digits = value.replace(/\D/g, ""); // hanya angka
      if (digits.length > 2 && digits.length <= 4)
        digits = digits.slice(0, 2) + "-" + digits.slice(2);
      else if (digits.length > 4)
        digits = digits.slice(0, 2) + "-" + digits.slice(2, 4) + "-" + digits.slice(4, 8);
      setFormData({ ...formData, [name]: digits });
      return;
    }

    // format instagram otomatis ada @
    if (name === "instagram") {
      let val = value;
      if (val && !val.startsWith("@")) val = "@" + val.replace(/^@+/, "");
      setFormData({ ...formData, instagram: val });
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validatePhone(formData.wa)) {
      toastError("Nomor WA minimal 10 angka!");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${BASE_URL}/sales/customer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Gagal menambahkan customer");

      toastSuccess(data.message || "Customer berhasil ditambahkan");
      setTimeout(() => {
        onSuccess(data.message || "Customer berhasil ditambahkan");
        onClose();
      }, 1000);
    } catch (err) {
      toastError("Gagal menambahkan customer: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        {/* HEADER */}
        <div className="modal-header">
          <h2>Tambah Customer Baru</h2>
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
              <label>Nama Panggilan</label>
              <input
                name="nama_panggilan"
                value={formData.nama_panggilan}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input name="email" type="email" value={formData.email} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Alamat</label>
              <input name="alamat" value={formData.alamat} onChange={handleChange} required />
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
              <label>Instagram</label>
              <input
                name="instagram"
                value={formData.instagram}
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
              <select name="pendapatan_bln" value={formData.pendapatan_bln} onChange={handleChange}>
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
              <select name="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleChange}>
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
                maxLength="10"
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

      </div>
    </div>
  );
}

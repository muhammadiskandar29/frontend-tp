"use client";

import { useState, useEffect } from "react";
// Update customer menggunakan endpoint /api/customer/customer
async function updateCustomer(payload) {
  const token = localStorage.getItem("customer_token");

  if (!token) {
    throw new Error("Token tidak ditemukan. Silakan login kembali.");
  }

  try {
    const response = await fetch("/api/customer/customer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || data?.success !== true) {
      throw new Error(data?.message || "Gagal mengupdate customer");
    }

    return data;
  } catch (error) {
    console.error("❌ [UPDATE_CUSTOMER] Error:", error);
    throw error;
  }
}
import { getCustomerSession } from "@/lib/customerAuth";

const initialFormState = {
  nama_panggilan: "",
  instagram: "",
  profesi: "",
  pendapatan_bln: "",
  industri_pekerjaan: "",
  jenis_kelamin: "l",
  tanggal_lahir: "",
  alamat: "",
  password: "",
};

export default function UpdateCustomerModal({
  isOpen,
  onClose,
  onSuccess,
  title = "Lengkapi Data Customer",
}) {
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    try {
      const session = getCustomerSession();
      const user = session.user || {};

      setFormData((prev) => ({
        ...prev,
        nama_panggilan: user.nama_panggilan || user.nama || prev.nama_panggilan,
        instagram: user.instagram || prev.instagram,
        profesi: user.profesi || prev.profesi,
        pendapatan_bln: user.pendapatan_bln || prev.pendapatan_bln,
        industri_pekerjaan:
          user.industri_pekerjaan || prev.industri_pekerjaan,
        jenis_kelamin: user.jenis_kelamin || prev.jenis_kelamin || "l",
        tanggal_lahir: user.tanggal_lahir
          ? user.tanggal_lahir.slice(0, 10)
          : prev.tanggal_lahir,
        alamat: user.alamat || prev.alamat,
        password: "",
      }));
    } catch (error) {
      console.error("[UPDATE_CUSTOMER] Failed to load session:", error);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      const payload = {
        ...formData,
      };

      const result = await updateCustomer(payload);
      if (typeof onSuccess === "function") {
        onSuccess(result?.data);
      }
      if (typeof onClose === "function") {
        onClose();
      }
      setFormData(initialFormState);
    } catch (error) {
      console.error("[UPDATE_CUSTOMER] Submit failed:", error);
      alert(error.message || "Gagal mengupdate customer");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="customer-modal-overlay">
      <div className="customer-modal">
        <div className="customer-modal__header">
          <h2>{title}</h2>
          {/* Modal tidak bisa ditutup sebelum submit */}
          {loading ? (
            <span style={{ color: "#6b7280", fontSize: "14px" }}>Menyimpan...</span>
          ) : null}
        </div>

        <form className="customer-modal__body" onSubmit={handleSubmit}>
          <div className="customer-grid">
            <label>
              <span>Nama Panggilan</span>
              <input
                type="text"
                name="nama_panggilan"
                value={formData.nama_panggilan}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              <span>Instagram</span>
              <input
                type="text"
                name="instagram"
                placeholder="@username"
                value={formData.instagram}
                onChange={handleChange}
              />
            </label>

            <label>
              <span>Profesi</span>
              <input
                type="text"
                name="profesi"
                value={formData.profesi}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              <span>Pendapatan / Bln</span>
              <input
                type="text"
                name="pendapatan_bln"
                value={formData.pendapatan_bln}
                onChange={handleChange}
              />
            </label>

            <label>
              <span>Industri Pekerjaan</span>
              <input
                type="text"
                name="industri_pekerjaan"
                value={formData.industri_pekerjaan}
                onChange={handleChange}
              />
            </label>

            <label>
              <span>Jenis Kelamin</span>
              <select
                name="jenis_kelamin"
                value={formData.jenis_kelamin}
                onChange={handleChange}
              >
                <option value="l">Laki-laki</option>
                <option value="p">Perempuan</option>
              </select>
            </label>

            <label>
              <span>Tanggal Lahir</span>
              <input
                type="date"
                name="tanggal_lahir"
                value={formData.tanggal_lahir}
                onChange={handleChange}
              />
            </label>

            <label className="customer-grid__full">
              <span>Alamat</span>
              <textarea
                name="alamat"
                rows="3"
                value={formData.alamat}
                onChange={handleChange}
                placeholder="Tulis alamat lengkap"
              />
            </label>

            <label className="customer-grid__full">
              <span>Password</span>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Isi jika ingin mengganti password"
                required
              />
            </label>
          </div>

          <div className="customer-modal__footer">
            {/* Modal tidak bisa ditutup sebelum submit, jadi tidak ada tombol Batal */}
            <button
              type="submit"
              className="customer-btn customer-btn--primary"
              disabled={loading}
              style={{ width: "100%" }}
            >
              {loading ? "Menyimpan..." : "Simpan Data"}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .customer-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 16, 18, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .customer-modal {
          width: min(640px, 92vw);
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 25px 80px rgba(8, 12, 30, 0.25);
          padding: 24px;
          animation: fadeIn 0.3s ease;
        }

        .customer-modal__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .customer-modal__header h2 {
          font-size: 20px;
          font-weight: 600;
          margin: 0;
          color: #111827;
        }

        .customer-modal__close {
          border: none;
          background: transparent;
          font-size: 18px;
          cursor: pointer;
          padding: 4px;
        }

        .customer-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .customer-grid__full {
          grid-column: 1 / -1;
        }

        label span {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #4b5563;
          margin-bottom: 6px;
        }

        input,
        select,
        textarea {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 14px;
          transition: border-color 0.2s ease;
          background: #f9fafb;
        }

        input:focus,
        select:focus,
        textarea:focus {
          outline: none;
          border-color: #f1a124;
          background: #fff;
        }

        .customer-modal__footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }

        .customer-btn {
          border: none;
          border-radius: 10px;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .customer-btn--ghost {
          background: transparent;
          border: 1px solid #d1d5db;
          color: #374151;
        }

        .customer-btn--primary {
          background: #f1a124;
          color: #fff;
          box-shadow: 0 10px 20px rgba(241, 161, 36, 0.35);
        }

        .customer-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          box-shadow: none;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}


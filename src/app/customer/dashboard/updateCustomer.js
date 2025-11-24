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

const SECTION_CONFIG = [
  {
    title: "Informasi Dasar",
    icon: "👤",
    fields: [
      {
        name: "nama_panggilan",
        label: "Nama Panggilan",
        placeholder: "Masukkan nama panggilan",
        required: true,
      },
      {
        name: "instagram",
        label: "Instagram",
        placeholder: "@username",
        icon: "📱",
      },
    ],
  },
  {
    title: "Profesi & Pekerjaan",
    icon: "💼",
    fields: [
      {
        name: "profesi",
        label: "Profesi",
        placeholder: "Contoh: Software Engineer",
        required: true,
      },
      {
        name: "pendapatan_bln",
        label: "Pendapatan / Bulan",
        placeholder: "Contoh: Rp 5.000.000",
        icon: "💰",
      },
      {
        name: "industri_pekerjaan",
        label: "Industri Pekerjaan",
        placeholder: "Contoh: Teknologi Informasi",
        icon: "🏢",
        fullWidth: true,
      },
    ],
  },
  {
    title: "Data Pribadi",
    icon: "📋",
    fields: [
      {
        name: "jenis_kelamin",
        label: "Jenis Kelamin",
        icon: "⚧️",
        type: "select",
        options: [
          { value: "l", label: "Laki-laki" },
          { value: "p", label: "Perempuan" },
        ],
      },
      {
        name: "tanggal_lahir",
        label: "Tanggal Lahir",
        icon: "🎂",
        type: "date",
      },
      {
        name: "alamat",
        label: "Alamat",
        icon: "📍",
        type: "textarea",
        placeholder: "Tulis alamat lengkap",
        fullWidth: true,
      },
    ],
  },
  {
    title: "Keamanan",
    icon: "🔒",
    fields: [
      {
        name: "password",
        label: "Password Baru",
        type: "password",
        placeholder: "Masukkan password baru",
        note: "Isi jika ingin mengganti password",
        required: true,
        fullWidth: true,
      },
    ],
  },
];

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
          {SECTION_CONFIG.map((section) => (
            <div className="form-section" key={section.title}>
              <div className="section-header">
                <h3 className="section-title">
                  <span className="section-icon">{section.icon}</span>
                  {section.title}
                </h3>
              </div>

              <div className="customer-grid">
                {section.fields.map((field) => {
                  const value = formData[field.name] ?? "";
                  const baseProps = {
                    name: field.name,
                    value,
                    onChange: handleChange,
                    placeholder: field.placeholder,
                    required: field.required,
                  };

                  if (field.type === "textarea") {
                    baseProps.rows = field.rows || 3;
                  }

                  const fieldClass = [
                    "form-field",
                    field.fullWidth ? "customer-grid__full" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <label className={fieldClass} key={field.name}>
                      <span className="field-label">
                        {field.icon && (
                          <span className="field-icon">{field.icon}</span>
                        )}
                        {field.label}{" "}
                        {field.required ? (
                          <span className="required">*</span>
                        ) : null}
                      </span>

                      {field.type === "select" ? (
                        <select {...baseProps}>
                          {field.options?.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : field.type === "textarea" ? (
                        <textarea {...baseProps} />
                      ) : (
                        <input type={field.type || "text"} {...baseProps} />
                      )}

                      {field.note && (
                        <p className="field-hint">{field.note}</p>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

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
          background: rgba(15, 16, 18, 0.65);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
          padding: 1rem;
          overflow-y: auto;
        }

        .customer-modal {
          width: min(720px, 100%);
          max-height: 90vh;
          background: #ffffff;
          border-radius: 24px;
          box-shadow: 0 25px 80px rgba(8, 12, 30, 0.3);
          display: flex;
          flex-direction: column;
          animation: fadeIn 0.3s ease;
          overflow: hidden;
        }

        .customer-modal__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #e5e7eb;
          background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
        }

        .customer-modal__header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
          color: #111827;
          letter-spacing: -0.02em;
        }

        .customer-modal__body {
          padding: 2rem;
          overflow-y: auto;
          flex: 1;
        }

        .form-section {
          margin-bottom: 2rem;
        }

        .form-section:last-of-type {
          margin-bottom: 0;
        }

        .section-header {
          margin-bottom: 1.25rem;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .section-icon {
          font-size: 1.25rem;
        }

        .customer-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.25rem 1.5rem;
        }

        .customer-grid__full {
          grid-column: 1 / -1;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .field-label {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.25rem;
        }

        .field-icon {
          font-size: 1rem;
        }

        .required {
          color: #ef4444;
          font-weight: 700;
        }

        input,
        select,
        textarea {
          width: 100%;
          border: 1.5px solid #e5e7eb;
          border-radius: 12px;
          padding: 0.75rem 1rem;
          font-size: 0.9375rem;
          transition: all 0.2s ease;
          background: #ffffff;
          color: #111827;
          font-family: inherit;
        }

        input:hover,
        select:hover,
        textarea:hover {
          border-color: #d1d5db;
        }

        input:focus,
        select:focus,
        textarea:focus {
          outline: none;
          border-color: #f1a124;
          background: #fffef9;
          box-shadow: 0 0 0 3px rgba(241, 161, 36, 0.1);
        }

        input::placeholder,
        textarea::placeholder {
          color: #9ca3af;
        }

        select {
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 1rem center;
          padding-right: 2.5rem;
        }

        textarea {
          resize: vertical;
          min-height: 80px;
        }

        .field-hint {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 0.25rem;
          font-style: italic;
        }

        .customer-modal__footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 1.5rem 2rem;
          border-top: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .customer-btn {
          border: none;
          border-radius: 12px;
          padding: 0.875rem 2rem;
          font-size: 0.9375rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .customer-btn--primary {
          background: linear-gradient(135deg, #f1a124 0%, #e8911a 100%);
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(241, 161, 36, 0.4);
        }

        .customer-btn--primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(241, 161, 36, 0.5);
        }

        .customer-btn--primary:active:not(:disabled) {
          transform: translateY(0);
        }

        .customer-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          box-shadow: none;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Responsive */
        @media (max-width: 640px) {
          .customer-modal {
            width: 100%;
            max-height: 100vh;
            border-radius: 0;
          }

          .customer-modal__header,
          .customer-modal__body,
          .customer-modal__footer {
            padding: 1.25rem;
          }

          .customer-grid {
            grid-template-columns: 1fr;
          }

          .customer-grid__full {
            grid-column: 1;
          }
        }
      `}</style>
    </div>
  );
}


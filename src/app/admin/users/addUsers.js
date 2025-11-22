"use client";

import { useState } from "react";
import "@/styles/admin.css";

// Whitelist domain email yang valid
const VALID_EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "yahoo.co.id",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "protonmail.com",
  "mail.com",
  "aol.com",
  "zoho.com",
  "yandex.com",
  "gmx.com",
  "live.com",
  "msn.com",
  "company.com", // Contoh domain perusahaan (bisa disesuaikan)
  "onedashboard.id", // Domain perusahaan
];

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

  const [emailError, setEmailError] = useState("");

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

  // === VALIDASI EMAIL ===
  const validateEmail = (email) => {
    if (!email) {
      setEmailError("");
      return false;
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Format email tidak valid");
      return false;
    }

    // Extract domain
    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain) {
      setEmailError("Domain email tidak ditemukan");
      return false;
    }

    // Check if domain is in whitelist
    const isValidDomain = VALID_EMAIL_DOMAINS.some(
      (validDomain) => domain === validDomain || domain.endsWith(`.${validDomain}`)
    );

    if (!isValidDomain) {
      const suggestedDomain = findClosestDomain(domain);
      setEmailError(
        `Domain "${domain}" tidak valid. ${suggestedDomain ? `Mungkin maksudnya "${suggestedDomain}"?` : "Gunakan domain yang valid seperti @gmail.com, @yahoo.com, dll."}`
      );
      return false;
    }

    setEmailError("");
    return true;
  };

  // === FIND CLOSEST DOMAIN (untuk typo detection) ===
  const findClosestDomain = (inputDomain) => {
    // Common typos
    const typoMap = {
      "gmai.com": "gmail.com",
      "gmal.com": "gmail.com",
      "gmial.com": "gmail.com",
      "gmaill.com": "gmail.com",
      "yahooo.com": "yahoo.com",
      "yaho.com": "yahoo.com",
      "hotmai.com": "hotmail.com",
      "hotmial.com": "hotmail.com",
      "outlok.com": "outlook.com",
      "outlok.com": "outlook.com",
    };

    if (typoMap[inputDomain]) {
      return typoMap[inputDomain];
    }

    // Find similar domain (Levenshtein distance)
    let closest = null;
    let minDistance = Infinity;

    VALID_EMAIL_DOMAINS.forEach((validDomain) => {
      const distance = levenshteinDistance(inputDomain, validDomain);
      if (distance < minDistance && distance <= 2) {
        minDistance = distance;
        closest = validDomain;
      }
    });

    return closest;
  };

  // === LEVENSHTEIN DISTANCE (untuk typo detection) ===
  const levenshteinDistance = (str1, str2) => {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  };

  // === HANDLE FORM INPUT ===
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Real-time email validation
    if (name === "email") {
      validateEmail(value);
    }
  };

  // === FORMAT TANGGAL (dd-mm-yyyy) ===
  // Sesuai requirement API: format dd-mm-yyyy
  const normalizeTanggal = (val) => {
    if (!val) return "";
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) {
        console.warn("⚠️ Invalid date:", val);
        return "";
      }
      const day = String(d.getDate()).padStart(2, "0");
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const y = d.getFullYear();
      return `${day}-${m}-${y}`;
    } catch (err) {
      console.error("❌ Error formatting date:", err);
      return "";
    }
  };

  // === HANDLE SUBMIT ===
  const handleSubmit = async (e) => {
    e.preventDefault();

    // validasi wajib diisi
    if (!formData.nama || !formData.email || !formData.divisi || !formData.level) {
      showToast("Nama, Email, Divisi, dan Level wajib diisi!", "warning");
      return;
    }

    // validasi email format dan domain
    if (!validateEmail(formData.email.trim())) {
      showToast(emailError || "Email tidak valid!", "error");
      return;
    }

    // validasi no telp minimal 10 digit
    if (!formData.no_telp || formData.no_telp.trim().length < 10) {
      showToast("Nomor telepon minimal 10 digit!", "error");
      return;
    }

    // validasi tanggal wajib diisi (sesuai requirement API)
    if (!formData.tanggal_lahir || !formData.tanggal_join) {
      showToast("Tanggal lahir dan tanggal join wajib diisi!", "warning");
      return;
    }

    // Build payload sesuai requirement API POST /api/admin/users
    // Format: semua field required, tanggal format dd-mm-yyyy, divisi & level integer
    const payload = {
      nama: formData.nama.trim(),
      email: formData.email.trim(),
      tanggal_lahir: normalizeTanggal(formData.tanggal_lahir), // Format: dd-mm-yyyy
      tanggal_join: normalizeTanggal(formData.tanggal_join), // Format: dd-mm-yyyy
      alamat: formData.alamat.trim() || "",
      divisi: parseInt(formData.divisi, 10), // Integer: 1=Admin, 2=Sales, 3=Multimedia, 4=Finance
      level: parseInt(formData.level, 10), // Integer: 1=Leader, 2=Staff
      no_telp: formData.no_telp.trim(),
    };

    console.log("🟢 Payload dikirim ke API:", payload);
    console.log("🟢 Payload JSON:", JSON.stringify(payload, null, 2));

    try {
      await onSave(payload);
      showToast("User baru berhasil dibuat!");
      onClose();
    } catch (err) {
      console.error("❌ Error submit:", err);
      console.error("❌ Error details:", {
        message: err.message,
        status: err.status,
        data: err.data,
        validationErrors: err.validationErrors
      });
      
      // Show detailed error message
      let errorMessage = err.message || "Terjadi kesalahan saat menyimpan data";
      if (err.validationErrors) {
        errorMessage = `Validasi gagal: ${Object.values(err.validationErrors).flat().join(', ')}`;
      }
      
      showToast(errorMessage, "error");
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
                  onBlur={() => validateEmail(formData.email)}
                  placeholder="contoh@gmail.com"
                  className={emailError ? "input-error" : ""}
                  style={{
                    borderColor: emailError ? "#ef4444" : "",
                    borderWidth: emailError ? "2px" : "1px",
                  }}
                />
                {emailError && (
                  <p
                    style={{
                      color: "#ef4444",
                      fontSize: "0.875rem",
                      marginTop: "0.25rem",
                      marginBottom: 0,
                    }}
                  >
                    {emailError}
                  </p>
                )}
                {!emailError && formData.email && (
                  <p
                    style={{
                      color: "#10b981",
                      fontSize: "0.875rem",
                      marginTop: "0.25rem",
                      marginBottom: 0,
                    }}
                  >
                    ✓ Email valid
                  </p>
                )}
                <p
                  style={{
                    color: "#6b7280",
                    fontSize: "0.75rem",
                    marginTop: "0.5rem",
                    marginBottom: 0,
                  }}
                >
                  Domain yang valid: @gmail.com, @yahoo.com, @hotmail.com, @outlook.com, dll.
                </p>
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

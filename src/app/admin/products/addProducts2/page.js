"use client";

import { useEffect, useState } from "react";
import { Button } from "primereact/button";

export default function Page() {
  // Generate kode dari nama
  const generateKode = (text) => {
    if (!text) return "";
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  // Format tanggal untuk backend
  const formatDateForBackend = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const pad = (v) => (v < 10 ? `0${v}` : v);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  // Form state
  const [form, setForm] = useState({
    kategori: null,
    nama: "",
    kode: "",
    url: "",
    header: null,
    harga_coret: "",
    harga_asli: "",
    deskripsi: "",
    tanggal_event: "",
    landingpage: "1",
    status: 1,
    assign: null,
    list_point: [],
    testimoni: [],
    video: "",
  });

  const [kategoriOptions, setKategoriOptions] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load kategori dan users
  useEffect(() => {
    async function loadData() {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        // Load kategori
        const kategoriRes = await fetch("/api/admin/kategori-produk", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const kategoriData = await kategoriRes.json();
        if (kategoriData.data) {
          const active = kategoriData.data.filter((k) => k.status === "1" || k.status === 1);
          setKategoriOptions(active.map((k) => ({ label: k.nama, value: k.id })));
        }

        // Load users
        const usersRes = await fetch("/api/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const usersData = await usersRes.json();
        if (usersData.data) {
          const active = usersData.data.filter((u) => u.status === "1" || u.status === 1);
          setUserOptions(active.map((u) => ({ label: u.nama || u.name, value: u.id })));
        }
      } catch (err) {
        console.error("Load data error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compress image to JPG (max 1MB)
  const compressImage = async (file, maxSizeMB = 1, maxWidth = 1600) => {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith("image/")) {
        reject(new Error("File bukan gambar"));
        return;
      }

      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          const tryCompress = (quality) => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error("Failed to compress"));
                  return;
                }
                if (blob.size <= maxSizeBytes || quality <= 0.3) {
                  const jpgFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                    type: "image/jpeg",
                    lastModified: Date.now(),
                  });
                  resolve(jpgFile);
                } else {
                  tryCompress(quality - 0.1);
                }
              },
              "image/jpeg",
              quality
            );
          };
          tryCompress(0.85);
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  // Handle submit
  const handleSubmit = async () => {
    try {
      // Validasi
      if (!form.nama.trim()) {
        alert("Nama produk wajib diisi!");
        return;
      }
      if (!form.kategori) {
        alert("Kategori wajib dipilih!");
        return;
      }
      if (!form.header) {
        alert("Header gambar wajib diupload!");
        return;
      }

      setSubmitting(true);

      // Get user_input dari localStorage
      const userSession = localStorage.getItem("user");
      const userData = userSession ? JSON.parse(userSession) : null;
      if (!userData || !userData.id) {
        alert("User tidak ditemukan. Silakan login ulang!");
        setSubmitting(false);
        return;
      }

      // Generate kode dan URL
      const kode = form.kode || generateKode(form.nama);
      const url = form.url || "/" + kode;

      // Compress header image
      const compressedHeader = await compressImage(form.header, 1, 1600);

      // Build FormData
      const formData = new FormData();
      formData.append("header", compressedHeader);
      formData.append("kategori", String(form.kategori));
      formData.append("user_input", String(userData.id));
      formData.append("nama", form.nama);
      formData.append("kode", kode);
      formData.append("url", url.startsWith("/") ? url : "/" + url);
      formData.append("deskripsi", form.deskripsi || "");
      formData.append("harga_coret", String(form.harga_coret || "0"));
      formData.append("harga_asli", String(form.harga_asli || "0"));
      formData.append("tanggal_event", formatDateForBackend(form.tanggal_event) || "");
      formData.append("landingpage", String(form.landingpage || "1"));
      formData.append("status", String(form.status || 1));
      formData.append("assign", JSON.stringify(form.assign ? [form.assign] : []));
      formData.append("list_point", JSON.stringify(form.list_point || []));
      formData.append("testimoni", JSON.stringify(form.testimoni || []));
      formData.append("video", JSON.stringify(form.video ? form.video.split(",").map((v) => v.trim()).filter((v) => v) : []));
      formData.append("custom_field", JSON.stringify([]));
      formData.append("fb_pixel", JSON.stringify([]));
      formData.append("event_fb_pixel", JSON.stringify([]));
      formData.append("gtm", JSON.stringify([]));
      formData.append("gambar", JSON.stringify([]));

      // Submit
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/produk2", {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("API Error:", data);
        alert(data.message || "Gagal membuat produk!");
        setSubmitting(false);
        return;
      }

      alert("Produk berhasil dibuat!");
      console.log("Success:", data);
      
      // Reset form
      setForm({
        kategori: null,
        nama: "",
        kode: "",
        url: "",
        header: null,
        harga_coret: "",
        harga_asli: "",
        deskripsi: "",
        tanggal_event: "",
        landingpage: "1",
        status: 1,
        assign: null,
        list_point: [],
        testimoni: [],
        video: "",
      });
    } catch (err) {
      console.error("Submit error:", err);
      alert("Terjadi kesalahan saat submit: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Update kode dan URL saat nama berubah
  useEffect(() => {
    if (form.nama && !form.kode) {
      const kode = generateKode(form.nama);
      setForm((prev) => ({
        ...prev,
        kode,
        url: "/" + kode,
      }));
    }
  }, [form.nama]);

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "20px" }}>Tambah Produk</h1>

      {loading && <p>Loading...</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        {/* Nama */}
        <div>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Nama Produk *
          </label>
          <input
            type="text"
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
            style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
            placeholder="Masukkan nama produk"
          />
        </div>

        {/* Kategori */}
        <div>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Kategori *
          </label>
          <select
            value={form.kategori || ""}
            onChange={(e) => setForm({ ...form, kategori: e.target.value ? Number(e.target.value) : null })}
            style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
          >
            <option value="">Pilih Kategori</option>
            {kategoriOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Kode */}
        <div>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Kode</label>
          <input
            type="text"
            value={form.kode}
            onChange={(e) => {
              const kode = e.target.value;
              setForm({ ...form, kode, url: "/" + kode });
            }}
            style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
            placeholder="Auto-generate dari nama"
          />
        </div>

        {/* URL */}
        <div>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>URL</label>
          <input
            type="text"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
            placeholder="Auto-generate dari kode"
          />
        </div>

        {/* Header */}
        <div>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Header Gambar *
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setForm({ ...form, header: e.target.files[0] })}
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        {/* Harga */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Harga Coret
            </label>
            <input
              type="number"
              value={form.harga_coret}
              onChange={(e) => setForm({ ...form, harga_coret: e.target.value })}
              style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
              placeholder="0"
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Harga Asli
            </label>
            <input
              type="number"
              value={form.harga_asli}
              onChange={(e) => setForm({ ...form, harga_asli: e.target.value })}
              style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
              placeholder="0"
            />
          </div>
        </div>

        {/* Deskripsi */}
        <div>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Deskripsi
          </label>
          <textarea
            value={form.deskripsi}
            onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
            rows={4}
            style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
            placeholder="Masukkan deskripsi produk"
          />
        </div>

        {/* Tanggal Event */}
        <div>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Tanggal Event
          </label>
          <input
            type="datetime-local"
            value={form.tanggal_event ? new Date(form.tanggal_event).toISOString().slice(0, 16) : ""}
            onChange={(e) => setForm({ ...form, tanggal_event: e.target.value ? new Date(e.target.value).toISOString() : "" })}
            style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
          />
        </div>

        {/* Assign */}
        <div>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Assign</label>
          <select
            value={form.assign || ""}
            onChange={(e) => setForm({ ...form, assign: e.target.value ? Number(e.target.value) : null })}
            style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
          >
            <option value="">Pilih User</option>
            {userOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Landing Page */}
        <div>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Landing Page
          </label>
          <input
            type="text"
            value={form.landingpage}
            onChange={(e) => setForm({ ...form, landingpage: e.target.value })}
            style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
            placeholder="1"
          />
        </div>

        {/* Status */}
        <div>
          <label style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: "bold" }}>
            <input
              type="checkbox"
              checked={form.status === 1}
              onChange={(e) => setForm({ ...form, status: e.target.checked ? 1 : 0 })}
            />
            Status Aktif
          </label>
        </div>

        {/* List Point */}
        <div>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            List Point
          </label>
          {form.list_point.map((item, idx) => (
            <div key={idx} style={{ display: "flex", gap: "5px", marginBottom: "5px" }}>
              <input
                type="text"
                value={item.nama || ""}
                onChange={(e) => {
                  const newList = [...form.list_point];
                  newList[idx] = { nama: e.target.value };
                  setForm({ ...form, list_point: newList });
                }}
                style={{ flex: 1, padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                placeholder="Masukkan list point"
              />
              <button
                onClick={() => {
                  const newList = form.list_point.filter((_, i) => i !== idx);
                  setForm({ ...form, list_point: newList });
                }}
                style={{ padding: "8px 15px", background: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
              >
                Hapus
              </button>
            </div>
          ))}
          <button
            onClick={() => setForm({ ...form, list_point: [...form.list_point, { nama: "" }] })}
            style={{ padding: "8px 15px", background: "#28a745", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", marginTop: "5px" }}
          >
            + Tambah List Point
          </button>
        </div>

        {/* Testimoni */}
        <div>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Testimoni
          </label>
          {form.testimoni.map((item, idx) => (
            <div key={idx} style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "10px", borderRadius: "4px" }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const newTestimoni = [...form.testimoni];
                  newTestimoni[idx] = { ...newTestimoni[idx], gambar: e.target.files[0] };
                  setForm({ ...form, testimoni: newTestimoni });
                }}
                style={{ width: "100%", marginBottom: "5px" }}
              />
              <input
                type="text"
                value={item.nama || ""}
                onChange={(e) => {
                  const newTestimoni = [...form.testimoni];
                  newTestimoni[idx] = { ...newTestimoni[idx], nama: e.target.value };
                  setForm({ ...form, testimoni: newTestimoni });
                }}
                placeholder="Nama"
                style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px", marginBottom: "5px" }}
              />
              <textarea
                value={item.deskripsi || ""}
                onChange={(e) => {
                  const newTestimoni = [...form.testimoni];
                  newTestimoni[idx] = { ...newTestimoni[idx], deskripsi: e.target.value };
                  setForm({ ...form, testimoni: newTestimoni });
                }}
                placeholder="Deskripsi"
                rows={2}
                style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px", marginBottom: "5px" }}
              />
              <button
                onClick={() => {
                  const newTestimoni = form.testimoni.filter((_, i) => i !== idx);
                  setForm({ ...form, testimoni: newTestimoni });
                }}
                style={{ padding: "8px 15px", background: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
              >
                Hapus
              </button>
            </div>
          ))}
          <button
            onClick={() => setForm({ ...form, testimoni: [...form.testimoni, { nama: "", deskripsi: "", gambar: null }] })}
            style={{ padding: "8px 15px", background: "#28a745", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
          >
            + Tambah Testimoni
          </button>
        </div>

        {/* Video */}
        <div>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Video</label>
          <textarea
            value={form.video}
            onChange={(e) => setForm({ ...form, video: e.target.value })}
            rows={2}
            style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
            placeholder="URL video (pisahkan dengan koma jika lebih dari satu)"
          />
        </div>

        {/* Submit Button */}
        <div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              padding: "12px 30px",
              background: submitting ? "#6c757d" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: submitting ? "not-allowed" : "pointer",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            {submitting ? "Menyimpan..." : "Simpan Produk"}
          </button>
        </div>
      </div>
    </div>
  );
}

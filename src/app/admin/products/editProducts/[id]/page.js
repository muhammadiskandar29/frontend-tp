"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputSwitch } from "primereact/inputswitch";
import { Button } from "primereact/button";
import LandingTemplate from "@/components/LandingTemplate";
import { MultiSelect } from "primereact/multiselect";
import { ArrowLeft } from "lucide-react";
import "@/styles/add-products.css";

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id;

  // ============================
  // SLUGIFY
  // ============================
  const generateKode = (text) =>
    (text || "")
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  // ============================
  // FORMAT TANGGAL KE BACKEND
  // ============================
  const formatDateForBackend = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const pad = (v) => (v < 10 ? `0${v}` : v);
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // ============================
  // DEFAULT FORM
  // ============================
  const defaultForm = {
    id: null,
    kategori: null, // Integer, bukan array
    user_input: [],
    nama: "",
    url: "",
    kode: "",
    header: { type: "file", value: null },
    harga_coret: "",
    harga_asli: "",
    deskripsi: "",
    tanggal_event: "",
    gambar: [], // [{ path: {type:'file', value:File}, caption }]
    landingpage: "1",
    status: 1,
    assign: [],
    custom_field: [],
    list_point: [],
    testimoni: [],
    fb_pixel: [],
    event_fb_pixel: [],
    gtm: [],
    video: "",
  };

  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);

  // ============================
  // HANDLER INPUT
  // ============================
  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateArrayItem = (key, i, field, value) => {
    const arr = [...form[key]];
    if (field) arr[i][field] = value;
    else arr[i] = value;
    setForm((p) => ({ ...p, [key]: arr }));
  };

  const addArray = (key, value) => {
    setForm((p) => ({ ...p, [key]: [...p[key], value] }));
  };

  const removeArray = (key, index) => {
    const arr = [...form[key]];
    arr.splice(index, 1);
    setForm((p) => ({ ...p, [key]: arr }));
  };

  // ============================
  // SUBMIT - POST ke /api/admin/produk/{id}
  // ============================
  const handleSubmit = async () => {
    if (!productId) {
      alert("Product ID tidak ditemukan!");
      return;
    }

    try {
      // Selalu gunakan FormData untuk edit (karena backend mengharapkan header selalu ada)
      const payload = new FormData();
      const isFormData = true;

      // Header - kirim file jika diubah, atau kirim path string jika tidak diubah
      if (form.header.type === "file" && form.header.value) {
        // File baru (diubah)
        payload.append("header", form.header.value);
      } else if (form.header.type === "url" && form.header.value) {
        // Path string yang sudah ada (tidak diubah)
        payload.append("header", form.header.value);
      }

      // Gallery - kirim file jika diubah, atau kirim path string jika tidak diubah
      form.gambar.forEach((g, idx) => {
        if (g.path?.type === "file" && g.path.value) {
          // File baru (diubah)
          payload.append(`gambar[${idx}][path]`, g.path.value);
        } else if (g.path?.type === "url" && g.path.value) {
          // Path string yang sudah ada (tidak diubah)
          payload.append(`gambar[${idx}][path]`, g.path.value);
        }
        payload.append(`gambar[${idx}][caption]`, g.caption || "");
      });

      // Testimoni - kirim file jika diubah, atau kirim path string jika tidak diubah
      form.testimoni.forEach((t, idx) => {
        if (t.gambar?.type === "file" && t.gambar.value) {
          // File baru (diubah)
          payload.append(`testimoni[${idx}][gambar]`, t.gambar.value);
        } else if (t.gambar?.type === "url" && t.gambar.value) {
          // Path string yang sudah ada (tidak diubah)
          payload.append(`testimoni[${idx}][gambar]`, t.gambar.value);
        }
        payload.append(`testimoni[${idx}][nama]`, t.nama || "");
        payload.append(`testimoni[${idx}][deskripsi]`, t.deskripsi || "");
      });

      // Fields - urutan sama dengan addProducts
      payload.append("nama", form.nama);
      const kode = form.kode || generateKode(form.nama);
      payload.append("kode", kode);
      payload.append("url", "/" + kode); // pastikan url selalu sinkron dengan kode
      payload.append("deskripsi", form.deskripsi || "");
      payload.append("harga_coret", form.harga_coret || 0);
      payload.append("harga_asli", form.harga_asli || 0);
      payload.append("tanggal_event", formatDateForBackend(form.tanggal_event));
      payload.append("assign", JSON.stringify(form.assign));
      const payloadCustomField = form.custom_field.map((f, idx) => ({
        nama_field: f.label || f.key,
        urutan: idx + 1
      }));
      payload.append("custom_field", JSON.stringify(payloadCustomField));
      payload.append("list_point", JSON.stringify(form.list_point));
      payload.append("fb_pixel", JSON.stringify(form.fb_pixel));
      payload.append(
        "event_fb_pixel",
        JSON.stringify(form.event_fb_pixel.map((ev) => ({ event: ev })))
      );
      payload.append("gtm", JSON.stringify(form.gtm));
      const videoArray = form.video
        ? form.video.split(",").map(v => v.trim()).filter(v => v)
        : [];
      payload.append("video", JSON.stringify(videoArray));
      payload.append("landingpage", form.landingpage);
      payload.append("status", form.status);
      payload.append("user_input", JSON.stringify(form.user_input));
      // Kirim kategori_id sebagai integer
      const kategoriId = form.kategori ? Number(form.kategori) : null;
      if (kategoriId) {
        payload.append("kategori", kategoriId);
      }

      console.log("FINAL PAYLOAD:", payload);

      const res = await fetch(
        `/api/admin/produk/${productId}`,
        {
          method: "PUT",
          headers: {
            ...(isFormData ? {} : { "Content-Type": "application/json" }),
            Accept: "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: isFormData ? payload : JSON.stringify(payload),
        }
      );

      const data = await res.json();
      
      // Logging struktur JSON lengkap
      console.log("Success:", data.success);
      console.log("Data:", data.data);
      console.table(data.data);

      if (!res.ok) {
        console.error("❌ API ERROR:", data);
        alert("Gagal mengupdate produk!");
        return;
      }

      alert("Produk berhasil diupdate!");
      console.log("SUCCESS:", data);
      
      // Refresh data produk untuk menampilkan data terbaru
      try {
        await fetchProductData(false); // false = tidak set loading state
      } catch (err) {
        console.error("Error refreshing data:", err);
      }
      
      // Opsi: redirect ke list produk (uncomment jika ingin redirect)
      // router.push("/admin/products");
    } catch (err) {
      console.error("❌ Submit error:", err);
      alert("Terjadi kesalahan saat submit.");
    }
  };

  const [kategoriOptions, setKategoriOptions] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Function untuk fetch data produk
  const fetchProductData = async (setLoadingState = false) => {
    if (!productId) {
      if (setLoadingState) setLoading(false);
      return;
    }

    try {
      if (setLoadingState) setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch produk berdasarkan ID
      const produkRes = await fetch(
        `/api/admin/produk/${productId}`,
        { headers }
      );
      const produkResponse = await produkRes.json();
      
      if (!produkRes.ok || !produkResponse.success) {
        throw new Error(produkResponse.message || "Gagal memuat data produk");
      }

      const produkData = produkResponse.data || produkResponse;

      // Helper function untuk parse JSON fields
      const safeParseJSON = (value, fallback = []) => {
        if (!value) return fallback;
        if (Array.isArray(value)) return value;
        try {
          return JSON.parse(value);
        } catch {
          return fallback;
        }
      };

      // Fetch kategori untuk mendapatkan kategori_id
      const kategoriRes = await fetch(
        "/api/admin/kategori-produk",
        { headers }
      );
      const kategoriData = await kategoriRes.json();
      const activeCategories = Array.isArray(kategoriData.data)
        ? kategoriData.data.filter((k) => k.status === "1")
        : [];

      // Handle kategori_id
      let kategoriId = null;
      if (produkData.kategori_rel) {
        kategoriId = produkData.kategori_rel.id ? Number(produkData.kategori_rel.id) : null;
      } else if (produkData.kategori_id) {
        kategoriId = Number(produkData.kategori_id);
      } else if (produkData.kategori) {
        kategoriId = Number(produkData.kategori);
      }

      // Parse existing data
      const kodeGenerated = produkData.kode || generateKode(produkData.nama || "produk-baru");
      
      // Parse gambar - handle existing images (type: "url")
      const parsedGambar = safeParseJSON(produkData.gambar, []).map(g => {
        const imagePath = typeof g === "string" ? g : (g.path || g);
        return {
          path: imagePath 
            ? { type: "url", value: imagePath }
            : { type: "file", value: null },
          caption: g.caption || ""
        };
      });

      // Parse testimoni - handle existing images (type: "url")
      const parsedTestimoni = safeParseJSON(produkData.testimoni, []).map(t => {
        const imagePath = t.gambar ? (typeof t.gambar === "string" ? t.gambar : (t.gambar.path || t.gambar)) : null;
        return {
          gambar: imagePath
            ? { type: "url", value: imagePath }
            : { type: "file", value: null },
          nama: t.nama || "",
          deskripsi: t.deskripsi || ""
        };
      });

      // Parse custom_field
      const parsedCustomField = safeParseJSON(produkData.custom_field, []).map(f => ({
        label: f.nama_field || f.label || "",
        value: f.value || "",
        required: f.required || false
      }));

      // Parse list_point
      const parsedListPoint = safeParseJSON(produkData.list_point, []).map(p => ({
        nama: p.nama || p
      }));

      // Parse video
      const parsedVideo = produkData.video
        ? (Array.isArray(produkData.video) 
            ? produkData.video.join(", ")
            : safeParseJSON(produkData.video, []).join(", "))
        : "";

      // Handle header image - existing image (type: "url")
      const headerImage = produkData.header
        ? (typeof produkData.header === "string"
            ? { type: "url", value: produkData.header }
            : (produkData.header.path
                ? { type: "url", value: produkData.header.path }
                : { type: "file", value: null }))
        : { type: "file", value: null };

      setForm((f) => ({
        ...f,
        ...produkData,
        id: produkData.id || productId,
        kategori: kategoriId,
        assign: produkData.assign_rel ? produkData.assign_rel.map((u) => u.id) : safeParseJSON(produkData.assign, []),
        user_input: produkData.user_input_rel ? [produkData.user_input_rel.id] : (produkData.user_input ? [produkData.user_input] : []),
        custom_field: parsedCustomField,
        list_point: parsedListPoint,
        testimoni: parsedTestimoni,
        fb_pixel: safeParseJSON(produkData.fb_pixel, []),
        event_fb_pixel: safeParseJSON(produkData.event_fb_pixel, []),
        gtm: safeParseJSON(produkData.gtm, []),
        gambar: parsedGambar,
        header: headerImage,
        kode: kodeGenerated,
        url: produkData.url || "/" + kodeGenerated,
        video: parsedVideo,
        landingpage: produkData.landingpage || "1",
      }));
    } catch (err) {
      console.error("Fetch product data error:", err);
      if (setLoadingState) {
        alert("Gagal memuat data produk!");
      }
    } finally {
      if (setLoadingState) setLoading(false);
    }
  };

  useEffect(() => {
    async function fetchInitialData() {
      if (!productId) {
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        // 1️⃣ Fetch kategori dan filter hanya yang aktif (status === "1")
        const kategoriRes = await fetch(
          "/api/admin/kategori-produk",
          { headers }
        );
        const kategoriData = await kategoriRes.json();
        
        // Logging struktur JSON lengkap
        console.log("Success:", kategoriData.success);
        console.log("Data:", kategoriData.data);
        console.table(kategoriData.data);
        
        // Filter hanya kategori yang aktif (status === "1")
        const activeCategories = Array.isArray(kategoriData.data)
          ? kategoriData.data.filter((k) => k.status === "1")
          : [];
        
        // Create options with ID as value and name as label
        const kategoriOpts = activeCategories.map((k) => ({
          label: `${k.id} - ${k.nama}`,
          value: k.id
        }));
        setKategoriOptions(kategoriOpts);

        // 2️⃣ Fetch produk berdasarkan ID - menggunakan fetchProductData
        await fetchProductData(true);

        // 3️⃣ Fetch users - filter hanya status 1
        const usersRes = await fetch(
          "/api/admin/users",
          { headers }
        );
        const usersJson = await usersRes.json();
        
        // Logging struktur JSON lengkap
        console.log("Success:", usersJson.success);
        console.log("Data:", usersJson.data);
        console.table(usersJson.data);
        
        const userOpts = Array.isArray(usersJson.data)
          ? usersJson.data
              .filter((u) => u.status === "1" || u.status === 1)
              .map((u) => ({ label: u.nama || u.name, value: u.id }))
          : [];
        setUserOptions(userOpts);
      } catch (err) {
        console.error("Fetch initial data error:", err);
        alert("Gagal memuat data produk!");
      } finally {
        setLoading(false);
      }
    }

    fetchInitialData();
  }, [productId, refreshKey]);

  // ============================
  // UI
  // ============================
  if (loading) {
    return (
      <div className="produk-container produk-builder-layout" style={{ padding: "2rem", textAlign: "center" }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="produk-container produk-builder-layout">
      <div className="produk-form">
        {/* Header Section */}
        <div className="form-header-section">
          <button
            className="back-to-products-btn"
            onClick={() => router.push("/admin/products")}
            aria-label="Back to products list"
          >
            <ArrowLeft size={18} />
            <span>Back to Products</span>
          </button>
          <div className="form-title-wrapper">
            <h2 className="form-title">Edit Produk</h2>
            <p className="form-subtitle">Ubah informasi produk di bawah ini</p>
          </div>
        </div>

        {/* SECTION 1: Informasi Dasar */}
        <div className="form-section-card">
          <div className="section-header">
            <h3 className="section-title">📋 Informasi Dasar</h3>
            <p className="section-description">Data utama produk yang akan ditampilkan</p>
          </div>
          <div className="section-content">
            {/* NAMA PRODUK */}
            <div className="form-field-group">
              <label className="form-label">
                <span className="label-icon">📦</span>
                Nama Produk <span className="required">*</span>
              </label>
              <InputText
                className="w-full form-input"
                value={form.nama}
                placeholder="Masukkan nama produk"
                onChange={(e) => {
                  const nama = e.target.value;
                  const kodeGenerated = generateKode(nama);
                  setForm({ 
                    ...form, 
                    nama, 
                    kode: kodeGenerated,
                    url: "/" + kodeGenerated
                  });
                }}
              />
            </div>

            {/* KATEGORI */}
            <div className="form-field-group">
              <label className="form-label">
                <span className="label-icon">🏷️</span>
                Kategori <span className="required">*</span>
              </label>
              <Dropdown
                className="w-full form-input"
                value={form.kategori || null}
                options={kategoriOptions}
                onChange={(e) => {
                  handleChange("kategori", e.value ? Number(e.value) : null);
                }}
                placeholder="Pilih Kategori"
                showClear
              />
            </div>

            {/* KODE & URL */}
            <div className="grid grid-cols-2 gap-4">
              <div className="form-field-group">
                <label className="form-label">
                  <span className="label-icon">🔗</span>
                  Kode Produk
                </label>
                <InputText
                  className="w-full form-input"
                  value={form.kode || ""}
                  onChange={(e) => {
                    const kode = e.target.value;
                    setForm({
                      ...form,
                      kode,
                      url: "/" + (kode || "produk-baru"),
                    });
                  }}
                  placeholder="Kode otomatis dari nama"
                />
              </div>
              <div className="form-field-group">
                <label className="form-label">
                  <span className="label-icon">🌐</span>
                  URL
                </label>
                <InputText
                  className="w-full form-input"
                  value={form.url || ""}
                  onChange={(e) => handleChange("url", e.target.value)}
                  placeholder="/kode-produk"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Media & Konten */}
        <div className="form-section-card">
          <div className="section-header">
            <h3 className="section-title">🖼️ Media & Konten</h3>
            <p className="section-description">Gambar, deskripsi, dan konten produk</p>
          </div>
          <div className="section-content">
            {/* HEADER IMAGE */}
            <div className="form-field-group">
              <label className="form-label">
                <span className="label-icon">🖼️</span>
                Header Image
              </label>
              <div className="file-upload-card">
                {form.header?.type === "url" && form.header.value && (
                  <div className="file-preview">
                    <img 
                      src={form.header.value} 
                      alt="Current header" 
                      className="preview-thumbnail"
                    />
                    <p className="field-hint">Gambar saat ini</p>
                  </div>
                )}
                <label className="file-upload-label">Upload File Baru</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleChange("header", { type: "file", value: e.target.files[0] })}
                  className="file-input"
                />
                {form.header?.type === "file" && form.header.value && (
                  <div className="file-preview">
                    <img 
                      src={URL.createObjectURL(form.header.value)} 
                      alt="Preview" 
                      className="preview-thumbnail"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* DESKRIPSI */}
            <div className="form-field-group">
              <label className="form-label">
                <span className="label-icon">📝</span>
                Deskripsi Produk
              </label>
              <InputTextarea
                className="w-full form-input"
                rows={5}
                value={form.deskripsi}
                placeholder="Masukkan deskripsi lengkap produk"
                onChange={(e) => handleChange("deskripsi", e.target.value)}
              />
            </div>

            {/* HARGA */}
            <div className="grid grid-cols-2 gap-4">
              <div className="form-field-group">
                <label className="form-label">
                  <span className="label-icon">💰</span>
                  Harga Coret
                </label>
                <InputNumber
                  className="w-full form-input"
                  value={Number(form.harga_coret)}
                  onValueChange={(e) => handleChange("harga_coret", e.value)}
                  placeholder="Harga sebelum diskon"
                  mode="currency"
                  currency="IDR"
                  locale="id-ID"
                />
              </div>
              <div className="form-field-group">
                <label className="form-label">
                  <span className="label-icon">💵</span>
                  Harga Asli <span className="required">*</span>
                </label>
                <InputNumber
                  className="w-full form-input"
                  value={Number(form.harga_asli)}
                  onValueChange={(e) => handleChange("harga_asli", e.value)}
                  placeholder="Harga setelah diskon"
                  mode="currency"
                  currency="IDR"
                  locale="id-ID"
                />
              </div>
            </div>

            {/* TANGGAL EVENT */}
            <div className="form-field-group">
              <label className="form-label">
                <span className="label-icon">📅</span>
                Tanggal Event
              </label>
              <Calendar
                className="w-full form-input"
                showTime
                value={form.tanggal_event ? new Date(form.tanggal_event) : null}
                onChange={(e) => handleChange("tanggal_event", e.value)}
                placeholder="Pilih tanggal event"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Gallery */}
        <div className="form-section-card">
          <div className="section-header">
            <h3 className="section-title">🖼️ Gallery Produk</h3>
            <p className="section-description">Tambah gambar produk dengan caption</p>
          </div>
          <div className="section-content">
            {form.gambar.map((g, i) => (
              <div key={i} className="gallery-item-card">
                <div className="gallery-item-header">
                  <span className="gallery-item-number">Gambar {i + 1}</span>
                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    className="p-button-danger p-button-sm"
                    onClick={() => removeArray("gambar", i)}
                    tooltip="Hapus gambar"
                  />
                </div>
                <div className="gallery-item-content">
                  <div className="form-field-group">
                    <label className="form-label-small">Upload Gambar</label>
                    {g.path?.type === "url" && g.path.value && (
                      <div className="file-preview">
                        <img 
                          src={g.path.value} 
                          alt={`Current ${i + 1}`}
                          className="preview-thumbnail"
                        />
                        <p className="field-hint">Gambar saat ini</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        updateArrayItem("gambar", i, "path", { type: "file", value: e.target.files[0] })
                      }
                      className="file-input"
                    />
                    {g.path?.type === "file" && g.path.value && (
                      <div className="file-preview">
                        <img 
                          src={URL.createObjectURL(g.path.value)} 
                          alt={`Preview ${i + 1}`}
                          className="preview-thumbnail"
                        />
                      </div>
                    )}
                  </div>
                  <div className="form-field-group">
                    <label className="form-label-small">Caption</label>
                    <InputText
                      className="w-full form-input"
                      placeholder="Masukkan caption gambar"
                      value={g.caption}
                      onChange={(e) => updateArrayItem("gambar", i, "caption", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button
              icon="pi pi-plus"
              label="Tambah Gambar"
              className="add-item-btn"
              onClick={() => addArray("gambar", { path: { type: "file", value: null }, caption: "" })}
            />
          </div>
        </div>

        {/* SECTION 4: Testimoni */}
        <div className="form-section-card">
          <div className="section-header">
            <h3 className="section-title">⭐ Testimoni</h3>
            <p className="section-description">Tambah testimoni dari pembeli</p>
          </div>
          <div className="section-content">
            {form.testimoni.map((t, i) => (
              <div key={i} className="testimoni-item-card">
                <div className="testimoni-item-header">
                  <span className="testimoni-item-number">Testimoni {i + 1}</span>
                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    className="p-button-danger p-button-sm"
                    onClick={() => removeArray("testimoni", i)}
                    tooltip="Hapus testimoni"
                  />
                </div>
                <div className="testimoni-item-content">
                  <div className="form-field-group">
                    <label className="form-label-small">Upload Foto</label>
                    {t.gambar?.type === "url" && t.gambar.value && (
                      <div className="file-preview">
                        <img 
                          src={t.gambar.value} 
                          alt={`Current Testimoni ${i + 1}`}
                          className="preview-thumbnail"
                        />
                        <p className="field-hint">Foto saat ini</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        updateArrayItem("testimoni", i, "gambar", { type: "file", value: e.target.files[0] })
                      }
                      className="file-input"
                    />
                    {t.gambar?.type === "file" && t.gambar.value && (
                      <div className="file-preview">
                        <img 
                          src={URL.createObjectURL(t.gambar.value)} 
                          alt={`Testimoni ${i + 1}`}
                          className="preview-thumbnail"
                        />
                      </div>
                    )}
                  </div>
                  <div className="form-field-group">
                    <label className="form-label-small">Nama</label>
                    <InputText
                      className="w-full form-input"
                      placeholder="Masukkan nama testimoni"
                      value={t.nama}
                      onChange={(e) => updateArrayItem("testimoni", i, "nama", e.target.value)}
                    />
                  </div>
                  <div className="form-field-group">
                    <label className="form-label-small">Deskripsi</label>
                    <InputTextarea
                      className="w-full form-input"
                      rows={3}
                      placeholder="Masukkan deskripsi testimoni"
                      value={t.deskripsi}
                      onChange={(e) => updateArrayItem("testimoni", i, "deskripsi", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button
              icon="pi pi-plus"
              label="Tambah Testimoni"
              className="add-item-btn"
              onClick={() =>
                addArray("testimoni", { gambar: { type: "file", value: null }, nama: "", deskripsi: "" })
              }
            />
          </div>
        </div>

        {/* SECTION 5: Konten Tambahan */}
        <div className="form-section-card">
          <div className="section-header">
            <h3 className="section-title">🎬 Konten Tambahan</h3>
            <p className="section-description">Video, list point, dan konten pendukung</p>
          </div>
          <div className="section-content">
            {/* VIDEO */}
            <div className="form-field-group">
              <label className="form-label">
                <span className="label-icon">🎥</span>
                Video (URL, pisahkan dengan koma)
              </label>
              <InputTextarea
                className="w-full form-input"
                rows={3}
                value={form.video}
                placeholder="https://youtube.com/watch?v=..., https://youtube.com/watch?v=..."
                onChange={(e) => handleChange("video", e.target.value)}
              />
              <p className="field-hint">Masukkan URL video YouTube, pisahkan dengan koma jika lebih dari satu</p>
            </div>

            {/* LIST POINT */}
            <div className="form-field-group">
              <label className="form-label">
                <span className="label-icon">✅</span>
                List Point (Benefit)
              </label>
              {form.list_point.map((p, i) => (
                <div key={i} className="list-point-item">
                  <div className="list-point-number">{i + 1}</div>
                  <InputText
                    className="flex-1 form-input"
                    value={p.nama}
                    placeholder={`Point ${i + 1}`}
                    onChange={(e) => updateArrayItem("list_point", i, "nama", e.target.value)}
                  />
                  <Button 
                    icon="pi pi-trash" 
                    severity="danger" 
                    className="p-button-danger p-button-sm"
                    onClick={() => removeArray("list_point", i)}
                  />
                </div>
              ))}
              <Button
                icon="pi pi-plus"
                label="Tambah List Point"
                className="add-item-btn"
                onClick={() => addArray("list_point", { nama: "" })}
              />
            </div>
          </div>
        </div>

        {/* SECTION 6: Form Fields */}
        <section className="preview-form space-y-4 mt-6" aria-label="Order form">
          <h2 className="font-semibold text-lg">Informasi Dasar</h2>

          {[
            { label: "Nama", key: "nama", placeholder: "Nama lengkap Anda" },
            { label: "Nomor WhatsApp", key: "wa", placeholder: "08xxxxxxxxxx" },
            { label: "Email", key: "email", placeholder: "email@example.com" },
          ].map((field, i) => (
            <div 
              key={i}
              className="p-4 border border-gray-200 rounded-xl bg-gray-50 shadow-sm"
            >
              <br></br>
              <label className="font-medium text-gray-700">{field.label}</label>
              <input
                type="text"
                placeholder={field.placeholder}
                className="w-full p-3 border border-gray-300 rounded-xl mt-2 focus:border-blue-500 focus:ring focus:ring-blue-200 transition"
                disabled
              />
            </div>
          ))}

          {/* ALAMAT */}
          <div className="space-y-2 p-4 border border-gray-200 rounded-xl bg-white shadow-sm">
            <br></br>
            <label className="block text-sm font-semibold text-gray-700">
              Alamat
            </label>
            <textarea
              placeholder="Alamat lengkap"
              className="w-full p-3 border border-gray-300 rounded-xl mt-2 focus:border-blue-500 focus:ring focus:ring-blue-200 transition"
              rows={3}
              disabled
            />
          </div>
        </section>

        {/* SECTION 7: Custom Fields */}
        <div className="form-section-card">
          <div className="section-header">
            <h3 className="section-title">🔧 Custom Fields</h3>
            <p className="section-description">Tambah field tambahan untuk form pembeli</p>
          </div>
          <div className="section-content">
            {form.custom_field.map((f, i) => (
              <div key={i} className="custom-field-item-card">
                <div className="custom-field-header">
                  <span className="custom-field-number">Field {i + 1}</span>
                  {!f.required && (
                    <Button
                      icon="pi pi-trash"
                      severity="danger"
                      className="p-button-danger p-button-sm"
                      onClick={() => removeArray("custom_field", i)}
                    />
                  )}
                </div>
                <div className="custom-field-content">
                  <div className="form-field-group">
                    <label className="form-label-small">Nama Field</label>
                    <InputText
                      className="w-full form-input"
                      value={f.label}
                      placeholder="Contoh: Nomor HP, Instansi, dll"
                      onChange={(e) => updateArrayItem("custom_field", i, "label", e.target.value)}
                    />
                  </div>
                  <div className="form-field-group">
                    <label className="form-label-small">Placeholder / Contoh</label>
                    <InputText
                      className="w-full form-input"
                      value={f.value}
                      placeholder={(f.label || "Contoh isian") + (f.required ? " *" : "")}
                      onChange={(e) => updateArrayItem("custom_field", i, "value", e.target.value)}
                    />
                  </div>
                  <div className="custom-field-required">
                    <input
                      type="checkbox"
                      id={`required-${i}`}
                      checked={f.required}
                      onChange={(e) => updateArrayItem("custom_field", i, "required", e.target.checked)}
                    />
                    <label htmlFor={`required-${i}`} className="checkbox-label">
                      Field wajib diisi
                    </label>
                  </div>
                </div>
              </div>
            ))}
            <Button
              icon="pi pi-plus"
              label="Tambah Custom Field"
              className="add-item-btn"
              onClick={() => addArray("custom_field", { key: "", label: "", value: "", required: false })}
            />
          </div>
        </div>

        {/* SECTION 8: Pengaturan */}
        <div className="form-section-card">
          <div className="section-header">
            <h3 className="section-title">⚙️ Pengaturan</h3>
            <p className="section-description">Assign user, landing page, dan status produk</p>
          </div>
          <div className="section-content">
            {/* ASSIGN */}
            <div className="form-field-group">
              <label className="form-label">
                <span className="label-icon">👥</span>
                Assign User
              </label>
              <MultiSelect
                className="w-full form-input"
                value={form.assign}
                options={userOptions}
                onChange={(e) => handleChange("assign", e.value || [])}
                placeholder="Pilih user yang di-assign"
                display="chip"
                showClear
              />
              <p className="field-hint">Pilih user yang akan menangani produk ini</p>
            </div>

            {/* LANDING PAGE */}
            <div className="form-field-group">
              <label className="form-label">
                <span className="label-icon">🌐</span>
                Landing Page
              </label>
              <InputText
                className="w-full form-input"
                value={form.landingpage || "1"}
                onChange={(e) => handleChange("landingpage", e.target.value)}
                placeholder="Masukkan nama landing page atau kode"
              />
              <p className="field-hint">Default: 1</p>
            </div>

            {/* STATUS */}
            <div className="status-card">
              <div className="status-content">
                <div className="status-info">
                  <label className="form-label">
                    <span className="label-icon">🔘</span>
                    Status Produk
                  </label>
                  <p className="status-indicator">
                    {form.status === 1 ? (
                      <span className="status-active">● Aktif</span>
                    ) : (
                      <span className="status-inactive">○ Tidak Aktif</span>
                    )}
                  </p>
                </div>
                <InputSwitch 
                  checked={form.status === 1} 
                  onChange={(e) => handleChange("status", e.value ? 1 : 0)} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="submit-section">
          <Button 
            label="Update Produk" 
            icon="pi pi-save"
            className="p-button-primary submit-btn" 
            onClick={handleSubmit}
          />
          <p className="submit-hint">Pastikan semua data sudah lengkap sebelum mengupdate</p>
        </div>
      </div>
      {/* ================= RIGHT: PREVIEW ================= */}
      <div className="builder-preview-card">
        <LandingTemplate form={form} />
      </div>
    </div>
  );
}

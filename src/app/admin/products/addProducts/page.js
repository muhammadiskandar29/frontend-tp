"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

  // ============================
  // SLUGIFY - Generate kode dari nama
  // ============================
  const generateKode = (text) => {
    return (text || "")
    .toLowerCase()
    .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
  };





// form state
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
  custom_field: [],   // <--- kosong di awal
  list_point: [],   
  testimoni: [],
  fb_pixel: [],
  event_fb_pixel: [],
  gtm: [],
  video: "",
};


  const [form, setForm] = useState(defaultForm);

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
  // SUBMIT
  // ============================
  const handleSubmit = async () => {
    try {
      const hasFile =
        (form.header.type === "file" && form.header.value) ||
        form.gambar.some((g) => g.path.type === "file" && g.path.value) ||
        form.testimoni.some((t) => t.gambar.type === "file" && t.gambar.value);

      let payload;
      let isFormData = false;

      if (hasFile) {
        payload = new FormData();
        isFormData = true;

        // Header
        if (form.header.type === "file" && form.header.value) {
          payload.append("header", form.header.value);
        }

        // Gallery - format: gambar[0][file], gambar[0][caption]
        form.gambar.forEach((g, idx) => {
          if (g.path.type === "file" && g.path.value) {
            payload.append(`gambar[${idx}][file]`, g.path.value);
          }
          payload.append(`gambar[${idx}][caption]`, g.caption || "");
        });

        // Testimoni
        form.testimoni.forEach((t, idx) => {
          if (t.gambar.type === "file" && t.gambar.value) {
            payload.append(`testimoni[${idx}][gambar]`, t.gambar.value);
          }
          payload.append(`testimoni[${idx}][nama]`, t.nama);
          payload.append(`testimoni[${idx}][deskripsi]`, t.deskripsi);
        });

        // Fields
        payload.append("nama", form.nama);
        // SELALU generate kode dari nama dengan dash
        const kode = generateKode(form.nama);
        payload.append("kode", kode);
        payload.append("url", "/" + kode);
        payload.append("deskripsi", form.deskripsi);
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
        // user_input adalah ID user yang membuat produk (current user)
        const userInputId = currentUser?.id || form.user_input;
        if (userInputId) {
          payload.append("user_input", userInputId);
        }
        // Kirim kategori/kategori_id sebagai integer
        const kategoriId =
          form.kategori !== null && form.kategori !== undefined
            ? Number(form.kategori)
            : null;
        if (kategoriId !== null && !Number.isNaN(kategoriId)) {
          payload.append("kategori", kategoriId);
          payload.append("kategori_id", kategoriId);
        }
      } else {
        // Kirim kategori/kategori_id sebagai integer
        const kategoriId =
          form.kategori !== null && form.kategori !== undefined
            ? Number(form.kategori)
            : null;
        
        payload = {
          ...form,
          kategori: !Number.isNaN(kategoriId) ? kategoriId : null,
          kategori_id: !Number.isNaN(kategoriId) ? kategoriId : null,
          harga_coret: Number(form.harga_coret) || 0,
          harga_asli: Number(form.harga_asli) || 0,
          tanggal_event: formatDateForBackend(form.tanggal_event),
          assign: JSON.stringify(form.assign),
          gtm: JSON.stringify(form.gtm),
          fb_pixel: JSON.stringify(form.fb_pixel),
          event_fb_pixel: JSON.stringify(
            form.event_fb_pixel.map((ev) => ({ event: ev }))
          ),
          gambar: JSON.stringify(
            form.gambar.map((g) => ({ path: null, caption: g.caption }))
          ),
          testimoni: JSON.stringify(
            form.testimoni.map((t) => ({
              gambar: null,
              nama: t.nama,
              deskripsi: t.deskripsi,
            }))
          ),
        };
      }

      console.log("FINAL PAYLOAD:", payload);

      const res = await fetch(
        "/api/admin/produk",
        {
          method: "POST",
          headers: {
            ...(isFormData ? {} : { "Content-Type": "application/json" }),
            Accept: "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: isFormData ? payload : JSON.stringify(payload),
        }
      );

      // Handle response - check if it's JSON first
      const contentType = res.headers.get("content-type");
      let data;
      
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await res.json();
        } catch (parseError) {
          const textResponse = await res.text();
          console.error("❌ Failed to parse JSON response:", textResponse.substring(0, 200));
          alert("Terjadi kesalahan: Response dari server tidak valid.");
          return;
        }
      } else {
        const textResponse = await res.text();
        console.error("❌ Non-JSON response received:", textResponse.substring(0, 200));
        alert("Terjadi kesalahan: Server mengembalikan response yang tidak valid.");
        return;
      }
      
      // Logging struktur JSON lengkap
      console.log("Success:", data.success);
      console.log("Data:", data.data);
      console.table(data.data);

      if (!res.ok) {
        console.error("❌ API ERROR:", data);
        alert(data?.message || "Gagal membuat produk!");
        return;
      }

      alert("Produk berhasil dibuat!");
      console.log("SUCCESS:", data);
      
      // Redirect ke halaman products
      router.push("/admin/products");
    } catch (err) {
      console.error("❌ Submit error:", err);
      alert("Terjadi kesalahan saat submit: " + (err.message || "Unknown error"));
    }
  };


const [kategoriOptions, setKategoriOptions] = useState([]);
const [userOptions, setUserOptions] = useState([]);
const [currentUser, setCurrentUser] = useState(null); // User yang sedang login

useEffect(() => {
  async function fetchInitialData() {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // Ambil data user yang sedang login
      const userSession = localStorage.getItem("user");
      if (userSession) {
        try {
          const userData = JSON.parse(userSession);
          setCurrentUser(userData);
        } catch (e) {
          console.error("Error parsing user session:", e);
        }
      }

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

      // 2️⃣ Fetch produk (misal edit mode)
      const produkRes = await fetch(
        "/api/admin/produk/1",
        { headers }
      );
      const produkData = await produkRes.json();
      
      // Logging struktur JSON lengkap
      console.log("Success:", produkData.success);
      console.log("Data:", produkData.data);
      console.table(produkData.data);

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
            .filter((u) => u.status === "1" || u.status === 1) // Filter hanya status 1
            .map((u) => ({ label: u.nama || u.name, value: u.id }))
        : [];
      setUserOptions(userOpts);

      // ✅ SELALU generate kode dari nama dengan dash
      const kodeGenerated = generateKode(produkData.nama || "produk-baru");

      // Handle kategori_id: if kategori_rel exists, use its ID; otherwise use produkData.kategori_id
      let kategoriId = null;
      if (produkData.kategori_rel) {
        kategoriId = produkData.kategori_rel.id ? Number(produkData.kategori_rel.id) : null;
      } else if (produkData.kategori
      ) {
        kategoriId = Number(produkData.kategori
        );
      } else if (produkData.kategori) {
        // Backward compatibility: if kategori is string (name), try to find ID
        // This should not happen in new implementation, but handle for old data
        const found = activeCategories.find(k => k.nama === produkData.kategori);
        kategoriId = found ? Number(found.id) : null;
      }

      // Set user_input ke current user ID
      const currentUserId = currentUser?.id || JSON.parse(localStorage.getItem("user") || "{}")?.id;
      
      setForm((f) => ({
        ...f,
        kategori: null,
        assign: [],
        user_input: currentUserId ? currentUserId : null, // ID user yang membuat
        custom_field: [],
        kode: "",
        url: "/",
        landingpage: "1",
      }));
    } catch (err) {
      console.error("Fetch initial data error:", err);
    }
  }

  fetchInitialData();
}, []);


  // ============================
  // UI
  // ============================
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
          <h2 className="form-title">Tambah Produk Baru</h2>
          <p className="form-subtitle">Lengkapi informasi produk di bawah ini</p>
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
                // SELALU generate kode dari nama dengan dash
                const kode = generateKode(nama);
                setForm({ 
                  ...form, 
                  nama, 
                  kode: kode,
                  url: "/" + kode
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
              <label className="file-upload-label">Upload File</label>
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

      {/* SECTION 6: Form Fields - Compact Style */}
      <section className="compact-form-section-preview" aria-label="Order form">
        <h2 className="compact-form-title-preview">Lengkapi Data:</h2>
        
        <div className="compact-form-card-preview">
          {/* Nama Lengkap */}
          <div className="compact-field-preview">
            <label className="compact-label-preview">
              Nama Lengkap <span className="required-preview">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Krisdayanti"
              className="compact-input-preview"
              disabled
            />
          </div>

          {/* No. WhatsApp */}
          <div className="compact-field-preview">
            <label className="compact-label-preview">
              No. WhatsApp <span className="required-preview">*</span>
            </label>
            <div className="wa-input-wrapper-preview">
              <div className="wa-prefix-preview">
                <span className="flag">🇮🇩</span>
                <span className="code">+62</span>
              </div>
              <input
                type="tel"
                placeholder="812345678"
                className="compact-input-preview wa-input-preview"
                disabled
              />
            </div>
          </div>

          {/* Email */}
          <div className="compact-field-preview">
            <label className="compact-label-preview">
              Email <span className="required-preview">*</span>
            </label>
            <input
              type="email"
              placeholder="email@example.com"
              className="compact-input-preview"
              disabled
            />
          </div>

          {/* Alamat */}
          <div className="compact-field-preview">
            <label className="compact-label-preview">Alamat</label>
            <textarea
              placeholder="Alamat lengkap (opsional)"
              className="compact-input-preview compact-textarea-preview"
              rows={2}
              disabled
            />
          </div>
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
          {/* CREATED BY - Read Only */}
          <div className="form-field-group">
            <label className="form-label">
              <span className="label-icon">👤</span>
              Dibuat Oleh (Created By)
            </label>
            <div className="created-by-display">
              <div className="user-avatar">
                {(currentUser?.nama || currentUser?.name || "U").charAt(0).toUpperCase()}
              </div>
              <div className="user-info">
                <span className="user-name">{currentUser?.nama || currentUser?.name || "Loading..."}</span>
                <span className="user-email">{currentUser?.email || "-"}</span>
              </div>
            </div>
            <p className="field-hint">User yang membuat produk ini (otomatis)</p>
          </div>

          {/* ASSIGN BY - Penanggung Jawab */}
          <div className="form-field-group">
            <label className="form-label">
              <span className="label-icon">👥</span>
              Penanggung Jawab (Assign By) <span className="required">*</span>
            </label>
            <MultiSelect
              className="w-full form-input"
              value={form.assign}
              options={userOptions}
              onChange={(e) => handleChange("assign", e.value || [])}
              placeholder="Pilih penanggung jawab produk"
              display="chip"
              showClear
              filter
              filterPlaceholder="Cari user..."
            />
            <p className="field-hint">Pilih user yang bertanggung jawab menangani produk ini</p>
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
          label="Simpan Produk" 
          icon="pi pi-save"
          className="p-button-primary submit-btn" 
          onClick={handleSubmit}
        />
        <p className="submit-hint">Pastikan semua data sudah lengkap sebelum menyimpan</p>
      </div>
      </div>
      {/* ================= RIGHT: PREVIEW ================= */}
      <div className="builder-preview-card">
        <LandingTemplate form={form} />
      </div>
    </div>
  );
}

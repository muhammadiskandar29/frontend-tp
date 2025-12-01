"use client";

import { useEffect, useState } from "react";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputSwitch } from "primereact/inputswitch";
import { Button } from "primereact/button";
import LandingTemplate from "@/components/LandingTemplate";
import { MultiSelect } from "primereact/multiselect";
import "@/styles/add-products.css";

export default function Page() {
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
  kategori: [],
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
  landingpage: "",
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
  // COMPRESS IMAGE TO JPG (MAX 1MB)
  // ============================
  const compressImageToJPG = async (file, maxSizeMB = 1, maxWidth = 1600) => {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith("image/")) {
        reject(new Error("File bukan gambar"));
        return;
      }

      const maxSizeBytes = maxSizeMB * 1024 * 1024; // 1MB in bytes
      const isJPG = file.type === "image/jpeg" || file.type === "image/jpg";
      const isPNG = file.type === "image/png";

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Resize if too large
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");

          // For PNG or other formats with transparency, fill white background
          if (!isJPG) {
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, width, height);
          }

          // Draw image
          ctx.drawImage(img, 0, 0, width, height);

          // Try different quality levels to get under 1MB
          const tryCompress = (quality) => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error("Failed to convert/compress image"));
                  return;
                }

                // If size is acceptable or quality is too low, return
                if (blob.size <= maxSizeBytes || quality <= 0.3) {
                  const jpgFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                    type: "image/jpeg",
                    lastModified: Date.now(),
                  });
                  resolve(jpgFile);
                } else {
                  // Try lower quality
                  tryCompress(quality - 0.1);
                }
              },
              "image/jpeg",
              quality
            );
          };

          // Start with quality 0.85
          tryCompress(0.85);
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  // ============================
  // SUBMIT
  // ============================
  const handleSubmit = async () => {
    try {
      // Validation
      if (!form.nama || form.nama.trim() === "") {
        alert("Nama produk wajib diisi!");
        return;
      }

      // Get kategori ID dari form
      // form.kategori adalah array, ambil ID dari index pertama
      const kategoriId = form.kategori && form.kategori.length > 0 
        ? form.kategori[0] 
        : null;

      if (!kategoriId) {
        alert("Kategori wajib dipilih!");
        return;
      }

      // Validate header is required
      if (!form.header?.value || form.header?.type !== "file") {
        alert("Header gambar wajib diupload!");
        return;
      }

      console.log("📤 Kategori ID yang akan dikirim:", kategoriId);
      console.log("📤 Tipe kategori ID:", typeof kategoriId);

      const hasFile =
        (form.header?.type === "file" && form.header.value) ||
        form.gambar.some((g) => g.path?.type === "file" && g.path?.value) ||
        form.testimoni.some((t) => t.gambar?.type === "file" && t.gambar?.value);

      let payload;
      let isFormData = false;

      if (hasFile) {
        payload = new FormData();
        isFormData = true;

        // Process all files: compress to JPG (max 1MB)
        try {
          // Process Header
          if (form.header?.type === "file" && form.header.value) {
            const compressedHeader = await compressImageToJPG(form.header.value, 1, 1600);
            payload.append("header", compressedHeader);
          }

          // Process Gallery
          for (let idx = 0; idx < form.gambar.length; idx++) {
            const g = form.gambar[idx];
            if (g.path?.type === "file" && g.path.value) {
              const compressedGambar = await compressImageToJPG(g.path.value, 1, 1600);
              payload.append(`gambar[${idx}][path]`, compressedGambar);
            }
            payload.append(`gambar[${idx}][caption]`, g.caption || "");
          }

          // Process Testimoni
          for (let idx = 0; idx < form.testimoni.length; idx++) {
            const t = form.testimoni[idx];
            if (t.gambar?.type === "file" && t.gambar.value) {
              const compressedTestimoni = await compressImageToJPG(t.gambar.value, 1, 1600);
              payload.append(`testimoni[${idx}][gambar]`, compressedTestimoni);
            }
            payload.append(`testimoni[${idx}][nama]`, t.nama || "");
            payload.append(`testimoni[${idx}][deskripsi]`, t.deskripsi || "");
          }
        } catch (error) {
          console.error("❌ Error processing images:", error);
          alert(`Gagal memproses gambar: ${error.message}`);
          return;
        }

        // Fields
        const kode = form.kode || generateKode(form.nama);
        const url = form.url || "/" + kode; // Pastikan URL selalu ada, default dari kode
        
        payload.append("nama", form.nama);
        payload.append("kode", kode);
        payload.append("url", url.startsWith("/") ? url : "/" + url); // Pastikan URL dimulai dengan /
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
        payload.append("landingpage", form.landingpage || "1");
        payload.append("status", form.status || 1);
        
        // Get user_input dari current user (otomatis)
        const userInputId = (() => {
          try {
            const userSession = localStorage.getItem("user");
            if (userSession) {
              const userData = JSON.parse(userSession);
              return userData?.id || null;
            }
          } catch (e) {
            console.error("Error parsing user from localStorage:", e);
          }
          return null;
        })();
        
        if (!userInputId) {
          alert("User input tidak ditemukan. Silakan login ulang!");
          return;
        }
        
        payload.append("user_input", String(userInputId));
        
        // Kategori ID - format string sesuai response sukses
        payload.append("kategori", String(kategoriId));
      } else {
        // Get user_input dari current user (otomatis)
        const userInputId = (() => {
          try {
            const userSession = localStorage.getItem("user");
            if (userSession) {
              const userData = JSON.parse(userSession);
              return userData?.id || null;
            }
          } catch (e) {
            console.error("Error parsing user from localStorage:", e);
          }
          return null;
        })();
        
        if (!userInputId) {
          alert("User input tidak ditemukan. Silakan login ulang!");
          return;
        }

        const kode = form.kode || generateKode(form.nama);
        const url = form.url || "/" + kode; // Pastikan URL selalu ada, default dari kode
        
        payload = {
          kategori: String(kategoriId), // String format sesuai response
          user_input: userInputId, // Number
          nama: form.nama,
          kode: kode,
          url: url.startsWith("/") ? url : "/" + url, // Pastikan URL dimulai dengan /
          deskripsi: form.deskripsi || "",
          harga_coret: String(form.harga_coret || "0"),
          harga_asli: String(form.harga_asli || "0"),
          tanggal_event: formatDateForBackend(form.tanggal_event) || "",
          landingpage: String(form.landingpage || "1"),
          status: String(form.status || 1),
          assign: JSON.stringify(form.assign || []),
          list_point: JSON.stringify(form.list_point || []),
          testimoni: JSON.stringify(
            form.testimoni.map((t) => ({
              gambar: null,
              nama: t.nama || "",
              deskripsi: t.deskripsi || "",
            }))
          ),
          video: JSON.stringify(
            form.video
              ? form.video.split(",").map((v) => v.trim()).filter((v) => v)
              : []
          ),
          custom_field: JSON.stringify(
            form.custom_field.map((f, idx) => ({
              nama_field: f.label || f.key || "",
              urutan: idx + 1,
            }))
          ),
          fb_pixel: JSON.stringify(form.fb_pixel || []),
          event_fb_pixel: JSON.stringify(
            (form.event_fb_pixel || []).map((ev) => ({ event: ev }))
          ),
          gtm: JSON.stringify(form.gtm || []),
          gambar: JSON.stringify(
            form.gambar.map((g) => ({ path: null, caption: g.caption || "" }))
          ),
        };
      }

      console.log("📤 FINAL PAYLOAD:", isFormData ? "FormData" : payload);
      if (!isFormData) {
        console.log("📤 Kategori dalam payload:", payload.kategori);
        console.log("📤 User Input dalam payload:", payload.user_input);
      }

      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/produk2", {
        method: "POST",
        headers: {
          ...(isFormData ? {} : { "Content-Type": "application/json" }),
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: isFormData ? payload : JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("❌ API ERROR:", data);
        alert("Gagal membuat produk!");
        return;
      }

      alert("Produk berhasil dibuat!");
      console.log("SUCCESS:", data);
    } catch (err) {
      console.error("❌ Submit error:", err);
      alert("Terjadi kesalahan saat submit.");
    }
  };


const [kategoriOptions, setKategoriOptions] = useState([]);
const [userOptions, setUserOptions] = useState([]);
const [isLoadingKategori, setIsLoadingKategori] = useState(true);

useEffect(() => {
  async function fetchInitialData() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoadingKategori(false);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // 1️⃣ Fetch kategori dari API proxy
      const kategoriRes = await fetch("/api/admin/kategori-produk", { headers });
      const kategoriData = await kategoriRes.json();
      
      console.log("📋 Kategori Data:", kategoriData);
      
      // Filter hanya kategori yang aktif (status === "1")
      const activeCategories = Array.isArray(kategoriData.data)
        ? kategoriData.data.filter((k) => k.status === "1" || k.status === 1)
        : [];
      
      // Map kategori dengan ID sebagai value (sesuai format backend)
      const kategoriOpts = activeCategories.map((k) => ({
        label: k.nama,
        value: k.id, // ID kategori untuk digunakan sebagai value
        id: k.id,    // Simpan ID juga untuk referensi
      }));
      
      console.log("✅ Kategori Options:", kategoriOpts);
      setKategoriOptions(kategoriOpts);
      setIsLoadingKategori(false);

      // 2️⃣ Fetch users dari API proxy
      const usersRes = await fetch("/api/admin/users", { headers });
      const usersJson = await usersRes.json();
      
      console.log("👥 Users Data:", usersJson);
      
      // Filter hanya user yang aktif
      const activeUsers = Array.isArray(usersJson.data)
        ? usersJson.data.filter((u) => u.status === "1" || u.status === 1)
        : [];
      
      const userOpts = activeUsers.map((u) => ({
        label: u.nama || u.name,
        value: u.id,
      }));
      
      console.log("✅ User Options:", userOpts);
      setUserOptions(userOpts);
    } catch (err) {
      console.error("❌ Fetch initial data error:", err);
      setIsLoadingKategori(false);
    }
  }

  fetchInitialData();
}, []);


  // ============================
  // UI
  // ============================
  return (
<div className="produk-container">
    <div className="produk-form">
      <h2 className="text-xl font-bold mb-2">Product Form</h2>

      {/* NAMA PRODUK */}
      <div>
        <label className="font-semibold">Nama Produk</label>
<InputText
  className="w-full"
  value={form.nama}
  onChange={(e) => {
    const nama = e.target.value;
    const kodeGenerated = generateKode(nama);
    setForm({ 
      ...form, 
      nama, 
      kode: kodeGenerated,  // kode otomatis dari nama
      url: "/" + kodeGenerated // url ikut kode
    });
  }}
/>
      </div>
<div>
  <label className="font-semibold">
    Kategori <span className="required">*</span>
  </label>
  <Dropdown
    className="w-full"
    value={form.kategori && form.kategori.length > 0 ? form.kategori[0] : null}
    options={kategoriOptions}
    optionLabel="label"
    optionValue="value"
    onChange={(e) => {
      const selectedId = e.value;
      console.log("✅ Kategori dipilih - ID:", selectedId, "Type:", typeof selectedId);
      handleChange("kategori", selectedId ? [selectedId] : []);
    }}
    placeholder={isLoadingKategori ? "Memuat kategori..." : "Pilih Kategori"}
    showClear
    filter
    filterPlaceholder="Cari kategori..."
    disabled={isLoadingKategori}
  />
  {kategoriOptions.length === 0 && !isLoadingKategori && (
    <small style={{ color: "#ef4444" }}>
      ⚠️ Tidak ada kategori tersedia. Silakan tambahkan kategori terlebih dahulu.
    </small>
  )}
</div>




      {/* KODE */}
<div>
  <label className="font-semibold">Kode</label>
<InputText
  className="w-full"
  value={form.kode || ""}  // <--- fallback
  onChange={(e) => {
    const kode = e.target.value;
    setForm({
      ...form,
      kode,
      url: "/" + (kode || "produk-baru"), // selalu ada url
    });
  }}
  placeholder="Isi kode produk"
/>
</div>

      {/* URL */}
      <div>
        <label className="font-semibold">URL</label>
        <InputText
          className="w-full"
          value={form.url || ""}   // <--- fallback
          onChange={(e) => handleChange("url", e.target.value)}
        />
      </div>
      {/* HEADER */}
      <div>
        <label className="font-semibold">Header (Upload File)</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleChange("header", { type: "file", value: e.target.files[0] })}
        />
      </div>

      {/* HARGA */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="font-semibold">Harga Coret</label>
          <InputNumber
            className="w-full"
            value={Number(form.harga_coret)}
            onValueChange={(e) => handleChange("harga_coret", e.value)}
          />
        </div>
        <div>
          <label className="font-semibold">Harga Asli</label>
          <InputNumber
            className="w-full"
            value={Number(form.harga_asli)}
            onValueChange={(e) => handleChange("harga_asli", e.value)}
          />
        </div>
      </div>

      {/* DESKRIPSI */}
      <div>
        <label className="font-semibold">Deskripsi</label>
        <InputTextarea
          className="w-full"
          rows={4}
          value={form.deskripsi}
          onChange={(e) => handleChange("deskripsi", e.target.value)}
        />
      </div>

      {/* TANGGAL EVENT */}
      <div>
        <label className="font-semibold">Tanggal Event</label>
        <Calendar
          className="w-full"
          showTime
          value={form.tanggal_event ? new Date(form.tanggal_event) : null}
          onChange={(e) => handleChange("tanggal_event", e.value)}
        />
      </div>

      {/* GALLERY */}
      <div>
        <label className="font-semibold">Gallery</label>
        {form.gambar.map((g, i) => (
          <div key={i} className="flex gap-2 items-center mb-2 border p-2 rounded">
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                updateArrayItem("gambar", i, "path", { type: "file", value: e.target.files[0] })
              }
            />
            <InputText
              className="flex-1"
              placeholder="Caption"
              value={g.caption}
              onChange={(e) => updateArrayItem("gambar", i, "caption", e.target.value)}
            />
            <Button
  icon="pi pi-trash"
  severity="danger"
  className="p-button-danger"
  onClick={() => removeArray("gambar", i)}
/>
          </div>
        ))}
        <Button
          label="+ Tambah Gambar"
          onClick={() => addArray("gambar", { path: { type: "file", value: null }, caption: "" })}
        />
      </div>

      {/* TESTIMONI */}
      <div>
        <label className="font-semibold">Testimoni</label>
        {form.testimoni.map((t, i) => (
          <div key={i} className="flex gap-2 items-center mb-2 border p-2 rounded">
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                updateArrayItem("testimoni", i, "gambar", { type: "file", value: e.target.files[0] })
              }
            />
            <InputText
              className="flex-1"
              placeholder="Nama"
              value={t.nama}
              onChange={(e) => updateArrayItem("testimoni", i, "nama", e.target.value)}
            />
            <InputTextarea
              className="flex-1"
              rows={2}
              placeholder="Deskripsi"
              value={t.deskripsi}
              onChange={(e) => updateArrayItem("testimoni", i, "deskripsi", e.target.value)}
            />
            <Button icon="pi pi-trash" severity="danger" onClick={() => removeArray("testimoni", i)} />
          </div>
        ))}
        <Button
          label="+ Tambah Testimoni"
          onClick={() =>
            addArray("testimoni", { gambar: { type: "file", value: null }, nama: "", deskripsi: "" })
          }
        />
      </div>

      {/* VIDEO, CUSTOM_FIELD, LIST_POINT */}
      <div>
        <label className="font-semibold">Video</label>
<InputTextarea
  className="w-full"
  rows={2}
  value={form.video} // langsung string
  onChange={(e) => handleChange("video", e.target.value)}
/>
      </div>

{/* HARD-CODE FIELDS */}
<div>
  <label className="font-semibold">Informasi Dasar</label>

  {/* NAMA */}
  <div className="grid grid-cols-12 gap-2 items-center mb-3 p-3 border rounded bg-gray-50">
    <div className="col-span-4">
      <label>Nama</label>
      <input
        type="text"
        placeholder="Nama"
        className="w-full p-2 border rounded"
      />
    </div>
        <br></br>
  </div>

  {/* NOMOR WHATSAPP */}
  <div className="grid grid-cols-12 gap-2 items-center mb-3 p-3 border rounded bg-gray-50">
    <div className="col-span-4">
      <label>Nomor WhatsApp</label>
      <input
        type="text"
        placeholder="Nomor WhatsApp"
        className="w-full p-2 border rounded"
      />
    </div>
        <br></br>

  </div>

  {/* EMAIL */}
  <div className="grid grid-cols-12 gap-2 items-center mb-3 p-3 border rounded bg-gray-50">
    <div className="col-span-4">
      <label>Email</label>
      <input
        type="text"
        placeholder="Email"
        className="w-full p-2 border rounded"
      />
    </div>
    <br></br>
  </div>

  {/* ALAMAT */}
  <div className="grid grid-cols-12 gap-2 items-center mb-3 p-3 border rounded bg-gray-50">
    <div className="col-span-4">
      <label>Alamat</label>
      <input
        type="text"
        placeholder="Alamat"
        className="w-full p-2 border rounded"
      />
    </div>
  </div>
</div>

<div>
  <label className="font-semibold">Custom Fields</label>
  {form.custom_field.map((f, i) => (
  <div
    key={i}
    className="grid grid-cols-12 gap-2 items-center mb-3 p-3 border rounded bg-gray-50"
  >
    {/* LABEL FIELD */}
    <div className="col-span-4">
      <InputText
        className="w-full"
        value={f.label}
        placeholder="Nama Field"
        onChange={(e) => updateArrayItem("custom_field", i, "label", e.target.value)}
      />
    </div>

    {/* VALUE FIELD */}
    <div className="col-span-5">
      <InputText
        className="w-full"
        value={f.value}
        placeholder={(f.label || "Isi field") + (f.required ? " *" : "")}
        onChange={(e) => updateArrayItem("custom_field", i, "value", e.target.value)}
      />
    </div>

    {/* REQUIRED TOGGLE */}
    <div className="col-span-2 flex items-center gap-2">
      <input
        type="checkbox"
        checked={f.required}
        onChange={(e) => updateArrayItem("custom_field", i, "required", e.target.checked)}
      />
      <span className="text-sm">Required</span>
    </div>

    {/* DELETE (jangan tampilkan untuk field default) */}
    <div className="col-span-1 text-right">
      {!f.required && (
        <Button
          icon="pi pi-trash"
          severity="danger"
          text
          onClick={() => removeArray("custom_field", i)}
        />
      )}
    </div>
  </div>
))}
  <Button
    label="+ Tambah Field"
    onClick={() => addArray("custom_field", { key: "", label: "", value: "", required: false })}
  />
</div>


<div>
  <label className="font-semibold">List Point</label>
  {form.list_point.map((p, i) => (
    <div key={i} className="flex gap-2 items-center mb-1">
      <InputText
        className="flex-1"
        value={p.nama}
        onChange={(e) => updateArrayItem("list_point", i, "nama", e.target.value)}
      />
      <Button icon="pi pi-trash" severity="danger" onClick={() => removeArray("list_point", i)} />
    </div>
  ))}
  <Button
    label="Tambah List Point"
    onClick={() => addArray("list_point", { nama: "" })}
  />
</div>

      <div>
  <label className="font-semibold">Assign</label>
<Dropdown
  className="w-full"
  value={form.assign}
  options={userOptions}
  onChange={(e) => handleChange("assign", [e.value])} // <--- jadikan array
/>
</div>


<div>
  <label className="font-semibold">Landing Page</label>
  <InputText
    className="w-full"
    value={form.landingpage || ""}
    onChange={(e) => handleChange("landingpage", e.target.value)}
    placeholder="Masukkan nama landing page atau kode"
  />
</div>



      {/* STATUS */}
      <div className="flex items-center gap-3">
        <label className="font-semibold">Status</label>
        <InputSwitch checked={form.status === 1} onChange={(e) => handleChange("status", e.value ? 1 : 0)} />
      </div>

      {/* SUBMIT */}
      <Button label="Save" icon="pi pi-save" className="p-button-primary mt-5" onClick={handleSubmit} />
    </div>
          {/* ================= RIGHT: PREVIEW ================= */}
        <LandingTemplate form={form} />
    </div>
  );
}
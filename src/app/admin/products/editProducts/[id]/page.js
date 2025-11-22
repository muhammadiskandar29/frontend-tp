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
  // SUBMIT
  // ============================
  const handleSubmit = async () => {
    if (!productId) {
      alert("Product ID tidak ditemukan!");
      return;
    }

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

        // Gallery
        form.gambar.forEach((g, idx) => {
          if (g.path.type === "file" && g.path.value) {
            payload.append(`gambar[${idx}][path]`, g.path.value);
          }
          payload.append(`gambar[${idx}][caption]`, g.caption);
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
        payload.append("url", form.url);
        const kode = form.kode || generateKode(form.nama);
        payload.append("kode", kode);
        payload.append("url", "/" + kode); // pastikan url selalu sinkron
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
        payload.append("user_input", JSON.stringify(form.user_input));
        const kategoriNama = form.kategori && form.kategori.length ? form.kategori[0] : null;
        payload.append("kategori", kategoriNama);
      } else {
        // Pastikan kategori dikirim sebagai nama (string), bukan array
        const kategoriNama = form.kategori && form.kategori.length ? form.kategori[0] : null;
        payload = {
          ...form,
          kategori: kategoriNama, // Kirim nama kategori sebagai string
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
        `/api/admin/produk/${productId}`,
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

      const data = await res.json();

      if (!res.ok) {
        console.error("❌ API ERROR:", data);
        alert("Gagal mengupdate produk!");
        return;
      }

      alert("Produk berhasil diupdate!");
      console.log("SUCCESS:", data);
      router.push("/admin/products");
    } catch (err) {
      console.error("❌ Submit error:", err);
      alert("Terjadi kesalahan saat submit.");
    }
  };


const [kategoriOptions, setKategoriOptions] = useState([]);
const [userOptions, setUserOptions] = useState([]);

useEffect(() => {
  async function fetchInitialData() {
    if (!productId) {
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // 1️⃣ Fetch kategori
      const kategoriRes = await fetch(
        "/api/admin/kategori-produk",
        { headers }
      );
      const kategoriData = await kategoriRes.json();
      const kategoriOpts = Array.isArray(kategoriData.data)
        ? kategoriData.data.map((k) => ({ label: k.nama, value: k.nama }))
        : [];
      setKategoriOptions(kategoriOpts);

      // 2️⃣ Fetch produk berdasarkan ID
      const produkRes = await fetch(
        `/api/admin/produk/${productId}`,
        { headers }
      );
      const produkResponse = await produkRes.json();
      
      if (!produkRes.ok || !produkResponse.success) {
        throw new Error(produkResponse.message || "Gagal memuat data produk");
      }

      // Parse data produk untuk form
      const produkFormData = produkResponse.data || produkResponse;

      // 3️⃣ Fetch users
      const usersRes = await fetch(
        "/api/admin/users",
        { headers }
      );
      const usersJson = await usersRes.json();
      const userOpts = Array.isArray(usersJson.data)
        ? usersJson.data.map((u) => ({ label: u.nama || u.name, value: u.id }))
        : [];
      setUserOptions(userOpts);

      // ✅ generate kode otomatis jika null
      const kodeGenerated =
        produkFormData.kode || generateKode(produkFormData.nama || "produk-baru");

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
      
      setForm((f) => ({
        ...f,
        ...produkFormData,
        id: produkFormData.id || productId,
        kategori: produkFormData.kategori_rel ? [produkFormData.kategori_rel.nama] : [],
        assign: produkFormData.assign_rel ? produkFormData.assign_rel.map((u) => u.id) : [],
        user_input: produkFormData.user_input_rel ? [produkFormData.user_input_rel.id] : [],
        custom_field: safeParseJSON(produkFormData.custom_field, []).map(f => ({
          label: f.nama_field || f.label || "",
          value: f.value || "",
          required: f.required || false
        })),
        list_point: safeParseJSON(produkFormData.list_point, []).map(p => ({
          nama: p.nama || p
        })),
        testimoni: safeParseJSON(produkFormData.testimoni, []).map(t => ({
          gambar: t.gambar ? { type: "url", value: typeof t.gambar === "string" ? t.gambar : t.gambar.path || t.gambar } : { type: "file", value: null },
          nama: t.nama || "",
          deskripsi: t.deskripsi || ""
        })),
        fb_pixel: safeParseJSON(produkFormData.fb_pixel, []),
        event_fb_pixel: safeParseJSON(produkFormData.event_fb_pixel, []),
        gtm: safeParseJSON(produkFormData.gtm, []),
        gambar: safeParseJSON(produkFormData.gambar, []).map(g => ({
          path: { 
            type: "url", 
            value: typeof g === "string" ? g : (g.path || g) 
          }, 
          caption: g.caption || "" 
        })),
        header: produkFormData.header ? { 
          type: "url", 
          value: typeof produkFormData.header === "string" 
            ? produkFormData.header 
            : (produkFormData.header.path || produkFormData.header) 
        } : { type: "file", value: null },
        kode: kodeGenerated,
        url: produkFormData.url || "/" + kodeGenerated,
        video: produkFormData.video ? (
          Array.isArray(produkFormData.video) 
            ? produkFormData.video.join(", ") 
            : safeParseJSON(produkFormData.video, []).join(", ")
        ) : "",
      }));
    } catch (err) {
      console.error("Fetch initial data error:", err);
      alert("Gagal memuat data produk!");
    } finally {
      setLoading(false);
    }
  }

  fetchInitialData();
}, [productId]);


  // ============================
  // UI
  // ============================
  if (loading) {
    return (
      <div className="produk-container" style={{ padding: "2rem", textAlign: "center" }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="produk-container">
    <div className="produk-form">
      {/* Back Button */}
      <button
        className="back-to-products-btn"
        onClick={() => router.push("/admin/products")}
        aria-label="Back to products list"
      >
        <ArrowLeft size={18} />
        <span>Back to Products</span>
      </button>

      <h2 className="text-xl font-bold mb-2">Edit Product</h2>

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
  <label className="font-semibold">Kategori</label>
<Dropdown
  className="w-full"
  value={form.kategori[0] || null}
  options={kategoriOptions}
  onChange={(e) => handleChange("kategori", [e.value])}
  placeholder="Pilih Kategori"
/>
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
        {form.header?.type === "url" && form.header.value && (
          <div className="mb-2">
            <img src={form.header.value} alt="Current header" style={{ maxWidth: "200px", maxHeight: "100px" }} />
            <p className="text-sm text-gray-500">Current header image</p>
          </div>
        )}
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
            {g.path?.type === "url" && g.path.value && (
              <img src={g.path.value} alt={`Gallery ${i}`} style={{ maxWidth: "100px", maxHeight: "100px" }} />
            )}
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
            {t.gambar?.type === "url" && t.gambar.value && (
              <img src={t.gambar.value} alt={`Testimoni ${i}`} style={{ maxWidth: "100px", maxHeight: "100px" }} />
            )}
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
        value={f.label || f.nama_field}
        placeholder="Nama Field"
        onChange={(e) => updateArrayItem("custom_field", i, "label", e.target.value)}
      />
    </div>

    {/* VALUE FIELD */}
    <div className="col-span-5">
      <InputText
        className="w-full"
        value={f.value}
        placeholder={(f.label || f.nama_field || "Isi field") + (f.required ? " *" : "")}
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
      <Button label="Update Product" className="p-button-primary mt-5" onClick={handleSubmit} />
    </div>
          {/* ================= RIGHT: PREVIEW ================= */}
        <LandingTemplate form={form} />
    </div>
  );
}


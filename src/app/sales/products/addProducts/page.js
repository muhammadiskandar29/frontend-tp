"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "@/styles/add-products.css";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { FileUpload } from "primereact/fileupload";
import { InputSwitch } from "primereact/inputswitch";
import { Calendar } from "primereact/calendar";
import 'primeicons/primeicons.css';



export default function AddProducts({ initialData = null, lists = {} }) {
  const router = useRouter();

  const defaultLists = {
    categories: [
      { label: "Buku", value: "1" },
      { label: "Digital Products", value: "2" },
      { label: "Elektronik", value: "3" },
    ],
    assigns: [
      { label: "Admin", value: 1 },
      { label: "Sales", value: 2 },
      { label: "Support", value: 3 },
    ],
    pixels: [
      { label: "Pixel 3", value: 3 },
      { label: "Pixel 7", value: 7 },
    ],
    gtm: [
      { label: "GTM 1", value: 1 },
      { label: "GTM 4", value: 4 },
    ],
    ...lists,
  };

  const safeParse = (val) => {
    if (val == null) return null;
    if (Array.isArray(val)) return val;
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  };

  const defaultRequestedFields = [
    { nama_field: "Nama", wajib: true, aktif: true, urutan: 1 },
    { nama_field: "No Handphone/WhatsApp", wajib: true, aktif: true, urutan: 2 },
    { nama_field: "Email", wajib: false, aktif: true, urutan: 3 },
    { nama_field: "Jumlah Pesanan", wajib: false, aktif: true, urutan: 4 },
    { nama_field: "Catatan", wajib: false, aktif: true, urutan: 5 },
    { nama_field: "Alamat Lengkap", wajib: true, aktif: true, urutan: 6 },
    { nama_field: "Provinsi", wajib: true, aktif: true, urutan: 7 },
    { nama_field: "Kota/Kabupaten", wajib: true, aktif: true, urutan: 8 },
    { nama_field: "Kecamatan", wajib: true, aktif: true, urutan: 9 },
  ];

  const blankForm = {
    kategori: "",
    user_input: null,
    nama: "",
    url: "",
    header: "",
    harga_coret: "",
    harga_asli: "",
    deskripsi: "",
    tanggal_event: null,
    gambar: [],
    landingpage: "",
    status: 1,
    assign: [],
    custom_field: [], // requested fields stored here
    list_point: [],
    testimoni: [],
    fb_pixel: [],
    event_fb_pixel: [],
    gtm: [],
    video: [],
    id: null,
    sections_order: [
      "nama",
      "url",
      "header",
      "harga",
      "deskripsi",
      "tanggal_event",
      "gallery",
      "video",
      "list_point",
      "custom_field",
      "testimoni",
      "meta",
    ],
  };

  const [form, setForm] = useState(blankForm);

  // initialize - if editing existing product, load data; otherwise seed default requested fields
  useEffect(() => {
    if (!initialData) {
      // if no existing custom_field, seed defaults
      setForm((f) => ({
        ...f,
        custom_field: defaultRequestedFields.map((it) => ({ ...it })), // clone
      }));
      return;
    }
    const d = initialData;
    setForm((f) => ({
      ...f,
      kategori: d.kategori ?? f.kategori,
      user_input: d.user_input ?? f.user_input,
      nama: d.nama ?? f.nama,
      url: d.url ?? f.url,
      header: d.header ?? f.header,
      harga_coret: d.harga_coret ?? f.harga_coret,
      harga_asli: d.harga_asli ?? f.harga_asli,
      deskripsi: d.deskripsi ?? f.deskripsi,
      tanggal_event: d.tanggal_event ? new Date(d.tanggal_event) : f.tanggal_event,
      gambar: safeParse(d.gambar) ?? f.gambar,
      landingpage: d.landingpage ?? f.landingpage,
      status: d.status ?? f.status,
      assign: safeParse(d.assign) ?? f.assign,
      custom_field:
        safeParse(d.custom_field) && safeParse(d.custom_field).length
          ? safeParse(d.custom_field)
          : defaultRequestedFields.map((it) => ({ ...it })),
      list_point: safeParse(d.list_point) ?? f.list_point,
      testimoni: safeParse(d.testimoni) ?? f.testimoni,
      fb_pixel: safeParse(d.fb_pixel) ?? f.fb_pixel,
      event_fb_pixel: safeParse(d.event_fb_pixel) ?? f.event_fb_pixel,
      gtm: safeParse(d.gtm) ?? f.gtm,
      video: safeParse(d.video) ?? f.video,
      id: d.id ?? f.id,
      sections_order: d.sections_order ?? f.sections_order,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  // generic set
  const handleChange = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  // requested fields helpers
  const addRequestedField = (label = "Custom Field") => {
    setForm((f) => {
      const next = f.custom_field ? [...f.custom_field] : [];
      const urutan = next.length ? Math.max(...next.map((x) => Number(x.urutan || 0))) + 1 : 1;
      next.push({ nama_field: label, wajib: false, aktif: true, urutan });
      return { ...f, custom_field: next };
    });
  };

  const updateRequestedField = (index, patch) => {
    setForm((f) => {
      const copy = JSON.parse(JSON.stringify(f.custom_field || []));
      copy[index] = { ...copy[index], ...patch };
      // keep urutan numeric
      return { ...f, custom_field: copy };
    });
  };

  const removeRequestedField = (index) => {
    setForm((f) => {
      const copy = JSON.parse(JSON.stringify(f.custom_field || []));
      copy.splice(index, 1);
      // reassign urutan to keep contiguous order
      const reclocked = copy.map((c, i) => ({ ...c, urutan: i + 1 }));
      return { ...f, custom_field: reclocked };
    });
  };

  const moveRequestedField = (index, dir) => {
    // dir: -1 up, +1 down
    setForm((f) => {
      const copy = JSON.parse(JSON.stringify(f.custom_field || []));
      const len = copy.length;
      const to = index + dir;
      if (to < 0 || to >= len) return f;
      const item = copy.splice(index, 1)[0];
      copy.splice(to, 0, item);
      // reassign urutan
      const reclocked = copy.map((c, i) => ({ ...c, urutan: i + 1 }));
      return { ...f, custom_field: reclocked };
    });
  };

  // local file preview helpers
  const handleLocalFileAdd = (file, listKey = "gambar") => {
    const url = URL.createObjectURL(file);
    setForm((f) => ({ ...f, [listKey]: [...(f[listKey] || []), { path: url, caption: "" }] }));
  };

  const onHeaderSelect = (e) => {
    if (e?.files?.[0]) {
      handleChange("header", URL.createObjectURL(e.files[0]));
    }
  };

  const onGallerySelect = (e) => {
    if (e?.files && e.files.length) {
      for (const f of e.files) handleLocalFileAdd(f, "gambar");
    }
  };

  // product lists helpers
  const addItem = (key, item) => setForm((f) => ({ ...f, [key]: [...(f[key] || []), item] }));
  const updateItem = (key, idx, field, value) => {
    const copy = JSON.parse(JSON.stringify(form[key] || []));
    if (field) copy[idx][field] = value;
    else copy[idx] = value;
    setForm((f) => ({ ...f, [key]: copy }));
  };
  const removeItem = (key, idx) => {
    const copy = [...(form[key] || [])];
    copy.splice(idx, 1);
    setForm((f) => ({ ...f, [key]: copy }));
  };

  const formatDateForBackend = (dt) => {
    if (!dt) return null;
    const pad = (n) => String(n).padStart(2, "0");
    const d = new Date(dt);
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const buildPayload = () => {
    return {
      kategori: String(form.kategori ?? ""),
      user_input: form.user_input,
      nama: form.nama,
      url: form.url,
      header: form.header,
      harga_coret: String(form.harga_coret ?? ""),
      harga_asli: String(form.harga_asli ?? ""),
      deskripsi: form.deskripsi,
      tanggal_event: form.tanggal_event ? formatDateForBackend(form.tanggal_event) : null,
      gambar: JSON.stringify(form.gambar || []),
      landingpage: form.landingpage,
      status: form.status,
      assign: JSON.stringify(form.assign || []),
      custom_field: JSON.stringify(form.custom_field || []), // important
      list_point: JSON.stringify(form.list_point || []),
      testimoni: JSON.stringify(form.testimoni || []),
      fb_pixel: JSON.stringify(form.fb_pixel || []),
      event_fb_pixel: JSON.stringify(form.event_fb_pixel || []),
      gtm: JSON.stringify(form.gtm || []),
      video: JSON.stringify(form.video || []),
      sections_order: JSON.stringify(form.sections_order || []),
      id: form.id,
    };
  };

  const handleSave = async () => {
    const payload = buildPayload();
    try {
      const res = await fetch("/api/products", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      // Handle response - check if it's JSON first
      const contentType = res.headers.get("content-type");
      let json;
      
      if (contentType && contentType.includes("application/json")) {
        try {
          json = await res.json();
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
      
      if (!res.ok) throw new Error(json?.message || "Save failed");
      alert("Produk tersimpan");
      // router.push("/products") // optional
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan produk: " + err.message);
    }
  };

  // Render product sections (kept simple)
  const renderSection = (id) => {
    switch (id) {
    case "nama":
      return (
        <>
          <label className="block mb-1 font-medium">Product Name</label>
          <InputText value={form.nama} onChange={(e) => handleChange("nama", e.target.value)} className="w-full" />
          <small className="text-gray-500">will appear on the cart & invoice</small>
        </>
      );

    case "url":
      return (
        <>
          <label className="block mb-1 font-medium">Checkout Page URL</label>
          <div className="flex items-center">
            <div className="px-3 py-2 bg-gray-100 border rounded-l">/</div>
            <InputText className="w-full rounded-r" value={form.url} onChange={(e) => handleChange("url", e.target.value)} />
          </div>
        </>
      );

    case "header":
      return (
        <>
          <label className="block mb-1 font-medium">Header Image URL</label>
          <div className="flex gap-2">
            <InputText value={form.header} onChange={(e) => handleChange("header", e.target.value)} className="flex-1" placeholder="Paste image URL or upload" />
            <FileUpload name="headerFile" mode="basic" accept="image/*" maxFileSize={1000000} chooseLabel="Upload" onSelect={onHeaderSelect} />
          </div>
          <small className="text-gray-500">Or paste image URL</small>
        </>
      );

    case "harga":
      return (
        <>
          <label className="block mb-1 font-medium">Harga Coret</label>
          <InputNumber value={form.harga_coret ? Number(form.harga_coret) : null} mode="decimal" onValueChange={(e) => handleChange("harga_coret", e.value)} className="w-full mb-2" />
          <label className="block mb-1 font-medium">Harga Asli</label>
          <InputNumber value={form.harga_asli ? Number(form.harga_asli) : null} mode="decimal" onValueChange={(e) => handleChange("harga_asli", e.value)} className="w-full" />
        </>
      );

    case "deskripsi":
      return (
        <>
          <label className="block mb-1 font-medium">Deskripsi</label>
          <InputTextarea value={form.deskripsi} onChange={(e) => handleChange("deskripsi", e.target.value)} rows={4} className="w-full" />
        </>
      );

    case "tanggal_event":
      return (
        <>
          <label className="block mb-1 font-medium">Tanggal Event</label>
          <Calendar showTime value={form.tanggal_event ? new Date(form.tanggal_event) : null} onChange={(e) => handleChange("tanggal_event", e.value)} className="w-full" />
        </>
      );

    case "gallery":
      return (
        <>
          <label className="block mb-1 font-medium">Gallery</label>
          {(form.gambar || []).map((g, i) => (
            <div key={i} className="flex gap-2 items-center mb-2">
              <InputText placeholder="Path" value={g.path} onChange={(e) => updateItem("gambar", i, "path", e.target.value)} />
              <InputText placeholder="Caption" value={g.caption} onChange={(e) => updateItem("gambar", i, "caption", e.target.value)} />
              <Button icon="pi pi-trash" className="p-button-danger" onClick={() => removeItem("gambar", i)} />
            </div>
          ))}
          <div className="flex gap-2">
            <Button label="+ Tambah Gambar" onClick={() => addItem("gambar", { path: "", caption: "" })} />
            <FileUpload name="galleryFiles" mode="basic" accept="image/*" maxFileSize={2000000} chooseLabel="Upload" onSelect={onGallerySelect} />
          </div>
        </>
      );

    case "video":
      return (
        <>
          <label className="block mb-1 font-medium">Video (YouTube)</label>
          {(form.video || []).map((v, i) => (
            <div key={i} className="flex gap-2 items-center mb-2">
              <InputText placeholder="YouTube URL" value={v} onChange={(e) => updateItem("video", i, null, e.target.value)} />
              <Button icon="pi pi-trash" onClick={() => removeItem("video", i)} />
            </div>
          ))}
          <Button label="+ Tambah Video" onClick={() => addItem("video", "")} />
        </>
      );

    case "list_point":
      return (
        <>
          <label className="block mb-1 font-medium">List Point</label>
          {(form.list_point || []).map((p, i) => (
            <div key={i} className="flex gap-2 items-center mb-2">
              <InputText placeholder="Nama Point" value={p.nama} onChange={(e) => updateItem("list_point", i, "nama", e.target.value)} />
              <Button icon="pi pi-trash" onClick={() => removeItem("list_point", i)} />
            </div>
          ))}
          <Button label="+ Tambah Point" onClick={() => addItem("list_point", { nama: "", urutan: form.list_point.length + 1 })} />
        </>
      );

    case "custom_field":
      return (
        <>
          <label className="block mb-2 font-semibold text-gray-800">Custom Fields (Product-level)</label>
          {(form.custom_field || []).map((c, i) => (
            <div key={`prod-cf-${i}`} className="border border-gray-200 rounded-lg p-4 mb-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-3">
                <InputText placeholder="Nama Field" value={c.nama_field} className="flex-1" onChange={(e) => updateRequestedField(i, { nama_field: e.target.value })} />
              </div>
              <div className="flex items-center gap-3 mt-3">
                <label className="text-sm text-gray-600 select-none">Wajib</label>
                <InputSwitch checked={!!c.wajib} onChange={(e) => updateRequestedField(i, { wajib: e.value })} />
              </div>
              <Button icon="pi pi-trash" className="p-button-danger" onClick={() => removeRequestedField(i)} />
            </div>
          ))}
          <div className="mt-3">
            <button type="button" onClick={() => addRequestedField("Custom Field")} className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-all duration-200">
              + Tambah Custom Field
            </button>
          </div>
          <small className="text-gray-500 block mt-2">
            Requested fields (customer profile) are editable here and will be sent in <code className="bg-gray-100 px-1 rounded">custom_field</code>.
          </small>
        </>
      );

    case "testimoni":
      return (
        <>
          <label className="block mb-1 font-medium">Testimoni</label>
          {(form.testimoni || []).map((t, i) => (
            <div key={i} className="mb-2 p-2 border rounded">
              <div className="flex gap-2">
                <InputText placeholder="Gambar" value={t.gambar} onChange={(e) => updateItem("testimoni", i, "gambar", e.target.value)} />
                <InputText placeholder="Nama" value={t.nama} onChange={(e) => updateItem("testimoni", i, "nama", e.target.value)} />
              </div>
              <InputTextarea placeholder="Deskripsi" value={t.deskripsi} onChange={(e) => updateItem("testimoni", i, "deskripsi", e.target.value)} rows={2} className="mt-2" />
              <div className="mt-2">
                <Button icon="pi pi-trash" className="p-button-danger" onClick={() => removeItem("testimoni", i)} />
              </div>
            </div>
          ))}
          <Button label="+ Tambah Testimoni" onClick={() => addItem("testimoni", { gambar: "", nama: "", deskripsi: "" })} />
        </>
      );

    case "meta":
      return (
        <>
          <label className="block mb-1 font-medium">Meta & Integrations</label>
          <div className="mb-2">
            <label className="block text-sm">Kategori</label>
            <Dropdown value={form.kategori} options={defaultLists.categories} onChange={(e) => handleChange("kategori", e.value)} placeholder="Select Category" className="w-full" />
          </div>
          <div className="mb-2">
            <label className="block text-sm">Assign (users)</label>
            <MultiSelect value={form.assign} options={defaultLists.assigns} onChange={(e) => handleChange("assign", e.value)} className="w-full" placeholder="Select assign" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm">FB Pixel</label>
              <MultiSelect value={form.fb_pixel} options={defaultLists.pixels} onChange={(e) => handleChange("fb_pixel", e.value)} className="w-full" />
            </div>
            <div>
              <label className="block text-sm">Event FB Pixel</label>
              <MultiSelect value={form.event_fb_pixel} options={defaultLists.eventPixels} onChange={(e) => handleChange("event_fb_pixel", e.value)} className="w-full" />
            </div>
            <div>
              <label className="block text-sm">GTM</label>
              <MultiSelect value={form.gtm} options={defaultLists.gtm} onChange={(e) => handleChange("gtm", e.value)} className="w-full" />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <label className="text-sm">Status (Live)</label>
            <InputSwitch checked={form.status === 1} onChange={(e) => handleChange("status", e.value ? 1 : 0)} />
          </div>
          <div className="mt-3">
            <label className="block text-sm">Landingpage</label>
            <InputText value={form.landingpage} onChange={(e) => handleChange("landingpage", e.target.value)} className="w-full" />
          </div>
          <div className="mt-3">
            <label className="block text-sm">User Input ID</label>
            <InputNumber value={form.user_input} onValueChange={(e) => handleChange("user_input", e.value)} className="w-full" />
          </div>
          <div className="mt-3">
            <label className="block text-sm">Create At (Read-only)</label>
            <InputText value={form.create_at} className="w-full" disabled />
          </div>
        </>
      );

    default:
      return null;
  }
};


  // render requested fields editor (the "Requested Fields" box)
  const renderRequestedFieldsEditor = () => {
    const fields = form.custom_field || [];
    return (
      <div className="mt-4 p-4 bg-white border rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">Requested Fields</span>
            <span className="text-sm text-gray-500">— customer profile on checkout</span>
          </div>
          <Button label="Add Custom Field" onClick={() => addRequestedField("Custom Field")} />
        </div>

        <div className="space-y-2">
          {fields.map((f, i) => (
            <div key={`req-${i}`} className="flex items-center gap-2 p-2 border rounded">
              <div className="flex items-center gap-2 w-1/2">
                <input
                  type="checkbox"
                  checked={!!f.aktif}
                  onChange={(e) => updateRequestedField(i, { aktif: e.target.checked })}
                  className="w-4 h-4"
                />
                <InputText value={f.nama_field} onChange={(e) => updateRequestedField(i, { nama_field: e.target.value })} className="w-full" />
                <div className="flex items-center gap-1">
                  <label className="text-sm">Wajib</label>
                  <InputSwitch checked={!!f.wajib} onChange={(e) => updateRequestedField(i, { wajib: e.value })} />
                </div>
              </div>

              <div className="flex items-center gap-1 ml-auto">
                <Button icon="pi pi-arrow-up" className="p-button-text" disabled={i === 0} onClick={() => moveRequestedField(i, -1)} />
                <Button icon="pi pi-arrow-down" className="p-button-text" disabled={i === (fields.length - 1)} onClick={() => moveRequestedField(i, +1)} />
                <Button icon="pi pi-trash" className="p-button-danger" onClick={() => removeRequestedField(i)} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // preview for requested fields (ordered & only aktif)
  const renderRequestedFieldsPreview = () => {
    const fields = (form.custom_field || []).filter((f) => f.aktif);
    return (
      <div className="mt-4 p-3 bg-white border rounded-lg">
        <h3 className="font-semibold mb-2">Form Pembeli</h3>
        <div className="space-y-2">
          {fields.map((f, i) => (
            <div key={`pv-${i}`} className="flex flex-col">
              <label className="text-sm font-medium">
                {f.nama_field} {f.wajib ? <span className="text-red-500">*</span> : null}
              </label>
              <InputText placeholder={f.nama_field} className="w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Product preview renderer (simple)
  const renderPreview = (id) => {
    switch (id) {
      case "nama":
        return <h2 className="text-xl font-bold">{form.nama || "Nama Produk"}</h2>;
      case "url":
        return <p className="text-sm text-gray-600">URL: {form.url || "/produk-sample"}</p>;
      case "header":
        return form.header ? <img src={form.header} alt="header" className="w-full max-h-48 object-cover rounded mb-3" /> : <div className="w-full h-40 bg-gray-100 rounded flex items-center justify-center text-gray-400">Header preview</div>;
case "harga":
  return (
    <div className="flex items-center gap-2 text-lg">
      {form.harga_coret && (
        <span className="line-through text-gray-500">Rp {form.harga_coret}</span>
      )}
      {form.harga_asli ? (
        <span className="font-semibold">Rp {form.harga_asli}</span>
      ) : (
        <span className="text-gray-500">Harga</span>
      )}
    </div>
  );

      case "deskripsi":
        return <p className="text-gray-700">{form.deskripsi || "Deskripsi produk akan muncul di sini."}</p>;
      case "tanggal_event":
        return form.tanggal_event ? <p className="text-sm text-gray-600">Event: {new Date(form.tanggal_event).toLocaleString()}</p> : null;
      case "gallery":
        return (
          <div className="grid grid-cols-3 gap-2">
  {(form.gambar || []).map((g, i) => {
    if (!g.path) return null; // jangan render kalau belum ada gambar
    return (
      <img
        key={i}
        src={g.path}
        alt={g.caption || ""}
        className="w-full h-24 object-cover rounded"
      />
    );
  })}
</div>
        );
      case "video":
        return (
          <div className="space-y-2">
            {(form.video || []).map((v, i) => {
              const src = (v || "").replace("youtu.be/", "www.youtube.com/embed/");
              return src ? <iframe key={i} src={src} className="w-full h-48" title={`video-${i}`} allowFullScreen /> : null;
            })}
          </div>
        );
      case "list_point":
        return <ul className="list-disc pl-5">{(form.list_point || []).map((p, i) => <li key={i}>{p.nama}</li>)}</ul>;
      case "custom_field":
        // we'll show requested fields preview separately
        return null;
      case "testimoni":
        return (
          <div className="space-y-3">
            {(form.testimoni || []).map((t, i) => (
              <div key={i} className="p-2 border rounded flex gap-3 items-start">
                {t.gambar ? <img src={t.gambar} alt={t.nama} className="w-12 h-12 object-cover rounded-full" /> : <div className="w-12 h-12 bg-gray-200 rounded-full" />}
                <div>
                  <div className="font-semibold">{t.nama}</div>
                  <div className="text-sm text-gray-600">{t.deskripsi}</div>
                </div>
              </div>
            ))}
          </div>
        );
      case "meta":
        return (
          <div className="text-sm text-gray-600">
            <div>Kategori: {defaultLists.categories.find(c => c.value == form.kategori)?.label || "-"}</div>
            <div>Assign: {(form.assign || []).join(", ") || "-"}</div>
          </div>
        );
      default:
        return null;
    }
  };

 return (
  <div className="produk-container">
    {/* === KIRI: FORM INPUT === */}
    <div className="produk-form">
  <h2 className="title">Tambah Produk</h2>
  {form.sections_order.map((sec) => (
    <div key={sec} className="form-section">
      <h3>{sec.toUpperCase()}</h3>
      {renderSection(sec)}
    </div>
  ))}

  <Button label="Simpan Produk" onClick={handleSave} />
</div>


<div className="produk-preview">
  {/* Judul Produk */}
  <div className="promo-text">
    Tawaran Terbatas! <br />
    <strong>Isi Form Hari Ini, Langsung Dapat Akses Group Exclusive sebelum Ditutup!</strong>
  </div>
  <h4 className="preview-title">{form.nama || "Nama Produk"}</h4>

  {/* Gambar Header 200x200px */}
  <div className="header-wrapper">
    {form.header ? (
      <img src={form.header} alt="Header" className="preview-header-img" />
    ) : (
      <div className="preview-header-img" style={{ background: "#e5e7eb" }} />
    )}

    {/* Hardcode Promo Text */}
    <div className="promo-text">
TEMPAT TERBAIK UNTUK BELAJAR DARI PRAKTISI PROPERTI
    </div>
  </div>

  {/* Konten Preview */}
  <div className="preview-content">
    {/* Harga */}
    {(form.harga_coret || form.harga_asli) && (
      <div className="preview-price">
        {form.harga_coret && <span className="old">Rp {form.harga_coret}</span>}
        {form.harga_asli && <span className="new">Rp {form.harga_asli}</span>}
      </div>
    )}

    {/* Deskripsi */}
    {form.deskripsi && <div className="preview-description">{form.deskripsi}</div>}

    {/* List Point */}
    {form.list_point?.length > 0 && (
      <div className="preview-points">
        <ul>
          {form.list_point.map((p, i) => (
            <li key={i}>{p.nama}</li>
          ))}
        </ul>
      </div>
    )}

    {/* Gallery */}
{form.gambar?.length > 0 && (
  <div className="preview-gallery">
    <div className="images">
      {form.gambar.map((g, i) => 
        g.path ? (  // <- cek path tidak kosong
          <img key={i} src={g.path} alt={`Gallery ${i}`} />
        ) : null
      )}
    </div>
  </div>
)}


    {/* Video */}
{form.video?.length > 0 && (
  <div className="preview-video">
    {form.video.map((v, i) => {
      if (!v) return null; // skip jika kosong
      const embedUrl = v.replace("watch?v=", "embed/");
      return <iframe key={i} src={embedUrl} allowFullScreen></iframe>;
    })}
  </div>
)}


    {/* Testimoni */}
    {form.testimoni?.length > 0 && (
      <div className="preview-testimonials">
        <h3>Testimoni Pembeli</h3>
        {form.testimoni.map((t, i) => (
          <div key={i} className="testi-item">
            {t.gambar && <img src={t.gambar} alt={t.nama} />}
            <div className="info">
              <div className="name">{t.nama}</div>
              <div className="desc">{t.deskripsi}</div>
            </div>
          </div>
        ))}
      </div>
    )}

    {/* Form Pemesan */}
    <div className="preview-form">
      <h3>Lengkapi Data:</h3>
      {(form.custom_field || []).map((f, i) =>
        f.aktif ? (
          <div key={i}>
            <label>
              {f.nama_field}
              {f.wajib && " *"}
            </label>
            <input type="text" placeholder={`Masukkan ${f.nama_field}`} />
          </div>
        ) : null
      )}
    </div>
    <div className="preview-payment-method">
  <h3>Metode Pembayaran</h3>

  <div className="payment-group">
    <h4>E-Payment</h4>
    <ul>
      <li>QRIS (Dana, OVO, LinkAja)</li>
      <li>Virtual Account (BCA, Mandiri, BNI, Permata)</li>
    </ul>
  </div>

  <div className="payment-group">
    <h4>Bank Transfer (Manual)</h4>
    <p>Klik → Halaman Notifikasi Bayar</p>
  </div>

  <div className="payment-group">
    <h4>Credit Card (Midtrans)</h4>
    <p>Visa, Mastercard, dll</p>
  </div>
</div>

  </div>
        <button className="cta-button">Pesan Sekarang</button>

</div>
  </div>
);

}

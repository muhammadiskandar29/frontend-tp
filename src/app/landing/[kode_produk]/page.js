"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import Loading from "@/app/loading";
import useCustomerOrder from "@/hooks/useCustomerOrder";
import "@/styles/landing.css";

export default function LandingPage() {
  const { submitCustomerOrder } = useCustomerOrder();
  const { kode_produk } = useParams();
  const searchParams = useSearchParams();

  const [paymentMethod, setPaymentMethod] = useState(""); // cc | ewallet | va | manual
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const sumber = searchParams.get("utm_sumber") || "website";

  const [customerForm, setCustomerForm] = useState({
    nama: "",
    wa: "",
    email: "",
    alamat: "",
    custom_value: [],
  });

  // --- SAFE JSON ---
  const safeParse = (value, fallback) => {
    if (!value) return fallback;
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  };

  // --- FETCH PRODUK ---
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(
          `/api/landing/${kode_produk}`
        );
        const json = await res.json();

        if (!json.success || !json.data) return setData(null);

        const d = json.data;

        setData({
          ...d,
          gambar: safeParse(d.gambar, []),
          custom_field: safeParse(d.custom_field, []),
          assign: safeParse(d.assign, []),
          video: safeParse(d.video, []),
          testimoni: safeParse(d.testimoni, []),
          list_point: safeParse(d.list_point, []),
          fb_pixel: safeParse(d.fb_pixel, []),
          event_fb_pixel: safeParse(d.event_fb_pixel, []),
          gtm: safeParse(d.gtm, []),
        });
      } catch (err) {
        console.error("Landing fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [kode_produk]);

  // SEO Meta Tags & Structured Data
  useEffect(() => {
    if (!data) return;

    // Update document title
    document.title = `${data.nama} - Beli Sekarang | Ternak Properti`;

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    const description = data.deskripsi 
      ? `${data.deskripsi.substring(0, 155)}...` 
      : `Dapatkan ${data.nama} dengan harga terbaik. ${data.harga_asli ? `Hanya Rp ${data.harga_asli}` : ''} - Tawaran terbatas!`;
    
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = description;
      document.head.appendChild(meta);
    }

    // Update Open Graph tags
    const updateOGTag = (property, content) => {
      let ogTag = document.querySelector(`meta[property="${property}"]`);
      if (!ogTag) {
        ogTag = document.createElement('meta');
        ogTag.setAttribute('property', property);
        document.head.appendChild(ogTag);
      }
      ogTag.setAttribute('content', content);
    };

    updateOGTag('og:title', data.nama);
    updateOGTag('og:description', description);
    updateOGTag('og:type', 'product');
    if (data.header?.path) {
      updateOGTag('og:image', data.header.path);
    }
    updateOGTag('og:url', typeof window !== 'undefined' ? window.location.href : '');

    // Add structured data (JSON-LD)
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": data.nama,
      "description": data.deskripsi || description,
      "image": data.header?.path ? [data.header.path] : [],
      "offers": {
        "@type": "Offer",
        "price": data.harga_asli || "0",
        "priceCurrency": "IDR",
        "availability": "https://schema.org/InStock",
        "url": typeof window !== 'undefined' ? window.location.href : ''
      },
      "brand": {
        "@type": "Brand",
        "name": "Ternak Properti"
      },
      "category": data.kategori_rel?.nama || "Produk"
    };

    // Remove existing structured data
    const existingScript = document.getElementById('product-structured-data');
    if (existingScript) existingScript.remove();

    // Add new structured data
    const script = document.createElement('script');
    script.id = 'product-structured-data';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById('product-structured-data');
      if (scriptToRemove) scriptToRemove.remove();
    };
  }, [data]);

  if (loading) return <Loading />;
  if (!data) return <div className="p-6">Produk tidak ditemukan</div>;

  const form = data;

  // ==========================================================
  // 🔥 PEMBAYARAN MIDTRANS — 3 ENDPOINT FIX SESUAI BACKEND LU
  // ==========================================================
  async function payEwallet(payload) {
    const API_BASE = "https://onedashboardapi-production.up.railway.app/api";

    const formData = new FormData();
    formData.append("name", payload.nama);
    formData.append("email", payload.email);
    formData.append("amount", payload.total_harga);
    formData.append("product_name", payload.product_name);

    const response = await fetch(`${API_BASE}/midtrans/create-snap-ewallet`, {
      method: "POST",
      body: formData
    });

    const text = await response.text();
    console.log("EWALLET RAW:", text);

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      console.error("❌ Ewallet balikin HTML:", text);
      return;
    }

    if (json.redirect_url) window.location.href = json.redirect_url;
  }

  async function payCC(payload) {
    const API_BASE = "https://onedashboardapi-production.up.railway.app/api";

    const response = await fetch(`${API_BASE}/midtrans/create-snap-cc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: payload.nama,
        email: payload.email,
        amount: payload.total_harga,
        product_name: payload.product_name,
      }),
    });

    const text = await response.text();
    console.log("CC RAW:", text);

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      console.error("❌ CC balikin HTML:", text);
      return;
    }

    if (json.redirect_url) window.location.href = json.redirect_url;
  }

  async function payVA(payload) {
    const API_BASE = "https://onedashboardapi-production.up.railway.app/api";

    const response = await fetch(`${API_BASE}/midtrans/create-snap-va`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: payload.nama,
        email: payload.email,
        amount: payload.total_harga,
        product_name: payload.product_name,
      }),
    });

    const text = await response.text();
    console.log("VA RAW:", text);

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      console.error("❌ VA balikin HTML:", text);
      return;
    }

    if (json.redirect_url) window.location.href = json.redirect_url;
  }

  // ==========================================================
  // 🔥 SUBMIT ORDER → LANJUT PEMBAYARAN
  // ==========================================================
  const handleSubmit = async () => {
    if (!paymentMethod) return toast.error("Pilih metode pembayaran dulu");
    if (!customerForm.nama || !customerForm.email || !customerForm.wa)
      return toast.error("Lengkapi nama, WA, dan email dahulu");

    const payload = {
      nama: customerForm.nama,
      wa: customerForm.wa,
      email: customerForm.email,
      alamat: customerForm.alamat,
      produk: form.id,
      harga: form.harga_asli,
      ongkir: "0",
      total_harga: form.harga_asli,
      metode_bayar: paymentMethod,
      sumber,
      custom_value: customerForm.custom_value,
      product_name: form.nama,
    };

    try {
      // simpan order dulu ke DB
      const order = await submitCustomerOrder(payload);
      const orderId = order?.data?.id; // ambil ID order backend

      if (!order.success) throw new Error(order.message);
      if (!orderId) {
        toast.error("Order ID tidak ditemukan");
        return;
      }
      toast.success("Pesanan berhasil disimpan");
      await new Promise((r) => setTimeout(r, 300));

      // === lanjut ke pembayaran ===
      if (paymentMethod === "ewallet") {
        return payEwallet(payload);
      }

      if (paymentMethod === "cc") {
        return payCC(payload);
      }

      if (paymentMethod === "va") {
        return payVA(payload);
      }

      // manual transfer
      if (paymentMethod === "manual") {
        const query = new URLSearchParams({
          product: form.nama,
          harga: form.harga_asli,
          via: "manual",
          sumber,
        });
        window.location.href = `/payment?${query.toString()}`;
      }
    } catch (err) {
      console.error("Submit order error:", err);
      toast.error("Gagal menyimpan pesanan");
    }
  };

  // ==========================================================
  // RENDER PAGE
  // ==========================================================
  return (
    <article className="landing-wrapper" itemScope itemType="https://schema.org/Product">
        <div className="produk-preview">
          
          {/* Judul Promo */}
          <div className="promo-text" role="banner">
            <strong>Tawaran Terbatas!</strong>
            <br />
            <span>Isi Form Hari Ini Untuk Mendapatkan Akses Group Exclusive!</span>
          </div>

          {/* Nama Produk */}
          <h1 className="preview-title" itemProp="name">{form.nama}</h1>

          {/* Header */}
          <div className="header-wrapper">
            {form.header?.path ? (
              <img 
                src={form.header.path} 
                alt={`${form.nama} - Header Image`}
                className="preview-header-img"
                itemProp="image"
                loading="eager"
                width="900"
                height="500"
              />
            ) : (
              <div className="preview-header-img" style={{ background: "#e5e7eb" }} aria-label="Product header placeholder" />
            )}
          </div>
          
          {/* Deskripsi */}
          {form.deskripsi && (
            <div className="preview-description" itemProp="description">
              {form.deskripsi}
            </div>
          )}

        {/* List Point */}
        {form.list_point?.length > 0 && (
          <section className="preview-points" aria-label="Product benefits">
            <h2>Benefit yang akan Anda dapatkan:</h2>
            <ul itemProp="featureList">
              {form.list_point.map((p, i) => (
                <li key={i} itemProp="itemListElement">{p.nama}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Intro Harga */}
        {(form.harga_coret || form.harga_asli) && (
          <div className="price-intro">
            Dengan semua manfaat di atas, kamu bisa mendapatkannya hanya dengan:
          </div>
        )}

        {/* Harga */}
        {(form.harga_coret || form.harga_asli) && (
          <div className="preview-price" itemScope itemType="https://schema.org/Offer">
            {form.harga_coret && (
              <span className="old" aria-label="Harga lama">
                Rp {form.harga_coret}
              </span>
            )}
            {form.harga_asli && (
              <span className="new" itemProp="price" content={form.harga_asli}>
                Rp {form.harga_asli}
              </span>
            )}
            <meta itemProp="priceCurrency" content="IDR" />
            <meta itemProp="availability" content="https://schema.org/InStock" />
          </div>
        )}



        {/* Gallery */}
        {form.gambar?.length > 0 && (
          <section className="preview-gallery" aria-label="Product gallery">
            <h2 className="gallery-title">Galeri Produk</h2>
            <div className="images" itemProp="image">
              {form.gambar.map((g, i) =>
                g.path ? (
                  <img 
                    key={i} 
                    src={g.path} 
                    alt={g.caption || `${form.nama} - Gambar ${i + 1}`}
                    loading="lazy"
                    width="450"
                    height="300"
                  />
                ) : null
              )}
            </div>
          </section>
        )}

        {/* Video */}
        {form.video?.length > 0 && (
          <section className="preview-video" aria-label="Product videos">
            <h2 className="video-title">Video Produk</h2>
            {form.video.map((v, i) => {
              let url = v;
              if (url.includes("watch?v=")) url = url.replace("watch?v=", "embed/");
              return (
                <iframe 
                  key={i} 
                  src={url} 
                  allowFullScreen
                  title={`Video ${form.nama} - ${i + 1}`}
                  loading="lazy"
                />
              );
            })}
          </section>
        )}

        {/* Testimoni */}
        {form.testimoni?.length > 0 && (
          <section className="preview-testimonials" aria-label="Customer testimonials">
            <h2>Testimoni Pembeli</h2>
            <div itemScope itemType="https://schema.org/Review">
              {form.testimoni.map((t, i) => (
                <article key={i} className="testi-item" itemScope itemType="https://schema.org/Review">
                  {t.gambar && (
                    <img 
                      src={t.gambar} 
                      alt={`Foto ${t.nama}`}
                      itemProp="author"
                      loading="lazy"
                      width="60"
                      height="60"
                    />
                  )}

                  <div className="info">
                    <div className="name" itemProp="author" itemScope itemType="https://schema.org/Person">
                      <span itemProp="name">{t.nama}</span>
                    </div>
                    <div className="desc" itemProp="reviewBody">{t.deskripsi}</div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
{/* INFORMASI DASAR */}
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
        onChange={(e) =>
          setCustomerForm({ ...customerForm, [field.key]: e.target.value })
        }
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
      value={customerForm.alamat}
      onChange={(e) => setCustomerForm({...customerForm, alamat: e.target.value})}
    />
  </div>
</section>




        {/* Custom Field */}
        {form.custom_field?.length > 0 && (
          <section className="preview-form space-y-4 mt-5" aria-label="Additional information">
            <h2 className="font-semibold text-lg">Lengkapi Data Tambahan</h2>

            {form.custom_field.map((f, i) => (
              <div key={i} className="flex flex-col p-3 border rounded bg-gray-50">
                <label className="font-medium">{f.nama_field}</label>

                <input
                  type="text"
                  placeholder={`Masukkan ${f.nama_field}`}
                  className="border rounded p-2 mt-1"
                  onChange={(e) => {
                    const temp = [...customerForm.custom_value];
                    temp[i] = {
                      nama: f.nama_field,
                      value: e.target.value,
                    };
                    setCustomerForm({ ...customerForm, custom_value: temp });
                  }}
                />
              </div>
            ))}
          </section>
        )}

        {/* Payment */}
<section className="payment-section" aria-label="Payment methods">
  <h2 className="payment-title">Metode Pembayaran</h2>

  {/* E-Payment */}
  <label className="payment-card">
<input
  type="radio"
  name="payment"
  value="ewallet"
  onChange={(e) => setPaymentMethod(e.target.value)}
/>


    <div className="payment-content">
      <div className="payment-header">
        <span>E-Payment</span>
        <span className="arrow">›</span>
      </div>

      <div className="payment-icons">
        <img className="pay-icon" src="/assets/qris.svg" />
        <img className="pay-icon" src="/assets/dana.png" />
        <img className="pay-icon" src="/assets/ovo.png" />
        <img className="pay-icon" src="/assets/link.png" />
      </div>
    </div>
  </label>

  {/* Credit */}
  <label className="payment-card">
<input
  type="radio"
  name="payment"
  value="cc"
  onChange={(e) => setPaymentMethod(e.target.value)}
/>

    <div className="payment-content">
      <div className="payment-header">
        <span>Credit / Debit Card</span>
        <span className="arrow">›</span>
      </div>

      <div className="payment-icons">
        <img className="pay-icon" src="/assets/visa.svg" />
        <img className="pay-icon" src="/assets/master.png" />
        <img className="pay-icon" src="/assets/jcb.png" />
      </div>
    </div>
  </label>

  {/* Virtual Account */}
  <label className="payment-card">
<input
  type="radio"
  name="payment"
  value="va"
  onChange={(e) => setPaymentMethod(e.target.value)}
/>

    <div className="payment-content">
      <div className="payment-header">
        <span>Virtual Account</span>
        <span className="arrow">⌄</span>
      </div>

      <div className="payment-icons">
        <img className="pay-icon" src="/assets/bca.png" />
        <img className="pay-icon" src="/assets/mandiri.png" />
        <img className="pay-icon" src="/assets/bni.png" />
        <img className="pay-icon" src="/assets/permata.svg" />
      </div>
    </div>
  </label>

  {/* Manual Transfer */}
  <label className="payment-card">
<input
  type="radio"
  name="payment"
  value="manual"
  onChange={(e) => setPaymentMethod(e.target.value)}
/>

    <div className="payment-content">
      <div className="payment-header">
        <span>Bank Transfer (Manual)</span>
        <span className="arrow">›</span>
      </div>

      <img className="pay-icon" src="/assets/bca.png" />
      <p className="payment-note">Klik untuk masuk ke halaman konfirmasi bayar</p>
    </div>
  </label>
</section>

        {/* CTA */}
        <button 
          className="cta-button" 
          onClick={handleSubmit}
          aria-label={`Pesan ${form.nama} sekarang`}
          itemProp="offers"
        >
          Pesan Sekarang
        </button>
        </div>
      </article>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import Loading from "@/app/loading";
import "@/styles/landing.css";

export default function LandingPage() {
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

  const formatPrice = (price) => {
    if (!price) return "0";
    const numPrice = typeof price === "string" ? parseInt(price.replace(/[^\d]/g, "")) : price;
    return (isNaN(numPrice) ? 0 : numPrice).toLocaleString("id-ID");
  };

  const BASE_IMAGE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://onedashboardapi-production.up.railway.app";

  // Helper: konversi path relatif ke absolute URL
  const resolveImageUrl = (path) => {
    if (!path) return "";
    if (typeof path !== "string") return "";
    // Jika sudah absolute URL, return langsung
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    // Jika path relatif, tambahkan base URL
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${BASE_IMAGE_URL}${cleanPath}`;
  };

  const resolveHeaderSource = (header) => {
    if (!header) return "";
    let rawPath = "";
    if (typeof header === "string") {
      rawPath = header;
    } else if (header?.path && typeof header.path === "string") {
      rawPath = header.path;
    } else if (header?.value && typeof header.value === "string") {
      rawPath = header.value;
    }
    return resolveImageUrl(rawPath);
  };

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
        const res = await fetch(`/api/landing/${kode_produk}`, {
          cache: "no-store",
        });
        
        const json = await res.json();

        if (!json.success || !json.data) return setData(null);

        const d = json.data;

        setData({
          ...d,
          product_name: d.nama,
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

  // SEO Meta Tags & Structured Data - Optimized
  useEffect(() => {
    if (!data) return;

    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    // resolveHeaderSource sudah mengembalikan absolute URL
    const fullImageUrl = resolveHeaderSource(data.header);

    // Update document title
    const title = `${data.nama} - Beli Sekarang | Ternak Properti`;
    document.title = title;

    // Update meta description
    const description = data.deskripsi 
      ? `${data.deskripsi.substring(0, 155)}...` 
      : `Dapatkan ${data.nama} dengan harga terbaik. ${data.harga_asli ? `Hanya Rp ${formatPrice(data.harga_asli)}` : ''} - Tawaran terbatas!`;
    
    const updateMetaTag = (name, content, isProperty = false) => {
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let metaTag = document.querySelector(selector);
      if (!metaTag) {
        metaTag = document.createElement('meta');
        if (isProperty) {
          metaTag.setAttribute('property', name);
        } else {
          metaTag.setAttribute('name', name);
        }
        document.head.appendChild(metaTag);
      }
      metaTag.setAttribute('content', content);
    };

    // Basic Meta Tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', `${data.nama}, ${data.kategori_rel?.nama || 'Produk'}, Ternak Properti, Beli Online`);
    updateMetaTag('author', 'Ternak Properti');
    updateMetaTag('robots', 'index, follow');
    
    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', currentUrl);

    // Open Graph Tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:type', 'product', true);
    updateMetaTag('og:url', currentUrl, true);
    if (fullImageUrl) {
      updateMetaTag('og:image', fullImageUrl, true);
      updateMetaTag('og:image:width', '1200', true);
      updateMetaTag('og:image:height', '630', true);
      updateMetaTag('og:image:alt', data.nama, true);
    }
    updateMetaTag('og:site_name', 'Ternak Properti', true);
    updateMetaTag('og:locale', 'id_ID', true);

    // Twitter Card Tags
    updateMetaTag('twitter:card', 'summary_large_image', true);
    updateMetaTag('twitter:title', title, true);
    updateMetaTag('twitter:description', description, true);
    if (fullImageUrl) {
      updateMetaTag('twitter:image', fullImageUrl, true);
    }

    // Add structured data (JSON-LD) - Enhanced
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": data.nama,
      "description": data.deskripsi || description,
      "image": fullImageUrl ? [fullImageUrl] : [],
      "sku": data.kode || data.id?.toString(),
      "mpn": data.id?.toString(),
      "brand": {
        "@type": "Brand",
        "name": "Ternak Properti"
      },
      "category": data.kategori_rel?.nama || "Produk",
      "offers": {
        "@type": "Offer",
        "price": data.harga_asli || "0",
        "priceCurrency": "IDR",
        "availability": "https://schema.org/InStock",
        "url": currentUrl,
        "priceValidUntil": data.tanggal_event || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        "seller": {
          "@type": "Organization",
          "name": "Ternak Properti"
        }
      },
      "aggregateRating": data.testimoni?.length > 0 ? {
        "@type": "AggregateRating",
        "ratingValue": "5",
        "reviewCount": data.testimoni.length.toString()
      } : undefined,
      "review": data.testimoni?.length > 0 ? data.testimoni.slice(0, 5).map(t => ({
        "@type": "Review",
        "author": {
          "@type": "Person",
          "name": t.nama
        },
        "reviewBody": t.deskripsi,
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5"
        }
      })) : undefined
    };

    // Remove undefined fields
    Object.keys(structuredData).forEach(key => {
      if (structuredData[key] === undefined) {
        delete structuredData[key];
      }
    });

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
    try {
      const API_BASE = "/api";

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
        toast.error("Gagal memproses pembayaran e-wallet");
        return;
      }

      if (json.redirect_url) {
        // Buka di tab baru sesuai requirement
        window.open(json.redirect_url, '_blank');
      } else {
        console.error("❌ Ewallet tidak mengembalikan redirect_url:", json);
        toast.error(json.message || "Gagal membuat transaksi e-wallet");
      }
    } catch (err) {
      console.error("❌ Ewallet error:", err);
      toast.error("Terjadi kesalahan saat memproses pembayaran e-wallet");
    }
  }

  async function payCC(payload) {
    try {
      const API_BASE = "/api";

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
        toast.error("Gagal memproses pembayaran credit card");
        return;
      }

      if (json.redirect_url) {
        // Buka di tab baru sesuai requirement
        window.open(json.redirect_url, '_blank');
      } else {
        console.error("❌ CC tidak mengembalikan redirect_url:", json);
        toast.error(json.message || "Gagal membuat transaksi credit card");
      }
    } catch (err) {
      console.error("❌ CC error:", err);
      toast.error("Terjadi kesalahan saat memproses pembayaran credit card");
    }
  }

  async function payVA(payload) {
    try {
      const API_BASE = "/api";

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
        toast.error("Gagal memproses pembayaran virtual account");
        return;
      }

      if (json.redirect_url) {
        // Buka di tab baru sesuai requirement
        window.open(json.redirect_url, '_blank');
      } else {
        console.error("❌ VA tidak mengembalikan redirect_url:", json);
        toast.error(json.message || "Gagal membuat transaksi virtual account");
      }
    } catch (err) {
      console.error("❌ VA error:", err);
      toast.error("Terjadi kesalahan saat memproses pembayaran virtual account");
    }
  }

  // ==========================================================
  // 🔥 SUBMIT ORDER → LANJUT PEMBAYARAN
  // ==========================================================
  const handleSubmit = async () => {
    if (!paymentMethod) return toast.error("Pilih metode pembayaran dulu");
    if (!customerForm.nama || !customerForm.email || !customerForm.wa)
      return toast.error("Lengkapi nama, WA, dan email dahulu");

    // Payload sesuai format backend requirement
    // Backend mengharapkan harga dan total_harga sebagai STRING
    const payload = {
      nama: customerForm.nama,
      wa: customerForm.wa,
      email: customerForm.email,
      alamat: customerForm.alamat || '',
      produk: parseInt(form.id, 10), // produk tetap integer
      harga: String(form.harga_asli || '0'), // harga sebagai string
      ongkir: "0", // string
      total_harga: String(form.harga_asli || '0'), // total_harga sebagai string
      metode_bayar: paymentMethod,
      sumber: sumber || 'website',
      custom_value: Array.isArray(customerForm.custom_value) 
        ? customerForm.custom_value 
        : (customerForm.custom_value ? [customerForm.custom_value] : []), // array
      // product_name hanya untuk Midtrans, tidak dikirim ke /api/order
      product_name: form.product_name || form.nama,
    };

    try {
      // Hapus product_name dari payload karena tidak diperlukan di /api/order
      // product_name hanya untuk Midtrans
      const { product_name, ...orderPayload } = payload;
      
      // simpan order dulu ke DB via API proxy
      const response = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const order = await response.json();
      const orderId = order?.data?.order?.id;

      // Handle kasus khusus: Backend error tapi data sudah masuk
      // Jika ada warning, berarti data sudah tersimpan meskipun ada error
      if (order?.warning) {
        console.warn('⚠️', order.warning);
        toast.success(order?.message || "Pesanan berhasil disimpan");
        // Lanjut ke payment meskipun tidak ada orderId (tidak diperlukan untuk payment)
      } else if (!response.ok || order?.success !== true) {
        // Extract error message from response
        const errorMessage = order?.message || order?.error || "Gagal membuat order";
        throw new Error(errorMessage);
      } else {
        // Success normal
        toast.success(order?.message || "Pesanan berhasil disimpan");
        if (orderId) {
          payload.orderId = orderId;
        }
      }

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
        });
        window.location.href = `/payment?${query.toString()}`;
      }
    } catch (err) {
      console.error("Submit order error:", err);
      // Show the actual error message from the API
      const errorMessage = err.message || "Gagal menyimpan pesanan";
      toast.error(errorMessage);
    }
  };

  // ==========================================================
  // RENDER PAGE
  // ==========================================================
  const headerSrc = resolveHeaderSource(form.header);

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
            {headerSrc ? (
              <img 
                src={headerSrc} 
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

        {/* Intro Harga & Harga - Combined */}
        {(form.harga_coret || form.harga_asli) && (
          <div className="price-section" itemScope itemType="https://schema.org/Offer">
            <div className="price-intro">
              Dengan semua manfaat di atas, kamu bisa mendapatkannya hanya dengan:
            </div>
            <div className="preview-price">
              {form.harga_coret && (
                <span className="old" aria-label="Harga lama">
                  Rp {formatPrice(form.harga_coret)}
                </span>
              )}
              {form.harga_asli && (
                <span className="new" itemProp="price" content={form.harga_asli}>
                  Rp {formatPrice(form.harga_asli)}
                </span>
              )}
            </div>
            <meta itemProp="priceCurrency" content="IDR" />
            <meta itemProp="availability" content="https://schema.org/InStock" />
          </div>
        )}



        {/* Gallery */}
        {form.gambar?.length > 0 && (
          <section className="preview-gallery" aria-label="Product gallery">
            <h2 className="gallery-title">Galeri Produk</h2>
            <div className="images" itemProp="image">
              {form.gambar.map((g, i) => {
                const imgSrc = resolveImageUrl(g.path);
                return imgSrc ? (
                  <img 
                    key={i} 
                    src={imgSrc} 
                    alt={g.caption || `${form.nama} - Gambar ${i + 1}`}
                    loading="lazy"
                    width="450"
                    height="300"
                  />
                ) : null;
              })}
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
              {form.testimoni.map((t, i) => {
                const testiImgSrc = resolveImageUrl(t.gambar);
                return (
                  <article key={i} className="testi-item" itemScope itemType="https://schema.org/Review">
                    {testiImgSrc && (
                      <img 
                        src={testiImgSrc} 
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
                );
              })}
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

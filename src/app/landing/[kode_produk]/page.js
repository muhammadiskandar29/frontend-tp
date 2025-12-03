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
  const [submitting, setSubmitting] = useState(false); // Prevent double-click

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

  /**
   * Helper: Build image URL dari path backend
   * Backend mengembalikan path tanpa "storage/" prefix, contoh: "produk/header/xxx.png"
   * Frontend harus generate: /api/image?path=produk/header/xxx.png
   * Proxy akan menambahkan /storage/ prefix
   */
  const buildImageUrl = (path) => {
    if (!path) return "";
    if (typeof path !== "string") return "";
    
    // Jika sudah absolute HTTPS URL, return langsung
    if (path.startsWith("https://")) return path;
    
    // Bersihkan path
    let cleanPath = path;
    
    // Jika path adalah full URL HTTP, extract pathname saja
    if (path.startsWith("http://")) {
      try {
        const url = new URL(path);
        cleanPath = url.pathname;
      } catch {
        cleanPath = path;
      }
    }
    
    // Hapus leading slash jika ada (proxy akan handle)
    cleanPath = cleanPath.replace(/^\/+/, "");
    
    // Hapus "storage/" prefix jika sudah ada (proxy akan menambahkan)
    cleanPath = cleanPath.replace(/^storage\//, "");
    
    // Hapus double slash
    cleanPath = cleanPath.replace(/\/+/g, "/");
    
    // Gunakan proxy untuk menghindari mixed content HTTPS/HTTP
    return `/api/image?path=${cleanPath}`;
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
    return buildImageUrl(rawPath);
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

  if (loading) return <Loading message="Memuat halaman..." />;
  if (!data) return (
    <div className="not-found-page">
      <div className="not-found-content">
        <span className="not-found-icon">📦</span>
        <h1>Halaman Tidak Tersedia</h1>
        <p>Produk yang Anda cari sedang tidak tersedia saat ini.</p>
        <a href="/" className="not-found-btn">Kembali ke Beranda</a>
      </div>
      <style jsx>{`
        .not-found-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
          padding: 20px;
        }
        .not-found-content {
          text-align: center;
          background: white;
          padding: 48px;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.08);
          max-width: 400px;
        }
        .not-found-icon {
          font-size: 64px;
          display: block;
          margin-bottom: 20px;
        }
        .not-found-content h1 {
          font-size: 24px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 12px;
        }
        .not-found-content p {
          color: #6b7280;
          margin: 0 0 24px;
          font-size: 15px;
        }
        .not-found-btn {
          display: inline-block;
          padding: 12px 24px;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          text-decoration: none;
          border-radius: 10px;
          font-weight: 500;
          transition: all 0.2s;
        }
        .not-found-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(59,130,246,0.3);
        }
      `}</style>
    </div>
  );

  const form = data;

  // ==========================================================
  // 🔥 SUBMIT ORDER → OTP VERIFICATION → PEMBAYARAN
  // ==========================================================
  const handleSubmit = async () => {
    // Prevent double-click
    if (submitting) return;
    
    if (!paymentMethod) return toast.error("Silakan pilih metode pembayaran");
    if (!customerForm.nama || !customerForm.email || !customerForm.wa)
      return toast.error("Silakan lengkapi data yang diperlukan");

    setSubmitting(true);

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
      const { product_name, ...orderPayload } = payload;
      
      // Simpan order ke DB via API proxy
      const response = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const order = await response.json();
      
      console.log("📥 Order response:", order);

      // Cek apakah order berhasil
      if (!response.ok || !order?.success) {
        const errorMessage = order?.message || order?.error || "Gagal membuat order";
        throw new Error(errorMessage);
      }

      // Ambil data dari response - handle berbagai format response
      const orderResponseData = order?.data?.order || order?.data || {};
      const orderId = orderResponseData?.id;
      
      // Customer bisa berupa:
      // - Integer langsung: customer: 5
      // - Object dengan id: customer: { id: 5, nama: "..." }
      // - Di field lain: customer_id, id_customer
      let customerId = null;
      const rawCustomer = orderResponseData?.customer || orderResponseData?.customer_id || orderResponseData?.id_customer;
      
      if (typeof rawCustomer === 'object' && rawCustomer !== null) {
        customerId = rawCustomer.id || rawCustomer.customer_id;
      } else if (typeof rawCustomer === 'number' || typeof rawCustomer === 'string') {
        customerId = rawCustomer;
      }


      // Simpan data untuk verifikasi OTP + URL landing untuk redirect balik
      const pendingOrder = {
        orderId: orderId,
        customerId: customerId,
        nama: customerForm.nama,
        wa: customerForm.wa,
        email: customerForm.email,
        productName: form.nama || form.product_name,
        totalHarga: form.harga_asli || "0",
        paymentMethod: paymentMethod,
        landingUrl: window.location.pathname, // URL untuk balik setelah payment
      };

      console.log("📦 [LANDING] Saving pending order:", pendingOrder);
      localStorage.setItem("pending_order", JSON.stringify(pendingOrder));

      // Tampilkan toast sesuai kondisi
      if (customerId) {
        toast.success("Kode OTP telah dikirim ke WhatsApp Anda!");
      } else {
        toast.success("Order berhasil! Lanjut ke pembayaran...");
      }

      // Redirect ke halaman verifikasi OTP
      await new Promise((r) => setTimeout(r, 500));
      window.location.href = "/verify-order";

    } catch (err) {
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
      setSubmitting(false);
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
            <h1>Tawaran Terbatas!</h1>
            <br />
            <h2>Isi Form Hari Ini Untuk Mendapatkan Akses Group Exclusive!</h2>
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

        {/* Profil Pembicara Workshop - 6 Speakers */}
        <section className="speaker-profile-section" aria-label="Speaker profile">
          <div className="speaker-banner-image">
            <img 
              src="/assets/talent ternak properti.png" 
              alt="Talent Ternak Properti"
              className="talent-banner-img"
            />
          </div>
          <h2 className="speaker-profile-title">Profil Pembicara</h2>
          <div className="speakers-grid">
            {/* Speaker 1: Dimas Dwi Ananto */}
            <div className="speaker-card">
              <div className="speaker-image-wrapper">
                <img 
                  src="/assets/Dimas Dwi Ananto.png" 
                  alt="Dimas Dwi Ananto"
                  className="speaker-image"
                />
              </div>
              <div className="speaker-info">
                <div className="speaker-name">Dimas Dwi Ananto</div>
                <div className="speaker-title">Praktisi Lelang Properti</div>
                <div className="speaker-bio">
                  Praktisi lelang properti berpengalaman dengan <strong>track record</strong> mengakuisisi properti dengan harga murah dan menjualnya kembali dengan keuntungan tinggi. Spesialisasi dalam strategi investasi properti tanpa KPR.
                </div>
              </div>
            </div>

            {/* Speaker 2: Salvian Kumara */}
            <div className="speaker-card">
              <div className="speaker-image-wrapper">
                <img 
                  src="/assets/Salvian Kumara.png" 
                  alt="Salvian Kumara"
                  className="speaker-image"
                />
              </div>
              <div className="speaker-info">
                <div className="speaker-name">Salvian Kumara</div>
                <div className="speaker-title">Expert Real Estate Investment</div>
                <div className="speaker-bio">
                  Expert di bidang real estate investment dengan pengalaman lebih dari 10 tahun. Fokus pada <strong>analisis pasar properti</strong> dan strategi investasi jangka panjang yang menguntungkan.
                </div>
              </div>
            </div>

            {/* Speaker 3: Rhesa Yogaswara */}
            <div className="speaker-card">
              <div className="speaker-image-wrapper">
                <img 
                  src="/assets/Rhesa Yogaswara.png" 
                  alt="Rhesa Yogaswara"
                  className="speaker-image"
                />
              </div>
              <div className="speaker-info">
                <div className="speaker-name">Rhesa Yogaswara</div>
                <div className="speaker-title">Property Consultant & Trainer</div>
                <div className="speaker-bio">
                  Property consultant dan trainer yang telah membantu ratusan investor dalam <strong>membangun portofolio properti</strong>. Spesialis dalam riset pasar dan identifikasi peluang investasi.
                </div>
              </div>
            </div>

            {/* Speaker 4: Stephanus P H A S */}
            <div className="speaker-card">
              <div className="speaker-image-wrapper">
                <img 
                  src="/assets/Stephanus P H A S.png" 
                  alt="Stephanus P H A S"
                  className="speaker-image"
                />
              </div>
              <div className="speaker-info">
                <div className="speaker-name">Stephanus P H A S</div>
                <div className="speaker-title">Business Development Specialist</div>
                <div className="speaker-bio">
                  Business development specialist dengan expertise dalam <strong>strategi pertumbuhan bisnis</strong> dan pengembangan pasar. Berpengalaman dalam transformasi organisasi dan ekspansi bisnis.
                </div>
              </div>
            </div>

            {/* Speaker 5: Theo Ariandyen */}
            <div className="speaker-card">
              <div className="speaker-image-wrapper">
                <img 
                  src="/assets/Theo Ariandyen.png" 
                  alt="Theo Ariandyen"
                  className="speaker-image"
                />
              </div>
              <div className="speaker-info">
                <div className="speaker-name">Theo Ariandyen</div>
                <div className="speaker-title">Investment Strategist</div>
                <div className="speaker-bio">
                  Investment strategist yang fokus pada <strong>investasi properti strategis</strong> dan manajemen portofolio. Membantu investor dalam membuat keputusan investasi yang tepat berdasarkan analisis mendalam.
                </div>
              </div>
            </div>

            {/* Speaker 6: Erzon Djazai */}
            <div className="speaker-card">
              <div className="speaker-image-wrapper">
                <img 
                  src="/assets/Erzon Djazai.png" 
                  alt="Erzon Djazai"
                  className="speaker-image"
                />
              </div>
              <div className="speaker-info">
                <div className="speaker-name">Erzon Djazai</div>
                <div className="speaker-title">Property Investment Advisor</div>
                <div className="speaker-bio">
                  Property investment advisor dengan pengalaman luas dalam <strong>mengidentifikasi peluang investasi properti</strong> dan memberikan konsultasi strategis untuk investor pemula maupun berpengalaman.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Special Offer Card - Combined Benefit & Price */}
        {(form.list_point?.length > 0 || form.harga_coret || form.harga_asli) && (
          <section className="special-offer-card" aria-label="Special offer" itemScope itemType="https://schema.org/Offer">
            <h2 className="special-offer-title">Special Offer!</h2>
            
            {/* Price Section */}
            {(form.harga_coret || form.harga_asli) && (
              <div className="special-offer-price">
                {form.harga_coret && (
                  <span className="price-old" aria-label="Harga lama">
                    Rp {formatPrice(form.harga_coret)}
                  </span>
                )}
                {form.harga_asli && (
                  <span className="price-new" itemProp="price" content={form.harga_asli}>
                    Rp {formatPrice(form.harga_asli)}
                  </span>
                )}
              </div>
            )}
            
            {/* Benefit List */}
            {form.list_point?.length > 0 && (
              <div className="special-offer-benefits">
                <h3>Benefit yang akan Anda dapatkan:</h3>
                <ul itemProp="featureList">
                  {form.list_point.map((p, i) => (
                    <li key={i} itemProp="itemListElement">
                      <span className="benefit-check">✓</span>
                      {p.nama}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <meta itemProp="priceCurrency" content="IDR" />
            <meta itemProp="availability" content="https://schema.org/InStock" />
          </section>
        )}



        {/* Gallery */}
        {form.gambar?.length > 0 && (
          <section className="preview-gallery" aria-label="Product gallery">
            <h2 className="gallery-title">Galeri Produk</h2>
            <div className="images" itemProp="image">
              {form.gambar.map((g, i) => {
                const imgSrc = buildImageUrl(g.path);
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
                const testiImgSrc = buildImageUrl(t.gambar);
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
{/* INFORMASI DASAR - Compact Form */}
<section className="compact-form-section" aria-label="Order form">
  <h2 className="compact-form-title">Lengkapi Data:</h2>
  
  <div className="compact-form-card">
    {/* Nama Lengkap */}
    <div className="compact-field">
      <label className="compact-label">
        Nama Lengkap <span className="required">*</span>
      </label>
      <input
        type="text"
        placeholder="Contoh: Krisdayanti"
        className="compact-input"
        value={customerForm.nama}
        onChange={(e) => setCustomerForm({ ...customerForm, nama: e.target.value })}
      />
    </div>

    {/* No. WhatsApp */}
    <div className="compact-field">
      <label className="compact-label">
        No. WhatsApp <span className="required">*</span>
      </label>
      <div className="wa-input-wrapper">
        <div className="wa-prefix">
          <span className="flag">🇮🇩</span>
          <span className="code">+62</span>
        </div>
        <input
          type="tel"
          placeholder="812345678"
          className="compact-input wa-input"
          value={customerForm.wa.replace(/^(\+62|62|0)/, '')}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '');
            setCustomerForm({ ...customerForm, wa: '62' + val });
          }}
        />
      </div>
    </div>

    {/* Email */}
    <div className="compact-field">
      <label className="compact-label">
        Email <span className="required">*</span>
      </label>
      <input
        type="email"
        placeholder="email@example.com"
        className="compact-input"
        value={customerForm.email}
        onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
      />
    </div>

    {/* Alamat */}
    <div className="compact-field">
      <label className="compact-label">Alamat</label>
      <textarea
        placeholder="Alamat lengkap (opsional)"
        className="compact-input compact-textarea"
        rows={2}
        value={customerForm.alamat}
        onChange={(e) => setCustomerForm({ ...customerForm, alamat: e.target.value })}
      />
    </div>
  </div>
</section>

        {/* Custom Field - Same Compact Style */}
        {form.custom_field?.length > 0 && (
          <section className="compact-form-section" aria-label="Additional information">
            <h2 className="compact-form-title">Lengkapi Data Tambahan:</h2>

            <div className="compact-form-card">
              {form.custom_field.map((f, i) => (
                <div key={i} className="compact-field">
                  <label className="compact-label">{f.nama_field}</label>
                  <input
                    type="text"
                    placeholder={`Masukkan ${f.nama_field}`}
                    className="compact-input"
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
            </div>
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
          className={`cta-button ${submitting ? 'cta-loading' : ''}`}
          onClick={handleSubmit}
          disabled={submitting}
          aria-label={`Pesan ${form.nama} sekarang`}
          itemProp="offers"
        >
          {submitting ? (
            <>
              <span className="cta-spinner"></span>
              Memproses...
            </>
          ) : (
            "Pesan Sekarang"
          )}
        </button>

        {/* Loading Overlay saat submit */}
        {submitting && (
          <div className="submit-overlay">
            <div className="submit-overlay-content">
              <div className="submit-spinner">
                <span></span><span></span><span></span>
              </div>
              <p>Memproses pesanan Anda...</p>
            </div>
          </div>
        )}
        </div>
      </article>
  );
}

"use client";
import React from "react";
import "@/styles/landing.css";

const resolveMediaSource = (input) => {
  if (!input) return null;

  // Direct string path or URL
  if (typeof input === "string") return input;

  // Object with type & value (builder form)
  if (input?.type === "file" && input.value) {
    return URL.createObjectURL(input.value);
  }
  if (input?.type === "url" && input.value) {
    return input.value;
  }

  // Object with path property
  if (input?.path) {
    if (typeof input.path === "string") return input.path;
    if (input.path?.type === "file" && input.path.value) {
      return URL.createObjectURL(input.path.value);
    }
    if (input.path?.type === "url" && input.path.value) {
      return input.path.value;
    }
  }

  return null;
};

export default function LandingTemplate({ form }) {
  if (!form) return null;

  const formatPrice = (price) => {
    if (!price) return "0";
    const numPrice =
      typeof price === "string" ? parseInt(price.replace(/[^\d]/g, "")) : price;
    return (isNaN(numPrice) ? 0 : numPrice).toLocaleString("id-ID");
  };

  const getVideoArray = () => {
    if (!form.video) return [];
    if (Array.isArray(form.video)) return form.video;
    if (typeof form.video === "string") {
      return form.video
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v);
    }
    return [];
  };

  const videoArray = getVideoArray();
  const headerSrc = resolveMediaSource(form.header);

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
        <h1 className="preview-title" itemProp="name">
          {form.nama || "Nama Produk"}
        </h1>

        {/* Header */}
        <div className="header-wrapper">
          {headerSrc ? (
            <img
              src={headerSrc}
              alt={`${form.nama || "Produk"} - Header Image`}
              className="preview-header-img"
              itemProp="image"
              loading="eager"
              width="900"
              height="500"
            />
          ) : (
            <div
              className="preview-header-img"
              style={{ background: "#e5e7eb" }}
              aria-label="Product header placeholder"
            />
          )}
        </div>
        
        {/* Deskripsi - dipindah setelah Header sesuai landing page */}
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
                const imageSrc = resolveMediaSource(g) || resolveMediaSource(g?.path);
                if (!imageSrc) return null;
                return (
                  <img
                    key={i}
                    src={imageSrc}
                    alt={g.caption || `${form.nama || "Produk"} - Gambar ${i + 1}`}
                    loading="lazy"
                    width="450"
                    height="300"
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* Video */}
        {videoArray.length > 0 && (
          <section className="preview-video" aria-label="Product videos">
            <h2 className="video-title">Video Produk</h2>
            {videoArray.map((v, i) => {
              let url = v;
              if (url.includes("watch?v=")) url = url.replace("watch?v=", "embed/");
              return (
                <iframe 
                  key={i} 
                  src={url} 
                  allowFullScreen
                  title={`Video ${form.nama || 'Produk'} - ${i + 1}`}
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
                const imageSrc = resolveMediaSource(t.gambar);
                return (
                  <article key={i} className="testi-item" itemScope itemType="https://schema.org/Review">
                    {imageSrc ? (
                      <img 
                        src={imageSrc} 
                        alt={`Foto ${t.nama || "Testimoni"}`}
                        itemProp="author"
                        loading="lazy"
                        width="60"
                        height="60"
                      />
                    ) : null}

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

        {/* INFORMASI DASAR - Compact Form Style */}
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
                disabled
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
                  disabled
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
                disabled
              />
            </div>

            {/* Alamat */}
            <div className="compact-field">
              <label className="compact-label">Alamat</label>
              <textarea
                placeholder="Alamat lengkap (opsional)"
                className="compact-input compact-textarea"
                rows={2}
                disabled
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
                  <label className="compact-label">
                    {f.nama_field || f.label}
                    {f.required && <span className="required"> *</span>}
                  </label>
                  <input
                    type="text"
                    placeholder={`Masukkan ${f.nama_field || f.label}`}
                    className="compact-input"
                    disabled
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Payment Method */}
        <section className="payment-section" aria-label="Payment methods">
          <h2 className="payment-title">Metode Pembayaran</h2>

          {/* E-Payment */}
          <label className="payment-card">
            <input
              type="radio"
              name="payment"
              value="ewallet"
              disabled
            />
            <div className="payment-content">
              <div className="payment-header">
                <span>E-Payment</span>
                <span className="arrow">›</span>
              </div>
              <div className="payment-icons">
                <img className="pay-icon" src="/assets/qris.svg" alt="QRIS" />
                <img className="pay-icon" src="/assets/dana.png" alt="Dana" />
                <img className="pay-icon" src="/assets/ovo.png" alt="OVO" />
                <img className="pay-icon" src="/assets/link.png" alt="LinkAja" />
              </div>
            </div>
          </label>

          {/* Credit/Debit Card */}
          <label className="payment-card">
            <input
              type="radio"
              name="payment"
              value="cc"
              disabled
            />
            <div className="payment-content">
              <div className="payment-header">
                <span>Credit / Debit Card</span>
                <span className="arrow">›</span>
              </div>
              <div className="payment-icons">
                <img className="pay-icon" src="/assets/visa.svg" alt="Visa" />
                <img className="pay-icon" src="/assets/master.png" alt="MasterCard" />
                <img className="pay-icon" src="/assets/jcb.png" alt="JCB" />
              </div>
            </div>
          </label>

          {/* Virtual Account */}
          <label className="payment-card">
            <input
              type="radio"
              name="payment"
              value="va"
              disabled
            />
            <div className="payment-content">
              <div className="payment-header">
                <span>Virtual Account</span>
                <span className="arrow">⌄</span>
              </div>
              <div className="payment-icons">
                <img className="pay-icon" src="/assets/bca.png" alt="BCA" />
                <img className="pay-icon" src="/assets/mandiri.png" alt="Mandiri" />
                <img className="pay-icon" src="/assets/bni.png" alt="BNI" />
                <img className="pay-icon" src="/assets/permata.svg" alt="Permata" />
              </div>
            </div>
          </label>

          {/* Manual Transfer */}
          <label className="payment-card">
            <input
              type="radio"
              name="payment"
              value="manual"
              disabled
            />
            <div className="payment-content">
              <div className="payment-header">
                <span>Bank Transfer (Manual)</span>
                <span className="arrow">›</span>
              </div>
              <img className="pay-icon" src="/assets/bca.png" alt="BCA" />
              <p className="payment-note">Klik untuk masuk ke halaman konfirmasi bayar</p>
            </div>
          </label>
        </section>

        {/* CTA */}
        <button 
          className="cta-button" 
          aria-label="Pesan sekarang"
          disabled
        >
          Pesan Sekarang
        </button>

      </div>
    </article>
  );
}

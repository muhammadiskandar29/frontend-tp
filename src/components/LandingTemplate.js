"use client";
import React from "react";
import '@/styles/landing.css';

export default function LandingTemplate({ form }) {
  if (!form) return null;

  // Helper untuk parse video (bisa string atau array)
  const getVideoArray = () => {
    if (!form.video) return [];
    if (Array.isArray(form.video)) return form.video;
    if (typeof form.video === 'string') {
      return form.video.split(",").map((v) => v.trim()).filter((v) => v);
    }
    return [];
  };

  const videoArray = getVideoArray();

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
          {form.header?.type === "file" && form.header.value ? (
            <img
              src={URL.createObjectURL(form.header.value)}
              alt={`${form.nama || "Produk"} - Header Image`}
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
                g.path?.type === "file" && g.path.value ? (
                  <img
                    key={i}
                    src={URL.createObjectURL(g.path.value)}
                    alt={g.caption || `${form.nama || "Produk"} - Gambar ${i + 1}`}
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
              {form.testimoni.map((t, i) => (
                <article key={i} className="testi-item" itemScope itemType="https://schema.org/Review">
                  {t.gambar?.type === "file" && t.gambar.value ? (
                    <img 
                      src={URL.createObjectURL(t.gambar.value)} 
                      alt={`Foto ${t.nama}`}
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
              ))}
            </div>
          </section>
        )}

        {/* INFORMASI DASAR - styling sama dengan landing page */}
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

        {/* Custom Field */}
        {form.custom_field?.length > 0 && (
          <section className="preview-form space-y-4 mt-5" aria-label="Additional information">
            <h2 className="font-semibold text-lg">Lengkapi Data Tambahan</h2>

            {form.custom_field.map((f, i) => (
              <div key={i} className="flex flex-col p-3 border rounded bg-gray-50">
                <label className="font-medium">
                  {f.nama_field || f.label}
                  {f.required ? " *" : ""}
                </label>
                <input
                  type="text"
                  placeholder={`Masukkan ${f.nama_field || f.label}`}
                  className="border rounded p-2 mt-1"
                  disabled
                />
              </div>
            ))}
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

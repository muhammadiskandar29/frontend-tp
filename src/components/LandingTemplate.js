"use client";
import React from "react";
import '@/styles/landing.css';

export default function LandingTemplate({ form }) {
  if (!form) return null;

  return (
    <div className="produk-preview">

      {/* Judul Promo */}
      <div className="promo-text">
        <strong>Tawaran Terbatas!</strong>
        <br />
        <span>Isi Form Hari Ini Untuk Mendapatkan Akses Group Exclusive!</span>
      </div>

      {/* Nama Produk */}
      <h1 className="preview-title">
        {form.nama || "Nama Produk"}
      </h1>

      {/* Header */}
      <div className="header-wrapper">
        {form.header?.type === "file" && form.header.value ? (
          <img
            src={URL.createObjectURL(form.header.value)}
            alt="Header"
            className="preview-header-img"
          />
        ) : (
          <div className="preview-header-img" style={{ background: "#e5e7eb" }} />
        )}
      </div>
      {/* List Point */}
      {form.list_point?.length > 0 && (
        <section className="preview-points" aria-label="Product benefits">
          <h2>Benefit yang akan Anda dapatkan:</h2>
          <ul>
            {form.list_point.map((p, i) => (
              <li key={i}>{p.nama}</li>
            ))}
          </ul>
        </section>
      )}
      {/* Intro Sebelum Harga */}
      {(form.harga_coret || form.harga_asli) && (
        <div className="price-intro">
          Dengan semua manfaat di atas, kamu bisa mendapatkannya hanya dengan:
        </div>
      )}
      {/* Harga */}
      {(form.harga_coret || form.harga_asli) && (
        <div className="preview-price">
          {form.harga_coret ? (
            <span className="old">Rp {form.harga_coret}</span>
          ) : null}

          {form.harga_asli ? (
            <span className="new">Rp {form.harga_asli}</span>
          ) : null}
        </div>
      )}

      {/* Deskripsi */}
      {form.deskripsi && (
        <div className="preview-description" itemProp="description">
          {form.deskripsi}
        </div>
      )}


      {/* Gallery */}
      {form.gambar?.length > 0 && (
        <section className="preview-gallery" aria-label="Product gallery">
          <h2 className="gallery-title">Galeri Produk</h2>
          <div className="images">
            {form.gambar.map((g, i) =>
              g.path?.type === "file" && g.path.value ? (
                <img
                  key={i}
                  src={URL.createObjectURL(g.path.value)}
                  alt={`Gallery ${i + 1}`}
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
      {form.video && form.video.trim() !== "" && (
        <section className="preview-video" aria-label="Product videos">
          <h2 className="video-title">Video Produk</h2>
          {form.video
            .split(",")
            .map((v) => v.trim())
            .filter((v) => v)
            .map((v, i) => {
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
          {form.testimoni.map((t, i) => (
            <article key={i} className="testi-item">
              {t.gambar?.type === "file" && t.gambar.value ? (
                <img 
                  src={URL.createObjectURL(t.gambar.value)} 
                  alt={`Foto ${t.nama}`}
                  loading="lazy"
                  width="70"
                  height="70"
                />
              ) : null}

              <div className="info">
                <div className="name">{t.nama}</div>
                <div className="desc">{t.deskripsi}</div>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Custom Field */}
      <section className="preview-form" aria-label="Order form">
        <h2>Informasi Dasar</h2>
        
        {/* HARD-CODE FIELDS */}
        <div>
          {/* NAMA */}
          <div className="p-4">
            <label>Nama</label>
            <input
              type="text"
              placeholder="Nama lengkap Anda"
            />
          </div>

          {/* NOMOR WHATSAPP */}
          <div className="p-4">
            <label>Nomor WhatsApp</label>
            <input
              type="text"
              placeholder="08xxxxxxxxxx"
            />
          </div>

          {/* EMAIL */}
          <div className="p-4">
            <label>Email</label>
            <input
              type="email"
              placeholder="email@example.com"
            />
          </div>

          {/* ALAMAT */}
          <div className="p-4">
            <label>Alamat</label>
            <textarea
              placeholder="Alamat lengkap"
              rows={3}
            />
          </div>
        </div>

        {/* Custom Fields */}
        {form.custom_field?.length > 0 && (
          <>
            <h2 style={{ marginTop: '30px' }}>Lengkapi Data Tambahan</h2>
            {form.custom_field.map((f, i) => (
              <div key={i} className="p-4">
                <label>
                  {f.label}
                  {f.required ? " *" : ""}
                </label>
                <input
                  type="text"
                  placeholder={`Masukkan ${f.label}`}
                />
              </div>
            ))}
          </>
        )}
      </section>

      {/* Payment Method */}
      <section className="payment-section" aria-label="Payment methods">
        <h2 className="payment-title">Metode Pembayaran</h2>

        {/* E-Payment */}
        <label className="payment-card">
          <input
            type="radio"
            name="payment"
            value="ewallet"
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
      <button className="cta-button" aria-label="Pesan sekarang">
        Pesan Sekarang
      </button>

    </div>
  );
}

"use client";

import { useState, useEffect } from "react";

export default function ProductsSection({ products, isLoading, onProductClick }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (products.length <= 4) return;
    
    const totalSlides = Math.ceil(products.length / 4);
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000);

    return () => clearInterval(interval);
  }, [products]);

  const formatPrice = (price) => {
    if (!price) return "Rp 0";
    return `Rp ${parseInt(price).toLocaleString("id-ID")}`;
  };

  if (isLoading) {
    return (
      <section className="products-section">
        <div className="products-section__header">
          <h2>Produk Lainnya</h2>
          <p>Jelajahi produk dan paket menarik lainnya</p>
        </div>
        <div className="products-carousel-loading">
          <div className="loading-spinner"></div>
          <p>Memuat produk...</p>
        </div>
      </section>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="products-section">
      <div className="products-section__header">
        <div>
          <h2>Produk Lainnya</h2>
          <p>Jelajahi produk dan paket menarik lainnya untuk Anda</p>
        </div>
        <button 
          className="products-section__view-all"
          onClick={() => window.open('/', '_blank')}
        >
          Lihat Semua
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div className="products-carousel-wrapper">
        <div 
          className="products-carousel-track"
          style={{
            transform: `translateX(-${currentSlide * 100}%)`,
          }}
        >
          {products.map((product) => (
            <div key={product.id} className="product-carousel-card">
              <div className="product-carousel-card__image">
                {product.header ? (
                  <img
                    src={`/api/image?path=${encodeURIComponent(product.header)}`}
                    alt={product.nama}
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextElementSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className="product-carousel-card__image-placeholder"
                  style={{ display: product.header ? "none" : "flex" }}
                >
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M9 9H15V15H9V9Z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
              </div>
              
              <div className="product-carousel-card__body">
                <div className="product-carousel-card__category">
                  {product.kategori_rel?.nama || "Produk"}
                </div>
                <h3 className="product-carousel-card__title">
                  {product.nama || "-"}
                </h3>
                <div className="product-carousel-card__price">
                  {formatPrice(product.harga_asli)}
                </div>
                <button
                  className="product-carousel-card__button"
                  onClick={() => {
                    if (onProductClick) {
                      onProductClick(product);
                    } else {
                      const generateSlug = (text) =>
                        (text || "")
                          .toString()
                          .toLowerCase()
                          .trim()
                          .replace(/[^a-z0-9 -]/g, "")
                          .replace(/\s+/g, "-")
                          .replace(/-+/g, "-");
                      
                      let kodeProduk = product.kode || (product.url ? product.url.replace(/^\//, '') : null);
                      
                      if (!kodeProduk || kodeProduk.includes(' ') || kodeProduk.includes('%20')) {
                        kodeProduk = generateSlug(product.nama);
                      }
                      
                      if (kodeProduk) {
                        window.open(`/landing/${kodeProduk}`, '_blank');
                      }
                    }
                  }}
                >
                  Lihat Detail
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {products.length > 4 && (
        <div className="products-carousel-indicators">
          {Array.from({ length: Math.ceil(products.length / 4) }).map((_, index) => (
            <button
              key={index}
              className={`products-carousel-indicator ${currentSlide === index ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}



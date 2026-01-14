// ✅ SERVER COMPONENT - Fetch data di server untuk optimasi performa
// Tidak ada "use client" - semua fetch dilakukan server-side

import { Suspense } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import ProductClientWrapper from "./ProductClientWrapper";
import { normalizeLandingpageData, parseBundlingData, parseLandingpageData, getRootBlocks, getSettings } from "./utils";
import "@/styles/sales/add-products3.css";

/**
 * Fetch product data dari API dengan cache untuk optimasi performa
 * Menggunakan force-cache untuk data yang jarang berubah
 * Atau next: { revalidate } untuk ISR (Incremental Static Regeneration)
 */
async function fetchProductData(kode_produk) {
  try {
    // ✅ Fetch dengan cache untuk optimasi performa - langsung ke API route Next.js
    // Menggunakan absolute URL dengan headers untuk fetch internal Next.js
    // Revalidate setiap 5 menit (300 detik) untuk balance antara freshness dan performa
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const res = await fetch(`${baseUrl}/api/landing/${kode_produk}`, {
      cache: 'force-cache', // ✅ Cache data untuk mengurangi blocking time
      next: { revalidate: 300 }, // ✅ ISR: regenerate setiap 5 menit jika ada request baru
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      return null;
    }

    const json = await res.json();

    if (!json.success || !json.data) {
      return null;
    }

    const data = json.data;
    
    // Parse bundling data
    const bundlingData = parseBundlingData(data);
    
    // Parse landingpage data dengan normalisasi
    const landingpageData = parseLandingpageData(data);
    
    // Filter root blocks untuk rendering
    const blocks = getRootBlocks(landingpageData);
    
    // Get settings untuk logo dan background
    const settings = getSettings(landingpageData);

    return {
      id: data.id,
      nama: data.nama,
      harga: data.harga,
      harga_asli: data.harga_asli,
      harga_coret: data.harga_coret,
      kategori: data.kategori,
      kategori_id: data.kategori_id,
      kategori_rel: data.kategori_rel,
      isBundling: bundlingData.length > 0,
      bundling: bundlingData,
      landingpage: landingpageData,
      blocks,
      settings,
      logoUrl: settings?.logo || '/assets/logo.png',
      backgroundColor: settings?.background_color || '#ffffff',
    };
  } catch (error) {
    console.error("[PRODUCT] Error fetching product:", error);
    return null;
  }
}

/**
 * Server Component utama - render layout dan konten utama terlebih dahulu
 * Data non-kritis (interaktif) dimuat setelahnya melalui Client Component
 */
export default async function ProductPage({ params }) {
  const { kode_produk } = await params;
  
  if (!kode_produk) {
    notFound();
  }

  // Fetch data di server - tidak blocking karena menggunakan cache
  const productData = await fetchProductData(kode_produk);

  if (!productData) {
    notFound();
  }

  const { blocks, settings, logoUrl, backgroundColor, landingpage } = productData;

  // Render layout utama terlebih dahulu (critical for LCP)
  return (
    <>
      {/* Preconnect untuk fonts - load lebih awal untuk mengurangi LCP */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      <div className="add-products3-container" itemScope itemType="https://schema.org/Product" style={{ backgroundColor }}>
        <div className="page-builder-canvas" style={{ backgroundColor }}>
          <div className="canvas-wrapper" style={{ backgroundColor }}>
            {/* Logo Section - Top - Critical untuk LCP */}
            <div className="canvas-logo-wrapper">
              <Image 
                src={logoUrl} 
                alt="Logo" 
                width={120}
                height={40}
                className="canvas-logo"
                priority
                style={{ objectFit: 'contain' }}
              />
            </div>

            {/* Content Area - Render blocks utama terlebih dahulu */}
            <div className="canvas-content-area">
              {/* Render root blocks - tidak blocking karena sudah di-fetch di server */}
              {blocks.length > 0 ? (
                blocks.map((block, index) => {
                  const componentId = block.config?.componentId;
                  
                  if (!componentId) {
                    const fallbackKey = `block-${block.type}-${index}`;
                    return (
                      <Suspense key={fallbackKey} fallback={<div className="canvas-preview-block">Loading...</div>}>
                        <ServerBlockRenderer block={block} allBlocks={landingpage || []} />
                      </Suspense>
                    );
                  }
                  
                  return (
                    <Suspense key={componentId} fallback={<div className="canvas-preview-block">Loading...</div>}>
                      <ServerBlockRenderer block={block} allBlocks={landingpage || []} />
                    </Suspense>
                  );
                })
              ) : (
                <div className="preview-placeholder">Belum ada konten</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Client Component untuk bagian interaktif - dimuat setelah layout utama */}
      <Suspense fallback={null}>
        <ProductClientWrapper kodeProduk={kode_produk} initialData={productData} />
      </Suspense>
    </>
  );
}

/**
 * Client Component untuk render semua blocks - dipanggil secara dinamis
 * Mengurangi initial bundle size dengan lazy loading
 */
import dynamic from "next/dynamic";

const BlocksRenderer = dynamic(() => import("./BlocksRenderer"), {
  ssr: false, // ✅ Client-side only untuk mengurangi server bundle
  loading: () => <div className="canvas-preview-block">Loading...</div>
});

// ✅ Server Component untuk render block individual - delegate ke Client Component
function ServerBlockRenderer({ block, allBlocks }) {
  return (
    <BlocksRenderer block={block} allBlocks={allBlocks} />
  );
}

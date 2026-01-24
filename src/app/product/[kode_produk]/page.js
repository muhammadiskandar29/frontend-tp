import { Suspense } from "react";
import ProductClient from "./ProductClient";
import { getBackendUrl } from "@/config/api";
import { headers } from "next/headers";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Helper function to fetch product data on server
async function getProduct(kode_produk) {
  try {
    // ✅ AGGRESSIVE ANTI-CACHE: Tambahkan timestamp agar Fetch tidak pernah cached di level Vercel/Browser
    const timestamp = Date.now();
    const url = getBackendUrl(`landing/${kode_produk}?t=${timestamp}`);

    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (!res.ok) {
      console.warn(`[SERVER] Fetch product failed: ${res.status}`);
      return null;
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("[SERVER] Error fetching product:", error);
    return null;
  }
}

export async function generateMetadata({ params }) {
  // ✅ FORCE DYNAMIC: Memastikan metadata tidak dicache
  await headers();

  // Await params karena di Next.js terbaru params adalah Promise
  const resolvedParams = await params;
  const { kode_produk } = resolvedParams;

  const result = await getProduct(kode_produk);

  if (!result || !result.success) {
    return {
      title: 'Product Not Found',
    };
  }

  const { data: product, landingpage } = result;

  // Logic ekstraksi settings yang sama dengan Client Component
  // Gunakan .find agar robust terhadap posisi block settings
  const settings = landingpage && Array.isArray(landingpage)
    ? landingpage.find(item => item.type === 'settings')
    : null;

  const title = settings?.seo_title || settings?.page_title || product?.nama || "Product Page";
  const description = settings?.meta_description || product?.deskripsi_singkat || "";

  const images = [];
  // Prioritas image: meta_image > logo > gambar_utama
  const metaImage = settings?.meta_image || settings?.logo || product?.gambar_utama;
  if (metaImage) {
    images.push(metaImage);
  }

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: images,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: images,
    },
  };
}

export async function generateViewport() {
  return {
    width: "device-width",
    initialScale: 1.0,
    maximumScale: 5.0,
    userScalable: true,
  };
}

// ✅ Server Component Wrapper
export default async function ProductPage({ params }) {
  // ✅ FORCE DYNAMIC: Memanggil headers() memastikan halaman ini 100% dinamis & NO-CACHE
  await headers();

  // Await params di Server Component
  const resolvedParams = await params;
  const { kode_produk } = resolvedParams;

  // Fetch data di server
  const result = await getProduct(kode_produk);

  // Prepare Props
  const initialProductData = result?.success ? result.data : null;
  const initialLandingPage = result?.success ? result.landingpage : null;

  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontFamily: 'Inter, sans-serif'
      }}>
        <p>Loading...</p>
      </div>
    }>
      <ProductClient
        initialProductData={initialProductData}
        initialLandingPage={initialLandingPage}
      />
    </Suspense>
  );
}

import ProductClient from "./ProductClient";
import { getBackendUrl } from "@/config/api";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Helper function to fetch product data on server
async function getProduct(kode_produk) {
  try {
    const url = getBackendUrl(`landing/${kode_produk}`);

    const res = await fetch(url, {
      cache: 'no-store'
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
  const { kode_produk } = params;
  const result = await getProduct(kode_produk);

  if (!result || !result.success) {
    return {
      title: 'Product Not Found',
    };
  }

  const { data: product, landingpage } = result;

  // Logic ekstraksi settings yang sama dengan Client Component
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
  const { kode_produk } = params;

  // Fetch data di server
  const result = await getProduct(kode_produk);

  // Prepare Props
  const initialProductData = result?.success ? result.data : null;
  const initialLandingPage = result?.success ? result.landingpage : null;

  return (
    <ProductClient
      initialProductData={initialProductData}
      initialLandingPage={initialLandingPage}
    />
  );
}


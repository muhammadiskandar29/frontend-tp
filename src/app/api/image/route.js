const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://3.105.234.181:8000";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const rawPath = searchParams.get("path");

  if (!rawPath) {
    return new Response(JSON.stringify({ error: "Path is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Decode path
  const decoded = decodeURIComponent(rawPath);
  
  // Build backend URL - selalu tambahkan /storage prefix untuk file upload
  let storagePath = decoded.startsWith("/") ? decoded : `/${decoded}`;
  
  // Jika path adalah file produk, tambahkan /storage
  if (storagePath.startsWith("/produk/")) {
    storagePath = `/storage${storagePath}`;
  }

  const backendUrl = `${BACKEND_URL}${storagePath}`;
  
  console.log("[IMAGE PROXY] Request path:", rawPath);
  console.log("[IMAGE PROXY] Decoded path:", decoded);
  console.log("[IMAGE PROXY] Backend URL:", backendUrl);

  try {
    const result = await fetch(backendUrl, {
      method: "GET",
      headers: {
        Accept: "image/*,*/*",
      },
    });

    console.log("[IMAGE PROXY] Backend response status:", result.status);

    if (!result.ok) {
      console.error("[IMAGE PROXY] Backend returned error:", result.status);
      return new Response(JSON.stringify({ error: "Image not found", url: backendUrl }), {
        status: result.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Stream response body langsung ke client
    const contentType = result.headers.get("Content-Type") || "image/jpeg";
    
    return new Response(result.body, {
      status: result.status,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("[IMAGE PROXY] Fetch error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch image", message: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

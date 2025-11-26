import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://3.105.234.181:8000";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json({ error: "Path is required" }, { status: 400 });
    }

    // Build full URL
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    const imageUrl = `${BACKEND_URL}${cleanPath}`;

    // Fetch image from backend
    const response = await fetch(imageUrl, {
      headers: {
        Accept: "image/*",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Image not found" },
        { status: response.status }
      );
    }

    // Get image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";

    // Return image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Image proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 500 }
    );
  }
}


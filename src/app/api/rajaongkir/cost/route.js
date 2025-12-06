import { NextResponse } from "next/server";

const API_KEY = process.env.RAJAONGKIR_API_KEY;
const BASE_URL = "https://rajaongkir.komerce.id/api/v1/cost/domestic-cost";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // ambil query
    const origin = searchParams.get("origin");         // subdistrict_id
    const destination = searchParams.get("destination"); // subdistrict_id
    const weight = parseInt(searchParams.get("weight") || "1000");
    const courier = searchParams.get("courier") || "jne"; // optional

    // butuh origin & destination → wajib
    if (!origin || !destination) {
      return NextResponse.json({ success: true, data: {} });
    }

    const body = JSON.stringify({
      origin: Number(origin),
      destination: Number(destination),
      weight,
      courier
    });

    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        key: API_KEY
      },
      body
    });

    if (!response.ok) {
      return NextResponse.json({ success: false, data: {} });
    }

    const json = await response.json();

    if (!json.success) {
      return NextResponse.json({ success: false, data: {} });
    }

    const raw = json.data || {};

    const normalized = {
      price: raw.price || raw.cost || raw.amount || 0,
      etd: raw.etd || raw.estimate || "-",
      courier: raw.courier || "",
      service: raw.service || "",
      raw
    };

    return NextResponse.json({
      success: true,
      price: normalized.price,
      etd: normalized.etd,
      data: normalized
    });

  } catch (err) {
    return NextResponse.json({ success: false, data: {} });
  }
}

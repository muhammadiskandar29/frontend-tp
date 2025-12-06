import { NextResponse } from "next/server";

const API_KEY = process.env.KOMERCE_API_KEY;
const BASE_URL = "https://api-sandbox.collaborator.komerce.id/tariff/api/v1";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // ambil query
    const shipper_destination_id = searchParams.get("shipper_destination_id");
    const receiver_destination_id = searchParams.get("receiver_destination_id");
    const weight = searchParams.get("weight") || "1000";
    const item_value = searchParams.get("item_value") || "0";
    const cod = searchParams.get("cod") || "0";

    // Kalo tidak lengkap → return kosong (silent)
    if (!shipper_destination_id || !receiver_destination_id) {
      return NextResponse.json({ success: true, data: {} });
    }

    const params = new URLSearchParams({
      shipper_destination_id,
      receiver_destination_id,
      weight,
      item_value,
      cod
    });

    const url = `${BASE_URL}/calculate?${params.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-api-key": API_KEY
      }
    });

    if (!response.ok) {
      return NextResponse.json({ success: true, data: {} });
    }

    const text = await response.text();

    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      return NextResponse.json({ success: true, data: {} });
    }

    // Format resmi Komerce → selalu { success, data }
    const raw = json.data || json.result || json;

    const normalized = {
      price:
        raw.price ||
        raw.cost ||
        raw.total_cost ||
        raw.ongkir ||
        0,
      etd:
        raw.etd ||
        raw.estimated_delivery ||
        raw.delivery_time ||
        "",
      courier:
        raw.courier ||
        raw.shipping_method ||
        "",
      service:
        raw.service ||
        raw.service_type ||
        "",
      raw
    };

    return NextResponse.json({
      success: true,
      price: normalized.price,
      etd: normalized.etd,
      data: normalized
    });
  } catch (err) {
    // silent error
    return NextResponse.json({ success: true, data: {} });
  }
}

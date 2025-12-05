import { NextResponse } from 'next/server';

// Hardcode API key
const API_KEY = 'mT8nGMeZ4cacc72ba9d93fd4g2xH48Gb';
const RAJAONGKIR_BASE_URL = 'https://api.rajaongkir.com/basic'; // V2 Basic

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase() || '';

    // RajaOngkir V2 Basic menggunakan header 'key'
    const response = await fetch(`${RAJAONGKIR_BASE_URL}/city`, {
      method: 'GET',
      headers: {
        'key': API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log('[RAJAONGKIR_CITIES] Response status:', response.status);
    console.log('[RAJAONGKIR_CITIES] Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('[RAJAONGKIR_CITIES] Raw response status:', response.status);
    console.log('[RAJAONGKIR_CITIES] Raw response (first 500 chars):', responseText.substring(0, 500));

    let json;
    try {
      json = JSON.parse(responseText);
    } catch (err) {
      console.error('[RAJAONGKIR_CITIES] JSON parse error:', err.message);
      console.error('[RAJAONGKIR_CITIES] Full response:', responseText);
      return NextResponse.json(
        {
          success: false,
          message: 'Response dari RajaOngkir bukan JSON'
        },
        { status: 500 }
      );
    }

    console.log('[RAJAONGKIR_CITIES] Parsed JSON:', JSON.stringify(json).substring(0, 500));

    // Validate top-level structure
    // RajaOngkir bisa return error langsung atau dalam struktur rajaongkir
    if (!json) {
      console.error("[RAJAONGKIR_CITIES] Empty response");
      return NextResponse.json(
        {
          success: false,
          message: "Response kosong dari RajaOngkir"
        },
        { status: 500 }
      );
    }

    // Check if it's an error response (bisa langsung error atau dalam rajaongkir.status)
    if (json.status && json.status.code !== 200) {
      console.error("[RAJAONGKIR_CITIES] Error response:", json);
      return NextResponse.json(
        {
          success: false,
          message: json.status.description || json.message || "Gagal mengambil data kota"
        },
        { status: json.status.code || 400 }
      );
    }

    // Check if response has rajaongkir wrapper
    if (!json.rajaongkir) {
      console.error("[RAJAONGKIR_CITIES] Invalid structure - missing rajaongkir wrapper:", Object.keys(json));
      console.error("[RAJAONGKIR_CITIES] Full response:", JSON.stringify(json).substring(0, 1000));
      return NextResponse.json(
        {
          success: false,
          message: "Format response tidak valid dari RajaOngkir",
          debug: { keys: Object.keys(json), sample: JSON.stringify(json).substring(0, 200) }
        },
        { status: 500 }
      );
    }

    // Validate status object
    const statusCode = json.rajaongkir.status?.code;
    const statusMsg = json.rajaongkir.status?.description || "Gagal mengambil data kota";

    if (statusCode !== 200) {
      console.error("[RAJAONGKIR_CITIES] Status error:", json.rajaongkir.status);
      return NextResponse.json(
        {
          success: false,
          message: statusMsg
        },
        { status: 400 }
      );
    }

    // Check if results exist
    if (!json.rajaongkir.results || !Array.isArray(json.rajaongkir.results)) {
      console.error('[RAJAONGKIR_CITIES] No results array:', json.rajaongkir);
      return NextResponse.json(
        {
          success: false,
          message: "Data kota tidak ditemukan",
          debug: json.rajaongkir
        },
        { status: 500 }
      );
    }

    console.log('[RAJAONGKIR_CITIES] Found', json.rajaongkir.results.length, 'cities');

    let list = json.rajaongkir.results;

    // Local filter
    if (search) {
      list = list.filter(
        (c) =>
          c.city_name?.toLowerCase().includes(search) ||
          c.province?.toLowerCase().includes(search)
      );
    }

    // Format response sesuai yang diharapkan frontend
    const formattedCities = list.map(city => ({
      city_id: city.city_id,
      city_name: city.city_name,
      province_id: city.province_id,
      province_name: city.province,
      type: city.type || '',
      postal_code: city.postal_code || '',
      label: `${city.city_name}, ${city.province}`.trim(),
    }));

    return NextResponse.json({
      success: true,
      data: formattedCities,
      count: formattedCities.length
    });
  } catch (e) {
    console.error('[RAJAONGKIR_CITIES] Error:', e);
    return NextResponse.json(
      { 
        success: false, 
        message: e.message || 'Terjadi kesalahan saat mengambil data kota' 
      },
      { status: 500 }
    );
  }
}

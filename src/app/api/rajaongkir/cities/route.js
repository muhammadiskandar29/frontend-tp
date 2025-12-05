import { NextResponse } from 'next/server';

/**
 * Backend API Route untuk search kota/subdistrict dari RajaOngkir V2 Basic
 * 
 * Hardcode untuk testing (nanti bisa pindahkan ke environment variable):
 * - API_KEY: mT8nGMeZ4cacc72ba9d93fd4g2xH48Gb
 * 
 * TODO: Pindahkan ke process.env.RAJAONGKIR_API_KEY
 */
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
      // Handle error dengan baik, jangan lempar error ke frontend
      console.error('[RAJAONGKIR_CITIES] JSON parse error:', err.message);
      console.error('[RAJAONGKIR_CITIES] Full response:', responseText);
      return NextResponse.json(
        {
          success: false,
          message: 'Response dari RajaOngkir bukan JSON',
          data: [] // Return empty array agar frontend tidak error
        },
        { status: 200 } // Return 200 agar frontend tidak throw error
      );
    }

    console.log('[RAJAONGKIR_CITIES] Parsed JSON:', JSON.stringify(json).substring(0, 500));

    // Validate top-level structure
    // RajaOngkir bisa return error langsung atau dalam struktur rajaongkir
    if (!json) {
      // Handle error dengan baik, jangan lempar error ke frontend
      console.warn("[RAJAONGKIR_CITIES] Empty response");
      return NextResponse.json(
        {
          success: false,
          message: "Response kosong dari RajaOngkir",
          data: [] // Return empty array agar frontend tidak error
        },
        { status: 200 } // Return 200 agar frontend tidak throw error
      );
    }

    // Check if it's an error response (bisa langsung error atau dalam rajaongkir.status)
    if (json.status && json.status.code !== 200) {
      // Handle error dengan baik, jangan lempar error ke frontend
      console.warn("[RAJAONGKIR_CITIES] Error response:", json);
      return NextResponse.json(
        {
          success: false,
          message: json.status.description || json.message || "Gagal mengambil data kota",
          data: [] // Return empty array agar frontend tidak error
        },
        { status: 200 } // Return 200 agar frontend tidak throw error
      );
    }

    // Check if response has rajaongkir wrapper
    if (!json.rajaongkir) {
      // Handle error dengan baik, jangan lempar error ke frontend
      console.warn("[RAJAONGKIR_CITIES] Invalid structure - missing rajaongkir wrapper:", Object.keys(json));
      return NextResponse.json(
        {
          success: false,
          message: "Format response tidak valid dari RajaOngkir",
          data: [] // Return empty array agar frontend tidak error
        },
        { status: 200 } // Return 200 agar frontend tidak throw error
      );
    }

    // Validate status object
    const statusCode = json.rajaongkir.status?.code;
    const statusMsg = json.rajaongkir.status?.description || "Gagal mengambil data kota";

    if (statusCode !== 200) {
      // Handle error dengan baik, jangan lempar error ke frontend
      console.warn("[RAJAONGKIR_CITIES] Status error:", json.rajaongkir.status);
      return NextResponse.json(
        {
          success: false,
          message: statusMsg,
          data: [] // Return empty array agar frontend tidak error
        },
        { status: 200 } // Return 200 agar frontend tidak throw error
      );
    }

    // Check if results exist
    if (!json.rajaongkir.results || !Array.isArray(json.rajaongkir.results)) {
      // Handle error dengan baik, jangan lempar error ke frontend
      console.warn('[RAJAONGKIR_CITIES] No results array:', json.rajaongkir);
      return NextResponse.json(
        {
          success: false,
          message: "Data kota tidak ditemukan",
          data: [] // Return empty array agar frontend tidak error
        },
        { status: 200 } // Return 200 agar frontend tidak throw error
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
    // Handle semua error dengan baik, jangan lempar error ke frontend
    console.error('[RAJAONGKIR_CITIES] Error:', e);
    return NextResponse.json(
      { 
        success: false, 
        message: e.message || 'Terjadi kesalahan saat mengambil data kota',
        data: [] // Return empty array agar frontend tidak error
      },
      { status: 200 } // Return 200 agar frontend tidak throw error
    );
  }
}

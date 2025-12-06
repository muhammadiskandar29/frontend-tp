import { NextResponse } from 'next/server';

const API_KEY = 'mT8nGMeZ4cacc72ba9d93fd4g2xH48Gb';
// Catatan: RajaOngkir V2 Basic menggunakan endpoint /starter (bukan /basic)
const RAJAONGKIR_BASE_URL = 'https://api.rajaongkir.com/starter'; // V2 Basic/Starter

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('q') || searchParams.get('search') || '';
    
    // Encode search query untuk handle spasi dan karakter spesial
    const search = searchQuery.trim().toLowerCase();

    if (!search) {
      return NextResponse.json(
        {
          success: false,
          message: 'Masukkan kata kunci untuk mencari kota origin'
        },
        { status: 400 }
      );
    }

    console.log('[RAJAONGKIR_FIND_ORIGIN] Searching origin, query:', search);

    const response = await fetch(`${RAJAONGKIR_BASE_URL}/city`, {
      method: 'GET',
      headers: {
        'key': API_KEY,
        'Content-Type': 'application/json'
      }
    });

    const responseText = await response.text();
    console.log('[RAJAONGKIR_FIND_ORIGIN] Response status:', response.status);

    let json;
    try {
      json = JSON.parse(responseText);
    } catch (err) {
      console.error('[RAJAONGKIR_FIND_ORIGIN] JSON parse error:', err.message);
      return NextResponse.json(
        {
          success: false,
          message: 'Response dari RajaOngkir bukan JSON'
        },
        { status: 500 }
      );
    }

    // Check if response has rajaongkir wrapper
    if (!json || !json.rajaongkir) {
      console.error("[RAJAONGKIR_FIND_ORIGIN] Invalid structure:", Object.keys(json || {}));
      return NextResponse.json(
        {
          success: false,
          message: "Format response tidak valid dari RajaOngkir"
        },
        { status: 500 }
      );
    }

    // Validate status object
    const statusCode = json.rajaongkir.status?.code;
    const statusMsg = json.rajaongkir.status?.description || "Gagal mengambil data kota";

    if (statusCode !== 200) {
      console.error("[RAJAONGKIR_FIND_ORIGIN] Status error:", json.rajaongkir.status);
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
      return NextResponse.json(
        {
          success: false,
          message: "Data kota tidak ditemukan"
        },
        { status: 500 }
      );
    }

    // Filter by search query
    const searchLower = search.toLowerCase().trim();
    const matchedCities = json.rajaongkir.results.filter((city) => {
      if (!city) return false;
      const cityName = (city.city_name || '').toLowerCase();
      const provinceName = (city.province || '').toLowerCase();
      return cityName.includes(searchLower) || provinceName.includes(searchLower);
    });

    // Format response
    const results = matchedCities.map(city => ({
      id: city.city_id,
      city_id: city.city_id,
      label: `${city.city_name}, ${city.province}`.trim(),
      city_name: city.city_name,
      province_name: city.province,
      province_id: city.province_id,
      type: city.type || '',
      postal_code: city.postal_code || '',
    }));

    console.log('[RAJAONGKIR_FIND_ORIGIN] Found', results.length, 'matches');

    return NextResponse.json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (e) {
    console.error('[RAJAONGKIR_FIND_ORIGIN] Error:', e);
    return NextResponse.json(
      { 
        success: false, 
        message: e.message || 'Terjadi kesalahan saat mencari origin' 
      },
      { status: 500 }
    );
  }
}


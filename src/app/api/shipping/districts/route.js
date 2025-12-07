import { NextResponse } from 'next/server';

/**
 * Next.js API Route untuk mengambil daftar district berdasarkan city_id dari Komerce API
 * 
 * Endpoint: GET /api/shipping/districts?city_id={id}
 */
const API_KEY = 'mT8nGMeZ4cacc72ba9d93fd4g2xH48Gb';
const KOMERCE_BASE_URL = 'https://rajaongkir.komerce.id/api/v1';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const city_id = searchParams.get('city_id') || '';

    if (!city_id) {
      return NextResponse.json({
        success: false,
        message: 'city_id wajib diisi',
        data: []
      }, { status: 200 });
    }

    // Gunakan endpoint domestic-destination dengan filter city_id
    // Format: search dengan city_id untuk mendapatkan districts
    // Alternatif: gunakan endpoint khusus jika ada, atau filter dari domestic-destination
    const url = `${KOMERCE_BASE_URL}/destination/domestic-destination?city_id=${encodeURIComponent(city_id)}&limit=1000&offset=0`;

    let response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      response = await fetch(url, {
        method: 'GET',
        headers: {
          'key': API_KEY,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
    } catch (fetchError) {
      console.error('[SHIPPING_DISTRICTS] Fetch failed:', fetchError.message);
      return NextResponse.json({
        success: false,
        message: 'Gagal terhubung ke server',
        data: []
      }, { status: 200 });
    }

    if (!response || !response.ok) {
      const status = response?.status || 0;
      console.error('[SHIPPING_DISTRICTS] HTTP error:', status);
      return NextResponse.json({
        success: false,
        message: `Gagal mengambil data (HTTP ${status})`,
        data: []
      }, { status: 200 });
    }

    const responseText = await response.text();
    let json;

    try {
      json = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[SHIPPING_DISTRICTS] JSON parse error:', parseError.message);
      return NextResponse.json({
        success: false,
        message: 'Format response tidak valid',
        data: []
      }, { status: 200 });
    }

    // Handle response dari Komerce API
    let results = [];

    if (json.data && Array.isArray(json.data)) {
      results = json.data;
    } else if (Array.isArray(json)) {
      results = json;
    } else {
      console.error('[SHIPPING_DISTRICTS] Unknown response format');
      return NextResponse.json({
        success: false,
        message: 'Format response tidak dikenal',
        data: []
      }, { status: 200 });
    }

    // Normalize data - ambil unique districts dari results
    // Format dari API: { id, district_name, city_id, ... }
    const districtMap = new Map();
    
    results.forEach(item => {
      const districtId = item.district_id || item.id;
      const districtName = item.district_name || item.name;
      
      if (districtId && districtName && !districtMap.has(districtId)) {
        districtMap.set(districtId, {
          id: districtId,
          name: districtName,
          city_id: item.city_id || city_id
        });
      }
    });
    
    const normalizedData = Array.from(districtMap.values());

    return NextResponse.json({
      success: true,
      message: 'Berhasil mengambil data district',
      data: normalizedData
    }, { status: 200 });

  } catch (error) {
    console.error('[SHIPPING_DISTRICTS] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      message: `Terjadi kesalahan: ${error.message || 'Unknown error'}`,
      data: []
    }, { status: 200 });
  }
}

import { NextResponse } from 'next/server';

/**
 * Next.js API Route untuk mengambil daftar kota berdasarkan province_id dari Komerce API
 * 
 * Endpoint: GET /api/shipping/cities?province_id={id}
 */
const API_KEY = 'mT8nGMeZ4cacc72ba9d93fd4g2xH48Gb';
const KOMERCE_BASE_URL = 'https://rajaongkir.komerce.id/api/v1';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const province_id = searchParams.get('province_id') || '';

    if (!province_id) {
      return NextResponse.json({
        success: false,
        message: 'province_id wajib diisi',
        data: []
      }, { status: 200 });
    }

    const url = `${KOMERCE_BASE_URL}/destination/city?province_id=${encodeURIComponent(province_id)}`;

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
      console.error('[SHIPPING_CITIES] Fetch failed:', fetchError.message);
      return NextResponse.json({
        success: false,
        message: 'Gagal terhubung ke server',
        data: []
      }, { status: 200 });
    }

    if (!response || !response.ok) {
      const status = response?.status || 0;
      console.error('[SHIPPING_CITIES] HTTP error:', status);
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
      console.error('[SHIPPING_CITIES] JSON parse error:', parseError.message);
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
      console.error('[SHIPPING_CITIES] Unknown response format');
      return NextResponse.json({
        success: false,
        message: 'Format response tidak dikenal',
        data: []
      }, { status: 200 });
    }

    // Normalize data
    const normalizedData = results.map(item => ({
      id: item.id || item.city_id || '',
      name: item.name || item.city_name || '',
      province_id: item.province_id || province_id
    }));

    return NextResponse.json({
      success: true,
      message: 'Berhasil mengambil data kota',
      data: normalizedData
    }, { status: 200 });

  } catch (error) {
    console.error('[SHIPPING_CITIES] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      message: `Terjadi kesalahan: ${error.message || 'Unknown error'}`,
      data: []
    }, { status: 200 });
  }
}

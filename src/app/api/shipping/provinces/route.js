import { NextResponse } from 'next/server';

/**
 * Next.js API Route untuk mengambil daftar provinces
 * 
 * Endpoint: GET /api/shipping/provinces
 * 
 * Proxy ke: GET https://rajaongkir.komerce.id/api/v1/destination/province
 */
const KOMERCE_BASE_URL = 'https://rajaongkir.komerce.id/api/v1';

export async function GET(request) {
  try {
    const provincesUrl = `${KOMERCE_BASE_URL}/destination/province`;

    let response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      response = await fetch(provincesUrl, {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
    } catch (fetchError) {
      console.error('[SHIPPING_PROVINCES] Fetch failed:', fetchError.message);
      return NextResponse.json({
        success: false,
        message: 'Gagal terhubung ke server',
        data: []
      }, { status: 200 });
    }

    if (!response || !response.ok) {
      const status = response?.status || 0;
      console.error('[SHIPPING_PROVINCES] HTTP error:', status);
      return NextResponse.json({
        success: false,
        message: `Gagal mengambil data (HTTP ${status})`,
        data: []
      }, { status: 200 });
    }

    const json = await response.json();
    
    let results = [];
    if (json.data && Array.isArray(json.data)) {
      results = json.data;
    } else if (Array.isArray(json)) {
      results = json;
    }

    // Normalize data
    const normalizedData = results.map(item => ({
      id: item.id || '',
      name: item.name || ''
    }));

    return NextResponse.json({
      success: true,
      message: 'Berhasil mengambil data provinces',
      data: normalizedData
    }, { status: 200 });

  } catch (error) {
    console.error('[SHIPPING_PROVINCES] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      message: `Terjadi kesalahan: ${error.message || 'Unknown error'}`,
      data: []
    }, { status: 200 });
  }
}

import { NextResponse } from 'next/server';

/**
 * Next.js API Route untuk mengambil daftar districts
 * 
 * Endpoint: GET /api/shipping/districts?city_id={id}
 * 
 * Proxy ke: GET https://rajaongkir.komerce.id/api/v1/destination/district/
 */
const API_KEY = 'mT8nGMeZ4cacc72ba9d93fd4g2xH48Gb';
const KOMERCE_BASE_URL = 'https://rajaongkir.komerce.id/api/v1';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const cityId = searchParams.get('city_id');

    const districtsUrl = `${KOMERCE_BASE_URL}/destination/district/${cityId ? `?city_id=${cityId}` : ''}`;

    let response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      response = await fetch(districtsUrl, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'key': API_KEY
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

    const json = await response.json();
    
    let results = [];
    if (json.data && Array.isArray(json.data)) {
      results = json.data;
    } else if (Array.isArray(json)) {
      results = json;
    }

    // Normalize data
    const normalizedData = results.map(item => ({
      id: item.id || item.district_id || '',
      district_id: item.id || item.district_id || '',
      name: item.name || item.district_name || '',
      city_id: item.city_id || ''
    }));

    return NextResponse.json({
      success: true,
      message: 'Berhasil mengambil data districts',
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

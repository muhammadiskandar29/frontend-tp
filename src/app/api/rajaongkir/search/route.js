import { NextResponse } from 'next/server';

/**
 * Backend API Route untuk search destination menggunakan Komerce RajaOngkir V2
 * 
 * Endpoint: GET /api/rajaongkir/search?keyword=...
 * 
 * Hardcode API Key (untuk testing):
 * - x-api-key: mT8nGMeZ4cacc72ba9d93fd4g2xH48Gb
 * 
 * TODO: Pindahkan ke process.env.KOMERCE_API_KEY
 */
const API_KEY = 'mT8nGMeZ4cacc72ba9d93fd4g2xH48Gb';
const KOMERCE_BASE_URL = 'https://api-sandbox.collaborator.komerce.id/tariff/api/v1';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword') || '';

    // Handle keyword kosong - return empty array (bukan error)
    if (!keyword || keyword.trim().length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    // Build URL dengan query parameter
    const searchUrl = `${KOMERCE_BASE_URL}/destination/search?keyword=${encodeURIComponent(keyword.trim())}`;

    console.log('[KOMERCE_SEARCH] Searching destination:', keyword);

    let response;
    try {
      response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json'
        }
      });
    } catch (fetchError) {
      // Silent error - tidak crash, return empty array
      console.warn('[KOMERCE_SEARCH] Fetch failed (silent):', fetchError.message);
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    // Handle HTTP error - silent, return empty array
    if (!response || !response.ok) {
      console.warn('[KOMERCE_SEARCH] HTTP error (silent):', response?.status);
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    const responseText = await response.text();

    // Parse JSON - silent error jika gagal
    let json;
    try {
      json = JSON.parse(responseText);
    } catch (parseError) {
      // Silent error - return empty array
      console.warn('[KOMERCE_SEARCH] JSON parse error (silent):', parseError.message);
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    // Handle berbagai format response dari Komerce
    // Format bisa: { data: [...] } atau langsung array atau { results: [...] }
    let results = [];

    if (Array.isArray(json)) {
      // Format: langsung array
      results = json;
    } else if (json.data && Array.isArray(json.data)) {
      // Format: { data: [...] }
      results = json.data;
    } else if (json.results && Array.isArray(json.results)) {
      // Format: { results: [...] }
      results = json.results;
    } else if (json.success && Array.isArray(json.data)) {
      // Format: { success: true, data: [...] }
      results = json.data;
    } else {
      // Format tidak dikenal - silent error, return empty array
      console.warn('[KOMERCE_SEARCH] Unknown response format (silent)');
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    // Normalize data untuk frontend
    const normalizedData = results.map(item => ({
      id: item.id || item.destination_id || item.city_id || '',
      destination_id: item.destination_id || item.id || item.city_id || '',
      city_id: item.city_id || item.destination_id || item.id || '',
      city_name: item.city_name || item.name || item.label || '',
      province_name: item.province_name || item.province || '',
      province_id: item.province_id || '',
      type: item.type || '',
      postal_code: item.postal_code || item.postal || '',
      label: item.label || `${item.city_name || item.name || ''}, ${item.province_name || item.province || ''}`.trim()
    }));

    console.log('[KOMERCE_SEARCH] Found', normalizedData.length, 'results');

    // Return normalized data
    return NextResponse.json({
      success: true,
      data: normalizedData
    });

  } catch (error) {
    // Catch-all error handler - tidak boleh crash
    // Silent error - return empty array
    console.warn('[KOMERCE_SEARCH] Unexpected error (silent):', error.message);
    return NextResponse.json({
      success: true,
      data: []
    });
  }
}


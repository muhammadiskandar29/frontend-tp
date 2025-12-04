import { NextResponse } from 'next/server';

const KOMERCE_BASE_URL = 'https://rajaongkir-api.komerce.co.id';
// Hardcode API key (untuk production, lebih baik pakai environment variable)
const RAJAONGKIR_KEY = process.env.RAJAONGKIR_KEY || 'mT8nGMeZ4cacc72ba9d93fd4g2xH48Gb';

/**
 * Endpoint untuk mencari ID kota origin berdasarkan nama kota
 * GET /api/komerce/find-origin?q=tangerang
 */
export async function GET(request) {
  try {
    if (!RAJAONGKIR_KEY) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'API key tidak dikonfigurasi. Silakan set RAJAONGKIR_KEY di Vercel Environment Variables.' 
        },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (!query) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Parameter q (query) wajib diisi. Contoh: /api/komerce/find-origin?q=tangerang' 
        },
        { status: 400 }
      );
    }

    // Build URL untuk search destination
    const url = `${KOMERCE_BASE_URL}/domestic-destination${query ? `?q=${encodeURIComponent(query)}` : ''}`;

    console.log('[KOMERCE_FIND_ORIGIN] Requesting:', url);
    console.log('[KOMERCE_FIND_ORIGIN] API Key:', RAJAONGKIR_KEY ? `${RAJAONGKIR_KEY.substring(0, 10)}...` : 'Not Set');
    console.log('[KOMERCE_FIND_ORIGIN] Full URL:', url);

    let response;
    try {
      // Create AbortController untuk timeout (lebih kompatibel)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 detik timeout
      
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'api-key': RAJAONGKIR_KEY,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; Next.js)',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
    } catch (fetchError) {
      console.error('[KOMERCE_FIND_ORIGIN] Fetch error:', fetchError);
      console.error('[KOMERCE_FIND_ORIGIN] Error name:', fetchError.name);
      console.error('[KOMERCE_FIND_ORIGIN] Error message:', fetchError.message);
      
      // Handle specific error types
      if (fetchError.name === 'AbortError' || fetchError.message.includes('timeout')) {
        return NextResponse.json(
          {
            success: false,
            message: 'Request timeout. API Komerce tidak merespons dalam 30 detik.',
            error: 'TIMEOUT',
          },
          { status: 504 }
        );
      }
      
      if (fetchError.message.includes('fetch failed') || fetchError.message.includes('ECONNREFUSED')) {
        return NextResponse.json(
          {
            success: false,
            message: 'Gagal terhubung ke API Komerce. Periksa koneksi internet atau API endpoint mungkin sedang down.',
            error: 'CONNECTION_FAILED',
            details: fetchError.message,
          },
          { status: 503 }
        );
      }
      
      throw fetchError; // Re-throw untuk di-handle di catch block
    }

    const responseText = await response.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch (err) {
      console.error('[KOMERCE_FIND_ORIGIN] Non-JSON response:', responseText.substring(0, 500));
      return NextResponse.json(
        { success: false, message: 'Response dari Komerce bukan JSON' },
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error('[KOMERCE_FIND_ORIGIN] Error response:', data);
      return NextResponse.json(
        {
          success: false,
          message: data?.message || data?.error || 'Gagal mengambil data destinasi',
          error: data,
        },
        { status: response.status }
      );
    }

    // Parse response dari Komerce
    let destinations = [];
    if (data?.rajaongkir?.results) {
      destinations = data.rajaongkir.results;
    } else if (Array.isArray(data)) {
      destinations = data;
    } else if (data?.results) {
      destinations = data.results;
    } else if (data?.data) {
      destinations = Array.isArray(data.data) ? data.data : [];
    }

    // Filter berdasarkan query jika ada
    if (query && destinations.length > 0) {
      const queryLower = query.toLowerCase();
      destinations = destinations.filter((dest) => {
        const cityName = (dest.city_name || dest.name || '').toLowerCase();
        const province = (dest.province || dest.province_name || '').toLowerCase();
        const type = (dest.type || '').toLowerCase();
        return cityName.includes(queryLower) || province.includes(queryLower) || type.includes(queryLower);
      });
    }

    // Format response untuk lebih mudah dibaca
    const formattedResults = destinations.map((dest) => ({
      id: dest.id || dest.city_id || dest.destination_id || '',
      name: dest.city_name || dest.name || dest.destination_name || '',
      province: dest.province || dest.province_name || '',
      type: dest.type || '',
      postal_code: dest.postal_code || '',
    }));

    return NextResponse.json({
      success: true,
      query: query,
      count: formattedResults.length,
      data: formattedResults,
      message: formattedResults.length > 0 
        ? `Ditemukan ${formattedResults.length} kota. Gunakan ID untuk NEXT_PUBLIC_RAJAONGKIR_ORIGIN`
        : 'Tidak ada kota yang ditemukan. Coba cari dengan kata kunci lain.',
    });
  } catch (error) {
    console.error('[KOMERCE_FIND_ORIGIN] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Gagal terhubung ke Komerce API',
        error: error.message,
      },
      { status: 500 }
    );
  }
}


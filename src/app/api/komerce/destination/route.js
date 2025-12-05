import { NextResponse } from 'next/server';

const KOMERCE_BASE_URL = 'https://rajaongkir.komerce.id/api/v1';
// Hardcode API key (untuk production, lebih baik pakai environment variable)
const RAJAONGKIR_KEY = process.env.RAJAONGKIR_KEY || 'mT8nGMeZ4cacc72ba9d93fd4g2xH48Gb';

export async function GET(request) {
  try {
    if (!RAJAONGKIR_KEY) {
      console.error('[KOMERCE_DESTINATION] RAJAONGKIR_KEY tidak ditemukan di environment');
      console.error('[KOMERCE_DESTINATION] Pastikan RAJAONGKIR_KEY sudah di-set di Vercel Environment Variables');
      return NextResponse.json(
        { 
          success: false, 
          message: 'API key tidak dikonfigurasi. Silakan hubungi admin untuk mengkonfigurasi RAJAONGKIR_KEY di Vercel.' 
        },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || searchParams.get('search') || '';
    const limit = searchParams.get('limit') || '10';
    const offset = searchParams.get('offset') || '0';

    // Tidak ada validasi minimal karakter - biarkan user ketik bebas
    // Jika search kosong, API Komerce akan return semua data atau error sendiri
    if (!search) {
      return NextResponse.json(
        {
          success: true,
          data: [],
          message: 'Masukkan kata kunci untuk mencari kota tujuan',
        },
        { status: 200 }
      );
    }

    // Build URL sesuai dokumentasi: /api/v1/destination/domestic-destination?search=jakarta&limit=5&offset=0
    const url = `${KOMERCE_BASE_URL}/destination/domestic-destination?search=${encodeURIComponent(search)}&limit=${limit}&offset=${offset}`;

    console.log('[KOMERCE_DESTINATION] Requesting:', url);
    console.log('[KOMERCE_DESTINATION] API Key:', RAJAONGKIR_KEY ? 'Set' : 'Not Set');

    let response;
    try {
      // Create AbortController untuk timeout (lebih kompatibel)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 detik timeout
      
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'key': RAJAONGKIR_KEY, // Dokumentasi menggunakan 'key' bukan 'api-key'
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
    } catch (fetchError) {
      console.error('[KOMERCE_DESTINATION] Fetch error:', fetchError);
      return NextResponse.json(
        {
          success: false,
          message: 'Gagal terhubung ke API Komerce. Periksa koneksi atau API mungkin sedang down.',
          error: 'CONNECTION_FAILED',
          details: fetchError.message,
        },
        { status: 503 }
      );
    }

    const responseText = await response.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch (err) {
      console.error('[KOMERCE_DESTINATION] Non-JSON response:', responseText.substring(0, 500));
      return NextResponse.json(
        { success: false, message: 'Response dari Komerce bukan JSON' },
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error('[KOMERCE_DESTINATION] Error response:', data);
      return NextResponse.json(
        {
          success: false,
          message: data?.message || data?.error || 'Gagal mengambil data destinasi',
          error: data,
        },
        { status: response.status }
      );
    }

    // Parse response dari Komerce API
    // Response format: { data: [...], meta: {...} } atau langsung array
    let destinations = [];
    if (data?.data && Array.isArray(data.data)) {
      destinations = data.data;
    } else if (Array.isArray(data)) {
      destinations = data;
    } else if (data?.results && Array.isArray(data.results)) {
      destinations = data.results;
    }

    // Filter untuk hanya mengambil CITY data (untuk RajaOngkir V1 Basic)
    // V1 Basic hanya menerima CITY_ID, bukan subdistrict_id
    // Map response untuk memastikan kita menggunakan city_id
    const cityDestinations = destinations
      .filter(dest => {
        // Hanya ambil data yang punya city_id (bukan subdistrict)
        // Jika ada city_id, itu adalah city data
        // Jika hanya ada subdistrict_id tanpa city_id, skip (itu subdistrict data)
        return dest.city_id || dest.id; // Ambil yang punya city_id atau id (asumsi id adalah city_id)
      })
      .map(dest => {
        // Normalize response untuk memastikan city_id tersedia
        return {
          city_id: dest.city_id || dest.id, // Gunakan city_id atau id sebagai fallback
          city_name: dest.city_name || dest.name || dest.label || '',
          province_id: dest.province_id || '',
          province_name: dest.province_name || '',
          type: dest.type || '',
          postal_code: dest.postal_code || '',
          // Untuk display
          label: dest.label || `${dest.city_name || dest.name || ''}, ${dest.province_name || ''}`.trim(),
          // Keep original data untuk reference
          ...dest
        };
      })
      // Remove duplicates berdasarkan city_id
      .filter((dest, index, self) => 
        index === self.findIndex(d => d.city_id === dest.city_id)
      );

    console.log('[KOMERCE_DESTINATION] Filtered cities:', cityDestinations.length, 'from', destinations.length, 'total results');

    // Return response dari Komerce (hanya city data)
    return NextResponse.json({
      success: true,
      data: cityDestinations,
    });
  } catch (error) {
    console.error('[KOMERCE_DESTINATION] Error:', error);
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


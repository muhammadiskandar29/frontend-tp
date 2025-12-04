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

    if (!search) {
      return NextResponse.json(
        {
          success: false,
          message: 'Parameter search (atau q) wajib diisi. Contoh: /api/komerce/destination?search=jakarta',
        },
        { status: 400 }
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

    // Parse response dari Komerce API V2
    // Response format: { data: [...], meta: {...} } atau langsung array
    let destinations = [];
    if (data?.data && Array.isArray(data.data)) {
      destinations = data.data;
    } else if (Array.isArray(data)) {
      destinations = data;
    } else if (data?.results && Array.isArray(data.results)) {
      destinations = data.results;
    }

    // Response sudah difilter oleh API, tidak perlu filter lagi

    // Return response dari Komerce
    return NextResponse.json({
      success: true,
      data: destinations,
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


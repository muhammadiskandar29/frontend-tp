import { NextResponse } from 'next/server';

const KOMERCE_BASE_URL = 'https://rajaongkir.komerce.id/api/v1';
// Hardcode API key (untuk production, lebih baik pakai environment variable)
const RAJAONGKIR_KEY = process.env.RAJAONGKIR_KEY || 'mT8nGMeZ4cacc72ba9d93fd4g2xH48Gb';

export async function POST(request) {
  try {
    if (!RAJAONGKIR_KEY) {
      console.error('[KOMERCE_COST] RAJAONGKIR_KEY tidak ditemukan di environment');
      console.error('[KOMERCE_COST] Pastikan RAJAONGKIR_KEY sudah di-set di Vercel Environment Variables');
      return NextResponse.json(
        { 
          success: false, 
          message: 'API key tidak dikonfigurasi. Silakan hubungi admin untuk mengkonfigurasi RAJAONGKIR_KEY di Vercel.' 
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { origin, destination, weight, courier } = body;

    // Validasi input
    if (!origin || !destination || !weight || !courier) {
      return NextResponse.json(
        {
          success: false,
          message: 'origin, destination, weight, dan courier wajib diisi',
        },
        { status: 400 }
      );
    }

    // Validasi destination harus angka
    if (isNaN(parseInt(destination, 10))) {
      return NextResponse.json(
        {
          success: false,
          message: 'destination harus berupa ID (angka)',
        },
        { status: 400 }
      );
    }

    // Validasi weight
    const weightNum = parseInt(weight, 10);
    if (isNaN(weightNum) || weightNum < 1 || weightNum > 50000) {
      return NextResponse.json(
        {
          success: false,
          message: 'weight harus antara 1 dan 50000 gram',
        },
        { status: 400 }
      );
    }

    const payload = {
      origin: String(origin),
      destination: String(destination),
      weight: weightNum,
      courier: String(courier).toLowerCase(), // jne, tiki, pos, dll
    };

    console.log('[KOMERCE_COST] Requesting cost:', JSON.stringify(payload, null, 2));
    console.log('[KOMERCE_COST] API Key:', RAJAONGKIR_KEY ? 'Set' : 'Not Set');
    console.log('[KOMERCE_COST] URL:', `${KOMERCE_BASE_URL}/cost/domestic-cost`);

    let response;
    try {
      // Create AbortController untuk timeout (lebih kompatibel)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 detik timeout
      
      // Endpoint: /api/v1/cost/domestic-cost
      response = await fetch(`${KOMERCE_BASE_URL}/cost/domestic-cost`, {
        method: 'POST',
        headers: {
          'key': RAJAONGKIR_KEY, // Dokumentasi menggunakan 'key' bukan 'api-key'
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Log response untuk debugging
      console.log('[KOMERCE_COST] Response status:', response.status);
      console.log('[KOMERCE_COST] Response ok:', response.ok);
    } catch (fetchError) {
      console.error('[KOMERCE_COST] Fetch error:', fetchError);
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
    console.log('[KOMERCE_COST] Raw response (first 1000 chars):', responseText.substring(0, 1000));
    console.log('[KOMERCE_COST] Response length:', responseText.length);
    console.log('[KOMERCE_COST] Response status:', response.status);
    
    let data;

    try {
      data = JSON.parse(responseText);
      console.log('[KOMERCE_COST] Parsed JSON successfully');
    } catch (err) {
      console.error('[KOMERCE_COST] JSON parse error:', err.message);
      console.error('[KOMERCE_COST] Full response:', responseText);
      console.error('[KOMERCE_COST] Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Coba parse sebagai HTML atau text error
      if (responseText.includes('<html>') || responseText.includes('<!DOCTYPE')) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'API Komerce mengembalikan HTML (mungkin error page). Periksa URL endpoint dan API key.',
            error: 'HTML_RESPONSE',
            details: responseText.substring(0, 200)
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Response dari Komerce bukan JSON',
          error: 'INVALID_JSON',
          details: responseText.substring(0, 500),
          statusCode: response.status
        },
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error('[KOMERCE_COST] Error response:', data);
      
      // Handle rate limit
      if (response.status === 429 || data?.message?.toLowerCase().includes('rate limit')) {
        return NextResponse.json(
          {
            success: false,
            message: 'Terlalu banyak request. Silakan coba lagi dalam beberapa saat.',
            error: 'RATE_LIMIT',
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: data?.message || data?.error || 'Gagal menghitung ongkir',
          error: data,
        },
        { status: response.status }
      );
    }

    // Return response dari Komerce
    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('[KOMERCE_COST] Error:', error);
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


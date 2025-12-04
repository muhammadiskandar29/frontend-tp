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
    let costUrl = ''; // Declare di scope yang lebih luas untuk error handling
    try {
      // Create AbortController untuk timeout (lebih kompatibel)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 detik timeout
      
      // Endpoint: Coba beberapa format yang mungkin
      // Format 1: /api/v1/cost/domestic-cost
      // Format 2: /api/v1/domestic-cost (tanpa /cost)
      costUrl = `${KOMERCE_BASE_URL}/cost/domestic-cost`;
      console.log('[KOMERCE_COST] Trying URL 1:', costUrl);
      console.log('[KOMERCE_COST] Payload:', JSON.stringify(payload, null, 2));
      
      response = await fetch(costUrl, {
        method: 'POST',
        headers: {
          'key': RAJAONGKIR_KEY, // Dokumentasi menggunakan 'key' bukan 'api-key'
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      
      // Jika 404, coba format alternatif
      if (response.status === 404) {
        console.log('[KOMERCE_COST] 404 error, trying alternative endpoint...');
        clearTimeout(timeoutId); // Clear timeout sebelum retry
        
        // Buat controller baru untuk retry
        const retryController = new AbortController();
        const retryTimeoutId = setTimeout(() => retryController.abort(), 30000);
        
        costUrl = `${KOMERCE_BASE_URL}/domestic-cost`;
        console.log('[KOMERCE_COST] Trying URL 2:', costUrl);
        
        response = await fetch(costUrl, {
          method: 'POST',
          headers: {
            'key': RAJAONGKIR_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: retryController.signal,
        });
        
        clearTimeout(retryTimeoutId);
      } else {
        clearTimeout(timeoutId);
      }
      
      // Log response untuk debugging
      console.log('[KOMERCE_COST] Final response status:', response.status);
      console.log('[KOMERCE_COST] Final response ok:', response.ok);
      console.log('[KOMERCE_COST] Final URL used:', costUrl);
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
      console.error('[KOMERCE_COST] Response status:', response.status);
      
      // Handle 404 - endpoint tidak ditemukan
      if (response.status === 404) {
        return NextResponse.json(
          {
            success: false,
            message: 'Endpoint cost tidak ditemukan. Periksa dokumentasi API Komerce untuk endpoint yang benar.',
            error: 'ENDPOINT_NOT_FOUND',
            details: `URL yang dicoba: ${costUrl || 'unknown'}`,
          },
          { status: 404 }
        );
      }
      
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
    console.error('[KOMERCE_COST] Unexpected error:', error);
    console.error('[KOMERCE_COST] Error name:', error.name);
    console.error('[KOMERCE_COST] Error message:', error.message);
    console.error('[KOMERCE_COST] Error stack:', error.stack);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan saat menghitung ongkir',
        error: error.message || 'Unknown error',
        errorName: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}


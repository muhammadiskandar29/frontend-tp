import { NextResponse } from 'next/server';

const KOMERCE_BASE_URL = 'https://rajaongkir.komerce.id';
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

    let response;
    try {
      // Create AbortController untuk timeout (lebih kompatibel)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 detik timeout
      
      response = await fetch(`${KOMERCE_BASE_URL}/domestic-cost`, {
        method: 'POST',
        headers: {
          'api-key': RAJAONGKIR_KEY,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; Next.js)',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
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
    let data;

    try {
      data = JSON.parse(responseText);
    } catch (err) {
      console.error('[KOMERCE_COST] Non-JSON response:', responseText.substring(0, 500));
      return NextResponse.json(
        { success: false, message: 'Response dari Komerce bukan JSON' },
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


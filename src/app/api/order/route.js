import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 
  process.env.NEXT_PUBLIC_BACKEND_URL || 
  'http://3.105.234.181:8000';

export async function POST(request) {
  try {
    const body = await request.json();

    // Validasi field wajib sesuai requirement backend
    const requiredFields = ['nama', 'wa', 'email', 'produk', 'harga', 'total_harga', 'metode_bayar', 'sumber'];
    const missingFields = requiredFields.filter(field => !body[field] && body[field] !== 0);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Field wajib tidak lengkap: ${missingFields.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Siapkan payload sesuai format backend
    const payload = {
      nama: String(body.nama),
      wa: String(body.wa),
      email: String(body.email),
      alamat: body.alamat ? String(body.alamat) : '',
      produk: parseInt(body.produk, 10),
      harga: String(body.harga),
      ongkir: String(body.ongkir || '0'),
      total_harga: String(body.total_harga),
      metode_bayar: String(body.metode_bayar),
      sumber: String(body.sumber),
      custom_value: Array.isArray(body.custom_value) ? body.custom_value : [],
    };

    console.log('📤 [ORDER] Payload:', JSON.stringify(payload, null, 2));

    // Validasi produk harus integer
    if (isNaN(payload.produk)) {
      return NextResponse.json(
        { success: false, message: 'produk harus berupa ID yang valid (integer)' },
        { status: 400 }
      );
    }

    // Proxy ke backend
    const response = await fetch(`${BACKEND_URL}/api/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('📥 [ORDER] Backend status:', response.status);

    // Parse response
    const responseText = await response.text();
    let data;
    
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error('❌ [ORDER] Non-JSON response:', responseText.substring(0, 500));
      return NextResponse.json(
        { success: false, message: 'Backend error: Response bukan JSON' },
        { status: 500 }
      );
    }

    console.log('📥 [ORDER] Backend response:', JSON.stringify(data, null, 2));

    // Handle error dari backend
    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || 'Gagal membuat order',
          error: data?.error || data,
        },
        { status: response.status }
      );
    }

    // Success - return response langsung dari backend
    // Expected format: { success: true, message: "...", data: { order: {...}, whatsapp_response: {...} } }
    return NextResponse.json({
      success: true,
      message: data?.message || 'Order berhasil dibuat',
      data: data?.data || data,
    });

  } catch (error) {
    console.error('❌ [ORDER] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Gagal terhubung ke server. Coba lagi nanti.',
        error: error.message 
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
    },
  });
}

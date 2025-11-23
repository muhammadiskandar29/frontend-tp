import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 
  process.env.NEXT_PUBLIC_BACKEND_URL || 
  'https://onedashboardapi-production.up.railway.app';

export async function POST(request) {
  try {
    const body = await request.json();

    // Validasi field wajib sesuai requirement backend
    const requiredFields = ['nama', 'wa', 'email', 'produk', 'harga', 'ongkir', 'total_harga', 'metode_bayar', 'sumber'];
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
      harga: parseInt(body.harga, 10),
      ongkir: String(body.ongkir || '0'),
      total_harga: parseInt(body.total_harga, 10),
      metode_bayar: String(body.metode_bayar),
      sumber: String(body.sumber),
      custom_value: Array.isArray(body.custom_value) ? body.custom_value : (body.custom_value ? [body.custom_value] : []),
    };

    // Validasi produk harus integer
    if (isNaN(payload.produk)) {
      return NextResponse.json(
        {
          success: false,
          message: 'produk harus berupa ID yang valid (integer)',
        },
        { status: 400 }
      );
    }

    // Validasi harga dan total_harga harus integer
    if (isNaN(payload.harga) || isNaN(payload.total_harga)) {
      return NextResponse.json(
        {
          success: false,
          message: 'harga dan total_harga harus berupa angka valid',
        },
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

    const data = await response.json();

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

    // Return response dari backend
    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error('❌ Order API Proxy Error:', error);
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

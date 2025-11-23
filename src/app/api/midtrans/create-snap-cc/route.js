import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 
  process.env.NEXT_PUBLIC_BACKEND_URL || 
  'https://onedashboardapi-production.up.railway.app';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, amount, product_name } = body;

    if (!name || !email || !amount) {
      return NextResponse.json(
        { success: false, message: 'name, email, dan amount wajib diisi' },
        { status: 400 }
      );
    }

    // Proxy ke backend
    const response = await fetch(`${BACKEND_URL}/api/midtrans/create-snap-cc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        amount: parseInt(amount, 10),
        product_name: product_name || 'Product',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Midtrans CC Backend Error:', data);
      return NextResponse.json(
        {
          success: false,
          message: data?.message || 'Gagal membuat transaksi Midtrans',
          error: data,
        },
        { status: response.status }
      );
    }

    // Return response dari backend (sudah dalam format yang benar)
    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error('❌ Midtrans CC API Proxy Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Gagal terhubung ke server',
        error: error.message,
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

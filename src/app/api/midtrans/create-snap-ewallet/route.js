import { NextResponse } from 'next/server';

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
const MIDTRANS_IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === 'true';
const MIDTRANS_BASE_URL = MIDTRANS_IS_PRODUCTION
  ? 'https://app.midtrans.com'
  : 'https://app.sandbox.midtrans.com';

export async function POST(request) {
  try {
    if (!MIDTRANS_SERVER_KEY) {
      return NextResponse.json(
        { success: false, message: 'MIDTRANS_SERVER_KEY tidak dikonfigurasi' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const name = formData.get('name');
    const email = formData.get('email');
    const amount = formData.get('amount');
    const product_name = formData.get('product_name');

    if (!name || !email || !amount) {
      return NextResponse.json(
        { success: false, message: 'name, email, dan amount wajib diisi' },
        { status: 400 }
      );
    }

    // Generate order ID
    const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Prepare Midtrans Snap request
    const snapRequest = {
      transaction_details: {
        order_id: orderId,
        gross_amount: parseInt(amount, 10),
      },
      customer_details: {
        first_name: name,
        email: email,
      },
      item_details: [
        {
          id: 'ITEM-1',
          price: parseInt(amount, 10),
          quantity: 1,
          name: product_name || 'Product',
        },
      ],
      enabled_payments: ['gopay', 'shopeepay', 'dana', 'ovo', 'linkaja'],
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/success`,
        error: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/error`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/pending`,
      },
    };

    // Call Midtrans Snap API
    const response = await fetch(`${MIDTRANS_BASE_URL}/snap/v1/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Basic ${Buffer.from(MIDTRANS_SERVER_KEY + ':').toString('base64')}`,
      },
      body: JSON.stringify(snapRequest),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Midtrans E-Wallet Error:', data);
      return NextResponse.json(
        {
          success: false,
          message: data.error_messages?.[0] || 'Gagal membuat transaksi Midtrans',
          error: data,
        },
        { status: response.status }
      );
    }

    if (data.token) {
      // Return redirect URL
      return NextResponse.json({
        redirect_url: `${MIDTRANS_BASE_URL}/snap/v2/vtweb/${data.token}`,
        token: data.token,
      });
    }

    return NextResponse.json(
      { success: false, message: 'Token tidak ditemukan dari Midtrans' },
      { status: 500 }
    );
  } catch (error) {
    console.error('❌ Midtrans E-Wallet API Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Gagal terhubung ke Midtrans',
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


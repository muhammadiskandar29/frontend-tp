import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    const body = await request.json();

    // Validasi field wajib
    const requiredFields = ['nama', 'email', 'wa', 'produk', 'harga', 'total_harga', 'metode_bayar'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Field wajib tidak lengkap: ${missingFields.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validasi tipe data
    if (typeof body.harga !== 'number' && typeof body.harga !== 'string') {
      return NextResponse.json(
        {
          success: false,
          message: 'harga harus berupa number atau string yang bisa dikonversi ke number',
        },
        { status: 400 }
      );
    }

    if (typeof body.total_harga !== 'number' && typeof body.total_harga !== 'string') {
      return NextResponse.json(
        {
          success: false,
          message: 'total_harga harus berupa number atau string yang bisa dikonversi ke number',
        },
        { status: 400 }
      );
    }

    // Konversi harga dan total_harga ke integer
    const harga = parseInt(body.harga, 10);
    const total_harga = parseInt(body.total_harga, 10);

    if (isNaN(harga) || isNaN(total_harga)) {
      return NextResponse.json(
        {
          success: false,
          message: 'harga dan total_harga harus berupa angka valid',
        },
        { status: 400 }
      );
    }

    // Pastikan ongkir adalah string
    const ongkir = body.ongkir ? String(body.ongkir) : "0";

    // Siapkan data untuk disimpan
    const orderData = {
      nama: String(body.nama),
      email: String(body.email),
      wa: String(body.wa),
      alamat: body.alamat ? String(body.alamat) : null,
      produkId: parseInt(body.produk, 10),
      harga: harga,
      ongkir: ongkir,
      total_harga: total_harga,
      metode_bayar: String(body.metode_bayar),
      custom_value: body.custom_value ? body.custom_value : null,
      sumber: body.sumber ? String(body.sumber) : null,
    };

    // Validasi produkId
    if (isNaN(orderData.produkId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'produk harus berupa ID yang valid',
        },
        { status: 400 }
      );
    }

    // Simpan ke database
    const order = await prisma.order.create({
      data: orderData,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Order berhasil dibuat',
        data: {
          order: {
            id: order.id,
            ...orderData,
            createdAt: order.createdAt,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Order creation error:', error);

    // Handle Prisma errors
    if (error.code === 'P2002') {
      // Unique constraint violation
      return NextResponse.json(
        {
          success: false,
          message: 'Email sudah terdaftar',
        },
        { status: 400 }
      );
    }

    if (error.code === 'P2003') {
      // Foreign key constraint violation
      return NextResponse.json(
        {
          success: false,
          message: 'Produk tidak ditemukan',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Gagal membuat order',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
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

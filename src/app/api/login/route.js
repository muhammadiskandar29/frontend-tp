import { NextResponse } from 'next/server';
import { getBackendUrl } from '@/config/api';

/**
 * Login API Proxy Route
 * Proxy untuk menghindari CORS issues
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const backendUrl = getBackendUrl('/login');
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error('API Proxy Error:', error);
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
  });
}


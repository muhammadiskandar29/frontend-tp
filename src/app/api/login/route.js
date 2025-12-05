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
    
    console.log('[LOGIN_PROXY] Backend URL:', backendUrl);
    console.log('[LOGIN_PROXY] Request body:', { email: body.email, password: '***' });
    
    // Add timeout and better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

    let response;
    try {
      response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Request timeout. Server tidak merespons.',
            error: 'Timeout'
          },
          { status: 504 }
        );
      }
      if (fetchError.message?.includes('fetch')) {
        return NextResponse.json(
          { 
            success: false, 
            message: `Tidak dapat terhubung ke server backend. Pastikan backend berjalan di ${backendUrl}`,
            error: fetchError.message
          },
          { status: 503 }
        );
      }
      throw fetchError;
    }

    const responseText = await response.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[LOGIN_PROXY] Non-JSON response:', responseText);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Backend error: Response bukan JSON',
          error: responseText.substring(0, 200)
        },
        { status: response.status || 500 }
      );
    }

    console.log('[LOGIN_PROXY] Response status:', response.status);
    console.log('[LOGIN_PROXY] Response data:', data);

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error('[LOGIN_PROXY] Error:', error);
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


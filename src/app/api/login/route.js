import { NextResponse } from 'next/server';
import { getBackendUrl } from '@/config/api';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
};

/**
 * Login API Proxy Route
 * Proxy untuk menghindari CORS issues
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const backendUrl = getBackendUrl('/login');
    
    console.log('[LOGIN_PROXY] Attempting to connect to:', backendUrl);
    console.log('[LOGIN_PROXY] Request body:', { email: body.email, password: '***' });
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout
    
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
      
      // Handle timeout
      if (fetchError.name === 'AbortError') {
        console.error('[LOGIN_PROXY] Request timeout after 10 seconds');
        return NextResponse.json(
          { 
            success: false, 
            message: 'Request timeout. Server tidak merespons dalam 10 detik. Coba lagi nanti.',
            error: 'TimeoutError'
          },
          { status: 504, headers: corsHeaders }
        );
      }
      
      console.error('[LOGIN_PROXY] Fetch error:', fetchError);
      
      // Handle network errors
      if (fetchError.message?.includes('fetch') || fetchError.name === 'TypeError') {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Tidak dapat terhubung ke server backend. Pastikan backend berjalan di http://3.105.234.181:8000 dan dapat diakses.',
            error: 'NetworkError'
          },
          { status: 503, headers: corsHeaders }
        );
      }
      
      throw fetchError;
    }

    // Check if response is ok
    if (!response.ok) {
      let errorData;
      try {
        const text = await response.text();
        errorData = text ? JSON.parse(text) : { message: `HTTP ${response.status}` };
      } catch {
        errorData = { message: `HTTP ${response.status} ${response.statusText}` };
      }
      
      return NextResponse.json(
        { 
          success: false, 
          message: errorData?.message || 'Login gagal',
          error: errorData
        },
        { status: response.status, headers: corsHeaders }
      );
    }

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('[LOGIN_PROXY] Failed to parse response as JSON:', parseError);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Server mengembalikan response yang tidak valid.',
          error: 'InvalidResponse'
        },
        { status: 500, headers: corsHeaders }
      );
    }

    // Log response for debugging (without sensitive data)
    console.log('[LOGIN_PROXY] Response received:', { 
      success: data?.success, 
      hasToken: !!data?.token,
      hasUser: !!data?.user 
    });

    return NextResponse.json(data, {
      status: response.status,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('[LOGIN_PROXY] Unexpected error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Gagal terhubung ke server. Coba lagi nanti.',
        error: error.message 
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}


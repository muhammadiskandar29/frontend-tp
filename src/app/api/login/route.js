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
    
    let response;
    try {
      response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
      });
    } catch (fetchError) {
      console.error('[LOGIN_PROXY] Fetch error:', fetchError);
      
      // Handle network errors
      if (fetchError.message?.includes('fetch') || fetchError.name === 'TypeError') {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Tidak dapat terhubung ke server backend. Pastikan backend berjalan dan dapat diakses.',
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

    const data = await response.json();

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


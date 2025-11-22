import { NextResponse } from 'next/server';

const BACKEND_URL = 'https://onedashboardapi-production.up.railway.app/api/order';

export async function POST(request) {
  try {
    const body = await request.json();
    
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // Handle validation errors (like duplicate email) properly
    // Backend might return 500 for validation errors, but we should check the message
    if (!response.ok) {
      // If the error message indicates a validation error (like duplicate email),
      // return it as a 400 Bad Request instead of 500
      if (data?.message && (
        data.message.includes('email has already been taken') ||
        data.message.includes('email') && data.message.includes('already')
      )) {
        return NextResponse.json(
          {
            success: false,
            message: data.message || 'The email has already been taken.',
            error: data.error || data.message,
          },
          { status: 400 }
        );
      }

      // For other errors, return the original status
      return NextResponse.json(
        {
          success: false,
          message: data?.message || 'An error occurred while creating the order.',
          error: data?.error || data?.message,
        },
        { status: response.status }
      );
    }

    // Success response
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
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
    },
  });
}


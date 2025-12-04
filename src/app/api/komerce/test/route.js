import { NextResponse } from 'next/server';

const KOMERCE_BASE_URL = 'https://rajaongkir.komerce.id';
const RAJAONGKIR_KEY = process.env.RAJAONGKIR_KEY || 'mT8nGMeZ4cacc72ba9d93fd4g2xH48Gb';

/**
 * Test endpoint untuk cek koneksi ke API Komerce
 * GET /api/komerce/test
 */
export async function GET(request) {
  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
  };

  // Test 1: DNS Resolution
  try {
    const dnsTest = await fetch('https://rajaongkir.komerce.id', {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    });
    results.tests.push({
      name: 'DNS Resolution',
      success: true,
      status: dnsTest.status,
    });
  } catch (error) {
    results.tests.push({
      name: 'DNS Resolution',
      success: false,
      error: error.message,
    });
  }

  // Test 2: API Endpoint dengan API Key
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const apiTest = await fetch(`${KOMERCE_BASE_URL}/domestic-destination`, {
      method: 'GET',
      headers: {
        'api-key': RAJAONGKIR_KEY,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    const responseText = await apiTest.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { raw: responseText.substring(0, 200) };
    }

    results.tests.push({
      name: 'API Endpoint Test',
      success: apiTest.ok,
      status: apiTest.status,
      statusText: apiTest.statusText,
      response: data,
    });
  } catch (error) {
    results.tests.push({
      name: 'API Endpoint Test',
      success: false,
      error: error.message,
      errorName: error.name,
    });
  }

  // Test 3: Simple fetch tanpa header
  try {
    const simpleTest = await fetch('https://httpbin.org/get', {
      signal: AbortSignal.timeout(5000),
    });
    results.tests.push({
      name: 'External Fetch Test (httpbin)',
      success: simpleTest.ok,
      status: simpleTest.status,
    });
  } catch (error) {
    results.tests.push({
      name: 'External Fetch Test (httpbin)',
      success: false,
      error: error.message,
    });
  }

  const allSuccess = results.tests.every(t => t.success);
  
  return NextResponse.json({
    success: allSuccess,
    message: allSuccess 
      ? 'Semua test berhasil' 
      : 'Beberapa test gagal. Cek detail di results.tests',
    results,
  }, {
    status: allSuccess ? 200 : 500,
  });
}


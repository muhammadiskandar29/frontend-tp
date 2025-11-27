'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AdminLoginRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Ambil semua query params dan forward ke /login
    const params = searchParams.toString();
    const redirectUrl = params ? `/login?${params}` : '/login';
    
    router.replace(redirectUrl);
  }, [router, searchParams]);

  return null; // Tidak render apa-apa, langsung redirect
}


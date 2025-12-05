'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AdminLoginRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Ambil semua query params dan forward ke /login
    // Ini memastikan query seperti ?unauthorized=true tetap di-forward
    const params = searchParams.toString();
    const redirectUrl = params ? `/login?${params}` : '/login';
    
    // Use replace untuk menghindari history stack
    router.replace(redirectUrl);
  }, [router, searchParams]);

  // Return loading state instead of null for better UX
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      fontSize: '14px',
      color: '#666'
    }}>
      Redirecting to login...
    </div>
  );
}


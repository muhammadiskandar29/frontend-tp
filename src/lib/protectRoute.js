'use client';

import { useEffect, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { isTokenExpired } from "@/lib/checkToken";

export function useProtectedRoute() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const loginTime = localStorage.getItem("login_time");

      if (!token || !loginTime || isTokenExpired()) {
        toast.error("🚫 Akses ditolak, kamu belum login!");
        localStorage.clear();

        setTimeout(() => {
          router.replace("/admin/login");
        }, 1000);
      } else {
        // Use startTransition to defer state update (React 19 best practice)
        startTransition(() => {
          setAllowed(true);
        });
      }
    } catch (err) {
      console.warn("Auth check error:", err);
      toast.error("Terjadi kesalahan saat memeriksa sesi login.");
      router.replace("/admin/login");
    }
  }, [router]);

  return allowed; // ✅ false = belum boleh render, true = sudah login
}

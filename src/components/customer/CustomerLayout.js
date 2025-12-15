"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCustomerSession } from "@/lib/customerAuth";
import "@/styles/customer/cstdashboard.css";

const navLinks = [
  { label: "Dashboard", href: "/customer/dashboard" },
  { label: "Profile", href: "/customer/profile" },
  { label: "Orders", href: "/customer/orders" },
];

export default function CustomerLayout({ children }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [customerInfo, setCustomerInfo] = useState(null);

  useEffect(() => {
    console.log("🔵 [CUSTOMER_LAYOUT] Checking authentication...");
    const session = getCustomerSession();
    
    console.log("🔵 [CUSTOMER_LAYOUT] Session:", {
      isAuthenticated: session.isAuthenticated,
      hasToken: !!session.token,
      user: session.user
    });
    
    // Set customer info untuk ditampilkan di navbar
    if (session.user) {
      const customerName = session.user.nama_panggilan || session.user.nama || "User";
      setCustomerInfo({
        name: customerName,
        initials: customerName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      });
    }
    
    // Tampilkan debug log dari localStorage jika ada
    const debugLog = localStorage.getItem("customer_login_debug");
    if (debugLog) {
      try {
        const debug = JSON.parse(debugLog);
        console.log("🔍 [CUSTOMER_LAYOUT DEBUG] Previous login attempt:", debug);
      } catch (e) {
        console.error("Failed to parse debug log:", e);
      }
    }
    
    // Cek apakah ada user data (untuk kasus needsVerification - tidak ada token tapi ada user)
    const hasUserData = !!session.user;
    const hasToken = !!session.token;
    
    // Allow access jika:
    // 1. Ada token (normal login)
    // 2. Ada user data meskipun tidak ada token (untuk kasus needsVerification)
    if (!hasToken && !hasUserData) {
      console.error("❌ [CUSTOMER_LAYOUT] No token and no user data, redirecting to login...");
      console.error("❌ [CUSTOMER_LAYOUT] Token from localStorage:", localStorage.getItem("customer_token"));
      console.error("❌ [CUSTOMER_LAYOUT] User from localStorage:", localStorage.getItem("customer_user"));
      
      // Simpan info ke localStorage untuk debugging
      const debugInfo = {
        timestamp: new Date().toISOString(),
        reason: "Not authenticated - no token and no user",
        session: {
          isAuthenticated: session.isAuthenticated,
          hasToken: hasToken,
          hasUser: hasUserData,
          tokenValue: session.token ? "exists" : "missing"
        },
        localStorageToken: localStorage.getItem("customer_token"),
        localStorageUser: localStorage.getItem("customer_user")
      };
      localStorage.setItem("customer_layout_debug", JSON.stringify(debugInfo));
      
      // Alert untuk debugging
      console.warn("⚠️ [CUSTOMER_LAYOUT DEBUG] Check localStorage.getItem('customer_layout_debug') for details");
      console.warn("⚠️ [CUSTOMER_LAYOUT DEBUG] Full debug info:", debugInfo);
      
      // Delay sedikit sebelum redirect agar console log bisa dilihat
      setTimeout(() => {
        router.replace("/customer");
      }, 2000); // Delay lebih lama untuk debugging
      return;
    }

    // Jika ada user data meskipun tidak ada token, ini kasus needsVerification
    if (hasUserData && !hasToken) {
      console.warn("⚠️ [CUSTOMER_LAYOUT] Has user data but no token - needsVerification case");
      console.warn("⚠️ [CUSTOMER_LAYOUT] Allowing access for verification");
    }

    console.log("✅ [CUSTOMER_LAYOUT] Authenticated, setting authorized to true");
    setIsAuthorized(true);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("customer_token");
    localStorage.removeItem("customer_user");
    router.replace("/customer");
  };

  if (!isAuthorized) {
    return null; // Don't render until auth check is complete
  }

  return (
    <div className="dashboard-layout">
      <header className="customer-navbar">
        <div className="customer-navbar__brand">
          <img src="/assets/logo.png" alt="Ternak Properti" />
        </div>

        <div className="customer-navbar__right">
          <div className="customer-navbar__profile">
            <div className="customer-navbar__avatar">{customerInfo?.initials || "U"}</div>
            <span className="customer-navbar__name">{customerInfo?.name || "User"}</span>
          </div>
        </div>
      </header>

      <main className="dashboard-content">{children}</main>
    </div>
  );
}


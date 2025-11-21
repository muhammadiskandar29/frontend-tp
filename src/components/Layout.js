"use client";

import Head from "next/head";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import Sidebar from "@/components/Sidebar";
import "@/styles/layout.css";
import "../app/globals.css";
import "primereact/resources/themes/lara-light-amber/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";


function isTokenExpired() {
  try {
    const loginTime = localStorage.getItem("login_time");
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000;
    return !loginTime || now - parseInt(loginTime) > maxAge;
  } catch {
    return true;
  }
}

export default function Layout({ children, title, description }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (pathname.includes("/login")) {
      setIsAuthorized(true);
      return;
    }

    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData || isTokenExpired()) {
      localStorage.clear();
      toast.error("🚫 Anda belum login!");
      setIsAuthorized(false);
      // Don't return null immediately, let redirect happen
      setTimeout(() => router.replace("/login"), 1000);
      return;
    }

    try {
      setUser(JSON.parse(userData));
      setIsAuthorized(true);
    } catch {
      setIsAuthorized(false);
    }
  }, [pathname, router]);

  useEffect(() => {
    setDropdownOpen(false);
  }, [pathname]);

  const isLoginPage = pathname.includes("/login");
  const showShell = !isLoginPage;

  const userInitials = useMemo(() => {
    if (!user?.name) return "U";
    return user.name.charAt(0).toUpperCase();
  }, [user]);

  // Show loading state instead of null to prevent blank screen
  if (!isAuthorized && !pathname.includes("/login")) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        minHeight: "100vh" 
      }}>
        <p>Redirecting to login...</p>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch("https://onedashboardapi-production.up.railway.app/api/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      localStorage.clear();
      toast.success("✅ Logout berhasil!");
      router.push("/login");
    }
  };

  return (
    <>
      <Head>
        <title>{title || "One Dashboard"}</title>
        <meta
          name="description"
          content={
            description ||
            "One Dashboard — Manage users, products, and reports easily."
          }
        />
      </Head>

      <div className={`layout-wrapper ${showShell ? "layout-wrapper--private" : ""}`}>
        {showShell && <Sidebar role={user?.role || "admin"} />}

        <main className={`layout-main ${showShell ? "layout-main--with-sidebar" : ""}`}>
          {showShell && (
            <header className="layout-header" role="banner">
              <div className="layout-header__title">
                <h1 className="layout-header__heading">
                  👋 Hi, {user?.name || "User"}
                </h1>
                <p className="layout-header__subtitle">
                  Welcome back to your workspace
                </p>
              </div>

              <div className="layout-header__actions">
                <div className="layout-profile">
                  <button
                    onClick={() => setDropdownOpen((p) => !p)}
                    className="layout-profile__trigger"
                    aria-haspopup="menu"
                    aria-expanded={dropdownOpen}
                  >
                    <div className="layout-avatar">{userInitials}</div>
                    <div className="layout-profile__meta">
                      <span className="layout-profile__name">
                        {user?.name || "User"}
                      </span>
                    </div>
                    <span className={`layout-profile__chevron ${dropdownOpen ? "is-open" : ""}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="layout-profile__menu" role="menu">
                      <button
                        onClick={handleLogout}
                        className="layout-profile__menu-item"
                        role="menuitem"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </header>
          )}

          <section className="layout-content">{children}</section>
        </main>
      </div>
    </>
  );
}

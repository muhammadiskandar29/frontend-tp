"use client";

import Head from "next/head";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import Sidebar from "@/components/Sidebar";
import "@/styles/sales/layout.css";
import "../app/globals.css";
import "primereact/resources/themes/lara-light-amber/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

function formatLongDateId(date) {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return date.toDateString();
  }
}

function derivePageTitle(pathname) {
  if (!pathname) return "Dashboard";
  const cleaned = String(pathname).split("?")[0].split("#")[0];
  const seg = cleaned.split("/").filter(Boolean).pop() || "dashboard";
  return seg
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}


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

export default function Layout({ children, title, description, aboveContent = null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const accountRef = useRef(null);

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

  const isLoginPage = pathname.includes("/login");
  const showShell = !isLoginPage;

  const userInitials = useMemo(() => {
    if (!user?.name) return "U";
    return user.name.charAt(0).toUpperCase();
  }, [user]);

  const pageTitle = useMemo(() => title || derivePageTitle(pathname), [title, pathname]);
  const todayLabel = useMemo(() => formatLongDateId(new Date()), []);

  // Show loading state instead of null to prevent blank screen
  if (!isAuthorized && !pathname.includes("/login")) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        minHeight: "100vh" 
      }}>
        <p>Sebentar ya, sedang disiapkan datanya...</p>
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  useEffect(() => {
    const onDocClick = (e) => {
      if (!accountRef.current) return;
      if (!accountRef.current.contains(e.target)) setIsAccountOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);  

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
        {showShell && (
          <Sidebar
            role={user?.role || "admin"}
          />
        )}

        <main className={`layout-main ${showShell ? "layout-main--with-sidebar" : ""}`}>
          {showShell && (
            <header className="layout-header" role="banner">
              <div className="layout-header__title">
                <h1 className="layout-header__heading">{pageTitle}</h1>
              </div>

              <div className="layout-header__actions">
                <div className="layout-header__right">
                  <div className="layout-header__date">{todayLabel}</div>
                </div>
                <div className="layout-account" ref={accountRef}>
                  <button
                    type="button"
                    className={`layout-account__trigger ${isAccountOpen ? "is-open" : ""}`}
                    onClick={() => setIsAccountOpen((p) => !p)}
                    aria-haspopup="menu"
                    aria-expanded={isAccountOpen}
                  >
                    <span className="layout-account__avatar" aria-hidden="true">
                      {userInitials}
                    </span>
                    <span className="layout-account__name" title={user?.name || "User"}>
                      {user?.name || "User"}
                    </span>
                    <span className="layout-account__chevron" aria-hidden="true" />
                  </button>

                  {isAccountOpen && (
                    <div className="layout-account__menu" role="menu">
                      <button
                        type="button"
                        className="layout-account__menu-item"
                        role="menuitem"
                        onClick={() => setIsAccountOpen(false)}
                      >
                        Profile
                      </button>
                      <button
                        type="button"
                        className="layout-account__menu-item layout-account__menu-item--danger"
                        role="menuitem"
                        onClick={() => {
                          setIsAccountOpen(false);
                          handleLogout();
                        }}
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </header>
          )}

          {showShell && aboveContent}
          <section className="layout-content">{children}</section>
        </main>
      </div>
    </>
  );
}

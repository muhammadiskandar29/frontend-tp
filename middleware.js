// /middleware.js
import { NextResponse } from "next/server";

export function middleware(req) {
  const token = req.cookies.get("token")?.value;
  const userDivisi = req.cookies.get("user_divisi")?.value;
  const userLevel = req.cookies.get("user_level")?.value; // 1 = Head, 2 = Staff
  const { pathname } = req.nextUrl;

  // 1. Halaman Publik / Login
  if (pathname.startsWith("/login") || pathname.startsWith("/admin/login")) {
    if (token) {
      // Jika sudah login, cegah masuk ke login lagi, lempar ke dashboard masing-masing
      // Untuk dashboard redirect, kita biarkan di handle client-side atau redirect default
      return NextResponse.next();
    }
    return NextResponse.next();
  }

  // 2. Proteksi Token Umum (Harus Login untuk semua rute internal)
  const internalPaths = ["/admin", "/sales", "/finance", "/hr"];
  const isInternalPath = internalPaths.some(path => pathname.startsWith(path));

  if (isInternalPath && !token) {
    return NextResponse.redirect(new URL("/login?unauthorized=true", req.url));
  }

  // 3. Hak Akses Per Divisi & Level
  if (token) {
    // --- Proteksi ADMIN ---
    if (pathname.startsWith("/admin")) {
      // Divisi 1 = Admin Super, 2 = Owner
      if (userDivisi !== "1" && userDivisi !== "2" && userDivisi !== "admin") {
        return handleUnauthorizedRedirect(userDivisi, userLevel, req);
      }
    }

    // --- Proteksi SALES ---
    if (pathname.startsWith("/sales")) {
      // Divisi 3 = Sales
      if (userDivisi !== "3" && userDivisi !== "sales") {
        return handleUnauthorizedRedirect(userDivisi, userLevel, req);
      }

      // Cek Level dalam Sales
      const isStaffPath = pathname.startsWith("/sales/staff");
      if (isStaffPath && userLevel !== "2") {
        // Bukan staff tapi coba masuk area staff
        return NextResponse.redirect(new URL("/sales", req.url));
      }

      if (!isStaffPath && pathname !== "/sales" && userLevel === "2") {
        // Staff tapi coba masuk area Head Sales (selain root /sales)
        return NextResponse.redirect(new URL("/sales/staff", req.url));
      }
    }

    // --- Proteksi FINANCE ---
    if (pathname.startsWith("/finance")) {
      // Divisi 4 = Finance
      if (userDivisi !== "4" && userDivisi !== "finance") {
        return handleUnauthorizedRedirect(userDivisi, userLevel, req);
      }
    }

    // --- Proteksi HR ---
    if (pathname.startsWith("/hr")) {
      // Divisi 5 = HR
      if (userDivisi !== "5" && userDivisi !== "hr" && userDivisi !== "human resources") {
        return handleUnauthorizedRedirect(userDivisi, userLevel, req);
      }
    }
  }

  return NextResponse.next();
}

// Fungsi helper untuk mendepak user ke 'rumah' aslinya jika coba masuk divisi lain
function handleUnauthorizedRedirect(divisi, level, req) {
  let target = "/login";

  if (divisi === "1" || divisi === "2" || divisi === "admin") target = "/admin";
  else if (divisi === "3" || divisi === "sales") target = (level === "2") ? "/sales/staff" : "/sales";
  else if (divisi === "4" || divisi === "finance") target = "/finance";
  else if (divisi === "5" || divisi === "hr") target = "/hr/dashboard";

  return NextResponse.redirect(new URL(target, req.url));
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/sales/:path*",
    "/finance/:path*",
    "/hr/:path*",
  ],
};

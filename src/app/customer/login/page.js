"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "@/styles/cstlogin.css";
import { loginCustomer, getCustomerSession } from "@/lib/customerAuth";
import OTPVerificationModal from "@/app/customer/dashboard/otpVerificationModal";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loaded, setLoaded] = useState(false);
  const [current, setCurrent] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [customerData, setCustomerData] = useState(null);

// 🔸 Daftar gambar founder
const founders = [
"/assets/Dimas Dwi Ananto.png",
"/assets/Salvian Kumara.png",
"/assets/Rhesa Yogaswara.png",
"/assets/Stephanus P H A S.png",
"/assets/Theo Ariandyen.png",
"/assets/Erzon Djazai.png",
];

// 🔹 Cek apakah sudah login
useEffect(() => {
  const session = getCustomerSession();
  if (session.isAuthenticated && session.token) {
    router.replace("/customer/dashboard");
  }
  
  // Tampilkan debug log dari localStorage jika ada
  const debugLog = localStorage.getItem("customer_login_debug");
  if (debugLog) {
    try {
      const debug = JSON.parse(debugLog);
      console.log("🔍 [LOGIN DEBUG] Previous login attempt:", debug);
      // Hapus setelah ditampilkan (opsional, bisa di-comment jika ingin tetap tersimpan)
      // localStorage.removeItem("customer_login_debug");
    } catch (e) {
      console.error("Failed to parse debug log:", e);
    }
  }
}, [router]);

// 🔹 Ganti gambar otomatis tiap 2 detik
useEffect(() => {
const interval = setInterval(() => {
setCurrent((prev) => (prev + 1) % founders.length);
}, 2000);
return () => clearInterval(interval);
}, [founders.length]);

// 🔹 Efek fade setiap kali gambar berubah
useEffect(() => {
setLoaded(false);
const t = setTimeout(() => setLoaded(true), 50);
return () => clearTimeout(t);
}, [current]);

const handleChange = (e) => {
setFormData({ ...formData, [e.target.name]: e.target.value });
setErrorMsg(""); // Clear error saat user mengetik
};

const handleSubmit = async (e) => {
e.preventDefault();
if (isSubmitting) return;

setIsSubmitting(true);
setErrorMsg("");

console.log("🔵 [LOGIN] Starting login process...");
console.log("🔵 [LOGIN] Email:", formData.email);

try {
  console.log("🔵 [LOGIN] Calling loginCustomer...");
  const result = await loginCustomer({
    email: formData.email,
    password: formData.password,
  });

  console.log("🟢 [LOGIN] Login result:", result);
  console.log("🟢 [LOGIN] Result success:", result.success);
  console.log("🟢 [LOGIN] Result message:", result.message);
  console.log("🟢 [LOGIN] Result token:", result.token ? "Token exists" : "No token");
  console.log("🟢 [LOGIN] Result user:", result.user);

  if (result.success) {
    console.log("✅ [LOGIN] Login successful! Redirecting to dashboard...");
    console.log("✅ [LOGIN] Result:", result);
    
    // Simpan user data jika ada di result (penting untuk kasus needsVerification)
    if (result.user) {
      // Pastikan verifikasi value disimpan dengan benar
      const userDataToSave = {
        ...result.user,
        verifikasi: result.user.verifikasi, // Simpan nilai asli dari API
      };
      localStorage.setItem("customer_user", JSON.stringify(userDataToSave));
      console.log("✅ [LOGIN] User data saved from result:", userDataToSave);
      console.log("✅ [LOGIN] User verifikasi value saved:", userDataToSave.verifikasi);
      console.log("✅ [LOGIN] User verifikasi type saved:", typeof userDataToSave.verifikasi);
    }
    
    // Simpan token jika ada
    if (result.token) {
      localStorage.setItem("customer_token", result.token);
      console.log("✅ [LOGIN] Token saved from result");
    }
    
    // Simpan email dan password sementara di sessionStorage untuk login ulang nanti (untuk kirim OTP)
    // SessionStorage lebih aman karena akan hilang saat tab ditutup
    if (formData.email && formData.password) {
      sessionStorage.setItem("customer_login_email", formData.email);
      sessionStorage.setItem("customer_login_password", formData.password);
      console.log("✅ [LOGIN] Email and password saved to sessionStorage for later use");
    }
    
    // Check token in localStorage setelah save
    const storedToken = localStorage.getItem("customer_token");
    const storedUser = localStorage.getItem("customer_user");
    console.log("✅ [LOGIN] Stored token after save:", storedToken ? "Token exists" : "No token");
    console.log("✅ [LOGIN] Stored user after save:", storedUser ? "User exists" : "No user");
    
    // Simpan log ke localStorage untuk debugging
    localStorage.setItem("customer_login_debug", JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      token: storedToken ? "exists" : "missing",
      user: storedUser ? "exists" : "missing",
      needsVerification: result.needsVerification || false,
      resultUser: result.user ? "exists" : "missing",
      resultToken: result.token ? "exists" : "missing"
    }));
    
    // Cek apakah user sudah verifikasi
    // Jika sudah verifikasi (verifikasi = 1), langsung ke dashboard
    // Jika belum verifikasi (verifikasi = 0), tampilkan modal OTP
    const verifikasiValue = result.user?.verifikasi;
    const isVerified = verifikasiValue === "1" || verifikasiValue === 1 || verifikasiValue === true;

    console.log("🔍 [LOGIN] Verification check:", {
      verifikasiValue,
      isVerified,
      user: result.user
    });

    if (isVerified) {
      // Sudah verifikasi → langsung ke dashboard
      console.log("✅ [LOGIN] User already verified, redirecting to dashboard");
      setTimeout(() => {
        router.replace("/customer/dashboard");
      }, 300);
    } else {
      // Belum verifikasi → tampilkan modal OTP
      console.log("⚠️ [LOGIN] User not verified, showing OTP modal");
      setCustomerData(result.user);
      setShowOTPModal(true);
    }

        
  } else {
    console.error("❌ [LOGIN] Login failed:", result.message);
    
    // Jika error karena unauthorized tapi mungkin session sedang dibuat, tunggu sebentar
    if (result.message?.includes("Unauthenticated")) {
      console.log("🔵 [LOGIN] Unauthorized - session creation might be in progress");
      // Tidak langsung set error, biarkan proses di customerAuth.js handle
    }
    
    // Simpan error ke localStorage
    const debugInfo = {
      success: false,
      timestamp: new Date().toISOString(),
      error: result.message,
      result: result
    };
    localStorage.setItem("customer_login_debug", JSON.stringify(debugInfo));
    
    // Alert untuk debugging (bisa dihapus nanti)
    console.warn("⚠️ [LOGIN DEBUG] Check localStorage.getItem('customer_login_debug') for details");
    console.warn("⚠️ [LOGIN DEBUG] Full error:", debugInfo);
    
    setErrorMsg(result.message || "Email atau password salah.");
  }
} catch (error) {
  console.error("❌ [LOGIN] Error caught:", error);
  console.error("❌ [LOGIN] Error message:", error.message);
  console.error("❌ [LOGIN] Error stack:", error.stack);
  
  // Simpan error ke localStorage
  const debugInfo = {
    success: false,
    timestamp: new Date().toISOString(),
    error: error.message,
    errorStack: error.stack,
    errorFull: error.toString()
  };
  localStorage.setItem("customer_login_debug", JSON.stringify(debugInfo));
  
  // Alert untuk debugging (bisa dihapus nanti)
  console.warn("⚠️ [LOGIN DEBUG] Check localStorage.getItem('customer_login_debug') for details");
  console.warn("⚠️ [LOGIN DEBUG] Full error:", debugInfo);
  
  setErrorMsg(error.message || "Terjadi kesalahan. Silakan coba lagi.");
} finally {
  setIsSubmitting(false);
  console.log("🔵 [LOGIN] Login process finished");
}
};

return ( 
  <>
    {/* Modal OTP Verification - Tampil jika belum verifikasi */}
    {showOTPModal && customerData && (
      <OTPVerificationModal
        customerInfo={customerData}
        onClose={() => {
          // Modal tidak bisa ditutup sebelum kirim OTP
        }}
        onOTPSent={(data) => {
          setShowOTPModal(false);
          router.replace("/customer/otp");
        }}
        allowClose={false}
      />
    )}

    <div className="login-container">
    {/* === LEFT PANEL === */} <div className="login-left"> 
        <div className="login-box"> 
            <div className="logo"> 
                <img src="/assets/logo.png" alt="Logo" className="login-logo" /> 
         </div>
          <h3>Welcome Back!</h3>
          <p>Sign in to your account</p>

      <form onSubmit={handleSubmit} autoComplete="off" data-form-type="other">
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="current-password"
            data-1p-ignore
            data-lpignore="true"
            data-form-type="other"
          />
        </div>

        <div className="remember-forgot">
          <label>
            <input type="checkbox" /> Remember me
          </label>
          <a href="#">Forgot password?</a>
        </div>

        {errorMsg && (
          <div style={{ 
            color: "#ff4444", 
            fontSize: "14px", 
            marginBottom: "10px",
            textAlign: "center"
          }}>
            {errorMsg}
          </div>
        )}

        <button 
          type="submit" 
          className="btn-signin"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing In..." : "Sign In"}
        </button>
      </form>
    </div>
  </div>

  {/* === RIGHT PANEL === */}
  <div className="login-right">
    <div className="overlay-content">
      <h1>TEMPAT TERBAIK UNTUK BELAJAR DARI PRAKTISI PROPERTI</h1>
      <h3>
        Komunitas properti eksklusif — belajar langsung dari pelaku lapangan
        yang sudah buktiin strategi cuan properti, bukan teori doang!
      </h3>

      {/* === Founder Image Fade === */}
      <div className="founder-section">
        <div className="image-stack">
          {founders.map((src, i) => (
            <Image
              key={i}
              src={src}
              alt="Founder"
              width={250}
              height={125}
              className={`founder-full ${
                i === current ? "fade-active" : "fade-inactive"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  </div>
</div>
  </>
);
}

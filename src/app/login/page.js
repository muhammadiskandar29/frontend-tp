'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import '@/styles/login.css';
import { setToken } from '@/lib/storage';
import { getDivisionHome } from '@/lib/divisionRoutes';
import { isTokenExpired } from '@/lib/checkToken';

const API_URL = '/api/login';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checked, setChecked] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);

  // === CEK LOGIN ===
  useEffect(() => {
    const token = localStorage.getItem('token');
    const loginTime = localStorage.getItem('login_time');

    if (token && loginTime && !isTokenExpired()) {
      router.replace('/admin'); // langsung replace biar gak flicker
    }
  }, [router]);

  // === AUTO-MODAL kalau dari middleware ===
  useEffect(() => {
    const unauthorized = searchParams.get('unauthorized');
    if (unauthorized) {
      setErrorMsg('Sesi kamu sudah habis atau belum login.');
      setShowError(true);
    }
  }, [searchParams]);

  // === HANDLE LOGIN ===
  const handleLogin = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data?.token) {
        setToken(data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('division', data.user?.divisi || '');

        // ✅ Simpan cookie yang bisa dibaca middleware (tanpa Secure biar jalan di localhost)
        document.cookie = `token=${data.token}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;

        const targetRoute = getDivisionHome(data.user?.divisi);
        localStorage.setItem('division_home', targetRoute);
        router.replace(targetRoute);
      } else {
        setErrorMsg(data?.message || 'Email atau password salah.');
        setShowError(true);
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMsg('Gagal terhubung ke server. Coba lagi nanti.');
      setShowError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const helperMessage = showError
    ? errorMsg
    : 'Gunakan akun yang diberikan admin untuk mengakses dashboard.';

  // === UI ===
  return (
    <div className="login-container">
      {/* === LEFT PANEL === */}
      <div className="login-left">
        <div className="login-box">
          <div className="login-logo">
            <img src="/assets/logo.png" alt="Logo" className="login-logo__img" />
          </div>
          <h3>Welcome Back!</h3>
        <p>Sign in to your account</p>

          {showError && <div className="login-alert">{errorMsg}</div>}

        <form onSubmit={handleLogin} className="login-form">
            <div className="login-form-group">
              <label>Email</label>
            <input
              id="email"
                type="email"
                name="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (showError) setShowError(false);
              }}
              placeholder="admin@gmail.com"
              required
              autoComplete="email"
            />
            </div>

            <div className="login-form-group">
              <label>Password</label>
              <div className="login-password-wrapper">
              <input
                id="password"
                  type={showPasswordField ? 'text' : 'password'}
                  name="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (showError) setShowError(false);
                }}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                  className="login-password-toggle"
                onClick={() => setShowPasswordField((prev) => !prev)}
                aria-label={showPasswordField ? 'Hide password' : 'Show password'}
              >
                {showPasswordField ? 'Hide' : 'Show'}
              </button>
            </div>
            </div>

            <div className="login-remember-forgot">
              <label>
              <input
                id="remember"
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
              />
                Remember me
            </label>
              <a href="mailto:support@onedashboard.id">Forgot password?</a>
          </div>

            <button type="submit" className="login-btn-signin" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

          <p className="login-footer">{helperMessage}</p>
        </div>
      </div>

      {/* === RIGHT PANEL === */}
      <div className="login-right">
        <div className="login-overlay-content">
          <Image
            src="/assets/login.png"
            alt="One Dashboard"
            width={700}
            height={500}
            className="login-overlay-image"
            priority
          />
        </div>
      </div>
    </div>
  );
}

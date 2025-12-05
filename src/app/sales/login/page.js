'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Checkbox } from 'primereact/checkbox';
import '@/styles/login.css';
import { setToken } from '@/lib/storage';

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

        // ✅ Simpan cookie yang bisa dibaca middleware
        document.cookie = `token=${data.token}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;

        router.replace('/admin');
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
    <div className="login-centered-shell">
      <section className="login-card">
        <img src="/assets/logo.png" alt="One Dashboard" className="login-card__logo" />
        <h3>Welcome to One Dashboard</h3>
        <p>Sign in to your account</p>

        {showError && <div className="login-card__alert">{errorMsg}</div>}

        <form onSubmit={handleLogin} className="login-form">
          <label className="login-field">
            <span>Email</span>
            <InputText
              id="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (showError) setShowError(false);
              }}
              placeholder="admin@gmail.com"
              className="login-input"
              required
              type="email"
            />
          </label>

          <label className="login-field">
            <span>Password</span>
            <Password
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (showError) setShowError(false);
              }}
              placeholder="••••••••"
              toggleMask
              feedback={false}
              inputClassName="login-input"
              className="login-password"
              required
            />
          </label>

          <div className="login-form__meta">
            <label className="login-remember">
              <Checkbox
                inputId="remember"
                checked={checked}
                onChange={(e) => setChecked(e.checked)}
              />
              <span>Remember me</span>
            </label>
            <a href="mailto:support@onedashboard.id" className="login-support">
              Forgot password?
            </a>
          </div>

          <button type="submit" className="login-button" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="login-panel__footer">{helperMessage}</p>
      </section>
    </div>
  );
}

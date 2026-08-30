const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
let refreshPromise = null;

export async function api(path, options = {}, retry = true) {
  const request = { credentials: 'include', ...options };
  const headers = new Headers(options.headers || {});
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  request.headers = headers;

  const res = await fetch(`${API}${path}`, request);
  if (res.status === 401 && retry && path !== '/api/auth/refresh') {
    refreshPromise ||= fetch(`${API}/api/auth/refresh`, { method: 'POST', credentials: 'include' }).finally(() => { refreshPromise = null; });
    const refreshed = await refreshPromise;
    if (refreshed.ok) return api(path, options, false);
  }
  const text = await res.text();
  let data = {};
  if (text) { try { data = JSON.parse(text); } catch { data = { message: text }; } }
  if (!res.ok) {
    const error = new Error(data.message || `Request failed (${res.status})`);
    error.status = res.status;
    throw error;
  }
  return data;
}

export function track(event, payload = {}) {
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  fetch(`${API}/api/analytics`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event, payload, path }), keepalive: true }).catch(() => {});
}

export const money = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n) || 0);

export async function loadRazorpay() {
  if (window.Razorpay) return true;
  await new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-razorpay]');
    if (existing) { existing.addEventListener('load', resolve, { once: true }); existing.addEventListener('error', reject, { once: true }); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true; script.dataset.razorpay = 'true';
    script.onload = resolve; script.onerror = () => reject(new Error('Unable to load secure payment checkout.'));
    document.head.appendChild(script);
  });
  return !!window.Razorpay;
}

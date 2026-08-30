import React, { useEffect, useRef, useState } from 'react';

export default function GoogleSignIn({ onCredential, disabled = false }) {
  const ref = useRef(null); const callbackRef = useRef(onCredential); const [ready,setReady] = useState(false); callbackRef.current = onCredential;
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    const render = () => {
      if (cancelled || !window.google?.accounts?.id || !ref.current) return;
      window.google.accounts.id.initialize({ client_id: clientId, callback: response => callbackRef.current(response.credential), ux_mode: 'popup' });
      ref.current.innerHTML = '';
      window.google.accounts.id.renderButton(ref.current, { theme: 'outline', size: 'large', width: 320, text: 'continue_with', shape: 'rectangular' });
      setReady(true);
    };
    if (window.google?.accounts?.id) render();
    else {
      const script = document.querySelector('script[data-google-gsi]') || document.createElement('script');
      if (!script.src) { script.src='https://accounts.google.com/gsi/client'; script.async=true; script.defer=true; script.dataset.googleGsi='true'; document.head.appendChild(script); }
      script.addEventListener('load', render, { once:true });
      return () => { cancelled=true; script.removeEventListener('load', render); };
    }
    return () => { cancelled=true; };
  }, [clientId]);
  if (!clientId) return <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">Google Sign-In is not configured yet.</p>;
  return <div ref={ref} aria-disabled={disabled || !ready} className={disabled ? 'pointer-events-none opacity-50 min-h-10' : 'min-h-10'} />;
}

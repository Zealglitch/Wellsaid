/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, fetchUserProfile } from './lib/supabase';

interface RewriteVersion {
  toneId: string;
  title: string;
  text: string;
  locked?: boolean;
}

interface RewriteResult {
  versions: RewriteVersion[];
  isPro?: boolean;
}

export default function App() {

  const [kind, setKind] = useState(() => {
    try {
      return localStorage.getItem('wellsaid_kind') || 'An apology';
    } catch {
      return 'An apology';
    }
  });

  const [msg, setMsgState] = useState(() => {
    try {
      return localStorage.getItem('wellsaid_draft') || '';
    } catch {
      return '';
    }
  });

  const setMsg = (val: string) => {
    setMsgState(val);
    try {
      localStorage.setItem('wellsaid_draft', val);
    } catch {}
  };

  const setKindWithStorage = (val: string) => {
    setKind(val);
    try {
      localStorage.setItem('wellsaid_kind', val);
    } catch {}
  };

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<RewriteResult | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [unlocked, setUnlocked] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'account'>('signup');
  const [authEmailInput, setAuthEmailInput] = useState('');
  const [authPasswordInput, setAuthPasswordInput] = useState('');
  const [licenseInput, setLicenseInput] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const syncUserEntitlement = async (activeSession: Session | null) => {
    setSession(activeSession);
    if (!activeSession?.user) {
      setUnlocked(false);
      setUserEmail('');
      return false;
    }
    setUserEmail(activeSession.user.email || '');
    const profile = await fetchUserProfile(activeSession.user.id);
    const isPro = Boolean(profile?.is_pro);
    setUnlocked(isPro);
    return isPro;
  };

  useEffect(() => {
    if (!supabase) return;

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        syncUserEntitlement(data.session || null);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) {
        syncUserEntitlement(nextSession || null);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSelectAndApply = async (text: string, index: number, toneTitle: string) => {
    // 1. Automatically replace draft in the message textarea
    setMsg(text);

    // 2. Automatically copy to clipboard in background
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
    } catch (e) {
      console.warn('Clipboard write error', e);
    }

    // 3. Show notification
    setSuccessNotice(`✓ Draft replaced with ${toneTitle} & copied to clipboard!`);
    setTimeout(() => {
      setSuccessNotice(null);
      setCopiedIndex(null);
    }, 4500);

    // 4. Smooth scroll back to textarea so user sees the replaced text
    const msgEl = document.getElementById('msg');
    if (msgEl) {
      msgEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      msgEl.focus();
    }
  };

  const price = '$2.99';

  const isProhibitedContent = (text: string): boolean => {
    const blocked = /\b(kill yourself|kys|suicide|murder|bomb threat|terrorist|rape|molest|child porn|pornography|nude|nsfw|slur|nigger|faggot)\b/i;
    return blocked.test(text);
  };

  const fetchRewrites = async (text: string, scenarioKind: string, accessToken?: string) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch('/api/rewrite', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: text,
        scenario: scenarioKind,
        channel: 'text',
        recipient: 'recipient',
      }),
    });

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('Rewrite service is currently unavailable. Please try again shortly.');
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong. Please try again.');
    }

    if (!data.versions || !Array.isArray(data.versions)) {
      throw new Error('Failed to parse rewrites.');
    }

    return data as RewriteResult;
  };

  const handleRewrite = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = msg.trim();
    if (!text) {
      setErr('Please paste or type a message first.');
      return;
    }

    if (isProhibitedContent(text)) {
      setErr('This message violates our Safety & Content Moderation Policy (prohibited or harmful content) and cannot be processed.');
      return;
    }

    setLoading(true);
    setErr(null);

    try {
      let token = session?.access_token;
      if (supabase) {
        const { data: sData } = await supabase.auth.getSession();
        token = sData.session?.access_token;
      }

      const data = await fetchRewrites(text, kind, token);
      if (typeof data.isPro === 'boolean') {
        setUnlocked(data.isPro);
      }
      setResult(data);

      // Smooth scroll to output
      setTimeout(() => {
        const outEl = document.getElementById('out');
        if (outEl) {
          outEl.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (e: any) {
      console.error(e);
      setErr(e.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const dodoCheckoutUrl =
    (typeof window !== 'undefined' && (window as any).DODO_CHECKOUT_URL) ||
    import.meta.env.VITE_DODO_PAYMENT_URL ||
    'https://dodo.pe/wellsaid';

  const handleUnlock = () => {
    window.open(dodoCheckoutUrl, '_blank', 'noopener,noreferrer');
  };

  const getToneTag = (toneId: string, title?: string) => {
    if (toneId === 'warm') return 'Warm & gentle';
    if (toneId === 'direct') return 'Direct & professional';
    if (toneId === 'short') return 'Short & firm';
    return title || 'Rewritten version';
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !isSupabaseConfigured) {
      setAuthMessage({
        text: 'Authentication is not configured yet. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
        success: false,
      });
      return;
    }

    const email = authEmailInput.trim().toLowerCase();
    const password = authPasswordInput;

    if (!email || !email.includes('@')) {
      setAuthMessage({ text: 'Please enter a valid email address.', success: false });
      return;
    }
    if (password.length < 6) {
      setAuthMessage({ text: 'Password must be at least 6 characters.', success: false });
      return;
    }

    setAuthBusy(true);
    setAuthMessage(null);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setAuthMessage({ text: error.message, success: false });
        return;
      }

      if (data.session) {
        const isPro = await syncUserEntitlement(data.session);
        setAuthPasswordInput('');
        setAuthMessage({
          text: isPro
            ? '✓ Account created & Lifetime Pro detected from your purchase!'
            : '✓ Free account created! Welcome to WellSaid.',
          success: true,
        });
        if (isPro && msg.trim() && result) {
          fetchRewrites(msg.trim(), kind, data.session.access_token)
            .then((refreshed) => setResult(refreshed))
            .catch(() => {});
        }
        setTimeout(() => {
          setAuthModalOpen(false);
          setAuthMessage(null);
        }, 1200);
      } else {
        setAuthPasswordInput('');
        setAuthMessage({
          text: '✓ Account created! Please check your email inbox to confirm your address, then sign in.',
          success: true,
        });
      }
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !isSupabaseConfigured) {
      setAuthMessage({
        text: 'Authentication is not configured yet. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
        success: false,
      });
      return;
    }

    const email = authEmailInput.trim().toLowerCase();
    const password = authPasswordInput;

    if (!email || !email.includes('@')) {
      setAuthMessage({ text: 'Please enter your account email address.', success: false });
      return;
    }
    if (!password) {
      setAuthMessage({ text: 'Please enter your password.', success: false });
      return;
    }

    setAuthBusy(true);
    setAuthMessage(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setAuthMessage({ text: error.message, success: false });
        return;
      }

      const isPro = await syncUserEntitlement(data.session || null);
      setAuthPasswordInput('');
      setAuthMessage({
        text: isPro
          ? '✓ Signed in! Lifetime Pro active — all 3 tones unlocked.'
          : '✓ Signed in to your Free account.',
        success: true,
      });

      if (isPro && msg.trim() && result && data.session?.access_token) {
        fetchRewrites(msg.trim(), kind, data.session.access_token)
          .then((refreshed) => setResult(refreshed))
          .catch(() => {});
      }

      setTimeout(() => {
        if (isPro) {
          setAuthModalOpen(false);
          setAuthMessage(null);
        } else {
          setAuthMode('account');
          setAuthMessage(null);
        }
      }, 900);
    } finally {
      setAuthBusy(false);
    }
  };

  const handleActivateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    const key = licenseInput.trim();
    if (!key) {
      setAuthMessage({ text: 'Please enter your license key from your Dodo Payments receipt.', success: false });
      return;
    }
    if (!supabase || !session?.access_token) {
      setAuthMessage({ text: 'Please sign in first to activate a license key.', success: false });
      return;
    }

    setAuthBusy(true);
    setAuthMessage(null);
    try {
      const res = await fetch('/api/activate-license', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ licenseKey: key }),
      });

      const contentType = res.headers.get('content-type') || '';
      const payload = contentType.includes('application/json') ? await res.json() : null;

      if (res.ok && payload?.success) {
        await syncUserEntitlement(session);
        setLicenseInput('');
        setAuthMessage({ text: '✓ Lifetime Pro activated! All 3 tones unlocked.', success: true });
        if (msg.trim() && result) {
          fetchRewrites(msg.trim(), kind, session.access_token)
            .then((refreshed) => setResult(refreshed))
            .catch(() => {});
        }
        return;
      }

      // Fallback for internal Supabase license keys via hardened SECURITY DEFINER RPC
      const { data: rpcData, error: rpcErr } = await supabase.rpc('redeem_internal_license', {
        p_key: key,
      });
      if (!rpcErr && rpcData?.valid === true) {
        await syncUserEntitlement(session);
        setLicenseInput('');
        setAuthMessage({ text: '✓ Lifetime Pro activated! All 3 tones unlocked.', success: true });
        if (msg.trim() && result) {
          fetchRewrites(msg.trim(), kind, session.access_token)
            .then((refreshed) => setResult(refreshed))
            .catch(() => {});
        }
        return;
      }

      setAuthMessage({
        text: payload?.error || 'Invalid, expired, or already used license key.',
        success: false,
      });
    } catch {
      setAuthMessage({ text: 'Unable to verify license key right now. Please try again.', success: false });
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setUnlocked(false);
    setUserEmail('');
    setResult(null);
    setAuthModalOpen(false);
    setAuthMessage(null);
  };

  return (
    <main>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div className="brand" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <img
            src="/favicon.png"
            alt="WellSaid logo"
            style={{ width: '24px', height: '24px', borderRadius: '6px', verticalAlign: 'middle', display: 'inline-block' }}
          />
          <span>WellSaid</span>
          {unlocked && (
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                background: 'rgba(194, 65, 12, 0.12)',
                color: 'var(--accent)',
                padding: '2px 7px',
                borderRadius: '5px',
                border: '1px solid rgba(194, 65, 12, 0.25)',
              }}
            >
              PRO
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {session ? (
            <button
              type="button"
              onClick={() => {
                setAuthMode('account');
                setAuthModalOpen(true);
              }}
              style={{
                background: 'transparent',
                border: '1px solid var(--line)',
                color: 'var(--mute)',
                fontSize: '0.82rem',
                padding: '5px 12px',
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Account
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setAuthMessage(null);
                  setAuthModalOpen(true);
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--line)',
                  color: 'var(--mute)',
                  fontSize: '0.82rem',
                  padding: '5px 12px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setAuthMessage(null);
                  setAuthModalOpen(true);
                }}
                style={{
                  background: 'var(--accent)',
                  border: '1px solid var(--accent)',
                  color: 'var(--accent-ink)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  padding: '5px 14px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
      <h1>Say the hard thing, well.</h1>
      <p className="sub">
        Paste the message you’re dreading to send. Get three ready-to-send versions in seconds: warm, direct, and short.
      </p>

      {/* Product Demo Video */}
      <div
        style={{
          margin: '20px 0 26px',
          borderRadius: '14px',
          overflow: 'hidden',
          border: '1px solid var(--line)',
          background: 'var(--card)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.07)',
        }}
      >
        <video
          controls
          autoPlay
          muted
          loop
          playsInline
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
          }}
        >
          <source src="/assets/aistudio/WellSaid-promo-demo_cf5b1580.mp4" type="video/mp4" />
          <source src="/wellsaid-promo-demo.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      <form onSubmit={handleRewrite}>
        <label htmlFor="kind">What is it?</label>
        <select
          id="kind"
          value={kind}
          onChange={(e) => setKindWithStorage(e.target.value)}
        >
          <option>An apology</option>
          <option>Asking for a raise</option>
          <option>Declining an invite</option>
          <option>Ending a relationship</option>
          <option>Setting a boundary</option>
          <option>Giving tough feedback</option>
          <option>Something else</option>
        </select>

        {successNotice && (
          <div className="notice" role="status">
            <span>{successNotice}</span>
          </div>
        )}

        <label htmlFor="msg">Your message, as it is in your head</label>
        <textarea
          id="msg"
          maxLength={2000}
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="e.g. I can’t come to your wedding because I can’t afford the flight, and I feel awful about it."
        />

        <button className="go" id="go" type="submit" disabled={loading}>
          {loading ? 'Rewriting...' : 'Rewrite it'}
        </button>
      </form>

      {err && (
        <div id="err" className="err">
          {err}
        </div>
      )}

      <div id="out">
        {result && result.versions && result.versions.length > 0 && (
          <>
            {/* 1. Warm & gentle - Free tone */}
            <div
              className="card card-selectable"
              onClick={() => handleSelectAndApply(result.versions[0].text, 0, getToneTag(result.versions[0].toneId, result.versions[0].title))}
              title="Click to auto-replace your draft above with this tone"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div className="tag" style={{ margin: 0 }}>{getToneTag(result.versions[0].toneId, result.versions[0].title)}</div>
                <button
                  className="send-arrow-btn"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectAndApply(result.versions[0].text, 0, getToneTag(result.versions[0].toneId, result.versions[0].title));
                  }}
                  title="Auto-replace draft & copy"
                  aria-label="Auto-replace draft & copy"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              </div>
              <div className="txt">{result.versions[0].text}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                <button
                  className="ghost"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectAndApply(result.versions[0].text, 0, getToneTag(result.versions[0].toneId, result.versions[0].title));
                  }}
                >
                  {copiedIndex === 0 ? '✓ Auto-applied to draft!' : 'Auto-replace draft & copy'}
                </button>
                <span style={{ fontSize: '0.75rem', color: 'var(--mute)', fontFamily: 'system-ui, sans-serif' }}>
                  1 tap to auto-replace
                </span>
              </div>
            </div>

            {/* 2. Direct & professional */}
            {result.versions.length > 1 && (() => {
              const v1 = result.versions[1];
              const isLocked1 = Boolean(v1.locked || !unlocked || !v1.text);
              return (
                <div
                  className={`card ${isLocked1 ? 'locked' : 'card-selectable'}`}
                  onClick={() => {
                    if (!isLocked1) {
                      handleSelectAndApply(v1.text, 1, getToneTag(v1.toneId, v1.title));
                    }
                  }}
                  title={!isLocked1 ? 'Click to auto-replace your draft above with this tone' : undefined}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div className="tag" style={{ margin: 0 }}>{getToneTag(v1.toneId, v1.title)}</div>
                    {!isLocked1 && (
                      <button
                        className="send-arrow-btn"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAndApply(v1.text, 1, getToneTag(v1.toneId, v1.title));
                        }}
                        title="Auto-replace draft & copy"
                        aria-label="Auto-replace draft & copy"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                          <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="txt">
                    {isLocked1
                      ? 'Unlock Lifetime Pro ($2.99) or sign in with your Pro account to generate the Direct & professional version.'
                      : v1.text}
                  </div>
                  {isLocked1 ? (
                    <div className="lock">🔒</div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                      <button
                        className="ghost"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAndApply(v1.text, 1, getToneTag(v1.toneId, v1.title));
                        }}
                      >
                        {copiedIndex === 1 ? '✓ Auto-applied to draft!' : 'Auto-replace draft & copy'}
                      </button>
                      <span style={{ fontSize: '0.75rem', color: 'var(--mute)', fontFamily: 'system-ui, sans-serif' }}>
                        1 tap to auto-replace
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 3. Short & firm */}
            {result.versions.length > 2 && (() => {
              const v2 = result.versions[2];
              const isLocked2 = Boolean(v2.locked || !unlocked || !v2.text);
              return (
                <div
                  className={`card ${isLocked2 ? 'locked' : 'card-selectable'}`}
                  onClick={() => {
                    if (!isLocked2) {
                      handleSelectAndApply(v2.text, 2, getToneTag(v2.toneId, v2.title));
                    }
                  }}
                  title={!isLocked2 ? 'Click to auto-replace your draft above with this tone' : undefined}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div className="tag" style={{ margin: 0 }}>{getToneTag(v2.toneId, v2.title)}</div>
                    {!isLocked2 && (
                      <button
                        className="send-arrow-btn"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAndApply(v2.text, 2, getToneTag(v2.toneId, v2.title));
                        }}
                        title="Auto-replace draft & copy"
                        aria-label="Auto-replace draft & copy"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                          <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="txt">
                    {isLocked2
                      ? 'Unlock Lifetime Pro ($2.99) or sign in with your Pro account to generate the Short & firm version.'
                      : v2.text}
                  </div>
                  {isLocked2 ? (
                    <div className="lock">🔒</div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                      <button
                        className="ghost"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAndApply(v2.text, 2, getToneTag(v2.toneId, v2.title));
                        }}
                      >
                        {copiedIndex === 2 ? '✓ Auto-applied to draft!' : 'Auto-replace draft & copy'}
                      </button>
                      <span style={{ fontSize: '0.75rem', color: 'var(--mute)', fontFamily: 'system-ui, sans-serif' }}>
                        1 tap to auto-replace
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Paywall unlock card if locked */}
            {!unlocked && (
              <div className="paywall">
                <h3>Unlock the other 2 tones</h3>
                <p className="sub">
                  Get Direct &amp; Professional and Short &amp; Firm versions right now for <span className="price">{price}</span>.
                </p>
                <button type="button" onClick={handleUnlock}>
                  Unlock all 3 tones ({price})
                </button>
                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center', gap: '10px', fontSize: '0.84rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setAuthMessage(null);
                      setAuthModalOpen(true);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Sign Up for Free
                  </button>
                  <span style={{ color: 'var(--mute)' }}>·</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setAuthMessage(null);
                      setAuthModalOpen(true);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--mute)',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Already paid? Sign In / Restore
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <h2>How it works</h2>
      <ol>
        <li>Paste what you want to say, however messy.</li>
        <li>Get your first rewrite free, right away.</li>
        <li>
          Want the other two tones? Unlock them for <span className="price">{price}</span>, once. One-time payment, no subscription.
        </li>
      </ol>

      <h2>Questions</h2>
      <dl>
        <dt>Do you save my message?</dt>
        <dd>
          Your original message is never stored. It is sent to an AI service only to write the rewrites. We keep the rewrites so your unlock link keeps working.
        </dd>
        <dt>
          What do I get for <span className="price">{price}</span>?
        </dt>
        <dd>
          The two remaining versions of your message (direct and professional, short and firm), plus copy buttons.
        </dd>
        <dt>What if it isn’t right for me?</dt>
        <dd>
          Email <a href="mailto:heyy.wellsaid@gmail.com">heyy.wellsaid@gmail.com</a> within 7 days and we’ll refund you.
        </dd>
        <dt>How do I pay?</dt>
        <dd>Cards, UPI (in India), and other local methods through Dodo Payments, which handles tax and receipts.</dd>
      </dl>

      <section
        id="pricing"
        style={{
          marginTop: '48px',
          background: 'var(--card)',
          border: '1px solid var(--line)',
          borderRadius: '16px',
          padding: '32px 26px',
          color: 'var(--ink)',
          boxShadow: '0 2px 14px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '22px' }}>
          <span
            style={{
              fontSize: '1.25rem',
              color: 'var(--mute)',
              textDecoration: 'line-through',
              marginRight: '10px',
              fontFamily: 'Georgia, serif',
            }}
          >
            $9
          </span>
          <span
            style={{
              fontSize: '3.2rem',
              fontWeight: 700,
              color: 'var(--ink)',
              letterSpacing: '-1px',
              lineHeight: 1,
              fontFamily: 'Georgia, serif',
            }}
          >
            $2.99
          </span>
          <span
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--mute)',
              marginLeft: '8px',
              letterSpacing: '0.04em',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            USD · ONE-TIME PAYMENT
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.94rem', color: 'var(--ink)', fontFamily: 'system-ui, sans-serif' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '1.05rem', lineHeight: 1 }}>✓</span>
            <span>All 3 communication tones (Warm, Direct, Short)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.94rem', color: 'var(--ink)', fontFamily: 'system-ui, sans-serif' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '1.05rem', lineHeight: 1 }}>✓</span>
            <span>Unlimited message rewrites</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.94rem', color: 'var(--ink)', fontFamily: 'system-ui, sans-serif' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '1.05rem', lineHeight: 1 }}>✓</span>
            <span>Chrome browser extension included</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.94rem', color: 'var(--ink)', fontFamily: 'system-ui, sans-serif' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '1.05rem', lineHeight: 1 }}>✓</span>
            <span>Instant 1-click replace &amp; clipboard copy</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.94rem', color: 'var(--ink)', fontFamily: 'system-ui, sans-serif' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '1.05rem', lineHeight: 1 }}>✓</span>
            <span>Works across Gmail, Slack, LinkedIn &amp; web</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.94rem', color: 'var(--ink)', fontFamily: 'system-ui, sans-serif' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '1.05rem', lineHeight: 1 }}>✓</span>
            <span>7-day money-back guarantee</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.92rem', color: 'var(--mute)', fontFamily: 'system-ui, sans-serif' }}>
            <span style={{ color: 'var(--mute)', fontSize: '1rem', lineHeight: 1, opacity: 0.6 }}>✕</span>
            <span style={{ textDecoration: 'line-through', opacity: 0.85 }}>Monthly subscriptions or recurring fees</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.94rem', color: 'var(--ink)', fontFamily: 'system-ui, sans-serif' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '1.05rem', lineHeight: 1 }}>✓</span>
            <span>Free account &amp; instant sync across all your devices</span>
          </div>
        </div>

        {unlocked ? (
          <div style={{ padding: '20px', background: 'rgba(194,65,12,0.06)', borderRadius: '12px', border: '1px solid rgba(194,65,12,0.22)', textAlign: 'center' }}>
            <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              ✓ Lifetime Pro Active
            </div>
            <p style={{ margin: '6px 0 16px', fontSize: '0.9rem', color: 'var(--mute)', lineHeight: 1.5 }}>
              You have unlocked all 3 communication tones forever. Thank you for your support!
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: 'var(--accent)',
                  color: 'var(--accent-ink)',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Manage Account
              </button>
            </div>
          </div>
        ) : (
          <>
            <a
              href={dodoCheckoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '14px 22px',
                borderRadius: '10px',
                background: 'var(--accent)',
                color: 'var(--accent-ink)',
                fontWeight: 600,
                fontSize: '1rem',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                letterSpacing: 'normal',
                textDecoration: 'none',
                boxShadow: '0 2px 10px rgba(194,65,12,0.28)',
                cursor: 'pointer',
                transition: 'opacity 0.15s ease, transform 0.15s ease',
              }}
            >
              <span>Get WellSaid</span>
            </a>

            <div
              style={{
                textAlign: 'center',
                marginTop: '12px',
                fontSize: '0.85rem',
                color: 'var(--mute)',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
              }}
            >
              Pay once. Use forever. No subscription.
            </div>

            <div
              style={{
                marginTop: '10px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.85rem',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setAuthMessage(null);
                  setAuthModalOpen(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Sign Up for Free Account
              </button>
              <span style={{ color: 'var(--mute)' }}>·</span>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setAuthMessage(null);
                  setAuthModalOpen(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--mute)',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Already purchased? Sign In
              </button>
            </div>

            <div
              style={{
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: '1px solid var(--line)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '0.8rem', color: 'var(--mute)', fontFamily: 'system-ui, sans-serif' }}>
                Or scan with phone to checkout ($2.99):
              </span>
              <img
                src="/assets/aistudio/wellsaid-qr-code_fdb151ff.png"
                alt="Scan to pay with Dodo Payments"
                style={{
                  width: '104px',
                  height: '104px',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                  background: '#fff',
                  padding: '4px',
                }}
              />
            </div>
          </>
        )}
      </section>


      {/* Authentication & Account Modal */}
      {authModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setAuthModalOpen(false)}
        >
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--line)',
              borderRadius: '16px',
              padding: '26px 22px',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.2)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: '1.25rem', color: 'var(--ink)' }}>
                {session ? 'WellSaid Account' : authMode === 'signup' ? 'Create Account' : 'Sign In'}
              </h3>
              <button
                type="button"
                onClick={() => setAuthModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.1rem',
                  color: 'var(--mute)',
                  cursor: 'pointer',
                  padding: '2px 6px',
                }}
              >
                ✕
              </button>
            </div>

            {session ? (
              <div>
                <div style={{ padding: '12px', background: 'rgba(194,65,12,0.08)', borderRadius: '10px', border: '1px solid rgba(194,65,12,0.2)', marginBottom: '16px' }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {unlocked ? '✓ Lifetime Pro Active' : 'Free Account'}
                  </div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--ink)', marginTop: '4px', wordBreak: 'break-all' }}>
                    {userEmail}
                  </div>
                </div>

                {!unlocked && (
                  <>
                    <a
                      href={dodoCheckoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'block',
                        textAlign: 'center',
                        padding: '11px',
                        borderRadius: '8px',
                        background: 'var(--accent)',
                        color: 'var(--accent-ink)',
                        fontWeight: 600,
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        marginBottom: '16px',
                      }}
                    >
                      Upgrade to Lifetime Pro ($2.99) →
                    </a>

                    <form
                      onSubmit={handleActivateLicense}
                      style={{
                        paddingTop: '14px',
                        marginBottom: '14px',
                        borderTop: '1px solid var(--line)',
                      }}
                    >
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
                        Already purchased? Activate License Key
                      </div>
                      <input
                        type="text"
                        value={licenseInput}
                        onChange={(e) => setLicenseInput(e.target.value)}
                        placeholder="Paste Dodo Payments license key"
                        style={{
                          width: '100%',
                          padding: '9px 11px',
                          borderRadius: '8px',
                          border: '1px solid var(--line)',
                          background: 'var(--card)',
                          color: 'var(--ink)',
                          fontSize: '0.86rem',
                          marginBottom: '8px',
                          boxSizing: 'border-box',
                        }}
                      />
                      <button
                        type="submit"
                        disabled={authBusy}
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '8px',
                          background: 'var(--bg)',
                          border: '1px solid var(--line)',
                          color: 'var(--ink)',
                          fontWeight: 600,
                          fontSize: '0.86rem',
                          cursor: authBusy ? 'wait' : 'pointer',
                        }}
                      >
                        {authBusy ? 'Verifying...' : 'Verify & Unlock Pro'}
                      </button>
                    </form>
                  </>
                )}

                {authMessage && (
                  <div
                    style={{
                      marginBottom: '12px',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '0.82rem',
                      background: authMessage.success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      color: authMessage.success ? '#10b981' : '#ef4444',
                      border: `1px solid ${authMessage.success ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    }}
                  >
                    {authMessage.text}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSignOut}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: '1px solid #ef4444',
                    color: '#ef4444',
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                  }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div>
                {/* Tabs for Sign Up vs Sign In */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', background: 'var(--bg)', padding: '4px', borderRadius: '10px', border: '1px solid var(--line)' }}>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('signup'); setAuthMessage(null); }}
                    style={{
                      flex: 1,
                      padding: '7px 0',
                      borderRadius: '7px',
                      border: 'none',
                      background: authMode === 'signup' ? 'var(--card)' : 'transparent',
                      color: authMode === 'signup' ? 'var(--ink)' : 'var(--mute)',
                      fontWeight: authMode === 'signup' ? 700 : 500,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      boxShadow: authMode === 'signup' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Sign Up
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('signin'); setAuthMessage(null); }}
                    style={{
                      flex: 1,
                      padding: '7px 0',
                      borderRadius: '7px',
                      border: 'none',
                      background: authMode === 'signin' ? 'var(--card)' : 'transparent',
                      color: authMode === 'signin' ? 'var(--ink)' : 'var(--mute)',
                      fontWeight: authMode === 'signin' ? 700 : 500,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      boxShadow: authMode === 'signin' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Sign In
                  </button>
                </div>

                {authMode === 'signup' ? (
                  <form onSubmit={handleSignUp}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--mute)', margin: '0 0 12px', lineHeight: 1.5 }}>
                      Create your WellSaid account with email &amp; password:
                    </p>
                    <input
                      type="email"
                      required
                      value={authEmailInput}
                      onChange={(e) => setAuthEmailInput(e.target.value)}
                      placeholder="name@example.com"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--line)',
                        background: 'var(--card)',
                        color: 'var(--ink)',
                        fontSize: '0.9rem',
                        marginBottom: '10px',
                        boxSizing: 'border-box',
                      }}
                    />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={authPasswordInput}
                      onChange={(e) => setAuthPasswordInput(e.target.value)}
                      placeholder="Password (min. 6 characters)"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--line)',
                        background: 'var(--card)',
                        color: 'var(--ink)',
                        fontSize: '0.9rem',
                        marginBottom: '12px',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="submit"
                      disabled={authBusy}
                      style={{
                        width: '100%',
                        padding: '11px',
                        borderRadius: '8px',
                        background: 'var(--accent)',
                        color: 'var(--accent-ink)',
                        fontWeight: 600,
                        fontSize: '0.92rem',
                        border: 'none',
                        cursor: authBusy ? 'wait' : 'pointer',
                      }}
                    >
                      {authBusy ? 'Creating account...' : 'Create Free Account'}
                    </button>
                    {authMessage && (
                      <div
                        style={{
                          marginTop: '10px',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          fontSize: '0.82rem',
                          background: authMessage.success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                          color: authMessage.success ? '#10b981' : '#ef4444',
                          border: `1px solid ${authMessage.success ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        }}
                      >
                        {authMessage.text}
                      </div>
                    )}
                    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--line)', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--mute)' }}>Want all 3 tones forever?</span><br />
                      <a
                        href={dodoCheckoutUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: 'var(--accent)',
                          fontWeight: 600,
                          fontSize: '0.88rem',
                          textDecoration: 'none',
                          display: 'inline-block',
                          marginTop: '4px',
                        }}
                      >
                        Unlock Lifetime Pro ($2.99) →
                      </a>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleSignIn}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--mute)', margin: '0 0 12px', lineHeight: 1.5 }}>
                      Sign in with your verified email &amp; password:
                    </p>
                    <input
                      type="email"
                      required
                      value={authEmailInput}
                      onChange={(e) => setAuthEmailInput(e.target.value)}
                      placeholder="name@example.com"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--line)',
                        background: 'var(--card)',
                        color: 'var(--ink)',
                        fontSize: '0.9rem',
                        marginBottom: '10px',
                        boxSizing: 'border-box',
                      }}
                    />
                    <input
                      type="password"
                      required
                      value={authPasswordInput}
                      onChange={(e) => setAuthPasswordInput(e.target.value)}
                      placeholder="Password"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--line)',
                        background: 'var(--card)',
                        color: 'var(--ink)',
                        fontSize: '0.9rem',
                        marginBottom: '12px',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="submit"
                      disabled={authBusy}
                      style={{
                        width: '100%',
                        padding: '11px',
                        borderRadius: '8px',
                        background: 'var(--accent)',
                        color: 'var(--accent-ink)',
                        fontWeight: 600,
                        fontSize: '0.92rem',
                        border: 'none',
                        cursor: authBusy ? 'wait' : 'pointer',
                      }}
                    >
                      {authBusy ? 'Signing in...' : 'Sign In'}
                    </button>
                    {authMessage && (
                      <div
                        style={{
                          marginTop: '10px',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          fontSize: '0.82rem',
                          background: authMessage.success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                          color: authMessage.success ? '#10b981' : '#ef4444',
                          border: `1px solid ${authMessage.success ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        }}
                      >
                        {authMessage.text}
                      </div>
                    )}
                    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--line)', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--mute)' }}>Don't have Lifetime Pro yet?</span><br />
                      <a
                        href={dodoCheckoutUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: 'var(--accent)',
                          fontWeight: 600,
                          fontSize: '0.88rem',
                          textDecoration: 'none',
                          display: 'inline-block',
                          marginTop: '4px',
                        }}
                      >
                        Get Lifetime Access ($2.99) →
                      </a>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <footer
        style={{
          marginTop: '64px',
          paddingTop: '32px',
          borderTop: '1px solid var(--line)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <p
          className="small"
          style={{
            margin: 0,
            fontSize: '0.88rem',
            lineHeight: 1.6,
            color: 'var(--mute)',
            maxWidth: '520px',
            marginInline: 'auto',
          }}
        >
          WellSaid helps you word things. It isn’t legal, medical, or professional advice. Check every message before you send it.
        </p>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            fontSize: '0.88rem',
            color: 'var(--mute)',
          }}
        >
          <a href="privacy.html" style={{ color: 'var(--mute)' }}>Privacy</a>
          <span style={{ opacity: 0.5 }}>·</span>
          <a href="terms.html" style={{ color: 'var(--mute)' }}>Terms</a>
          <span style={{ opacity: 0.5 }}>·</span>
          <a href="moderation.html" style={{ color: 'var(--mute)' }}>Safety &amp; Moderation</a>
          <span style={{ opacity: 0.5 }}>·</span>
          <a href="refund.html" style={{ color: 'var(--mute)' }}>Refunds</a>
          <span style={{ opacity: 0.5 }}>·</span>
          <a href="mailto:heyy.wellsaid@gmail.com" style={{ color: 'var(--mute)' }}>Contact</a>
        </div>
      </footer>
    </main>
  );
}

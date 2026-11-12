/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

interface RewriteVersion {
  toneId: string;
  title: string;
  text: string;
}

interface RewriteResult {
  versions: RewriteVersion[];
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
  const [unlocked, setUnlocked] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

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

  const price = '$9';

  const handleRewrite = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = msg.trim();
    if (!text) {
      setErr('Please paste or type a message first.');
      return;
    }

    setLoading(true);
    setErr(null);

    try {
      const response = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          scenario: kind,
          channel: 'text',
          recipient: 'recipient',
        }),
      });

      if (!response.ok) {
        throw new Error('Something went wrong. Please try again.');
      }

      const data = await response.json();
      if (!data.versions || !Array.isArray(data.versions)) {
        throw new Error('Failed to parse rewrites.');
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

  const [checkoutNoticeOpen, setCheckoutNoticeOpen] = useState(false);

  const isCustomPaymentUrl =
    Boolean(import.meta.env.VITE_DODO_PAYMENT_URL) ||
    Boolean(typeof window !== 'undefined' && (window as any).DODO_CHECKOUT_URL);

  const dodoCheckoutUrl =
    (typeof window !== 'undefined' && (window as any).DODO_CHECKOUT_URL) ||
    import.meta.env.VITE_DODO_PAYMENT_URL ||
    'https://checkout.dodopayments.com/buy/wellsaid';

  const handleCheckoutClick = (e: React.MouseEvent) => {
    if (!isCustomPaymentUrl) {
      e.preventDefault();
      setCheckoutNoticeOpen(true);
    }
  };

  const handleUnlock = () => {
    const pricingEl = document.getElementById('pricing');
    if (pricingEl) {
      pricingEl.scrollIntoView({ behavior: 'smooth' });
    } else if (isCustomPaymentUrl) {
      window.open(dodoCheckoutUrl, '_blank', 'noopener,noreferrer');
    } else {
      setCheckoutNoticeOpen(true);
    }
  };

  const getToneTag = (toneId: string, title?: string) => {
    if (toneId === 'warm') return 'Warm & gentle';
    if (toneId === 'direct') return 'Direct & professional';
    if (toneId === 'short') return 'Short & firm';
    return title || 'Rewritten version';
  };

  return (
    <main>
      <div className="brand" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <img
          src="/favicon.png"
          alt="WellSaid logo"
          style={{ width: '24px', height: '24px', borderRadius: '6px', verticalAlign: 'middle', display: 'inline-block' }}
        />
        <span>WellSaid</span>
      </div>
      <h1>Say the hard thing, well.</h1>
      <p className="sub">
        Paste the message you’re dreading to send. Get three ready-to-send versions in seconds: warm, direct, and short.
      </p>

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
          {loading ? 'Rewriting...' : 'Rewrite it (free)'}
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
            {result.versions.length > 1 && (
              <div
                className={`card ${!unlocked ? 'locked' : 'card-selectable'}`}
                onClick={() => {
                  if (unlocked) {
                    handleSelectAndApply(result.versions[1].text, 1, getToneTag(result.versions[1].toneId, result.versions[1].title));
                  }
                }}
                title={unlocked ? 'Click to auto-replace your draft above with this tone' : undefined}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div className="tag" style={{ margin: 0 }}>{getToneTag(result.versions[1].toneId, result.versions[1].title)}</div>
                  {unlocked && (
                    <button
                      className="send-arrow-btn"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectAndApply(result.versions[1].text, 1, getToneTag(result.versions[1].toneId, result.versions[1].title));
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
                <div className="txt">{result.versions[1].text}</div>
                {!unlocked ? (
                  <div className="lock">🔒</div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                    <button
                      className="ghost"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectAndApply(result.versions[1].text, 1, getToneTag(result.versions[1].toneId, result.versions[1].title));
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
            )}

            {/* 3. Short & firm */}
            {result.versions.length > 2 && (
              <div
                className={`card ${!unlocked ? 'locked' : 'card-selectable'}`}
                onClick={() => {
                  if (unlocked) {
                    handleSelectAndApply(result.versions[2].text, 2, getToneTag(result.versions[2].toneId, result.versions[2].title));
                  }
                }}
                title={unlocked ? 'Click to auto-replace your draft above with this tone' : undefined}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div className="tag" style={{ margin: 0 }}>{getToneTag(result.versions[2].toneId, result.versions[2].title)}</div>
                  {unlocked && (
                    <button
                      className="send-arrow-btn"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectAndApply(result.versions[2].text, 2, getToneTag(result.versions[2].toneId, result.versions[2].title));
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
                <div className="txt">{result.versions[2].text}</div>
                {!unlocked ? (
                  <div className="lock">🔒</div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                    <button
                      className="ghost"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectAndApply(result.versions[2].text, 2, getToneTag(result.versions[2].toneId, result.versions[2].title));
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
            )}

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
          Want the other two tones? Unlock them for <span className="price">{price}</span>, once. No account, no subscription.
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
            $29
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
            $9
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.92rem', color: 'var(--mute)', fontFamily: 'system-ui, sans-serif' }}>
            <span style={{ color: 'var(--mute)', fontSize: '1rem', lineHeight: 1, opacity: 0.6 }}>✕</span>
            <span style={{ textDecoration: 'line-through', opacity: 0.85 }}>Account creation or password required</span>
          </div>
        </div>

        <a
          href={dodoCheckoutUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleCheckoutClick}
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
            fontSize: '0.94rem',
            fontFamily: 'Georgia, serif',
            letterSpacing: '0.02em',
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
      </section>

      {/* Graceful notice when payment gateway is awaiting URL injection */}
      {checkoutNoticeOpen && (
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
          onClick={() => setCheckoutNoticeOpen(false)}
        >
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--line)',
              borderRadius: '16px',
              padding: '28px 24px',
              maxWidth: '420px',
              width: '100%',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.2)',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 10px', fontFamily: 'Georgia, serif', fontSize: '1.3rem', color: 'var(--ink)' }}>
              Checkout Gateway
            </h3>
            <p className="sub" style={{ margin: '0 0 20px', lineHeight: 1.6, fontSize: '0.92rem' }}>
              Dodo Payments integration is active and awaiting live checkout URL. All message rewrites and companion features are currently free to preview.
            </p>
            <button
              type="button"
              onClick={() => setCheckoutNoticeOpen(false)}
              style={{
                padding: '10px 24px',
                fontSize: '0.9rem',
                borderRadius: '8px',
              }}
            >
              Continue
            </button>
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
          <a href="refund.html" style={{ color: 'var(--mute)' }}>Refunds</a>
          <span style={{ opacity: 0.5 }}>·</span>
          <a href="mailto:heyy.wellsaid@gmail.com" style={{ color: 'var(--mute)' }}>Contact</a>
          <span style={{ opacity: 0.5 }}>·</span>
          <a href="/wellsaid-extension.zip" download="wellsaid-extension.zip" style={{ color: 'var(--accent)', fontWeight: 500 }}>Extension (.zip)</a>
        </div>
      </footer>
    </main>
  );
}

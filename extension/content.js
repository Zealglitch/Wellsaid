// WellSaid Browser Extension - Grammarly-Style In-Situ Companion
(function () {
  let activeElement = null;
  let triggerBadge = null;
  let popoverHost = null;
  let popoverShadow = null;
  let typingTimer = null;
  let isWellSaidActive = false;
  let lastDraftText = '';
  let cachedResults = null;

  function init() {
    document.addEventListener('focusin', handleFocusIn, true);
    document.addEventListener('input', handleInput, true);
    window.addEventListener('resize', repositionBadge);
    window.addEventListener('scroll', repositionBadge, true);

    // Re-dock badge and restore view when user returns to this tab
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        if (activeElement && document.contains(activeElement)) {
          showOrUpdateBadge();
          repositionBadge();
        }
      }
    });
    window.addEventListener('focus', () => {
      if (activeElement && document.contains(activeElement)) {
        showOrUpdateBadge();
        repositionBadge();
      }
    });

    // Close popover when clicking outside
    document.addEventListener('mousedown', (e) => {
      if (popoverHost && !popoverHost.contains(e.target) && e.target !== triggerBadge) {
        // Keep popover open if clicking inside shadow DOM (handled inside shadow)
      }
    });
  }

  function isValidEditable(el) {
    if (!el) return false;
    if (el.tagName === 'TEXTAREA') return true;
    if (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'search' || !el.type)) return true;
    if (el.isContentEditable) return true;
    if (el.getAttribute('role') === 'textbox') return true;
    return false;
  }

  function handleFocusIn(e) {
    if (isValidEditable(e.target)) {
      activeElement = e.target;
      showOrUpdateBadge();
    }
  }

  function handleInput(e) {
    if (isValidEditable(e.target)) {
      activeElement = e.target;
      showOrUpdateBadge();

      // If active, debounce auto-detection
      if (isWellSaidActive) {
        clearTimeout(typingTimer);
        const currentText = getEditableText(activeElement);
        if (currentText.trim().length > 15 && currentText !== lastDraftText) {
          triggerBadge.innerHTML = '<span class="ws-pulse">●</span> Rewriting...';
          typingTimer = setTimeout(() => {
            fetchAndOpenTones(currentText);
          }, 1400);
        }
      }
    }
  }

  function getEditableText(el) {
    if (!el) return '';
    const sel = window.getSelection();
    if (sel && sel.toString().trim()) {
      return sel.toString().trim();
    }
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      return el.value || '';
    }
    if (el.isContentEditable) {
      return el.innerText || el.textContent || '';
    }
    return '';
  }

  function replaceTextInEditable(el, newText) {
    if (!el) return;
    el.focus();

    // Automatically copy to clipboard in background as well
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(newText);
      }
    } catch (e) {
      console.warn('Clipboard write warning', e);
    }

    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      el.value = newText;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }

    if (el.isContentEditable) {
      // Select all contents of the contenteditable so insertText cleanly replaces it
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);

      let success = false;
      try {
        success = document.execCommand('insertText', false, newText);
      } catch (err) {
        success = false;
      }
      if (!success) {
        el.innerText = newText;
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  function showOrUpdateBadge() {
    if (!triggerBadge) {
      triggerBadge = document.createElement('div');
      triggerBadge.className = 'wellsaid-floating-badge';
      triggerBadge.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleBadgeClick();
      });
      document.body.appendChild(triggerBadge);
    }

    if (isWellSaidActive) {
      triggerBadge.innerHTML = '<span class="ws-dot active">●</span> WellSaid Active';
      triggerBadge.classList.add('active');
      triggerBadge.title = 'WellSaid is active. Type your message, or click to open the 3 tones.';
    } else {
      triggerBadge.innerHTML = '<img src="' + chrome.runtime.getURL('icons/icon16.png') + '" width="14" height="14" style="border-radius:3px; vertical-align:middle; margin-right:4px;"> Activate WellSaid';
      triggerBadge.classList.remove('active');
      triggerBadge.title = 'Tap to activate WellSaid in this compose box';
    }

    repositionBadge();
    triggerBadge.style.display = 'flex';
  }

  function repositionBadge() {
    if (!triggerBadge || !activeElement || triggerBadge.style.display === 'none') return;

    const rect = activeElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      triggerBadge.style.display = 'none';
      return;
    }

    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    // Dock inside bottom-right corner of the active box
    const badgeW = triggerBadge.offsetWidth || 135;
    const badgeH = triggerBadge.offsetHeight || 28;

    const left = rect.right + scrollX - badgeW - 10;
    const top = rect.bottom + scrollY - badgeH - 8;

    triggerBadge.style.left = `${Math.max(10, left)}px`;
    triggerBadge.style.top = `${Math.max(10, top)}px`;
  }

  function handleBadgeClick() {
    if (isWellSaidActive) {
      // Reversible toggle: tap again to turn off and disappear tone suggestions
      isWellSaidActive = false;
      showOrUpdateBadge();
      closePopover();
      showToast('WellSaid turned off.');
      return;
    }

    isWellSaidActive = true;
    showOrUpdateBadge();
    showToast('WellSaid Active! Type what you want to say in your inbox.');

    const currentText = getEditableText(activeElement);
    if (!currentText.trim()) {
      showToast('Start typing your messy message in the box above.');
      return;
    }

    // If tones were already generated for this exact text, restore them immediately
    if (cachedResults && cachedResults.versions && lastDraftText === currentText) {
      renderToneCards(cachedResults.versions);
      return;
    }

    fetchAndOpenTones(currentText);
  }

  function fetchAndOpenTones(text) {
    lastDraftText = text;
    openPopoverLoading();

    chrome.runtime.sendMessage(
      {
        type: 'WELLSAID_REWRITE',
        payload: {
          message: text,
          scenario: 'General conversation',
          channel: 'email',
          recipient: 'recipient',
        },
      },
      (res) => {
        if (!res || !res.success || !res.data || !res.data.versions) {
          showPopoverError((res && res.error) || 'Could not connect. Please check connection.');
          return;
        }
        cachedResults = res.data;
        renderToneCards(res.data.versions);
      }
    );
  }

  function openPopoverLoading() {
    ensurePopoverHost();

    popoverShadow.innerHTML = `
      <style>
        .ws-popover {
          --bg: #faf7f2;
          --card: #fff;
          --ink: #1e1b18;
          --mute: #6f675f;
          --line: #e6dfd5;
          --accent: #c2410c;
          position: fixed;
          z-index: 2147483647;
          width: 440px;
          max-width: 92vw;
          max-height: 85vh;
          overflow-y: auto;
          background: var(--bg);
          color: var(--ink);
          border: 1px solid var(--line);
          border-radius: 14px;
          box-shadow: 0 16px 42px rgba(0,0,0,0.22);
          padding: 16px;
          font: 14px/1.55 Georgia, serif;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
        * { box-sizing: border-box; }
        .ws-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
        .ws-brand { font: 700 1rem system-ui, sans-serif; color: var(--accent); }
        .ws-close { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--mute); padding: 4px; border-radius: 4px; }
        .ws-sub { font: 0.85rem system-ui, sans-serif; color: var(--mute); margin: 0 0 14px; }
        .ws-loader { text-align: center; padding: 28px 0; color: var(--mute); font-family: system-ui, sans-serif; font-size: 0.9rem; }
        .ws-spinner { display: inline-block; width: 22px; height: 22px; border: 2px solid var(--line); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 8px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      </style>
      <div class="ws-popover">
        <p class="ws-sub">Select one tone to automatically replace your draft in the inbox:</p>
        <div class="ws-loader">
          <div class="ws-spinner"></div>
          <div>Rewriting your draft in 3 tones...</div>
        </div>
      </div>
    `;
  }

  function renderToneCards(versions) {
    if (!popoverShadow) return;

    const cardsHtml = versions
      .map((v, i) => {
        const title =
          v.toneId === 'warm'
            ? '1. Warm & gentle'
            : v.toneId === 'direct'
            ? '2. Direct & professional'
            : '3. Short & firm';

        return `
        <div class="ws-card" data-index="${i}">
          <div class="ws-card-header">
            <span class="ws-tag">${title}</span>
            <button class="ws-send-btn" data-index="${i}" title="Insert into inbox" aria-label="Insert into inbox">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>
          <div class="ws-txt">${escapeHtml(v.text)}</div>
        </div>
      `;
      })
      .join('');

    popoverShadow.innerHTML = `
      <style>
        .ws-popover {
          --bg: #faf7f2;
          --card: #fff;
          --ink: #1e1b18;
          --mute: #6f675f;
          --line: #e6dfd5;
          --accent: #c2410c;
          position: fixed;
          z-index: 2147483647;
          width: 460px;
          max-width: 92vw;
          max-height: 85vh;
          overflow-y: auto;
          background: var(--bg);
          color: var(--ink);
          border: 1px solid var(--line);
          border-radius: 18px;
          box-shadow: 0 16px 42px rgba(0,0,0,0.22);
          padding: 18px;
          font: 14px/1.55 Georgia, serif;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
        * { box-sizing: border-box; }
        .ws-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
        .ws-brand { font: 700 1rem system-ui, sans-serif; color: var(--accent); }
        .ws-close { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--mute); padding: 4px; border-radius: 6px; }
        .ws-close:hover { color: var(--ink); background: var(--line); }
        .ws-sub { font: 0.82rem system-ui, sans-serif; color: var(--mute); margin: 0 0 12px; }
        .ws-card { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 12px; margin-bottom: 10px; cursor: pointer; transition: border-color 0.15s ease, box-shadow 0.15s ease; }
        .ws-card:hover { border-color: var(--accent); box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .ws-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
        .ws-tag { font: 700 0.72rem system-ui, sans-serif; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent); }
        .ws-send-btn {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: var(--accent);
          color: #fff;
          border: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.15s ease, opacity 0.15s ease;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
        }
        .ws-send-btn:hover {
          transform: scale(1.08);
          opacity: 0.94;
        }
        .ws-txt { white-space: pre-wrap; font-size: 0.88rem; line-height: 1.5; color: var(--ink); }
        .ws-card-tip { margin-top: 6px; font: 0.72rem system-ui, sans-serif; color: var(--mute); }
        .ws-footer { margin-top: 10px; text-align: center; font: 0.75rem system-ui, sans-serif; color: var(--mute); }
      </style>
      <div class="ws-popover">
        <div class="ws-head">
          <span class="ws-brand" style="display:flex; align-items:center; gap:6px;"><img src="${chrome.runtime.getURL('icons/icon16.png')}" width="16" height="16" style="border-radius:3px;"> WellSaid</span>
          <button class="ws-close" id="ws-popover-close" title="Close" aria-label="Close">✕</button>
        </div>
        <p class="ws-sub">Select any tone to automatically paste it into your message:</p>
        <div id="ws-card-list">${cardsHtml}</div>
        <div class="ws-footer">Auto-replaced in your inbox &amp; copied to clipboard. Ready to edit or send.</div>
      </div>
    `;

    popoverShadow.getElementById('ws-popover-close')?.addEventListener('click', closePopover);

    // Add click listeners to insert chosen tone from card or button
    popoverShadow.querySelectorAll('.ws-card').forEach((card) => {
      card.addEventListener('click', () => {
        const idx = Number(card.getAttribute('data-index'));
        const chosen = versions[idx];
        if (chosen && activeElement) {
          replaceTextInEditable(activeElement, chosen.text);
          showToast(`✓ Auto-pasted into message! Ready to send.`);
          closePopover();
        }
      });
    });
  }

  function showPopoverError(errMsg) {
    if (!popoverShadow) return;
    const body = popoverShadow.querySelector('.ws-popover');
    if (body) {
      body.innerHTML = `
        <div style="color:#b91c1c;font-family:system-ui,sans-serif;padding:12px;font-size:0.9rem;">
          ${escapeHtml(errMsg)}
          <br><br>
          <button id="ws-err-close" style="padding:6px 12px;background:#c2410c;color:#fff;border:0;border-radius:6px;cursor:pointer;">Close</button>
        </div>
      `;
      popoverShadow.getElementById('ws-err-close').addEventListener('click', closePopover);
    }
  }

  function ensurePopoverHost() {
    if (!popoverHost) {
      popoverHost = document.createElement('div');
      popoverHost.id = 'wellsaid-popover-host';
      popoverShadow = popoverHost.attachShadow({ mode: 'open' });
      document.body.appendChild(popoverHost);
    }
  }

  function closePopover() {
    if (popoverHost) {
      popoverHost.remove();
      popoverHost = null;
      popoverShadow = null;
    }
    if (activeElement) {
      activeElement.focus();
    }
  }

  function showToast(text) {
    const toast = document.createElement('div');
    toast.className = 'wellsaid-toast';
    toast.textContent = text;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  init();
})();

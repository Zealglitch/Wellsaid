document.addEventListener('DOMContentLoaded', () => {
  const goBtn = document.getElementById('go');
  const msgInput = document.getElementById('msg');
  const kindSelect = document.getElementById('kind');
  const errDiv = document.getElementById('err');
  const outDiv = document.getElementById('out');
  const clearBtn = document.getElementById('clear-btn');
  const closeBtn = document.getElementById('close-btn');
  const topSection = document.getElementById('top-section');

  // Auth UI elements
  const proBadge = document.getElementById('pro-badge');
  const accountBtn = document.getElementById('account-btn');
  const authModal = document.getElementById('auth-modal');
  const authCloseBtn = document.getElementById('auth-close-btn');
  const authActiveView = document.getElementById('auth-active-view');
  const authFormView = document.getElementById('auth-form-view');
  const authUserEmail = document.getElementById('auth-user-email');
  const authEmailInput = document.getElementById('auth-email-input');
  const authSubmitBtn = document.getElementById('auth-submit-btn');
  const authMsg = document.getElementById('auth-msg');
  const signOutBtn = document.getElementById('sign-out-btn');

  let isPro = false;
  let currentUserEmail = '';

  // 1. Check Authentication status on load
  function refreshAuth(callback) {
    chrome.storage.sync.get(['isPro', 'userEmail', 'licenseKey'], (res) => {
      isPro = Boolean(res.isPro);
      currentUserEmail = res.userEmail || '';

      if (isPro) {
        if (proBadge) proBadge.style.display = 'inline-block';
        if (accountBtn) accountBtn.textContent = 'Account';
        if (authActiveView) authActiveView.style.display = 'block';
        if (authFormView) authFormView.style.display = 'none';
        if (authUserEmail) authUserEmail.textContent = currentUserEmail || 'Active Lifetime License';
      } else {
        if (proBadge) proBadge.style.display = 'none';
        if (accountBtn) accountBtn.textContent = 'Sign In';
        if (authActiveView) authActiveView.style.display = 'none';
        if (authFormView) authFormView.style.display = 'block';
      }

      if (callback) callback();
    });
  }

  refreshAuth();

  // 2. Open / Close Auth Modal
  if (accountBtn) {
    accountBtn.addEventListener('click', () => {
      refreshAuth(() => {
        if (authModal) authModal.style.display = 'flex';
      });
    });
  }

  if (authCloseBtn) {
    authCloseBtn.addEventListener('click', () => {
      if (authModal) authModal.style.display = 'none';
      if (authMsg) authMsg.style.display = 'none';
    });
  }

  // 3. Handle Sign In / License Activation
  if (authSubmitBtn) {
    authSubmitBtn.addEventListener('click', () => {
      const input = (authEmailInput.value || '').trim();
      if (!input) {
        showAuthMsg('Please enter your email or license code.', false);
        return;
      }

      const isEmail = input.includes('@');
      const isKey = input.toUpperCase().startsWith('WS-');

      if (!isEmail && !isKey && input.length < 4) {
        showAuthMsg('Please enter a valid checkout email or license code.', false);
        return;
      }

      const generatedKey = isKey ? input.toUpperCase() : 'WS-PRO-' + Math.floor(1000 + Math.random() * 9000);
      const emailToSave = isEmail ? input.toLowerCase() : 'Customer';

      chrome.storage.sync.set(
        {
          isPro: true,
          userEmail: emailToSave,
          licenseKey: generatedKey,
          activatedAt: Date.now(),
        },
        () => {
          showAuthMsg('✓ Pro License Activated! All tones unlocked.', true);
          setTimeout(() => {
            if (authModal) authModal.style.display = 'none';
            refreshAuth(() => {
              // Re-render current results if open
              chrome.storage.local.get(['savedVersions'], (r) => {
                if (r.savedVersions && r.savedVersions.length > 0) {
                  renderTones(r.savedVersions);
                }
              });
            });
          }, 1200);
        }
      );
    });
  }

  // 4. Handle Sign Out
  if (signOutBtn) {
    signOutBtn.addEventListener('click', () => {
      chrome.storage.sync.remove(['isPro', 'userEmail', 'licenseKey', 'activatedAt'], () => {
        refreshAuth(() => {
          if (authModal) authModal.style.display = 'none';
          chrome.storage.local.get(['savedVersions'], (r) => {
            if (r.savedVersions && r.savedVersions.length > 0) {
              renderTones(r.savedVersions);
            }
          });
        });
      });
    });
  }

  function showAuthMsg(text, success) {
    if (!authMsg) return;
    authMsg.textContent = text;
    authMsg.style.display = 'block';
    authMsg.style.background = success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
    authMsg.style.color = success ? '#10b981' : '#ef4444';
    authMsg.style.border = '1px solid ' + (success ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)');
  }

  // Close extension popup when cross is clicked
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      window.close();
    });
  }

  // Restore saved state across tab switches
  chrome.storage.local.get(['savedDraft', 'savedKind', 'savedVersions'], (res) => {
    if (res.savedDraft) {
      msgInput.value = res.savedDraft;
    }
    if (res.savedKind) {
      kindSelect.value = res.savedKind;
    }
    if (res.savedDraft && res.savedDraft.trim() && res.savedVersions && Array.isArray(res.savedVersions) && res.savedVersions.length > 0) {
      refreshAuth(() => {
        renderTones(res.savedVersions);
      });
    } else {
      outDiv.innerHTML = '';
      outDiv.style.display = 'none';
      topSection?.classList.remove('has-results');
    }
  });

  // Persist draft continuously on every keystroke & auto-hide results when input is empty
  msgInput.addEventListener('input', () => {
    const val = msgInput.value;
    chrome.storage.local.set({ savedDraft: val });

    if (!val.trim()) {
      outDiv.innerHTML = '';
      outDiv.style.display = 'none';
      topSection?.classList.remove('has-results');
      errDiv.style.display = 'none';
      chrome.storage.local.remove(['savedVersions']);
    }
  });

  kindSelect.addEventListener('change', () => {
    chrome.storage.local.set({ savedKind: kindSelect.value });
  });

  // Clear button to start a fresh draft
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      msgInput.value = '';
      outDiv.innerHTML = '';
      outDiv.style.display = 'none';
      topSection?.classList.remove('has-results');
      errDiv.style.display = 'none';
      chrome.storage.local.remove(['savedDraft', 'savedVersions']);
      msgInput.focus();
    });
  }

  // Handle Rewrite button click
  goBtn.addEventListener('click', async () => {
    const text = msgInput.value.trim();
    if (!text) {
      errDiv.textContent = 'Please enter a message.';
      errDiv.style.display = 'block';
      outDiv.style.display = 'none';
      topSection?.classList.remove('has-results');
      return;
    }

    errDiv.style.display = 'none';
    goBtn.disabled = true;
    goBtn.textContent = 'Rewriting...';

    chrome.runtime.sendMessage(
      {
        type: 'WELLSAID_REWRITE',
        payload: {
          message: text,
          scenario: kindSelect.value,
          channel: 'text',
          recipient: 'recipient',
        },
      },
      (response) => {
        goBtn.disabled = false;
        goBtn.textContent = 'Rewrite it';

        if (!response || !response.success || !response.data || !response.data.versions) {
          errDiv.textContent = (response && response.error) || 'Failed to rewrite. Check connection.';
          errDiv.style.display = 'block';
          outDiv.style.display = 'none';
          topSection?.classList.remove('has-results');
          return;
        }

        chrome.storage.local.set({
          savedDraft: text,
          savedKind: kindSelect.value,
          savedVersions: response.data.versions,
        });

        refreshAuth(() => {
          renderTones(response.data.versions);
        });
      }
    );
  });

  function renderTones(versions) {
    if (!versions || versions.length === 0) {
      outDiv.innerHTML = '';
      outDiv.style.display = 'none';
      topSection?.classList.remove('has-results');
      return;
    }

    outDiv.innerHTML = '';
    outDiv.style.display = 'flex';
    topSection?.classList.add('has-results');
    outDiv.scrollTop = 0;

    versions.forEach((v, idx) => {
      const isLocked = !isPro && idx > 0;
      const card = document.createElement('div');
      card.className = isLocked ? 'card card-locked' : 'card';

      const tagText =
        v.toneId === 'warm'
          ? 'Warm & gentle'
          : v.toneId === 'direct'
          ? 'Direct & professional'
          : 'Short & firm';

      if (!isLocked) {
        card.style.cursor = 'pointer';
        card.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div class="tag">${tagText}</div>
            ${!isPro && idx === 0 ? '<span style="font-size:0.68rem; color:var(--accent); font-weight:700; text-transform:uppercase;">Free</span>' : ''}
          </div>
          <div class="txt">${escapeHtml(v.text)}</div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
            <button class="ghost">Copy</button>
            <span style="font-size:0.75rem; color:var(--mute); font-family:system-ui,sans-serif;">Tap to copy</span>
          </div>
        `;

        const copyBtn = card.querySelector('button.ghost');
        const doCopy = () => {
          navigator.clipboard.writeText(v.text);
          copyBtn.textContent = '✓ Copied!';
          copyBtn.style.color = 'var(--accent)';
          copyBtn.style.borderColor = 'var(--accent)';
          setTimeout(() => {
            copyBtn.textContent = 'Copy';
            copyBtn.style.color = '';
            copyBtn.style.borderColor = '';
          }, 2000);
        };

        card.addEventListener('click', doCopy);
        copyBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          doCopy();
        });
      } else {
        // Locked card representation
        card.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <div class="tag" style="margin:0;">${tagText}</div>
            <span class="lock-pill">🔒 PRO</span>
          </div>
          <div class="txt">${escapeHtml(v.text)}</div>
        `;

        card.addEventListener('click', () => {
          chrome.tabs.create({ url: 'https://dodo.pe/wellsaid' });
        });
      }

      outDiv.appendChild(card);
    });

    // If user is on free tier, add high-converting conversion box
    if (!isPro) {
      const unlockBox = document.createElement('div');
      unlockBox.className = 'unlock-box';
      unlockBox.innerHTML = `
        <div style="font-weight:700; font-size:0.92rem; color:var(--ink); margin-bottom:4px;">
          Unlock All 3 Tones ($2.99 once)
        </div>
        <div style="font-size:0.78rem; color:var(--mute); margin-bottom:10px; line-height:1.4;">
          Pay once, use forever. Unlocks Direct & professional and Short & firm versions for all messages.
        </div>
        <button id="in-popup-unlock-btn" class="go" style="margin-top:0; padding:10px; font-size:0.9rem;">
          Unlock for $2.99
        </button>
        <div style="margin-top:8px;">
          <a href="#" id="in-popup-restore-btn" style="color:var(--mute); font-size:0.75rem; text-decoration:underline;">Already purchased? Sign In / Activate</a>
        </div>
      `;

      const unlockBtn = unlockBox.querySelector('#in-popup-unlock-btn');
      unlockBtn.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: 'https://dodo.pe/wellsaid' });
      });

      const restoreBtn = unlockBox.querySelector('#in-popup-restore-btn');
      restoreBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (authModal) authModal.style.display = 'flex';
      });

      outDiv.appendChild(unlockBox);
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
});

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
  const signupBtn = document.getElementById('signup-btn');
  const accountBtn = document.getElementById('account-btn');
  const authModal = document.getElementById('auth-modal');
  const authCloseBtn = document.getElementById('auth-close-btn');
  const authModalTitle = document.getElementById('auth-modal-title');
  const authActiveView = document.getElementById('auth-active-view');
  const authLoggedOutContainer = document.getElementById('auth-logged-out-container');
  const authActiveStatus = document.getElementById('auth-active-status');
  const authUserEmail = document.getElementById('auth-user-email');
  
  // Tab elements
  const tabSignupBtn = document.getElementById('tab-signup-btn');
  const tabSigninBtn = document.getElementById('tab-signin-btn');
  const authSignupView = document.getElementById('auth-signup-view');
  const authSigninView = document.getElementById('auth-signin-view');
  const signupEmailInput = document.getElementById('signup-email-input');
  const signupSubmitBtn = document.getElementById('signup-submit-btn');
  const authEmailInput = document.getElementById('auth-email-input');
  const authSubmitBtn = document.getElementById('auth-submit-btn');
  const gotoSigninLink = document.getElementById('goto-signin-link');
  const gotoSignupLink = document.getElementById('goto-signup-link');
  const authMsg = document.getElementById('auth-msg');
  const signOutBtn = document.getElementById('sign-out-btn');

  let isPro = false;
  let currentUserEmail = '';

  function switchTab(mode) {
    if (authMsg) authMsg.style.display = 'none';
    if (mode === 'signup') {
      if (tabSignupBtn) {
        tabSignupBtn.style.background = 'var(--card)';
        tabSignupBtn.style.color = 'var(--ink)';
        tabSignupBtn.style.fontWeight = '700';
      }
      if (tabSigninBtn) {
        tabSigninBtn.style.background = 'transparent';
        tabSigninBtn.style.color = 'var(--mute)';
        tabSigninBtn.style.fontWeight = '500';
      }
      if (authSignupView) authSignupView.style.display = 'block';
      if (authSigninView) authSigninView.style.display = 'none';
      if (authModalTitle) authModalTitle.textContent = 'Create Free Account';
      if (signupEmailInput) setTimeout(() => signupEmailInput.focus(), 50);
    } else {
      if (tabSigninBtn) {
        tabSigninBtn.style.background = 'var(--card)';
        tabSigninBtn.style.color = 'var(--ink)';
        tabSigninBtn.style.fontWeight = '700';
      }
      if (tabSignupBtn) {
        tabSignupBtn.style.background = 'transparent';
        tabSignupBtn.style.color = 'var(--mute)';
        tabSignupBtn.style.fontWeight = '500';
      }
      if (authSigninView) authSigninView.style.display = 'block';
      if (authSignupView) authSignupView.style.display = 'none';
      if (authModalTitle) authModalTitle.textContent = 'Sign In';
      if (authEmailInput) setTimeout(() => authEmailInput.focus(), 50);
    }
  }

  if (tabSignupBtn) tabSignupBtn.addEventListener('click', () => switchTab('signup'));
  if (tabSigninBtn) tabSigninBtn.addEventListener('click', () => switchTab('signin'));
  if (gotoSigninLink) {
    gotoSigninLink.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab('signin');
    });
  }
  if (gotoSignupLink) {
    gotoSignupLink.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab('signup');
    });
  }

  // 1. Check Authentication status on load
  function refreshAuth(callback) {
    chrome.storage.sync.get(['isPro', 'userEmail', 'licenseKey'], (res) => {
      isPro = Boolean(res.isPro);
      currentUserEmail = res.userEmail || '';

      if (isPro) {
        if (proBadge) proBadge.style.display = 'inline-block';
        if (signupBtn) signupBtn.style.display = 'none';
        if (accountBtn) accountBtn.textContent = 'Account';
        if (authActiveView) authActiveView.style.display = 'block';
        if (authLoggedOutContainer) authLoggedOutContainer.style.display = 'none';
        if (authActiveStatus) authActiveStatus.textContent = '✓ Lifetime Pro Active';
        if (authUserEmail) authUserEmail.textContent = currentUserEmail || 'Active Lifetime License';
        if (authModalTitle) authModalTitle.textContent = 'WellSaid Pro Account';
      } else if (currentUserEmail) {
        if (proBadge) proBadge.style.display = 'none';
        if (signupBtn) signupBtn.style.display = 'none';
        if (accountBtn) accountBtn.textContent = 'Account';
        if (authActiveView) authActiveView.style.display = 'block';
        if (authLoggedOutContainer) authLoggedOutContainer.style.display = 'none';
        if (authActiveStatus) authActiveStatus.textContent = 'Free Account Active';
        if (authUserEmail) authUserEmail.textContent = currentUserEmail;
        if (authModalTitle) authModalTitle.textContent = 'WellSaid Account';
      } else {
        if (proBadge) proBadge.style.display = 'none';
        if (signupBtn) signupBtn.style.display = 'inline-block';
        if (accountBtn) accountBtn.textContent = 'Sign In';
        if (authActiveView) authActiveView.style.display = 'none';
        if (authLoggedOutContainer) authLoggedOutContainer.style.display = 'block';
        if (authModalTitle) authModalTitle.textContent = 'WellSaid Account';
      }

      if (callback) callback();
    });
  }

  refreshAuth();

  // 2. Open / Close Auth Modal
  if (signupBtn) {
    signupBtn.addEventListener('click', () => {
      refreshAuth(() => {
        switchTab('signup');
        if (authModal) authModal.style.display = 'flex';
      });
    });
  }

  if (accountBtn) {
    accountBtn.addEventListener('click', () => {
      refreshAuth(() => {
        if (!isPro && !currentUserEmail) {
          switchTab('signin');
        }
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

  // 3. Handle Sign Up (Free Account)
  if (signupSubmitBtn) {
    signupSubmitBtn.addEventListener('click', () => {
      const email = (signupEmailInput.value || '').trim();
      if (!email || !email.includes('@')) {
        showAuthMsg('Please enter a valid email address.', false);
        return;
      }

      chrome.storage.sync.set(
        {
          userEmail: email.toLowerCase(),
          hasAccount: true,
          signedUpAt: Date.now(),
        },
        () => {
          showAuthMsg('✓ Free Account created! Welcome to WellSaid.', true);
          setTimeout(() => {
            if (authModal) authModal.style.display = 'none';
            refreshAuth();
          }, 1200);
        }
      );
    });
  }

  // 4. Handle Sign In / License Activation
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

  // 5. Handle Sign Out
  if (signOutBtn) {
    signOutBtn.addEventListener('click', () => {
      chrome.storage.sync.remove(['isPro', 'userEmail', 'licenseKey', 'activatedAt', 'hasAccount'], () => {
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
        <div style="margin-top:8px; display:flex; justify-content:center; gap:8px; font-size:0.75rem;">
          <a href="#" id="in-popup-signup-btn" style="color:var(--accent); font-weight:600; text-decoration:underline;">Sign Up Free</a>
          <span style="color:var(--mute);">·</span>
          <a href="#" id="in-popup-restore-btn" style="color:var(--mute); text-decoration:underline;">Sign In / Activate</a>
        </div>
      `;

      const unlockBtn = unlockBox.querySelector('#in-popup-unlock-btn');
      unlockBtn.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: 'https://dodo.pe/wellsaid' });
      });

      const inPopupSignupBtn = unlockBox.querySelector('#in-popup-signup-btn');
      if (inPopupSignupBtn) {
        inPopupSignupBtn.addEventListener('click', (e) => {
          e.preventDefault();
          switchTab('signup');
          if (authModal) authModal.style.display = 'flex';
        });
      }

      const restoreBtn = unlockBox.querySelector('#in-popup-restore-btn');
      restoreBtn.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab('signin');
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

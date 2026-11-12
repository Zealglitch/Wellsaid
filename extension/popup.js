document.addEventListener('DOMContentLoaded', () => {
  const goBtn = document.getElementById('go');
  const msgInput = document.getElementById('msg');
  const kindSelect = document.getElementById('kind');
  const errDiv = document.getElementById('err');
  const outDiv = document.getElementById('out');
  const clearBtn = document.getElementById('clear-btn');
  const closeBtn = document.getElementById('close-btn');
  const topSection = document.getElementById('top-section');

  // Close extension popup when cross is clicked
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      window.close();
    });
  }

  // 1. Restore saved state across tab switches
  chrome.storage.local.get(['savedDraft', 'savedKind', 'savedVersions'], (res) => {
    if (res.savedDraft) {
      msgInput.value = res.savedDraft;
    }
    if (res.savedKind) {
      kindSelect.value = res.savedKind;
    }
    // Only restore and show tone box if message is not empty and versions exist
    if (res.savedDraft && res.savedDraft.trim() && res.savedVersions && Array.isArray(res.savedVersions) && res.savedVersions.length > 0) {
      renderTones(res.savedVersions);
    } else {
      outDiv.innerHTML = '';
      outDiv.style.display = 'none';
      topSection?.classList.remove('has-results');
    }
  });

  // 2. Persist draft continuously on every keystroke & auto-hide results when input is empty
  msgInput.addEventListener('input', () => {
    const val = msgInput.value;
    chrome.storage.local.set({ savedDraft: val });

    // When the inbox/message is empty, immediately disappear the results box
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

  // 3. Clear button to start a fresh draft
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

  // 4. Handle Rewrite button click
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

        // Save generated tones so tab switches won't lose them
        chrome.storage.local.set({
          savedDraft: text,
          savedKind: kindSelect.value,
          savedVersions: response.data.versions,
        });

        renderTones(response.data.versions);
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

    versions.forEach((v) => {
      const card = document.createElement('div');
      card.className = 'card';

      const tagText =
        v.toneId === 'warm'
          ? 'Warm & gentle'
          : v.toneId === 'direct'
          ? 'Direct & professional'
          : 'Short & firm';

      card.style.cursor = 'pointer';
      card.innerHTML = `
        <div class="tag">${tagText}</div>
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

      outDiv.appendChild(card);
    });
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

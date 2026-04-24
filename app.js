const POLL_INTERVAL = 2000;
let lastSeen = Date.now();
let pollTimer = null;
let apiUrl = '';
let isConnected = false;

const statusEl = document.getElementById('status');
const apiInput = document.getElementById('apiUrl');
const toastsEl = document.getElementById('toasts');

async function initOBR() {
  if (typeof OBR === 'undefined') {
    setTimeout(initOBR, 500);
    return;
  }

  OBR.onReady(async () => {
    try {
      const metadata = await OBR.room.getMetadata();
      const saved = metadata['trpg-sheet.dice/config'];
      if (saved?.apiUrl) {
        apiUrl = saved.apiUrl;
        apiInput.value = apiUrl;
        startPolling();
      }
    } catch(e) {}

    apiInput.addEventListener('change', async () => {
      apiUrl = apiInput.value.trim();
      try {
        await OBR.room.setMetadata({ 'trpg-sheet.dice/config': { apiUrl } });
      } catch(e) {}
      startPolling();
    });
  });
}

function startPolling() {
  if (pollTimer) clearInterval(pollTimer);
  if (!apiUrl) return;
  poll();
  pollTimer = setInterval(poll, POLL_INTERVAL);
}

async function poll() {
  if (!apiUrl) return;
  try {
    const res = await fetch(`${apiUrl}/dice/recent?since=${lastSeen}`);
    if (!res.ok) throw new Error('bad response');
    const rolls = await res.json();
    isConnected = true;
    statusEl.className = 'status connected';
    for (const roll of rolls) {
      showToast(roll);
      if (roll.timestamp > lastSeen) lastSeen = roll.timestamp;
    }
  } catch {
    isConnected = false;
    statusEl.className = 'status error';
  }
}

function showToast(roll) {
  const { result, expression, characterName, username, system, min, max } = roll;
  let type = 'normal';
  if (result === max) type = 'legendary';
  else if (result === min) type = 'catastrophic';

  let label = '';
  if (system === 'DUNGEON_WORLD') {
    if (result >= 10) label = '⚔ Strong Hit (10+)';
    else if (result >= 7) label = '🛡 Partial Hit (7-9)';
    else label = '💀 Miss (6-)';
  } else if (system === 'CAIN') {
    label = result >= 4 ? `✅ ${result} Success${result > 1 ? 'es' : ''}` : '❌ Divine Agony';
  }

  const name = characterName || username || 'Unknown';
  const icon = type === 'legendary' ? '✨' : type === 'catastrophic' ? '💀' : '🎲';
  const labelClass = system === 'DUNGEON_WORLD' ? (result >= 10 ? 'hit' : result >= 7 ? 'partial' : 'miss') : '';

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-header">
      <div class="toast-char">${icon} ${name}</div>
      <div class="toast-system">${(system || '').replace('_', ' ')}</div>
    </div>
    <div class="toast-body">
      <div class="toast-number">${result}</div>
      <div class="toast-detail">
        <div class="toast-expr">${expression || ''}</div>
        ${label ? `<div class="toast-label ${labelClass}">${label}</div>` : ''}
      </div>
    </div>
  `;
  toastsEl.prepend(toast);

  setTimeout(() => {
    toast.classList.add('fadeout');
    setTimeout(() => toast.remove(), 400);
  }, 6000);
}

initOBR();

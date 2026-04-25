var api = localStorage.getItem('trpg_api') || '';
var last = Date.now();
var timer = null;
var st = document.getElementById('st');
var urlEl = document.getElementById('url');
var toasts = document.getElementById('toasts');

urlEl.value = api;

// Init OBR
var obrReady = false;
if (typeof OBRModule !== 'undefined' && OBRModule.default) {
  var OBR = OBRModule.default;
  OBR.onReady(function() {
    obrReady = true;
  });
} else if (typeof OBR !== 'undefined') {
  OBR.onReady(function() {
    obrReady = true;
  });
}

urlEl.addEventListener('change', function() {
  api = urlEl.value.trim();
  localStorage.setItem('trpg_api', api);
  restart();
});

function restart() {
  clearInterval(timer);
  if (!api) return;
  poll();
  timer = setInterval(poll, 2000);
}

function poll() {
  if (!api) return;
  fetch(api + '/dice/recent?since=' + last)
    .then(function(r) { if (!r.ok) throw 0; return r.json(); })
    .then(function(rolls) {
      st.className = 'status on';
      rolls.forEach(function(roll) {
        showToast(roll);
        if (obrReady) showOBRNotification(roll);
        if (roll.timestamp > last) last = roll.timestamp;
      });
    })
    .catch(function() { st.className = 'status err'; });
}

function showOBRNotification(roll) {
  var name = roll.characterName || roll.username || '?';
  var result = roll.result;
  var system = roll.system || '';
  var lbl = '';
  var variant = 'DEFAULT';
  if (system === 'DUNGEON_WORLD') {
    if (result >= 10) { lbl = ' — Strong Hit!'; variant = 'SUCCESS'; }
    else if (result >= 7) { lbl = ' — Partial Hit'; variant = 'WARNING'; }
    else { lbl = ' — Miss'; variant = 'ERROR'; }
  } else if (system === 'CAIN') {
    if (result >= 4) { lbl = ' — Success'; variant = 'SUCCESS'; }
    else { lbl = ' — Agony'; variant = 'ERROR'; }
  }
  try {
    var theOBR = (typeof OBRModule !== 'undefined' && OBRModule.default) ? OBRModule.default : OBR;
    theOBR.notification.show('\uD83C\uDFB2 ' + name + ' rolled ' + result + lbl, variant);
  } catch(e) {}
}

function showToast(roll) {
  var result = roll.result, expression = roll.expression,
      characterName = roll.characterName, username = roll.username,
      system = roll.system || '', min = roll.min, max = roll.max;
  var type = result === max ? 'leg' : result === min ? 'cat' : '';
  var name = characterName || username || '?';
  var icon = type === 'leg' ? '\u2728' : type === 'cat' ? '\uD83D\uDC80' : '\uD83C\uDFB2';
  var lbl = '', lblClass = '';
  if (system === 'DUNGEON_WORLD') {
    if (result >= 10) { lbl = 'Strong Hit (10+)'; lblClass = 'hit'; }
    else if (result >= 7) { lbl = 'Partial Hit (7-9)'; lblClass = 'partial'; }
    else { lbl = 'Miss (6-)'; lblClass = 'miss'; }
  } else if (system === 'CAIN') {
    lbl = result >= 4 ? 'Success' : 'Agony';
    lblClass = result >= 4 ? 'hit' : 'miss';
  }
  var d = document.createElement('div');
  d.className = 'toast ' + type;
  d.innerHTML =
    '<div class="th"><div class="tn">' + icon + ' ' + name + '</div>' +
    '<div class="ts">' + system.replace('_',' ') + '</div></div>' +
    '<div class="tb"><div class="num">' + result + '</div><div>' +
    '<div style="font-size:9px;color:#555;font-family:monospace">' + (expression||'') + '</div>' +
    (lbl ? '<div class="lbl ' + lblClass + '">' + lbl + '</div>' : '') +
    '</div></div>';
  toasts.prepend(d);
  setTimeout(function() {
    d.classList.add('out');
    setTimeout(function() { d.remove(); }, 300);
  }, 5000);
}

restart();

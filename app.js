// Inject risk die styles
(function() {
  var s = document.createElement('style');
  s.textContent = '.entry-risk { font-size: 10px; color: #f0a500; margin-top: 2px; } .entry-risk.risk-bad { color: #ff4444; font-weight: bold; animation: pulse 1s infinite; } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }';
  document.head.appendChild(s);
})();

var api = localStorage.getItem('trpg_api') || '';
var campId = localStorage.getItem('trpg_camp') || '';
var last = Date.now();
var timer = null;
var st = document.getElementById('st');
var urlEl = document.getElementById('url');
var campEl = document.getElementById('campId');
var log = document.getElementById('log');

urlEl.value = api;
campEl.value = campId;

var OBR = (typeof OBRModule !== 'undefined' && OBRModule.default) ? OBRModule.default : null;
var obrReady = false;

if (OBR) {
  OBR.onReady(function() {
    obrReady = true;
    OBR.room.getMetadata().then(function(meta) {
      if (meta['trpg-dice/api'] && !api) {
        api = meta['trpg-dice/api'];
        urlEl.value = api;
      }
      if (meta['trpg-dice/camp'] && !campId) {
        campId = meta['trpg-dice/camp'];
        campEl.value = campId;
      }
      if (api) restart();
    }).catch(function() {});
  });
}

urlEl.addEventListener('change', function() {
  api = urlEl.value.trim();
  localStorage.setItem('trpg_api', api);
  if (OBR && obrReady) OBR.room.setMetadata({ 'trpg-dice/api': api }).catch(function() {});
  restart();
});

campEl.addEventListener('change', function() {
  campId = campEl.value.trim();
  localStorage.setItem('trpg_camp', campId);
  if (OBR && obrReady) OBR.room.setMetadata({ 'trpg-dice/camp': campId }).catch(function() {});
  last = Date.now(); // reset so we don't load old rolls
  restart();
});

function clearLog() { log.innerHTML = ''; }

function restart() {
  clearInterval(timer);
  if (!api) return;
  poll();
  timer = setInterval(poll, 500);
}

function buildUrl() {
  var url = api + '/dice/recent?since=' + last;
  if (campId) url += '&campaignId=' + encodeURIComponent(campId);
  return url;
}

function poll() {
  if (!api) return;
  fetch(buildUrl())
    .then(function(r) { if (!r.ok) throw 0; return r.json(); })
    .then(function(rolls) {
      st.className = 'status on';
      rolls.forEach(function(roll) {
        addLogEntry(roll);
        if (obrReady && OBR) showOBRNotification(roll);
        if (roll.timestamp > last) last = roll.timestamp;
      });
    })
    .catch(function() { st.className = 'status err'; });
}

function showOBRNotification(roll) {
  var name = roll.characterName || roll.username || '?';
  var result = roll.result;
  var system = roll.system || '';
  var icon = system === 'DUNGEON_WORLD'
    ? (result >= 10 ? '\u2694\uFE0F' : result >= 7 ? '\uD83D\uDEE1\uFE0F' : '\uD83D\uDC80')
    : system === 'CAIN' ? (result >= 4 ? '\u2705' : '\u274C') : '\uD83C\uDFB2';
  var variant = system === 'DUNGEON_WORLD'
    ? (result >= 10 ? 'SUCCESS' : result >= 7 ? 'WARNING' : 'ERROR')
    : system === 'CAIN' ? (result >= 4 ? 'SUCCESS' : 'ERROR') : 'DEFAULT';
  OBR.notification.show(icon + ' ' + name + ' \u2014 ' + result, variant).catch(function() {});
}

function addLogEntry(roll) {
  var result = roll.result, expression = roll.expression,
      characterName = roll.characterName, username = roll.username,
      system = roll.system || '', min = roll.min, max = roll.max;
  var type = result === max ? 'leg' : result === min ? 'cat' : '';
  var name = characterName || username || '?';
  var lbl = '', lblClass = '';
  if (system === 'DUNGEON_WORLD') {
    if (result >= 10) { lbl = 'Strong Hit (10+)'; lblClass = 'hit'; }
    else if (result >= 7) { lbl = 'Partial Hit (7-9)'; lblClass = 'partial'; }
    else { lbl = 'Miss (6-)'; lblClass = 'miss'; }
  } else if (system === 'CAIN') {
    lbl = ''; lblClass = ''; // no label for CAIN - pool speaks for itself
  }
  var now = new Date();
  var time = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
  var d = document.createElement('div');
  d.className = 'entry ' + type;
  // For CAIN show pool string if available
  var exprDisplay = (system === 'CAIN' && roll.details && roll.details.poolStr)
    ? '[' + roll.details.poolStr + ']'
    : (expression || '');
  d.innerHTML =
    '<div class="entry-top">' +
      '<div class="entry-name">' + name + '</div>' +
      '<div class="entry-result">' + result + '</div>' +
    '</div>' +
    '<div class="entry-bottom">' +
      '<div class="entry-expr">' + exprDisplay + '</div>' +
      (lbl ? '<div class="entry-lbl ' + lblClass + '">' + lbl + '</div>' : '') +
      '<div class="entry-time">' + time + '</div>' +
      (function() {
        var rd = (roll.riskDie != null ? roll.riskDie : (roll.details && roll.details.riskDie != null ? roll.details.riskDie : null));
        var ri = roll.isRisky || (roll.details && (roll.details.mode || '').includes('risky'));
        return ri && rd != null ? '<div class="entry-risk' + (rd === 1 ? ' risk-bad' : '') + '">&#x26A0; Risk Die: ' + rd + (rd === 1 ? ' — BAD THING HAPPENS' : '') + '</div>' : '';
      })() +
    '</div>';
  log.appendChild(d);
  log.scrollTop = log.scrollHeight;
}

restart();

var api = localStorage.getItem('trpg_api') || '';
var last = Date.now();
var timer = null;
var st = document.getElementById('st');
var urlEl = document.getElementById('url');
var log = document.getElementById('log');

urlEl.value = api;

var OBR = (typeof OBRModule !== 'undefined' && OBRModule.default) ? OBRModule.default : null;
var obrReady = false;

if (OBR) {
  OBR.onReady(function() {
    obrReady = true;
    OBR.room.getMetadata().then(function(meta) {
      var saved = meta['trpg-dice/api'];
      if (saved && !api) {
        api = saved;
        urlEl.value = api;
        restart();
      }
    }).catch(function() {});
  });
}

urlEl.addEventListener('change', function() {
  api = urlEl.value.trim();
  localStorage.setItem('trpg_api', api);
  if (OBR && obrReady) {
    OBR.room.setMetadata({ 'trpg-dice/api': api }).catch(function() {});
  }
  restart();
});

function clearLog() {
  log.innerHTML = '';
}

function restart() {
  clearInterval(timer);
  if (!api) return;
  poll();
  timer = setInterval(poll, 500);
}

function poll() {
  if (!api) return;
  fetch(api + '/dice/recent?since=' + last)
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
    : system === 'CAIN'
    ? (result >= 4 ? '\u2705' : '\u274C')
    : '\uD83C\uDFB2';
  var variant = system === 'DUNGEON_WORLD'
    ? (result >= 10 ? 'SUCCESS' : result >= 7 ? 'WARNING' : 'ERROR')
    : system === 'CAIN'
    ? (result >= 4 ? 'SUCCESS' : 'ERROR')
    : 'DEFAULT';
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
    if (result >= 4) { lbl = 'Success'; lblClass = 'success'; }
    else { lbl = 'Agony'; lblClass = 'agony'; }
  }
  var now = new Date();
  var time = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');

  var d = document.createElement('div');
  d.className = 'entry ' + type;
  d.innerHTML =
    '<div class="entry-top">' +
      '<div class="entry-name">' + name + '</div>' +
      '<div class="entry-result">' + result + '</div>' +
    '</div>' +
    '<div class="entry-bottom">' +
      '<div class="entry-expr">' + (expression||'') + '</div>' +
      (lbl ? '<div class="entry-lbl ' + lblClass + '">' + lbl + '</div>' : '') +
      '<div class="entry-time">' + time + '</div>' +
    '</div>';

  log.appendChild(d);
  // Auto scroll to bottom
  log.scrollTop = log.scrollHeight;
}

restart();

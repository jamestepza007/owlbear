// Background script - runs even when panel is closed
// Uses OBR to show notifications

var api = '';
var last = Date.now();
var timer = null;

OBR.onReady(function() {
  // Load saved API URL
  OBR.room.getMetadata().then(function(meta) {
    api = meta['trpg-dice/api'] || '';
    if (api) startPolling();
  }).catch(function() {});

  // Listen for metadata changes (when panel updates the URL)
  OBR.room.onMetadataChange(function(meta) {
    var newApi = meta['trpg-dice/api'] || '';
    if (newApi !== api) {
      api = newApi;
      if (api) startPolling();
      else stopPolling();
    }
  });
});

function startPolling() {
  stopPolling();
  poll();
  timer = setInterval(poll, 2000);
}

function stopPolling() {
  if (timer) clearInterval(timer);
  timer = null;
}

function poll() {
  if (!api) return;
  fetch(api + '/dice/recent?since=' + last)
    .then(function(r) { return r.json(); })
    .then(function(rolls) {
      rolls.forEach(function(roll) {
        notify(roll);
        if (roll.timestamp > last) last = roll.timestamp;
      });
    })
    .catch(function() {});
}

function notify(roll) {
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

  OBR.notification.show(
    '\uD83C\uDFB2 ' + name + ' rolled ' + result + lbl,
    variant
  ).catch(function() {});
}

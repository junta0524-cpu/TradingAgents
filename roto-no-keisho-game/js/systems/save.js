// ぼうけんのしょ ― ブラウザの localStorage に進行を記録する。
// 保存先が使えない環境(プライベートモード等)でも落ちないよう、すべて try/catch で包む。
var Game = window.Game || {};
Game.Save = (function () {
  var KEY = 'roto-no-keisho.save.v1';
  var VERSION = 1;

  function storage() {
    try { return window.localStorage; } catch (e) { return null; }
  }

  function save() {
    var s = storage();
    if (!s) return false;
    var pos = Game.Field.playerPos();
    var map = Game.Field.currentMap();
    var data = {
      version: VERSION,
      savedAt: Date.now(),
      party: Game.Party.serialize(),
      story: Game.Story.serialize(),
      field: { mapId: map ? map.id : null, x: pos.x, y: pos.y },
      moon: Game.Moon.serialize(),
    };
    try {
      s.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      return false; // 容量超過など
    }
  }

  function read() {
    var s = storage();
    if (!s) return null;
    try {
      var raw = s.getItem(KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || data.version !== VERSION) return null;
      return data;
    } catch (e) {
      return null; // 壊れた記録は無かったことにする
    }
  }

  function exists() { return !!read(); }

  // 記録の概要(タイトル画面に「どこまで進んだか」を出すため)
  function summary() {
    var data = read();
    if (!data) return null;
    var ch = Game.Data.Chapters[data.story.chapterIndex];
    var lead = data.party.members[data.party.order[0]];
    return {
      title: data.story.finished ? '― 完 ―' : (ch ? ch.title : ''),
      level: lead ? lead.level : 1,
      partySize: data.party.order.length,
    };
  }

  // 記録から再開する。成功したら true。
  function load(modeChangeCb) {
    var data = read();
    if (!data) return false;
    if (!Game.Party.deserialize(data.party)) return false;
    Game.Moon.restore(data.moon);
    Game.Story.resume(data.story, modeChangeCb);
    if (data.field && data.field.mapId) {
      var map = Game.Field.currentMap();
      // 記録時と同じマップにいる場合だけ、立ち位置まで戻す
      if (map && map.id === data.field.mapId) Game.Field.setPosition(data.field.x, data.field.y);
    }
    return true;
  }

  function clear() {
    var s = storage();
    if (!s) return;
    try { s.removeItem(KEY); } catch (e) { /* 消せなくても続行する */ }
  }

  return { save: save, load: load, exists: exists, summary: summary, clear: clear };
})();

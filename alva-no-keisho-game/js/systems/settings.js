// せってい ― 文字の速さと、魔物の出やすさ。遊ぶ人の好みなので、冒険の記録とは別に覚えておく。
// (記録を消しても、はじめからにしても、好みはそのまま残るように)
var Game = window.Game || {};
Game.Settings = (function () {
  var KEY = 'alva-no-keisho.settings.v1';

  // 選べる値と、それぞれの中身。並び順がそのまま画面の並びになる
  var CHOICES = {
    textSpeed: [
      { id: 'slow',   label: 'おそい', chars: 0.5 },
      { id: 'normal', label: 'ふつう', chars: 0.9 },
      { id: 'fast',   label: 'はやい', chars: 2.2 },
    ],
    // PS版の不満だった「戦闘が多すぎる」への手当て。少なめで半分になる
    encounter: [
      { id: 'normal', label: 'ふつう', scale: 1.0 },
      { id: 'less',   label: '少なめ', scale: 0.5 },
    ],
  };
  var DEFAULTS = { textSpeed: 'normal', encounter: 'normal' };
  var values = load();

  function load() {
    var v = {};
    Object.keys(DEFAULTS).forEach(function (k) { v[k] = DEFAULTS[k]; });
    try {
      var raw = window.localStorage.getItem(KEY);
      if (raw) {
        var saved = JSON.parse(raw);
        Object.keys(DEFAULTS).forEach(function (k) {
          if (saved && find(k, saved[k])) v[k] = saved[k];
        });
      }
    } catch (e) { /* 保存先が使えなくても、既定値で遊べればよい */ }
    return v;
  }
  function persist() {
    try { window.localStorage.setItem(KEY, JSON.stringify(values)); } catch (e) { /* 残せなくても続行 */ }
  }
  function find(key, id) {
    var list = CHOICES[key] || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function current(key) { return find(key, values[key]) || CHOICES[key][0]; }

  // 左右(または決定)で次の値へ回す
  function cycle(key, step) {
    var list = CHOICES[key];
    var i = list.indexOf(current(key));
    i = (i + (step || 1) + list.length) % list.length;
    values[key] = list[i].id;
    persist();
  }

  return {
    keys: function () { return Object.keys(CHOICES); },
    label: function (key) { return current(key).label; },
    cycle: cycle,
    textCharsPerFrame: function () { return current('textSpeed').chars; },
    encounterScale: function () { return current('encounter').scale; },
    // 検証用
    __values: function () { return JSON.parse(JSON.stringify(values)); },
  };
})();

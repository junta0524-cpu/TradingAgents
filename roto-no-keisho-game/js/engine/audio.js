// 音 ― 効果音と BGM。音源ファイルは持たず、その場で波形を合成する。
//
// ファミコンの音源にならって、矩形波2声(主旋律と対旋律)＋三角波(低音)＋
// ノイズ(打撃)だけで鳴らす。曲は音名の並びとして書いてあり、
// 楽団譜の29曲が実際の音源として用意されるまでの仮の音。
//
// ブラウザは操作より前に音を出させてくれないので、最初のキー入力で目を覚ます。
// 音が使えない環境では、すべてが黙って何もしない関数になる。
var Game = window.Game || {};
Game.Audio = (function () {
  var ctx = null;
  var master = null;
  var ready = false;
  var muted = false;
  var bgmTimer = null;
  var bgmName = null;
  var bgmVoices = [];

  function init() {
    if (ctx === false) return;
    if (!ready) {
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) { ctx = false; return; }
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0.22;
        master.connect(ctx.destination);
        ready = true;
      } catch (e) { ctx = false; return; }
    }
    // ブラウザは操作より前に音を出させてくれない。止まっていたら起こす
    try { if (ctx.state === 'suspended') ctx.resume(); } catch (e2) { /* 鳴らないだけ */ }
  }

  // 音名を周波数に。'A4' を 440Hz とし、半音ずつ 2^(1/12) 倍する
  var STEP = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
  function freq(note) {
    if (!note || note === '-') return 0;
    var m = /^([A-G])([#b]?)(-?\d)$/.exec(note);
    if (!m) return 0;
    var semi = STEP[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (parseInt(m[3], 10) - 4) * 12;
    return 440 * Math.pow(2, semi / 12);
  }

  // 一音鳴らす。type は 'square'(矩形波) / 'triangle'(三角波) / 'noise'(打撃)
  function tone(note, at, dur, type, vol) {
    if (!ready) return null;
    var t = ctx.currentTime + at;
    var gain = ctx.createGain();
    gain.connect(master);
    // 立ち上がりを一瞬にして、切れ際だけなだらかにする(ファミコンらしい歯切れ)
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol || 0.3, t + 0.008);
    gain.gain.setValueAtTime(vol || 0.3, t + dur * 0.7);
    gain.gain.linearRampToValueAtTime(0, t + dur);

    var src;
    if (type === 'noise') {
      var len = Math.max(1, Math.floor(ctx.sampleRate * dur));
      var buf = ctx.createBuffer(1, len, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      src = ctx.createBufferSource();
      src.buffer = buf;
    } else {
      var f = freq(note);
      if (!f) return null;
      src = ctx.createOscillator();
      src.type = type || 'square';
      src.frequency.setValueAtTime(f, t);
    }
    src.connect(gain);
    src.start(t);
    src.stop(t + dur + 0.02);
    return src;
  }

  // 音名の並びを順に鳴らす。'-' は休み
  function phrase(notes, at, step, type, vol) {
    notes.forEach(function (n, i) {
      if (n !== '-') tone(n, at + i * step, step * 0.9, type, vol);
    });
  }

  // ---- 効果音 ----
  var SFX = {
    cursor:  function () { tone('E5', 0, 0.05, 'square', 0.18); },
    confirm: function () { tone('A4', 0, 0.05, 'square', 0.22); tone('E5', 0.05, 0.08, 'square', 0.22); },
    cancel:  function () { tone('E4', 0, 0.06, 'square', 0.2); tone('A3', 0.06, 0.09, 'square', 0.2); },
    attack:  function () { tone(null, 0, 0.07, 'noise', 0.3); },
    hit:     function () { tone(null, 0, 0.11, 'noise', 0.4); tone('A2', 0, 0.11, 'square', 0.25); },
    critical: function () {
      tone(null, 0, 0.16, 'noise', 0.5);
      phrase(['A3', 'E4', 'A4'], 0, 0.045, 'square', 0.3);
    },
    heal:    function () { phrase(['E5', 'A5', 'C#6'], 0, 0.06, 'triangle', 0.28); },
    spell:   function () { phrase(['C5', 'E5', 'G5', 'C6'], 0, 0.04, 'square', 0.22); },
    downed:  function () { phrase(['A4', 'F4', 'D4', 'A3'], 0, 0.09, 'square', 0.25); },
    chest:   function () { phrase(['C5', 'E5', 'G5'], 0, 0.07, 'triangle', 0.3); },
    // レベルアップ。ドラクエの「ちゃらららーん」に当たる短い上昇形
    levelup: function () { phrase(['C5', 'E5', 'G5', 'C6', 'G5', 'C6'], 0, 0.09, 'square', 0.3); },
    // 勝利のジングル。数小節だけの明るい終止
    victory: function () {
      phrase(['C5', 'C5', 'C5', 'G4', 'A4', 'C5', '-', 'C5', 'G5'], 0, 0.12, 'square', 0.3);
      phrase(['E4', 'E4', 'E4', 'C4', 'F4', 'E4', '-', 'E4', 'E5'], 0, 0.12, 'square', 0.16);
      phrase(['C3', '-', 'C3', '-', 'F3', '-', '-', 'C3', 'C3'], 0, 0.12, 'triangle', 0.3);
    },
    wipe: function () { phrase(['A4', 'G#4', 'G4', 'F#4', 'F4', 'E4', 'D#4', 'D4'], 0, 0.16, 'square', 0.28); },
  };

  function play(name) {
    init();
    if (!ready || muted || !SFX[name]) return;
    try { SFX[name](); } catch (e) { /* 音が出ないだけなので、遊びは止めない */ }
  }

  // ---- BGM ----
  // それぞれ 主旋律 / 低音 / 一拍の長さ。短い旋律を繰り返す。
  var BGM = {
    title: { step: 0.30, lead:
      ['A4','-','C5','-','E5','-','D5','C5','B4','-','-','-','E4','-','-','-',
       'A4','-','C5','-','E5','-','G5','F5','E5','-','-','-','A4','-','-','-'],
      bass:
      ['A2','-','A2','-','E2','-','E2','-','F2','-','F2','-','E2','-','E2','-',
       'A2','-','A2','-','C3','-','C3','-','E2','-','E2','-','A2','-','A2','-'] },
    // 旅の道。歩調に合う行進曲
    field: { step: 0.21, lead:
      ['A4','B4','C5','E5','D5','C5','B4','-','G4','A4','B4','D5','C5','B4','A4','-',
       'E5','-','D5','C5','B4','C5','D5','-','E5','D5','C5','B4','A4','-','-','-'],
      bass:
      ['A2','-','E3','-','A2','-','E3','-','G2','-','D3','-','G2','-','D3','-',
       'A2','-','E3','-','F2','-','C3','-','E2','-','B2','-','A2','-','-','-'] },
    // 街。落ち着いた三拍子
    town: { step: 0.26, lead:
      ['C5','-','E5','G5','-','E5','F5','-','A5','G5','-','-','E5','-','C5','-',
       'D5','-','F5','A5','-','F5','E5','-','G5','C5','-','-','-','-','-','-'],
      bass:
      ['C3','-','-','G2','-','-','F2','-','-','C3','-','-','G2','-','-','-',
       'D3','-','-','A2','-','-','C3','-','-','G2','-','-','C3','-','-','-'] },
    // 戦い。刻みの速い短調
    battle: { step: 0.13, lead:
      ['A4','A4','C5','A4','E5','A4','D5','C5','B4','B4','D5','B4','F5','B4','E5','D5',
       'C5','C5','E5','C5','G5','C5','F5','E5','D5','E5','F5','E5','D5','C5','B4','A4'],
      bass:
      ['A2','A2','A2','A2','E2','E2','E2','E2','G2','G2','G2','G2','D2','D2','D2','D2',
       'F2','F2','F2','F2','C3','C3','C3','C3','E2','E2','E2','E2','A2','A2','A2','A2'] },
    // ボス。半音で軋ませる
    boss: { step: 0.115, lead:
      ['D4','D#4','E4','D#4','D4','A4','G#4','G4','F#4','F4','E4','D#4','D4','-','A3','-',
       'D5','C#5','C5','B4','A#4','A4','G#4','G4','F#4','G4','G#4','A4','A#4','B4','C5','C#5'],
      bass:
      ['D2','D2','D2','D2','A2','A2','A2','A2','A#2','A#2','A#2','A#2','A2','A2','A2','A2',
       'D2','D2','D2','D2','G2','G2','G2','G2','A2','A2','A2','A2','D2','D2','D2','D2'] },
    // 終幕。ゆったりした長調
    ending: { step: 0.36, lead:
      ['C5','-','G4','-','A4','-','C5','-','G4','-','-','-','E4','-','-','-',
       'F4','-','A4','-','C5','-','D5','-','C5','-','-','-','-','-','-','-'],
      bass:
      ['C3','-','-','-','F2','-','-','-','C3','-','-','-','G2','-','-','-',
       'F2','-','-','-','A2','-','-','-','C3','-','-','-','C3','-','-','-'] },
  };

  function stopBgm() {
    if (bgmTimer) { clearTimeout(bgmTimer); bgmTimer = null; }
    bgmVoices.forEach(function (v) { try { v.stop(); } catch (e) {} });
    bgmVoices = [];
    bgmName = null;
  }

  function scheduleLoop(name) {
    var song = BGM[name];
    if (!ready || muted || !song) return;
    bgmVoices = [];
    var len = song.lead.length;
    for (var i = 0; i < len; i++) {
      if (song.lead[i] !== '-') {
        var v = tone(song.lead[i], i * song.step, song.step * 0.85, 'square', 0.11);
        if (v) bgmVoices.push(v);
      }
      if (song.bass[i] !== '-') {
        var v2 = tone(song.bass[i], i * song.step, song.step * 0.9, 'triangle', 0.13);
        if (v2) bgmVoices.push(v2);
      }
    }
    bgmTimer = setTimeout(function () {
      if (bgmName === name) scheduleLoop(name);
    }, len * song.step * 1000);
  }

  // 同じ曲を指定されたら鳴らし直さない(場面が同じなら曲も途切れない)
  function bgm(name) {
    init();
    if (!ready) return;
    if (bgmName === name) return;
    stopBgm();
    if (!name || muted) return;
    bgmName = name;
    scheduleLoop(name);
  }

  function toggleMute() {
    muted = !muted;
    if (muted) { var keep = bgmName; stopBgm(); bgmName = keep; }
    else if (bgmName) { var n = bgmName; bgmName = null; bgm(n); }
    return muted;
  }
  function isMuted() { return muted; }

  return {
    init: init, play: play, bgm: bgm, stopBgm: stopBgm,
    toggleMute: toggleMute, isMuted: isMuted,
    // 検証用
    __state: function () { return { ready: ready, muted: muted, bgm: bgmName }; },
  };
})();

// このファイルの役目：音（効果音と短い曲）。外部の音源は使わず、Web Audio で波形から鳴らす。曲はすべてこのゲームのために作った短い旋律。
// ブラウザは「最初にキーかボタンを押すまで」音を出せないので、最初の操作で鳴らし始める。設定で音を切れる（G.settings.sound）。
// 使い方：G.sound.se('ok')（効果音）／G.sound.bgm('field')（曲を切り替える。null で止める）／G.sound.jingle('victory', 'field')（短い曲を1回）
// どの場所・場面でどの曲かは js/data/music.js。
(function () {
  const G = window.GAME = window.GAME || {};

  let ac = null, master = null, current = null, timer = null, step = 0, wanted = null, after = undefined;

  function ctx() {
    if (ac) return ac;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ac = new AC();
    master = ac.createGain();
    master.gain.value = 0.18;
    master.connect(ac.destination);
    return ac;
  }
  const on = () => !!(G.settings && G.settings.sound);

  // 1音鳴らす（周波数、長さ秒、波の形、音量、始まりの遅れ）
  function tone(freq, dur, type, vol, delay) {
    const a = ctx();
    if (!a || !on() || a.state !== 'running') return;
    const t = a.currentTime + (delay || 0);
    const o = a.createOscillator(), g = a.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol || 0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }
  // 雑音（打撃など）
  function noise(dur, vol) {
    const a = ctx();
    if (!a || !on() || a.state !== 'running') return;
    const len = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = a.createBufferSource(), g = a.createGain();
    s.buffer = buf; g.gain.value = vol || 0.3;
    s.connect(g); g.connect(master); s.start();
  }

  const N = n => 440 * Math.pow(2, (n - 69) / 12);   // 鍵盤の番号 → 周波数（69 = ラ）

  // ---- 効果音 ----
  const SE = {
    cursor: () => tone(N(84), 0.04, 'square', 0.12),
    ok: () => { tone(N(79), 0.06, 'square', 0.18); tone(N(86), 0.08, 'square', 0.15, 0.05); },
    cancel: () => { tone(N(74), 0.06, 'square', 0.15); tone(N(67), 0.08, 'square', 0.12, 0.05); },
    talk: () => tone(N(76), 0.02, 'triangle', 0.08),
    hit: () => { noise(0.12, 0.35); tone(N(45), 0.1, 'sawtooth', 0.2); },
    damage: () => { noise(0.2, 0.4); tone(N(40), 0.2, 'square', 0.25); },
    heal: () => [0, 4, 7, 12].forEach((d, i) => tone(N(72 + d), 0.12, 'triangle', 0.18, i * 0.06)),
    spell: () => [0, 7, 12].forEach((d, i) => tone(N(76 + d), 0.08, 'sine', 0.2, i * 0.04)),
    levelup: () => [0, 4, 7, 12, 7, 12].forEach((d, i) => tone(N(72 + d), 0.14, 'square', 0.18, i * 0.09)),
    chest: () => [0, 5, 9, 12].forEach((d, i) => tone(N(79 + d), 0.1, 'triangle', 0.2, i * 0.07)),
    encounter: () => [0, 1, 0, 1, 0].forEach((d, i) => tone(N(60 + d * 6), 0.06, 'square', 0.2, i * 0.05)),
    door: () => tone(N(55), 0.08, 'triangle', 0.18),
    learn: () => [0, 7, 4, 12].forEach((d, i) => tone(N(74 + d), 0.16, 'triangle', 0.2, i * 0.1)),
  };

  // ---- 曲（このゲームのための短い旋律。[音の高さ, 長さ(拍)] の並び。0 は休み）----
  // 和の五音（ド・レ・ミ・ソ・ラ）を中心に作った
  const SONGS = {
    title:   { bpm: 76, wave: 'triangle', bass: 'sine', notes: [[64, 2], [67, 1], [69, 1], [67, 2], [64, 2], [62, 2], [60, 1], [62, 1], [64, 4], [69, 2], [72, 1], [71, 1], [69, 2], [67, 2], [64, 2], [62, 2], [60, 4]], bassline: [45, 45, 43, 43, 41, 41, 43, 43] },
    town:    { bpm: 104, wave: 'square', bass: 'triangle', notes: [[72, 1], [74, 1], [76, 2], [79, 1], [76, 1], [74, 2], [72, 1], [69, 1], [72, 2], [74, 4], [76, 1], [79, 1], [81, 2], [79, 1], [76, 1], [74, 2], [72, 1], [74, 1], [72, 4]], bassline: [48, 55, 53, 55, 48, 55, 50, 48] },
    field:   { bpm: 118, wave: 'square', bass: 'triangle', notes: [[67, 1], [69, 1], [72, 2], [74, 1], [72, 1], [69, 2], [67, 1], [64, 1], [67, 2], [69, 4], [72, 1], [74, 1], [76, 2], [74, 1], [72, 1], [69, 2], [72, 1], [69, 1], [67, 4]], bassline: [43, 50, 48, 50, 45, 52, 43, 50] },
    yomi:    { bpm: 84, wave: 'triangle', bass: 'sine', notes: [[62, 2], [65, 1], [67, 1], [69, 2], [67, 2], [65, 2], [62, 2], [60, 4], [62, 2], [65, 2], [70, 2], [69, 2], [67, 4], [65, 4]], bassline: [38, 38, 41, 41, 36, 36, 38, 38] },
    city:    { bpm: 92, wave: 'sine', bass: 'triangle', notes: [[76, 2], [79, 2], [81, 2], [79, 2], [76, 2], [74, 2], [72, 4], [74, 2], [76, 2], [79, 2], [76, 2], [74, 4], [72, 4]], bassline: [48, 52, 55, 52, 45, 48, 53, 48] },
    battle:  { bpm: 150, wave: 'square', bass: 'sawtooth', notes: [[69, 1], [72, 1], [74, 1], [76, 1], [74, 1], [72, 1], [69, 2], [67, 1], [69, 1], [72, 1], [74, 1], [72, 2], [0, 2], [76, 1], [79, 1], [81, 1], [79, 1], [76, 1], [74, 1], [72, 2], [74, 1], [72, 1], [69, 4]], bassline: [45, 45, 52, 45, 43, 43, 50, 43] },
    boss:    { bpm: 160, wave: 'sawtooth', bass: 'square', notes: [[62, 1], [65, 1], [62, 1], [68, 1], [67, 2], [65, 2], [62, 1], [65, 1], [70, 1], [69, 1], [67, 4], [62, 1], [65, 1], [62, 1], [68, 1], [67, 2], [70, 2], [69, 1], [67, 1], [65, 1], [64, 1], [62, 4]], bassline: [38, 38, 44, 44, 41, 41, 37, 37] },
    rampage: { bpm: 60, wave: 'sine', bass: 'sine', notes: [[57, 4], [0, 4], [60, 4], [0, 4], [55, 8]], bassline: [33, 33, 31, 31] },
    sad:     { bpm: 66, wave: 'triangle', bass: 'sine', notes: [[69, 3], [67, 1], [64, 2], [62, 2], [64, 4], [62, 3], [60, 1], [57, 4], [0, 4]], bassline: [45, 45, 41, 41, 43, 43, 45, 45] },
    ending:  { bpm: 72, wave: 'triangle', bass: 'sine', notes: [[72, 2], [76, 2], [79, 4], [81, 2], [79, 2], [76, 4], [74, 2], [76, 2], [79, 2], [84, 2], [81, 8]], bassline: [48, 48, 53, 53, 55, 55, 48, 48] },

    // ---- 場所の曲（js/data/music.js で割り当てる）。drum：1拍ごとの打ち物（x＝小さな打音、o＝低い太鼓、.＝なし）、harmony：二つ目の旋律 ----
    village:  { bpm: 96, wave: 'triangle', bass: 'sine', drum: 'x...', notes: [[67, 1], [69, 1], [72, 2], [69, 1], [67, 1], [64, 2], [62, 1], [64, 1], [67, 2], [64, 4], [67, 1], [69, 1], [72, 1], [74, 1], [76, 2], [74, 1], [72, 1], [69, 2], [67, 2], [64, 4]], bassline: [48, 43, 45, 40, 48, 43, 41, 43] },
    forest:   { bpm: 80, wave: 'sine', bass: 'sine', notes: [[69, 2], [72, 2], [76, 3], [74, 1], [72, 2], [69, 2], [67, 4], [69, 2], [72, 2], [79, 3], [76, 1], [74, 4], [72, 4]], harmony: [[64, 8], [62, 8], [64, 8], [60, 8]], bassline: [45, 45, 41, 41, 43, 43, 45, 45] },
    mountain: { bpm: 112, wave: 'square', bass: 'triangle', drum: 'x.o.', notes: [[62, 1], [62, 1], [69, 2], [67, 1], [65, 1], [62, 2], [60, 1], [62, 1], [65, 2], [62, 4], [62, 1], [65, 1], [69, 1], [72, 1], [74, 2], [72, 1], [69, 1], [67, 2], [65, 2], [62, 4]], bassline: [38, 38, 43, 43, 41, 41, 36, 38] },
    wild:     { bpm: 100, wave: 'triangle', bass: 'triangle', drum: 'x..x', notes: [[64, 2], [67, 1], [69, 1], [71, 2], [69, 2], [67, 1], [64, 1], [62, 2], [64, 4], [71, 2], [74, 1], [76, 1], [74, 2], [71, 2], [69, 1], [67, 1], [64, 2], [64, 4]], bassline: [40, 40, 47, 47, 45, 45, 40, 40] },
    cave:     { bpm: 70, wave: 'sine', bass: 'sine', notes: [[57, 3], [60, 1], [59, 4], [57, 2], [55, 2], [53, 4], [57, 3], [62, 1], [60, 2], [59, 2], [57, 8]], bassline: [33, 33, 29, 29, 33, 33, 28, 28] },
    slum:     { bpm: 74, wave: 'triangle', bass: 'sine', notes: [[64, 2], [65, 2], [69, 4], [71, 2], [69, 2], [65, 4], [64, 2], [65, 2], [69, 2], [72, 2], [71, 4], [69, 4]], bassline: [40, 40, 45, 45, 41, 41, 40, 40] },
    eerie:    { bpm: 64, wave: 'sine', bass: 'sine', notes: [[76, 4], [77, 2], [76, 2], [72, 4], [71, 4], [76, 4], [81, 2], [77, 2], [76, 8]], harmony: [[64, 8], [65, 8], [64, 8], [64, 8]], bassline: [40, 40, 41, 41, 45, 45, 40, 40] },
    shrine:   { bpm: 60, wave: 'sine', bass: 'sine', notes: [[69, 4], [72, 4], [74, 4], [76, 4], [74, 4], [72, 4], [69, 8], [67, 4], [69, 4], [72, 4], [74, 4], [72, 4], [69, 4], [67, 8]], bassline: [45, 45, 43, 43, 41, 41, 43, 43] },
    palace:   { bpm: 84, wave: 'triangle', bass: 'sine', drum: 'o...', notes: [[62, 2], [65, 2], [69, 2], [70, 2], [69, 2], [65, 2], [62, 4], [65, 2], [69, 2], [72, 2], [74, 2], [72, 2], [70, 2], [69, 4]], bassline: [38, 38, 41, 41, 43, 43, 38, 38] },
    market:   { bpm: 128, wave: 'square', bass: 'triangle', drum: 'xoxo', notes: [[74, 1], [72, 1], [69, 1], [72, 1], [74, 2], [77, 2], [76, 1], [74, 1], [72, 1], [69, 1], [67, 4], [69, 1], [72, 1], [74, 1], [77, 1], [79, 2], [77, 2], [74, 1], [72, 1], [69, 2], [74, 4]], bassline: [50, 50, 45, 45, 48, 48, 50, 50] },
    prison:   { bpm: 56, wave: 'sine', bass: 'sine', notes: [[57, 4], [0, 2], [55, 2], [53, 4], [52, 4], [57, 4], [0, 2], [60, 2], [59, 8]], bassline: [33, 33, 31, 31, 29, 29, 28, 28] },
    night:    { bpm: 70, wave: 'triangle', bass: 'sine', notes: [[72, 2], [76, 2], [79, 2], [76, 2], [74, 4], [72, 4], [69, 2], [72, 2], [76, 2], [74, 2], [72, 8]], bassline: [48, 48, 45, 45, 41, 41, 43, 43] },
    abyss:    { bpm: 66, wave: 'sine', bass: 'sawtooth', drum: 'o...', notes: [[52, 4], [55, 2], [56, 2], [52, 4], [51, 4], [52, 4], [58, 2], [56, 2], [55, 8]], bassline: [28, 28, 27, 27, 28, 28, 26, 26] },
    world:    { bpm: 120, wave: 'square', bass: 'triangle', drum: 'x.x.', notes: [[60, 1], [64, 1], [67, 2], [72, 2], [71, 1], [69, 1], [67, 2], [64, 2], [62, 4], [64, 1], [67, 1], [69, 2], [72, 2], [74, 1], [76, 1], [74, 2], [72, 2], [72, 4]], bassline: [48, 48, 53, 53, 55, 55, 48, 48] },
    yomi_world: { bpm: 100, wave: 'triangle', bass: 'triangle', drum: 'x..x', notes: [[62, 1], [65, 1], [69, 2], [67, 2], [65, 2], [62, 2], [60, 2], [62, 4], [65, 1], [69, 1], [72, 2], [70, 2], [69, 2], [67, 2], [65, 2], [62, 4]], bassline: [38, 38, 43, 43, 41, 41, 38, 38] },
    arena:    { bpm: 120, wave: 'square', bass: 'triangle', drum: 'xox.', notes: [[62, 1], [62, 1], [65, 1], [62, 1], [69, 2], [67, 2], [65, 1], [65, 1], [69, 1], [65, 1], [72, 4], [70, 1], [69, 1], [67, 1], [65, 1], [67, 2], [69, 2], [62, 4], [0, 4]], bassline: [38, 38, 41, 41, 43, 43, 38, 38] },
    // ---- 場面の曲 ----
    tension:  { bpm: 96, wave: 'square', bass: 'sawtooth', drum: 'x..x', notes: [[57, 1], [57, 1], [0, 1], [58, 1], [57, 2], [0, 2], [57, 1], [57, 1], [0, 1], [60, 1], [59, 4], [57, 1], [57, 1], [0, 1], [58, 1], [57, 2], [0, 2], [53, 2], [52, 2], [0, 4]], bassline: [33, 33, 33, 34, 33, 33, 29, 28] },
    warm:     { bpm: 84, wave: 'triangle', bass: 'sine', notes: [[72, 2], [74, 1], [76, 1], [79, 2], [76, 2], [74, 2], [72, 2], [69, 4], [72, 2], [74, 1], [76, 1], [79, 2], [81, 2], [79, 2], [76, 2], [72, 4]], harmony: [[64, 4], [65, 4], [64, 4], [60, 4], [64, 4], [65, 4], [67, 4], [64, 4]], bassline: [48, 48, 53, 53, 48, 48, 43, 43] },
    festival: { bpm: 132, wave: 'square', bass: 'triangle', drum: 'xoxo', notes: [[72, 1], [74, 1], [76, 1], [79, 1], [76, 1], [74, 1], [72, 2], [74, 1], [76, 1], [79, 1], [81, 1], [79, 4], [81, 1], [79, 1], [76, 1], [74, 1], [72, 1], [74, 1], [76, 2], [74, 1], [72, 1], [69, 2], [72, 4]], bassline: [48, 48, 53, 53, 55, 55, 48, 48] },
    farewell: { bpm: 72, wave: 'triangle', bass: 'sine', notes: [[76, 3], [74, 1], [72, 2], [69, 2], [67, 2], [69, 2], [72, 4], [74, 3], [72, 1], [69, 2], [67, 2], [64, 2], [67, 2], [69, 4]], bassline: [45, 45, 43, 43, 41, 41, 45, 45] },
    memory:   { bpm: 68, wave: 'sine', bass: 'sine', notes: [[72, 2], [71, 2], [69, 2], [67, 2], [69, 4], [64, 4], [65, 2], [67, 2], [69, 2], [72, 2], [71, 8]], bassline: [45, 45, 40, 40, 41, 41, 44, 44] },
    // ---- 戦いの曲 ----
    training: { bpm: 140, wave: 'square', bass: 'triangle', drum: 'xoxo', notes: [[69, 1], [74, 1], [76, 1], [74, 1], [69, 2], [67, 2], [69, 1], [74, 1], [76, 1], [79, 1], [81, 4], [79, 1], [76, 1], [74, 1], [72, 1], [74, 2], [76, 2], [74, 1], [72, 1], [69, 2], [74, 4]], bassline: [50, 50, 45, 45, 48, 48, 50, 50] },
    final:    { bpm: 168, wave: 'sawtooth', bass: 'square', drum: 'xoxx', notes: [[57, 1], [60, 1], [64, 1], [60, 1], [65, 2], [64, 2], [57, 1], [60, 1], [64, 1], [67, 1], [68, 4], [69, 1], [68, 1], [65, 1], [64, 1], [62, 2], [60, 2], [59, 1], [60, 1], [62, 1], [59, 1], [57, 4]], bassline: [33, 33, 29, 29, 31, 31, 28, 28] },
    // ---- 短い曲（1回だけ。loop: false）----
    victory:  { bpm: 150, wave: 'square', bass: 'triangle', loop: false, notes: [[72, 1], [72, 1], [72, 1], [76, 3], [74, 1], [76, 1], [79, 4]], bassline: [48, 52, 55, 55, 60] },
    rest:     { bpm: 90, wave: 'triangle', bass: 'sine', loop: false, notes: [[72, 1], [76, 1], [79, 1], [84, 3]], bassline: [48, 55, 48] },
    gameover: { bpm: 70, wave: 'triangle', bass: 'sine', loop: false, notes: [[69, 2], [65, 2], [64, 2], [62, 2], [57, 6]], bassline: [41, 38, 33, 33, 33, 33, 33] },
  };

  // その拍で始まる音を鳴らす（旋律の並びから）
  function voice(notes, at, beat, wave, vol) {
    const total = notes.reduce((a, n) => a + n[1], 0);
    let t = 0;
    for (const [n, len] of notes) {
      if (t === at % total && n) tone(N(n), len * beat * 0.95, wave, vol);
      t += len;
    }
  }
  function tick() {
    const s = SONGS[current];
    if (!s || !on()) return;
    const beat = 60 / s.bpm;
    const total = s.notes.reduce((a, n) => a + n[1], 0);
    // 1回だけの短い曲：最後まで鳴らしたら止めて、次の曲へ
    if (s.loop === false && step >= total + 2) {
      clearInterval(timer); timer = null;
      const next = after; after = undefined;
      current = null;
      if (next) G.sound.bgm(next); else wanted = null;
      return;
    }
    if (s.loop === false && step >= total) { step++; return; }
    // 1拍ごとに、その拍で始まる音と低音（2拍ごと）と打ち物を鳴らす
    voice(s.notes, step, beat, s.wave, 0.13);
    if (s.harmony) voice(s.harmony, step, beat, 'triangle', 0.06);
    if (step % 2 === 0) tone(N(s.bassline[(step / 2) % s.bassline.length]), beat * 1.9, s.bass, 0.12);
    if (s.drum) {
      const d = s.drum[step % s.drum.length];
      if (d === 'x') noise(0.04, 0.08);
      else if (d === 'o') tone(N(36), 0.12, 'sine', 0.3);
    }
    step++;
  }

  function startLoop() {
    clearInterval(timer); timer = null;
    const s = SONGS[current];
    if (!s) return;
    step = 0;
    timer = setInterval(tick, 60000 / s.bpm);
  }

  // 最初の操作で鳴らし始める（ブラウザの決まり）
  function unlock() {
    const a = ctx();
    if (a && a.state !== 'running') a.resume();
    if (wanted && !timer) { current = wanted; startLoop(); }
  }
  ['keydown', 'pointerdown', 'touchstart'].forEach(e => window.addEventListener(e, unlock, { passive: true }));

  G.sound = {
    SONGS,
    se(name) { try { if (SE[name]) SE[name](); } catch (e) { /* 音が出せなくても遊べる */ } },
    bgm(name) {
      after = undefined;
      wanted = name;
      if (current === name && timer) return;
      current = name;
      if (!name) { clearInterval(timer); timer = null; return; }
      if (ac && ac.state === 'running') startLoop();
    },
    // 短い曲を1回鳴らしてから、then の曲へ（then を書かなければ止まったまま）
    jingle(name, then) {
      if (!SONGS[name]) return;
      wanted = then || null;
      current = name;
      after = then || null;
      if (ac && ac.state === 'running' && on()) startLoop(); else if (then) { current = null; G.sound.bgm(then); }
    },
    current: () => current,
    // いま鳴らしたい曲（短い曲のあとに戻る曲も含む）
    wanted: () => (after !== undefined && after !== null ? after : wanted),
    // 設定で音を切り替えたとき
    refresh() { if (!on()) { clearInterval(timer); timer = null; } else if (wanted) { current = null; G.sound.bgm(wanted); } },
  };
})();

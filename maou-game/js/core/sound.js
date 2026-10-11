// このファイルの役目：音（効果音と短い曲）。外部の音源は使わず、Web Audio で波形から鳴らす。曲はすべてこのゲームのために作った短い旋律。
// ブラウザは「最初にキーかボタンを押すまで」音を出せないので、最初の操作で鳴らし始める。設定で音を切れる（G.settings.sound）。
// 使い方：G.sound.se('ok')（効果音）／G.sound.bgm('field')（曲を切り替える。null で止める）
(function () {
  const G = window.GAME = window.GAME || {};

  let ac = null, master = null, current = null, timer = null, step = 0, wanted = null;

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
  };

  function tick() {
    const s = SONGS[current];
    if (!s || !on()) return;
    const beat = 60 / s.bpm;
    const total = s.notes.reduce((a, n) => a + n[1], 0);
    // 1拍ごとに、その拍で始まる音と低音を鳴らす
    let t = 0;
    for (const [n, len] of s.notes) {
      if (t === step % total && n) tone(N(n), len * beat * 0.95, s.wave, 0.13);
      t += len;
    }
    if (step % 2 === 0) tone(N(s.bassline[(step / 2) % s.bassline.length]), beat * 1.9, s.bass, 0.12);
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
      wanted = name;
      if (current === name && timer) return;
      current = name;
      if (!name) { clearInterval(timer); timer = null; return; }
      if (ac && ac.state === 'running') startLoop();
    },
    current: () => current,
    // 設定で音を切り替えたとき
    refresh() { if (!on()) { clearInterval(timer); timer = null; } else if (wanted) { current = null; G.sound.bgm(wanted); } },
  };
})();

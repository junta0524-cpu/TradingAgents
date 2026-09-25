// 手応えの演出 ― 画面の揺れ、被弾の赤み、殴られた魔物の点滅。
//
// 数字が動いたことを、文章の外でも体に返すための層。
// 「効いた」「効かなかった」が文字を読む前に分かるようにしておく。
// 実際の描画はしない。いくつ揺らすか・どれだけ白くするかを持つだけで、
// 使う側(戦闘画面と本体のループ)がその値を絵に反映する。
var Game = window.Game || {};
Game.Fx = (function () {
  var shakeLeft = 0, shakeSpan = 1, shakePower = 0;
  var veilLeft = 0, veilSpan = 1, veilColor = '#8a3230';
  var flashes = {};   // 相手ごとの点滅の残り
  var FLASH_SPAN = 9;
  // 場面の切り替え。暗転してから戻る。
  // 戦闘に入る瞬間や宿屋の朝に「間」が無いと、場面が変わった実感が出ない。
  var fadeLeft = 0, fadeSpan = 1, fadeHold = 0;

  // 画面を揺らす。power は最大でずれる画素数
  function shake(power, frames) {
    // 揺れは上書きせず、強いほうを残す(小さい揺れで大きい揺れを消さない)
    if (power < shakePower && shakeLeft > 0) return;
    shakePower = power; shakeLeft = frames || 11; shakeSpan = shakeLeft;
  }

  // 画面のふちに色を差す。被弾なら赤、会心なら金
  function veil(color, frames) {
    veilColor = color; veilLeft = frames || 13; veilSpan = veilLeft;
  }

  // 仲間が殴られた。強さは「最大HPのどれだけを持っていかれたか」で決める
  function partyHurt(ratio) {
    var r = Math.max(0.05, Math.min(1, ratio || 0.1));
    shake(3 + Math.round(r * 9));
    veil('#8a3230', 10 + Math.round(r * 10));
    Game.Audio.play('hit');
  }

  // 魔物が殴られた。key はその戦闘での並び順
  function enemyHurt(key, big) {
    flashes[key] = FLASH_SPAN;
    if (big) shake(4, 8);
    Game.Audio.play('attack');
  }

  function critical() { shake(13, 14); veil('#d4af5a', 12); Game.Audio.play('critical'); }

  // 暗転 → (hold フレーム 真っ暗) → 明転
  function fade(frames, hold) {
    fadeSpan = frames || 12;
    fadeLeft = fadeSpan * 2 + (hold || 0);
    fadeHold = hold || 0;
  }
  // いまどれだけ暗いか(0=透明 1=真っ暗)
  function fadeAlpha() {
    if (fadeLeft <= 0) return 0;
    var total = fadeSpan * 2 + fadeHold;
    var done = total - fadeLeft;
    if (done < fadeSpan) return done / fadeSpan;              // 暗くなっていく
    if (done < fadeSpan + fadeHold) return 1;                 // 真っ暗のまま
    return Math.max(0, (total - done) / fadeSpan);            // 明るくなっていく
  }
  function isFading() { return fadeLeft > 0; }

  function clear() { shakeLeft = 0; veilLeft = 0; flashes = {}; }

  function tick() {
    if (fadeLeft > 0) fadeLeft -= 1;
    if (shakeLeft > 0) shakeLeft -= 1;
    if (veilLeft > 0) veilLeft -= 1;
    for (var k in flashes) {
      flashes[k] -= 1;
      if (flashes[k] <= 0) delete flashes[k];
    }
  }

  // いま画面をどれだけずらすか。だんだん収まるように減衰させる
  function offset() {
    if (shakeLeft <= 0) return { x: 0, y: 0 };
    var decay = shakeLeft / shakeSpan;
    var amp = shakePower * decay * decay;
    // 交互に振れる揺れ。乱数より、左右に振れるほうが「打たれた」感じが出る
    var sign = (shakeLeft % 2 === 0) ? 1 : -1;
    return { x: sign * amp, y: sign * amp * 0.4 };
  }

  function veilAlpha() { return veilLeft <= 0 ? 0 : (veilLeft / veilSpan) * 0.32; }
  function veilTone() { return veilColor; }
  function enemyFlash(key) { return (flashes[key] || 0) / FLASH_SPAN; }

  return {
    shake: shake, veil: veil, partyHurt: partyHurt, enemyHurt: enemyHurt,
    critical: critical, clear: clear, tick: tick,
    offset: offset, veilAlpha: veilAlpha, veilTone: veilTone, enemyFlash: enemyFlash,
    fade: fade, fadeAlpha: fadeAlpha, isFading: isFading,
  };
})();

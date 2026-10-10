// このファイルの役目：阻害ゲージ（偽名「ベル」の認識阻害の残り）。仕様書 7-1。
// ベルが力や言霊を使うと大きく減り、探知網の濃い場所（マップの detection）を歩くと少しずつ減る。
// ゼロになると、正体が露見する（js/scenes/exposure.js）。数字は balance.js の INHIBIT。
(function () {
  const G = window.GAME = window.GAME || {};
  const I = () => G.DATA.balance.INHIBIT;

  function value() { return G.state ? G.state.inhibit : I().MAX; }
  function ratio() { return value() / I().MAX; }
  function exposed() { return !!G.state && G.state.inhibit <= 0; }
  function set(v) { G.state.inhibit = Math.max(0, Math.min(I().MAX, v)); }

  // 偽名で人間界にいる間（4〜9章）だけ、ゲージが動く
  function on() { return !!G.state && !!G.state.disguised; }

  // 減らす。ゼロになったら true
  function drain(amount) {
    if (!on() || amount <= 0) return false;
    set(G.state.inhibit - amount);
    return exposed();
  }

  // 言霊を唱えたときに減る量
  function kotodamaCost(k) { return I().KOTODAMA_BASE + Math.ceil((k.mp || 0) * I().PER_MP); }

  // 1歩歩いたとき（ベルがその場にいるときだけ）
  function step(map) {
    if (!map || !map.detection || G.state.split === 'away') return false;
    return drain(I().DETECT_STEP[map.detection] || 0);
  }

  // 宿屋：満タンの INN_RESTORE まで戻る
  function rest() {
    set(Math.max(value(), I().MAX * I().INN_RESTORE));
  }

  // 輪郭が揺れるほど減っているか
  function warning() { return on() && ratio() < I().WARN; }

  // 画面の端の小さなゲージ（満タンは青、減ると赤へ）
  function drawGauge(x, y) {
    if (!on() || !G.state.inhibitShown || !G.party.member('bell')) return;
    const r = G.renderer, w = 64, h = 6, t = ratio();
    G.ui.drawWindow(x, y, w + 52, 22);
    r.text('阻害', x + 8, y + 5, '#ccc');
    r.rect(x + 40, y + 8, w, h, '#222');
    const red = Math.round(70 + 185 * (1 - t)), blue = Math.round(80 + 175 * t);
    r.rect(x + 40, y + 8, Math.round(w * t), h, `rgb(${red}, ${Math.round(90 * t + 40)}, ${blue})`);
  }

  G.inhibit = { on, value, ratio, exposed, set, drain, kotodamaCost, step, rest, warning, drawGauge };
})();

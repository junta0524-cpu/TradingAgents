// スマホ用の仮想パッド ― 十字キーと決定/キャンセルを画面下に置く。
// 自前で DOM とスタイルを組み立てるので、読み込むだけで有効になる
// (index.html にも、1枚にまとめたプレビュー版にも同じものが載る)。
var Game = window.Game || {};
Game.Touch = (function () {
  // 指で操作する端末でだけ出す。マウスの環境には邪魔なので出さない。
  function isTouchDevice() {
    return ('ontouchstart' in window) ||
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  }

  var STYLE = [
    '.rk-pad{',
    '  display:flex; align-items:center; justify-content:space-between;',
    '  gap:1rem; width:100%; max-width:420px;',
    /* 縦に並ぶ本文の一番下へ沈める。親指が届く位置に置きたいため */
    '  margin:auto auto 0;',
    '  touch-action:none; user-select:none; -webkit-user-select:none;',
    '  -webkit-tap-highlight-color:transparent;',
    '}',
    '.rk-dpad{ display:grid; grid-template-columns:repeat(3,52px); grid-template-rows:repeat(3,52px); }',
    '.rk-actions{ display:flex; flex-direction:column; gap:.6rem; }',
    '.rk-btn{',
    '  display:flex; align-items:center; justify-content:center;',
    '  background:#1f2438; color:#ece7da; border:2px solid #cbbfa0;',
    '  border-radius:8px; font-size:1.1rem; font-weight:700;',
    '  font-family:"Yu Gothic","Hiragino Sans",sans-serif;',
    '  cursor:pointer; padding:0; line-height:1;',
    '}',
    '.rk-btn:active,.rk-btn.rk-on{ background:#3a4363; border-color:#d4af5a; color:#d4af5a; }',
    '.rk-btn.rk-round{ width:64px; height:64px; border-radius:50%; font-size:.85rem; }',
    '.rk-btn.rk-blank{ background:transparent; border-color:transparent; pointer-events:none; }',
    '.rk-btn:focus-visible{ outline:2px solid #d4af5a; outline-offset:2px; }',
    '@media (max-width:380px){',
    '  .rk-dpad{ grid-template-columns:repeat(3,46px); grid-template-rows:repeat(3,46px); }',
    '  .rk-btn.rk-round{ width:56px; height:56px; }',
    '}',
  ].join('\n');

  function injectStyle() {
    var el = document.createElement('style');
    el.textContent = STYLE;
    document.head.appendChild(el);
  }

  // action を押しっぱなしにできるボタン。指を離す/ずらすと必ず離す。
  function makeButton(label, action, extraClass) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'rk-btn' + (extraClass ? ' ' + extraClass : '');
    b.textContent = label;
    b.setAttribute('aria-label', label);
    if (!action) { b.classList.add('rk-blank'); b.tabIndex = -1; return b; }

    // 移動はキーの「押しっぱなし」を見て判定しているので、指で軽く叩いただけだと
    // 次の描画までに離れてしまい、一歩も動かないことがある。
    // そこで、離すのを最低 MIN_HOLD ミリ秒だけ遅らせ、タップでも確実に一歩進むようにする。
    var MIN_HOLD = 140;
    var holding = false;
    var pressedAt = 0;
    var releaseTimer = null;

    function finish() {
      releaseTimer = null;
      holding = false;
      b.classList.remove('rk-on');
      Game.Input.release(action);
    }
    function start(e) {
      if (e) e.preventDefault();
      if (releaseTimer) { clearTimeout(releaseTimer); releaseTimer = null; }
      if (holding) return;
      holding = true;
      pressedAt = Date.now();
      b.classList.add('rk-on');
      Game.Input.press(action);
    }
    function end(e) {
      if (e) e.preventDefault();
      if (!holding || releaseTimer) return;
      var held = Date.now() - pressedAt;
      if (held >= MIN_HOLD) finish();
      else releaseTimer = setTimeout(finish, MIN_HOLD - held);
    }

    b.addEventListener('touchstart', start, { passive: false });
    b.addEventListener('touchend', end, { passive: false });
    b.addEventListener('touchcancel', end, { passive: false });
    // 指が滑ってボタンの外へ出たときに押しっぱなしにならないようにする
    b.addEventListener('touchmove', function (e) {
      var t = e.touches[0];
      if (!t) return;
      var r = b.getBoundingClientRect();
      var inside = t.clientX >= r.left && t.clientX <= r.right &&
                   t.clientY >= r.top && t.clientY <= r.bottom;
      if (!inside) end(e);
    }, { passive: false });
    // マウスでも一応押せるようにしておく(検証用)
    b.addEventListener('mousedown', start);
    window.addEventListener('mouseup', function () { end(); });
    return b;
  }

  function build() {
    var pad = document.createElement('div');
    pad.className = 'rk-pad';

    var dpad = document.createElement('div');
    dpad.className = 'rk-dpad';
    // 3x3 に配置し、四隅は当たり判定のない空きにする
    var layout = [
      ['', null], ['↑', 'up'], ['', null],
      ['←', 'left'], ['', null], ['→', 'right'],
      ['', null], ['↓', 'down'], ['', null],
    ];
    layout.forEach(function (cell) { dpad.appendChild(makeButton(cell[0], cell[1])); });

    var actions = document.createElement('div');
    actions.className = 'rk-actions';
    actions.appendChild(makeButton('けってい', 'confirm', 'rk-round'));
    actions.appendChild(makeButton('もどる', 'cancel', 'rk-round'));

    pad.appendChild(dpad);
    pad.appendChild(actions);
    return pad;
  }

  function mount() {
    if (!isTouchDevice()) return;
    injectStyle();
    var pad = build();
    var canvas = document.getElementById('game-canvas');
    // canvas を包んでいる要素の直後に置き、ゲーム画面に重ならないようにする
    var anchor = (canvas && canvas.parentElement) || document.body;
    if (anchor.parentElement) anchor.parentElement.insertBefore(pad, anchor.nextSibling);
    else document.body.appendChild(pad);
  }

  return { mount: mount, isTouchDevice: isTouchDevice };
})();

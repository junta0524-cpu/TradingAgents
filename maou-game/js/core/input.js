// このファイルの役目：キーボードとタッチ操作を、ゲーム共通の「命令」に変換する。
// 命令：up / down / left / right（移動・カーソル）、ok（決定）、cancel（キャンセル）、fast（早送り・ダッシュ）、debug（F1）
// ゲーム側は「どのキーか」を気にせず、命令名だけを見ればよい。
(function () {
  const G = window.GAME = window.GAME || {};

  const KEYMAP = {
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    KeyZ: 'ok', Enter: 'ok', NumpadEnter: 'ok', Space: 'ok',
    KeyX: 'cancel', Escape: 'cancel',
    ShiftLeft: 'fast', ShiftRight: 'fast',
    F1: 'debug',
  };
  const ACTIONS = ['up', 'down', 'left', 'right', 'ok', 'cancel', 'fast', 'debug'];

  // 命令ごとに「いま押しているもの」の一覧（キーボードとタッチを同時に扱うため）
  const sources = {};
  const pressedNow = {};   // このコマで押され始めた
  const heldFrames = {};   // 押し続けているコマ数
  ACTIONS.forEach(a => { sources[a] = new Set(); pressedNow[a] = false; heldFrames[a] = 0; });

  function press(action, src) {
    if (sources[action].size === 0) pressedNow[action] = true;
    sources[action].add(src);
  }
  function release(action, src) { sources[action].delete(src); }
  function releaseAll() { ACTIONS.forEach(a => sources[a].clear()); }

  // ---- キーボード ----
  window.addEventListener('keydown', e => {
    const action = KEYMAP[e.code];
    if (!action) return;
    e.preventDefault();               // 矢印でページが動く・F1でヘルプが開く、を防ぐ
    if (e.repeat) return;
    press(action, 'key:' + e.code);
  });
  window.addEventListener('keyup', e => {
    const action = KEYMAP[e.code];
    if (action) release(action, 'key:' + e.code);
  });
  window.addEventListener('blur', releaseAll);

  // ---- タッチ（画面下のボタン）----
  function bindButtons() {
    document.querySelectorAll('#pad button[data-action]').forEach(btn => {
      const action = btn.dataset.action;
      const src = 'btn:' + action;
      const on = e => { e.preventDefault(); btn.classList.add('on'); press(action, src); };
      const off = e => { e.preventDefault(); btn.classList.remove('on'); release(action, src); };
      btn.addEventListener('pointerdown', on);
      btn.addEventListener('pointerup', off);
      btn.addEventListener('pointercancel', off);
      btn.addEventListener('pointerleave', off);
      btn.addEventListener('contextmenu', e => e.preventDefault());
    });
    // ゲーム画面そのものをタップしても「決定」になる（メッセージ送り用）
    const canvas = document.getElementById('game');
    if (canvas) {
      canvas.addEventListener('pointerdown', e => { e.preventDefault(); press('ok', 'tap'); });
      const up = () => release('ok', 'tap');
      canvas.addEventListener('pointerup', up);
      canvas.addEventListener('pointercancel', up);
      canvas.addEventListener('pointerleave', up);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindButtons);
  else bindButtons();

  const REPEAT_DELAY = 18;  // 押しっぱなしで連続入力が始まるまでのコマ数
  const REPEAT_RATE = 5;    // 連続入力の間隔（コマ数）

  G.input = {
    // 押している間ずっと true
    held(action) { return sources[action].size > 0; },
    // 押した瞬間だけ true
    pressed(action) { return pressedNow[action]; },
    // 押した瞬間＋押しっぱなしで一定間隔ごとに true（カーソル移動用）
    repeat(action) {
      if (pressedNow[action]) return true;
      const f = heldFrames[action];
      return f >= REPEAT_DELAY && (f - REPEAT_DELAY) % REPEAT_RATE === 0;
    },
    // 押し始めの記録を消す（場面が切り替わった直後の誤入力防止）
    consume(action) { pressedNow[action] = false; },
    // 1コマの終わりに呼ぶ
    endFrame() {
      ACTIONS.forEach(a => {
        heldFrames[a] = sources[a].size > 0 ? heldFrames[a] + 1 : 0;
        pressedNow[a] = false;
      });
    },
    releaseAll,
  };
})();

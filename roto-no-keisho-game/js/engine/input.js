// 入力管理 ― キー押下状態と「今フレームで押された」判定をまとめて提供する
var Game = window.Game || {};
Game.Input = (function () {
  var down = {};
  var pressedThisFrame = {};

  var KEYMAP = {
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    Enter: 'confirm', KeyZ: 'confirm', Space: 'confirm',
    Escape: 'cancel', KeyX: 'cancel',
  };

  window.addEventListener('keydown', function (e) {
    var action = KEYMAP[e.code];
    if (!action) return;
    if (!down[action]) pressedThisFrame[action] = true;
    down[action] = true;
    e.preventDefault();
  });

  window.addEventListener('keyup', function (e) {
    var action = KEYMAP[e.code];
    if (!action) return;
    down[action] = false;
  });

  // 画面上の仮想ボタン(スマホのパッド)からも、キーボードと同じ経路で入力を流す
  function press(action) {
    if (!down[action]) pressedThisFrame[action] = true;
    down[action] = true;
  }
  function release(action) { down[action] = false; }

  return {
    isDown: function (action) { return !!down[action]; },
    wasPressed: function (action) { return !!pressedThisFrame[action]; },
    press: press, release: release,
    // 各フレームの終わりに呼び、「今フレームで押された」を消費する
    endFrame: function () { pressedThisFrame = {}; },
  };
})();

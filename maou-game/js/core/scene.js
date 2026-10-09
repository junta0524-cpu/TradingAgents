// このファイルの役目：場面（タイトル、町、戦闘など）の切り替えを管理する。
// 場面は「積み重ね」で持つ。上に積んだ場面（メッセージやメニュー）ほど手前に描かれ、
// キー操作は一番上の場面だけが受け取る。
(function () {
  const G = window.GAME = window.GAME || {};

  // 場面の形：{ name, enter(), leave(), resume(), update(), draw() } （どれも省略可）
  const stack = [];

  G.scene = {
    // 全部入れ替える（例：タイトル → 町）
    change(scene) {
      while (stack.length) { const s = stack.pop(); s.leave && s.leave(); }
      stack.push(scene);
      scene.enter && scene.enter();
    },
    // 上に重ねる（例：町の上にメッセージ）
    push(scene) {
      stack.push(scene);
      scene.enter && scene.enter();
    },
    // 一番上を取り除く
    pop() {
      const s = stack.pop();
      if (s && s.leave) s.leave();
      const top = stack[stack.length - 1];
      if (top && top.resume) top.resume();
      return s;
    },
    top() { return stack[stack.length - 1]; },
    names() { return stack.map(s => s.name || '?'); },
    update() {
      const top = stack[stack.length - 1];
      if (top && top.update) top.update();
    },
    draw() {
      // 下から順に描く。opaque な場面より下は描かなくてよい
      let start = 0;
      for (let i = stack.length - 1; i >= 0; i--) { if (stack[i].opaque) { start = i; break; } }
      for (let i = start; i < stack.length; i++) stack[i].draw && stack[i].draw();
    },
  };
})();

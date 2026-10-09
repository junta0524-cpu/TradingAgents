// このファイルの役目：道具の一覧（名前・説明）。
// 効き目や値段はフェーズ2〜3で足す。新しい道具は1行足すだけで増やせる。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};

  G.DATA.items = {
    kizugusuri: { name: '傷薬', desc: '傷に塗る薬。少し体力が戻る。' },
    hoshiii:    { name: '干し飯', desc: '旅の保存食。' },
  };
})();

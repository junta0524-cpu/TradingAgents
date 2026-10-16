// このファイルの役目：状態異常の一覧（名前・画面に出す1文字・どう効くか）。
// 続くターン数などの数字は js/data/balance.js の STATUS にある。
// keep：戦いが終わっても残る（毒だけ）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};

  G.DATA.status = {
    sleep:   { name: '眠り',   tag: '眠', color: '#9cf', on: 'は眠ってしまった！',           off: 'は目を覚ました。',     still: 'は眠っている。' },
    confuse: { name: '混乱',   tag: '混', color: '#fc6', on: 'は混乱した！',                 off: 'は正気に戻った。',     still: 'は混乱している！' },
    silence: { name: '口封じ', tag: '封', color: '#ccc', on: 'は言霊を封じられた！',         off: 'は声を取り戻した。' },
    bind:    { name: '縛り',   tag: '縛', color: '#c9f', on: 'は縛られて動けなくなった！',   off: 'の縛りが解けた。',     still: 'は縛られて動けない。' },
    poison:  { name: '毒',     tag: '毒', color: '#9f6', on: 'は毒を受けた！',               off: 'の毒が消えた。',       keep: true },
    venom:   { name: '猛毒',   tag: '猛', color: '#6f6', on: 'は猛毒を受けた！',             off: 'の猛毒が消えた。' },
    oboro:   { name: '朧',     tag: '朧', color: '#aaa', on: 'の目がかすんだ！',             off: 'の目のかすみが晴れた。' },
  };
})();

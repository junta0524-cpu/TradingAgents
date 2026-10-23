// このファイルの役目：主な町（ミナモ・聖の森・炉ヶ岳・葛の里・天津京）で、道具屋と武具屋を別の建物に分けたときに足した店の部屋（ユーザー決定B）。
// 部屋の型は店（台の向こうに店の人）。下の敷物から外へ出る。品ぞろえは js/data/shops.js（〇〇_bugu＝武具、〇〇_dougu＝道具）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.minamo_bugu = {
    name: 'ミナモの武具屋',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' __________ ',
      ' __CCCCCC__ ',
      ' __________ ',
      ' k________k ',
      ' __________ ',
      ' __________ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'minamo', tx: 24, ty: 20, dir: 'down' },
      { x: 6, y: 8, to: 'minamo', tx: 24, ty: 20, dir: 'down' },
    ],
    npcs: [
      { id: 'minamo_bugu_keeper', look: 'merchant', x: 5, y: 2, dir: 'down', move: 'still', shop: 'minamo_bugu', talk: ['（仮）刃物も鎧も、港に着いたばかりの品だよ。'] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.hijiri_bugu = {
    name: '聖の森の武具屋',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' __________ ',
      ' __CCCCCC__ ',
      ' __________ ',
      ' k________k ',
      ' __________ ',
      ' __________ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'hijiri_village', tx: 18, ty: 13, dir: 'down' },
      { x: 6, y: 8, to: 'hijiri_village', tx: 18, ty: 13, dir: 'down' },
    ],
    npcs: [
      { id: 'hijiri_bugu_keeper', look: 'elf', x: 5, y: 2, dir: 'down', move: 'still', shop: 'hijiri_bugu', talk: ['（仮）弓も衣も、森の木と糸で作ったものです。'] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.ro_dougu = {
    name: '炉ヶ岳の道具屋',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' __________ ',
      ' __CCCCCC__ ',
      ' __________ ',
      ' k________k ',
      ' __________ ',
      ' __________ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'ro_village', tx: 9, ty: 4, dir: 'down' },
      { x: 6, y: 8, to: 'ro_village', tx: 9, ty: 4, dir: 'down' },
    ],
    npcs: [
      { id: 'ro_dougu_keeper', look: 'dwarf', x: 5, y: 2, dir: 'down', move: 'still', shop: 'ro_dougu', talk: ['（仮）山を越えるなら、薬は多めに持っていけ。'] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.kuzu_bugu = {
    name: '葛の里の武具屋',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' __________ ',
      ' __CCCCCC__ ',
      ' __________ ',
      ' k________k ',
      ' __________ ',
      ' __________ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'kuzu_village', tx: 11, ty: 12, dir: 'down' },
      { x: 6, y: 8, to: 'kuzu_village', tx: 11, ty: 12, dir: 'down' },
    ],
    npcs: [
      { id: 'kuzu_bugu_keeper', look: 'beastwoman', x: 5, y: 2, dir: 'down', move: 'still', shop: 'kuzu_bugu', talk: ['（仮）爪も牙もない人間には、刃が要るだろう。'] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.amatsu_dougu = {
    name: '天津京の道具屋',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' __________ ',
      ' __CCCCCC__ ',
      ' __________ ',
      ' k________k ',
      ' __________ ',
      ' __________ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'amatsu', tx: 12, ty: 16, dir: 'down' },
      { x: 6, y: 8, to: 'amatsu', tx: 12, ty: 16, dir: 'down' },
    ],
    npcs: [
      { id: 'amatsu_dougu_keeper', look: 'merchant', x: 5, y: 2, dir: 'down', move: 'still', shop: 'amatsu_dougu', talk: ['（仮）いらっしゃいませ。薬も干し飯も、きちんと揃えております。'] },
    ],
    chests: [],
    signs: [],
  };

})();

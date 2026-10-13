// このファイルの役目：天津京の貧民区の建物の中（部屋）のマップ。扉から入り、下の敷物から外へ出る。
// 住む人のひとことは物語に関わらない暮らしの声（ユーザー決定：短い生活の一言を足してよい）。店と宿の主人は台の向こう。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.slum_r1 = {
    name: '貧民区　小屋',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' +}+++++[[+ ',
      ' +++++++[[+ ',
      ' ++*****+++ ',
      ' ++*****+++ ',
      ' o++++++++} ',
      ' ++++++++++ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'amatsu_slum', tx: 3, ty: 5, dir: 'down' },
      { x: 6, y: 8, to: 'amatsu_slum', tx: 3, ty: 5, dir: 'down' },
    ],
    npcs: [
      { id: 'slum_r1_p1', look: 'beastwoman', x: 8, y: 5, dir: 'left', move: 'still', talk: ["「……戸を叩くなら、もっと静かに叩いておくれ」", "「夜に来る足音は、たいてい良い知らせじゃないからね」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.slum_r2 = {
    name: '貧民区　書き物の散らかった部屋',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' ||||++|||| ',
      ' ++++++++++ ',
      ' ++kkkk++++ ',
      ' ++++++++++ ',
      ' [+++++++}+ ',
      ' [+++++++++ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'amatsu_slum', tx: 9, ty: 5, dir: 'down' },
      { x: 6, y: 8, to: 'amatsu_slum', tx: 9, ty: 5, dir: 'down' },
    ],
    npcs: [
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.slum_r3 = {
    name: '貧民区　繕い屋',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' Z+]]++]]+Z ',
      ' ++++++++++ ',
      ' +kk++++kk+ ',
      ' ++++++++++ ',
      ' oo++++++}} ',
      ' ++++++++++ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'amatsu_slum', tx: 15, ty: 5, dir: 'down' },
      { x: 6, y: 8, to: 'amatsu_slum', tx: 15, ty: 5, dir: 'down' },
    ],
    npcs: [
      { id: 'slum_r3_p1', look: 'dwarf2', x: 8, y: 5, dir: 'left', move: 'still', talk: ["「靴でも鍋でも、直せるものは直す」", "「ここじゃ、新しい物はめったに手に入らない」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.slum_r4 = {
    name: '貧民区　小屋',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' +}+++++[[+ ',
      ' +++++++[[+ ',
      ' ++*****+++ ',
      ' ++*****+++ ',
      ' o++++++++} ',
      ' ++++++++++ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'amatsu_slum', tx: 21, ty: 5, dir: 'down' },
      { x: 6, y: 8, to: 'amatsu_slum', tx: 21, ty: 5, dir: 'down' },
    ],
    npcs: [
      { id: 'slum_r4_p1', look: 'kid_tail', x: 3, y: 5, dir: 'right', move: 'still', talk: ["「ここ、ひみつのかくれが」", "「おとなには、ないしょだよ」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.slum_r5 = {
    name: '貧民区　小屋',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' +}+++++[[+ ',
      ' +++++++[[+ ',
      ' ++*****+++ ',
      ' ++*****+++ ',
      ' o++++++++} ',
      ' ++++++++++ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'amatsu_slum', tx: 3, ty: 11, dir: 'down' },
      { x: 6, y: 8, to: 'amatsu_slum', tx: 3, ty: 11, dir: 'down' },
    ],
    npcs: [
    ],
    chests: [{ id: 'room', x: 1, y: 7, item: 'kizugusuri' }],
    signs: [],
  };

  G.DATA.maps.slum_r6 = {
    name: '貧民区　小屋',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' ]]++{}++[+ ',
      ' ++++++++[+ ',
      ' ++kk++++++ ',
      ' ++kk++++++ ',
      ' ++++++++++ ',
      ' ++++++++++ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'amatsu_slum', tx: 9, ty: 11, dir: 'down' },
      { x: 6, y: 8, to: 'amatsu_slum', tx: 9, ty: 11, dir: 'down' },
    ],
    npcs: [
      { id: 'slum_r6_p1', look: 'oldwoman', x: 8, y: 5, dir: 'left', move: 'still', talk: ["「昔は、王都の真ん中に住んでいたこともあったよ」", "「……昔の話さ」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.slum_r7 = {
    name: '貧民区　物置',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' oooo++oooo ',
      ' o++++++++o ',
      ' ++}}++}}++ ',
      ' ++++++++++ ',
      ' oo++++++oo ',
      ' ++++++++++ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'amatsu_slum', tx: 15, ty: 11, dir: 'down' },
      { x: 6, y: 8, to: 'amatsu_slum', tx: 15, ty: 11, dir: 'down' },
    ],
    npcs: [
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.slum_r8 = {
    name: '貧民区　小屋',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' +}+++++[[+ ',
      ' +++++++[[+ ',
      ' ++*****+++ ',
      ' ++*****+++ ',
      ' o++++++++} ',
      ' ++++++++++ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'amatsu_slum', tx: 21, ty: 11, dir: 'down' },
      { x: 6, y: 8, to: 'amatsu_slum', tx: 21, ty: 11, dir: 'down' },
    ],
    npcs: [
      { id: 'slum_r8_p1', look: 'villager', x: 3, y: 5, dir: 'right', move: 'still', talk: ["「明かりは小さくしておくんだ。外から見えないようにね」"] },
    ],
    chests: [],
    signs: [],
  };

})();

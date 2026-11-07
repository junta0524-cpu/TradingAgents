// このファイルの役目：マップ「黄泉の深淵　底」のデータ（クリア後の寄り道のいちばん奥）。四つの灯籠の謎・焼けた回廊・鍵の蔵。
// 灯籠を石碑の順（北→東→南→西）に灯すと北の門が開き、王の間の前を名喰いの王（番人）がふさぐ。西の蔵は上の淵の深淵の鍵で開く。
// しかけ（gimmicks）の動きは js/systems/gimmick.js。解き方の確かめは tools/dungeons.js。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.yomi_fuchi2 = {
    name: '黄泉の深淵　底',
    outside: '#000',
    start: { x: 12, y: 16, dir: 'up' },
    battleBg: 'night',
    bgm: 'abyss',
    tint: 'rgba(50,0,70,0.3)',
    encounter: { steps: [12, 20], groups: [['kage_oni', 'kage_oni', 'na_kui'], ['yomi_hebi', 'yomi_hebi'], ['na_kui', 'na_kui', 'na_kui', 'na_kui'], ['kage_oni', 'yomi_hebi', 'na_kui']] },
    rows: [
      '黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒',
      '黒黒黒黒黒黒黒黒黒闇闇闇闇闇闇闇黒黒黒黒黒黒黒黒',
      '黒黒黒黒黒黒黒黒黒闇闇闇闇闇闇闇黒黒黒黒黒黒黒黒',
      '黒黒黒黒黒黒黒黒黒黒黒黒闇黒黒黒黒黒黒黒黒黒黒黒',
      '黒黒黒黒黒黒黒黒黒黒黒黒闇黒黒黒黒黒黒黒黒黒黒黒',
      '黒黒黒黒黒黒黒黒黒黒黒黒門黒黒黒黒黒黒黒黒黒黒黒',
      '黒黒黒黒黒闇闇闇闇闇闇闇闇闇闇闇闇闇闇黒黒闇闇黒',
      '黒黒黒黒闇闇闇闇闇闇闇闇闇闇闇闇闇闇闇闇黒熱熱黒',
      '黒闇闇黒闇闇闇闇闇闇闇闇闇闇闇闇闇闇闇闇黒熱熱黒',
      '黒闇闇黒闇闇闇闇闇闇闇闇闇闇闇闇闇闇闇闇黒熱熱黒',
      '黒闇闇闇闇闇闇闇闇闇闇闇闇闇闇闇闇闇闇闇闇熱熱黒',
      '黒闇闇黒闇闇闇闇闇闇闇闇闇闇闇闇闇闇闇闇黒熱熱黒',
      '黒闇闇黒闇闇闇闇闇闇闇闇闇闇闇闇闇闇闇闇黒熱熱黒',
      '黒黒黒黒闇闇闇闇闇闇闇闇闇闇闇闇闇闇闇闇黒闇闇黒',
      '黒黒黒黒黒闇闇闇闇闇闇闇闇闇闇闇闇闇闇黒黒黒黒黒',
      '黒黒黒黒黒黒黒黒黒黒黒黒闇黒黒黒黒黒黒黒黒黒黒黒',
      '黒黒黒黒黒黒黒黒黒黒黒黒闇黒黒黒黒黒黒黒黒黒黒黒',
      '黒黒黒黒黒黒黒黒黒黒黒黒S黒黒黒黒黒黒黒黒黒黒黒',
    ],
    flagTiles: [
      { x: 12, y: 5, ch: '闇', if: 'gm:yomi_fuchi2:names' },   // 灯籠の謎で開く北の門
    ],
    warps: [
      { x: 12, y: 17, to: 'yomi_fuchi1', tx: 12, ty: 14, dir: 'up' },
    ],
    gimmicks: [
      { type: 'sequence', id: 'names', done: '四つの灯籠に、紫の火が揃った。北の門が、軋みながら上がっていく。', wrong: '灯りが、ふっと一度に消えた。順番がちがうらしい。' },
      { type: 'lantern', id: 'ln', seq: 'names', order: 0, x: 12, y: 7 },
      { type: 'lantern', id: 'le', seq: 'names', order: 1, x: 17, y: 10 },
      { type: 'lantern', id: 'ls', seq: 'names', order: 2, x: 12, y: 13 },
      { type: 'lantern', id: 'lw', seq: 'names', order: 3, x: 7, y: 10 },
      { type: 'lock', id: 'vault', x: 3, y: 10, ch: '門', key: 'fuchi_kagi', text: '鉄の扉に、鍵がかかっている。深淵の鍵が要りそうだ。' },
      { type: 'guardian', id: 'nushi', rec: 85, x: 12, y: 3, enemies: ['nakui_ou'], reward: 'manai_shizuku', text: '奪われた名の文字が、灰のように渦を巻いている。その中心で、黒い鎧の影が、ゆっくりと顔を上げた。', win: '名喰いの王は崩れ、渦を巻いていた名の文字が、光になって散っていった。' },
    ],
    chests: [
      { id: 'throne1', x: 10, y: 1, item: 'kokoro_kagami' },
      { id: 'throne2', x: 14, y: 1, copper: 5000 },
      { id: 'vault', x: 1, y: 8, item: 'inochi_ishi' },
      { id: 'vault2', x: 1, y: 12, item: 'mezamashi', count: 3 },
      { id: 'east', x: 22, y: 6, item: 'fuku_suzu' },
    ],
    signs: [
      { x: 14, y: 14, text: '石碑がある。\n「名を喰らう王は、北で目覚め、東で喰らい、南で眠り、西へ去る」' },
    ],
    spots: [],
    npcs: [],
  };
})();

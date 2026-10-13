// このファイルの役目：マップ「風の岩溝」のデータ。獣ノ原の南東の岩溝（寄り道）。吹き抜ける風に流される床・風向きを変えるレバー・鍵の扉。
// 右下のレバーで、東の縦の風が下向きから上向きに変わる（flagTiles）。帰り道は西へ流れる風。
// しかけ（gimmicks）の動きは js/systems/gimmick.js。設計と解き方の確かめは tools/check.js。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.kemono_ravine = {
    name: '風の岩溝',
    outside: '#3a3020',
    start: {'x': 3, 'y': 15, 'dir': 'up'},
    battleBg: 'wild',
    encounter: {'steps': [12, 22], 'groups': [['arano_ookami'], ['oosasori'], ['arano_ookami', 'oosasori'], ['oosasori', 'oosasori'], ['arano_ookami', 'arano_ookami']]},
    rows: [
      'RRRRRRRRRRRRRRRRRRRRRRRR',
      'ReeeRRRRReeeeeeeeeeeeeeR',
      'RRReRRRRRRRRRRRReRRRRR↓R',
      'RRReee→→eeRe↓eeR↓eeeeR↓R',
      'RRReeReee↑ee↓eee↓e←←eR↓R',
      'RRRe↑eeee↑eReeRe↓eeeeR↓R',
      'RRRR↑eRee↑eeeeee↓eeeRR↓R',
      'RRRe↑eeeeee←←←eeeReeeR↓R',
      'RRRRRRRRRR↓RRRRRRRRRRR↓R',
      'Re→→→→→→→→→→→→→→→→→→→→eR',
      'ReRRRRRRRRRRRRRRRRRReeeR',
      'Re←←←←←←←←←←←←←←←←←←eeeR',
      'ReeeeeeRRRRRRRRRRRRReeeR',
      'ReeeeeeRRRRRRRRRRRRReeeR',
      'ReeeeeeRRRRRRRRRRRRReeeR',
      'ReeeeeeRRRRRRRRRRRRRRRRR',
      'RRRORRRRRRRRRRRRRRRRRRRR',
    ],
    flagTiles: [
      {'x': 22, 'y': 2, 'ch': '↑', 'if': 'ravine_lever'},
      {'x': 22, 'y': 3, 'ch': '↑', 'if': 'ravine_lever'},
      {'x': 22, 'y': 4, 'ch': '↑', 'if': 'ravine_lever'},
      {'x': 22, 'y': 5, 'ch': '↑', 'if': 'ravine_lever'},
      {'x': 22, 'y': 6, 'ch': '↑', 'if': 'ravine_lever'},
      {'x': 22, 'y': 7, 'ch': '↑', 'if': 'ravine_lever'},
      {'x': 22, 'y': 8, 'ch': '↑', 'if': 'ravine_lever'},
    ],
    warps: [
      {'x': 3, 'y': 16, 'to': 'kemono_field', 'tx': 30, 'ty': 18, 'dir': 'up'},
    ],
    gimmicks: [
      {'type': 'lever', 'id': 'wind', 'x': 22, 'y': 14, 'flag': 'ravine_lever', 'text': '古いレバーを動かした。岩溝の奥で、風の向きが変わる音がした。'},
      {'type': 'lock', 'id': 'door', 'x': 13, 'y': 1, 'ch': '扉', 'key': 'iwamizo_kagi', 'text': '岩をくりぬいた扉だ。鍵がかかっている。'},
      {'type': 'guardian', 'id': 'nushi', 'x': 12, 'y': 1, 'enemies': ['kaze_oowashi'], 'reward': 'owashi_hane', 'text': '岩溝の風が、一羽の大鷲のまわりで渦を巻いている。', 'win': '大鷲は、風に乗って谷の向こうへ飛び去った。'},
    ],
    chests: [
      {'id': 'key', 'x': 1, 'y': 1, 'item': 'iwamizo_kagi'},
      {'id': 'cloak', 'x': 9, 'y': 1, 'item': 'kazekiri_gaitou'},
    ],
    signs: [
      {'x': 5, 'y': 12, 'text': '風化した石碑がある。\n「谷を渡る風は、番人の仕掛けで向きを変える。風に逆らうな。風を選べ」'},
    ],
    spots: [],
    npcs: [],
  };
})();

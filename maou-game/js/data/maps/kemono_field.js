// このファイルの役目：マップ「獣ノ原」のデータ。7章で歩く荒野（敵が出る）。西の境に杭、東は葛の里。
// 焼かれた集落の跡が点々と残る。ウズメが一緒にいると、岩陰の抜け道が見つかる。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.kemono_field = {
    name: '獣ノ原',
    outside: '#3a3020',
    start: { x: 1, y: 10, dir: 'right' },
    battleBg: 'wild',
    encounter: {
      steps: [12, 22],
      groups: [['arano_ookami'], ['arano_ookami', 'arano_ookami'], ['oosasori'], ['oosasori', 'arano_ookami'], ['arano_ookami', 'arano_ookami', 'arano_ookami']],
    },
    rows: [
      'iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii',
      'ieeeeeeeeeeeeeeeeeeeeeeeeeeeeeei',
      'iexee..eeeeeeeiieeeeeeeeeeeeeeei',
      'iexeeeeeeAAeAeeeeeeeeeiieeeeeeei',
      'iexeeeiieAeeeAeeeeeeeeiieeeeeeei',
      'iexeeeiieeeAeeeeeeee..eeeeeeeeei',
      'iexeeeeeeAeeeAAeeeeee..eeeeeeeei',
      'iexeeeeeeeAAeeeeeiieeeeeeeeeeeei',
      'ieeeeeeeeeeeeeeeeiieeeeeeeeeeeei',
      'iexe-------------------------eei',
      '-----eeeeeeeeeeeeeeeeeeeeeee----',
      'iexeeeeeeeeeeeeeeeeeeeeeeeeeeeei',
      'iexeeeiieeeeeeeeeeeeRRRRRRReeeei',
      'iexeeeiieeeeeeeeeeeeReeeeeReeeei',
      'iexeeeeeeeeeeeeeeeeeReeeeeReeeei',
      'iexeeeeeeeeiieeeeeeeRRRRRRReeeei',
      'iexeeeeeeeeiieeeeeeeeeeeeeeeeeei',
      'iexeeeeeeeeeeeeeeeeeeeeeeeeeeeei',
      'ieeeeeeeeeeeeeeeeeeeeeeeeeeeeeei',
      'iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii',
    ],
    // 岩陰の抜け道（ウズメが見つけると開く）
    flagTiles: [{ x: 24, y: 15, ch: 'e', if: 'ch7_secret' }],
    warps: [
      { x: 31, y: 10, to: 'kuzu_village', tx: 1, ty: 8, dir: 'right', requires: { if: 'ch7_uzume' }, blockedText: '（道の先に、小さな集落が見える）' },
    ],
    triggers: [
      { x: 14, y: 9, event: 'ch7_ruins', chapter: 7, if: 'ch7_uzume', unless: 'ch7_ruins' },
      { x: 14, y: 10, event: 'ch7_ruins', chapter: 7, if: 'ch7_uzume', unless: 'ch7_ruins' },
    ],
    spots: [{ x: 24, y: 15, event: 'ch7_secret', member: 'uzume', unless: 'ch7_secret' }],
    npcs: [],
    chests: [
      { id: 'hidden', x: 23, y: 13, item: 'hayate_obi' },
      { id: 'ruin', x: 10, y: 4, item: 'kizugusuri' },
      { id: 'shrub', x: 29, y: 2, copper: 120 },
    ],
    signs: [],
  };
})();

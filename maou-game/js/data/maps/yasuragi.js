// このファイルの役目：マップ「やすらぎの院」（花に囲まれた白壁の療養院）のデータ。9章で潜入する。
// 見張りが見回っていて、向いている方向の3マス以内に入ると見つかり、塀の外からやり直し（阻害ゲージも少し減る）。
// 北西の扉は大部屋、北東の扉は倉庫（地下の神殿へ）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  const WATCH = { move: 'still', chapter: 9, unless: 'ch9_temple', sight: 3, caught: 'ch9_caught', watchIf: { chapter: 9, unless: 'ch9_temple' }, talk: ['……。'] };
  G.DATA.maps.yasuragi = {
    name: 'やすらぎの院',
    outside: '#101018',
    start: { x: 13, y: 18, dir: 'up' },
    detection: 3,
    tint: 'rgba(10,16,50,0.5)',
    rows: [
      '1111111111111111111111111111',
      '1...TTTTT..........TTTTT...1',
      '1..III_IIIIIIIIIIIIII_III..1',
      '1..I____________________I..1',
      '1..I____________________I..1',
      '1..I____________________I..1',
      '1..IIIII_IIIIIIIIII_IIIII..1',
      '1..I____________________I..1',
      '1..I____________________I..1',
      '1..I____________________I..1',
      '1..IIIIIIIIII__IIIIIIIIII..1',
      '1..........................1',
      '1..........................1',
      '1.F..F..F..F..F..F..F..F...1',
      '1..........................1',
      '1..........................1',
      '1.F..F..F..F..F..F..F..F...1',
      '1..........................1',
      '1..........................1',
      '1111111111111..1111111111111',
    ],
    warps: [
      { x: 6, y: 2, to: 'yasuragi_ward', tx: 8, ty: 8, dir: 'up' },
      { x: 21, y: 2, to: 'yasuragi_temple', tx: 8, ty: 10, dir: 'up', requires: { if: 'ch9_ward' }, blockedText: '倉庫の奥に、石の扉がある。古い鍵が掛かっている。' },
    ],
    onEnter: [{ event: 'ch9_in', chapter: 9, unless: 'ch9_in' }],
    npcs: [
      Object.assign({ id: 'guard1', look: 'guard', x: 3, y: 12, dir: 'right', patrol: [[3, 12], [24, 12]] }, WATCH),
      Object.assign({ id: 'guard2', look: 'guard', x: 5, y: 8, dir: 'right', patrol: [[5, 8], [22, 8]], patrolWait: 30 }, WATCH),
      Object.assign({ id: 'guard3', look: 'guard', x: 22, y: 4, dir: 'left', patrol: [[22, 4], [5, 4]], patrolWait: 28 }, WATCH),
    ],
    chests: [],
    signs: [],
  };
})();

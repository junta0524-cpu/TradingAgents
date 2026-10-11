// このファイルの役目：マップ「葛の里」（オオナムチの故郷）のデータ。7章の舞台。里の中央に古い井戸がある。
// 昼：ハルとヒエダ、ユウの来訪。夜：井戸の前の対決。翌朝：タケルの視察。北東の岩屋はサルタヒコの広間。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  const DAY1 = { move: 'still', chapter: 7, if: 'ch7_kuzu', unless: 'ch7_well' };
  const MORNING = { move: 'still', chapter: 7, if: 'ch7_morning', unless: 'ch7_farewell' };
  G.DATA.maps.kuzu_village = {
    name: '葛の里',
    outside: '#3a3020',
    start: { x: 1, y: 8, dir: 'right' },
    detection: 2,   // 7章：タケルの視察で探知網が濃くなる
    tint: () => (G.state.chapter === 7 && G.flags.get('ch7_night') && !G.flags.get('ch7_morning') ? 'rgba(10,20,60,0.5)'
      : G.state.chapter === 7 && G.flags.get('ch7_farewell') ? 'rgba(10,20,60,0.45)' : null),
    rows: [
      'mmmmmmmmmmmmmmmmmmmmmmmmmm',
      'mVVVVVVVVVVVVVVVVVVVVVVVVm',
      'mV.YYY....YYY.....YYY..O.m',
      'mV.XdX....XdX.....XdX....m',
      'mV.......................m',
      'mV..YYY.........YYY......m',
      'mV..XdX....eee..XdX......m',
      'mV.........ewe...........m',
      '--.........eee...........m',
      'mV.......................m',
      'mV..YYY.........YYY......m',
      'mV..XdX.........XdX......m',
      'mV.......................m',
      'mVVVVVVVVVVVVVVVVVVVVVVVVm',
    ],
    warps: [
      { x: 0, y: 8, to: 'kemono_field', tx: 30, ty: 10, dir: 'left', requires: { unless: 'ch7_night' }, blockedText: '（いまは、里を離れられない）' },
      { x: 23, y: 2, to: 'saru_hall', tx: 7, ty: 6, dir: 'up', requires: { if: 'ch7_kuzu' }, blockedText: '大きな岩屋だ。' },
    ],
    onEnter: [{ event: 'ch7_kuzu', chapter: 7, if: 'ch7_uzume', unless: 'ch7_kuzu' }],
    triggers: [
      { x: 11, y: 6, event: 'ch7_well', chapter: 7, if: 'ch7_night', unless: 'ch7_well' },
      { x: 12, y: 6, event: 'ch7_well', chapter: 7, if: 'ch7_night', unless: 'ch7_well' },
      { x: 13, y: 6, event: 'ch7_well', chapter: 7, if: 'ch7_night', unless: 'ch7_well' },
      { x: 11, y: 7, event: 'ch7_well', chapter: 7, if: 'ch7_night', unless: 'ch7_well' },
      { x: 13, y: 7, event: 'ch7_well', chapter: 7, if: 'ch7_night', unless: 'ch7_well' },
      { x: 11, y: 8, event: 'ch7_well', chapter: 7, if: 'ch7_night', unless: 'ch7_well' },
      { x: 12, y: 8, event: 'ch7_well', chapter: 7, if: 'ch7_night', unless: 'ch7_well' },
      { x: 13, y: 8, event: 'ch7_well', chapter: 7, if: 'ch7_night', unless: 'ch7_well' }
    ],
    npcs: [
      { id: 'hal', look: 'hal', x: 9, y: 8, dir: 'right', move: 'still', chapter: 7, unless: 'ch7_well',
        talk: [{ name: 'ハル', text: '「おばあちゃんも、みんなも、こっちに来たんだよ。ここなら、井戸があるって」' }] },
      { id: 'granny', look: 'oldwoman', x: 6, y: 9, dir: 'up', move: 'still', chapter: 7,
        talk: ['あの薬を喜んでくれた老婆の、皺だらけの手を、思い出した。'] },
      Object.assign({ id: 'yuu', look: 'yuu', x: 12, y: 9, dir: 'up', talk: [{ name: 'ユウ', text: '「安全のためだ」' }] }, DAY1),
      Object.assign({ id: 'soldier1', look: 'soldier', x: 10, y: 9, dir: 'up', talk: ['……。'] }, DAY1),
      Object.assign({ id: 'soldier2', look: 'soldier', x: 14, y: 9, dir: 'up', talk: ['……。'] }, DAY1),
      Object.assign({ id: 'takeru', look: 'takeru', x: 10, y: 9, dir: 'down', talk: ['……。'] }, MORNING),
      Object.assign({ id: 'yuu_m', look: 'yuu', x: 14, y: 9, dir: 'down', talk: ['……。'] }, MORNING),
      { id: 'hieda_bed', look: 'hieda', x: 5, y: 7, dir: 'down', move: 'still', chapter: 7, if: 'ch7_well',
        talk: [{ name: 'ヒエダ', text: '「いけませんぞ、若いの。無理は」' }] },
      { id: 'saru_gate', look: 'sarutahiko', x: 2, y: 9, dir: 'right', move: 'still', chapter: 7, if: 'ch7_morning', unless: 'ch7_farewell', event: 'ch7_farewell' },
      { id: 'inn', look: 'villager', x: 4, y: 4, dir: 'down', move: 'still', inn: true, talk: ['……。'] },
      { id: 'shop', look: 'kid_tail', x: 11, y: 4, dir: 'down', move: 'still', shop: 'kuzu', talk: ['……。'] },
    ],
    chests: [{ id: 'corner', x: 24, y: 12, item: 'mezamashi' }],
    signs: [],
  };
})();

// このファイルの役目：広い地図（人間界・魔界）を「エリア」に分け、エリアごとに出る敵の種類を変える。
// 一番近い印（x,y）のエリアになる。tier＝そのエリアの敵が本来出る章。いまの章よりずっと先のエリアに迷い込むと、先の章の強い敵が出る（遊び心）。
// add＝そのエリアの土地ならではの組。risky＝危険な辺境（gap 3以上）で混ざる、桁違いの組。danger＝tier に関わらず危険（魔界の奥）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  const COAST = [['ookaeru'], ['ookaeru', 'dog'], ['kobachi', 'kobachi']];
  const FOREST = [['kodama_ko'], ['koke_inoshishi'], ['morigumo', 'kodama_ko']];
  const MOUNT = [['sumikui'], ['susukemuri'], ['iwatokage', 'hinezumi']];
  const WILD = [['sajin_hebi'], ['hagetaka'], ['arano_ushi'], ['arano_ookami', 'sajin_hebi']];
  const CITY = [['wansho_jutsu', 'junkai'], ['wansho_kihei'], ['junkai', 'junkai']];
  const DEEP = [['arano_ookami', 'arano_ookami', 'arano_ookami'], ['oosasori', 'arano_ookami', 'arano_ookami'], ['arano_ushi', 'arano_ushi', 'oosasori']];

  G.DATA.areas = {
    world_ningen: [
      { x: 66, y: 54, name: 'ミナモのまわり', tier: 4, add: COAST },
      { x: 86, y: 54, name: 'ウキハシのあたり', tier: 4, add: COAST },
      { x: 82, y: 38, name: 'ひなた野', tier: 4, add: [['kobachi', 'moth'], ['dog', 'dog']] },
      { x: 94, y: 42, name: 'タカマの丘', tier: 5, add: [['fox'], ['fox', 'dog']] },
      { x: 90, y: 74, name: 'イナサの浜', tier: 5, add: COAST },
      { x: 30, y: 62, name: '聖の森', tier: 5, add: FOREST },
      { x: 18, y: 54, name: 'ククノチの森', tier: 5, add: FOREST },
      { x: 34, y: 54, name: 'ヤチマタの辻', tier: 5, add: FOREST },
      { x: 34, y: 38, name: 'マガネの山', tier: 6, add: MOUNT },
      { x: 34, y: 22, name: '炉ヶ岳', tier: 6, add: MOUNT },
      { x: 54, y: 26, name: 'イワクラの岩場', tier: 7, add: MOUNT },
      { x: 50, y: 10, name: '獣ノ原', tier: 7, add: WILD },
      { x: 106, y: 46, name: '天津京のまわり', tier: 8, add: CITY },
      { x: 106, y: 66, name: 'ミズホの野', tier: 8, add: CITY },
      // 町から遠い辺境：どの章でも手強い（寄り道の宝箱の番をしている）
      { x: 8, y: 8, name: '北西の辺境', tier: 9, danger: true, risky: DEEP },
      { x: 120, y: 12, name: '北東の辺境', tier: 9, danger: true, risky: DEEP },
      { x: 8, y: 80, name: '南西の辺境', tier: 9, danger: true, risky: DEEP },
      { x: 62, y: 84, name: '南の果て', tier: 9, danger: true, risky: DEEP },
      { x: 120, y: 82, name: '南東の辺境', tier: 9, danger: true, risky: DEEP },
    ],
    world_makai: [
      { x: 62, y: 70, name: '土蜘蛛の谷', add: [['yomotsu_inu'], ['hainezumi', 'hainezumi']] },
      { x: 62, y: 10, name: '宮のまわり', add: [['yakeno_onibi'], ['yomotsu_inu', 'yomotsu_inu']] },
      { x: 18, y: 42, name: '角ヶ原', add: [['hainezumi', 'yakeno_onibi']] },
      { x: 102, y: 38, name: '嵐ヶ峰', add: [['yomotsu_inu', 'yakeno_onibi']] },
      { x: 110, y: 74, name: 'ヨミノハラ', danger: true, risky: [['kage_oni'], ['kage_oni', 'yomotsu_inu'], ['yomi_hebi']] },
      { x: 114, y: 66, name: 'イワヤトの奥', danger: true, risky: [['na_kui'], ['kage_oni', 'na_kui']] },
    ],
  };
})();

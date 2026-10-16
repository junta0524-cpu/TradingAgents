// このファイルの役目：マップ「港町ミナモ」のデータ（地形・人・宝箱・立て札・出入口）。
// 地形の文字の意味は js/data/tiles.js を見る。人のセリフはすべて仮（あとで小説の文章に差し替える）。
// 座標は左上が (0, 0)。x は右へ、y は下へ増える。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.minamo = {
    name: '港町ミナモ',
    outside: '#2a5fa8',            // マップの外に見える色
    start: { x: 15, y: 12, dir: 'down' },
    detection: 1,   // 4〜6章は探知網が薄い（仕様書 7-1）
    rows: [
      '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
      '~~~~~=~~~~~~~~~~~~~~~~~~~~=~~~~~',
      '~~~~~=~~~~~~~~~~~~~~~~~~~~=~~~~~',
      '~~~~~=~~~~~~~~~~~~~~~~~~~~=~~~~~',
      'T:::::::::::::o::oo::::::::::::T',
      'T::::::::::::::::::::::::::::::T',
      'T.^^^^^..^^^^^^^^^^..^^^^^..F..T',
      'T.^^^^^..^^^^^^^^^^..^^^^^...F.T',
      'T.#WDW#..#W#WDD#W##..#WDW#.....T',
      'T...:........::::......:.......T',
      'T::::::::::::::::::::::::::::::T',
      'T.....:........::........:.....T',
      'T.....:..F.....::........:.....T',
      'T..^^^:^^......::.....^^^:^^...T',
      'T..^^^:^^......::.....^^^:^^...T',
      'T..#W#D##..w...::.....#W#D##...T',
      'T..............::..............T',
      'T..............::............T.T',
      'T.F.......T....::...F.........TT',
      'TT..........F..::..............T',
      'TT.............::....T.....F...T',
      'T.T............::...........T..T',
      'T..............::..............T',
      'TTTTTTTTTTTTTTT::TTTTTTTTTTTTTTT',
    ],
    // 出入口：(x, y) に乗ると、to のマップの (tx, ty) へ移る
    warps: [
      // 建物の中（js/data/maps/rooms_minamo.js）
      { x: 23, y: 8, to: 'minamo_r1', tx: 5, ty: 7, dir: 'up' },
      { x: 6, y: 15, to: 'minamo_r2', tx: 5, ty: 7, dir: 'up' },
      { x: 13, y: 8, to: 'minamo_guild', tx: 7, ty: 9, dir: 'up' },
      { x: 14, y: 8, to: 'minamo_guild', tx: 8, ty: 9, dir: 'up' },
      { x: 4, y: 8, to: 'minamo_inn', tx: 5, ty: 7, dir: 'up' },
      { x: 25, y: 15, to: 'minamo_shop', tx: 5, ty: 7, dir: 'up' },
      { x: 15, y: 23, to: 'field_minamo', tx: 20, ty: 3, dir: 'down' },
      { x: 16, y: 23, to: 'field_minamo', tx: 20, ty: 3, dir: 'down' },
    ],
    npcs: [
      { id: 'sailor', look: 'sailor', x: 6, y: 4, dir: 'down', move: 'still',
        talk: ['（仮）ここは港町ミナモ。人も荷も、まずこの港に集まるのさ。'] },
      { id: 'child', look: 'child', x: 9, y: 16, dir: 'down', move: 'wander',
        talk: ['（仮）井戸の水、つめたいんだよ。さわってみて！'] },
      { id: 'guard', look: 'guard', x: 17, y: 21, dir: 'down', move: 'still',
        talk: ['（仮）南の門を出ると野原だ。日が暮れる前に戻れよ。'] },
      { id: 'merchant', look: 'merchant', x: 24, y: 11, dir: 'left', move: 'wander',
        talk: ['（仮）道具屋なら、右下の建物だよ。宿屋は左上さ。'] },
      // 4章：焼き菓子の屋台（小説 第四章 一）
      { id: 'stall', look: 'merchant', x: 20, y: 11, dir: 'down', move: 'still',
        talk: ['店主は、人間の客の注文を先に捌いた。三人目が済んでも、手を止めて、後から来た別の人間の客に声をかけた。', { name: '店主', text: '「いらっしゃい、何にします」' }] },
      { id: 'kemomimi', look: 'beastwoman', x: 22, y: 12, dir: 'left', move: 'still',
        talk: ['順番なら、女が先のはずだった。女は何も言わなかった。目を伏せ、また列の端へ下がった。'] },
      { id: 'carter', look: 'villager', x: 11, y: 18, dir: 'right', move: 'wander',
        talk: [{ name: '荷車の男', text: '「おい、兄さん。そこ、邪魔だよ」' }] },
      { id: 'elder', look: 'elder', x: 4, y: 11, dir: 'down', move: 'still',
        talk: ['（仮）この町では、名を名乗るのが礼儀でな。', '（仮）……おや、旅の人かね。'] },
    ],
    chests: [
      { id: 'quay', x: 29, y: 5, item: 'kizugusuri' },
    ],
    signs: [
      { x: 12, y: 9, text: '冒険者ギルド　ミナモ支部' },
      { x: 17, y: 22, text: '南　野原へ' },
      // 通りの奥の掲示板（小説 第四章 一）
      { x: 19, y: 9, text: '迷い猫の捜索。荷運びの募集。その隅に、ひときわ大きな文字の紙が一枚あった。\n『魔族は話の通じぬ者たちである。正義は我らにあり』' },
    ],
  };
})();

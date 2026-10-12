// このファイルの役目：人間界のフィールドマップ（全体の地図）。1マスが一つの土地。ユーザーが描いた地図（デザインの「人間界（ゲーム用フィールド）」）の形どおり。
// 物語に出る町（ミナモ・ひなた野・聖の森・炉ヶ岳・獣ノ原・天津京）は小説の名前で置き、その章から入れる。ほかの地名はユーザーの地図の名前（立つと名前が出るだけ）。
// 町の上に乗ると、その土地のマップへ入る。土地のマップの端から、ここへ出てこられる。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  const NOT_YET = '（今は、ここに用はない）';

  G.DATA.maps.world_ningen = {
    name: '人間界',
    outside: '#2C5FA8',
    bgm: 'field',
    battleBg: 'field',
    // 敵の組は章ごと（その章の土地の敵）。道・町の上では出ない
    encounter: {
      steps: [18, 30],
      byChapter: {
        4: [['dog'], ['dog', 'dog'], ['boar'], ['centipede'], ['fox']],
        5: [['morigumo'], ['onibi'], ['tsuta'], ['morigumo', 'onibi']],
        6: [['iwatokage'], ['hinezumi', 'hinezumi'], ['yamagarasu']],
        7: [['arano_ookami'], ['oosasori'], ['arano_ookami', 'arano_ookami']],
        10: [],
      },
    },
    start: { x: 15, y: 13, dir: 'right' },
    rows: [
      '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~NN~NNN~~~~~~~~~~~~~',
      '~~~~~~~~~mNNBNNNNNNNNN~~~~~~~~~~',
      '~~~~~~~~mmmNNNNNNNNNNNNNN~~~~~~~',
      '~~~~.mmmmmmm...............~~~~~',
      '~~~~.mmmMmmm................~~~~',
      '~~~..mmm-mmm.9................~~',
      '~~~....m--m~..-................~~',
      '~~.....m-m~..-.....6666.......~~',
      '~~......j--=--.....6O66......~~~',
      '~~......-..~....q..6666B......~~',
      '~.......-...~...-.........9....~',
      '~~....66-...~...-.........-....~',
      '~~..j---M----=--M----M-----...~~',
      '~~..666-666..~........-...-...~~',
      '~~~.666j666...~.......-...-..~~~',
      '~~~~~666666...~.......-...9..~~~',
      '~~~~~66666.....~......-...~~~~~~',
      '~~~~~~~~6......~......M..~~~~~~~',
      '~~~~~~~~~~.....~.....~.~~~~~~~~~',
      '~~~~~~~~~~~~~~..~...~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    ],
    warps: [
      { x: 16, y: 13, to: 'minamo', tx: 15, ty: 22, dir: 'up', requires: { chapterFrom: 4, chapterTo: 9 }, blockedText: NOT_YET },
      { x: 20, y: 9, to: 'hinatano', tx: 1, ty: 8, dir: 'right', requires: { if: 'ch4_dogs', chapterTo: 9 }, blockedText: '（ひなた野。ギルドで届け物の依頼を受け、野原の道を通ってから行こう）' },
      { x: 7, y: 15, to: 'hijiri_path', tx: 13, ty: 20, dir: 'up', requires: { chapterFrom: 5, chapterTo: 9 }, blockedText: NOT_YET },
      { x: 8, y: 5, to: 'ro_path', tx: 12, ty: 19, dir: 'up', requires: { chapterFrom: 6, chapterTo: 9 }, blockedText: NOT_YET },
      { x: 12, y: 2, to: 'kemono_field', tx: 1, ty: 10, dir: 'right', requires: { chapterFrom: 7, chapterTo: 9 }, blockedText: NOT_YET },
      { x: 26, y: 11, to: 'amatsu', tx: 15, ty: 18, dir: 'up', requires: { chapterFrom: 8, chapterTo: 9 }, blockedText: NOT_YET },
    ],
    // 立つと左上に名前が出る（物語の町は小説の名前、ほかはユーザーの地図の名前）
    places: [
      { x: 16, y: 13, name: '港町ミナモ' },
      { x: 20, y: 9, name: 'ひなた野' },
      { x: 7, y: 15, name: '聖の森' },
      { x: 8, y: 5, name: '炉ヶ岳' },
      { x: 12, y: 2, name: '獣ノ原' },
      { x: 26, y: 11, name: '王都　天津京' },
      { x: 8, y: 9, name: '鉱夫村マガネ' },
      { x: 13, y: 6, name: 'イワクラ城' },
      { x: 8, y: 13, name: '宿場町ヤチマタ' },
      { x: 4, y: 13, name: '森の村ククノチ' },
      { x: 21, y: 13, name: '関所の町ウキハシ' },
      { x: 23, y: 10, name: 'タカマの丘' },
      { x: 26, y: 16, name: 'ミズホ離宮' },
      { x: 22, y: 18, name: '港町イナサ' },
    ],
    spots: [
      { x: 16, y: 10, text: '大穴だ。底は見えない。魔界へ通じているという。' },
    ],
    npcs: [],
    chests: [],
    signs: [],
  };
})();

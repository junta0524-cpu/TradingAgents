// このファイルの役目：マップ「苔むした地下道」のデータ。聖の森の洞窟の奥（寄り道）。苔の滑る広間・荒ぶる火の玉（心鎮め）・蔦（火種）・レバーと門。
// 火種は6章で覚えるので、蔦の奥の部屋は6章より後に戻ってくると開く。
// しかけ（gimmicks）の動きは js/systems/gimmick.js。設計と解き方の確かめは tools/check.js。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.hijiri_deep = {
    name: '苔むした地下道',
    outside: '#000',
    start: {'x': 4, 'y': 13, 'dir': 'up'},
    battleBg: 'forest',
    tint: 'rgba(0,30,10,0.25)',
    encounter: {'steps': [14, 24], 'groups': [['morigumo'], ['morigumo', 'onibi'], ['tsuta'], ['tsuta', 'tsuta'], ['onibi', 'onibi'], ['fox', 'morigumo']]},
    rows: [
      'RRRRRRRRRRRRRRRRRRRRRR',
      'RzzzzR滑滑滑滑R滑滑R滑滑滑滑zzzR',
      'RzzzzR滑滑R滑滑滑滑滑滑滑R滑zzzR',
      'RzzzzR滑滑滑滑滑R滑滑滑滑滑滑RRRR',
      'RRzRRR滑滑滑滑滑滑z滑滑滑滑滑zzRR',
      'RzzzzR滑滑滑R滑滑滑滑滑R滑滑RRRR',
      'RzzzzR滑R滑滑滑滑R滑滑滑滑滑RRRR',
      'RzzzzR滑滑滑滑滑滑滑滑R滑滑滑RRRR',
      'RRzRRRzRRRRRRRRRRRRRRR',
      'RzzzzRzRRRRRRRRRzzzzzR',
      'RzzzzRzRRRRRRRRRzzzzzR',
      'RzzzzRzRRRRRRRRRRR門RRR',
      'RzzzzzzzzzzzzzzzzzzzzR',
      'RzzzzzzzzzzzzzzzzzzzzR',
      'RzzzSzzzzzzzzzzzzzzzzR',
      'RRRRRRRRRRRRRRRRRRRRRR',
    ],
    flagTiles: [
      {'x': 18, 'y': 11, 'ch': 'z', 'if': 'deep_lever'},
    ],
    warps: [
      {'x': 4, 'y': 14, 'to': 'hijiri_cave', 'tx': 1, 'ty': 2, 'dir': 'down'},
    ],
    gimmicks: [
      {'type': 'seal', 'id': 'wisp', 'x': 6, 'y': 11, 'ch': '霊', 'need': 'kokoroshizume', 'text': '青白い火の玉が、通路の前で荒ぶっている。近づけない。', 'done': '火の玉は静まり、ふっと消えていった。'},
      {'type': 'seal', 'id': 'vine', 'x': 2, 'y': 4, 'ch': '蔦', 'need': 'hidane', 'text': '太い蔦が、幾重にも絡み合って道をふさいでいる。火があれば……。', 'done': '蔦は、ぱちぱちと音を立てて燃え落ちた。'},
      {'type': 'guardian', 'id': 'nushi', 'rec': 7, 'x': 18, 'y': 10, 'enemies': ['koke_ookumo'], 'reward': 'kumoginu', 'text': '苔に覆われた大きな影が、宝のある部屋をふさいでいる。赤い目が、こちらを見た。', 'win': '大蜘蛛は、苔の中へ崩れ落ちた。'},
      {'type': 'lever', 'id': 'lever', 'x': 19, 'y': 4, 'flag': 'deep_lever', 'once': true, 'text': '苔に埋もれたレバーを倒した。遠くで、門の上がる音がした。', 'doneText': 'レバーは、倒れたままだ。'},
    ],
    chests: [
      {'id': 'moss', 'x': 20, 'y': 1, 'item': 'kizugusuri', 'count': 2},
      {'id': 'gate', 'x': 20, 'y': 9, 'item': 'morimori_gaitou'},
      {'id': 'vine', 'x': 4, 'y': 1, 'item': 'kotonoha_juzu'},
    ],
    signs: [
      {'x': 8, 'y': 14, 'text': '岩に刻まれた文字がある。\n「苔はよく滑る。止まれるのは、乾いた岩の上だけ」'},
    ],
    spots: [],
    npcs: [],
  };
})();

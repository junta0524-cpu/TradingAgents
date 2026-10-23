// このファイルの役目：寄り道の拠点15か所に足した、道具屋と武具屋の部屋（ユーザー依頼：各拠点に武器屋・道具屋、拠点限定の品）。
// 部屋の型は店（台の向こうに店の人）。下の敷物から外へ出る。品ぞろえは js/data/shops.js。作ったのは tools/dungeon_design/base_shops.py。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.chibiki_dougu = {
    name: 'チビキ岩の道具屋',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' __________ ',
      ' __CCCCCC__ ',
      ' __________ ',
      ' k________k ',
      ' __________ ',
      ' __________ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'chibiki', tx: 6, ty: 10, dir: 'down' },
      { x: 6, y: 8, to: 'chibiki', tx: 6, ty: 10, dir: 'down' },
    ],
    npcs: [
      { id: 'chibiki_dougu_keeper', look: 'wolfkid', x: 5, y: 2, dir: 'down', move: 'still', shop: 'chibiki_dougu', talk: ['「見張りの交代のときに、薬を買いに来る者が多い」'] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.chibiki_bugu = {
    name: 'チビキ岩の武具屋',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' __________ ',
      ' __CCCCCC__ ',
      ' __________ ',
      ' k________k ',
      ' __________ ',
      ' __________ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'chibiki', tx: 14, ty: 10, dir: 'down' },
      { x: 6, y: 8, to: 'chibiki', tx: 14, ty: 10, dir: 'down' },
    ],
    npcs: [
      { id: 'chibiki_bugu_keeper', look: 'oni', x: 5, y: 2, dir: 'down', move: 'still', shop: 'chibiki_bugu', talk: ['「岩を削った鎧だ。王様の役に立つなら、うれしい」'] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.hirasaka_dougu = {
    name: 'ヒラサカの道具屋',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' __________ ',
      ' __CCCCCC__ ',
      ' __________ ',
      ' k________k ',
      ' __________ ',
      ' __________ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'hirasaka', tx: 7, ty: 12, dir: 'down' },
      { x: 6, y: 8, to: 'hirasaka', tx: 7, ty: 12, dir: 'down' },
    ],
    npcs: [
      { id: 'hirasaka_dougu_keeper', look: 'beastwoman', x: 5, y: 2, dir: 'down', move: 'still', shop: 'hirasaka_dougu', talk: ['「坂を上る人も下る人も、ここで一息つくのよ」'] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.hirasaka_bugu = {
    name: 'ヒラサカの武具屋',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' __________ ',
      ' __CCCCCC__ ',
      ' __________ ',
      ' k________k ',
      ' __________ ',
      ' __________ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'hirasaka', tx: 18, ty: 12, dir: 'down' },
      { x: 6, y: 8, to: 'hirasaka', tx: 18, ty: 12, dir: 'down' },
    ],
    npcs: [
      { id: 'hirasaka_bugu_keeper', look: 'oni', x: 5, y: 2, dir: 'down', move: 'still', shop: 'hirasaka_bugu', talk: ['「坂の桃の木は、悪いものを寄せつけないという」'] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.inasa_dougu = {
    name: 'イナサの道具屋',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' __________ ',
      ' __CCCCCC__ ',
      ' __________ ',
      ' k________k ',
      ' __________ ',
      ' __________ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'inasa', tx: 16, ty: 9, dir: 'down' },
      { x: 6, y: 8, to: 'inasa', tx: 16, ty: 9, dir: 'down' },
    ],
    npcs: [
      { id: 'inasa_dougu_keeper', look: 'sailor', x: 5, y: 2, dir: 'down', move: 'still', shop: 'inasa_dougu', talk: ['「海松の汁は、船乗りの朝の一杯さ」'] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.iwakura_dougu = {
    name: '城下の道具屋',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' __________ ',
      ' __CCCCCC__ ',
      ' __________ ',
      ' k________k ',
      ' __________ ',
      ' __________ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'iwakura', tx: 10, ty: 13, dir: 'down' },
      { x: 6, y: 8, to: 'iwakura', tx: 10, ty: 13, dir: 'down' },
    ],
    npcs: [
      { id: 'iwakura_dougu_keeper', look: 'merchant', x: 5, y: 2, dir: 'down', move: 'still', shop: 'iwakura_dougu', talk: ['「兵糧丸は、城の兵に納める残りだよ」'] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.iwayato_dougu = {
    name: 'イワヤトの道具屋',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' __________ ',
      ' __CCCCCC__ ',
      ' __________ ',
      ' k________k ',
      ' __________ ',
      ' __________ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'iwayato', tx: 10, ty: 4, dir: 'down' },
      { x: 6, y: 8, to: 'iwayato', tx: 10, ty: 4, dir: 'down' },
    ],
    npcs: [
      { id: 'iwayato_dougu_keeper', look: 'crow', x: 5, y: 2, dir: 'down', move: 'still', shop: 'iwayato_dougu', talk: ['「岩屋の奥でともす灯は、暗い道の助けになる」'] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.iwayato_bugu = {
    name: 'イワヤトの武具屋',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' __________ ',
      ' __CCCCCC__ ',
      ' __________ ',
      ' k________k ',
      ' __________ ',
      ' __________ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'iwayato', tx: 13, ty: 4, dir: 'down' },
      { x: 6, y: 8, to: 'iwayato', tx: 13, ty: 4, dir: 'down' },
    ],
    npcs: [
      { id: 'iwayato_bugu_keeper', look: 'elder', x: 5, y: 2, dir: 'down', move: 'still', shop: 'iwayato_bugu', talk: ['「鏡は、岩屋の者が代々磨いてきたものだ」'] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.kukunochi_bugu = {
    name: 'ククノチの武具屋',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' __________ ',
      ' __CCCCCC__ ',
      ' __________ ',
      ' k________k ',
      ' __________ ',
      ' __________ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'kukunochi', tx: 2, ty: 8, dir: 'down' },
      { x: 6, y: 8, to: 'kukunochi', tx: 2, ty: 8, dir: 'down' },
    ],
    npcs: [
      { id: 'kukunochi_bugu_keeper', look: 'elf', x: 5, y: 2, dir: 'down', move: 'still', shop: 'kukunochi_bugu', talk: ['「楠の杖は、森の古い木が倒れたときにだけ削るのです」'] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.magane_bugu = {
    name: 'マガネの武具屋',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' __________ ',
      ' __CCCCCC__ ',
      ' __________ ',
      ' k________k ',
      ' __________ ',
      ' __________ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'magane', tx: 16, ty: 8, dir: 'down' },
      { x: 6, y: 8, to: 'magane', tx: 16, ty: 8, dir: 'down' },
    ],
    npcs: [
      { id: 'magane_bugu_keeper', look: 'dwarf', x: 5, y: 2, dir: 'down', move: 'still', shop: 'magane_bugu', talk: ['「鶴嘴も、鍛え直せば立派な打ち物になる」'] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.mizuho_dougu = {
    name: '離宮の道具商人',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' __________ ',
      ' __CCCCCC__ ',
      ' __________ ',
      ' k________k ',
      ' __________ ',
      ' __________ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'mizuho', tx: 16, ty: 11, dir: 'down' },
      { x: 6, y: 8, to: 'mizuho', tx: 16, ty: 11, dir: 'down' },
    ],
    npcs: [
      { id: 'mizuho_dougu_keeper', look: 'merchant', x: 5, y: 2, dir: 'down', move: 'still', shop: 'mizuho_dougu', talk: ['「甘露は、離宮の奥でしか作れないのですよ」'] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.nezumi_dougu = {
    name: '抜け穴の道具屋',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' __________ ',
      ' __CCCCCC__ ',
      ' __________ ',
      ' k________k ',
      ' __________ ',
      ' __________ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'nezumi', tx: 8, ty: 4, dir: 'down' },
      { x: 6, y: 8, to: 'nezumi', tx: 8, ty: 4, dir: 'down' },
    ],
    npcs: [
      { id: 'nezumi_dougu_keeper', look: 'tsuchi', x: 5, y: 2, dir: 'down', move: 'still', shop: 'nezumi_dougu', talk: ['「この穴の土は、火から身を守ってくれる」'] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.nezumi_bugu = {
    name: '抜け穴の武具屋',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' __________ ',
      ' __CCCCCC__ ',
      ' __________ ',
      ' k________k ',
      ' __________ ',
      ' __________ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'nezumi', tx: 11, ty: 4, dir: 'down' },
      { x: 6, y: 8, to: 'nezumi', tx: 11, ty: 4, dir: 'down' },
    ],
    npcs: [
      { id: 'nezumi_bugu_keeper', look: 'beastwoman', x: 5, y: 2, dir: 'down', move: 'still', shop: 'nezumi_bugu', talk: ['「鳴鏑の羽は、鼠の子らが拾ってくるの」'] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.ohabari_dougu = {
    name: 'オハバリの道具屋',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' __________ ',
      ' __CCCCCC__ ',
      ' __________ ',
      ' k________k ',
      ' __________ ',
      ' __________ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'ohabari', tx: 20, ty: 11, dir: 'down' },
      { x: 6, y: 8, to: 'ohabari', tx: 20, ty: 11, dir: 'down' },
    ],
    npcs: [
      { id: 'ohabari_dougu_keeper', look: 'oni', x: 5, y: 2, dir: 'down', move: 'still', shop: 'ohabari_dougu', talk: ['「戦の前の神酒は、鬼の決まりだ」'] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.takama_dougu = {
    name: 'タカマの道具屋',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' __________ ',
      ' __CCCCCC__ ',
      ' __________ ',
      ' k________k ',
      ' __________ ',
      ' __________ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'takama', tx: 2, ty: 8, dir: 'down' },
      { x: 6, y: 8, to: 'takama', tx: 2, ty: 8, dir: 'down' },
    ],
    npcs: [
      { id: 'takama_dougu_keeper', look: 'villager', x: 5, y: 2, dir: 'down', move: 'still', shop: 'takama_dougu', talk: ['「清めの塩は、社守さまが清めてくださったものです」'] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.takama_bugu = {
    name: 'タカマの武具屋',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' __________ ',
      ' __CCCCCC__ ',
      ' __________ ',
      ' k________k ',
      ' __________ ',
      ' __________ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'takama', tx: 19, ty: 8, dir: 'down' },
      { x: 6, y: 8, to: 'takama', tx: 19, ty: 8, dir: 'down' },
    ],
    npcs: [
      { id: 'takama_bugu_keeper', look: 'elder', x: 5, y: 2, dir: 'down', move: 'still', shop: 'takama_bugu', talk: ['「丘の上でも、身を守る物は要るからのう」'] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.ukihashi_dougu = {
    name: 'ウキハシの道具屋',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' __________ ',
      ' __CCCCCC__ ',
      ' __________ ',
      ' k________k ',
      ' __________ ',
      ' __________ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'ukihashi', tx: 23, ty: 3, dir: 'down' },
      { x: 6, y: 8, to: 'ukihashi', tx: 23, ty: 3, dir: 'down' },
    ],
    npcs: [
      { id: 'ukihashi_dougu_keeper', look: 'oldwoman', x: 5, y: 2, dir: 'down', move: 'still', shop: 'ukihashi_dougu', talk: ['「関所の前で倒れる旅人に、気付け薬を飲ませてきたのさ」'] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.yachimata_bugu = {
    name: 'ヤチマタの武具屋',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' __________ ',
      ' __CCCCCC__ ',
      ' __________ ',
      ' k________k ',
      ' __________ ',
      ' __________ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'yachimata', tx: 15, ty: 13, dir: 'down' },
      { x: 6, y: 8, to: 'yachimata', tx: 15, ty: 13, dir: 'down' },
    ],
    npcs: [
      { id: 'yachimata_bugu_keeper', look: 'villager', x: 5, y: 2, dir: 'down', move: 'still', shop: 'yachimata_bugu', talk: ['「旅の人には、脚絆がいちばん売れるよ」'] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.yata_dougu = {
    name: '鴉族の道具市',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' __________ ',
      ' __CCCCCC__ ',
      ' __________ ',
      ' k________k ',
      ' __________ ',
      ' __________ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'yata', tx: 6, ty: 8, dir: 'down' },
      { x: 6, y: 8, to: 'yata', tx: 6, ty: 8, dir: 'down' },
    ],
    npcs: [
      { id: 'yata_dougu_keeper', look: 'crow', x: 5, y: 2, dir: 'down', move: 'still', shop: 'yata_dougu', talk: ['「眠り羽の香は、崖の巣を守るためのものだ」'] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.yominohara_dougu = {
    name: 'ヨミノハラの道具屋',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' __________ ',
      ' __CCCCCC__ ',
      ' __________ ',
      ' k________k ',
      ' __________ ',
      ' __________ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'yominohara', tx: 4, ty: 7, dir: 'down' },
      { x: 6, y: 8, to: 'yominohara', tx: 4, ty: 7, dir: 'down' },
    ],
    npcs: [
      { id: 'yominohara_dougu_keeper', look: 'oldwoman', x: 5, y: 2, dir: 'down', move: 'still', shop: 'yominohara_dougu', talk: ['「泉の水は、汲んだその日がいちばん効くよ」'] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.yominohara_bugu = {
    name: 'ヨミノハラの武具屋',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' __________ ',
      ' __CCCCCC__ ',
      ' __________ ',
      ' k________k ',
      ' __________ ',
      ' __________ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'yominohara', tx: 19, ty: 7, dir: 'down' },
      { x: 6, y: 8, to: 'yominohara', tx: 19, ty: 7, dir: 'down' },
    ],
    npcs: [
      { id: 'yominohara_bugu_keeper', look: 'wolfkid', x: 5, y: 2, dir: 'down', move: 'still', shop: 'yominohara_bugu', talk: ['「黒い石の釧は、毒を寄せつけないんだ」'] },
    ],
    chests: [],
    signs: [],
  };

})();

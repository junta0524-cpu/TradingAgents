// キャラクターデータ ― 群像譜(キャラ設定資料)の数値をゲーム用に落とし込んだもの
var Game = window.Game || {};
Game.Data = Game.Data || {};

Game.Data.Skills = {
  nagiharai: { id: 'nagiharai', name: 'なぎ払い', mp: 3, kind: 'attack', power: 1.3, target: 'all_enemies', desc: '敵全体に攻撃力1.3倍のダメージ' },
  ukenagashi: { id: 'ukenagashi', name: '受け流し', mp: 0, kind: 'guard', desc: '被ダメージを大きく軽減する' },
  kanni_kaifuku: { id: 'kanni_kaifuku', name: 'ホイミ(簡易)', mp: 4, kind: 'heal', power: 18, target: 'one_ally', desc: 'HPを回復する(ロトの剣の力)' },
};

// 初期パーティ。ステータスは宝物庫(装備)・魔物図鑑(敵とのバランス)を参照した序盤想定値
Game.Data.Characters = {
  rota: {
    id: 'rota',
    name: 'ロト',
    title: '流浪の王',
    level: 1,
    exp: 0,
    expToNext: 12,
    hp: 28, maxHp: 28,
    mp: 4, maxMp: 4,
    atk: 12, def: 8, spd: 9,
    weapon: '銅の剣',
    skills: ['nagiharai', 'ukenagashi', 'kanni_kaifuku'],
  },
};

Game.Data.PARTY_ORDER = ['rota'];

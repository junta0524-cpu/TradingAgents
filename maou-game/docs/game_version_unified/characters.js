// =============================================================
// キャラクターの能力値と、章ごとのパーティ編成（統一版）
// 魔王が仲間になりたそうな顔でこちらを見ている
//
// ・今のゲーム（小説 第一章〜第十二章・エピローグ・クリア後）の実際の数字から作った資料
//   （ゲーム本体の数字は js/data/balance.js・js/data/enemies*.js にある。こちらは一覧用）
// ・ステータス：hp / mp / atk(ちから) / def(まもり) / agi(すばやさ)
// ・レベル上限99。HPとMPの上限999、ほかの上限255（カンスト）
// ・ベル以外が倒れたらゲームオーバー（臨時の仲間も含む）。ベルは倒れない
// =============================================================

const CHARACTERS = {
  // 魔王ベルイザナ（1〜3章・10章から先・クリア後）：カンスト。2章だけ、こうげきが敵全体へ2回（ほかはふつうの1回攻撃）
  belizana: { name: 'ベルイザナ', hp: 999, mp: 999, atk: 255, def: 255, agi: 255 },

  // 冒険者ベル（4〜9章、偽名で力を抑えている間）：その章の推奨レベル＋10のオオナムチと同じ強さ（MPは99）
  bell: {
    name: 'ベル（冒険者）',
    byChapter: [
      { chapter: 4, recLv: 4, asLv: 14, hp: 75, mp: 99, atk: 21, def: 18, agi: 19 },
      { chapter: 5, recLv: 7, asLv: 17, hp: 92, mp: 99, atk: 25, def: 22, agi: 22 },
      { chapter: 6, recLv: 10, asLv: 20, hp: 110, mp: 99, atk: 29, def: 26, agi: 25 },
      { chapter: 7, recLv: 12, asLv: 22, hp: 124, mp: 99, atk: 32, def: 29, agi: 27 },
      { chapter: 8, recLv: 13, asLv: 23, hp: 131, mp: 99, atk: 34, def: 30, agi: 28 },
      { chapter: 9, recLv: 14, asLv: 24, hp: 138, mp: 99, atk: 35, def: 32, agi: 29 }
    ]
  },

  // オオナムチ：レベル1から99まで（Lv99でカンスト）。代表のレベルだけ抜き出し
  oonamuchi: {
    name: 'オオナムチ',
    growth: [
      { lv: 1, hp: 18, mp: 6, atk: 6, def: 4, agi: 6 },
      { lv: 4, hp: 30, mp: 12, atk: 9, def: 7, agi: 9 },
      { lv: 7, hp: 42, mp: 18, atk: 12, def: 10, agi: 12 },
      { lv: 10, hp: 55, mp: 25, atk: 16, def: 13, agi: 15 },
      { lv: 12, hp: 65, mp: 31, atk: 18, def: 16, agi: 17 },
      { lv: 13, hp: 70, mp: 34, atk: 19, def: 17, agi: 18 },
      { lv: 14, hp: 75, mp: 37, atk: 21, def: 18, agi: 19 },
      { lv: 16, hp: 86, mp: 43, atk: 23, def: 21, agi: 21 },
      { lv: 20, hp: 110, mp: 55, atk: 29, def: 26, agi: 25 },
      { lv: 30, hp: 180, mp: 85, atk: 44, def: 41, agi: 35 },
      { lv: 40, hp: 299, mp: 217, atk: 75, def: 72, agi: 67 },
      { lv: 60, hp: 536, mp: 482, atk: 136, def: 134, agi: 131 },
      { lv: 80, hp: 773, mp: 747, atk: 197, def: 196, agi: 194 },
      { lv: 99, hp: 999, mp: 999, atk: 255, def: 255, agi: 255 }
    ]
  }
};

// 臨時の仲間（その土地の間だけ同行。レベルは上がらない）
const TEMP_PARTY = {
  sukuna: { name: 'スクナ', chapter: 5, hp: 40, mp: 40, atk: 8, def: 8, agi: 7 },
  konoha: { name: 'コノハ', chapter: 5, hp: 45, mp: 12, atk: 16, def: 9, agi: 14 },
  kaname: { name: 'カナメ', chapter: 6, hp: 60, mp: 15, atk: 18, def: 14, agi: 6 },
  kotoshiro: { name: 'コトシロ', chapter: 6, hp: 38, mp: 10, atk: 9, def: 9, agi: 8 },
  uzume: { name: 'ウズメ', chapter: 7, hp: 42, mp: 8, atk: 13, def: 8, agi: 18 },
  hieda: { name: 'ヒエダ', chapter: 7, hp: 32, mp: 45, atk: 7, def: 7, agi: 6 }
};

// 物語の大事な相手（敵としての数字）
const BOSSES = {
  takeru_ch2: { name: 'タケル', hp: 600, atk: 230, def: 200, agi: 240, hits: 2 },
  takeru_b: { name: 'タケル', hp: 160, atk: 34, def: 22, agi: 16 },
  mikazuchi_t: { name: 'ミカヅチ', hp: 999, atk: 26, def: 40, agi: 8, tribe: 'oni' },
  susano_t: { name: 'スサノ', hp: 120, atk: 24, def: 18, agi: 22, tribe: 'arashi' },
  nakime_t: { name: 'ナキメ', hp: 999, atk: 26, def: 40, agi: 18, tribe: 'karasu' },
  haniyasu_t: { name: 'ハニヤス', hp: 999, atk: 30, def: 50, agi: 6, tribe: 'tsuchigumo' },
  amatsu_king: { name: 'アマツ王', hp: 200, atk: 6, def: 99, agi: 4 },
  bell_final: { name: 'ベルイザナ', hp: 999, atk: 52, def: 80, agi: 30 }
};

// 章ごとのパーティ編成
const PARTY_BY_CHAPTER = [
  { chapter: 1, members: ['belizana'], note: 'ベルイザナ単独（魔界）' },
  { chapter: 2, members: ['belizana'], note: '兵との戦い2回（倒れた兵は消える）と勇者タケルとの戦い。ベルイザナを操作' },
  { chapter: 3, members: ['belizana'], note: '魔界の宮。捕らえたタケルとの問答' },
  { chapter: 4, members: ['bell', 'oonamuchi'], note: 'ミナモ・ひなた野。オオナムチは野犬戦で堅め・癒やしを覚える' },
  { chapter: 5, members: ['bell', 'oonamuchi', 'sukuna', 'konoha'], note: '聖の森。心鎮めを覚える' },
  { chapter: 6, members: ['bell', 'oonamuchi', 'kotoshiro', 'kaname'], note: '炉ヶ岳。火種を覚える' },
  { chapter: 7, members: ['bell', 'oonamuchi', 'uzume', 'hieda'], note: '獣ノ原・葛の里' },
  { chapter: 8, members: ['bell', 'oonamuchi'], note: '王都 天津京' },
  { chapter: 9, members: ['bell', 'oonamuchi'], note: 'やすらぎの院。四柱の祈り' },
  { chapter: 10, members: ['belizana', 'oonamuchi'], note: '正体が露見。魔王の姿に戻る' },
  { chapter: 11, members: ['belizana', 'oonamuchi'], note: '魔界で修行（手合わせはオオナムチだけ、ベルは見守る）。タケル戦もオオナムチ単独' },
  { chapter: 12, members: ['belizana', 'oonamuchi'], note: 'アマツ王戦はオオナムチ単独（ベルは見守る）。名呼び' },
  { chapter: 13, members: ['belizana', 'oonamuchi'], note: 'クリア後。両方の世界を自由に回れる（大穴で行き来）' }
];

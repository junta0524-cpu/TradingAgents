// このファイルの役目：仲間になる人物の一覧（名前・見た目・最初の装備と言霊）。
// 強さの数字（成長表）は js/data/balance.js にある。
// isBell：ベルは倒れない（HPは1で止まる）。ベル以外が倒れるとゲームオーバー。
// fixed：レベルが上がらない（ベルは力を抑えた強さのまま。臨時の仲間も同じ）。
// temp：臨時の仲間（その土地の間だけ一緒に戦う）。強さは balance.js の TEMP_PARTY。
// tactic：最初の作戦（auto＝うまくやって／manual＝ぜんぶ指示する）。
// perk：特技（dropBoost＝落とし物が増える／firstStrike＝先手を取りやすい）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};

  G.DATA.characters = {
    bell: {
      name: 'ベル', look: 'bell', isBell: true, fixed: true, tactic: 'auto',
      // ベルは全部の言霊を覚えている（仕様書 第4章）。ただし唱えると阻害ゲージが大きく減る
      equip: {}, kotodama: 'all',
    },
    oonamuchi: {
      name: 'オオナムチ', look: 'oonamuchi', tactic: 'manual',
      equip: { weapon: 'old_dagger', armor: 'patched_cloak' },
      // 小説どおり、4章の野犬戦で堅め・癒やしを覚える（js/data/story/ch04.js）
      kotodama: [],
    },

    // ---- 臨時の仲間（仕様書 第4章）----
    sukuna:    { name: 'スクナ',     look: 'sukuna',    temp: true, fixed: true, tactic: 'auto', chapter: 5,
                 kotodama: ['iyashi', 'iyashi_ren', 'michi_iyashi', 'dokubarai', 'mezame'] },
    konoha:    { name: 'コノハ',     look: 'konoha',    temp: true, fixed: true, tactic: 'auto', chapter: 5,
                 kotodama: ['oboro', 'nemurigasumi'] },
    kaname:    { name: 'カナメ',     look: 'kaname',    temp: true, fixed: true, tactic: 'auto', chapter: 6,
                 kotodama: ['hidane', 'takeri', 'kaen'] },
    kotoshiro: { name: 'コトシロ',   look: 'kotoshiro', temp: true, fixed: true, tactic: 'auto', chapter: 6,
                 kotodama: ['miyaburi'], perk: 'dropBoost' },
    uzume:     { name: 'ウズメ',     look: 'uzume',     temp: true, fixed: true, tactic: 'auto', chapter: 7,
                 kotodama: [], perk: 'firstStrike' },
    hieda:     { name: 'ヒエダ',     look: 'hieda',     temp: true, fixed: true, tactic: 'auto', chapter: 7,
                 kotodama: ['miyaburi', 'kokoroshizume', 'katame_ren', 'kuchifuuji', 'kaen'] },
  };
})();

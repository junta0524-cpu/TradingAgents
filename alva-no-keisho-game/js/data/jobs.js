// 職業と習熟★ ― 学院都市の「さだめの祠」で就く。
//
// ・転職しても レベルは そのまま。素の値に 職の倍率を掛けたものが 実際の値になる(切り捨て)
//   うんのよさ には 掛けない。装備のぶんは 倍率を掛けたあとに 足す
// ・勝った戦い1回ごとに、いまの職の戦闘回数が1ふえ、累計で★が上がる
//   ただし この辺りの魔物が弱すぎると 数えない(下の jobCap)
// ・★で覚えた技は 職を変えても使える(keepSkills: false の職だけは、その職のあいだだけ)
// ・職ごとの★と戦闘回数は、ひとりずつ 全部の職ぶん 覚えておく
// ・trait は その職に就いているときだけ 働く
var Game = window.Game || {};
Game.Data = Game.Data || {};

// ★n に上がるのに要る 累計の戦闘回数(★1 は 0回)
Game.Data.JOB_STARS = [0, 0, 4, 9, 16, 25, 36, 50, 65];
Game.Data.JOB_MAX_STAR = 8;

Game.Data.Jobs = {
  arinomama: {
    id: 'arinomama', name: 'ありのまま', role: '職に就かない。倍率も 技も ない',
    mul: {}, skills: [],
  },
  tsurugi: {
    id: 'tsurugi', name: 'つるぎ士', role: '力の攻撃役',
    mul: { atk: 1.1, spd: 0.7, def: 1.0, mag: 0.7, hp: 1.1, mp: 0.4 },
    skills: [
      { id: 'makko_giri', star: 2 },
      { id: 'susobarai', star: 4 },
      { id: 'tatakkiri', star: 6 },
      { id: 'tsurugi_no_mai', star: 8 },
    ],
  },
  kobushi: {
    id: 'kobushi', name: 'こぶし士', role: '速さと 会心',
    mul: { atk: 1.0, spd: 1.15, def: 0.9, mag: 0.8, hp: 1.0, mp: 0.5 },
    // ★3から、渾身の一撃が 1/16 で出る(うんのよさ で それより高ければ そちら)
    trait: { crit: 1 / 16, fromStar: 3, note: '★3から 会心が 出やすい' },
    skills: [
      { id: 'mawashigeri', star: 2 },
      { id: 'seiken_zuki', star: 5 },
      { id: 'bakuretsu_ken', star: 8 },
    ],
  },
  majinai: {
    id: 'majinai', name: 'まじない師', role: '攻めの 術',
    mul: { atk: 0.6, spd: 0.95, def: 0.6, mag: 1.2, hp: 0.6, mp: 1.1 },
    skills: [
      { id: 'fol', star: 2 },
      { id: 'nox', star: 3 },
      { id: 'seed', star: 4 },
      { id: 'igna', star: 5 },
      { id: 'rau', star: 7 },
    ],
  },
  iyashi: {
    id: 'iyashi', name: 'いやし手', role: '癒やしの 術',
    mul: { atk: 0.8, spd: 0.9, def: 0.7, mag: 1.1, hp: 0.8, mp: 1.0 },
    skills: [
      { id: 'mina', star: 2 },
      { id: 'seina', star: 3 },
      { id: 'minara', star: 5 },
      { id: 'seinaru', star: 6 },
      { id: 'rival', star: 8 },
    ],
  },
  mahoroba: {
    id: 'mahoroba', name: 'まほろば剣士', role: '剣と 術の 両方(上級)',
    mul: { atk: 1.05, spd: 0.9, def: 0.85, mag: 1.0, hp: 1.1, mp: 0.9 },
    // つるぎ士と まじない師を ★5 にすると 就ける。数はここで変えられる
    requires: { tsurugi: 5, majinai: 5 },
    skills: [
      { id: 'homura_giri', star: 2 },
      { id: 'kori_giri', star: 4 },
      { id: 'kamaitachi_giri', star: 6 },
      { id: 'mahoroba_issen', star: 8 },
    ],
  },
};
Game.Data.JOB_ORDER = ['arinomama', 'tsurugi', 'kobushi', 'majinai', 'iyashi', 'mahoroba'];

// 修行になる上限。その戦いで いちばん格の高い魔物の格ごとに、
// 仲間の平均レベルが これを超えていると ★の回数に数えない
Game.Data.jobCap = function (rank) { return 6 + 2 * (rank || 1); };

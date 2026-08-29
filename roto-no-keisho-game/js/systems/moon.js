// 月齢 ― 歩くほどに月が満ち欠けする。
//
// 第三章「月下の誓い」は月衆の物語で、シナリオ資料は
// 「月齢システムの導入。満月の夜だけ通れる道」と指定している。
// 月は世界そのものの時計なので、章をまたいで進み続け、セーブにも残る。
//
// 満ちるほど魔物はおとなしく、闇が濃いほど数が増える。
// 月光の門(タイル 'O')は、満月のあいだだけ開く。
var Game = window.Game || {};
Game.Moon = (function () {
  var PHASES = [
    { name: '新月',   mark: '●', encounter: 1.40 },
    { name: '三日月', mark: '☾', encounter: 1.25 },
    { name: '上弦',   mark: '◐', encounter: 1.10 },
    { name: '十三夜', mark: '◑', encounter: 1.00 },
    { name: '満月',   mark: '○', encounter: 0.80, full: true },
    { name: '十八夜', mark: '◑', encounter: 1.00 },
    { name: '下弦',   mark: '◐', encounter: 1.10 },
    { name: '有明',   mark: '☽', encounter: 1.25 },
  ];
  // 一相ぶんの歩数。短すぎると落ち着かず、長すぎると満月を待てない。
  // ひと巡り 8 相で 320 歩 ―― ダンジョン一つを歩くくらいの長さ。
  var STEPS_PER_PHASE = 40;
  var walked = 0;

  function index() { return Math.floor(walked / STEPS_PER_PHASE) % PHASES.length; }
  function phase() { return PHASES[index()]; }
  function isFull() { return !!phase().full; }
  function label() { return phase().mark + ' ' + phase().name; }
  function encounterScale() { return phase().encounter; }

  // 満月まであと何歩か。待つ気になれるよう、数で見せる
  function stepsToFull() {
    var i = index();
    var target = 4;
    var laps = (target - i + PHASES.length) % PHASES.length;
    if (laps === 0) return 0;
    return laps * STEPS_PER_PHASE - (walked % STEPS_PER_PHASE);
  }

  function step() { walked += 1; }
  function serialize() { return walked; }
  function restore(v) { walked = (typeof v === 'number' && v >= 0) ? v : 0; }
  function reset() { walked = 0; }

  return {
    phase: phase, isFull: isFull, label: label, encounterScale: encounterScale,
    stepsToFull: stepsToFull, step: step,
    serialize: serialize, restore: restore, reset: reset,
  };
})();

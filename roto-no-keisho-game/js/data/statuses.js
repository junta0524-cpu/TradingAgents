// 状態異常 ― 毒・眠り・混乱の3種。
// afterBattle: 戦闘が終わったら自然に解けるか(毒だけは戦闘後も残り、歩くたびに削られる)
var Game = window.Game || {};
Game.Data = Game.Data || {};

Game.Data.Statuses = {
  poison: {
    id: 'poison', name: 'どく', short: '毒', color: '#7ea34a',
    persists: true,           // 戦闘が終わっても残る
    poisonDamage: 3,          // ラウンド終了時に受けるダメージ
    fieldStepDamage: 1,       // フィールドを歩くたびに受けるダメージ
    fieldStepInterval: 8,     // 何歩ごとに削られるか
    onInflict: 'は どくに おかされた!',
    onTick: 'は どくで くるしんでいる!',
    onCure: 'の どくが 消えた',
  },
  sleep: {
    id: 'sleep', name: 'ねむり', short: '眠', color: '#5c8ecf',
    persists: false,
    skipsTurn: true,
    wakeChance: 0.4,          // 毎ターン、この確率で目を覚ます
    onInflict: 'は ねむってしまった!',
    onTick: 'は ぐうぐう ねむっている',
    onCure: 'は 目を覚ました',
  },
  confuse: {
    id: 'confuse', name: 'こんらん', short: '混', color: '#a67ac0',
    persists: false,
    randomTarget: true,       // 対象を選べず、誰かをでたらめに殴る
    recoverChance: 0.35,
    onInflict: 'は こんらんした!',
    onTick: 'は わけが わからなくなっている!',
    onCure: 'の こんらんが とけた',
  },
};

// どの道具がどの状態異常を治すか(items.js の cures と対応)
Game.Data.CURE_ALL = ['poison', 'sleep', 'confuse'];

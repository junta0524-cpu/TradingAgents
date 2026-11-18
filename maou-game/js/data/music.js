// このファイルの役目：どの場所・どの場面で、どの曲を鳴らすか（曲そのものは js/core/sound.js の SONGS）。
// 場所：maps（マップの名前そのまま）→ prefixes（名前の頭が合う最初のもの）の順に探す。マップに bgm があればそれが先。
// 場面：events（場面の名前）。場面のあいだは場所の曲に戻らず、場面が終わると場所の曲に戻る。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};

  G.DATA.music = {
    maps: {
      field_minamo: 'field', world_ningen: 'world', world_makai: 'yomi_world',
      hijiri_cave: 'cave', hijiri_deep: 'cave', ro_mine: 'cave',
      amatsu_slum: 'slum', yasuragi_temple: 'shrine', saru_hall: 'village',
      yomi_hani: 'yomi', yomi_market: 'market', yomi_palace: 'palace', yomi_prison: 'prison', yomi_balcony: 'night', yomi_sanctum: 'shrine',
      tsunogahara: 'arena', arashigamine: 'arena', tsukuyomi_yashiro: 'shrine',
    },
    prefixes: [
      ['minamo', 'town'], ['hinatano', 'village'], ['kuzu', 'village'],
      ['hijiri', 'forest'], ['ro_', 'mountain'], ['kemono', 'wild'],
      ['slum_', 'slum'], ['amatsu', 'city'], ['yasuragi', 'eerie'], ['oana', 'abyss'], ['yomi', 'yomi'],
    ],
    events: {
      ch1_child: 'warm', ch1_hani: 'warm', ch1_road: 'yomi_world', ch1_market: 'market', ch1_hall: 'palace', ch1_palace: 'palace',
      ch1_betrayal: 'tension', ch1_evening: 'festival',
      ch3_start: 'prison', ch3_visit: 'prison', ch3_balcony: 'night',
      ch4_start: 'town', ch4_guild: 'town', ch4_dogs: 'field', ch4_hinata: 'warm',
      ch5_start: 'town', ch5_sukuna: 'forest', ch5_village: 'forest', ch5_konoha: 'memory', ch5_hall: 'tension', ch5_cave: 'sad',
      ch5_choice: 'tension', ch5_minato: 'tension', ch5_night: 'night',
      ch6_start: 'town', ch6_arrive: 'mountain', ch6_order: 'tension', ch6_blade: 'tension', ch6_report: 'tension',
      ch6_fire: 'warm', ch6_gate: 'farewell', ch6_end: 'farewell',
      ch7_start: 'town', ch7_arrive: 'wild', ch7_ruins: 'sad', ch7_kuzu: 'memory', ch7_saru: 'warm', ch7_well: 'tension', ch7_farewell: 'farewell', ch7_night_call: 'night',
      ch8_start: 'town', ch8_arrive: 'city', ch8_choice: 'tension', ch8_debate: 'city', ch8_meet: 'tension', ch8_slum: 'slum', ch8_attic: 'night',
      ch9_start: 'town', ch9_festival: 'festival', ch9_in: 'eerie', ch9_ward: 'eerie', ch9_pray: 'shrine', ch9_temple: 'shrine',
      ch10_start: 'tension', ch10_escape: 'tension',
      ch11_start: 'yomi', ch11_naki: 'shrine', ch11_fest: 'festival', ch11_takeru: 'tension',
      ch12_start: 'tension', ch12_battle: 'tension',
      post_door: 'shrine',
      // 第二弾（本編の穴・クリア後）
      ch1_start: 'burn', ch2_start: 'ambush', ch3_balcony_hint: 'whisper', ch7_secret: 'whisper',
      ch8_wait: 'city', ch9_caught: 'chase', ch11_mika: 'oni', ch11_susa: 'storm', ch12_battle: 'throne',
      post_start: 'warm', post_intro: 'warm', post_hani: 'master', post_mika: 'oni', post_naki: 'master', post_omoika: 'memory',
      post_kunado: 'shrine', post_altar1: 'shrine', post_altar2: 'shrine', post_altar3: 'shrine', post_shrine_open: 'shrine',
    },
    // 寄り道クエストのあいだの曲（クエストの id → 場所の曲の代わり。マップに bgm があればそちらが先）
    sq: {
      ch01_5: 'burn', ch02_5: 'burn', ch03_5: 'whisper', ch04_5: 'town', ch05_5: 'forest', ch06_5: 'mountain', ch07_5: 'wild', ch08_5: 'city',
      ch11_5: 'master', ch12_5: 'warm', bangai1: 'memory', bangai2: 'chase', bangai3: 'abyss', bangai4: 'wild', bangai5: 'sad', bangai6: 'festival',
    },
    // 戦いの曲（場所の名前の頭 → 曲。ボス・手合わせ・王戦が先）
    battle: {
      prefixes: [['hijiri', 'battle_forest'], ['ro_', 'battle_wild'], ['kemono', 'battle_wild'], ['yomi_fuchi', 'battle_abyss'], ['oana', 'battle_abyss'], ['world_makai', 'battle_yomi'], ['yomi', 'battle_yomi'], ['tsunogahara', 'battle_yomi'], ['arashigamine', 'battle_yomi']],
      awaken: 'battle_sorrow', bossPost: 'boss_post',
      enemies: { bell_final: 'duel', bell_t: 'duel', bell_t_power: 'duel', mikazuchi_t: 'oni', susano_t: 'storm', haniyasu_t: 'master', nakime_t: 'master' },
    },
  };

  // そのマップの曲
  G.musicForMap = (mapId, map) => {
    const M = G.DATA.music;
    if (map && map.bgm) return map.bgm;
    const q = G.sq && G.sq.active && G.sq.active();
    if (q && M.sq && M.sq[q]) return M.sq[q];
    if (M.maps[mapId]) return M.maps[mapId];
    const p = M.prefixes.find(([head]) => mapId.startsWith(head));
    return p ? p[1] : (map && map.encounter ? 'field' : 'town');
  };

  // 戦いの曲：敵ごと（手合わせの師・ベル）→ 場所 → ふつう。ボス・王戦は呼ぶ側が先に決める
  G.musicForBattle = (group, opts, base) => {
    const B = G.DATA.music.battle;
    const e = (group || []).map(id => B.enemies[id]).find(Boolean);
    if (e) return e;
    if (opts && opts.training) return base;
    if (base === 'boss') return G.state && G.state.chapter >= 13 ? B.bossPost : base;
    if ((group || []).some(id => (G.DATA.enemies[id] || {}).awaken)) return B.awaken;
    const id = G.state && G.state.mapId, hit = id && B.prefixes.find(([h]) => id.startsWith(h));
    return hit ? hit[1] : base;
  };
})();

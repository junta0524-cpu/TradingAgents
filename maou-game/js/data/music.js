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
      ch5_start: 'forest', ch5_sukuna: 'forest', ch5_village: 'forest', ch5_konoha: 'memory', ch5_hall: 'tension', ch5_cave: 'sad',
      ch5_choice: 'tension', ch5_minato: 'tension', ch5_night: 'night',
      ch6_start: 'mountain', ch6_arrive: 'mountain', ch6_order: 'tension', ch6_blade: 'tension', ch6_report: 'tension',
      ch6_fire: 'warm', ch6_gate: 'farewell', ch6_end: 'farewell',
      ch7_start: 'wild', ch7_ruins: 'sad', ch7_kuzu: 'memory', ch7_saru: 'warm', ch7_well: 'tension', ch7_farewell: 'farewell', ch7_night_call: 'night',
      ch8_start: 'city', ch8_choice: 'tension', ch8_debate: 'city', ch8_meet: 'tension', ch8_slum: 'slum', ch8_attic: 'night',
      ch9_start: 'festival', ch9_in: 'eerie', ch9_ward: 'eerie', ch9_pray: 'shrine', ch9_temple: 'shrine',
      ch10_start: 'tension', ch10_escape: 'tension',
      ch11_start: 'yomi', ch11_naki: 'shrine', ch11_fest: 'festival', ch11_takeru: 'tension',
      ch12_start: 'tension', ch12_battle: 'tension',
      post_door: 'shrine',
    },
  };

  // そのマップの曲
  G.musicForMap = (mapId, map) => {
    const M = G.DATA.music;
    if (map && map.bgm) return map.bgm;
    if (M.maps[mapId]) return M.maps[mapId];
    const p = M.prefixes.find(([head]) => mapId.startsWith(head));
    return p ? p[1] : (map && map.encounter ? 'field' : 'town');
  };
})();

// このファイルの役目：ダンジョンのしかけ（マップの gimmicks）。押せる岩・穴埋め・重しの床・レバーと門・
// 言霊で開く道（火種で蔦を焼く など）・鍵の扉・灯籠を順に灯す謎・暗闇と燭台・滑る床・流れる床・熱い床・落とし穴・
// 番人（奥の宝を守る強い敵。調べると「戦いますか？」。倒すまで道をふさぐ。reward があれば品をくれる）・
// 言の葉の石碑（kotoba。js/data/kotoba.js の石碑を、そのマップのしかけに加える。調べると文字並べの謎＝js/scenes/kotoba.js）。
// 地形の文字は js/data/tiles.js、数字は balance.js の GIMMICK。歩く画面（js/scenes/map.js）から呼ばれる。
(function () {
  const G = window.GAME = window.GAME || {};
  const B = () => G.DATA.balance.GIMMICK;
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

  // しかけの覚え書き（フラグ）の名前。flag を書いていなければ「gm:マップ:id」
  const flagOf = (mapId, g) => g.flag || `gm:${mapId}:${g.id}`;
  const fillKey = (mapId, x, y) => `gm:${mapId}:fill:${x},${y}`;
  // 言の葉の石碑（js/data/kotoba.js）を、そのマップのしかけとして加える（現れる章になってから）
  const stonesCache = new Map();
  function stonesOf(map) {
    if (!G.DATA.kotobaStones) return [];
    if (!stonesCache.has(map)) {
      const id = Object.keys(G.DATA.maps).find(k => G.DATA.maps[k] === map);
      stonesCache.set(map, G.DATA.kotobaStones.filter(s => s.map === id).map(s => ({ type: 'kotoba', id: 'kotoba_' + s.id, x: s.x, y: s.y, stone: s })));
    }
    const ch = (G.state && G.state.chapter) || 1;
    return stonesCache.get(map).filter(g => ch >= g.stone.from);
  }
  const list = map => (map.gimmicks || []).concat(stonesOf(map));

  // マップに入ったときの、しかけの状態（岩の位置は入るたびに元へ戻る＝詰んでも出直せばよい）
  function init(mapId, map) {
    const used = id => G.flags.get(`gm:${mapId}:used:${id}`);
    return {
      mapId, map,
      boulders: list(map).filter(g => g.type === 'boulder' && !used(g.id)).map(g => ({ id: g.id, x: g.x, y: g.y })),
      seq: {},   // 灯籠の謎：何番目まで灯したか
    };
  }

  // 地形に重ねる：まだ開いていない封印・鍵の扉、埋めた穴
  function overlay(mapId, map, rows) {
    const set = (x, y, ch) => { rows[y] = rows[y].slice(0, x) + ch + rows[y].slice(x + 1); };
    list(map).forEach(g => {
      if ((g.type === 'seal' || g.type === 'lock') && !G.flags.get(flagOf(mapId, g))) set(g.x, g.y, g.ch);
    });
    rows.forEach((r, y) => [...r].forEach((c, x) => {
      const t = G.DATA.tiles[c];
      if (t && t.hole && G.flags.get(fillKey(mapId, x, y))) set(x, y, map.fillCh || t.fillCh || '_');
    }));
    return rows;
  }

  // その場所にある、しかけの物（岩・レバー・灯籠・燭台）
  function objectAt(st, x, y) {
    const b = st.boulders.find(o => o.x === x && o.y === y);
    if (b) return { type: 'boulder', ref: b };
    return list(st.map).find(g => g.x === x && g.y === y && (['lever', 'lantern', 'torch', 'kotoba'].includes(g.type)
      || (g.type === 'guardian' && !G.flags.get(flagOf(st.mapId, g))))) || null;
  }
  const blocks = (st, x, y) => !!objectAt(st, x, y);

  // 岩を押す。押せたら true（岩が1マス進む。穴に落ちれば穴が埋まる）
  function push(api, dir, x, y) {
    const st = api.st, o = objectAt(st, x, y);
    if (!o || o.type !== 'boulder') return false;
    const [dx, dy] = DIRS[dir], bx = x + dx, by = y + dy;
    const t = api.tileAt(bx, by);
    if (!t) return false;
    if (t.hole) {
      G.flags.set(fillKey(st.mapId, bx, by));
      G.flags.set(`gm:${st.mapId}:used:${o.ref.id}`);
      st.boulders = st.boulders.filter(b => b !== o.ref);
      api.rebuild();
      if (G.sound) G.sound.se('door');
      G.message.show('岩が穴に落ちて、ぴたりとはまった。');
      return true;
    }
    if (t.solid || api.occupied(bx, by)) return false;
    o.ref.x = bx; o.ref.y = by;
    if (G.sound) G.sound.se('cursor');
    // 重しの床に乗った
    const plate = list(st.map).find(g => g.type === 'plate' && g.x === bx && g.y === by);
    if (plate && !G.flags.get(flagOf(st.mapId, plate))) {
      G.flags.set(flagOf(st.mapId, plate));
      api.rebuild();
      if (G.sound) G.sound.se('chest');
      G.message.show(plate.text || 'ゴトリ……と、どこかで重いものが動く音がした。');
    }
    return true;
  }

  // オオナムチ（言霊を唱える人）
  function caster() {
    return G.party.active().find(m => m.id === 'oonamuchi' && m.hp > 0) || null;
  }

  // 調べる。しかけを扱ったら true
  function interact(api, fx, fy) {
    const st = api.st, mapId = st.mapId;
    const g = list(st.map).find(o => o.x === fx && o.y === fy && o.type !== 'boulder' && o.type !== 'plate');
    if (!g) {
      const o = objectAt(st, fx, fy);
      if (o && o.type === 'boulder') { G.message.show('大きな岩だ。押せば動きそうだ。'); return true; }
      return false;
    }
    const f = flagOf(mapId, g), done = G.flags.get(f);
    switch (g.type) {
      case 'lever':
        if (done && g.once) { G.message.show(g.doneText || 'レバーは、もう動かない。'); return true; }
        G.flags.set(f, !done);
        if (G.sound) G.sound.se('door');
        api.rebuild();
        G.message.show(g.text || (done ? 'レバーを戻した。ガコン、と音がした。' : 'レバーを倒した。ガコン、と音がした。'));
        return true;
      case 'seal': {
        if (done) return false;
        const k = G.DATA.kotodama[g.need], m = caster();
        if (!m || !m.kotodama.includes(g.need)) { G.message.show(g.text); return true; }
        if (m.mp < k.mp) { G.message.show([g.text, `${k.name}を唱えるには、MPが足りない。`]); return true; }
        G.message.show(g.text, () => G.ui.confirm(`${m.name}の${k.name}を唱えますか？（MP${k.mp}）`, () => {
          m.mp -= k.mp;
          G.flags.set(f);
          api.rebuild();
          if (G.sound) G.sound.se('chest');
          G.message.show(`${m.name}は${k.name}を唱えた！\n` + (g.done || '道が開いた。'));
        }));
        return true;
      }
      case 'lock': {
        if (done) return false;
        const item = G.DATA.items[g.key];
        if (!G.party.count(g.key)) { G.message.show(g.text || `鍵がかかっている。${item ? item.name + 'が要りそうだ。' : ''}`); return true; }
        G.flags.set(f);
        if (g.consume !== false) G.party.removeItem(g.key, 1);
        api.rebuild();
        if (G.sound) G.sound.se('door');
        G.message.show(`${item ? item.name : '鍵'}で、扉を開けた。`);
        return true;
      }
      case 'lantern': {
        const seq = list(st.map).find(o => o.type === 'sequence' && o.id === g.seq);
        const sf = flagOf(mapId, seq);
        if (G.flags.get(sf)) { G.message.show('灯籠に、静かな火が揺れている。'); return true; }
        const n = st.seq[seq.id] || 0;
        if (g.order === n) {
          st.seq[seq.id] = n + 1;
          if (G.sound) G.sound.se('cursor');
          const total = list(st.map).filter(o => o.type === 'lantern' && o.seq === seq.id).length;
          if (n + 1 >= total) {
            G.flags.set(sf);
            api.rebuild();
            if (G.sound) G.sound.se('chest');
            G.message.show(seq.done || 'すべての灯籠に火が入った。どこかで、扉の開く音がした。');
          } else G.message.show('灯籠に、火が灯った。');
        } else {
          st.seq[seq.id] = 0;
          if (G.sound) G.sound.se('cancel');
          G.message.show(seq.wrong || '灯りが、ふっと一度に消えた。順番がちがうらしい。');
        }
        return true;
      }
      case 'torch': {
        if (g.lit || done) { G.message.show('燭台の火が、あたりを照らしている。'); return true; }
        const k = G.DATA.kotodama.hidane, m = caster();
        if (!m || !m.kotodama.includes('hidane')) { G.message.show('火の消えた燭台だ。火を点けられれば……。'); return true; }
        if (m.mp < k.mp) { G.message.show('火の消えた燭台だ。火種を唱えるには、MPが足りない。'); return true; }
        G.ui.confirm(`燭台に${k.name}を灯しますか？（MP${k.mp}）`, () => {
          m.mp -= k.mp; G.flags.set(f);
          if (G.sound) G.sound.se('chest');
          G.message.show('燭台に、火が灯った。');
        });
        return true;
      }
      case 'kotoba': {
        // 言の葉の石碑：解くと文字が光り、品か銅貨が手に入る（石碑はそのまま残る）
        if (done) { G.message.show('（石碑の言葉は、静かに光っている）'); return true; }
        G.message.show('古い石碑に、ばらばらの文字が刻まれている。並べ直せば、言葉になりそうだ。', () => {
          G.scene.push(G.scenes.kotoba(g.stone, ok => {
            if (!ok) return;
            G.flags.set(f);
            const w = g.stone.reward || {};
            const lines = [`「${g.stone.word}」――石碑の文字が、光った。`];
            if (w.item) { G.party.addItem(w.item, w.count || 1); lines.push(`石碑の奥から、${G.DATA.items[w.item].name}${(w.count || 1) > 1 ? 'を' + w.count + 'つ' : 'を'}見つけた。`); }
            if (w.copper) { G.party.addCopper(w.copper); lines.push(`石碑の奥から、銅貨を${w.copper}枚 見つけた。`); }
            if (G.sound) G.sound.se('chest');
            G.message.show(lines);
          }));
        });
        return true;
      }
      case 'guardian': {
        if (done) return false;
        // 戦う前に記録する（負けたら、ここからやり直し）
        G.message.show(g.text, () => G.ui.confirm('戦いますか？', () => G.event.run([
          { t: 'save' },
          { t: 'battle', enemies: g.enemies, bg: g.bg || st.map.battleBg },
          { t: 'flag', set: f },
          { t: 'nar', text: g.win || '番人は崩れ落ち、道が開いた。' },
        ].concat(g.reward ? [{ t: 'item', id: g.reward }] : []), () => api.rebuild())));
        return true;
      }
      default:
        return false;
    }
  }

  // 1歩歩き終えたあと：熱い床・落とし穴・滑る床・流れる床。{ slide: 向き } か { fall: 行き先 } を返す
  function afterStep(api, dir) {
    const t = api.tileAt(api.player.x, api.player.y) || {};
    const out = {};
    if (t.hurt) {
      const n = t.hurt === true ? B().HURT_STEP : t.hurt;
      let any = false;
      G.party.active().forEach(m => { if (m.hp > 1) { m.hp = Math.max(1, m.hp - n); any = true; } });
      if (any) out.hurt = true;
    }
    if (t.fall && api.map.fallTo) { out.fall = api.map.fallTo; return out; }
    if (t.flow) out.slide = t.flow;
    else if (t.slide) out.slide = dir;
    return out;
  }

  // 物を描く（岩・レバー・灯籠・燭台・重しの床）。things に足す
  function things(st, ctx, cam, T) {
    const out = [];
    const draw = (kind, x, y, under) => out.push({ y: under ? -1e6 : y * T, draw: () => G.sprite.drawObject(ctx, kind, x * T - cam.x, y * T - cam.y) });
    list(st.map).forEach(g => {
      const on = G.flags.get(flagOf(st.mapId, g));
      if (g.type === 'plate') draw(on ? 'plateOn' : 'plate', g.x, g.y, true);
      if (g.type === 'lever') draw(on ? 'leverOn' : 'leverOff', g.x, g.y);
      if (g.type === 'torch') draw(g.lit || on ? 'torchOn' : 'torchOff', g.x, g.y);
      if (g.type === 'lantern') {
        const seq = list(st.map).find(o => o.type === 'sequence' && o.id === g.seq);
        const lit = G.flags.get(flagOf(st.mapId, seq)) || (st.seq[g.seq] || 0) > g.order;
        draw(lit ? 'lanternOn' : 'lanternOff', g.x, g.y);
      }
    });
    st.boulders.forEach(b => draw('boulder', b.x, b.y));
    list(st.map).forEach(g => { if (g.type === 'guardian' && !G.flags.get(flagOf(st.mapId, g))) draw('guardian', g.x, g.y); });
    list(st.map).forEach(g => { if (g.type === 'kotoba') draw(G.flags.get(flagOf(st.mapId, g)) ? 'tabletLit' : 'tablet', g.x, g.y); });
    return out;
  }

  // 暗闇：先頭のまわりと、火の点いた燭台のまわりだけ見える（マスごとに濃さを変える）
  function drawDark(r, st, player, cam, T) {
    if (!st.map.dark) return;
    const lights = [{ x: player.px / T, y: player.py / T, r: B().DARK_RADIUS }];
    list(st.map).forEach(g => { if (g.type === 'torch' && (g.lit || G.flags.get(flagOf(st.mapId, g)))) lights.push({ x: g.x, y: g.y, r: B().TORCH_RADIUS }); });
    const x0 = Math.floor(cam.x / T), y0 = Math.floor(cam.y / T);
    for (let y = y0; y <= y0 + Math.ceil(r.H / T); y++) for (let x = x0; x <= x0 + Math.ceil(r.W / T); x++) {
      let a = B().DARK_ALPHA;
      lights.forEach(l => {
        const d = Math.hypot(x - l.x, y - l.y);
        if (d <= l.r) a = 0;
        else if (d <= l.r + 1.5) a = Math.min(a, B().DARK_ALPHA * (d - l.r) / 1.5);
      });
      if (a > 0) r.rect(x * T - cam.x, y * T - cam.y, T, T, `rgba(0,0,0,${a.toFixed(2)})`);
    }
  }

  G.gimmick = { init, overlay, objectAt, blocks, push, interact, afterStep, things, drawDark, flagOf };
})();

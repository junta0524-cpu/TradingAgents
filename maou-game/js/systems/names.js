// このファイルの役目：「名の欠片」のしくみ。マップに落ちている欠片を踏むと拾い、名を失った持ち主に話すと返せる。
// 状態は G.state.names（{ id: 'picked'|'returned' }、記録に残る）。返した数で品が届く（balance.js の NAMES.REWARDS）。
// 欠片と持ち主の一覧は js/data/names.js。マップの描画・踏んだとき・話したときは js/scenes/map.js から呼ぶ。
(function () {
  const G = window.GAME = window.GAME || {};

  const list = () => G.DATA.nameFragments;
  const st = () => (G.state.names = G.state.names || {});
  const ch = () => (G.state && G.state.chapter) || 1;
  const open = f => ch() >= f.from;

  // 持ち主の人（マップの npcs に足す。同じ物を返し続けて、マップの人の一覧が作り直されないようにする）
  const ownerNpcs = {};
  function ownerNpc(f) {
    if (!ownerNpcs[f.id]) ownerNpcs[f.id] = { id: 'name_' + f.id, look: f.owner.look, x: f.owner.x, y: f.owner.y, dir: 'down', move: 'still', nameOwner: f.id };
    return ownerNpcs[f.id];
  }

  // 返した数で届く品
  function rewards() {
    const n = G.names.returned(), got = [];
    G.state.vars = G.state.vars || {};
    G.DATA.balance.NAMES.REWARDS.forEach(r => {
      if (n >= r.n && !G.state.vars['names_reward_' + r.n]) { G.state.vars['names_reward_' + r.n] = true; G.party.addItem(r.item); got.push(r); }
    });
    return got;
  }

  G.names = {
    list,
    status: id => st()[id] || null,
    picked: () => list().filter(f => st()[f.id]).length,
    returned: () => list().filter(f => st()[f.id] === 'returned').length,
    // このマップに落ちている（まだ拾っていない）欠片
    on: mapId => (G.state ? list().filter(f => f.at.map === mapId && open(f) && !st()[f.id]) : []),
    // このマップに立つ持ち主
    owners: mapId => (G.state ? list().filter(f => f.owner.map === mapId && open(f)).map(ownerNpc) : []),
    // 踏んだ：拾った欠片を返す（なければ null）
    pickAt(mapId, x, y) {
      const f = G.names.on(mapId).find(o => o.at.x === x && o.at.y === y);
      if (!f) return null;
      st()[f.id] = 'picked';
      return f;
    },
    // 持ち主に話した：出す文の配列
    talk(id) {
      const f = list().find(o => o.id === id), s = st()[id];
      if (s === 'returned') return [`（名を取り戻した${f.name}は、穏やかな顔で、あたりを眺めている）`];
      if (s !== 'picked') return [`（${f.who}だ。自分の名を思い出せないらしい。ぼんやりと、遠くを見ている）`];
      st()[id] = 'returned';
      const lines = [`（名の欠片が、${f.who}の胸に吸いこまれていった）`, `（${f.who}は、自分の名「${f.name}」を、確かめるように小さく繰り返した。目に、光が戻った）`];
      lines.push(`名を返した。（${G.names.returned()}／${list().length}）`);
      rewards().forEach(r => lines.push(`名を取り戻した人たちから、${G.DATA.items[r.item].name}が届いた。`));
      return lines;
    },
    // 欠片の光（マップの描画から）
    draw(ctx, mapId, cam, T) {
      G.names.on(mapId).forEach(f => {
        const x = f.at.x * T - cam.x + T / 2, y = f.at.y * T - cam.y + T / 2;
        const tw = (Math.sin((G.frame + f.at.x * 7) / 10) + 1) / 2;
        ctx.save();
        ctx.fillStyle = '#fff4c0';
        ctx.globalAlpha = 0.18 + tw * 0.15;   // ぼんやりした光の輪
        ctx.beginPath(); ctx.arc(x, y, 7 + tw * 2, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.6 + tw * 0.4;     // まん中の粒
        ctx.beginPath(); ctx.arc(x, y, 2.5 + tw * 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.35 + tw * 0.4;    // きらめきの十字
        ctx.fillRect(Math.round(x) - 7, Math.round(y), 14, 1); ctx.fillRect(Math.round(x), Math.round(y) - 7, 1, 14);
        ctx.restore();
      });
    },
  };
})();

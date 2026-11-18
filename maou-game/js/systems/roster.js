// このファイルの役目：育てられる仲間（ユーザー決定：各章の仲間をクリア後に育成し、ミナモのギルドの酒場で入れ替える）。
// 物語のあいだの臨時の仲間（TEMP_PARTY・レベルなし）はそのまま。クリア後、酒場で呼んだ仲間はレベルが上がり、Lv99でカンストする。
// 数字は balance.js の ROSTER（はじめのレベル・最終の強さ・覚える言霊・追い上げ）。酒場にいる仲間は G.state.roster に預かる。
(function () {
  const G = window.GAME = window.GAME || {};
  const R = () => G.DATA.balance.ROSTER;
  const KEYS = ['hp', 'mp', 'atk', 'def', 'agi', 'wis'];
  const NAMES = { hp: 'HP', mp: 'MP', atk: '攻撃', def: '守備', agi: '素早さ', wis: '賢さ' };

  const ids = () => Object.keys(R().members);
  // はじめのレベル：仲間になった章の推奨レベル − START_BELOW
  const startLv = id => G.DATA.balance.REC_LV[R().members[id].join] - R().START_BELOW;

  // 成長表の行（レベル1〜最大）を作る。はじめの強さ（TEMP_PARTY）から最終の強さへ、オオナムチの成長の進み方に合わせて増やす
  function buildGrowth(id) {
    const B = G.DATA.balance, r = R().members[id], t = B.TEMP_PARTY[id], f = r.final, lv0 = startLv(id), O = B.GROWTH.oonamuchi;
    const rows = [null];
    for (let lv = 1; lv <= B.MAX_LEVEL; lv++) {
      const L = Math.max(lv, lv0), prev = rows[lv - 1];
      rows.push(KEYS.map((k, i) => {
        const o0 = O[lv0][i], o1 = O[B.MAX_LEVEL][i], s = o1 > o0 ? (O[L][i] - o0) / (o1 - o0) : 0;
        const v = Math.round(t[k] + (f[k] - t[k]) * s);
        return prev ? Math.max(v, prev[i]) : v;   // 下がらない
      }));
    }
    B.GROWTH[id] = rows;
  }

  // そのレベルまでに覚える言霊を、まだ覚えていなければ足す。覚えた言霊の名前を返す
  function learnUpTo(m, upTo, from) {
    const r = R().members[m.id], got = [];
    if (!r) return got;
    Object.keys(r.learn).map(Number).sort((a, b) => a - b).forEach(lv => {
      if (lv > upTo || (from != null && lv <= from)) return;
      const k = r.learn[lv];
      if (!m.kotodama.includes(k)) { m.kotodama.push(k); got.push(k); }
    });
    return got;
  }

  const store = () => (G.state.roster = G.state.roster || {});
  const inParty = id => !!G.party.member(id);
  // 酒場で呼べる人の状態：いま仲間にいる／酒場で待っている／まだ一度も呼んでいない
  const memberOf = id => G.party.member(id) || store()[id] || null;

  // 追い上げ：オオナムチよりずっと低いレベルの仲間は、経験値が増える
  function expMult(m) {
    if (!m || !m.roster || m.lv == null) return 1;
    const lead = G.party.member('oonamuchi'), c = R().CATCHUP;
    const gap = (lead && lead.lv != null ? lead.lv : m.lv) - m.lv;
    return gap >= c.GAP ? Math.min(c.MAX, 1 + gap / c.PER) : 1;
  }

  // 呼ぶ：4人まで。'ok'／'full'／'already'
  function recruit(id) {
    if (inParty(id)) return 'already';
    if (G.state.party.length >= G.DATA.balance.PARTY_MAX) return 'full';
    const m = store()[id] || G.party.makeRosterMember(id);
    delete store()[id];
    G.state.party.push(m);
    return 'ok';
  }
  // 外す：酒場で待たせる（強さと経験値はそのまま）
  function dismiss(id) {
    const m = G.party.member(id);
    if (!m || !m.roster) return false;
    G.state.party.splice(G.state.party.indexOf(m), 1);
    store()[id] = m;
    return true;
  }

  // ---- 酒場の画面（ギルドの受付の隣の人に話すと開く。クリア後だけ）----
  const stat = m => KEYS.map(k => `${NAMES[k]} ${m[k === 'hp' ? 'maxHp' : k === 'mp' ? 'maxMp' : k]}`).join('　');
  const lvOf = id => { const m = memberOf(id); return m ? m.lv : startLv(id); };
  const nameOf = id => G.DATA.characters[id].name;

  function openTavern() {
    const main = () => [{ label: '仲間を呼ぶ' }, { label: '仲間を外す' }, { label: '仲間の強さを見る' }, { label: 'やめる' }];
    G.ui.choose(main(), { x: 120, y: 40, w: 240, title: '仲間の酒場', stay: true, refresh: main, name: '酒場' }, i => {
      if (i === 0) {
        const list = ids().filter(id => !inParty(id));
        if (!list.length) { G.message.show('（いまの仲間のほかに、呼べる人はいない）'); return; }
        G.ui.choose(list.map(id => ({ label: `${nameOf(id)}　Lv${lvOf(id)}` })).concat([{ label: 'もどる' }]), { x: 120, y: 40, w: 240, title: '呼ぶ', name: '酒場' }, k => {
          if (k >= list.length) return;
          const id = list[k], r = recruit(id);
          G.message.show(r === 'full' ? '（仲間は4人まで。だれかを外してから）' : `${nameOf(id)}が、仲間に加わった。`);
        });
      } else if (i === 1) {
        const list = G.state.party.filter(m => m.roster);
        if (!list.length) { G.message.show('（外せる仲間は、いまいない）'); return; }
        G.ui.choose(list.map(m => ({ label: `${m.name}　Lv${m.lv}` })).concat([{ label: 'もどる' }]), { x: 120, y: 40, w: 240, title: '外す', name: '酒場' }, k => {
          if (k >= list.length) return;
          dismiss(list[k].id);
          G.message.show(`${list[k].name}は、酒場で待つことになった。`);
        });
      } else if (i === 2) {
        G.ui.choose(ids().map(id => ({ label: `${nameOf(id)}　Lv${lvOf(id)}` })).concat([{ label: 'もどる' }]), { x: 120, y: 40, w: 240, title: '強さ', name: '酒場' }, k => {
          if (k >= ids().length) return;
          const id = ids()[k], m = memberOf(id), r = R().members[id];
          const here = inParty(id) ? '（いま、一緒にいる）' : m ? '（酒場で待っている）' : '（まだ呼んだことがない）';
          const lines = [`${nameOf(id)}　${r.role}　${here}`];
          lines.push(m ? `Lv${m.lv}／${G.DATA.balance.MAX_LEVEL}　${stat(m)}` : `はじめは Lv${startLv(id)}`);
          lines.push(`Lv${G.DATA.balance.MAX_LEVEL}では　` + KEYS.map(q => `${NAMES[q]} ${r.final[q]}`).join('　'));
          G.message.show(lines);
        });
      } else { G.scene.pop(); }
    });
  }

  G.roster = { ids, startLv, buildGrowth, learnUpTo, expMult, recruit, dismiss, memberOf, inParty, openTavern, store };
})();

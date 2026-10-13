// このファイルの役目：物語の場面（イベント）を、データに書いた順に流すしくみ。
// 場面の中身は js/data/story/ にあり、ここは「どう流すか」だけを受け持つ。
//
// 使える命令（{ t: '命令', ... } の形で並べる）：
//   say   { name, text }        … 名前つきのセリフ（続けて並べると1回で流れる）
//   nar   { text }              … 語り（名前なし）
//   title { text, sub }         … 章の見出し（黒い画面に大きく）
//   bg    { key, actors }       … 背景の絵（js/core/backdrop.js）。key: null で歩くマップに戻る
//   actors[{ look, x, y, dir }] … 背景の上に立つ人（2倍の大きさ）
//   goto  { map, x, y, dir }    … 歩くマップを切り替える
//   party { ids }               … 仲間を入れ替える
//   rename{ id, name, look }    … 仲間の名前（と見た目）を変える（ベルイザナ → ベル など）
//   walk  { dir, steps }        … 歩くマップの先頭を歩かせる（steps: 0 で向きだけ変える）
//   state { ... }               … いまの状態を書き換える（chapter, disguised など）
//   flag  { set, value }        … フラグを立てる（value:false で下ろす）
//   if    { flag, then, else }  … フラグで分ける（not: true で「立っていなければ」。all: [...] で「全部立っていれば」）
//   call  { id }                … ほかの場面を続けて流す
//   rampage { key, noAfter }    … 蹂躙戦闘（js/data/rampage.js）
//   letter{ lines }             … 手紙の窓
//   wait  { frames }            … 少し待つ
//   fade  { to: 1 か 0, color } … 暗くする／明るくする（color: 'white' で白くする）
//   chapter { n }               … 次の章へ（js/systems/story.js）
//   save                        … 自動で記録する
//   bgm   { name }              … 曲を変える（js/core/sound.js の SONGS。null で止める）
//   battle{ enemies, boss, bg, hook, training, chant, erase } … 決まった敵との戦い（erase：倒した敵が消える）（hook(st) はラウンドの終わりに呼ぶ。出来事の配列を返す）
//                                 勝ったかどうかはフラグ last_battle_won に入る（手合わせで使う）
//   learn { id, kotodama }      … 仲間が言霊を覚える（「〇〇を覚えた！」と出る）
//   join  { id } / leave { id } … 仲間が加わる／別れる（quiet: true で知らせを出さない）
//   choice{ text, options: [{ label, then: [...] }] } … 選択肢（選んだものの then を流す）
//   inhibit{ drain }            … 阻害ゲージを減らす（物語の場面で力が漏れたとき）
//   item  { id, count }         … 道具を手に入れる（「〇〇を手に入れた。」と出る）
//   pillar{ sys }               … 9章の祈り：その系統の紋を呼ぶ（覚えた言霊が多いほど強く光る。G.state.vars.prayer に足す）
//   run   { fn }                … 決まった処理を動かす（数えた結果からフラグを決める、など。なるべく使わない）
//   teach { list }              … クリア後の師：balance.js の POSTGAME.TEACH[list] から、まだ覚えていない言霊を一つ教わる
//   msgfn { fn }                … その場で作った文を出す（四系統の育ち具合など）
//   stop                        … この場面をここで終える（天の声の問いをまちがえたとき）
//   count { key }               … 数を1つ増やす（G.state.vars[key]。選択の結果を後の章で使う）
(function () {
  const G = window.GAME = window.GAME || {};

  function resolve(script) {
    if (typeof script === 'string') {
      const s = G.DATA.events[script];
      if (!s) throw new Error('場面が見つかりません：' + script);
      return s.slice();
    }
    return script.slice();
  }

  function createEventScene(cmds, onDone, music) {
    let i = 0, waiting = false, timer = 0;
    let bg = null, actors = [], card = null, fadeA = 0, fadeTo = 0, fadeColor = '0,0,0', letter = null, walking = false;
    const self = {
      name: 'イベント',
      get opaque() { return !!bg || !!card; },
      get bg() { return bg; },
      resume() { waiting = false; },
      update() {
        if (fadeA !== fadeTo) { fadeA += Math.sign(fadeTo - fadeA) * 0.08; if (Math.abs(fadeA - fadeTo) < 0.08) fadeA = fadeTo; return; }
        if (card) {
          timer++;
          if (timer > 40 && (G.input.pressed('ok') || timer > 200)) { card = null; timer = 0; }
          return;
        }
        if (letter) { if (G.input.pressed('ok')) letter = null; return; }
        if (walking) { const m = G.scene.find('マップ'); walking = !!m && m.tickScript(); return; }
        if (timer > 0) { timer--; return; }
        while (!waiting && !card && !letter && !walking && timer <= 0 && fadeA === fadeTo) {
          if (i >= cmds.length) { finish(); return; }
          step(cmds[i++]);
        }
      },
      draw() {
        const r = G.renderer;
        if (bg) {
          G.backdrop.draw(bg);
          actors.forEach(a => {
            const ctx = r.ctx;
            ctx.save(); ctx.translate(a.x, a.y); ctx.scale(2, 2); ctx.imageSmoothingEnabled = false;
            ctx.globalAlpha = G.inhibit.impression(a.look, actors);   // 偽名の間、オオナムチのいない場面ではベルの印象が薄れる
            G.sprite.drawPerson(ctx, a.look, a.dir || 'down', 0, false, -8, -16);
            ctx.restore();
          });
        }
        if (fadeA > 0) r.rect(0, 0, r.W, r.H, `rgba(${fadeColor},${fadeA})`);
        if (card) {
          r.clear('#000');
          r.text(card.text, r.W / 2, 140, '#fff', 'center');
          if (card.sub) r.text(card.sub, r.W / 2, 170, '#aaa', 'center');
        }
        if (letter) {
          r.rect(0, 0, r.W, r.H, 'rgba(0,0,0,0.6)');
          G.ui.drawWindow(30, 100, 420, 30 + letter.length * 24);
          letter.forEach((l, k) => r.text(l, 50, 118 + k * 24, k === 0 ? '#e8e0c8' : '#ccc'));
          if (G.ui.blinkOn()) r.text('▼', 430, 100 + letter.length * 24 + 8, '#fff', 'center');
        }
      },
    };

    // 場面の曲（js/data/music.js）。場面のあいだは、場所の曲に戻さない
    let locked = false;
    const lockMusic = name => { if (!locked) { locked = true; G.event.musicLock = (G.event.musicLock || 0) + 1; } G.sound.bgm(name); };
    if (music) lockMusic(music);

    function finish() {
      if (locked) G.event.musicLock = Math.max(0, (G.event.musicLock || 0) - 1);
      G.event.running = Math.max(0, G.event.running - 1);
      if (G.scene.top() === self) G.scene.pop();
      if (onDone) onDone();
    }

    function step(c) {
      switch (c.t) {
        case 'say': case 'nar': {
          // 続くセリフと語りを、まとめて1回で流す
          const list = [toLine(c)];
          while (i < cmds.length && (cmds[i].t === 'say' || cmds[i].t === 'nar')) list.push(toLine(cmds[i++]));
          waiting = true;
          G.message.show(list);
          return;
        }
        case 'title': card = { text: c.text, sub: c.sub }; timer = 0; return;
        case 'bg': bg = c.key; actors = c.actors || []; return;
        case 'actors': actors = c.list || []; return;
        case 'goto': {
          G.scene.change(G.scenes.map(c.map, c.x, c.y, c.dir));
          G.scene.push(self);
          return;
        }
        case 'party': G.party.setMembers(c.ids); return;
        case 'rename': {
          const m = G.party.member(c.id);
          if (m) { m.name = c.name; if ('look' in c) { if (c.look) m.look = c.look; else delete m.look; } }
          return;
        }
        case 'walk': {
          const m = G.scene.find('マップ');
          if (m) { m.scriptMove(c.dir, c.steps || 0); walking = true; }
          return;
        }
        case 'state': {
          Object.assign(G.state, c.set);
          // 偽名を名乗る／正体を現すと、ベルの強さが切り替わる（正体を現したら満タン）
          const bell = ('disguised' in c.set || 'chapter' in c.set) && G.party.member('bell');
          if (bell) { const was = bell.maxHp; G.party.recalc(bell); if (!G.state.disguised || bell.maxHp > was) { bell.hp = bell.maxHp; bell.mp = bell.maxMp; } }
          return;
        }
        case 'flag': G.flags.set(c.set, c.value !== false); return;
        case 'if': {
          const on = (c.all ? c.all.every(f => G.flags.get(f)) : G.flags.get(c.flag)) !== !!c.not;
          const branch = on ? (c.then || []) : (c.else || []);
          cmds.splice(i, 0, ...branch);
          return;
        }
        case 'call': cmds.splice(i, 0, ...resolve(c.id)); return;
        case 'rampage':
          waiting = true;
          G.scene.push(G.scenes.rampage(c.key, { noAfter: c.noAfter, onEnd: () => { G.scene.pop(); } }));
          return;
        case 'letter': letter = c.lines; return;
        case 'wait': timer = c.frames || 30; return;
        case 'fade': fadeTo = c.to; if (c.color) fadeColor = c.color === 'white' ? '255,255,255' : c.color; else if (c.to > 0) fadeColor = '0,0,0'; return;
        case 'save': G.save.write('auto'); return;
        case 'bgm': if (c.name) lockMusic(c.name); else G.sound.bgm(null); return;
        case 'battle':
          waiting = true;
          G.scene.push(G.scenes.battle(c.enemies, { boss: c.boss !== false, bg: c.bg, roundHook: c.hook, training: c.training, chant: c.chant, erase: c.erase }));
          return;
        case 'learn': {
          const m = G.party.member(c.id);
          if (!m || m.kotodama.includes(c.kotodama)) return;
          m.kotodama.push(c.kotodama);
          G.sound.se('learn');
          waiting = true;
          G.message.show(`${m.name}は「${G.DATA.kotodama[c.kotodama].name}」を覚えた！`);
          return;
        }
        case 'join': case 'leave': {
          const ok = c.t === 'join' ? G.party.join(c.id) : G.party.leave(c.id);
          if (!ok || c.quiet) return;
          const name = G.DATA.characters[c.id].name, temp = G.DATA.characters[c.id].temp;
          waiting = true;
          G.message.show(c.t === 'join' ? `${name}が、仲間に加わった。${temp ? '（この土地にいる間だけ、一緒に行く）' : ''}` : `${name}が、仲間から外れた。`);
          return;
        }
        case 'choice': {
          waiting = true;
          // disabled: true の選択肢は灰色（選ぶと disabledText を出す）
          G.ui.choose(c.options.map(o => ({ label: o.label, disabled: !!o.disabled || (o.doneIf && G.flags.get(o.doneIf)) })), {
            x: 8, y: 240 - 22 - c.options.length * 16 - 20, w: 300, title: c.text, name: '選択肢', cancelable: false,
            onDisabled: k => G.message.show(c.options[k].doneIf && G.flags.get(c.options[k].doneIf) ? 'もう、済んでいる。' : (c.options[k].disabledText || '……。')),
          }, k => { cmds.splice(i, 0, ...(c.options[k].then || [])); waiting = false; });
          return;
        }
        case 'inhibit': G.inhibit.drain(c.drain || 0); return;
        case 'item': {
          G.party.addItem(c.id, c.count || 1);
          waiting = true;
          G.message.show(`${G.DATA.items[c.id].name}${(c.count || 1) > 1 ? 'を' + c.count + 'つ' : 'を'}手に入れた。`);
          return;
        }
        case 'pillar': {
          const o = G.party.member('oonamuchi');
          const n = o ? o.kotodama.filter(id => (G.DATA.kotodama[id] || {}).sys === c.sys).length : 0;
          G.flags.set('pray_' + c.sys);
          G.state.vars = G.state.vars || {};
          G.state.vars.prayer = (G.state.vars.prayer || 0) + n;
          waiting = true;
          G.message.show(n >= 2 ? '紋が、強く光った。' : '紋が、淡く光った。');
          return;
        }
        case 'run': c.fn(); return;
        case 'teach': {
          const m = G.party.member('oonamuchi');
          const id = m && G.DATA.balance.POSTGAME.TEACH[c.list].find(k => !m.kotodama.includes(k));
          waiting = true;
          if (!id) { G.message.show('（もう、教わることはない）'); return; }
          m.kotodama.push(id);
          G.message.show(`${m.name}は「${G.DATA.kotodama[id].name}」を覚えた！`);
          return;
        }
        case 'msgfn': waiting = true; G.message.show(c.fn()); return;
        case 'stop': cmds.splice(i, cmds.length - i); return;
        case 'count': G.state.vars = G.state.vars || {}; G.state.vars[c.key] = (G.state.vars[c.key] || 0) + 1; return;
        case 'chapter':
          cmds.splice(i, cmds.length - i);   // この場面は終わり、次の章の始まりへ
          cmds.push(...resolve(G.story.startScript(c.n)));
          return;
        default:
          console.warn('知らない命令：', c.t);
      }
    }
    return self;
  }

  function toLine(c) { return c.t === 'say' ? { name: c.name, text: c.text } : c.text; }

  G.event = {
    running: 0,
    pending: null,    // 言伝などで、メニューを閉じてから流す場面
    run(script, onDone) {
      G.event.running++;
      const music = typeof script === 'string' && G.DATA.music ? G.DATA.music.events[script] : null;
      G.scene.push(createEventScene(resolve(script), onDone, music));
    },
  };
})();

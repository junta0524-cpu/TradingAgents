// 描画ユーティリティ ― タイル・パネル・文字・ゲージなど、各シーン共通の描画部品
var Game = window.Game || {};
Game.Renderer = (function () {
  var TILE = 32;

  var MARGIN = 8;

  // キャンバスより小さいマップ(街など)は中央に寄せ、大きいマップは主人公を追って
  // スクロールさせる。端まで来たらそれ以上は流さず、マップの外側を映さない。
  function mapOffset(map, canvasW, canvasH, focus) {
    var mapW = map.tiles[0].length * TILE;
    var mapH = map.tiles.length * TILE;
    var viewH = (canvasH || 480) - MARGIN * 2;
    var ox, oy;
    if (mapW <= canvasW) {
      ox = Math.round((canvasW - mapW) / 2);
    } else {
      ox = Math.round(canvasW / 2 - ((focus ? focus.x : 0) * TILE + TILE / 2));
      ox = Math.min(0, Math.max(canvasW - mapW, ox));
    }
    if (mapH <= viewH) {
      oy = MARGIN;
    } else {
      oy = Math.round(viewH / 2 - ((focus ? focus.y : 0) * TILE + TILE / 2)) + MARGIN;
      oy = Math.min(MARGIN, Math.max(viewH - mapH + MARGIN, oy));
    }
    return { x: ox, y: oy };
  }

  function drawMap(ctx, map, off) {
    off = off || { x: 0, y: 0 };
    // 画面の外まで描いても見えないので、映る範囲のタイルだけ描く
    var x0 = Math.max(0, Math.floor(-off.x / TILE));
    var x1 = Math.min(map.tiles[0].length, Math.ceil((ctx.canvas.width - off.x) / TILE));
    var y0 = Math.max(0, Math.floor(-off.y / TILE));
    var y1 = Math.min(map.tiles.length, Math.ceil((ctx.canvas.height - off.y) / TILE));
    for (var y = y0; y < y1; y++) {
      var row = map.tiles[y];
      for (var x = x0; x < x1; x++) {
        var ch = row[x];
        var def = Game.Data.TileDefs[ch] || Game.Data.TileDefs['.'];
        var px = off.x + x * TILE, py = off.y + y * TILE;
        // 人が立つマスは、下に床を敷いてから人物を重ねる(人物は drawMapActors 側)。
        // 玉座のように、そのマス自身の絵があるものはそれを使い、無ければ街の床に落とす。
        var img = Game.Assets.tile(ch);
        if (!img && def.isNpc) img = Game.Assets.tile('F');
        if (img) {
          ctx.drawImage(img, px, py, TILE, TILE);
        } else {
          // 絵がまだ無いとき、人が立つマスを 'N' の紫で塗ると、
          // 人物スプライトの足元に紫の敷物が出てしまう。床の色に合わせる。
          ctx.fillStyle = def.isNpc ? Game.Data.TileDefs['F'].color : def.color;
          ctx.fillRect(px, py, TILE, TILE);
          ctx.strokeStyle = 'rgba(0,0,0,0.06)';
          ctx.strokeRect(px, py, TILE, TILE);
        }
        // 絵が入ったタイルは記号を重ねない(看板は絵の中に描かれている)
        if (img && !def.isNpc) continue;
        if (def.isGate) {
          ctx.fillStyle = '#f7f3e9';
          ctx.font = '18px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('⛩', px + TILE / 2, py + TILE / 2 + 6);
        } else if (def.glyph) {
          // 店・宿屋・教会は一文字で示す(あとで看板の絵に差し替えられる)
          ctx.fillStyle = '#f7f3e9';
          ctx.font = 'bold 15px "Yu Gothic","Hiragino Sans",sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(def.glyph, px + TILE / 2, py + TILE / 2 + 5);
        }
      }
    }
  }

  // 立ち絵を、足元をマスの下端に合わせて描く(マスより背が高い分は上へはみ出す)。
  // opts で歩行シートの何コマ目か、左右反転するかを指定できる。
  function drawSprite(ctx, img, gridX, gridY, off, opts) {
    off = off || { x: 0, y: 0 };
    opts = opts || {};
    var w = Game.Assets.SPRITE_W, h = Game.Assets.SPRITE_H;
    var px = off.x + gridX * TILE + (TILE - w) / 2;
    var py = off.y + (gridY + 1) * TILE - h;
    var frames = opts.frames || 1;
    var sw = img.width / frames;
    var sx = (opts.frame || 0) * sw;

    if (!opts.flip) {
      ctx.drawImage(img, sx, 0, sw, img.height, px, py, w, h);
      return;
    }
    // 左向きは右向きの絵を反転して使う
    ctx.save();
    ctx.translate(px + w, py);
    ctx.scale(-1, 1);
    ctx.drawImage(img, sx, 0, sw, img.height, 0, 0, w, h);
    ctx.restore();
  }

  // マップに立つ人物をまとめて描く。
  // 手前(下)の人ほど後に描いて重なりを正しくする。
  function drawActors(ctx, actors, off) {
    actors.slice().sort(function (a, b) { return (a.y - b.y) || (a.x - b.x); })
      .forEach(function (a) {
        if (a.img) drawSprite(ctx, a.img, a.x, a.y, off, a);
        else drawToken(ctx, a.x, a.y, a.color, off);
      });
  }

  // マップに配置された町の人を、描画用の並びとして取り出す
  function npcActors(map) {
    if (!map.npcAt) return [];
    return Object.keys(map.npcAt).map(function (pos) {
      var xy = pos.split(',');
      var img = Game.Assets.spriteForNpc(map.npcAt[pos]);
      return img ? { x: +xy[0], y: +xy[1], img: img } : null;
    }).filter(Boolean);
  }

  function drawToken(ctx, gridX, gridY, color, off) {
    off = off || { x: 0, y: 0 };
    var cx = off.x + gridX * TILE + TILE / 2;
    var cy = off.y + gridY * TILE + TILE / 2;
    ctx.fillStyle = color || '#e9e2cf';
    ctx.strokeStyle = '#241f18';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, TILE * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // ドラクエの窓。真っ黒のベタ塗りに、白い枠を二重に入れる。
  // 半透明にすると後ろの地図が透けて「窓」に見えなくなるので、中は不透明。
  function drawPanel(ctx, x, y, w, h) {
    ctx.save();
    ctx.fillStyle = '#0b0d16';
    roundRect(ctx, x, y, w, h, 5); ctx.fill();
    ctx.strokeStyle = '#ece7da';
    ctx.lineWidth = 2;
    roundRect(ctx, x + 1, y + 1, w - 2, h - 2, 5); ctx.stroke();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(236,231,218,0.55)';
    roundRect(ctx, x + 5, y + 5, w - 10, h - 10, 3); ctx.stroke();
    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawText(ctx, text, x, y, opts) {
    opts = opts || {};
    ctx.font = (opts.size || 15) + 'px "Yu Gothic","Hiragino Sans",sans-serif';
    ctx.textAlign = opts.align || 'left';
    // 1ドットの黒い影。ドット絵の上に置いた文字が締まって見える
    if (opts.shadow !== false) {
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillText(text, x + 1, y + 1);
    }
    ctx.fillStyle = opts.color || '#ece7da';
    ctx.fillText(text, x, y);
  }

  function drawBar(ctx, x, y, w, h, ratio, color) {
    ratio = Math.max(0, Math.min(1, ratio));
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w * ratio, h);
    ctx.strokeStyle = '#ece7da';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
  }

  return { TILE: TILE, mapOffset: mapOffset, drawMap: drawMap, drawToken: drawToken,
    drawSprite: drawSprite, drawActors: drawActors, npcActors: npcActors, drawPanel: drawPanel, drawText: drawText, drawBar: drawBar };
})();

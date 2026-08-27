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
        var def = Game.Data.TileDefs[row[x]] || Game.Data.TileDefs['.'];
        var px = off.x + x * TILE, py = off.y + y * TILE;
        ctx.fillStyle = def.color;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.strokeStyle = 'rgba(0,0,0,0.06)';
        ctx.strokeRect(px, py, TILE, TILE);
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

  function drawPanel(ctx, x, y, w, h) {
    ctx.fillStyle = 'rgba(23,27,43,0.92)';
    ctx.strokeStyle = '#cbbfa0';
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
  }

  function drawText(ctx, text, x, y, opts) {
    opts = opts || {};
    ctx.fillStyle = opts.color || '#ece7da';
    ctx.font = (opts.size || 15) + 'px "Yu Gothic","Hiragino Sans",sans-serif';
    ctx.textAlign = opts.align || 'left';
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

  return { TILE: TILE, mapOffset: mapOffset, drawMap: drawMap, drawToken: drawToken, drawPanel: drawPanel, drawText: drawText, drawBar: drawBar };
})();

// 描画ユーティリティ ― タイル・パネル・文字・ゲージなど、各シーン共通の描画部品
var Game = window.Game || {};
Game.Renderer = (function () {
  var TILE = 32;

  // キャンバスより小さいマップ(街など)が左上に寄って見えないよう、横方向は中央に寄せる。
  // 縦は下部の会話ウィンドウと干渉しないよう、上寄せのまま少しだけ余白を取る。
  function mapOffset(map, canvasW) {
    var mapW = map.tiles[0].length * TILE;
    return { x: Math.max(0, Math.round((canvasW - mapW) / 2)), y: 8 };
  }

  function drawMap(ctx, map, off) {
    off = off || { x: 0, y: 0 };
    for (var y = 0; y < map.tiles.length; y++) {
      var row = map.tiles[y];
      for (var x = 0; x < row.length; x++) {
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

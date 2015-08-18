var Jimp = require('jimp');
var Promise = require('bluebird');

module.exports = ImageBuffer;

function ImageBuffer(opts) {
  var onLoad = function (err) {
    if (err) {
      this._reject();
    } else {
      this._resolve();
    }
  };

  this._onLoad = new Promise(function (resolve, reject) {
      this._resolve = resolve;
      this._reject = reject;
    }.bind(this))
    .bind(this);

  if ('width' in opts) {
    Jimp.call(this, opts.width, opts.height, onLoad);
  } else if (opts instanceof ImageBuffer) {
    Jimp.call(this, ImageBuffer, onLoad);
  } else if (opts.filename) {
    Jimp.call(this, opts.filename, onLoad);
  } else if (opts.buffer) {
    Jimp.call(this, opts.buffer, onLoad);
  }
}

ImageBuffer.prototype = Object.create(Jimp.prototype);

ImageBuffer.prototype.load = function () {
  return this._onLoad;
};

ImageBuffer.prototype.drawImageJava = function (imageBuffer, dx, dy, dx2, dy2, sx, sy, sx2, sy2) {
  this.drawImage(imageBuffer, sx, sy, sx2 - sx, sy2 - sy, dx, dy, dx2 - dx, dy2 - dy);
};

ImageBuffer.prototype.drawImage = function (imageBuffer, sx, sy, sw, sh, dx, dy, dw, dh) {
  sx = sx || 0;
  sy = sy || 0;
  sw = sw || imageBuffer.bitmap.width;
  sh = sh || imageBuffer.bitmap.height;
  dx = dx === undefined ? sx : dx;
  dy = dy === undefined ? sy : dy;
  dw = dw === undefined ? sw : dw;
  dh = dh === undefined ? sh : dh;

  if (dx >= this.bitmap.width || dy >= this.bitmap.height || dx < 0 || dy < 0) { return; }

  if (dw != sw || dh != sh) {
    console.warn("[warn] scaling ", sw, '->', dw, sh, '->', dh);

    this.drawImage(new Jimp(imageBuffer.raw)
      .crop(sx, sy, sw, sh)
      .resize(dw, dh), 0, 0, dw, dh, dx, dy, dw, dh);
  } else {
    var srcCols = imageBuffer.bitmap.width;
    var destCols = this.bitmap.width;

    var src = imageBuffer.bitmap.data;
    var dest = this.bitmap.data;
    for (var i = 0; i < dh; ++i) {
      for (var j = 0; j < dw; ++j) {
        var idx = ((i + dy) * destCols + (j + dx)) * 4;
        var srcIdx = ((i + sy) * srcCols + (j + sx)) * 4;
        dest[idx] = src[srcIdx];
        dest[idx + 1] = src[srcIdx + 1];
        dest[idx + 2] = src[srcIdx + 2];
        dest[idx + 3] = src[srcIdx + 3];
      }
    }
  }
};

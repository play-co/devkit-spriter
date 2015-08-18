var EventEmitter = require('events').EventEmitter;
var Promise = require('bluebird');
var crypto = require('crypto');
var Jimp = require('jimp');

Jimp.prototype.drawImageJava = function (src, dx, dy, dx2, dy2, sx, sy, sx2, sy2) {
  this.drawImage(src, sx, sy, sx2 - sx, sy2 - sy, dx, dy, dx2 - dx, dy2 - dy);
};

Jimp.prototype.drawImage = function (src, sx, sy, sw, sh, dx, dy, dw, dh) {
  sx = sx || 0;
  sy = sy || 0;
  sw = sw || src.bitmap.width;
  sh = sh || src.bitmap.height;
  dx = dx === undefined ? sx : dx;
  dy = dy === undefined ? sy : dy;
  dw = dw === undefined ? sw : dw;
  dh = dh === undefined ? sh : dh;

  if (dx >= this.bitmap.width || dy >= this.bitmap.height || dx < 0 || dy < 0) { return; }

  if (dw != sw || dh != sh) {
    console.warn("[warn] scaling ", sw, '->', dw, sh, '->', dh);

    this.drawImage(new Jimp(src.raw)
      .crop(sx, sy, sw, sh)
      .resize(dw, dh), 0, 0, dw, dh, dx, dy, dw, dh);
  } else {
    var srcCols = src.bitmap.width;
    var destCols = this.bitmap.width;

    var src = src.bitmap.data;
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

var EmptyJimp = function (width, height) {
  this.bitmap = {
    data: new Buffer(width * height * 4),
    width: width,
    height: height
  };
};

EmptyJimp.prototype = Object.create(Jimp.prototype);

function Cache() {

}

Cache.prototype.load = function (filename) {

};

Cache.prototype.getFileHash = function (filename) {
  return this._fileHashes[filename];
};

module.exports = {
  ImageLoader: ImageLoader,
  Spriter: Spriter,
  SheetWriter: SheetWriter,
  test: function (images) {
    var img = new EmptyJimp(SHEET_MAX_SIZE, SHEET_MAX_SIZE);
    SheetWriter.prototype.blit.call({image: img}, images[1], 10, 10);
    img.write('sheet-test.png');
  }
};

var sheetNumber = 0;
function SheetWriter(sheet) {
  if (sheet.length == 1) {
    // copy image
  } else {
    this.image = new EmptyJimp(SHEET_MAX_SIZE, SHEET_MAX_SIZE);
    sheet.forEach(function (sprite, index) {
      this.blit(sprite.image, sprite.x, sprite.y);
    }, this);
    this.image.write('spritesheets/spritetest-' + sheetNumber++ + '.png');
  }
}

SheetWriter.prototype.blit = function (img, x, y) {
  //dest params, with dx2 / dy2 being exclusive
  var dx = x;
  var dy = y;
  var dx2 = x + img.contentWidth;
  var dy2 = y + img.contentHeight;

  //source params, with sx2 / sy2 being exclusive
  var sx = img.margin.left;
  var sy = img.margin.top;
  var sx2 = sx + img.contentWidth;
  var sy2 = sy + img.contentHeight;

  for (var i = 1; i <= PAD; i++) {
    //top-left
    this.image.drawImageJava(img.raw,
        dx - i, dy - i, dx - i + 1, dy - i + 1,
        sx, sy, sx + 1, sy + 1);

    //top
    this.image.drawImageJava(img.raw,
        dx, dy - i, dx2, dy - i + 1,
        sx, sy, sx2, sy + 1);

    //top-right
    this.image.drawImageJava(img.raw,
        dx2 + i - 1, dy - i, dx2 + i, dy -i + 1,
        sx2 - 1, sy, sx2, sy + 1);

    //right
    this.image.drawImageJava(img.raw,
        dx2 + i - 1, dy, dx2 + i, dy2,
        sx2 - 1, sy, sx2, sy2);

    //bottom-right
    this.image.drawImageJava(img.raw,
        dx2 + i - 1, dy2 + i - 1, dx2 + i, dy2 + i,
        sx2 - 1, sy2 - 1, sx2, sy2);

    //bottom
    this.image.drawImageJava(img.raw,
        dx, dy2 + i - 1, dx2, dy2 + i,
        sx, sy2 - 1, sx2, sy2);

    //bottom-left
    this.image.drawImageJava(img.raw,
        dx - i, dy2 + i - 1, dx - i + 1, dy2 + i,
        sx, sy2 - 1, sx + 1, sy2);

    //left
    this.image.drawImageJava(img.raw,
        dx - i, dy, dx - i + 1, dy2,
        sx, sy, sx + 1, sy2);

  }

  var xOdd = ((PAD + dx2) & 0x1) !== 0;
  var yOdd = ((PAD + dy2) & 0x1) !== 0;

  // extend the right side
  if (xOdd) {
    //top-right
    this.image.drawImageJava(img.raw,
        dx2 + PAD, dy - PAD, dx2 + PAD + 1, dy - PAD + 1,
        sx2 - 1, sy, sx2, sy + 1);

    //right
    this.image.drawImageJava(img.raw,
        dx2 + PAD, dy, dx2 + PAD + 1, dy2,
        sx2 - 1, sy, sx2, sy2);

  }
  // extend the bottom
  if (yOdd) {
    //bottom
    this.image.drawImageJava(img.raw,
        dx, dy2 + PAD, dx2, dy2 + PAD + 1,
        sx, sy2 - 1, sx2, sy2);

    //bottom-left
    this.image.drawImageJava(img.raw,
        dx - PAD, dy2 + PAD, dx - PAD + 1, dy2 + PAD + 1,
        sx, sy2 - 1, sx + 1, sy2);
  }

  // extend the bottom right
  if (yOdd && xOdd) {
    //bottom-right
    this.image.drawImageJava(img.raw,
        dx2 + PAD, dy2 + PAD, dx2 + PAD + 1, dy2 + PAD + 1,
        sx2 - 1, sy2 - 1, sx2, sy2);
  }

  //inside
  this.image.drawImageJava(img.raw,
      dx, dy, dx2, dy2,
      sx, sy, sx2, sy2);
};

function ImageLoader() {}

ImageLoader.prototype.load = function (images) {
  return Promise.resolve(images)
    .bind(this)
    .map(function (image) {
      return this.get(image);
    });
};

ImageLoader.prototype.get = function (filename) {
  return new Promise(function (resolve, reject) {
      new Jimp(filename, function (err) {
        if (err) { reject(err); }
        resolve(new ImageInfo(filename, this));
      });
    });
};

function ImageInfo(filename, image) {
  this.filename = filename;
  this.hash = crypto.createHash('md5').update(image.bitmap.data).digest('hex');
  this.raw = image;
  this.width = image.bitmap.width;
  this.height = image.bitmap.height;
  this.area = this.width * this.height;
  this.data = image.bitmap.data;
  this.depth = this.data.length / this.area;
  if (this.depth == 4) {
    this.hasAlphaChannel = true;
  }

  this.margin = this.computeMargins();
  this.contentWidth = this.width - this.margin.left - this.margin.right;
  this.contentHeight = this.height - this.margin.top - this.margin.bottom;
  this.contentArea = this.contentWidth * this.contentHeight;
}

ImageInfo.prototype.getScaledContentSize = function () {
  var scale = this.scale;
  var x = this.margin.left * scale | 0;
  var y = this.margin.top * scale | 0;
  var x2 = Math.ceil((this.width - this.margin.right) * scale);
  var y2 = Math.ceil((this.width - this.margin.right) * scale);
};

function isColumnTransparent(column, data, rows, cols) {
  for (var i = 0; i < rows; ++i) {
    if (data[4 * (i * cols + column) + 3] !== 0) { return false; }
  }

  return true;
}

function isRowTransparent(rowOffset, data, cols) {
  for (var i = 0; i < cols; ++i) {
    if (data[4 * (rowOffset + i) + 3] !== 0) { return false; }
  }

  return true;
}

ImageInfo.prototype.computeMargins = function() {
  var cols = this.width;
  var rows = this.height;
  var depth = this.depth;
  var data = this.data;

  var marginLeft = 0;
  var marginRight = 0;
  var marginTop = 0;
  var marginBottom = 0;

  if (depth == 4) {
    // trim alpha channel
    for (; marginLeft < cols; ++marginLeft) {
      if (!isColumnTransparent(marginLeft, data, rows, cols)) {
        break;
      }
    }

    for (; marginRight < cols; ++marginRight) {
      if (!isColumnTransparent(cols - marginRight - 1, data, rows, cols)) {
        break;
      }
    }

    for (; marginTop < rows; ++marginTop) {
      if (!isRowTransparent(marginTop * cols, data, cols)) {
        break;
      }
    }

    for (; marginBottom < rows; ++marginBottom) {
      if (!isRowTransparent((rows - marginBottom - 1) * cols, data, cols)) {
        break;
      }
    }
  }

  return {
    top: marginTop,
    right: marginRight,
    bottom: marginBottom,
    left: marginLeft
  };
};

var SHEET_MAX_SIZE = 1024;
var PAD = 2;

function getTopLeftPoint(points) {
  var minX = SHEET_MAX_SIZE;
  var minY = SHEET_MAX_SIZE;
  var index = 0;
  var n = points.length;
  for (var i = 0; i < n; ++i) {
    var pt = points[i];
    if (pt.y < minY || pt.y == minY && pt.x < minX) {
      index = i;
      minX = pt.x;
      minY = pt.y;
    }
  }

  return index;
}

function getPoint(points, x, y) {
  var n = points.length;
  for (var i = 0; i < n; ++i) {
    var pt = points[i];
    if (pt.x == x && pt.y == y) {
      return i;
    }
  }
  return -1;
}

function largestAreaFirst(a, b) {
  return b.contentArea - a.contentArea;
}

function Spriter() {
  EventEmitter.call(this);
}

Spriter.prototype = Object.create(EventEmitter.prototype);

var DEBUG = false;
Spriter.prototype.log = function () {
  if (DEBUG) {
    console.log.apply(console, arguments);
  }
};

Spriter.prototype.sprite = function (images) {
  // TODO: remove duplicates based on hash

  var spritedFiles = [];

  // handle large images
  images = images.filter(function (image) {
    if (image.contentWidth <= SHEET_MAX_SIZE || image.contentHeight <= SHEET_MAX_SIZE) {
      return true;
    }

    this.emit('sheet', [{
      x: 0,
      y: 0,
      image: image
    }]);
    spritedFiles.push(image.filename);
    return false;
  }, this);

  images.sort(largestAreaFirst);

  while (images.length) {
    this.log("new sheet");
    var sheet = [];
    var points = [{x: 0, y: 0}];
    while (points.length > 0) {
      var index = getTopLeftPoint(points);
      var pt = points[index];
      this.log(pt);
      points.splice(index, 1);
      if (pt.x >= SHEET_MAX_SIZE || pt.y >= SHEET_MAX_SIZE) {
        // TODO: this should never happen
        console.error("point is off sheet");
        continue;
      }

      var right = SHEET_MAX_SIZE + PAD;
      while (index < points.length) {
        var rightPoint = points[index];
        if (rightPoint.y == pt.y) {
          this.log("merging point", rightPoint);
          points.splice(index, 1);
        } else {
          right = rightPoint.x;
          break;
        }
      }

      var i = 0;
      var placed = false;
      while (i < images.length) {
        var image = images[i];
        var x = pt.x;
        var y = pt.y;
        var width = image.contentWidth + PAD;
        var height = image.contentHeight + PAD;
        if (x > 0) { x += PAD; width += PAD; }
        if (y > 0) { y += PAD; height += PAD; }

        if (width <= right - pt.x && height <= SHEET_MAX_SIZE + PAD - pt.y) {
          placed = true;

          this.log("placed", image.filename, pt.x, pt.y);
          images.splice(i, 1);
          sheet.push({
            x: x,
            y: y,
            image: image
          });

          spritedFiles.push(image.filename);

          var nextX = pt.x + width;
          var nextY = pt.y + height;
          this.log('   height', height);
          nextY += nextY & 0x1;
          nextX += nextX & 0x1;

          var bottomLeft = {x: pt.x, y: nextY};
          var index = getPoint(points, bottomLeft.x, bottomLeft.y);
          if (index == -1) {
            this.log("adding point", bottomLeft);
            points.push(bottomLeft);
          } else {
            points.splice(index, 1);
          }

          var topRight = {x: nextX, y: pt.y};
          if (getPoint(points, topRight.x, topRight.y) == -1) {
            this.log("adding point", topRight);
            points.push(topRight);
          }
          placed = true;

          break;
        } else {
          ++i;
        }
      }

      this.log("finished?", images.length, sheet.length);
      points.sort(leftRightTopBottomSorter);

      if (!placed) {
        var leftPoint = null;
        var rightPoint = null;
        var n = points.length;
        for (var i = 0; i < n; ++i) {
          var e = points[i];
          if (e.x < pt.x) {
            leftPoint = e;
            if (i + 1 < n) {
              rightPoint = points[i + 1];
            }
          }
        }

        if (leftPoint && rightPoint && rightPoint.y < leftPoint.y) {
          rightPoint.x = pt.x;
        }
      }
    }

    if (sheet.length > 0 ) {
      this.emit('sheet', sheet);
    }
  }
};

function leftRightTopBottomSorter(a, b) {
  if (a.x == b.x) {
    return a.y - b.y;
  } else {
    return a.x - b.x;
  }
}

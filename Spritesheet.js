var ImageBuffer = require('./ImageBuffer');

module.exports = Spritesheet;

var sheetNumber = 0;
function Spritesheet(opts) {
  this.pad = opts && opts.pad || 2;
  this.maxSize = opts && opts.maxSize || 1024;
  this._width = 0;
  this._height = 0;

  this.sprites = [];
}

function powerOfTwo(a) {
  var b = 1;
  while (b < a) {
    b = b << 1;
  }
  return b;
}

Object.defineProperties(Spritesheet.prototype, {
  'length': {
    'get': function () { return this.sprites.length; },
  },
  'width': {
    'get': function () {
      return powerOfTwo(this._width);
    }
  },
  'height': {
    'get': function () {
      return powerOfTwo(this._height);
    }
  }
});

Spritesheet.prototype.add = function (imageInfo, x, y) {
  this.sprites.push({
    info: imageInfo,
    x: x,
    y: y
  });

  if (x + imageInfo.contentWidth > this._width) {
    this._width = x + imageInfo.contentWidth;
  }

  if (y + imageInfo.contentHeight > this._height) {
    this._height = x + imageInfo.contentWidth;
  }
};

Spritesheet.prototype.composite = function () {
  this.image = new ImageBuffer({
    width: this.width,
    height: this.height
  });

  this.sprites.forEach(function (sprite) {
    this.blit(sprite.info, sprite.x, sprite.y);
  }, this);
};

Spritesheet.prototype.write = function (filename) {
  this.image.write(filename);
};

Spritesheet.prototype.blit = function (img, x, y) {
  var pad = this.pad;

  // dest params, with dx2 / dy2 being exclusive
  var dx = x;
  var dy = y;
  var dw = img.contentWidth;
  var dh = img.contentHeight;
  var dx2 = x + img.contentWidth;
  var dy2 = y + img.contentHeight;

  // source params, with sx2 / sy2 being exclusive
  var sx = img.margin.left;
  var sy = img.margin.top;
  var sw = img.contentWidth;
  var sh = img.contentHeight;
  var sx2 = sx + img.contentWidth;
  var sy2 = sy + img.contentHeight;

  for (var i = 1; i <= pad; i++) {
    // top-left
    this.image.drawImage(img.raw,
        sx, sy, 1, 1,
        dx - i, dy - i, 1, 1
      );

    // top
    this.image.drawImage(img.raw,
        sx, sy, sw, 1,
        dx, dy - i, dw, 1);

    // top-right
    this.image.drawImage(img.raw,
        sx2 - 1, sy, 1, 1,
        dx2 + i - 1, dy - i, 1, 1);

    // right
    this.image.drawImage(img.raw,
        sx2 - 1, sy, 1, sh,
        dx2 + i - 1, dy, 1, dh);

    // bottom-right
    this.image.drawImage(img.raw,
        sx2 - 1, sy2 - 1, 1, 1,
        dx2 + i - 1, dy2 + i - 1, 1, 1);

    // bottom
    this.image.drawImage(img.raw,
        sx, sy2 - 1, sw, 1,
        dx, dy2 + i - 1, dw, 1);

    // bottom-left
    this.image.drawImage(img.raw,
        sx, sy2 - 1, 1, 1,
        dx - i, dy2 + i - 1, 1, 1);

    // left
    this.image.drawImage(img.raw,
        sx, sy, 1, dh,
        dx - i, dy, 1, dh);
  }

  var xOdd = ((pad + dx2) & 0x1) !== 0;
  var yOdd = ((pad + dy2) & 0x1) !== 0;

  // extend the right side
  if (xOdd) {
    // top-right
    this.image.drawImage(img.raw,
        sx2 - 1, sy, 1, 1,
        dx2 + pad, dy - pad, 1, 1);

    // right
    this.image.drawImage(img.raw,
        sx2 - 1, sy, 1, sh,
        dx2 + pad, dy, 1, dh);
  }
  // extend the bottom
  if (yOdd) {
    // bottom
    this.image.drawImage(img.raw,
        sx, sy2 - 1, sw, 1,
        dx, dy2 + pad, dw, 1);

    // bottom-left
    this.image.drawImage(img.raw,
        sx, sy2 - 1, 1, 1,
        dx - pad, dy2 + pad, 1, 1);
  }

  // extend the bottom right
  if (yOdd && xOdd) {
    // bottom-right
    this.image.drawImage(img.raw,
        sx2 - 1, sy2 - 1, 1, 1,
        dx2 + pad, dy2 + pad, 1, 1);
  }

  // inside
  this.image.drawImage(img.raw,
      sx, sy, sw, sh,
      dx, dy, dw, dh);
};

Spritesheet.prototype.toJSON = function () {
  return {
      width: this.width,
      height: this.height,
      images: this.images.map(function (image) {
        return image.toJSON();
      })
    };
};

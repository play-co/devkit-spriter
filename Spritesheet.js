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

  for (var i = 1; i <= pad; i++) {
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

  var xOdd = ((pad + dx2) & 0x1) !== 0;
  var yOdd = ((pad + dy2) & 0x1) !== 0;

  // extend the right side
  if (xOdd) {
    //top-right
    this.image.drawImageJava(img.raw,
        dx2 + pad, dy - pad, dx2 + pad + 1, dy - pad + 1,
        sx2 - 1, sy, sx2, sy + 1);

    //right
    this.image.drawImageJava(img.raw,
        dx2 + pad, dy, dx2 + pad + 1, dy2,
        sx2 - 1, sy, sx2, sy2);

  }
  // extend the bottom
  if (yOdd) {
    //bottom
    this.image.drawImageJava(img.raw,
        dx, dy2 + pad, dx2, dy2 + pad + 1,
        sx, sy2 - 1, sx2, sy2);

    //bottom-left
    this.image.drawImageJava(img.raw,
        dx - pad, dy2 + pad, dx - pad + 1, dy2 + pad + 1,
        sx, sy2 - 1, sx + 1, sy2);
  }

  // extend the bottom right
  if (yOdd && xOdd) {
    //bottom-right
    this.image.drawImageJava(img.raw,
        dx2 + pad, dy2 + pad, dx2 + pad + 1, dy2 + pad + 1,
        sx2 - 1, sy2 - 1, sx2, sy2);
  }

  //inside
  this.image.drawImageJava(img.raw,
      dx, dy, dx2, dy2,
      sx, sy, sx2, sy2);
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

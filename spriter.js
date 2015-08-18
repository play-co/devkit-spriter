var EventEmitter = require('events').EventEmitter;
var Promise = require('bluebird');

var Spritesheet = require('./Spritesheet');

function Cache() {

}

Cache.prototype.load = function (filename) {

};

Cache.prototype.getFileHash = function (filename) {
  return this._fileHashes[filename];
};

module.exports = Spriter;

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
  var spritedFiles = [];

  // handle large images
  images = images.filter(function (image) {
    if (image.contentWidth <= SHEET_MAX_SIZE || image.contentHeight <= SHEET_MAX_SIZE) {
      return true;
    }

    var sheet = new Spritesheet().add(image, 0, 0);
    this.emit('sheet', sheet);
    spritedFiles.push(image.filename);
    return false;
  }, this);

  images.sort(largestAreaFirst);

  while (images.length) {
    this.log("new sheet");
    var sheet = new Spritesheet();
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
          sheet.add(image, x, y);
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

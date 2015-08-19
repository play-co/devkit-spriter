var Spritesheet = require('./Spritesheet');
var ImageLoader = require('./ImageLoader');

exports.Spritesheet = Spritesheet;

var SHEET_MAX_SIZE = 1024;
var PAD = 2;

exports.loadImages = function (files) {
  return new ImageLoader().load(files);
};

/**
 * @returns {Spritesheet[]}
 */
exports.sprite = function (name, images) {
  var sheets = [];
  var sheet = new Spritesheet();
  var sheetIndex = 1;

  // handle large images
  images = images.filter(function (image) {
    if (image.contentWidth <= SHEET_MAX_SIZE && image.contentHeight <= SHEET_MAX_SIZE) {
      return true;
    }

    sheets.push(new Spritesheet({name: name + sheetIndex++}).add(image, 0, 0));
    return false;
  }, this);

  images.sort(sortLargestAreaFirst);

  while (images.length) {
    var points = [{x: 0, y: 0}];
    while (points[0]) {
      var index = getTopLeftPoint(points);
      var pt = points[index];
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

          images.splice(i, 1);
          sheet.add(image, x, y);

          var nextX = pt.x + width;
          var nextY = pt.y + height;
          nextY += nextY & 0x1;
          nextX += nextX & 0x1;

          var found = getPoint(points, pt.x, nextY);
          if (found == -1) {
            points.push({x: pt.x, y: nextY});
          } else {
            points.splice(found, 1);
          }

          // top-right point
          if (nextX < SHEET_MAX_SIZE && pt.y < SHEET_MAX_SIZE && getPoint(points, nextX, pt.y) == -1) {
            points.push({x: nextX, y: pt.y});
          }
          break;
        } else {
          ++i;
        }
      }

      points.sort(sortLeftRightTopBottom);

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
      sheet.name = name + sheetIndex++;
      sheets.push(sheet);
      sheet = new Spritesheet();
    }
  }

  return sheets;
};

function sortLargestAreaFirst(a, b) {
  return b.contentArea - a.contentArea;
}

function sortLeftRightTopBottom(a, b) {
  if (a.x == b.x) {
    return a.y - b.y;
  } else {
    return a.x - b.x;
  }
}

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

var Spritesheet = require('./Spritesheet');

var DEFAULT_MAX_SIZE = 1024;
var DEFAULT_PADDING = 2;

/**
 * @returns {Spritesheet[]}
 */
module.exports = function (images, opts) {
  if (!opts) { opts = {}; }
  var maxSize = opts.maxSize !== undefined ? opts.maxSize : DEFAULT_MAX_SIZE;
  var padding = opts.padding !== undefined ? opts.padding : DEFAULT_PADDING;
  var powerOfTwoSheets = opts.powerOfTwoSheets !== undefined ? !!opts.powerOfTwoSheets : true;
  var name = opts.name || '';
  var ext = opts.ext || '';

  var sheets = [];
  var sheetIndex = 1;
  var sheet = createSpritesheet();
  var seen = {};

  function createSpritesheet() {
    return new Spritesheet({
      name: name + (sheetIndex++) + ext,
      padding: padding,
      powerOfTwoSheets: powerOfTwoSheets
    });
  }

  // handle large images
  images = images.filter(function (image) {
    if (image.contentWidth <= maxSize && image.contentHeight <= maxSize) {
      return true;
    }

    sheets.push(createSpritesheet().add(image, 0, 0));
    return false;
  }, this);

  images.sort(sortLargestAreaFirst);

  while (images.length) {
    var points = [{x: 0, y: 0}];
    while (points[0]) {
      var index = getTopLeftPoint(points);
      var pt = points[index];
      points.splice(index, 1);
      if (pt.x >= maxSize || pt.y >= maxSize) {
        continue;
      }

      var right = maxSize + padding;
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
        var width = image.contentWidth + padding;
        var height = image.contentHeight + padding;
        if (x > 0) { x += padding; width += padding; }
        if (y > 0) { y += padding; height += padding; }

        if (seen[image.hash]) {
          var seenInfo = seen[image.hash];
          seenInfo.sheet.addDuplicate(image, seenInfo.image);
          images.splice(i, 1);
          continue;
        }

        if (width <= right - pt.x && height <= maxSize + padding - pt.y) {
          placed = true;

          images.splice(i, 1);
          sheet.add(image, x, y);
          seen[image.hash] = {
            image: image,
            sheet: sheet
          };

          var nextX = pt.x + width;
          var nextY = pt.y + height;
          nextY += nextY & 0x1;
          nextX += nextX & 0x1;

          // bottom-left point
          var found = addPoint(pt.x, nextY);
          if (found > -1) {
            points.splice(found, 1);
          }

          // top-right point
          if (nextX < maxSize && pt.y < maxSize) {
            addPoint(nextX, pt.y);
          }
          break;
        } else {
          ++i;
        }
      }

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
      sheets.push(sheet);
      sheet = createSpritesheet();
    }
  }

  return sheets;

  // returns index of found point, or inserts the point and returns -1
  function addPoint(x, y) {
    var i = points.length;
    var insertAt = i;
    while (i-- > 0) {
      var pt = points[i];
      if (pt.x == x && pt.y == y) {
        return i;
      }

      // find the insertion index such that the array is sorted left-to-right,
      // top-to-bottom
      if (x < pt.x || x == pt.x && y < pt.y) {
        insertAt = i;
      }
    }

    points.splice(insertAt, 0, {x: x, y: y});
    return -1;
  }
};

function sortLargestAreaFirst(a, b) {
  return b.contentArea - a.contentArea;
}

function getTopLeftPoint(points) {
  var index = 0;
  var minX = points[0].x;
  var minY = points[0].y;

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

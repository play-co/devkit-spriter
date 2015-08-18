var fs = require('graceful-fs');
var Promise = require('bluebird');
var Spriter = require('./spriter').Spriter;
var ImageLoader = require('./spriter').ImageLoader;
var SheetWriter = require('./spriter').SheetWriter;

var filenames = fs.readdirSync('.').filter(function (img) {
  return /\.(png|jpg|bmp)/i.test(img);
});

var startLoad = Date.now();
new ImageLoader()
  .load(filenames)
  .then(function (images) {

    var hash = {};
    images = images.filter(function (image) {
      if (image.hash in hash) {
        return false;
      }

      hash[image.hash] = true;
      return true;
    });

    console.log("loaded", images.length, "images in", Date.now() - startLoad + 'ms');

    // require('./spriter').test(images);
    // return;
    new Spriter()
      .on('sheet', function (sheet) {
        sheetMap.add(sheet);
        new SheetWriter(sheet);
      })
      .sprite(images);

    console.log("sprited", Date.now() - startLoad + 'ms');
  });

function Spritesheet() {

}

Spritesheet.prototype.toJSON = function () {
  return {
      width: this.width,
      height: this.height,
      images: this.images.map(function (image) {
        return {
          x: image.x,
          y: image.y,
          w: image.width,
          h: image.height,
          t: image.margin.top || undefined,
          l: image.margin.left || undefined,
          b: image.margin.bottom || undefined,
          r: image.margin.right || undefined,
          s: !image.scale || image.scale == 1 ? undefined : image.scale,
          g: image.group || undefined, // TODO: groups?
        };
      })
    };
};

function Spritesheets() {
  this._sheets = [];
}

Spritesheets.prototype.toJSON = function () {
  var res = {};
  this._sheets.forEach(function (sheet) {
    res[sheet.name] = sheet.toJSON();
  });
  return res;
};

/*

            spriteObject.put("x", si.x);
            spriteObject.put("y", si.y);
            spriteObject.put("w", scale(si.processedImage.width, si.processedImage.scale));
            spriteObject.put("h", scale(si.processedImage.height, si.processedImage.scale));
            spriteObject.put("scale", si.processedImage.scale);
            spriteObject.put("marginTop", scale(si.processedImage.y, si.processedImage.scale));
            spriteObject.put("marginLeft", scale(si.processedImage.x, si.processedImage.scale));
            spriteObject.put("marginBottom", scale(si.processedImage.originalHeight - si.processedImage.height - si.processedImage.y, si.processedImage.scale));
            spriteObject.put("marginRight", scale(si.processedImage.originalWidth - si.processedImage.width - si.processedImage.x, si.processedImage.scale));
            spriteObject.put("group", sheet.group);
            spriteObject.put("sheet", sheet.filename);
            JSONArray sheetSizeJson = new JSONArray();
            sheetSizeJson.put(sheet.width);
            sheetSizeJson.put(sheet.height);
            spriteObject.put("sheetSize", sheetSizeJson);
            mapJson.put(path, spriteObject);

*/

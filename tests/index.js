var fs = require('graceful-fs');
var Promise = require('bluebird');
var devkitSpriter = require('../index.js');

var filenames = fs.readdirSync('.').filter(function (img) {
  return /\.(png|jpg|bmp)/i.test(img);
});

var startLoad = Date.now();
var spritesheets = new Spritesheets();
var sheetNumber = 0;


devkitSpriter.loadImages(filenames).then(function (res) {
  var hash = {};
  var images = res.images.filter(function (image) {
    if (image.hash in hash) {
      return false;
    }

    hash[image.hash] = true;
    return true;
  })

  console.log('loaded', images.length, 'images in', Date.now() - startLoad + 'ms');

  return devkitSpriter.sprite(images);
}).map(function (sheet) {
  spritesheets.push(sheet);
  sheet.name = 'spritetest-' + sheetNumber++;
  sheet.composite();
  sheet.write('spritesheets/' + sheet.name + '.png')
    .then(function () {
      sheet.recycle();
      sheet.recycleSprites();
    });
}).then(function () {
  console.log(JSON.stringify(spritesheets));

  console.log('sprited', Date.now() - startLoad + 'ms');
});

function Spritesheets() {
  this._sheets = [];
}

Spritesheets.prototype.push = function (sheet) {
  this._sheets.push(sheet);
};

Spritesheets.prototype.toJSON = function () {
  var res = {};
  this._sheets.forEach(function (sheet) {
    res[sheet.name] = sheet.toJSON();
  });
  return res;
};

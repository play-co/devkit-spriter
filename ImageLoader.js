var ImageBuffer = require('./ImageBuffer');
var ImageInfo = require('./ImageInfo');
var Promise = require('bluebird');

module.exports = ImageLoader;

function ImageLoader() {}

ImageLoader.prototype.load = function (images) {
  return Promise.resolve(images)
    .bind(this)
    .map(function (image) {
      return this.get(image);
    });
};

ImageLoader.prototype.get = function (filename) {
  return new ImageBuffer({filename: filename})
    .load()
    .then(function () {
      return new ImageInfo(filename, this);
    });
};

var ImageBuffer = require('./ImageBuffer');
var ImageInfo = require('./ImageInfo');
var Promise = require('bluebird');

module.exports = ImageLoader;

function ImageLoader() {}

ImageLoader.prototype.load = function (images) {
  return Promise.resolve(images)
    .bind(this)
    .map(function (image) {
      return this.get(typeof image == 'string' ? image : image && image.path);
    });
};

ImageLoader.prototype.get = function (filename) {
  return new ImageBuffer({filename: filename})
    .load()
    .then(function (buffer) {
      return new ImageInfo(filename, buffer);
    });
};

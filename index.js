var DiskCache = require('./DiskCache');
var ImageLoader = require('./ImageLoader');
var layout = require('./layout');

exports.loadImages = function (files) {
  return new ImageLoader().load(files);
};

/**
 * @returns {Spritesheet[]}
 */
exports.sprite = layout;


exports.loadCache = function (cacheFile, outputDirectory) {
  return DiskCache.load(cacheFile, outputDirectory);
};

exports.NotCachedError = DiskCache.NotCachedError;

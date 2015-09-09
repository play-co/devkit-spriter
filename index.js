var DiskCache = require('./DiskCache');
var ImageLoader = require('./ImageLoader');
var layout = require('./layout');

exports.loadImages = function (files, scale) {
  return new ImageLoader().load(files, scale);
};

/**
 * @returns {Spritesheet[]}
 */
exports.sprite = layout;


exports.loadCache = function (cacheFile, outputDirectory) {
  return DiskCache.load(cacheFile, outputDirectory);
};

exports.NotCachedError = DiskCache.NotCachedError;

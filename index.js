
var ImageLoader = require('./ImageLoader');
var layout = require('./layout');

exports.loadImages = function (files) {
  return new ImageLoader().load(files);
};

/**
 * @returns {Spritesheet[]}
 */
exports.sprite = layout;

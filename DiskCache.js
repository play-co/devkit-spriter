var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('graceful-fs'));

module.exports = DiskCache;

function DiskCache(filename, data, outputDirectory) {
  this._filename = filename;
  this._data = data;
  this._outputDirectory = outputDirectory;
}

DiskCache.load = function (filename, outputDirectory) {
  return fs.readFileAsync(filename, 'utf-8')
    .then(function (contents) {
      return JSON.parse(contents);
    })
    .catch(function () {
      return {};
    })
    .then(function (data) {
      return new DiskCache(filename, data, outputDirectory);
    });
};

DiskCache.prototype.get = function (key, filenames) {
  var cache = this._data[key];
  var isCached = true;
  if (!cache) {
    cache = this._data[key] = {
      mtime: {}
    };
  }

  return Promise
    .resolve(filenames)
    .map(function (filename) {
      var cachedMtime = cache.mtime[filename] || 0;
      return fs.statAsync(filename)
        .then(function (stat) {
          var mtime = stat.mtime.getTime();
          if (mtime > cachedMtime) {
            isCached = false;
            cache.mtime[filename] = mtime;
          }
        });
    })
    .then(function () {
      if (isCached) {
        return cache.value;
      } else {
        throw new Error("not cached");
      }
    });
};

DiskCache.prototype.set = function (key, value) {
  var cache = this._data[key];
  cache.value = value;
};

DiskCache.prototype.save = function () {
  return fs.writeFileAsync(this._filename, JSON.stringify(this._data));
};

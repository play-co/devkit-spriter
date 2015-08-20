var Promise = require('bluebird');
var path = require('path');
var fs = require('graceful-fs');

var exists = function (filename) {
  return new Promise(function (resolve, reject) {
    fs.exists(filename, function (exists) {
      if (exists) {
        resolve();
      } else {
        reject();
      }
    });
  });
};

var readFile = Promise.promisify(fs.readFile);
var writeFile = Promise.promisify(fs.writeFile);
var stat = Promise.promisify(fs.stat);

module.exports = DiskCache;
module.exports.NotCachedError = NotCachedError;
module.exports.load = function (filename, outputDirectory) {
  return readFile(filename, 'utf-8')
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

function NotCachedError() { this.message = 'not cached'; }
NotCachedError.prototype = Object.create(Error.prototype);
NotCachedError.prototype.constructor = NotCachedError;

function DiskCache(filename, data, outputDirectory) {
  this._filename = filename;
  this._data = data;
  this._outputDirectory = outputDirectory;
}

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
    .bind(this)
    .map(function (filename) {
      var cachedMtime = cache.mtime[filename] || 0;
      return stat(filename)
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
        throw new NotCachedError();
      }
    })
    .map(function (sheet) {
      if (!sheet || !sheet.name) {
        throw new NotCachedError();
      }

      // for the destination files, just check that each file exists
      var filename = path.join(this._outputDirectory, sheet.name);
      return exists(filename)
        .catch(function () {
          console.log(sheet.name, 'does not exist');
          throw new NotCachedError();
        });
    })
    .then(function () {
      return cache.value;
    });
};

DiskCache.prototype.set = function (key, value) {
  var cache = this._data[key];
  if (cache) {
    cache.value = value;
  }
};

DiskCache.prototype.remove = function (key) {
  delete this._data[key];
};

DiskCache.prototype.save = function () {
  return writeFile(this._filename, JSON.stringify(this._data));
};

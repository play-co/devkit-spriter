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
  if (!cache) {
    cache = this._data[key] = {
      mtime: {}
    };
  }

  var currentMtime = {};
  return Promise
    .resolve(filenames)
    .bind(this)
    .map(function (filename) {
      // compute all new mtimes
      return stat(filename)
        .then(function (stat) {
          currentMtime[filename] = stat.mtime.getTime();
        });
    })
    .then(function () {
      // set cache to current mtimes, when cache gets written it will have the
      // lastest values
      var previousMtime = cache.mtime;
      cache.mtime = currentMtime;

      // validate no new files were added to the group since the last spriting
      for (var filename in currentMtime) {
        if (!(filename in previousMtime)) {
          throw new NotCachedError();
        } else {
          delete previousMtime[filename];
        }
      }

      // validate no files were removed from the group since the last spriting
      for (var key in previousMtime) {
        throw new NotCachedError();
      }

      var sheets = cache.value;
      var outputDirectory = this._outputDirectory;
      return Promise.map(sheets, function (sheet) {
          // validate sheet has a name and sprites
          if (!sheet || !sheet.name || !sheet.sprites) {
            throw new NotCachedError();
          }

          // validate sheet sprites are in the mtime hash
          sheet.sprites.forEach(function (info) {
            if (!info.f || !(info.f in cache.mtime)) {
              throw new NotCachedError();
            }
          });

          // validate sheet exists
          return exists(path.join(outputDirectory, sheet.name))
            .catch(function (e) {
              throw new NotCachedError();
            });
        });
    })
    .then(function () {
      return JSON.parse(JSON.stringify(cache.value));
    });
};

DiskCache.prototype.set = function (key, value) {
  var cache = this._data[key];
  if (cache) {
    cache.value = JSON.parse(JSON.stringify(value));
  }
};

DiskCache.prototype.remove = function (key) {
  delete this._data[key];
};

DiskCache.prototype.save = function () {
  return writeFile(this._filename, JSON.stringify(this._data));
};

'use strict';

const Duplex = require('readable-stream').Duplex;
const util = require('util');

// Inherit of Duplex stream
util.inherits(BufferStream, Duplex);

// Constructor
function BufferStream(options, cb) {
  const _this = this;

  // Ensure new were used
  if (!(_this instanceof BufferStream)) {
    return new BufferStream(options, cb);
  }

  // Cast args
  if (options instanceof Function) {
    cb = options;
    options = {};
  }
  options = options || {};
  if (!(cb instanceof Function)) {
    throw new Error('The given callback must be a function.');
  }
  _this.__objectMode = options.objectMode;

  // Parent constructor
  Duplex.call(_this, options);

  // Keep a reference to the callback
  _this._cb = cb;

  // Add a finished flag
  _this._bufferStreamFinished = false;

  // Internal buffer
  _this._bufferStreamBuffer = [];

  // Internal logic
  function _bufferStreamCallbackWrapper(err) {
    const buffer = options.objectMode
      ? _this._bufferStreamBuffer
      : Buffer.concat(_this._bufferStreamBuffer);

    err = err || null;
    _this._cb(err, buffer, (err2, buf) => {
      setImmediate(() => {
        _this.removeListener('error', _bufferStreamError);
        if (err2) {
          _this.emit('error', err2);
        }
        _this._bufferStreamBuffer = options.objectMode ? buf || [] : [buf];
        _this._bufferStreamFinished = true;
        _this._read();
      });
    });
  }

  function _bufferStreamError(err) {
    if (_this._bufferStreamFinished) {
      return;
    }
    _bufferStreamCallbackWrapper(err);
  }

  _this.once('finish', _bufferStreamCallbackWrapper);

  _this.on('error', _bufferStreamError);
}

BufferStream.prototype._write = function _bufferStreamWrite(
  chunk,
  encoding,
  done
) {
  this._bufferStreamBuffer.push(chunk);
  done();
};

BufferStream.prototype._read = function _bufferStreamRead() {
  const _this = this;

  if (_this._bufferStreamFinished) {
    while (_this._bufferStreamBuffer.length) {
      if (!_this.push(_this._bufferStreamBuffer.shift())) {
        break;
      }
    }
    if (0 === _this._bufferStreamBuffer.length) {
      _this.push(null);
    }
  }
};

module.exports = BufferStream;

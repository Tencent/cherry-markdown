const isStream = require('isstream');
const Stream = require('readable-stream');
const util = require('util');

// Inherit of Duplex stream
util.inherits(Duplexer, Stream.Duplex);

// Constructor
function Duplexer(options, writableStream, readableStream) {
  const _this = this;

  // Ensure new were used
  if (!(this instanceof Duplexer)) {
    return new (Duplexer.bind.apply(
      Duplexer, // eslint-disable-line
      [Duplexer].concat([].slice.call(arguments, 0))
    ))();
  }

  // Mapping args
  if (isStream(options)) {
    readableStream = writableStream;
    writableStream = options;
    options = {};
  } else {
    options = options || {};
  }
  this._reemitErrors =
    'boolean' === typeof options.reemitErrors ? options.reemitErrors : true;
  delete options.reemitErrors;

  // Checking arguments
  if (!isStream(writableStream, 'Writable', 'Duplex')) {
    throw new Error(
      'The writable stream must be an instanceof Writable or Duplex.'
    );
  }
  if (!isStream(readableStream, 'Readable')) {
    throw new Error('The readable stream must be an instanceof Readable.');
  }

  // Parent constructor
  Stream.Duplex.call(this, options);

  // Save streams refs
  this._writable = writableStream;
  this._readable = readableStream;

  // Internal state
  this._waitDatas = false;
  this._hasDatas = false;

  if ('undefined' == typeof this._readable._readableState) {
    this._readable = new Stream.Readable({
      objectMode: options.objectMode || false,
    }).wrap(this._readable);
  }

  if (this._reemitErrors) {
    this._writable.on('error', err => {
      _this.emit('error', err);
    });
    this._readable.on('error', err => {
      _this.emit('error', err);
    });
  }

  this._writable.on('drain', () => {
    _this.emit('drain');
  });

  this.once('finish', () => {
    _this._writable.end();
  });

  this._writable.once('finish', () => {
    _this.end();
  });

  this._readable.on('readable', () => {
    _this._hasDatas = true;
    if (_this._waitDatas) {
      _this._pushAll();
    }
  });

  this._readable.once('end', () => {
    _this.push(null);
  });
}

Duplexer.prototype._read = function _plexerRead() {
  this._waitDatas = true;
  if (this._hasDatas) {
    this._pushAll();
  }
};

Duplexer.prototype._pushAll = function _plexerPushAll() {
  const _this = this;
  let chunk;

  do {
    chunk = _this._readable.read();
    if (null !== chunk) {
      this._waitDatas = _this.push(chunk);
    }
    this._hasDatas = null !== chunk;
  } while (this._waitDatas && this._hasDatas);
};

Duplexer.prototype._write = function _plexerWrite(chunk, encoding, callback) {
  return this._writable.write(chunk, encoding, callback);
};

Duplexer.obj = function _plexerObj(options) {
  const firstArgumentIsAStream = isStream(options);
  const streams = [].slice.call(arguments, firstArgumentIsAStream ? 0 : 1);

  options = firstArgumentIsAStream ? {} : options;
  options.objectMode = true;
  return Duplexer.apply({}.undef, [options].concat(streams));
};

module.exports = Duplexer;

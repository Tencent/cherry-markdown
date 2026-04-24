'use strict';

const stream = require('readable-stream');
const util = require('util');

/**
 * Filter piped in streams according to the given `filterCallback` that takes the
 *  following arguments: `chunk` the actual chunk, `encoding` the chunk encoding,
 *  filterResultCallback` the function to call as the result of the filtering
 * process with `true` in argument to filter her or `false` otherwise.
 *
 * Options are passed in as is in the various stream instances spawned by this
 *  module. So, to use the objectMode, simply pass in the `options.objectMode`
 *  value set to `true`.
 * @param {Function} filterCallback    Callback applying the filters
 * @param {Object} options           Filtering options
 * @param {boolean} options.passthrough
 * Set to `true`, this option change the restore stream nature from a readable
 *  stream to a passthrough one, allowing you to reuse the filtered chunks in an
 *  existing pipeline.
 * @param {boolean} options.restore
 * Set to `true`, this option create a readable stream allowing you to use the
 *  filtered chunks elsewhere. The restore stream is exposed in the `FilterStream`
 *  instance as a `restore` named property.
 * @returns {Stream}                 The filtering stream
 */
function StreamFilter(filterCallback, options) {
  const _this = this;

  // Ensure new is called
  if (!(this instanceof StreamFilter)) {
    return new StreamFilter(filterCallback, options);
  }

  // filter callback is required
  if (!(filterCallback instanceof Function)) {
    throw new Error('filterCallback must be a function.');
  }

  // Manage options
  options = options || {};
  options.restore = options.restore || false;
  options.passthrough = (options.restore && options.passthrough) || false;

  this._filterStreamEnded = false;
  this._restoreStreamCallback = null;

  this._transform = function streamFilterTransform(chunk, encoding, done) {
    filterCallback(chunk, encoding, function StreamFilterCallback(filter) {
      if (!filter) {
        _this.push(chunk, encoding);
        done();
        return;
      }
      if (options.restore) {
        _this._restoreManager.programPush(chunk, encoding, () => {
          done();
        });
        return;
      }
      done();
    });
  };

  this._flush = function streamFilterFlush(done) {
    this._filterStreamEnded = true;
    done(); // eslint-disable-line
    if (options.restore) {
      if (!options.passthrough) {
        this._restoreManager.programPush(null, {}.undef, () => {
          done();
        });
      } else if (this._restoreStreamCallback) {
        this._restoreStreamCallback();
      }
    }
  };

  stream.Transform.call(this, options);

  // Creating the restored stream if necessary
  if (options.restore) {
    if (options.passthrough) {
      this.restore = new stream.Duplex(options);
      this._restoreManager = createReadStreamBackpressureManager(this.restore);
      this.restore._write = function streamFilterRestoreWrite(
        chunk,
        encoding,
        done
      ) {
        _this._restoreManager.programPush(chunk, encoding, done);
      };

      this.restore.on('finish', function streamFilterRestoreFinish() {
        _this._restoreStreamCallback = () => {
          _this._restoreManager.programPush(null, {}.undef, () => {});
        };
        if (_this._filterStreamEnded) {
          _this._restoreStreamCallback();
        }
      });
    } else {
      this.restore = new stream.Readable(options);
      this._restoreManager = createReadStreamBackpressureManager(this.restore);
    }
  }
}

util.inherits(StreamFilter, stream.Transform);

// Utils to manage readable stream backpressure
function createReadStreamBackpressureManager(readableStream) {
  const manager = {
    waitPush: true,
    programmedPushs: [],
    programPush: function programPush(chunk, encoding, done) {
      // Store the current write
      manager.programmedPushs.push([chunk, encoding, done]);
      // Need to be async to avoid nested push attempts
      // Programm a push attempt
      setImmediate(manager.attemptPush);
      // Let's say we're ready for a read
      readableStream.emit('readable');
      readableStream.emit('drain');
    },
    attemptPush: function attemptPush() {
      let nextPush;

      if (manager.waitPush) {
        if (manager.programmedPushs.length) {
          nextPush = manager.programmedPushs.shift();
          manager.waitPush = readableStream.push(nextPush[0], nextPush[1]);
          nextPush[2]();
        }
      } else {
        setImmediate(() => {
          // Need to be async to avoid nested push attempts
          readableStream.emit('readable');
        });
      }
    },
  };

  // Patch the readable stream to manage reads
  readableStream._read = function streamFilterRestoreRead() {
    manager.waitPush = true;
    // Need to be async to avoid nested push attempts
    setImmediate(manager.attemptPush);
  };

  return manager;
}

module.exports = StreamFilter;

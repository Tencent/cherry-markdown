'use strict';

const path = require('path');
const Stream = require('readable-stream');
const gutil = require('gulp-util');
const BufferStreams = require('bufferstreams');
const svg2ttf = require('svg2ttf');

const PLUGIN_NAME = 'gulp-svg2ttf';

// File level transform function
function svg2ttfTransform(options) {
  // Return a callback function handling the buffered content
  return function svg2ttfTransformCb(err, buf, cb) {

    // Handle any error
    if(err) {
      cb(new gutil.PluginError(PLUGIN_NAME, err, { showStack: true }));
      return;
    }

    // Use the buffered content
    try {
      buf = Buffer.from(svg2ttf(String(buf), {
        ts: options.timestamp,
        copyright: options.copyright,
        version: options.version,
      }).buffer);
    } catch (err2) {
      cb(new gutil.PluginError(PLUGIN_NAME, err2, { showStack: true }));
      return;
    }
    cb(null, buf);
  };
}

// Plugin function
function svg2ttfGulp(options) {
  const stream = new Stream.Transform({ objectMode: true });

  options = options || {};
  options.ignoreExt = options.ignoreExt || false;
  options.clone = options.clone || false;
  options.timestamp = 'number' === typeof options.timestamp ?
    options.timestamp :
    {}.undef;
  options.copyright = 'string' === typeof options.copyright ?
    options.copyright :
    {}.undef;

  stream._transform = function svg2ttfTransformStream(file, unused, done) {
    let cntStream;
    let newFile;

    // When null just pass through
    if(file.isNull()) {
      stream.push(file); done();
      return;
    }

    // If the ext doesn't match, pass it through
    if((!options.ignoreExt) && '.svg' !== path.extname(file.path)) {
      stream.push(file); done();
      return;
    }

    // Fix for the vinyl clone method...
    // https://github.com/wearefractal/vinyl/pull/9
    if(options.clone) {
      if(file.isBuffer()) {
        stream.push(file.clone());
      } else {
        cntStream = file.contents;
        file.contents = null;
        newFile = file.clone();
        file.contents = cntStream.pipe(new Stream.PassThrough());
        newFile.contents = cntStream.pipe(new Stream.PassThrough());
        stream.push(newFile);
      }
    }

    file.path = gutil.replaceExtension(file.path, '.ttf');

    // Buffers
    if(file.isBuffer()) {
      try {
        file.contents = Buffer.from(svg2ttf(String(file.contents), {
          ts: options.timestamp,
          copyright: options.copyright,
          version: options.version,
        }).buffer);
      } catch (err) {
        stream.emit('error',
          new gutil.PluginError(PLUGIN_NAME, err, { showStack: true }));
      }

    // Streams
    } else {
      file.contents = file.contents.pipe(new BufferStreams(svg2ttfTransform(options)));
    }

    stream.push(file);
    done();
  };

  return stream;

}

// Export the file level transform function for other plugins usage
svg2ttfGulp.fileTransform = svg2ttfTransform;

// Export the plugin main function
module.exports = svg2ttfGulp;

'use strict';

var path = require('path');
var Stream = require('readable-stream');
var BufferStreams = require('bufferstreams');
var ttf2woff2 = require('ttf2woff2');
var PluginError = require('plugin-error');
var replaceExtension = require('replace-ext');

var PLUGIN_NAME = 'gulp-ttf2woff2';

// File level transform function
function ttf2woff2Transform() {
  // Return a callback function handling the buffered content
  return function ttf2woff2TransformCb(err, buf, cb) {

    // Handle any error
    if(err) {
      return cb(new PluginError(PLUGIN_NAME, err, { showStack: true }));
    }

    // Use the buffered content
    try {
      buf = ttf2woff2(buf);
      return cb(null, buf);
    } catch(err2) {
      return cb(new PluginError(PLUGIN_NAME, err2, { showStack: true }));
    }

  };
}

// Plugin function
function ttf2woff2Gulp(options) {
  var stream = new Stream.Transform({ objectMode: true });

  options = options || {};
  options.ignoreExt = options.ignoreExt || false;
  options.clone = options.clone || false;

  stream._transform = function ttf2woff2GulpTransform(file, unused, done) {
    var cntStream;
    var newFile;

     // When null just pass through
    if(file.isNull()) {
      stream.push(file); done();
      return;
    }

    // If the ext doesn't match, pass it through
    if((!options.ignoreExt) && '.ttf' !== path.extname(file.path)) {
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

    file.path = replaceExtension(file.path, '.woff2');

    // Buffers
    if(file.isBuffer()) {
      try {
        file.contents = ttf2woff2(file.contents);
      } catch(err) {
        stream.emit('error', new PluginError(PLUGIN_NAME, err, {
          showStack: true,
        }));
      }

    // Streams
    } else {
      file.contents = file.contents.pipe(new BufferStreams(ttf2woff2Transform()));
    }

    stream.push(file);
    done();

  };

  return stream;

}

// Export the file level transform function for other plugins usage
ttf2woff2Gulp.fileTransform = ttf2woff2Transform;

// Export the plugin main function
module.exports = ttf2woff2Gulp;

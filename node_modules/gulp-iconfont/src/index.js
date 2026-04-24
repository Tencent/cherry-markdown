'use strict';

const multipipe = require('multipipe');
const svgicons2svgfont = require('gulp-svgicons2svgfont');
const filter = require('streamfilter');
const spawn = require('gulp-spawn');
const svg2ttf = require('gulp-svg2ttf');

function gulpFontIcon(options) {
  options = options || {};
  options.formats = options.formats || ['ttf', 'eot', 'woff'];
  options.clone = -1 !== options.formats.indexOf('svg');
  options.timestamp = options.timestamp || Math.round(Date.now() / 1000);
  // Generating SVG font and saving her
  // Generating TTF font and saving it
  const svgicons2svgfontStream = svgicons2svgfont(options);
  const result = multipipe([
    svgicons2svgfontStream,
    svg2ttf(options),
    !!options.autohint && (() => {
      const hintPath = 'string' === typeof options.autohint ? options.autohint : 'ttfautohint';
      const nonTTFfilter = filter((file, unused, cb) => {
        cb(file.path.indexOf('.ttf') !== file.path.length - 4);
      }, {
        objectMode: true,
        restore: true,
        passthrough: true,
      });

      return multipipe(
        nonTTFfilter,
        spawn({
          cmd: '/bin/sh',
          args: [
            '-c',
            `cat | "${hintPath}" --symbol --fallback-script=latn` +
            ' --windows-compatibility --no-info /dev/stdin /dev/stdout | cat',
          ],
        }),
        nonTTFfilter.restore
      );
    })(),
    -1 !== options.formats.indexOf('eot') && require('gulp-ttf2eot')({ clone: true }),
    -1 !== options.formats.indexOf('woff') && require('gulp-ttf2woff')({ clone: true }),
    -1 !== options.formats.indexOf('woff2') && require('gulp-ttf2woff2')({ clone: true }),
    -1 === options.formats.indexOf('ttf') && filter((file, unused, cb) => {
      cb(file.path.indexOf('.ttf') === file.path.length - 4);
    }, {
      objectMode: true,
      passthrough: true,
    }),
  ].filter(x => x));

  // Re-emit codepoint mapping event
  svgicons2svgfontStream.on('glyphs', glyphs => {
    result.emit('glyphs', glyphs, options);
  });

  return result;
}

module.exports = gulpFontIcon;

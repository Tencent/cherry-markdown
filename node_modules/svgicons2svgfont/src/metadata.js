/* eslint-disable prefer-template,newline-per-chained-call,complexity */
'use strict';

const path = require('path');
const fs = require('fs');

require('string.fromcodepoint');
require('string.prototype.codepointat');

function getMetadataService(options = {}) {
  let usedUnicodes = [];

  // Default options
  options.prependUnicode = !!options.prependUnicode;
  options.startUnicode =
    'number' === typeof options.startUnicode ? options.startUnicode : 0xea01;
  options.log = options.log || console.log; // eslint-disable-line
  options.err = options.err || console.err; // eslint-disable-line

  // Throw on old options usage
  if ('undefined' !== typeof options.appendUnicode) {
    throw new Error(
      'The "appendUnicode" option was renamed "prependUnicode".' +
        ' See https://github.com/nfroidure/gulp-svgicons2svgfont/issues/33'
    );
  }

  return function getMetadataFromFile(file, cb) {
    const basename = path.basename(file);
    const metadata = {
      path: file,
      name: '',
      unicode: [],
      renamed: false,
    };
    const matches = basename.match(/^(?:((?:u[0-9a-f]{4,6},?)+)-)?(.+)\.svg$/i);

    metadata.name =
      matches && matches[2] ? matches[2] : 'icon' + options.startUnicode;
    if (matches && matches[1]) {
      metadata.unicode = matches[1].split(',').map(match => {
        match = match.substr(1);
        return match
          .split('u')
          .map(code => String.fromCodePoint(parseInt(code, 16)))
          .join('');
      });
      if (-1 !== usedUnicodes.indexOf(metadata.unicode[0])) {
        cb(
          new Error(
            'The unicode codepoint of the glyph ' +
              metadata.name +
              ' seems to be already used by another glyph.'
          )
        );
        return;
      }
      usedUnicodes.push(...metadata.unicode);
    } else {
      do {
        metadata.unicode[0] = String.fromCodePoint(options.startUnicode++);
      } while (usedUnicodes.includes(metadata.unicode[0]));
      usedUnicodes.push(metadata.unicode[0]);
      if (options.prependUnicode) {
        metadata.renamed = true;
        metadata.path = path.join(
          path.dirname(file),
          'u' +
            metadata.unicode[0]
              .codePointAt(0)
              .toString(16)
              .toUpperCase() +
            '-' +
            basename
        );
        fs.rename(file, metadata.path, err => {
          if (err) {
            cb(
              new Error(
                'Could not save codepoint: ' +
                  'u' +
                  metadata.unicode[0]
                    .codePointAt(0)
                    .toString(16)
                    .toUpperCase() +
                  ' for ' +
                  basename
              )
            );
            return;
          }
          cb(null, metadata);
        });
      }
    }
    if (!metadata.renamed) {
      setImmediate(() => cb(null, metadata));
    }
  };
}

module.exports = getMetadataService;

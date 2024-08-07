const async = require('async');
const gulp = require('gulp');
const iconfont = require('gulp-iconfont');
const rename = require('gulp-rename');
const fs = require('fs');
const path = require('path');
const consolidate = require('gulp-consolidate');
const runTimestamp = Math.round(Date.now() / 1000);

gulp.task('default', function (done) {
  let lastUnicode = 0xea01; // 59905

  // Read source directory and sort by name
  const files = fs.readdirSync('src/sass/icons');

  // Filter files with containing unicode value
  // and set last unicode
  files.forEach(function (file) {
    const basename = path.basename(file);
    const matches = basename.match(/^(?:((?:u[0-9a-f]{4,6},?)+)-)?(.+)\.svg$/i);
    let currentCode = -1;

    if (matches && matches[1]) {
      currentCode = parseInt(matches[1].split('u')[1], 16);
    }

    if (currentCode >= lastUnicode) {
      currentCode += 1;
      lastUnicode = currentCode;
    }
  });

  const iconStream = gulp.src(['src/sass/icons/*.svg']).pipe(
    iconfont({
      startUnicode: lastUnicode,
      fontName: 'ch-icon', // required
      prependUnicode: true, // recommended option
      formats: ['ttf', 'eot', 'woff', 'woff2', 'svg'], // default, 'woff2' and 'svg' are available
      timestamp: runTimestamp, // recommended to get consistent builds when watching files
      normalize: true,
    }),
  );

  async.parallel(
    [
      function handleGlyphs(cb) {
        iconStream.on('glyphs', function (glyphs, options) {
          gulp
            .src('src/sass/icon_template.scss')
            .pipe(
              consolidate('lodash', {
                glyphs,
                fontName: 'ch-icon',
                fontPath: './fonts/',
                className: 'ch-icon',
              }),
            )
            .pipe(
              rename(function (path) {
                path.basename = 'ch-icon';
              }),
            )
            .pipe(gulp.dest('src/sass/'))
            .on('finish', cb);
        });
      },
      function handleFonts(cb) {
        iconStream.pipe(gulp.dest('dist/fonts/')).on('finish', cb);
      },
    ],
    done,
  );
});

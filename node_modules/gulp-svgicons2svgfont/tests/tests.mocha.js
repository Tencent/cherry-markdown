/* eslint max-nested-callbacks:0, security/detect-non-literal-fs-filename:0 */

'use strict';

const fs = require('fs');
const path = require('path');

const gulp = require('gulp');
const Vinyl = require('vinyl');
const rimraf = require('rimraf');
const mkdirp = require('mkdirp');

const assert = require('assert');
const streamtest = require('streamtest');
const neatequal = require('neatequal');

const svgicons2svgfont = require('../src/index');
const defaultMetadataProvider = require('svgicons2svgfont/src/metadata');

const file2Str = (file, callback) => {
  if(file.isBuffer()) {
    // eslint-disable-next-line callback-return
    callback(file.contents.contents.toString('utf8'));
  } else {
    file.contents.pipe(streamtest.v2.toText((err2, text) => {
      if(err2) {
        throw new Error(err2);
      }
      callback(text);
    }));
  }
};

describe('gulp-svgicons2svgfont', () => {

  beforeEach((done) => {
    mkdirp(path.join(__dirname, 'results'), done);
  });

  afterEach((done) => {
    rimraf(path.join(__dirname, 'results'), done);
  });

  streamtest.versions.forEach((version) => {
    describe(`for ${version} streams`, () => {

      describe('must emit an error', () => {

        it('when a glyph is bad', (done) => {
          streamtest[version].fromObjects([new Vinyl({
            path: 'bibabelula.svg',
            contents: streamtest.v2.fromChunks(['oh', 'yeah']),
          })])
            .pipe(svgicons2svgfont({
              fontName: 'unprefixedicons',
            })
              .on('error', (err) => {
                assert.equal(
                  err.message,
                  'Non-whitespace before first tag.\nLine: 0\nColumn: 1\nChar: o'
                );
              })
              .pipe(streamtest.v2.toObjects((err) => {
                if(err) {
                  done(err);
                  return;
                }
                done();
              })));
        });

      });

      describe('with null contents', () => {

        it('should let null files pass through', (done) => {
          const file = new Vinyl({
            path: 'bibabelula.svg',
            contents: null,
          });

          streamtest[version].fromObjects([file])
            .pipe(svgicons2svgfont({
              fontName: 'cleanicons',
            }))
            .pipe(streamtest.v2.toObjects((err, files) => {
              if(err) {
                done(err);
                return;
              }
              assert.equal(files[0].path, 'bibabelula.svg');
              assert.equal(files[0].contents, null);
              assert.equal(files.length, 1);
              done();
            }));
        });

      });

      it('should let non-svg files pass through (prependUnicode)', (done) => {
        const file = new Vinyl({
          path: 'bibabelula.foo',
          contents: streamtest.v2.fromChunks(['oh', 'yeah']),
        });

        streamtest[version].fromObjects([file])
          .pipe(svgicons2svgfont({
            fontName: 'unprefixedicons',
            startUnicode: 0xE001,
            prependUnicode: true,
          }))
          .pipe(streamtest.v2.toObjects((err, files) => {
            if(err) {
              done(err);
              return;
            }
            assert.equal(files[0].path, 'bibabelula.foo');
            assert.equal(files.length, 1);
            done();
          }));
      });

      it('should let non-svg files pass through', (done) => {
        const file = new Vinyl({
          path: 'bibabelula.foo',
          contents: streamtest.v2.fromChunks(['oh', 'yeah']),
        });

        streamtest[version].fromObjects([file])
          .pipe(svgicons2svgfont({
            fontName: 'unprefixedicons',
            startUnicode: 0xE001,
          }))
          .pipe(streamtest.v2.toObjects((err, files) => {
            if(err) {
              done(err);
              return;
            }
            assert.equal(files[0].path, 'bibabelula.foo');
            assert.equal(files.length, 1);
            done();
          }));
      });

      describe('in stream mode', () => {

        it('should work with cleanicons', (done) => {
          gulp.src(
            path.join(__dirname, 'fixtures', 'cleanicons', '*.svg'),
            { buffer: false }
          )
            .pipe(svgicons2svgfont({
              fontName: 'cleanicons',
              startUnicode: 0xE001,
            }))
            .pipe(streamtest.v2.toObjects((err, files) => {
              if(err) {
                done(err);
                return;
              }
              assert.equal(files.length, 1);
              assert.equal(files[0].isStream(), true);
              file2Str(files[0], (text) => {
                assert.equal(
                  text,
                  fs.readFileSync(
                    path.join(__dirname, 'expected', 'test-cleanicons-font.svg'),
                    'utf8'
                  )
                );
                done();
              });
            }));
        });

        it('should work with the metadataProvider option', (done) => {
          gulp.src(
            path.join(__dirname, 'fixtures', 'cleanicons', '*.svg'),
            { buffer: false }
          )
            .pipe(svgicons2svgfont({
              fontName: 'cleanicons',
              metadataProvider: defaultMetadataProvider({
                startUnicode: 0xE001,
              }),
            }))
            .pipe(streamtest.v2.toObjects((err, files) => {
              if(err) {
                done(err);
                return;
              }
              assert.equal(files.length, 1);
              file2Str(files[0], (text) => {
                assert.equal(
                  text,
                  fs.readFileSync(
                    path.join(__dirname, 'expected', 'test-cleanicons-font.svg'),
                    'utf8'
                  )
                );
                done();
              });
            }));
        });

        it('should work with prefixedicons', (done) => {
          gulp.src(
            path.join(__dirname, 'fixtures', 'prefixedicons', '*.svg'),
            { buffer: false }
          )
            .pipe(svgicons2svgfont({
              fontName: 'prefixedicons',
              startUnicode: 0xE001,
            }))
            .pipe(streamtest.v2.toObjects((err, files) => {
              if(err) {
                done(err);
                return;
              }
              assert.equal(files.length, 1);
              file2Str(files[0], (text) => {
                assert.equal(
                  text,
                  fs.readFileSync(
                    path.join(__dirname, 'expected', 'test-prefixedicons-font.svg'),
                    'utf8'
                  )
                );
                done();
              });
            }));
        });

        it('should work with originalicons', (done) => {
          gulp.src(
            path.join(__dirname, 'fixtures', 'originalicons', '*.svg'),
            { buffer: false }
          )
            .pipe(svgicons2svgfont({
              fontName: 'originalicons',
            }))
            .pipe(streamtest.v2.toObjects((err, files) => {
              if(err) {
                done(err);
                return;
              }
              assert.equal(files.length, 1);
              file2Str(files[0], (text) => {
                assert.equal(
                  text,
                  fs.readFileSync(
                    path.join(__dirname, 'expected', 'test-originalicons-font.svg'),
                    'utf8'
                  )
                );
                done();
              });
            }));
        });

        describe('more', () => {

          beforeEach((done) => {
            gulp.src(path.join(__dirname, 'fixtures', 'unprefixedicons', '*.svg'))
              .pipe(gulp.dest(path.join(__dirname, 'results', 'unprefixedicons')))
              .on('error', done)
              .on('end', done);
          });

          it('should work with unprefixed icons and the prependUnicode option', (done) => {
            gulp.src(
              path.join(__dirname, 'results', 'unprefixedicons', '*.svg'),
              { buffer: false }
            )
              .pipe(svgicons2svgfont({
                fontName: 'unprefixedicons',
                prependUnicode: true,
              }))
              .pipe(streamtest.v2.toObjects((err, files) => {
                if(err) {
                  done(err);
                  return;
                }
                assert.equal(files.length, 1);
                assert.equal(files[0].isStream(), true);
                file2Str(files[0], (text) => {

                  assert.equal(
                    text,
                    fs.readFileSync(
                      path.join(__dirname, 'expected', 'test-unprefixedicons-font.svg'),
                      'utf8'
                    )
                  );
                  assert.equal(fs.existsSync(path.join(
                    __dirname, 'results', 'unprefixedicons', 'uEA01-arrow-down.svg'
                  )), true);
                  assert.equal(
                    fs.readFileSync(path.join(
                      __dirname, 'results', 'unprefixedicons',
                      'uEA01-arrow-down.svg'
                    ), 'utf8'),
                    fs.readFileSync(path.join(
                      __dirname, 'fixtures', 'unprefixedicons',
                      'arrow-down.svg'
                    ), 'utf8')
                  );
                  assert.equal(fs.existsSync(path.join(
                    __dirname, 'results', 'unprefixedicons', 'uEA02-arrow-left.svg'
                  )), true);
                  assert.equal(
                    fs.readFileSync(path.join(
                      __dirname, 'results', 'unprefixedicons',
                      'uEA02-arrow-left.svg'
                    ), 'utf8'),
                    fs.readFileSync(path.join(
                      __dirname, 'fixtures', 'unprefixedicons', 'arrow-left.svg'
                    ), 'utf8')
                  );
                  assert.equal(fs.existsSync(path.join(
                    __dirname, 'results', 'unprefixedicons', 'uEA03-arrow-right.svg'
                  )), true);
                  assert.equal(
                    fs.readFileSync(path.join(
                      __dirname, 'results', 'unprefixedicons',
                      'uEA03-arrow-right.svg'
                    ), 'utf8'),
                    fs.readFileSync(path.join(
                      __dirname, 'fixtures', 'unprefixedicons', 'arrow-right.svg'
                    ), 'utf8')
                  );
                  assert.equal(fs.existsSync(path.join(
                    __dirname, 'results', 'unprefixedicons', 'uEA04-arrow-up.svg'
                  )), true);
                  assert.equal(
                    fs.readFileSync(path.join(
                      __dirname, 'results', 'unprefixedicons',
                      'uEA04-arrow-up.svg'
                    ), 'utf8'),
                    fs.readFileSync(path.join(
                      __dirname, 'fixtures', 'unprefixedicons', 'arrow-up.svg'
                    ), 'utf8')
                  );
                  done();
                });
              }));
          });

        });

        describe('more2', () => {

          beforeEach((done) => {
            gulp.src(path.join(__dirname, 'fixtures', 'unicons', '*.svg'))
              .pipe(gulp.dest(path.join(__dirname, 'results', 'unicons')))
              .on('error', done)
              .on('end', done);
          });

          // this functionality requires caching all the glyphs so they can be sorted before outputting, which isn't
          // in the spirit of streams. In case you do have mixed, just put startUnicode in a different domain than
          // the prefixed ones.
          it.skip('should work with mixed icons and the prependUnicode option', (done) => {
            gulp.src(
              path.join(__dirname, 'results', 'unicons', '*.svg'),
              { buffer: false }
            )
              .pipe(svgicons2svgfont({
                fontName: 'unicons',
                prependUnicode: true,
                startUnicode: 0xEB01,
              }))
              .on('error', done)
              .pipe(streamtest.v2.toObjects((err, files) => {
                if(err) {
                  done(err);
                  return;
                }
                assert.equal(files.length, 1);
                assert.equal(files[0].isStream(), true);
                file2Str(files[0], (text) => {
                  assert.equal(
                    text,
                    fs.readFileSync(
                      path.join(__dirname, 'expected', 'test-unicons-font.svg'),
                      'utf8'
                    )
                  );
                  assert.equal(fs.existsSync(path.join(
                    __dirname, 'results', 'unicons', 'uEA01-twitter.svg'
                  )), true);
                  assert.equal(
                    fs.readFileSync(path.join(
                      __dirname, 'results', 'unicons',
                      'uEA01-twitter.svg'
                    ), 'utf8'),
                    fs.readFileSync(path.join(
                      __dirname, 'fixtures', 'unicons', 'uEA01-twitter.svg'
                    ), 'utf8')
                  );
                  assert.equal(fs.existsSync(path.join(
                    __dirname, 'results', 'unicons', 'uEA02-facebook.svg'
                  )), true);
                  assert.equal(
                    fs.readFileSync(path.join(
                      __dirname, 'results', 'unicons',
                      'uEA02-facebook.svg'
                    ), 'utf8'),
                    fs.readFileSync(path.join(
                      __dirname, 'fixtures', 'unicons', 'facebook.svg'
                    ), 'utf8')
                  );
                  done();
                });
              }));
          });

        });

        it('should emit an event with the codepoint mapping', (done) => {
          let codepoints;

          gulp.src(
            path.join(__dirname, 'fixtures', 'cleanicons', '*.svg'),
            { buffer: false }
          )
            .pipe(svgicons2svgfont({
              fontName: 'cleanicons',
              startUnicode: 0xE001,
            }))
            .on('glyphs', (_codepoints_) => {
              codepoints = _codepoints_;
            })
            .pipe(streamtest.v2.toObjects((err, files) => {
              if(err) {
                done(err);
                return;
              }
              assert.equal(files.length, 1);
              assert.equal(files[0].isStream(), true);
              file2Str(files[0], (text) => {
                assert(codepoints);
                neatequal(
                  codepoints,
                  JSON.parse(fs.readFileSync(
                    path.join(__dirname, 'expected', 'test-codepoints.json'),
                    'utf8'
                  ))
                );
                assert.equal(
                  text,
                  fs.readFileSync(
                    path.join(__dirname, 'expected', 'test-cleanicons-font.svg'),
                    'utf8'
                  )
                );
                done();
              });
            }));
        });

        it('should support filename change', (done) => {
          gulp.src(
            path.join(__dirname, 'fixtures', 'cleanicons', '*.svg'),
            { buffer: false }
          )
            .pipe(svgicons2svgfont({
              fontName: 'cleanicons',
              fileName: 'newName',
              startUnicode: 0xE001,
            }))
            .pipe(streamtest.v2.toObjects((err, files) => {
              if(err) {
                done(err);
                return;
              }
              assert.equal(files.length, 1);
              assert.equal(files[0].isStream(), true);
              assert(fs.statSync(__dirname, 'fixtures', 'cleanicons', 'newName.svg'));
              done();
            }));
        });

      });

      describe('in buffer mode', () => {

        it('should work with cleanicons', (done) => {
          gulp.src(
            path.join(__dirname, 'fixtures', 'cleanicons', '*.svg'),
            { buffer: true }
          )
            .pipe(svgicons2svgfont({
              fontName: 'cleanicons',
              startUnicode: 0xE001,
            }))
            .pipe(streamtest.v2.toObjects((err, files) => {
              if(err) {
                done(err);
                return;
              }
              assert.equal(files.length, 1);
              file2Str(files[0], (text) => {
                assert.equal(
                  text,
                  fs.readFileSync(path.join(__dirname, 'expected', 'test-cleanicons-font.svg'))
                );
                done();
              });
            }));
        });

        it('should work with prefixedicons', (done) => {
          gulp.src(
            path.join(__dirname, 'fixtures', 'prefixedicons', '*.svg'),
            { buffer: true }
          )
            .pipe(svgicons2svgfont({
              fontName: 'prefixedicons',
              startUnicode: 0xE001,
            }))
            .pipe(streamtest.v2.toObjects((err, files) => {
              if(err) {
                done(err);
                return;
              }
              assert.equal(files.length, 1);
              file2Str(files[0], (text) => {
                assert.equal(
                  text,
                  fs.readFileSync(path.join(__dirname, 'expected', 'test-prefixedicons-font.svg'))
                );
                done(); });
            }));
        });

        it('should work with originalicons', (done) => {
          gulp.src(
            path.join(__dirname, 'fixtures', 'originalicons', '*.svg'),
            { buffer: true }
          )
            .pipe(svgicons2svgfont({
              fontName: 'originalicons',
            }))
            .pipe(streamtest.v2.toObjects((err, files) => {
              if(err) {
                done(err);
                return;
              }
              assert.equal(files.length, 1);
              file2Str(files[0], (text) => {
                assert.equal(
                  text,
                  fs.readFileSync(path.join(__dirname, 'expected', 'test-originalicons-font.svg'))
                );
                done();
              });
            }));
        });

        it('should support filename change', (done) => {
          gulp.src(
            path.join(__dirname, 'fixtures', 'cleanicons', '*.svg'),
            { buffer: true }
          )
            .pipe(svgicons2svgfont({
              fontName: 'cleanicons',
              fileName: 'newName',
              startUnicode: 0xE001,
            }))
            .pipe(streamtest.v2.toObjects((err, files) => {
              if(err) {
                done(err);
                return;
              }
              assert.equal(files.length, 1);
              assert(fs.statSync(__dirname, 'fixtures', 'cleanicons', 'newName.svg'));
              done();
            }));
        });
      });

    });

  });


  describe('must throw error', () => {

    it('when no fontname is given', () => {
      assert.throws(() => {
        svgicons2svgfont();
      });
    });

    it('when using old options', () => {
      assert.throws(() => {
        svgicons2svgfont({
          appendUnicode: true,
        });
      });
    });

  });


});

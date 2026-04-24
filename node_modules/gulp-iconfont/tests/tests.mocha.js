'use strict';

const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const iconfont = require('../src/index');
const assert = require('assert');
const neatequal = require('neatequal');
const streamtest = require('streamtest');

const file2Buffer = (file, callback) => {
  if (file.isBuffer()) {
    // eslint-disable-next-line callback-return
    callback(file.contents);
  } else {
    file.contents.pipe(streamtest.v2.toChunks((err2, chunks) => {
      if (err2) {
        throw new Error(err2);
      }
      callback(Buffer.concat(chunks));
    }));
  }
};

function files2Buffers(files, callback) {
  const result = new Array(files.length);
  let count = 0;

  files.forEach((f, i) => {
    file2Buffer(f, text => {
      result[i] = text;
      count++;
      if (count === result.length) {
        // eslint-disable-next-line callback-return
        callback(result);
      }
    });
  });
}

describe('gulp-iconfont', () => {
  const generationTimestamp = 3;

  streamtest.versions.forEach(version => {
    describe(`for ${version} streams`, () => {

      describe('in stream mode', () => {

        it('should work', done => {


          gulp.src(path.join(__dirname, 'fixtures', 'iconsfont', '*.svg'), { buffer: false })
            .pipe(iconfont({
              fontName: 'iconsfont',
              timestamp: generationTimestamp,
            }))
            .pipe(streamtest[version].toObjects((err, files) => {
              if (err) {
                done(err);
                return;
              }
              assert.equal(files.length, 3);
              files2Buffers(files, contents => {

          assert.deepEqual(
            contents[0],
            fs.readFileSync(path.join(__dirname, 'expected', 'iconsfont.ttf'))
          );
          assert.deepEqual(
            contents[1],
            fs.readFileSync(path.join(__dirname, 'expected', 'iconsfont.woff'))
          );
          assert.deepEqual(
            contents[2],
            fs.readFileSync(path.join(__dirname, 'expected', 'iconsfont.eot'))
          );
          done(); // eslint-disable-line
        });
            }));
        });

        it('should work for only one font', done => {
          gulp.src(path.join(__dirname, 'fixtures', 'iconsfont', '*.svg'), { buffer: false })
            .pipe(iconfont({
              fontName: 'iconsfont',
              timestamp: generationTimestamp,
              formats: ['woff'],
            }))
            .pipe(streamtest[version].toObjects((err, files) => {
              if (err) {
                done(err);
                return;
              }
              assert.equal(files.length, 1);
              files2Buffers(files, contents => {
                  assert.deepEqual(
                      contents[0],
                      fs.readFileSync(path.join(__dirname, 'expected', 'iconsfont.woff'))
                  );
                  done(); // eslint-disable-line
              });
            }));
        });

        it('should output SVG font with svg added to formats', function(done) {
          this.timeout(5000);
          gulp.src(path.join(__dirname, 'fixtures', 'iconsfont', '*.svg'), { buffer: false })
            .pipe(iconfont({
              fontName: 'iconsfont',
              formats: [
                'svg',
                'ttf',
                'eot',
                'woff',
              ],
              timestamp: generationTimestamp,
            }))
            .pipe(streamtest[version].toObjects((err, files) => {
              if (err) {
                done(err);
                return;
              }
              assert.equal(files.length, 4);
                files2Buffers(files, contents => {
                assert.deepEqual(
                  contents[0],
                  fs.readFileSync(path.join(__dirname, 'expected', 'iconsfont.svg'))
                );
                assert.deepEqual(
                  contents[1],
                  fs.readFileSync(path.join(__dirname, 'expected', 'iconsfont.ttf'))
                );
                assert.deepEqual(
                  contents[2],
                  fs.readFileSync(path.join(__dirname, 'expected', 'iconsfont.woff'))
                );
                assert.deepEqual(
                  contents[3],
                  fs.readFileSync(path.join(__dirname, 'expected', 'iconsfont.eot'))
                );
                done(); // eslint-disable-line
              });
            }));
        });

        it('should output WOFF2 font with woff2 added to formats', function(done) {

          this.timeout(5000);
          gulp.src(path.join(__dirname, 'fixtures', 'iconsfont', '*.svg'), { buffer: false })
            .pipe(iconfont({
              fontName: 'iconsfont',
              formats: [
                'ttf',
                'woff',
                'woff2',
              ],
              timestamp: generationTimestamp,
            }))
            .pipe(streamtest[version].toObjects((err, files) => {
              if (err) {
                done(err);
                return;
              }
              assert.equal(files.length, 3);
              files2Buffers(files, contents => {
          assert.deepEqual(
            contents[0],
            fs.readFileSync(path.join(__dirname, 'expected', 'iconsfont.ttf'))
          );
          assert.deepEqual(
            contents[1],
            fs.readFileSync(path.join(__dirname, 'expected', 'iconsfont.woff2'))
          );
          assert.deepEqual(
            contents[2],
            fs.readFileSync(path.join(__dirname, 'expected', 'iconsfont.woff'))
          );
          done(); // eslint-disable-line
        });
            }));
        });

      });

      describe('in buffer mode', () => {

        it('should work', done => {
          gulp.src(path.join(__dirname, 'fixtures', 'iconsfont', '*.svg'), { buffer: true })
            .pipe(iconfont({
              fontName: 'iconsfont',
              timestamp: generationTimestamp,
            }))
            .pipe(streamtest[version].toObjects((err, files) => {
              if (err) {
                done(err);
                return;
              }
              assert.equal(files.length, 3);
        files2Buffers(files, contents => {
          assert.deepEqual(
            contents[0],
            fs.readFileSync(path.join(__dirname, 'expected', 'iconsfont.ttf'))
          );
          assert.deepEqual(
            contents[1],
            fs.readFileSync(path.join(__dirname, 'expected', 'iconsfont.woff'))
          );
          assert.deepEqual(
            contents[2],
            fs.readFileSync(path.join(__dirname, 'expected', 'iconsfont.eot'))
          );
          done(); // eslint-disable-line
        });
            }));
        });

        it('should emit an event with the codepoint mapping', done => {
          gulp.src(path.join(__dirname, 'fixtures', 'iconsfont', '*.svg'), { buffer: true })
            .pipe(iconfont({
              fontName: 'iconsfont',
              timestamp: generationTimestamp,
            }))
            .on('glyphs', codepoints => {
        neatequal(codepoints,
          JSON.parse(fs.readFileSync(
            path.join(__dirname, 'expected', 'codepoints.json'), 'utf8'))
        );
        done();
            });
        });
        it('should work with autohinted iconsfont', function(done) {
          this.timeout(10000);
          gulp.src(path.join(__dirname, 'fixtures', 'iconsfont', '*.svg'), { buffer: true })
            .pipe(iconfont({
              fontName: 'iconsfont',
              timestamp: generationTimestamp,
              autohint: `${__dirname}/ttfautohint/ttfautohint.sh`,
              formats: ['ttf'],
            }))
            .pipe(streamtest[version].toObjects((err, files) => {
              assert.equal(files.length, 1);
              if (err) {
                done(err);
                return;
              }
              file2Buffer(files[0], contents => {
                const expected =
                  fs.readFileSync(path.join(__dirname, 'expected', 'hinted', 'iconsfont.ttf'));
                // Clear the flags that change between invocations
                // Clear checksums

                contents.writeUInt8(0, 0x0080);
                expected.writeUInt8(0, 0x0080);
                contents.writeUInt8(0, 0x0081);
                expected.writeUInt8(0, 0x0081);
                contents.writeUInt8(0, 0x0082);
                expected.writeUInt8(0, 0x0082);
                contents.writeUInt8(0, 0x0083);
                expected.writeUInt8(0, 0x0083);

                contents.writeUInt8(0, 0x714);
                expected.writeUInt8(0, 0x714);
                contents.writeUInt8(0, 0x715);
                expected.writeUInt8(0, 0x715);
                contents.writeUInt8(0, 0x716);
                expected.writeUInt8(0, 0x716);
                contents.writeUInt8(0, 0x717);
                expected.writeUInt8(0, 0x717);

                contents.writeUInt8(0, 0x72C);
                expected.writeUInt8(0, 0x72C);
                contents.writeUInt8(0, 0x72D);
                expected.writeUInt8(0, 0x72D);
                contents.writeUInt8(0, 0x72E);
                expected.writeUInt8(0, 0x72E);
                contents.writeUInt8(0, 0x72F);
                expected.writeUInt8(0, 0x72F);
                assert.deepEqual(
                  contents,
                  expected
                );
                done();
        });
            }));
        });

      });
    });

  });

});

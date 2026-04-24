/* eslint max-nested-callbacks:[1] */

'use strict';

var gulp = require('gulp');
var Stream = require('stream');
var fs = require('fs');
var path = require('path');
var Vinyl = require('vinyl');

var assert = require('assert');
var StreamTest = require('streamtest');

var ttf2woff2 = require(path.join(__dirname, '..', 'src', 'index.js'));

describe('gulp-ttf2woff2 conversion', function() {
  var filename = path.join(__dirname, 'fixtures', 'iconsfont');
  var woff = fs.readFileSync(filename + '.woff2');

  // Iterating through versions
  StreamTest.versions.forEach(function(version) {

    describe('for ' + version + ' streams', function() {

      describe('with null contents', function() {

        it('should let null files pass through', function(done) {

          StreamTest[version].fromObjects([new Vinyl({
            path: 'bibabelula.foo',
            contents: null,
          })])
          .pipe(ttf2woff2())
          .pipe(StreamTest[version].toObjects(function(err, objs) {
            if(err) {
              return done(err);
            }
            assert.equal(objs.length, 1);
            assert.equal(objs[0].path, 'bibabelula.foo');
            assert.equal(objs[0].contents, null);
            done();
          }));

        });

      });

      describe('in buffer mode', function() {

        it('should work', function(done) {

          gulp.src(filename + '.ttf', { buffer: true })
            .pipe(ttf2woff2())
            // Uncomment to regenerate the test files if changes in the ttf2woff lib
            // .pipe(gulp.dest(__dirname + '/fixtures/'))
            .pipe(StreamTest[version].toObjects(function(err, objs) {
              if(err) {
                return done(err);
              }
              assert.equal(objs.length, 1);
              assert.equal(objs[0].path, filename + '.woff2');
              assert.equal(objs[0].contents.toString('utf-8'), woff.toString('utf-8'));
              done();
            }));

        });

        it('should work with the clone option', function(done) {

          gulp.src(filename + '.ttf', { buffer: true })
            .pipe(ttf2woff2({ clone: true }))
            .pipe(StreamTest[version].toObjects(function(err, objs) {
              if(err) {
                return done(err);
              }
              assert.equal(objs.length, 2);
              assert.equal(objs[0].path, filename + '.ttf');
              assert.equal(
                objs[0].contents.toString('utf-8'),
                fs.readFileSync(filename + '.ttf', 'utf-8')
              );
              assert.equal(objs[1].path, filename + '.woff2');
              assert.equal(
                objs[1].contents.toString('utf-8'),
                woff.toString('utf-8')
              );
              done();
            }));

        });

        it('should let non-ttf files pass through', function(done) {

          StreamTest[version].fromObjects([new Vinyl({
            path: 'bibabelula.foo',
            contents: new Buffer('ohyeah'),
          })])
          .pipe(ttf2woff2())
          .pipe(StreamTest[version].toObjects(function(err, objs) {
            if(err) {
              return done(err);
            }
            assert.equal(objs.length, 1);
            assert.equal(objs[0].path, 'bibabelula.foo');
            assert.equal(objs[0].contents.toString('utf-8'), 'ohyeah');
            done();
          }));

        });
      });


      describe('in stream mode', function() {
        it('should work', function(done) {

          gulp.src(filename + '.ttf', { buffer: false })
            .pipe(ttf2woff2())
            .pipe(StreamTest[version].toObjects(function(err, objs) {
              if(err) {
                return done(err);
              }
              assert.equal(objs.length, 1);
              assert.equal(objs[0].path, filename + '.woff2');
              objs[0].contents.pipe(StreamTest[version].toText(function(err, text) {
                if(err) {
                  return done(err);
                }
                assert.equal(text, woff.toString('utf-8'));
                done();
              }));
            }));

        });

        it('should work with the clone option', function(done) {

          gulp.src(filename + '.ttf', { buffer: false })
            .pipe(ttf2woff2({ clone: true }))
            .pipe(StreamTest[version].toObjects(function(err, objs) {
              if(err) {
                return done(err);
              }
              assert.equal(objs.length, 2);
              assert.equal(objs[0].path, filename + '.ttf');
              assert.equal(objs[1].path, filename + '.woff2');
              objs[0].contents.pipe(StreamTest[version].toText(function(err2, text) {
                if(err2) {
                  return done(err2);
                }
                assert.equal(text, fs.readFileSync(filename + '.ttf', 'utf-8'));
                objs[1].contents.pipe(StreamTest[version].toText(function(err3, text2) {
                  if(err3) {
                    return done(err3);
                  }
                  assert.equal(text2, woff.toString('utf-8'));
                  done();
                }));
              }));
            }));

        });

        it('should let non-ttf files pass through', function(done) {

          StreamTest[version].fromObjects([new Vinyl({
            path: 'bibabelula.foo',
            contents: new Stream.PassThrough(),
          })])
          .pipe(ttf2woff2())
          .pipe(StreamTest[version].toObjects(function(err, objs) {
            if(err) {
              return done(err);
            }
            assert.equal(objs.length, 1);
            assert.equal(objs[0].path, 'bibabelula.foo');
            assert(objs[0].contents._original instanceof Stream.PassThrough);
            done();
          }));

        });
      });

    });

  });

});

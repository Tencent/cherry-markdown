"use strict";

var gSpawn = require("../"),
  Stream = require("stream"),
  Vinyl = require("vinyl"),
  assert = require("assert"),
  es = require("event-stream");

describe("gulp-spawn", function () {
  describe("in stream mode", function () {
    it("should work with async contents streams", function (done) {
      var stream = gSpawn({
        cmd: "cat",
      });

      var inputStream = new Stream.PassThrough({ objectMode: true }),
        outputStream = new Stream.PassThrough({ objectMode: true }),
        n = 0;

      var fakeFile = new Vinyl({
        cwd: "./",
        base: "test",
        path: "test/file.js",
        contents: new Stream.PassThrough(),
      });
      var fakeFile2 = new Vinyl({
        cwd: "./",
        base: "test",
        path: "test/file2.js",
        contents: new Stream.PassThrough(),
      });

      inputStream.pipe(stream).pipe(outputStream);

      outputStream.on("readable", function () {
        var newFile;
        while ((newFile = outputStream.read())) {
          assert(newFile);
          assert.equal(newFile.cwd, "./");
          assert.equal(newFile.base, "test");
          assert(newFile.contents instanceof Stream);
          if (++n === 1) {
            assert.equal(newFile.path, "test/file.js");
            newFile.contents.pipe(
              es.wait(function (err, data) {
                assert.equal(data, "plipplap");
              })
            );
          } else {
            assert.equal(newFile.path, "test/file2.js");
            newFile.contents.pipe(
              es.wait(function (err, data) {
                assert.equal(data, "plopplup");
              })
            );
          }
        }
      });

      outputStream.on("end", function () {
        assert.equal(n, 2);
        done();
      });

      inputStream.write(fakeFile);
      inputStream.write(fakeFile2);
      inputStream.end();

      setImmediate(function () {
        fakeFile.contents.write("plip");
        setImmediate(function () {
          fakeFile.contents.write("plap");
          fakeFile.contents.end();
        });
      });

      setImmediate(function () {
        fakeFile2.contents.write("plop");
        setImmediate(function () {
          fakeFile2.contents.write("plup");
          fakeFile2.contents.end();
        });
      });
    });

    it("should work with async files streams", function (done) {
      var stream = gSpawn({
        cmd: "cat",
      });

      var inputStream = new Stream.PassThrough({ objectMode: true }),
        outputStream = new Stream.PassThrough({ objectMode: true }),
        n = 0;

      var fakeFile = new Vinyl({
        cwd: "./",
        base: "test",
        path: "test/file.js",
        contents: new Stream.PassThrough(),
      });
      var fakeFile2 = new Vinyl({
        cwd: "./",
        base: "test",
        path: "test/file2.js",
        contents: new Stream.PassThrough(),
      });

      inputStream.pipe(stream).pipe(outputStream);

      outputStream.on("readable", function () {
        var newFile;
        while ((newFile = outputStream.read())) {
          assert(newFile);
          assert.equal(newFile.cwd, "./");
          assert.equal(newFile.base, "test");
          assert(newFile.contents instanceof Stream);
          if (++n === 1) {
            assert.equal(newFile.path, "test/file.js");
            newFile.contents.pipe(
              es.wait(function (err, data) {
                assert.equal(data, "plipplap");
              })
            );
          } else {
            assert.equal(newFile.path, "test/file2.js");
            newFile.contents.pipe(
              es.wait(function (err, data) {
                assert.equal(data, "plopplup");
              })
            );
          }
        }
      });

      outputStream.on("end", function () {
        assert.equal(n, 2);
        done();
      });

      setImmediate(function () {
        inputStream.write(fakeFile);
        fakeFile.contents.write("plip");
        setImmediate(function () {
          fakeFile.contents.write("plap");
          fakeFile.contents.end();
        });

        setImmediate(function () {
          inputStream.write(fakeFile2);
          inputStream.end();
          fakeFile2.contents.write("plop");
          setImmediate(function () {
            fakeFile2.contents.write("plup");
            fakeFile2.contents.end();
          });
        });
      });
    });
  });
});

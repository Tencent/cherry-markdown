"use strict";

var gSpawn = require("../"),
  Stream = require("stream"),
  Vinyl = require("vinyl"),
  assert = require("assert"),
  es = require("event-stream");

describe("gulp-spawn", function () {
  describe("in stream mode", function () {
    it("should work with sync streams", function (done) {
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

      stream.write(fakeFile);
      stream.write(fakeFile2);
      stream.end();

      fakeFile.contents.write("plip");
      fakeFile.contents.write("plap");
      fakeFile.contents.end();

      fakeFile2.contents.write("plop");
      fakeFile2.contents.write("plup");
      fakeFile2.contents.end();
    });
  });
});

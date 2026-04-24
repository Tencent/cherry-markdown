"use strict";

var gSpawn = require("../"),
  Stream = require("stream"),
  Vinyl = require("vinyl"),
  assert = require("assert");

describe("gulp-spawn", function () {
  describe("in buffer mode", function () {
    it("should work", function (done) {
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
        contents: new Buffer("plipplap"),
      });
      var fakeFile2 = new Vinyl({
        cwd: "./",
        base: "test",
        path: "test/file2.js",
        contents: new Buffer("plipplup"),
      });

      inputStream.pipe(stream).pipe(outputStream);

      outputStream.on("readable", function () {
        var newFile;
        while ((newFile = outputStream.read())) {
          assert(newFile);
          assert.equal(newFile.cwd, "./");
          assert.equal(newFile.base, "test");
          assert(newFile.contents instanceof Buffer);
          if (++n === 1) {
            assert.equal(newFile.path, "test/file.js");
            assert.equal(newFile.contents.toString(), "plipplap");
          } else {
            assert.equal(newFile.path, "test/file2.js");
            assert.equal(newFile.contents.toString(), "plipplup");
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
    });
  });
});

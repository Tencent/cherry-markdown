"use strict";

var gSpawn = require("../"),
  Vinyl = require("vinyl"),
  assert = require("assert");

describe("gulp-spawn", function () {
  it("should pass null files through", function (done) {
    var stream = gSpawn({
      cmd: "cat",
    });

    var count = 0;

    var fakeFile = new Vinyl({
      cwd: "./",
      base: "test",
      path: "test/file.js",
      contents: null,
    });

    var fakeFile2 = new Vinyl({
      cwd: "./",
      base: "test",
      path: "test/file2.js",
      contents: null,
    });

    stream.on("readable", function () {
      var newFile;
      while ((newFile = stream.read())) {
        assert(newFile);
        assert.equal(newFile.cwd, "./");
        assert.equal(newFile.base, "test");
        assert.equal(newFile.contents, null);
        count += 1;
        if (count === 1) {
          assert.equal(newFile.path, "test/file.js");
        } else {
          assert.equal(newFile.path, "test/file2.js");
        }
      }
    });

    stream.on("end", function () {
      assert.equal(count, 2);
      done();
    });

    stream.write(fakeFile);
    stream.write(fakeFile2);
    stream.end();
  });
});

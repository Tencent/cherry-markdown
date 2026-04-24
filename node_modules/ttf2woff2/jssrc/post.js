// This file need to be append to the build in order to work with browserify
// Shamelessly stolen here: https://github.com/fabiosantoscode/require-emscripten/blob/master/post-js.postjs
module.exports = Module;

// Do not recurse into module and waste all day
Module.inspect = function () {
  return '[Module]';
};

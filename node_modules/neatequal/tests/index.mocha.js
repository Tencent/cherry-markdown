var assert = require('assert');
var neatEqual = require('../src/index');

describe('neatEqual', function () {

  describe('should not throw', function () {

    it('for simple equal objects', function() {
      assert.doesNotThrow(function() {
        neatEqual({test: 'test'}, {test: 'test'});
      });
    });

    it('for simple equal arrays', function() {
      assert.doesNotThrow(function() {
        neatEqual(['test', 'test2'], ['test', 'test2']);
      });
    });

    it('for deep equal objects', function() {
      assert.doesNotThrow(function() {
        neatEqual({test: 'test', test2: {test: 'test'}}, {test: 'test', test2: {test: 'test'}});
      });
    });

  });

  describe('should throw', function () {

    it('for simple not equal objects', function() {
      assert.throws(function() {
        neatEqual({test: 'test'}, {test: 'test1'});
      });
    }, /AssertionError/);

    it('for simple equal arrays', function() {
      assert.throws(function() {
        neatEqual(['test', 'test2'], ['test', 'test3']);
      });
    }, /AssertionError/);

    it('for deep equal objects', function() {
      assert.throws(function() {
        neatEqual({test: 'test', test2: {test: 'test2'}}, {test: 'test', test2: {test: 'test'}});
      });
    }, /AssertionError/);

  });

});

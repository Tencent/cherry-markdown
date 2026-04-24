var VarStream = require('../src/VarStream')
  , fs = require('fs')
  , assert = require('assert')
  , StringDecoder = require('string_decoder').StringDecoder;

// Tests
describe('Writing varstreams', function() {

  describe("should work when", function() {

    it("outputting simple values", function() {
      var data = '';
      new VarStream.Writer(function(str) {
        data += str;
      },
        VarStream.Reader.STRICT_MODE).write({
          'var1': 'machin',
          'var2': 'bidule',
          'var3': 'truc'
        });
      assert.equal(data,
        'var1=machin\nvar2=bidule\nvar3=truc\n');
    });

    it("outputting variable trees", function() {
      var data = '';
      new VarStream.Writer(function(str) {
        data += str;
      }).write({
          'var1': {
            'var11': {
              'var111':'machin'
            },
            'var12': 'bidule',
            'var13': 'truc'
          }
        });
      assert.equal(data,
        'var1.var11.var111=machin\nvar1.var12=bidule\nvar1.var13=truc\n');
    });

    it("outputting variable trees and optimizing it", function() {
      var data = '';
      new VarStream.Writer(function(str) {
        data += str;
      },
        VarStream.Writer.MORPH_CONTEXTS
      ).write({
          'var1': {
            'var11': {
              'var111':'machin'
            },
            'var12': 'bidule',
            'var13': 'truc'
          }
        });
      assert.equal(data,
        'var1.var11.var111=machin\nvar1.var12=bidule\n^.var13=truc\n');
    });

    it("outputting simple arrays", function() {
      var data = '';
      new VarStream.Writer(function(str) {
        data += str;
      }).write({
          'var1': {
            'var11': {
              'var111': ['machin', 'bidule', 'truc']
            },
            'var12': ['machin', 'bidule', 'truc'],
            'var13': ['machin', 'bidule', 'truc']
          }
        });
      assert.equal(data,
        'var1.var11.var111.0=machin\n' +
        'var1.var11.var111.1=bidule\n' +
        'var1.var11.var111.2=truc\n' +
        'var1.var12.0=machin\n' +
        'var1.var12.1=bidule\n' +
        'var1.var12.2=truc\n' +
        'var1.var13.0=machin\n' +
        'var1.var13.1=bidule\n' +
        'var1.var13.2=truc\n'
      );
    });

    it("outputting simple arrays in merging mode", function() {
      var data = '';
      new VarStream.Writer(function(str) {
        data += str;
      },
        VarStream.Writer.MERGE_ARRAYS
      ).write({
          'var1': {
            'var11': {
              'var111': ['machin', 'bidule', 'truc']
            },
            'var12': ['machin', 'bidule', 'truc'],
            'var13': ['machin', 'bidule', 'truc']
          }
        });
      assert.equal(data,
        'var1.var11.var111.+=machin\n' +
        'var1.var11.var111.+=bidule\n' +
        'var1.var11.var111.+=truc\n' +
        'var1.var12.+=machin\n' +
        'var1.var12.+=bidule\n' +
        'var1.var12.+=truc\n' +
        'var1.var13.+=machin\n' +
        'var1.var13.+=bidule\n' +
        'var1.var13.+=truc\n'
      );
    });

    it("outputting simple arrays and optimizing", function() {
      var data = '';
      new VarStream.Writer(function(str) {
        data += str;
      },
        VarStream.Writer.MORPH_CONTEXTS
      ).write({
          'var1': {
            'var11': {
              'var111': ['machin', 'bidule', 'truc']
            },
            'var12': ['machin', 'bidule', 'truc'],
            'var13': ['machin', 'bidule', 'truc']
          }
        });
      assert.equal(data,
        'var1.var11.var111.0=machin\n' +
        '^.1=bidule\n' +
        '^.2=truc\n' +
        'var1.var12.0=machin\n' +
        '^.1=bidule\n' +
        '^.2=truc\n' +
        'var1.var13.0=machin\n' +
        '^.1=bidule\n' +
        '^.2=truc\n'
      );
    });

    it("outputting object collections", function() {
      var data = '';
      new VarStream.Writer(function(str) {
        data += str;
      }).write({
          'var1': {
            'var11': {
              'var111': [{
                name: 'machin',
                type: 'obj'
              }, {
                name: 'bidule',
                type: 'obj'
              }, {
                name: 'truc',
                type: 'obj'
              }]
            },
            'var12': [{
              name: 'machin',
              type: 'obj'
            }, {
              name: 'bidule',
              type: 'obj'
            }, {
              name: 'truc',
              type: 'obj'
            }],
            'var13': [{
              name: 'machin',
              type: 'obj'
            }, {
              name: 'bidule',
              type: 'obj'
            }, {
              name: 'truc',
              type: 'obj'
            }]
          }
        });
      assert.equal(data,
        'var1.var11.var111.0.name=machin\n' +
        'var1.var11.var111.0.type=obj\n' +
        'var1.var11.var111.1.name=bidule\n' +
        'var1.var11.var111.1.type=obj\n' +
        'var1.var11.var111.2.name=truc\n' +
        'var1.var11.var111.2.type=obj\n' +
        'var1.var12.0.name=machin\n' +
        'var1.var12.0.type=obj\n' +
        'var1.var12.1.name=bidule\n' +
        'var1.var12.1.type=obj\n' +
        'var1.var12.2.name=truc\n' +
        'var1.var12.2.type=obj\n' +
        'var1.var13.0.name=machin\n' +
        'var1.var13.0.type=obj\n' +
        'var1.var13.1.name=bidule\n' +
        'var1.var13.1.type=obj\n' +
        'var1.var13.2.name=truc\n' +
        'var1.var13.2.type=obj\n'
      );
    });

    it("outputting object collections in merging mode", function() {
      var data = '';
      new VarStream.Writer(function(str) {
        data += str;
      },
        VarStream.Writer.MERGE_ARRAYS
      ).write({
          'var1': {
            'var11': {
              'var111': [{
                name: 'machin',
                type: 'obj'
              }, {
                name: 'bidule',
                type: 'obj'
              }, {
                name: 'truc',
                type: 'obj'
              }]
            },
            'var12': [{
              name: 'machin',
              type: 'obj'
            }, {
              name: 'bidule',
              type: 'obj'
            }, {
              name: 'truc',
              type: 'obj'
            }],
            'var13': [{
              name: 'machin',
              type: 'obj'
            }, {
              name: 'bidule',
              type: 'obj'
            }, {
              name: 'truc',
              type: 'obj'
            }]
          }
        });
      assert.equal(data,
        'var1.var11.var111.+.name=machin\n' +
        'var1.var11.var111.*.type=obj\n' +
        'var1.var11.var111.+.name=bidule\n' +
        'var1.var11.var111.*.type=obj\n' +
        'var1.var11.var111.+.name=truc\n' +
        'var1.var11.var111.*.type=obj\n' +
        'var1.var12.+.name=machin\n' +
        'var1.var12.*.type=obj\n' +
        'var1.var12.+.name=bidule\n' +
        'var1.var12.*.type=obj\n' +
        'var1.var12.+.name=truc\n' +
        'var1.var12.*.type=obj\n' +
        'var1.var13.+.name=machin\n' +
        'var1.var13.*.type=obj\n' +
        'var1.var13.+.name=bidule\n' +
        'var1.var13.*.type=obj\n' +
        'var1.var13.+.name=truc\n' +
        'var1.var13.*.type=obj\n'
      );
    });

    it("outputting object collections and optimizing", function() {
      var data = '';
      new VarStream.Writer(function(str) {
        data += str;
      },
        VarStream.Writer.MORPH_CONTEXTS
      ).write({
          'var1': {
            'var11': {
              'var111': [{
                name: 'machin',
                type: 'obj'
              }, {
                name: 'bidule',
                type: 'obj'
              }, {
                name: 'truc',
                type: 'obj'
              }]
            },
            'var12': [{
              name: 'machin',
              type: 'obj'
            }, {
              name: 'bidule',
              type: 'obj'
            }, {
              name: 'truc',
              type: 'obj'
            }],
            'var13': [{
              name: 'machin',
              type: 'obj'
            }, {
              name: 'bidule',
              type: 'obj'
            }, {
              name: 'truc',
              type: 'obj'
            }]
          }
        });
      assert.equal(data,
        'var1.var11.var111.0.name=machin\n' +
        '^.type=obj\n' +
        'var1.var11.var111.1.name=bidule\n' +
        '^.type=obj\n' +
        'var1.var11.var111.2.name=truc\n' +
        '^.type=obj\n' +
        'var1.var12.0.name=machin\n' +
        '^.type=obj\n' +
        'var1.var12.1.name=bidule\n' +
        '^.type=obj\n' +
        'var1.var12.2.name=truc\n' +
        '^.type=obj\n' +
        'var1.var13.0.name=machin\n' +
        '^.type=obj\n' +
        'var1.var13.1.name=bidule\n' +
        '^.type=obj\n' +
        'var1.var13.2.name=truc\n' +
        '^.type=obj\n'
      );
    });

  });
  
});
describe('Writing bad varstreams', function() {

  describe("should raise exceptions when in strict mode and", function() {

    it("the given root object is not an object or an array", function() {
      assert.throws(
        function() {
          new VarStream.Writer(function() {}).write('');
        },
        function(err) {
        if(err instanceof Error
          &&err.message==='The root scope must be an Object or an Array.') {
            return true;
          }
        }
      );
    });

  });

});

var VarStream = require('../src/VarStream')
  , fs = require('fs')
  , assert = require('assert')
  , StringDecoder = require('string_decoder').StringDecoder;

describe('VarStream constructor', function() {

  it('should work when new is omitted', function() {
    assert.doesNotThrow(function() {
      VarStream({}, 'prop');
    });
  });

  it('should accept options', function() {
    assert.doesNotThrow(function() {
      new VarStream({}, 'prop', VarStream.VarStreamReader.OPTIONS);
    });
  });

  it('should fail when no root object is given', function() {
    assert.throws(function() {
      new VarStream();
    }, function(err) {
    if(err instanceof Error
      &&err.message==='No root object provided.') {
        return true;
      }
    });
  });

  it('should fail when no property is given', function() {
    assert.throws(function() {
      new VarStream({});
    }, function(err) {
    if(err instanceof Error
      &&err.message==='No root property name given.') {
        return true;
      }
    });
  });

  it('should fail when an empty property is given', function() {
    assert.throws(function() {
      new VarStream({}, '');
    }, function(err) {
    if(err instanceof Error
      &&err.message==='No root property name given.') {
        return true;
      }
    });
  });

});

describe('VarStream duplex stream', function() {

  it('should work as expected', function(done) {
    var root = {};
    var stream = new VarStream(root, 'plop');
    stream.on('finish', function() {
      assert.equal(root.plop.plap, 'plip');
      assert.equal(root.plop.plop, 'plup');
      done();
    });
    stream.write('plap=plip\n');
    stream.write('plop=plup\n');
    stream.end();
  });

});

describe('VarStream.stringify()', function() {

  it('should fail with no input', function() {
    assert.throws(function() {
      VarStream.stringify();
    }, function(err) {
    if(err instanceof Error
      &&err.message==='The stringified object must be an instance of Object.') {
        return true;
      }
    });
  });

  it('should fail with input non-object input', function() {
    assert.throws(function() {
      VarStream.stringify('aiie caramba');
    }, function(err) {
    if(err instanceof Error
      &&err.message==='The stringified object must be an instance of Object.') {
        return true;
      }
    });
  });

});

describe('VarStream.parse()', function() {

  it('should work with an empty string', function() {
    var obj = VarStream.parse('');
    assert.deepEqual(obj, {});
  });

});

describe('Helpers decoding/rencoding', function() {

  var dir = __dirname+'/fixtures'
    , files = fs.readdirSync(dir)
  ;

  it('should work with some null values', function() {
      var cnt = VarStream.stringify({
        test: undefined,
        test2: null
      });
      assert.deepEqual(
        VarStream.stringify(VarStream.parse(VarStream.stringify(VarStream.parse(cnt)))),
        VarStream.stringify(VarStream.parse(cnt))
      );
  });

  it('should work with values referring to the root scope', function() {
      var obj = {
        test2: {}
      };
      obj.test = obj;
      obj.test2.test = obj;
      var cnt = VarStream.stringify(obj);
      assert.deepEqual(
        VarStream.stringify(VarStream.parse(VarStream.stringify(VarStream.parse(cnt)))),
        VarStream.stringify(VarStream.parse(cnt))
      );
  });

  it('should work with complexer arrays', function() {
      var obj = VarStream.parse(fs.readFileSync(__dirname+'/fixtures/y-complexarray.dat', {encoding: 'utf-8'}));
      assert.deepEqual(
        VarStream.stringify(VarStream.parse(VarStream.stringify(obj))),
        VarStream.stringify(obj)
      );
  });

  it('should work with circular references', function() {
      var obj = VarStream.parse(fs.readFileSync(__dirname+'/fixtures/z-circular.dat', {encoding: 'utf-8'}));
      assert.deepEqual(
        VarStream.stringify(VarStream.parse(VarStream.stringify(obj))),
        VarStream.stringify(obj)
      );
  });

  it('should work with some null values in varstream format', function() {
      var obj = VarStream.parse('test2=null\ntest3=\n');
      assert.deepEqual(
        VarStream.stringify(VarStream.parse(VarStream.stringify(obj))),
        VarStream.stringify(obj)
      );
  });

  files.forEach(function(file) {
    if('3-delete.dat' === file) return;
    it('should work with "'+file+'"', function() {
      var cnt = VarStream.stringify(VarStream.parse(fs.readFileSync(dir + '/' +file, {encoding: 'utf-8'})));
      assert.deepEqual(
        VarStream.stringify(VarStream.parse(VarStream.stringify(VarStream.parse(cnt)))),
        VarStream.stringify(VarStream.parse(cnt))
      );
    });
  })

});

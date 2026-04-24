var VarStream = require('../src/VarStream')
  , fs = require('fs')
  , assert = require('assert')
  , StringDecoder = require('string_decoder').StringDecoder;

// Tests
describe('Parsing VarStream', function() {

  var scope = {};
  var myVarStream=new VarStream(scope,'vars');
  it("should work for simple datas", function(done) {
    var readStream = fs.createReadStream(__dirname+'/fixtures/1-simple.dat');
    readStream.pipe(myVarStream, { end: false });
    readStream.on('end', function () {
        // Numbers
        assert.equal(typeof scope.vars.aSimpleIntValue, 'number');
        assert.equal(scope.vars.aSimpleIntValue,1898);
        assert.equal(typeof scope.vars.aSimpleIntNegativeValue, 'number');
        assert.equal(scope.vars.aSimpleIntNegativeValue,-1669);
        assert.equal(typeof scope.vars.aSimpleFloatValue, 'number');
        assert.equal(scope.vars.aSimpleFloatValue,1.0025);
        assert.equal(typeof scope.vars.aSimpleFloatNegativeValue, 'number');
        assert.equal(scope.vars.aSimpleFloatNegativeValue,-1191.0025);
        // Booleans
        assert.equal(typeof scope.vars.aSimpleBoolValueTrue, 'boolean');
        assert.equal(scope.vars.aSimpleBoolValueTrue,true);
        assert.equal(typeof scope.vars.aSimpleBoolValueFalse, 'boolean');
        assert.equal(scope.vars.aSimpleBoolValueFalse,false);
        // Strings
        assert.equal(typeof scope.vars.aSimpleStringValue, 'string');
        assert.equal(scope.vars.aSimpleStringValue,"I'm the king of the world!");
        assert.equal(typeof scope.vars.aSimpleStringMultilineValue, 'string');
        assert.equal(scope.vars.aSimpleStringMultilineValue,
          "I'm the king of the world!\nYou know!\nIt's true.");
        done();
      });
  });
/*
  it("should work for other text", function(done) {
    fs.createReadStream(__dirname+'/fixtures/9-othertext.dat').pipe(myVarStream)
      .once('end', function () {
        // Strings
        assert.equal(typeof scope.vars.aSimpleWellDeclaredStringValue, 'string');
        assert.equal(scope.vars.aSimpleWellDeclaredStringValue,
          "I'm the king of the world!");
        assert.equal(typeof scope.vars.aSimpleWellDeclaredStringMultilineValue,
          'string');
        assert.equal(scope.vars.aSimpleWellDeclaredStringMultilineValue,
          "I'm the king of the world!\nYou \"know\"!\nIt's true.");
        done();
      });
  });*/


  it("should work for data trees", function(done) {
    var readStream = fs.createReadStream(__dirname+'/fixtures/2-trees.dat');
    readStream.pipe(myVarStream, { end: false });
    readStream.on('end', function () {
        assert.equal(typeof scope.vars.treeRoot.branch1,'object');
        assert.equal(scope.vars.treeRoot.branch1.aSimpleIntValue,1898);
        assert.equal(scope.vars.treeRoot.branch1.aSimpleIntNegativeValue,-1669);
        assert.equal(typeof scope.vars.treeRoot.branch2,'object');
        assert.equal(scope.vars.treeRoot.branch2.aSimpleFloatValue,1.0025);
        assert.equal(scope.vars.treeRoot.branch2.aSimpleFloatNegativeValue,
          -1191.0025);
        assert.equal(typeof scope.vars.treeRoot.branch3,'object');
        assert.equal(scope.vars.treeRoot.branch3.aSimpleBoolValueTrue,true);
        assert.equal(scope.vars.treeRoot.branch3.aSimpleBoolValueFalse,false);
        assert.equal(typeof scope.vars.treeRoot.branch3.branch1,'object');
        assert.equal(scope.vars.treeRoot.branch3.branch1.aSimpleNullValue,null);
        assert.equal(scope.vars.treeRoot.branch3.branch1.aSimpleStringValue,
          "I'm the king of the world!");
        assert.equal(typeof scope.vars.treeRoot.branch3.branch2,'object');
        assert.equal(scope.vars.treeRoot.branch3.branch2.aSimpleStringMultilineValue,
          "I'm the king of the world!\r\nYou know!\r\nIt's true.");
        //assert.equal(scope.vars.treeRoot.branch3.branch2.aSimpleWellDeclaredStringValue,
        //  "I'm the king of the world!");
        //assert.equal(typeof scope.vars.treeRoot.branch3.branch2.branch1,'object');
        //assert.equal(
        //  scope.vars.treeRoot.branch3.branch2.branch1.aSimpleWellDeclaredStringMultilineValue,
        //  "I'm the king of the world!\nYou \"know\"!\nIt's true.");
        done();
      });
  });


  it("should deleted empty datas", function(done) {
    var readStream = fs.createReadStream(__dirname+'/fixtures/3-delete.dat');
    readStream.pipe(myVarStream, { end: false });
    readStream.on('end', function () {
      assert.equal(typeof scope.vars.treeRoot.branch1.aSimpleIntNegativeValue,'undefined');
      assert.equal(typeof scope.vars.treeRoot.branch2,'undefined');
      assert.equal(typeof scope.vars.treeRoot.branch3.aSimpleBoolValueTrue,'undefined');
      assert.equal(typeof scope.vars.treeRoot.branch3.branch1.aSimpleStringValue,'string');
      assert.equal(scope.vars.treeRoot.branch3.branch1.aSimpleStringValue,'');
      done();
    });
  });


  it("should take backward references in count", function(done) {
    var readStream = fs.createReadStream(__dirname+'/fixtures/4-backward.dat');
    readStream.pipe(myVarStream, { end: false });
    readStream.on('end', function () {
        assert.equal(typeof scope.vars.treeRoot.branch1,'object');
        assert.strictEqual(scope.vars.treeRoot.branch1.aSimpleIntValue,2000);
        assert.strictEqual(scope.vars.treeRoot.branch1.aSimpleIntNegativeValue,-2000);
        assert.equal(typeof scope.vars.treeRoot.branch2,'object');
        assert.strictEqual(scope.vars.treeRoot.branch2.aSimpleFloatValue,2.0001);
        assert.strictEqual(scope.vars.treeRoot.branch2.aSimpleFloatNegativeValue,-1000.0002);
        assert.equal(typeof scope.vars.treeRoot.branch3,'object');
        assert.strictEqual(scope.vars.treeRoot.branch3.aSimpleBoolValueTrue,true);
        assert.strictEqual(scope.vars.treeRoot.branch3.aSimpleBoolValueFalse,false);
        assert.equal(typeof scope.vars.treeRoot.branch3.branch1,'object');
        assert.strictEqual(scope.vars.treeRoot.branch3.branch1.aSimpleNullValue,null);
        assert.strictEqual(scope.vars.treeRoot.branch3.branch1.aSimpleStringValue,
          "I'm not the king of the world!");
        //assert.equal(typeof scope.vars.treeRoot.branch3.branch2,'object');
        //assert.equal(scope.vars.treeRoot.branch3.branch2.aSimpleStringMultilineValue,
        //  "I'm not the king of the world!\nYou know!\nIt's true.");
        //assert.equal(scope.vars.treeRoot.branch3.branch2.aSimpleWellDeclaredStringValue,
        //  "I'm not the king of the world!");
        //assert.equal(typeof scope.vars.treeRoot.branch3.branch2.branch1,'object');
        //assert.equal(
        //  scope.vars.treeRoot.branch3.branch2.branch1.aSimpleWellDeclaredStringMultilineValue,
        //  "I'm not the king of the world!\nYou \"know\"!\nIt's true.");
      done();
    });
  });

  it("should work with operators", function(done) {
    var readStream = fs.createReadStream(__dirname+'/fixtures/5-operators.dat');
    readStream.pipe(myVarStream, { end: false });
    readStream.on('end', function () {
        // Numbers
        assert.equal(typeof scope.vars.aSimpleIntValue, 'number');
        assert.equal(scope.vars.aSimpleIntValue,(((1898+5)*2)-15)%8);
        assert.equal(typeof scope.vars.aSimpleIntNegativeValue, 'number');
        assert.equal(scope.vars.aSimpleIntNegativeValue,(((-1669)+6)*-3)-1);
        assert.equal(typeof scope.vars.aSimpleFloatValue, 'number');
        assert.equal(scope.vars.aSimpleFloatValue,(1.0025+0.0025)/0.0025);
        assert.equal(typeof scope.vars.aSimpleFloatNegativeValue, 'number');
        assert.equal(scope.vars.aSimpleFloatNegativeValue,((-1191.0025)-(-0.0025))/-0.0025);
        // Booleans
        assert.equal(typeof scope.vars.aSimpleBoolValueTrue, 'boolean');
        assert.equal(scope.vars.aSimpleBoolValueTrue,true);
        assert.equal(typeof scope.vars.aSimpleBoolValueFalse, 'boolean');
        assert.equal(scope.vars.aSimpleBoolValueFalse,false);
        // Strings
        assert.equal(typeof scope.vars.aSimpleStringValue, 'string');
        assert.equal(scope.vars.aSimpleStringValue,"I'm the king of the world! Yep!");
        assert.equal(typeof scope.vars.aSimpleStringMultilineValue, 'string');
        assert.equal(scope.vars.aSimpleStringMultilineValue,
          "I'm the king of the world!\nYou know!\nIt's true.\r\nYep.");
        /*assert.equal(typeof scope.vars.aSimpleWellDeclaredStringValue, 'string');
        assert.equal(scope.vars.aSimpleWellDeclaredStringValue,
          "I'm the king of the world! Yep!");
        assert.equal(typeof scope.vars.aSimpleWellDeclaredStringMultilineValue,
          'string');
        assert.equal(scope.vars.aSimpleWellDeclaredStringMultilineValue,
          "I'm the king of the world!\nYou \"know\"!\nIt's true.\nYep.");
        assert.equal(scope.vars.treeRoot.branch3.branch4,
          scope.vars.treeRoot.branch3.branch2);*/
      done();
    });
  });

  it("should work with arrays", function(done) {
    var readStream = fs.createReadStream(__dirname+'/fixtures/6-arrays.dat');
    readStream.pipe(myVarStream, { end: false });
    readStream.on('end', function () {
        // First array
        assert.equal(typeof scope.vars.aSimpleArray,'object');
        assert.equal(scope.vars.aSimpleArray instanceof Array,true);
        assert.equal(scope.vars.aSimpleArray.length,9);
        assert.equal(scope.vars.aSimpleArray[0],0);
        assert.equal(scope.vars.aSimpleArray[1],1);
        assert.equal(scope.vars.aSimpleArray[2],2);
        assert.equal(scope.vars.aSimpleArray[3],3);
        assert.equal(scope.vars.aSimpleArray[4],4);
        assert.equal(scope.vars.aSimpleArray[5],5);
        assert.equal(scope.vars.aSimpleArray[6],6);
        assert.equal(scope.vars.aSimpleArray[7],9);
        assert.equal(scope.vars.aSimpleArray[8],8);
        // Second array
        assert.equal(typeof scope.vars.aSimpleArray2,'object');
        assert.equal(scope.vars.aSimpleArray2 instanceof Array,true);
        assert.equal(scope.vars.aSimpleArray2.length,10);
        assert.equal(scope.vars.aSimpleArray2[0].value,5);
        assert.equal(scope.vars.aSimpleArray2[1].value,4);
        assert.equal(typeof scope.vars.aSimpleArray2[2],'undefined');
        assert.equal(typeof scope.vars.aSimpleArray2[3],'undefined');
        assert.equal(typeof scope.vars.aSimpleArray2[4],'undefined');
        assert.equal(typeof scope.vars.aSimpleArray2[5],'undefined');
        assert.equal(typeof scope.vars.aSimpleArray2[6],'undefined');
        assert.equal(typeof scope.vars.aSimpleArray2[7],'undefined');
        assert.equal(typeof scope.vars.aSimpleArray2[8],'undefined');
        assert.equal(scope.vars.aSimpleArray2[9].value,5);
      done();
    });
  });

  it("Should work with truncated content beetween chunks", function(done) {
    var readStream = fs.createReadStream(__dirname+'/fixtures/7-truncated-part1.dat');
    readStream.pipe(myVarStream, { end: false })
    readStream.on('end', function () {
      done();
    });
  });

  it("Should work with truncated content beetween chunks", function(done) {
    var readStream = fs.createReadStream(__dirname+'/fixtures/7-truncated-part2.dat');
    readStream.pipe(myVarStream, { end: false });
    readStream.on('end', function () {
      done();
    });
  });

  it("Should interpret rightvals first", function(done) {
    var readStream = fs.createReadStream(__dirname+'/fixtures/8-rightval.dat');
    readStream.pipe(myVarStream, { end: false });
    readStream.on('end', function () {
        assert.equal(scope.vars.aSimpleArray[0],10);
        assert.equal(scope.vars.aSimpleArray[1],10);
        assert.equal(scope.vars.aSimpleArray2[0].value,9);
        assert.equal(scope.vars.aSimpleArray2[1].value,9);
      done();
    });
  });

  it("Should output good contents", function(done) {
    var content = ''
     , decoder = new StringDecoder('utf8');
    myVarStream.on('data', function(chunk) {
      content += decoder.write(chunk);
    });
    myVarStream.on('end', function() {
      assert.equal(content,
        fs.readFileSync(__dirname+'/fixtures/0-result.dat', 'utf8'));
      done();
    });
  });

});

describe('Reading chunked varstreams', function() {

  it("Should work at the lval level", function() {
    var scope = {};
    var myVarStream=new VarStream.Reader(scope,'vars');
    myVarStream.read('aVar1=ok\naVa');
    assert.equal(scope.vars.aVar1,'ok');
    assert.equal(typeof scope.vars.aVar2,'undefined');
    myVarStream.read('r2=1000\naVar3=2000\n');
    assert.equal(scope.vars.aVar2,1000);
    assert.equal(scope.vars.aVar3,2000);
  });

  it("Should work at the operator level", function() {
    var scope = {};
    var myVarStream=new VarStream.Reader(scope,'vars');
    myVarStream.read('aVar1=ok\naVar2');
    assert.equal(scope.vars.aVar1,'ok');
    assert.equal(typeof scope.vars.aVar2,'undefined');
    myVarStream.read('=1000\naVar3=2000\n');
    assert.equal(scope.vars.aVar2,1000);
    assert.equal(scope.vars.aVar3,2000);
  });

  it("Should work at the next operator level", function() {
    var scope = {};
    var myVarStream=new VarStream.Reader(scope,'vars');
    myVarStream.read('aVar1=ok\naVar2=');
    assert.equal(scope.vars.aVar1,'ok');
    assert.equal(typeof scope.vars.aVar2,'undefined');
    myVarStream.read('1000\naVar3=2000\n');
    assert.equal(scope.vars.aVar2,1000);
    assert.equal(scope.vars.aVar3,2000);
  });

  it("Should work at the rval level", function() {
    var scope = {};
    var myVarStream=new VarStream.Reader(scope,'vars');
    myVarStream.read('aVar1=ok\naVar2=1');
    assert.equal(scope.vars.aVar1,'ok');
    assert.equal(typeof scope.vars.aVar2,'undefined');
    myVarStream.read('000\naVar3=2000\n');
    assert.equal(scope.vars.aVar2,1000);
    assert.equal(scope.vars.aVar3,2000);
  });

  it("Should work at the multiline level", function() {
    var scope = {};
    var myVarStream=new VarStream.Reader(scope,'vars');
    myVarStream.read('aVar1=ok\naVar2=Y');
    assert.equal(scope.vars.aVar1,'ok');
    assert.equal(typeof scope.vars.aVar2,'undefined');
    myVarStream.read('ep!\\\n');
    assert.equal(scope.vars.aVar2,'Yep!\n');
    myVarStream.read(' That\'');
    assert.equal(scope.vars.aVar2,'Yep!\n That\'');
    myVarStream.read('s me!\n');
    assert.equal(scope.vars.aVar2,'Yep!\n That\'s me!');
  });

});

describe('Reading varstreams', function() {

    it("should work well with props containing underscores", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars');
      myVarStream.read('a_obj.a_text=This is a text \\\\\n');
      assert.strictEqual(scope.vars.a_obj.a_text,'This is a text \\');
      myVarStream.read('a_obj.a_text=This is \\a text.\n');
      assert.strictEqual(scope.vars.a_obj.a_text,'This is \\a text.');
      myVarStream.read('a_obj.a_text=This is \\\\a text.\n');
      assert.strictEqual(scope.vars.a_obj.a_text,'This is \\a text.');
    });

    it("should work well when chars are escaped", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars');
      myVarStream.read('aObj.aText=This is a text \\\\\n');
      assert.strictEqual(scope.vars.aObj.aText,'This is a text \\');
      myVarStream.read('aObj.aText=This is \\a text.\n');
      assert.strictEqual(scope.vars.aObj.aText,'This is \\a text.');
      myVarStream.read('aObj.aText=This is \\\\a text.\n');
      assert.strictEqual(scope.vars.aObj.aText,'This is \\a text.');
    });

    it("should work when the stream refers to its root scope with ^", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars');
      myVarStream.read('aObj.parent&=^\n');
      assert.equal(scope.vars,scope.vars.aObj.parent);
    });

    it("should work when the stream refers to its root scope with ^0", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars');
      myVarStream.read('aObj.parent&=^\n');
      assert.equal(scope.vars,scope.vars.aObj.parent);
    });

    it("should work well when chars are escaped in multiline strings", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars');
      myVarStream.read('aObj.aText=This is a \\\n');
      assert.strictEqual(scope.vars.aObj.aText,'This is a \n');
      myVarStream.read('multiline \\ text.\\\n');
      assert.strictEqual(scope.vars.aObj.aText,'This is a \nmultiline \\ text.\n');
      myVarStream.read('With two \\\\ lines.\\\\\n');
      assert.strictEqual(scope.vars.aObj.aText,'This is a \nmultiline \\ text.\nWith two \\ lines.\\');
    });

});

describe('Reading bad varstreams', function() {

  describe("should silently fail when", function() {

    it("a line ends with no value after =", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars');
      assert.doesNotThrow(function() {
          myVarStream.read('validVar1=machin\nASimpleVar\nvalidVar2=bidule\n');
      });
      assert.deepEqual(scope.vars, {
        validVar1: 'machin',
        validVar2: 'bidule'
      });
    });

    it("a line has an empty lvalue", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars');
      assert.doesNotThrow(function() {
          myVarStream.read('validVar1=machin\n=truc\nvalidVar2=bidule\n');
      });
      assert.deepEqual(scope.vars, {
        validVar1: 'machin',
        validVar2: 'bidule'
      });
    });

    it("a line has an empty lvalue with a multiline rightvalue", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars');
      assert.doesNotThrow(function() {
          myVarStream.read('validVar1=machin\n=truc\\n1\\n2\\nmachin\n\nvalidVar2=bidule\n'); // Something wrong here
      });
      assert.deepEqual(scope.vars, {
        validVar1: 'machin',
        validVar2: 'bidule'
      });
    });

    it("a line ends with no value after &=", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars');
      assert.doesNotThrow(function() {
          myVarStream.read('validVar1=machin\nASimpleVar&=\nvalidVar2=bidule\n');
      });
      assert.deepEqual(scope.vars, {
        validVar1: 'machin',
        validVar2: 'bidule'
      });
    });

    it("a line ends with no value after +=", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars');
      assert.doesNotThrow(function() {
          myVarStream.read('validVar1=machin\nASimpleVar+=\nvalidVar2=bidule\n');
      });
      assert.deepEqual(scope.vars, {
        validVar1: 'machin',
        validVar2: 'bidule'
      });
    });

    it("a line ends with no value after -=", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars');
      assert.doesNotThrow(function() {
          myVarStream.read('validVar1=machin\nASimpleVar-=\nvalidVar2=bidule\n');
      });
      assert.deepEqual(scope.vars, {
        validVar1: 'machin',
        validVar2: 'bidule'
      });
    });

    it("a line ends with no value after /=", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars');
      assert.doesNotThrow(function() {
          myVarStream.read('validVar1=machin\nASimpleVar/=\nvalidVar2=bidule\n');
      });
      assert.deepEqual(scope.vars, {
        validVar1: 'machin',
        validVar2: 'bidule'
      });
    });

    it("when there are an empty node at start", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars');
      assert.doesNotThrow(function() {
          myVarStream.read('validVar1=machin\n.ASimpleVar=truc\nvalidVar2=bidule\n');
      });
      assert.deepEqual(scope.vars, {
        validVar1: 'machin',
        validVar2: 'bidule'
      });
    });

    it("when there are an empty node somewhere", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars');
      assert.doesNotThrow(function() {
          myVarStream.read('validVar1=machin\nASimpleVar.aNode..anotherNode.and=truc\nvalidVar2=bidule\n');
      });
      assert.deepEqual(scope.vars, {
        validVar1: 'machin',
        ASimpleVar: {},
        validVar2: 'bidule'
      });
    });

    it("when there are an empty node at end", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars');
      assert.doesNotThrow(function() {
          myVarStream.read('validVar1=machin\nASimpleVar.anode.=truc\nvalidVar2=bidule\n');
      });
      assert.deepEqual(scope.vars, {
        validVar1: 'machin',
        ASimpleVar: {},
        validVar2: 'bidule'
      });
    });

    it("when there malformed nodes at start", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars');
      assert.doesNotThrow(function() {
          myVarStream.read('validVar1=machin\n$%*.ASimpleVar.anode.$=truc\nvalidVar2=bidule\n');
      });
      assert.deepEqual(scope.vars, {
        validVar1: 'machin',
        validVar2: 'bidule'
      });
    });

    it("when there malformed nodes somewhere", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars');
      assert.doesNotThrow(function() {
          myVarStream.read('validVar1=machin\nASimpleVar.anode.$.another=truc\nvalidVar2=bidule\n');
      });
      assert.deepEqual(scope.vars, {
        validVar1: 'machin',
        ASimpleVar: {},
        validVar2: 'bidule'
      });
    });

    it("when there malformed nodes at end", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars');
      assert.doesNotThrow(function() {
          myVarStream.read('validVar1=machin\nASimpleVar.anode.$=truc\nvalidVar2=bidule\n');
      });
      assert.deepEqual(scope.vars, {
        validVar1: 'machin',
        ASimpleVar: {},
        validVar2: 'bidule'
      });
    });

    it("there are malformed backward reference in a leftval", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars');
      assert.doesNotThrow(function() {
          myVarStream.read('validVar1=machin\n^3g.SimpleVar.anode=truc\nvalidVar2=bidule\n');
      });
      assert.deepEqual(scope.vars, {
        validVar1: 'machin',
        validVar2: 'bidule'
      });
    });

    it("there are malformed backward reference in a leftval 2", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars');
      assert.doesNotThrow(function() {
          myVarStream.read('validVar1=machin\n^g3.SimpleVar.anode=truc\nvalidVar2=bidule\n');
      });
      assert.deepEqual(scope.vars, {
        validVar1: 'machin',
        validVar2: 'bidule'
      });
    });

    it("there are malformed backward reference in a righval", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars');
      assert.doesNotThrow(function() {
          myVarStream.read('validVar1=machin\nASimpleVar.anode&=^3g.truc\nvalidVar2=bidule\n');
      });
      assert.deepEqual(scope.vars, {
        validVar1: 'machin',
        ASimpleVar: {anode: null},
        validVar2: 'bidule'
      });
    });

    it("there are malformed backward reference in a righval 2", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars');
      assert.doesNotThrow(function() {
          myVarStream.read('validVar1=machin\nASimpleVar.anode&=^g3.truc\nvalidVar2=bidule\n');
      });
      assert.deepEqual(scope.vars, {
        validVar1: 'machin',
        ASimpleVar: {anode: null},
        validVar2: 'bidule'
      });
    });

    it("there are out of range backward reference in a leftval", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars');
      assert.doesNotThrow(function() {
          myVarStream.read('validVar1=machin\n^12.ASimpleVar.anode=truc\nvalidVar2=bidule\n');
      });
      assert.deepEqual(scope.vars, {
        validVar1: 'machin',
        validVar2: 'bidule'
      });
    });/*

    it("there are out of range backward reference in a rightval", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars');
      assert.doesNotThrow(function() {
          myVarStream.read('validVar1=machin\nASimpleVar.anode+=^12.truc.truc\nvalidVar2=bidule\n');
      });
      assert.deepEqual(scope.vars, {
        validVar1: 'machin',
        ASimpleVar: {anode: null},
        validVar2: 'bidule'
      });
    });*/

    it("a legal char is escaped", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars');
      assert.doesNotThrow(function() {
          myVarStream.read('validVar1=machin\nASimpleVar.anode=truc\\truc\nvalidVar2=bidule\n');
      });
      assert.deepEqual(scope.vars, {
        validVar1: 'machin',
        ASimpleVar: {anode: 'truc\\truc'},
        validVar2: 'bidule'
      });
    });

    it("a legal char is escaped in a multiline value", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars');
      assert.doesNotThrow(function() {
          myVarStream.read('validVar1=machin\nASimpleVar.anode=truc\\\ntruc\\truc\nvalidVar2=bidule\n');
      });
      assert.deepEqual(scope.vars, {
        validVar1: 'machin',
        ASimpleVar: {anode: 'truc\ntruc\\truc'},
        validVar2: 'bidule'
      });
    });

  });

  describe("in strict mode, should raise exceptions when", function() {

    it("a line ends with no =", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars',
        VarStream.Reader.STRICT_MODE);
      assert.throws(
        function() {
          myVarStream.read('ASimpleVar\n');
        },
        function(err) {
        if(err instanceof Error
          &&err.message==='Unexpected new line found while parsing '
              +' a leftValue.') {
            return true;
          }
        }
      );
    });

    it("a line has no lvalue", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars',
        VarStream.Reader.STRICT_MODE);
      assert.throws(
        function() {
          myVarStream.read('=ASimpleVar\n');
        },
        function(err) {
        if(err instanceof Error
          &&err.message==='Found an empty leftValue.') {
            return true;
          }
        }
      );
    });

    it("a line ends with no value after &=", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars',
        VarStream.Reader.STRICT_MODE);
      assert.throws(
        function() {
          myVarStream.read('ASimpleVar&=\n');
        },
        function(err) {
        if(err instanceof Error
          &&err.message==='Found an empty rightValue.') {
            return true;
          }
        }
      );
    });

    it("a line ends with no value after +=", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars',
        VarStream.Reader.STRICT_MODE);
      assert.throws(
        function() {
          myVarStream.read('ASimpleVar+=\n');
        },
        function(err) {
        if(err instanceof Error
          &&err.message==='Found an empty rightValue.') {
            return true;
          }
        }
      );
    });

    it("a line ends with no value after -=", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars',
        VarStream.Reader.STRICT_MODE);
      assert.throws(
        function() {
          myVarStream.read('ASimpleVar-=\n');
        },
        function(err) {
        if(err instanceof Error
          &&err.message==='Found an empty rightValue.') {
            return true;
          }
        }
      );
    });

    it("a line ends with no value after *=", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars',
        VarStream.Reader.STRICT_MODE);
      assert.throws(
        function() {
          myVarStream.read('ASimpleVar*=\n');
        },
        function(err) {
        if(err instanceof Error
          &&err.message==='Found an empty rightValue.') {
            return true;
          }
        }
      );
    });

    it("a line ends with no value after /=", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars',
        VarStream.Reader.STRICT_MODE);
      assert.throws(
        function() {
          myVarStream.read('ASimpleVar/=\n');
        },
        function(err) {
        if(err instanceof Error
          &&err.message==='Found an empty rightValue.') {
            return true;
          }
        }
      );
    });

    it("there are a empty node at start", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars',
        VarStream.Reader.STRICT_MODE);
      assert.throws(
        function() {
          myVarStream.read('.ASimpleVar=true\n');
        },
        function(err) {
        if(err instanceof Error
          &&err.message==='The leftValue can\'t have empty nodes'
            +' (.ASimpleVar).') {
            return true;
          }
        }
      );
    });

    it("there are a empty node somewhere", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars',
        VarStream.Reader.STRICT_MODE);
      assert.throws(
        function() {
          myVarStream.read('ASimpleVar.prop..prop.prop=true\n');
        },
        function(err) {
        if(err instanceof Error
          &&err.message==='The leftValue can\'t have empty nodes'
            +' (ASimpleVar.prop..prop.prop).') {
            return true;
          }
        }
      );
    });

    it("there are a empty node at end", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars',
        VarStream.Reader.STRICT_MODE);
      assert.throws(
        function() {
          myVarStream.read('ASimpleVar.=false\n');
        },
        function(err) {
        if(err instanceof Error
          &&err.message==='The leftValue can\'t have empty nodes (ASimpleVar.).') {
            return true;
          }
        }
      );
    });

    it("there are malformed nodes", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars',
        VarStream.Reader.STRICT_MODE);
      assert.throws(
        function() {
          myVarStream.read('ASimp-+leVar.ds+d=false\n');
        },
        function(err) {
        if(err instanceof Error
          &&err.message==='Unexpected char after the "-" operator. Expected "="'
            +' found "+".') {
            return true;
          }
        }
      );
    });

    it("there are malformed nodes", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars',
        VarStream.Reader.STRICT_MODE);
      assert.throws(
        function() {
          myVarStream.read('ASimpleVar.ds$d=false\n');
        },
        function(err) {
        if(err instanceof Error
          &&err.message==='Illegal chars found in a the node "ds$d".') {
            return true;
          }
        }
      );
    });

    it("there are out of range backward reference", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars',
        VarStream.Reader.STRICT_MODE);
      assert.throws(
        function() {
          myVarStream.read('ASimpleVar.prop1.prop2=false\n^4.test=true\n');
        },
        function(err) {
        if(err instanceof Error
          &&err.message==='Backward reference index is greater than the'
            +' previous node max index.') {
            return true;
          }
        }
      );
    });

    it("there are malformed backward reference in a righval", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars',
        VarStream.Reader.STRICT_MODE);
      assert.throws(
        function() {
          myVarStream.read('ASimpleVar.prop1.prop2=false\n^4b.test=true\n');
        },
        function(err) {
        if(err instanceof Error
          &&err.message==='Malformed backward reference.') {
            return true;
          }
        }
      );
    });

    it("there are malformed backward reference in a righval 2", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars',
        VarStream.Reader.STRICT_MODE);
      assert.throws(
        function() {
          myVarStream.read('ASimpleVar.prop1.prop2=false\n^b5.test=true\n');
        },
        function(err) {
        if(err instanceof Error
          &&err.message==='Malformed backward reference.') {
            return true;
          }
        }
      );
    });

    it("there are malformed backward reference in a leftval", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars',
        VarStream.Reader.STRICT_MODE);
      assert.throws(
        function() {
          myVarStream.read('^b5.test=true\n');
        },
        function(err) {
        if(err instanceof Error
          &&err.message==='Malformed backward reference.') {
            return true;
          }
        }
      );
    });

    it("there are malformed backward reference in a leftval 2", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars',
        VarStream.Reader.STRICT_MODE);
      assert.throws(
        function() {
          myVarStream.read('^5b.test=true\n');
        },
        function(err) {
        if(err instanceof Error
          &&err.message==='Malformed backward reference.') {
            return true;
          }
        }
      );
    });

    it("there are bad range backward reference in a leftval", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars',
        VarStream.Reader.STRICT_MODE);
      assert.throws(
        function() {
          myVarStream.read('^8.test=true\n');
        },
        function(err) {
        if(err instanceof Error
          &&err.message==='Backward reference index is greater than the previous node max index.') {
            return true;
          }
        }
      );
    });

    it("a legal char is escaped", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars',
        VarStream.Reader.STRICT_MODE);
      assert.throws(
        function() {
          myVarStream.read('test=t\\rue\n');
        },
        function(err) {
        if(err instanceof Error
          &&err.message==='Found an escape char but there was nothing to escape.') {
            return true;
          }
        }
      );
    });

    it("a legal char is escaped in a multiline value", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars',
        VarStream.Reader.STRICT_MODE);
      assert.throws(
        function() {
          myVarStream.read('test=truc\\\ntruc\\truc\n');
        },
        function(err) {
        if(err instanceof Error
          &&err.message==='Found an escape char but there was nothing to escape.') {
            return true;
          }
        }
      );
    });

    it("an operator is not folled by =", function() {
      var scope = {};
      var myVarStream=new VarStream.Reader(scope,'vars',
        VarStream.Reader.STRICT_MODE);
      assert.throws(
        function() {
          myVarStream.read('test&\n');
        },
        function(err) {
        if(err instanceof Error
          &&err.message==='Unexpected char after the "&" operator. Expected "=" found "\n".') {
            return true;
          }
        }
      );
    });

  });

});


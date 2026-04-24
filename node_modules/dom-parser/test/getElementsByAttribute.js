describe('getting elements by attribute', function () {
  var
    chai = require('chai'),
    assert = chai.assert;

  var
    DomParser = require('../index.js'),
    parser = new DomParser();

  context('Dom', function(){
    it('similar attribute names', function(){
      var html =
        '<form id="form">\n' +
        '  <input name="example" type="text"/><span>text</span>\n' +
        '  <span bad-name="example">text</span>\n' +
        '  <span name-similar="example">text</span>\n' +
        '  <div class="example"></div>\n' +
        '  <span>example</span>\n' +
        '</form>';

      var
        dom = parser.parseFromString(html),
        elements = dom.getElementsByName('example');

      assert.equal(elements.length, 1, 'html contains 1 elements with name "example"');
    });
  });

  context('Dom', function(){
    it('spaces and case', function(){
      var html =
        '<form id="form">\n' +
        '  <input name="example" type="text"/><span>text</span>\n' +
        '  <div class="example"></div>\n' +
        '  <span>example</span>\n' +
        '  <div class=" example"></div>\n' +
        '  <div class="  example">' +
        '     <input class="input" name="example">' +
        '     <input class="input" name="exaMple">' +
        '  </div>\n' +
        '  </div>\n' +
        '</form>';

      var
        dom = parser.parseFromString(html),
        elements = dom.getElementsByName('example');

      assert.equal(elements.length, 2, 'html contains 2 elements with name "example"');
    });
  });

});
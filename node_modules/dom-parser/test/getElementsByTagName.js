describe('getting elements by tag name', function () {
  var
    chai = require('chai'),
    assert = chai.assert;

  var
    DomParser = require('../index.js'),
    parser = new DomParser();

  context('Dom', function(){
    it('divs and spans', function(){
      var html =
        '<div class="examples">\n' +
        '  <span>text</span>\n' +
        '  <div class="example"></div>\n' +
        '  <span>text</span>\n' +
        '  <div class=" example"></div>\n' +
        '  <div class="  example"></div>\n' +
        '  <span>text</span>\n' +
        '  <div class="exAmple    "></div>\n' +
        '  <span>text</span>\n' +
        '  <div class=" asd example ss"></div>\n' +
        '  <div class=" sd examples"></div>\n' +
        '  <span>text</span>\n' +
        '  <div class=" example as">' +
        '  </div>\n' +
        '</div>';

      var
        dom = parser.parseFromString(html),
        divs = dom.getElementsByTagName('div'),
        spans = dom.getElementsByTagName('span');

      assert.equal(divs.length, 8, 'html contains 8 elements with tagName "div"');
      assert.equal(spans.length, 5, 'html contains 5 elements with tagName "span"');
    });
  });

  context('Node', function(){
    it('divs and spans', function(){
      var html =
        '<div class="examples root">\n' +
        '  <span>text</span>\n' +
        '  <div class="example"></div>\n' +
        '  <span>text</span>\n' +
        '  <div class=" example"></div>\n' +
        '  <div class="  example"></div>\n' +
        '  <span>text</span>\n' +
        '  <div class="exAmple    "></div>\n' +
        '  <span>text</span>\n' +
        '  <div class=" asd example ss"></div>\n' +
        '  <div class=" sd examples"></div>\n' +
        '  <span>text</span>\n' +
        '  <div class=" example as">' +
        '  </div>\n' +
        '</div>';

      var
        dom = parser.parseFromString(html),
        root = dom.getElementsByClassName('root')[0],
        divs = root.getElementsByTagName('div'),
        spans = root.getElementsByTagName('span');

      assert.equal(divs.length, 7, 'root element contains 8 elements with tagName "div"');
      assert.equal(spans.length, 5, 'root element contains 5 elements with tagName "span"');
    });
  });
});
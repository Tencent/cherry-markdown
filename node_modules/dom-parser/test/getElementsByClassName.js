describe('getting elements by class name', function () {
  var
    chai = require('chai'),
    assert = chai.assert;

  var
    DomParser = require('../index.js'),
    parser = new DomParser();

  context('Dom', function(){
    it('spaces and case', function(){
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
        elements = dom.getElementsByClassName('example');

      assert.equal(elements.length, 5, 'html contains 5 elements with className "example"');
    });

    it('nested elements', function(){
      var html =
        '<div class="examples">\n' +
        '  <span>text</span>\n' +
        '  <div class="example"></div>\n' +
        '  <span>text</span>\n' +
        '  <div class=" example"></div>\n' +
        '  <div class="  example"></div>\n' +
        '  <span>text</span>\n' +
        '  <div class="example    "></div>\n' +
        '  <span>text</span>\n' +
        '  <div class=" asd example ss"></div>\n' +
        '  <div class=" sd examples"></div>\n' +
        '  <span>text</span>\n' +
        '  <div class=" example as nasted">' +
        '    <div class="examples">\n' +
        '      <span>text</span>\n' +
        '      <div class="example"></div>\n' +
        '      <span>text</span>\n' +
        '      <div class=" example"></div>\n' +
        '      <div class="  example"></div>\n' +
        '      <span>text</span>\n' +
        '      <div class="example    "></div>\n' +
        '      <span>text</span>\n' +
        '      <div class=" asd example ss"></div>\n' +
        '      <div class=" sd examples"></div>\n' +
        '      <span>text</span>\n' +
        '      <div class=" example as nasted">' +
        '      </div>\n' +
        '    </div>' +
        '  </div>\n' +
        '</div>';

      var
        dom = parser.parseFromString(html),
        elements = dom.getElementsByClassName('example');

      assert.equal(elements.length, 12, 'html contains 12 elements with className "example"');
    });
  });

  context('Node', function(){
    it('root: spaces and case', function(){
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
        elements = root.getElementsByClassName('example');


      assert.equal(elements.length, 5, 'root element contains 5 elements with className "example"');
    });

    it('nested elements', function(){
      var html =
        '<div class="  root examples">\n' +
        '  <span>text</span>\n' +
        '  <div class="example"></div>\n' +
        '  <span>text</span>\n' +
        '  <div class=" example"></div>\n' +
        '  <div class="  example"></div>\n' +
        '  <span>text</span>\n' +
        '  <div class="example    "></div>\n' +
        '  <span>text</span>\n' +
        '  <div class=" asd example ss"></div>\n' +
        '  <div class=" sd examples"></div>\n' +
        '  <span>text</span>\n' +
        '  <div class=" example as nasted">' +
        '    <div class="examples">\n' +
        '      <span>text</span>\n' +
        '      <div class="example"></div>\n' +
        '      <span>text</span>\n' +
        '      <div class=" example"></div>\n' +
        '      <div class="  example"></div>\n' +
        '      <span>text</span>\n' +
        '      <div class="example    "></div>\n' +
        '      <span>text</span>\n' +
        '      <div class=" asd example ss"></div>\n' +
        '      <div class=" sd examples"></div>\n' +
        '      <span>text</span>\n' +
        '      <div class=" example as nasted">' +
        '      </div>\n' +
        '    </div>' +
        '  </div>\n' +
        '</div>';

      var
        dom = parser.parseFromString(html),
        root = dom.getElementsByClassName('root')[0],
        elements = root.getElementsByClassName('example');

      assert.equal(elements.length, 12, 'root element contains 12 elements with className "example"');
    });
  });


});
describe('getting element by id', function () {
  var
    chai = require('chai'),
    assert = chai.assert;

  var
    DomParser = require('../index.js'),
    parser = new DomParser();

  context('Dom', function(){
    it('getting element by id', function(){
      var html =
        '<div class="examples">\n' +
        '  <span>text</span>\n' +
        '  <div class="example"></div>\n' +
        '  <span>text</span>\n' +
        '  <div id="example" class="example with id"></div>\n' +
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
        element = dom.getElementById('example'),
        notExistsElement = dom.getElementById('notExists');

      assert.equal(element.getAttribute('class'), 'example with id', 'element must have attribute class "example with id"');
      assert.equal(notExistsElement, null, 'must be null')
    });

    it('getting only first element', function(){
      var html =
        '<div class="examples">\n' +
        '  <span>text</span>\n' +
        '  <div id="example" class="first example"></div>\n' +
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
        '      <div id="example" class="second example"></div>\n' +
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
        element = dom.getElementById('example');

      assert.equal(element.getAttribute('class'), 'first example', 'element must have attribute class "first example"');
    });
  });


  context('Node', function(){
    it('getting element by id', function(){
      var html =
        '<div id="root" class="examples">\n' +
        '  <span>text</span>\n' +
        '  <div class="example"></div>\n' +
        '  <span>text</span>\n' +
        '  <div id="example" class="example with id"></div>\n' +
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
        root = dom.getElementById('root'),
        element = root.getElementById('example'),
        notExistsElement = root.getElementById('notExists');

      assert.equal(element.getAttribute('class'), 'example with id', 'element must have attribute class "example with id"');
      assert.equal(notExistsElement, null, 'must be null');
    });

    it('getting only first element', function(){
      var html =
        '<div id="root" class="examples">\n' +
        '  <span>text</span>\n' +
        '  <div id="example" class="first example"></div>\n' +
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
        '      <div id="example" class="second example"></div>\n' +
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
        root = dom.getElementById('root'),
        element = dom.getElementById('example');

      assert.equal(element.getAttribute('class'), 'first example', 'element must have attribute class "first example"');
    });
  });



});
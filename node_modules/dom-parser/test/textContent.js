describe('textContent', function () {
  var
    chai = require('chai'),
    assert = chai.assert;

  var
    DomParser = require('../index.js'),
    parser = new DomParser();

  it('unclosed tag', function(){
    var html =
      '<div id="root">\n' +
      '  <div class="container">\n' +
      '    some text\n' +
      '    <span>\n' +
      '      <div class="broken">\n' +
      '        <div class="inner"> 123 </div>\n' +
      '      </div>\n' +
      '    some text\n' +
      '    </span>\n' +
      '  </div>\n' +
      '</div>';

    var
      dom = parser.parseFromString(html),
      ctn = dom.getElementById('root');

    assert.equal(ctn.textContent, '\n \n some text\n \n \n 123 \n \n some text\n \n \n');

  });
});
describe('outerHTML', function () {
  var
    chai = require('chai'),
    assert = chai.assert,
    compare = require('dom-compare').compare;

  var
    DomParser = require('../index.js'),
    parser = new DomParser();

  it('unclosed tag', function(){
    var html =
      '<div id="root">\n' +
      '  <div class="container">\n' +
      '    <span>\n' +
      '      <div class="broken">\n' +
      '        <div class="inner">1</div>\n' +
      '      </div>\n' +
      '    </span>\n' +
      '  </div>\n' +
      '</div>';

    var
      dom = parser.parseFromString(html),
      ctn = dom.getElementById('root');

    assert.equal(ctn.outerHTML, html);

  });
});
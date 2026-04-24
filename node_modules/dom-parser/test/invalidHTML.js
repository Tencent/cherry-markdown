describe('invalid html', function () {
  var
    compareStrings = require('dom-compare').compareStrings,
    reporter       = require('dom-compare').GroupingReporter,
    chai           = require('chai'),
    assert         = chai.assert;

  var
    DomParser = require('../index.js'),
    parser = new DomParser();

  it('unclosed tag', function(){
    var
      invalidHTML =
        '<div id="root">\n' +
        '  <div class="container">\n' +
        '    <span>\n' +
        '      <div class="broken">\n' +
        '        <div class="inner">1</div>\n' +

        '    </span>\n' +
        '  </div>\n' +
        '</div>',
      validHTML =
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
      dom = parser.parseFromString(invalidHTML),
      ctn = dom.getElementById('root');

    var compareResult = compareStrings(ctn.outerHTML, validHTML);

    assert.equal(compareResult.getResult(), true, reporter.report(compareResult));

  });

  it ('excess closing tag', function(){
    var
      invalidHTML =
        '<div id="root">\n' +
        '  <span>\n' +
        '    <div class="broken">\n' +
        '      <div class="inner">1</div>\n' +
        '    </div>\n' +
        '    </div>\n' +
        '  </span>\n' +
        '  <span>\n' +
        '    <div class="broken">\n' +
        '      <div class="inner">1</div>\n' +
        '    </div>\n' +
        '    </div>\n' +
        '  </span>\n' +
        '</div>\n'
      ,
      validHTML =
        '<div id="root">\n' +
        '  <span>\n' +
        '    <div class="broken">\n' +
        '      <div class="inner">1</div>\n' +
        '    </div>\n' +
        '  </span>\n' +
        '  <span>\n' +
        '    <div class="broken">\n' +
        '      <div class="inner">1</div>\n' +
        '    </div>\n' +
        '  </span>\n' +
        '</div>';

    var
      dom = parser.parseFromString(invalidHTML),
      ctn = dom.getElementById('root');

    var compareResult = compareStrings(ctn.outerHTML, validHTML);

    assert.equal(compareResult.getResult(), true, reporter.report(compareResult));
  });
});
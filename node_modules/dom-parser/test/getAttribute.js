describe('getAttribute', function () {
  var
    chai = require('chai'),
    assert = chai.assert;

  var
    DomParser = require('../index.js'),
    parser = new DomParser();

  it('attr value with "="', function(){
    var html =
      '<div id="outer" data-a ttt  =  "asd\'">\n' +
      '  <a id="inner" href="/search?field=123"></a>\n' +
      '</div>';

    var
      dom = parser.parseFromString(html),
      outer = dom.getElementById('outer'),
      inner;

      inner = dom.getElementById('inner');

    assert.equal(outer.attributes.length, 3);
    assert.equal(outer.getAttribute('id'), 'outer');
    assert.equal(outer.getAttribute('data-a'), '');
    assert.equal(outer.getAttribute('ttt'), 'asd\'');
    assert.strictEqual(outer.getAttribute('not-exists'), null);
    assert.equal(inner.getAttribute('href'), '/search?field=123');

  });
});


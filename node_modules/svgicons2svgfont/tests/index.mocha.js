/* eslint-disable newline-per-chained-call */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ucs2 = require('punycode').ucs2;

const SVGIcons2SVGFontStream = require('../src/index.js');
const StringDecoder = require('string_decoder').StringDecoder;
const SVGIconsDirStream = require('../src/iconsdir');
const streamtest = require('streamtest');

const neatequal = require('neatequal');
const codepoint = require('./expected/test-codepoint.json');

// Helpers
function generateFontToFile(options, done, fileSuffix, startUnicode, files) {
  // eslint-disable-line
  const dest = path.join(
    __dirname,
    'results',
    `${options.fontName + (fileSuffix || '')}.svg`
  );

  options.log = () => {};
  options.round = options.round || 1e3;
  const svgFontStream = new SVGIcons2SVGFontStream(options);

  svgFontStream.pipe(fs.createWriteStream(dest)).on('finish', () => {
    assert.equal(
      fs.readFileSync(dest, { encoding: 'utf8' }),
      fs.readFileSync(
        path.join(
          __dirname,
          'expected',
          `${options.fontName + (fileSuffix || '')}.svg`
        ),
        { encoding: 'utf8' }
      )
    );
    done();
  });

  new SVGIconsDirStream(
    files || path.join(__dirname, 'fixtures', options.fontName),
    {
      startUnicode: startUnicode || 0xe001,
    }
  ).pipe(svgFontStream);
}

function generateFontToMemory(options, done, files, startUnicode) {
  let content = '';
  const decoder = new StringDecoder('utf8');

  options.log = () => {};
  options.round = options.round || 1e3;

  options.callback = glyphs => {
    const fontName = options.fontName;

    neatequal(glyphs, codepoint[fontName]);
  };

  const svgFontStream = new SVGIcons2SVGFontStream(options);

  svgFontStream.on('data', chunk => {
    content += decoder.write(chunk);
  });

  svgFontStream.on('finish', () => {
    assert.equal(
      content,
      fs.readFileSync(
        path.join(__dirname, 'expected', `${options.fontName}.svg`),
        { encoding: 'utf8' }
      )
    );
    done();
  });

  new SVGIconsDirStream(
    files || path.join(__dirname, 'fixtures', options.fontName),
    {
      startUnicode: startUnicode || 0xe001,
    }
  ).pipe(svgFontStream);
}

// Tests
describe('Generating fonts to files', () => {
  it('should work for simple SVG', done => {
    generateFontToFile(
      {
        fontName: 'originalicons',
      },
      done
    );
  });

  it('should work for simple fixedWidth and normalize option', done => {
    generateFontToFile(
      {
        fontName: 'originalicons',
        fixedWidth: true,
        normalize: true,
      },
      done,
      'n'
    );
  });

  it('should work for simple SVG', done => {
    generateFontToFile(
      {
        fontName: 'cleanicons',
      },
      done
    );
  });

  it('should work for simple SVG and custom ascent', done => {
    generateFontToFile(
      {
        fontName: 'cleanicons',
        ascent: 100,
      },
      done,
      '-ascent'
    );
  });

  it('should work for simple SVG and custom properties', done => {
    generateFontToFile(
      {
        fontName: 'cleanicons',
        fontStyle: 'italic',
        fontWeight: 'bold',
      },
      done,
      '-stw'
    );
  });

  it('should work for codepoint mapped SVG icons', done => {
    generateFontToFile(
      {
        fontName: 'prefixedicons',
        callback: () => {},
      },
      done
    );
  });

  it('should work with multipath SVG icons', done => {
    generateFontToFile(
      {
        fontName: 'multipathicons',
      },
      done
    );
  });

  it('should work with simple shapes SVG icons', done => {
    generateFontToFile(
      {
        fontName: 'shapeicons',
      },
      done
    );
  });

  it('should work with variable height icons', done => {
    generateFontToFile(
      {
        fontName: 'variableheighticons',
      },
      done
    );
  });

  it('should work with variable height icons and the normalize option', done => {
    generateFontToFile(
      {
        fontName: 'variableheighticons',
        normalize: true,
      },
      done,
      'n'
    );
  });

  it('should work with variable width icons', done => {
    generateFontToFile(
      {
        fontName: 'variablewidthicons',
      },
      done
    );
  });

  it('should work with centered variable width icons and the fixed width option', done => {
    generateFontToFile(
      {
        fontName: 'variablewidthicons',
        fixedWidth: true,
        centerHorizontally: true,
      },
      done,
      'n'
    );
  });

  it('should work with a font id', done => {
    generateFontToFile(
      {
        fontName: 'variablewidthicons',
        fixedWidth: true,
        centerHorizontally: true,
        fontId: 'plop',
      },
      done,
      'id'
    );
  });

  it('should work with scaled icons', done => {
    generateFontToFile(
      {
        fontName: 'scaledicons',
        fixedWidth: true,
        centerHorizontally: true,
        fontId: 'plop',
      },
      done
    );
  });

  it('should not display hidden paths', done => {
    generateFontToFile(
      {
        fontName: 'hiddenpathesicons',
      },
      done
    );
  });

  it('should work with real world icons', done => {
    generateFontToFile(
      {
        fontName: 'realicons',
      },
      done
    );
  });

  it('should work with rendering test SVG icons', done => {
    generateFontToFile(
      {
        fontName: 'rendricons',
      },
      done
    );
  });

  it('should work with a single SVG icon', done => {
    generateFontToFile(
      {
        fontName: 'singleicon',
      },
      done
    );
  });

  it('should work with transformed SVG icons', done => {
    generateFontToFile(
      {
        fontName: 'transformedicons',
      },
      done
    );
  });

  it('should work when horizontally centering SVG icons', done => {
    generateFontToFile(
      {
        fontName: 'tocentericons',
        centerHorizontally: true,
      },
      done
    );
  });

  it('should work when vertically centering SVG icons', done => {
    generateFontToFile(
      {
        fontName: 'toverticalcentericons',
        centerVertically: true,
      },
      done
    );
  });

  it('should work with a icons with path with fill none', done => {
    generateFontToFile(
      {
        fontName: 'pathfillnone',
      },
      done
    );
  });

  it('should work with shapes with rounded corners', done => {
    generateFontToFile(
      {
        fontName: 'roundedcorners',
      },
      done
    );
  });

  it('should work with a lot of icons', done => {
    generateFontToFile(
      {
        fontName: 'lotoficons',
      },
      done,
      '',
      0,
      [
        'tests/fixtures/cleanicons/account.svg',
        'tests/fixtures/cleanicons/arrow-down.svg',
        'tests/fixtures/cleanicons/arrow-left.svg',
        'tests/fixtures/cleanicons/arrow-right.svg',
        'tests/fixtures/cleanicons/arrow-up.svg',
        'tests/fixtures/cleanicons/basket.svg',
        'tests/fixtures/cleanicons/close.svg',
        'tests/fixtures/cleanicons/minus.svg',
        'tests/fixtures/cleanicons/plus.svg',
        'tests/fixtures/cleanicons/search.svg',
        'tests/fixtures/hiddenpathesicons/sound--off.svg',
        'tests/fixtures/hiddenpathesicons/sound--on.svg',
        'tests/fixtures/multipathicons/kikoolol.svg',
        'tests/fixtures/originalicons/mute.svg',
        'tests/fixtures/originalicons/sound.svg',
        'tests/fixtures/originalicons/speaker.svg',
        'tests/fixtures/realicons/diegoliv.svg',
        'tests/fixtures/realicons/hannesjohansson.svg',
        'tests/fixtures/realicons/roelvanhitum.svg',
        'tests/fixtures/realicons/safety-icon.svg',
        'tests/fixtures/realicons/sb-icon.svg',
        'tests/fixtures/realicons/settings-icon.svg',
        'tests/fixtures/realicons/track-icon.svg',
        'tests/fixtures/realicons/web-icon.svg',
        'tests/fixtures/roundedcorners/roundedrect.svg',
        'tests/fixtures/shapeicons/circle.svg',
        'tests/fixtures/shapeicons/ellipse.svg',
        'tests/fixtures/shapeicons/lines.svg',
        'tests/fixtures/shapeicons/polygon.svg',
        'tests/fixtures/shapeicons/polyline.svg',
        'tests/fixtures/shapeicons/rect.svg',
        'tests/fixtures/tocentericons/bottomleft.svg',
        'tests/fixtures/tocentericons/center.svg',
        'tests/fixtures/tocentericons/topright.svg',
      ]
    );
  });

  it('should work with rotated rectangle icon', done => {
    generateFontToFile(
      {
        fontName: 'rotatedrectangle',
      },
      done
    );
  });

  /**
   * Issue #6
   * icon by @paesku
   * https://github.com/nfroidure/svgicons2svgfont/issues/6#issuecomment-125545925
   */
  it('should work with complicated nested transforms', done => {
    generateFontToFile(
      {
        fontName: 'paesku',
        round: 1e3,
      },
      done
    );
  });

  /**
   * Issue #76
   * https://github.com/nfroidure/svgicons2svgfont/issues/76#issue-259831969
   */
  it('should work with transform=translate(x) without y', done => {
    generateFontToFile(
      {
        fontName: 'translatex',
        round: 1e3,
      },
      done
    );
  });

  it('should work when only rx is present', done => {
    generateFontToFile(
      {
        fontName: 'onlywithrx',
      },
      done
    );
  });

  it('should work when only ry is present', done => {
    generateFontToFile(
      {
        fontName: 'onlywithry',
      },
      done
    );
  });
});

describe('Generating fonts to memory', () => {
  it('should work for simple SVG', done => {
    generateFontToMemory(
      {
        fontName: 'originalicons',
      },
      done
    );
  });

  it('should work for simple SVG', done => {
    generateFontToMemory(
      {
        fontName: 'cleanicons',
      },
      done
    );
  });

  it('should work for codepoint mapped SVG icons', done => {
    generateFontToMemory(
      {
        fontName: 'prefixedicons',
      },
      done
    );
  });

  it('should work with multipath SVG icons', done => {
    generateFontToMemory(
      {
        fontName: 'multipathicons',
      },
      done
    );
  });

  it('should work with simple shapes SVG icons', done => {
    generateFontToMemory(
      {
        fontName: 'shapeicons',
      },
      done
    );
  });
});

describe('Using options', () => {
  it('should work with fixedWidth option set to true', done => {
    generateFontToFile(
      {
        fontName: 'originalicons',
        fixedWidth: true,
      },
      done,
      '2'
    );
  });

  it('should work with custom fontHeight option', done => {
    generateFontToFile(
      {
        fontName: 'originalicons',
        fontHeight: 800,
      },
      done,
      '3'
    );
  });

  it('should work with custom descent option', done => {
    generateFontToFile(
      {
        fontName: 'originalicons',
        descent: 200,
      },
      done,
      '4'
    );
  });

  it('should work with fixedWidth set to true and with custom fontHeight option', done => {
    generateFontToFile(
      {
        fontName: 'originalicons',
        fontHeight: 800,
        fixedWidth: true,
      },
      done,
      '5'
    );
  });

  it(
    'should work with fixedWidth and centerHorizontally set to true and with' +
      ' custom fontHeight option',
    done => {
      generateFontToFile(
        {
          fontName: 'originalicons',
          fontHeight: 800,
          fixedWidth: true,
          centerHorizontally: true,
          round: 1e5,
        },
        done,
        '6'
      );
    }
  );

  it(
    'should work with fixedWidth, normalize and centerHorizontally set to' +
      ' true and with custom fontHeight option',
    done => {
      generateFontToFile(
        {
          fontName: 'originalicons',
          fontHeight: 800,
          normalize: true,
          fixedWidth: true,
          centerHorizontally: true,
          round: 1e5,
        },
        done,
        '7'
      );
    }
  );

  it(
    'should work with fixedWidth, normalize and centerHorizontally set to' +
      ' true and with a large custom fontHeight option',
    done => {
      generateFontToFile(
        {
          fontName: 'originalicons',
          fontHeight: 5000,
          normalize: true,
          fixedWidth: true,
          centerHorizontally: true,
          round: 1e5,
        },
        done,
        '8'
      );
    }
  );

  it('should work with nested icons', done => {
    generateFontToFile(
      {
        fontName: 'nestedicons',
      },
      done,
      '',
      0xea01
    );
  });
});

describe('Passing code points', () => {
  it('should work with multiple unicode values for a single icon', done => {
    const svgIconStream = fs.createReadStream(
      path.join(__dirname, 'fixtures', 'cleanicons', 'account.svg')
    );

    const svgFontStream = new SVGIcons2SVGFontStream({ round: 1e3 });
    let content = '';
    const decoder = new StringDecoder('utf8');

    svgIconStream.metadata = {
      name: 'account',
      unicode: ['\uE001', '\uE002'],
    };

    svgFontStream.on('data', chunk => {
      content += decoder.write(chunk);
    });

    svgFontStream.on('finish', () => {
      assert.equal(
        content,
        fs.readFileSync(
          path.join(__dirname, 'expected', 'cleanicons-multi.svg'),
          { encoding: 'utf8' }
        )
      );
      done();
    });
    svgFontStream.write(svgIconStream);
    svgFontStream.end();
  });

  it('should work with ligatures', done => {
    const svgIconStream = fs.createReadStream(
      path.join(__dirname, 'fixtures', 'cleanicons', 'account.svg')
    );
    const svgFontStream = new SVGIcons2SVGFontStream({ round: 1e3 });
    let content = '';
    const decoder = new StringDecoder('utf8');

    svgIconStream.metadata = {
      name: 'account',
      unicode: ['\uE001\uE002'],
    };

    svgFontStream.on('data', chunk => {
      content += decoder.write(chunk);
    });

    svgFontStream.on('finish', () => {
      assert.equal(
        content,
        fs.readFileSync(
          path.join(__dirname, 'expected', 'cleanicons-lig.svg'),
          { encoding: 'utf8' }
        )
      );
      done();
    });
    svgFontStream.write(svgIconStream);
    svgFontStream.end();
  });

  it('should work with high code points', done => {
    const svgIconStream = fs.createReadStream(
      path.join(__dirname, 'fixtures', 'cleanicons', 'account.svg')
    );
    const svgFontStream = new SVGIcons2SVGFontStream({ round: 1e3 });
    let content = '';
    const decoder = new StringDecoder('utf8');

    svgIconStream.metadata = {
      name: 'account',
      unicode: [ucs2.encode([0x1f63a])],
    };

    svgFontStream.on('data', chunk => {
      content += decoder.write(chunk);
    });

    svgFontStream.on('finish', () => {
      assert.equal(
        content,
        fs.readFileSync(
          path.join(__dirname, 'expected', 'cleanicons-high.svg'),
          { encoding: 'utf8' }
        )
      );
      done();
    });
    svgFontStream.write(svgIconStream);
    svgFontStream.end();
  });
});

describe('Providing bad glyphs', () => {
  it('should fail when not providing glyph name', done => {
    const svgIconStream = fs.createReadStream(
      path.join(__dirname, 'fixtures', 'cleanicons', 'account.svg')
    );

    svgIconStream.metadata = {
      unicode: '\uE001',
    };
    new SVGIcons2SVGFontStream({ round: 1e3 })
      .on('error', err => {
        assert.equal(err instanceof Error, true);
        assert.equal(
          err.message,
          'Please provide a name for the glyph at index 0'
        );
        done();
      })
      .write(svgIconStream);
  });

  it('should fail when not providing codepoints', done => {
    const svgIconStream = fs.createReadStream(
      path.join(__dirname, 'fixtures', 'cleanicons', 'account.svg')
    );

    svgIconStream.metadata = {
      name: 'test',
    };
    new SVGIcons2SVGFontStream({ round: 1e3 })
      .on('error', err => {
        assert.equal(err instanceof Error, true);
        assert.equal(
          err.message,
          'Please provide a codepoint for the glyph "test"'
        );
        done();
      })
      .write(svgIconStream);
  });

  it('should fail when providing unicode value with duplicates', done => {
    const svgIconStream = fs.createReadStream(
      path.join(__dirname, 'fixtures', 'cleanicons', 'account.svg')
    );

    svgIconStream.metadata = {
      name: 'test',
      unicode: ['\uE002', '\uE002'],
    };
    new SVGIcons2SVGFontStream({ round: 1e3 })
      .on('error', err => {
        assert.equal(err instanceof Error, true);
        assert.equal(
          err.message,
          'Given codepoints for the glyph "test" contain duplicates.'
        );
        done();
      })
      .write(svgIconStream);
  });

  it('should fail when providing the same codepoint twice', done => {
    const svgIconStream = fs.createReadStream(
      path.join(__dirname, 'fixtures', 'cleanicons', 'account.svg')
    );
    const svgIconStream2 = fs.createReadStream(
      path.join(__dirname, 'fixtures', 'cleanicons', 'account.svg')
    );
    const svgFontStream = new SVGIcons2SVGFontStream({ round: 1e3 });

    svgIconStream.metadata = {
      name: 'test',
      unicode: '\uE002',
    };
    svgIconStream2.metadata = {
      name: 'test2',
      unicode: '\uE002',
    };
    svgFontStream.on('error', err => {
      assert.equal(err instanceof Error, true);
      assert.equal(
        err.message,
        'The glyph "test2" codepoint seems to be used already elsewhere.'
      );
      done();
    });
    svgFontStream.write(svgIconStream);
    svgFontStream.write(svgIconStream2);
  });

  it('should fail when providing the same name twice', done => {
    const svgIconStream = fs.createReadStream(
      path.join(__dirname, 'fixtures', 'cleanicons', 'account.svg')
    );
    const svgIconStream2 = fs.createReadStream(
      path.join(__dirname, 'fixtures', 'cleanicons', 'account.svg')
    );
    const svgFontStream = new SVGIcons2SVGFontStream({ round: 1e3 });

    svgIconStream.metadata = {
      name: 'test',
      unicode: '\uE001',
    };
    svgIconStream2.metadata = {
      name: 'test',
      unicode: '\uE002',
    };
    svgFontStream.on('error', err => {
      assert.equal(err instanceof Error, true);
      assert.equal(err.message, 'The glyph name "test" must be unique.');
      done();
    });
    svgFontStream.write(svgIconStream);
    svgFontStream.write(svgIconStream2);
  });

  it('should fail when providing bad pathdata', done => {
    const svgIconStream = fs.createReadStream(
      path.join(__dirname, 'fixtures', 'badicons', 'pathdata.svg')
    );

    svgIconStream.metadata = {
      name: 'test',
      unicode: ['\uE002'],
    };
    new SVGIcons2SVGFontStream({ round: 1e3 })
      .on('error', err => {
        assert.equal(err instanceof Error, true);
        assert.equal(
          err.message,
          'Got an error parsing the glyph "test":' +
            ' Expected a flag, got "120" at index "23".'
        );
        done();
      })
      .on('end', () => {
        done();
      })
      .write(svgIconStream);
  });

  it('should fail when providing bad XML', done => {
    const svgIconStream = streamtest.v2.fromChunks(['bad', 'xml']);

    svgIconStream.metadata = {
      name: 'test',
      unicode: ['\uE002'],
    };

    let firstError = true

    new SVGIcons2SVGFontStream({ round: 1e3 })
      .on('error', err => {
        assert.equal(err instanceof Error, true);

        if (firstError) {
          firstError = false
          assert.equal(
            err.message,
            'Non-whitespace before first tag.\nLine: 0\nColumn: 1\nChar: b'
          );

          done();
        }
      })
      .write(svgIconStream);
  });
});

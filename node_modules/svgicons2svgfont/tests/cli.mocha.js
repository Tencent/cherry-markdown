/* eslint-disable prefer-template */
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const childProcess = require('child_process');

describe('Testing CLI', () => {
  it('should work for simple SVG', done => {
    const command =
      `${'node' + ' '}${path.join(
        __dirname,
        '..',
        'bin',
        'svgicons2svgfont.js'
      )} -o ${path.join(
        __dirname,
        'results',
        'originalicons-cli.svg'
      )} -s 0xE001` +
      ` ${path.join(__dirname, 'fixtures', 'originalicons', '*.svg')}`;

    childProcess.exec(command, err => {
      if (err) {
        throw err;
      }
      assert.equal(
        fs.readFileSync(
          path.join(__dirname, 'results', 'originalicons-cli.svg'),
          { encoding: 'utf8' }
        ),
        fs.readFileSync(
          path.join(__dirname, 'expected', 'originalicons-cli.svg'),
          { encoding: 'utf8' }
        )
      );
      done();
    });
  });

  it('should work for more than 32 SVG icons', done => {
    const command =
      'node' +
      ' ' +
      path.join(__dirname, '..', 'bin', 'svgicons2svgfont.js') +
      ' -o ' +
      path.join(__dirname, 'results', 'lotoficons-cli.svg') +
      ' -s 0xE001' +
      ' -r 1e4' +
      ' ' +
      path.join(__dirname, 'fixtures', 'cleanicons', '*.svg') +
      ' ' +
      path.join(__dirname, 'fixtures', 'hiddenpathesicons', '*.svg') +
      ' ' +
      path.join(__dirname, 'fixtures', 'multipathicons', 'kikoolol.svg') +
      ' ' +
      path.join(__dirname, 'fixtures', 'originalicons', '*.svg') +
      ' ' +
      path.join(__dirname, 'fixtures', 'realicons', '*.svg') +
      ' ' +
      path.join(__dirname, 'fixtures', 'roundedcorners', '*.svg') +
      ' ' +
      path.join(__dirname, 'fixtures', 'shapeicons', '*.svg') +
      ' ' +
      path.join(__dirname, 'fixtures', 'tocentericons', '*.svg');

    childProcess.exec(command, err => {
      if (err) {
        throw err;
      }
      assert.equal(
        fs.readFileSync(path.join(__dirname, 'results', 'lotoficons-cli.svg'), {
          encoding: 'utf8',
        }),
        fs.readFileSync(
          path.join(__dirname, 'expected', 'lotoficons-cli.svg'),
          { encoding: 'utf8' }
        )
      );
      done();
    });
  });

  describe('with nested icons', () => {
    it('should work', done => {
      const command = `${'node' + ' '}${path.join(
        __dirname,
        '..',
        'bin',
        'svgicons2svgfont.js'
      )} -o ${path.join(
        __dirname,
        'results',
        'nestedicons-cli.svg'
      )} ${path.join(__dirname, 'fixtures', 'nestedicons', '*.svg')}`;

      childProcess.exec(command, err => {
        if (err) {
          throw err;
        }
        assert.equal(
          fs.readFileSync(
            path.join(__dirname, 'results', 'nestedicons-cli.svg'),
            { encoding: 'utf8' }
          ),
          fs.readFileSync(
            path.join(__dirname, 'expected', 'nestedicons-cli.svg'),
            { encoding: 'utf8' }
          )
        );
        done();
      });
    });
  });
});

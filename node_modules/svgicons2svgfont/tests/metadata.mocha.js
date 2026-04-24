/* eslint max-nested-callbacks:0 */

'use strict';

const metadata = require('../src/metadata.js');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

require('string.fromcodepoint');

describe('Metadata service', () => {
  it('should throw error when using old options', () => {
    assert.throws(
      metadata.bind(metadata, {
        appendUnicode: true,
      })
    );
  });

  describe('for code generation', () => {
    it('should extract right unicodes from files', done => {
      const metadataService = metadata();

      metadataService('/var/plop/hello.svg', (err, infos) => {
        if (err) {
          done(err);
          return;
        }
        assert.deepEqual(infos, {
          path: '/var/plop/hello.svg',
          name: 'hello',
          unicode: [String.fromCharCode(0xea01)],
          renamed: false,
        });
        done();
      });
    });

    it('should append unicodes to files when the option is set', done => {
      const metadataService = metadata({
        prependUnicode: true,
        log: () => {},
        error: () => {
          done(new Error('Not supposed to be here'));
        },
      });

      fs.writeFileSync(
        path.join(__dirname, 'results', 'plop.svg'),
        'plop',
        'utf-8'
      );
      metadataService(
        path.join(__dirname, 'results', 'plop.svg'),
        (err, infos) => {
          if (err) {
            done(err);
            return;
          }
          assert.deepEqual(infos, {
            path: path.join(__dirname, 'results', 'uEA01-plop.svg'),
            name: 'plop',
            unicode: [String.fromCharCode(0xea01)],
            renamed: true,
          });
          assert(
            fs.existsSync(path.join(__dirname, 'results', 'uEA01-plop.svg'))
          );
          assert(!fs.existsSync(path.join(__dirname, 'results', 'plop.svg')));
          fs.unlinkSync(path.join(__dirname, 'results', 'uEA01-plop.svg'));
          done();
        }
      );
    });

    it('should log file rename errors', done => {
      const metadataService = metadata({
        prependUnicode: true,
        startUnicode: 0xea02,
        error: () => {},
        log: () => {
          done(new Error('Not supposed to be here'));
        },
      });

      metadataService(
        path.join(__dirname, 'results', 'plop.svg'),
        (err, infos) => {
          assert(!infos);
          assert(err);
          assert(
            !fs.existsSync(path.join(__dirname, 'results', 'uEA02-plop.svg'))
          );
          done();
        }
      );
    });
  });

  describe('for code extraction', () => {
    it('should work for simple codes', done => {
      const metadataService = metadata();

      metadataService('/var/plop/u0001-hello.svg', (err, infos) => {
        assert(!err);
        assert.deepEqual(infos, {
          path: '/var/plop/u0001-hello.svg',
          name: 'hello',
          unicode: [String.fromCharCode(0x0001)],
          renamed: false,
        });
        done();
      });
    });

    it('should work for several codes', done => {
      const metadataService = metadata();

      metadataService('/var/plop/u0001,u0002-hello.svg', (err, infos) => {
        assert(!err);
        assert.deepEqual(infos, {
          path: '/var/plop/u0001,u0002-hello.svg',
          name: 'hello',
          unicode: [String.fromCharCode(0x0001), String.fromCharCode(0x0002)],
          renamed: false,
        });
        done();
      });
    });

    it('should work for higher codepoint codes', done => {
      const metadataService = metadata();

      metadataService('/var/plop/u1F63A-hello.svg', (err, infos) => {
        assert(!err);
        assert.deepEqual(infos, {
          path: '/var/plop/u1F63A-hello.svg',
          name: 'hello',
          unicode: [String.fromCodePoint(0x1f63a)],
          renamed: false,
        });
        done();
      });
    });

    it('should work for ligature codes', done => {
      const metadataService = metadata();

      metadataService('/var/plop/u0001u0002-hello.svg', (err, infos) => {
        assert(!err);
        assert.deepEqual(infos, {
          path: '/var/plop/u0001u0002-hello.svg',
          name: 'hello',
          unicode: [String.fromCharCode(0x0001) + String.fromCharCode(0x0002)],
          renamed: false,
        });
        done();
      });
    });

    it('should work for nested codes', done => {
      const metadataService = metadata();

      metadataService('/var/plop/u0001u0002,u0001-hello.svg', (err, infos) => {
        assert(!err);
        assert.deepEqual(infos, {
          path: '/var/plop/u0001u0002,u0001-hello.svg',
          name: 'hello',
          unicode: [
            String.fromCharCode(0x0001) + String.fromCharCode(0x0002),
            String.fromCharCode(0x0001),
          ],
          renamed: false,
        });
        done();
      });
    });

    it('should not set the same codepoint twice', done => {
      const metadataService = metadata();

      metadataService('/var/plop/uEA01-hello.svg', (err, infos) => {
        assert(!err);
        assert.deepEqual(infos, {
          path: '/var/plop/uEA01-hello.svg',
          name: 'hello',
          unicode: [String.fromCharCode(0xea01)],
          renamed: false,
        });
        metadataService('/var/plop/plop.svg', (err2, infos2) => {
          assert(!err2);
          assert.deepEqual(infos2, {
            path: '/var/plop/plop.svg',
            name: 'plop',
            unicode: [String.fromCharCode(0xea02)],
            renamed: false,
          });
          done();
        });
      });
    });

    it('should not set the same codepoint twice with different cases', done => {
      const metadataService = metadata();

      metadataService('/var/plop/UEA01-hello.svg', (err, infos) => {
        assert(!err);
        assert.deepEqual(infos, {
          path: '/var/plop/UEA01-hello.svg',
          name: 'hello',
          unicode: [String.fromCharCode(0xea01)],
          renamed: false,
        });
        metadataService('/var/plop/uEA02-hello.svg', (err2, infos2) => {
          assert(!err2);
          assert.deepEqual(infos2, {
            path: '/var/plop/uEA02-hello.svg',
            name: 'hello',
            unicode: [String.fromCharCode(0xea02)],
            renamed: false,
          });
          metadataService('/var/plop/bell-o.svg', (err3, infos3) => {
            assert(!err3);
            assert.deepEqual(infos3, {
              path: '/var/plop/bell-o.svg',
              name: 'bell-o',
              unicode: [String.fromCharCode(0xea03)],
              renamed: false,
            });
            done();
          });
        });
      });
    });
  });
});

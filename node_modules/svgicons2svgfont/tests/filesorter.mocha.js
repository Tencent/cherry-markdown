'use strict';

const fileSorter = require('../src/filesorter.js');
const assert = require('assert');

describe('fileSorter', () => {
  it('should sort files per filename', () => {
    assert.deepEqual(
      [
        '/var/plop/c.svg',
        '/var/plop/a.svg',
        '/var/plop/A.svg',
        '/var/plop/C.svg',
        '/var/plop/B.svg',
        '/var/plop/b.svg',
      ].sort(fileSorter),
      [
        '/var/plop/A.svg',
        '/var/plop/B.svg',
        '/var/plop/C.svg',
        '/var/plop/a.svg',
        '/var/plop/b.svg',
        '/var/plop/c.svg',
      ]
    );
  });

  it('should sort files per codepoints', () => {
    assert.deepEqual(
      [
        '/var/plop/uAE01-c.svg',
        '/var/plop/uAE03-a.svg',
        '/var/plop/uAE02-A.svg',
        '/var/plop/uAE06-C.svg',
        '/var/plop/uAE04-B.svg',
        '/var/plop/uAE05-b.svg',
      ].sort(fileSorter),
      [
        '/var/plop/uAE01-c.svg',
        '/var/plop/uAE02-A.svg',
        '/var/plop/uAE03-a.svg',
        '/var/plop/uAE04-B.svg',
        '/var/plop/uAE05-b.svg',
        '/var/plop/uAE06-C.svg',
      ]
    );
  });

  it('should put codepoints first', () => {
    assert.deepEqual(
      [
        '/var/plop/uAE01-c.svg',
        '/var/plop/uAE03-a.svg',
        '/var/plop/uAE02-A.svg',
        '/var/plop/C.svg',
        '/var/plop/B.svg',
        '/var/plop/b.svg',
      ].sort(fileSorter),
      [
        '/var/plop/uAE01-c.svg',
        '/var/plop/uAE02-A.svg',
        '/var/plop/uAE03-a.svg',
        '/var/plop/B.svg',
        '/var/plop/C.svg',
        '/var/plop/b.svg',
      ]
    );
  });

  it('should work with the @pinin files', () => {
    assert.deepEqual(
      [
        'bell-disabled.svg',
        'bell-disabled-o.svg',
        'bell-o.svg',
        'UEA01-calendar-agenda.svg',
        'UEA02-calendar-alert.svg',
        'UEA03-calendar.svg',
        'uEA04-bookmark-favorite.svg',
        'uEA05-bookmark-o.svg',
        'uEA06-bookmark.svg',
      ].sort(fileSorter),
      [
        'UEA01-calendar-agenda.svg',
        'UEA02-calendar-alert.svg',
        'UEA03-calendar.svg',
        'uEA04-bookmark-favorite.svg',
        'uEA05-bookmark-o.svg',
        'uEA06-bookmark.svg',
        'bell-disabled.svg',
        'bell-disabled-o.svg',
        'bell-o.svg',
      ]
    );
  });
});

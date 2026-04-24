/* eslint-disable prefer-template,no-confusing-arrow */
'use strict';

const fs = require('fs');
const fileSorter = require('./filesorter');
const initMetadataService = require('../src/metadata');

const Readable = require('stream').Readable;

require('string.prototype.codepointat');

// Constructor
class SVGIconsDirStream extends Readable {
  constructor(dir, options) {
    super({ objectMode: true });
    this.getMetadata = options.metadataProvider || initMetadataService(options);
    this.gotFilesInfos = false;
    this.dir = dir;

    if (dir instanceof Array) {
      const dirCopy = this.dir;

      this.dir = '';
      this._getFilesInfos(dirCopy);
    }
  }
  _getFilesInfos(files) {
    let filesProcessed = 0;

    this.fileInfos = [];
    // Ensure prefixed files come first
    files = files.slice(0).sort(fileSorter);
    files.forEach(file => {
      this.getMetadata(
        (this.dir ? this.dir + '/' : '') + file,
        (err, metadata) => {
          filesProcessed++;
          if (err) {
            this.emit('error', err);
          } else {
            if (metadata.renamed) {
              this.options.log(
                'Saved codepoint: ' +
                  'u' +
                  metadata.unicode[0]
                    .codePointAt(0)
                    .toString(16)
                    .toUpperCase() +
                  ' for the glyph "' +
                  metadata.name +
                  '"'
              );
            }
            this.fileInfos.push(metadata);
          }
          if (files.length === filesProcessed) {
            // Reorder files
            this.fileInfos.sort(
              (infosA, infosB) =>
                infosA.unicode[0] > infosB.unicode[0] ? 1 : -1
            );
            // Mark directory as processed
            this.gotFilesInfos = true;
            // Start processing
            this._pushSVGIcons();
          }
        }
      );
    });
  }

  _pushSVGIcons() {
    let fileInfo;
    let svgIconStream;

    while (this.fileInfos.length) {
      fileInfo = this.fileInfos.shift();
      svgIconStream = fs.createReadStream(fileInfo.path);
      svgIconStream.metadata = {
        name: fileInfo.name,
        unicode: fileInfo.unicode,
      };
      if (!this.push(svgIconStream)) {
        return;
      }
    }
    this.push(null);
  }
  _read() {
    if (!this.fileInfos) {
      fs.readdir(this.dir, (err, files) => {
        if (err) {
          this.emit('error', err);
        }
        this._getFilesInfos(files);
      });
      return;
    }
    if (this.gotFilesInfos) {
      this._pushSVGIcons();
    }
  }
}

module.exports = SVGIconsDirStream;

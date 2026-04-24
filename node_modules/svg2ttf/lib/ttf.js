'use strict';

var _ = require('lodash');
var ByteBuffer = require('microbuffer');

var createGSUBTable    = require('./ttf/tables/gsub');
var createOS2Table    = require('./ttf/tables/os2');
var createCMapTable   = require('./ttf/tables/cmap');
var createGlyfTable   = require('./ttf/tables/glyf');
var createHeadTable   = require('./ttf/tables/head');
var createHHeadTable  = require('./ttf/tables/hhea');
var createHtmxTable   = require('./ttf/tables/hmtx');
var createLocaTable   = require('./ttf/tables/loca');
var createMaxpTable   = require('./ttf/tables/maxp');
var createNameTable   = require('./ttf/tables/name');
var createPostTable   = require('./ttf/tables/post');

var utils = require('./ttf/utils');

// Tables
var TABLES = [
  { innerName: 'GSUB', order: 4,  create: createGSUBTable  }, // GSUB
  { innerName: 'OS/2', order: 4,  create: createOS2Table   }, // OS/2
  { innerName: 'cmap', order: 6,  create: createCMapTable  }, // cmap
  { innerName: 'glyf', order: 8,  create: createGlyfTable  }, // glyf
  { innerName: 'head', order: 2,  create: createHeadTable  }, // head
  { innerName: 'hhea', order: 1,  create: createHHeadTable }, // hhea
  { innerName: 'hmtx', order: 5,  create: createHtmxTable  }, // hmtx
  { innerName: 'loca', order: 7,  create: createLocaTable  }, // loca
  { innerName: 'maxp', order: 3,  create: createMaxpTable  }, // maxp
  { innerName: 'name', order: 9,  create: createNameTable  }, // name
  { innerName: 'post', order: 10, create: createPostTable  }  // post
];

// Various constants
var CONST = {
  VERSION: 0x10000,
  CHECKSUM_ADJUSTMENT: 0xB1B0AFBA
};

function ulong(t) {
  t &= 0xffffffff;
  if (t < 0) {
    t += 0x100000000;
  }
  return t;
}

function calc_checksum(buf) {
  var sum = 0;
  var nlongs = Math.floor(buf.length / 4);
  var i;

  for (i = 0; i < nlongs; ++i) {
    var t = buf.getUint32(i * 4);

    sum = ulong(sum + t);
  }

  var leftBytes = buf.length - nlongs * 4; //extra 1..3 bytes found, because table is not aligned. Need to include them in checksum too.

  if (leftBytes > 0) {
    var leftRes = 0;

    for (i = 0; i < 4; i++) {
      leftRes = (leftRes << 8) + ((i < leftBytes) ? buf.getUint8(nlongs * 4 + i) : 0);
    }
    sum = ulong(sum + leftRes);
  }
  return sum;
}

function generateTTF(font) {

  // Prepare TTF contours objects. Note, that while sfnt countours are classes,
  // ttf contours are just plain arrays of points
  _.forEach(font.glyphs, function (glyph) {
    glyph.ttfContours = _.map(glyph.contours, function (contour) {
      return contour.points;
    });
  });

  // Process ttf contours data
  _.forEach(font.glyphs, function (glyph) {

    // 0.3px accuracy is ok. fo 1000x1000.
    glyph.ttfContours = utils.simplify(glyph.ttfContours, 0.3);
    glyph.ttfContours = utils.simplify(glyph.ttfContours, 0.3); // one pass is not enougth

    // Interpolated points can be removed. 1.1px is acceptable
    // measure - it will give us 1px error after coordinates rounding.
    glyph.ttfContours = utils.interpolate(glyph.ttfContours, 1.1);

    glyph.ttfContours = utils.roundPoints(glyph.ttfContours);
    glyph.ttfContours = utils.removeClosingReturnPoints(glyph.ttfContours);
    glyph.ttfContours = utils.toRelative(glyph.ttfContours);
  });

  // Add tables
  var headerSize = 12 + 16 * TABLES.length; // TTF header plus table headers
  var bufSize = headerSize;

  _.forEach(TABLES, function (table) {
    //store each table in its own buffer
    table.buffer = table.create(font);
    table.length = table.buffer.length;
    table.corLength = table.length + (4 - table.length % 4) % 4; // table size should be divisible to 4
    table.checkSum = calc_checksum(table.buffer);
    bufSize += table.corLength;
  });

  //calculate offsets
  var offset = headerSize;

  _.forEach(_.sortBy(TABLES, 'order'), function (table) {
    table.offset = offset;
    offset += table.corLength;
  });

  //create TTF buffer

  var buf = new ByteBuffer(bufSize);

  //special constants
  var entrySelector = Math.floor(Math.log(TABLES.length) / Math.LN2);
  var searchRange = Math.pow(2, entrySelector) * 16;
  var rangeShift = TABLES.length * 16 - searchRange;

  // Add TTF header
  buf.writeUint32(CONST.VERSION);
  buf.writeUint16(TABLES.length);
  buf.writeUint16(searchRange);
  buf.writeUint16(entrySelector);
  buf.writeUint16(rangeShift);

  _.forEach(TABLES, function (table) {
    buf.writeUint32(utils.identifier(table.innerName)); //inner name
    buf.writeUint32(table.checkSum); //checksum
    buf.writeUint32(table.offset); //offset
    buf.writeUint32(table.length); //length
  });

  var headOffset = 0;

  _.forEach(_.sortBy(TABLES, 'order'), function (table) {
    if (table.innerName === 'head') { //we must store head offset to write font checksum
      headOffset = buf.tell();
    }
    buf.writeBytes(table.buffer.buffer);
    for (var i = table.length; i < table.corLength; i++) { //align table to be divisible to 4
      buf.writeUint8(0);
    }
  });

  // Write font checksum (corrected by magic value) into HEAD table
  buf.setUint32(headOffset + 8, ulong(CONST.CHECKSUM_ADJUSTMENT - calc_checksum(buf)));

  return buf;
}

module.exports = generateTTF;

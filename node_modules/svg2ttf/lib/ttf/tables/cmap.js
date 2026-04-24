'use strict';

// See documentation here: http://www.microsoft.com/typography/otspec/cmap.htm

var _ = require('lodash');
var ByteBuffer = require('microbuffer');

function getIDByUnicode(font, unicode) {
  return font.codePoints[unicode] ? font.codePoints[unicode].id : 0;
}

// Calculate character segments with non-interruptable chains of unicodes
function getSegments(font, bounds) {
  bounds = bounds || Number.MAX_VALUE;

  var result = [];
  var segment;

  // prevEndCode only changes when a segment closes
  _.forEach(font.codePoints, function (glyph, unicode) {
    unicode = parseInt(unicode, 10);
    if (unicode >= bounds) {
      return false;
    }
    // Initialize first segment or add new segment if code "hole" is found
    if (!segment || unicode !== (segment.end + 1)) {
      if (segment) {
        result.push(segment);
      }
      segment = {
        start: unicode
      };
    }
    segment.end = unicode;
  });

  // Need to finish the last segment
  if (segment) {
    result.push(segment);
  }

  _.forEach(result, function (segment) {
    segment.length = segment.end - segment.start + 1;
  });

  return result;
}

// Returns an array of {unicode, glyph} sets for all valid code points up to bounds
function getCodePoints(codePoints, bounds) {
  bounds = bounds || Number.MAX_VALUE;

  var result = [];

  _.forEach(codePoints, function (glyph, unicode) {
    unicode = parseInt(unicode, 10);
    // Since this is a sparse array, iterating will only yield the valid code points
    if (unicode > bounds) {
      return false;
    }
    result.push({
      unicode: unicode,
      glyph: glyph
    });
  });
  return result;
}

function bufferForTable(format, length) {
  var fieldWidth = format === 8 || format === 10 || format === 12 || format === 13 ? 4 : 2;

  length += (0
    + fieldWidth // Format
    + fieldWidth // Length
    + fieldWidth // Language
  );

  var LANGUAGE = 0;
  var buffer = new ByteBuffer(length);

  var writer = fieldWidth === 4 ? buffer.writeUint32 : buffer.writeUint16;

  // Format specifier
  buffer.writeUint16(format);
  if (fieldWidth === 4) {
    // In case of formats 8.…, 10.…, 12.… and 13.…, this is the decimal part of the format number
    // But since have not been any point releases, this can be zero in that case as well
    buffer.writeUint16(0);
  }
  // Length
  writer.call(buffer, length);
  // Language code (0, only used for legacy quickdraw tables)
  writer.call(buffer, LANGUAGE);

  return buffer;
}

function createFormat0Table(font) {
  var FORMAT = 0;

  var i;

  var length = 0xff + 1; //Format 0 maps only single-byte code points

  var buffer = bufferForTable(FORMAT, length);

  for (i = 0; i < length; i++) {
    buffer.writeUint8(getIDByUnicode(font, i)); // existing char in table 0..255
  }
  return buffer;
}

function createFormat4Table(font) {
  var FORMAT = 4;

  var i;

  var segments = getSegments(font, 0xFFFF);
  var glyphIndexArrays = [];

  _.forEach(segments, function (segment) {
    var glyphIndexArray = [];

    for (var unicode = segment.start; unicode <= segment.end; unicode++) {
      glyphIndexArray.push(getIDByUnicode(font, unicode));
    }
    glyphIndexArrays.push(glyphIndexArray);
  });

  var segCount = segments.length + 1; // + 1 for the 0xFFFF section
  var glyphIndexArrayLength = _.reduce(_.map(glyphIndexArrays, 'length'), function (result, count) { return result + count; }, 0);

  var length = (0
    + 2 // segCountX2
    + 2 // searchRange
    + 2 // entrySelector
    + 2 // rangeShift
    + 2 * segCount // endCodes
    + 2 // Padding
    + 2 * segCount //startCodes
    + 2 * segCount //idDeltas
    + 2 * segCount //idRangeOffsets
    + 2 * glyphIndexArrayLength
  );

  var buffer = bufferForTable(FORMAT, length);

  buffer.writeUint16(segCount * 2); // segCountX2
  var maxExponent = Math.floor(Math.log(segCount) / Math.LN2);
  var searchRange = 2 * Math.pow(2, maxExponent);

  buffer.writeUint16(searchRange); // searchRange
  buffer.writeUint16(maxExponent); // entrySelector
  buffer.writeUint16(2 * segCount - searchRange); // rangeShift

  // Array of end counts
  _.forEach(segments, function (segment) {
    buffer.writeUint16(segment.end);
  });
  buffer.writeUint16(0xFFFF); // endCountArray should be finished with 0xFFFF

  buffer.writeUint16(0); // reservedPad

  // Array of start counts
  _.forEach(segments, function (segment) {
    buffer.writeUint16(segment.start); //startCountArray
  });
  buffer.writeUint16(0xFFFF); // startCountArray should be finished with 0xFFFF

  // Array of deltas. Leave it zero to not complicate things when using the glyph index array
  for (i = 0; i < segments.length; i++) {
    buffer.writeUint16(0); // delta is always zero because we use the glyph array
  }
  buffer.writeUint16(1); // idDeltaArray should be finished with 1

  // Array of range offsets
  var offset = 0;

  for (i = 0; i < segments.length; i++) {
    buffer.writeUint16(2 * ((segments.length - i + 1) + offset));
    offset += glyphIndexArrays[i].length;
  }
  buffer.writeUint16(0); // rangeOffsetArray should be finished with 0

  _.forEach(glyphIndexArrays, function (glyphIndexArray) {
    _.forEach(glyphIndexArray, function (glyphId) {
      buffer.writeUint16(glyphId);
    });
  });

  return buffer;
}

function createFormat12Table(font) {
  var FORMAT = 12;

  var codePoints = getCodePoints(font.codePoints);

  var length = (0
    + 4 // nGroups
    + 4 * codePoints.length // startCharCode
    + 4 * codePoints.length // endCharCode
    + 4 * codePoints.length // startGlyphCode
  );

  var buffer = bufferForTable(FORMAT, length);

  buffer.writeUint32(codePoints.length); // nGroups
  _.forEach(codePoints, function (codePoint) {
    buffer.writeUint32(codePoint.unicode); // startCharCode
    buffer.writeUint32(codePoint.unicode); // endCharCode
    buffer.writeUint32(codePoint.glyph.id); // startGlyphCode
  });

  return buffer;
}

function createCMapTable(font) {
  var TABLE_HEAD = (0
    + 2 // platform
    + 2 // encoding
    + 4 // offset
  );

  var singleByteTable = createFormat0Table(font);
  var twoByteTable = createFormat4Table(font);
  var fourByteTable = createFormat12Table(font);

  // Subtable headers must be sorted by platformID, encodingID
  var tableHeaders = [
    // subtable 4, unicode
    {
      platformID: 0,
      encodingID: 3,
      table: twoByteTable
    },
    // subtable 12, unicode
    {
      platformID: 0,
      encodingID: 4,
      table: fourByteTable
    },
    // subtable 0, mac standard
    {
      platformID: 1,
      encodingID: 0,
      table: singleByteTable
    },
    // subtable 4, windows standard, identical to the unicode table
    {
      platformID: 3,
      encodingID: 1,
      table: twoByteTable
    },
    // subtable 12, windows ucs4
    {
      platformID: 3,
      encodingID: 10,
      table: fourByteTable
    }
  ];

  var tables = [
    twoByteTable,
    singleByteTable,
    fourByteTable
  ];

  var tableOffset = (0
    + 2 // version
    + 2 // number of subtable headers
    + tableHeaders.length * TABLE_HEAD
  );

  // Calculate offsets for each table
  _.forEach(tables, function (table) {
    table._tableOffset = tableOffset;
    tableOffset += table.length;
  });

  var length = tableOffset;

  var buffer = new ByteBuffer(length);

  // Write table header.
  buffer.writeUint16(0); // version
  buffer.writeUint16(tableHeaders.length); // count

  // Write subtable headers
  _.forEach(tableHeaders, function (header) {
    buffer.writeUint16(header.platformID); // platform
    buffer.writeUint16(header.encodingID); // encoding
    buffer.writeUint32(header.table._tableOffset); // offset
  });

  // Write subtables
  _.forEach(tables, function (table) {
    buffer.writeBytes(table.buffer);
  });

  return buffer;
}

module.exports = createCMapTable;

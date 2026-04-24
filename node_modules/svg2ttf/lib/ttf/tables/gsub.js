'use strict';

// See documentation here: http://www.microsoft.com/typography/otspec/GSUB.htm

var _ = require('lodash');
var identifier = require('../utils.js').identifier;
var ByteBuffer = require('microbuffer');

function createScript() {
  var scriptRecord = (0
    + 2 // Script DefaultLangSys Offset
    + 2 // Script[0] LangSysCount (0)
  );

  var langSys = (0
    + 2 // Script DefaultLangSys LookupOrder
    + 2 // Script DefaultLangSys ReqFeatureIndex
    + 2 // Script DefaultLangSys FeatureCount (0?)
    + 2 // Script Optional Feature Index[0]
  );

  var length = (0
    + scriptRecord
    + langSys
  );

  var buffer = new ByteBuffer(length);

  // Script Record
  // Offset to the start of langSys from the start of scriptRecord
  buffer.writeUint16(scriptRecord); // DefaultLangSys

  // Number of LangSys entries other than the default (none)
  buffer.writeUint16(0);

  // LangSys record (DefaultLangSys)
  // LookupOrder
  buffer.writeUint16(0);
  // ReqFeatureIndex -> only one required feature: all ligatures
  buffer.writeUint16(0);
  // Number of FeatureIndex values for this language system (excludes the required feature)
  buffer.writeUint16(1);
  // FeatureIndex for the first optional feature
  // Note: Adding the same feature to both the optional
  // and the required features is a clear violation of the spec
  // but it fixes IE not displaying the ligatures.
  // See http://partners.adobe.com/public/developer/opentype/index_table_formats.html, Section “Language System Table”
  // “FeatureCount: Number of FeatureIndex values for this language system-*excludes the required feature*” (emphasis added)
  buffer.writeUint16(0);

  return buffer;
}

function createScriptList() {
  var scriptSize = (0
    + 4 // Tag
    + 2 // Offset
  );

  // tags should be arranged alphabetically
  var scripts = [
    [ 'DFLT', createScript() ],
    [ 'latn', createScript() ]
  ];

  var header = (0
    + 2 // Script count
    + scripts.length * scriptSize
  );

  var tableLengths = _.reduce(_.map(scripts, function (script) { return script[1].length; }), function (result, count) { return result + count; }, 0);

  var length = (0
    + header
    + tableLengths
  );

  var buffer = new ByteBuffer(length);

  // Script count
  buffer.writeUint16(scripts.length);

  // Write all ScriptRecords
  var offset = header;

  _.forEach(scripts, function (script) {
    var name = script[0], table = script[1];

    // Script identifier (DFLT/latn)
    buffer.writeUint32(identifier(name));
    // Offset to the ScriptRecord from start of the script list
    buffer.writeUint16(offset);
    // Increment offset by script table length
    offset += table.length;
  });

  // Write all ScriptTables
  _.forEach(scripts, function (script) {
    var table = script[1];

    buffer.writeBytes(table.buffer);
  });

  return buffer;
}

// Write one feature containing all ligatures
function createFeatureList() {
  var header = (0
    + 2 // FeatureCount
    + 4 // FeatureTag[0]
    + 2 // Feature Offset[0]
  );

  var length = (0
    + header
    + 2 // FeatureParams[0]
    + 2 // LookupCount[0]
    + 2 // Lookup[0] LookupListIndex[0]
  );

  var buffer = new ByteBuffer(length);

  // FeatureCount
  buffer.writeUint16(1);
  // FeatureTag[0]
  buffer.writeUint32(identifier('liga'));
  // Feature Offset[0]
  buffer.writeUint16(header);
  // FeatureParams[0]
  buffer.writeUint16(0);
  // LookupCount[0]
  buffer.writeUint16(1);
  // Index into lookup table. Since we only have ligatures, the index is always 0
  buffer.writeUint16(0);

  return buffer;
}

function createLigatureCoverage(font, ligatureGroups) {
  var glyphCount = ligatureGroups.length;

  var length = (0
    + 2 // CoverageFormat
    + 2 // GlyphCount
    + 2 * glyphCount // GlyphID[i]
  );

  var buffer = new ByteBuffer(length);

  // CoverageFormat
  buffer.writeUint16(1);

  // Length
  buffer.writeUint16(glyphCount);


  _.forEach(ligatureGroups, function (group) {
    buffer.writeUint16(group.startGlyph.id);
  });

  return buffer;
}

function createLigatureTable(font, ligature) {
  var allCodePoints = font.codePoints;

  var unicode = ligature.unicode;

  var length = (0
    + 2 // LigGlyph
    + 2 // CompCount
    + 2 * (unicode.length - 1)
  );

  var buffer = new ByteBuffer(length);

  // LigGlyph
  var glyph = ligature.glyph;

  buffer.writeUint16(glyph.id);

  // CompCount
  buffer.writeUint16(unicode.length);

  // Compound glyphs (excluding first as it’s already in the coverage table)
  for (var i = 1; i < unicode.length; i++) {
    glyph = allCodePoints[unicode[i]];
    buffer.writeUint16(glyph.id);
  }

  return buffer;
}

function createLigatureSet(font, codePoint, ligatures) {
  var ligatureTables = [];

  _.forEach(ligatures, function (ligature) {
    ligatureTables.push(createLigatureTable(font, ligature));
  });

  var tableLengths = _.reduce(_.map(ligatureTables, 'length'), function (result, count) { return result + count; }, 0);

  var offset = (0
    + 2 // LigatureCount
    + 2 * ligatures.length
  );

  var length = (0
    + offset
    + tableLengths
  );

  var buffer = new ByteBuffer(length);

  // LigatureCount
  buffer.writeUint16(ligatures.length);

  // Ligature offsets
  _.forEach(ligatureTables, function (table) {
    // The offset to the current set, from SubstFormat
    buffer.writeUint16(offset);
    offset += table.length;
  });

  // Ligatures
  _.forEach(ligatureTables, function (table) {
    buffer.writeBytes(table.buffer);
  });

  return buffer;
}

function createLigatureList(font, ligatureGroups) {
  var sets = [];

  _.forEach(ligatureGroups, function (group) {
    var set = createLigatureSet(font, group.codePoint, group.ligatures);

    sets.push(set);
  });

  var setLengths = _.reduce(_.map(sets, 'length'), function (result, count) { return result + count; }, 0);

  var coverage = createLigatureCoverage(font, ligatureGroups);

  var tableOffset = (0
    + 2 // Lookup type
    + 2 // Lokup flag
    + 2 // SubTableCount
    + 2 // SubTable[0] Offset
  );

  var setOffset = (0
    + 2 // SubstFormat
    + 2 // Coverage offset
    + 2 // LigSetCount
    + 2 * sets.length // LigSet Offsets
  );

  var coverageOffset = setOffset + setLengths;

  var length = (0
    + tableOffset
    + coverageOffset
    + coverage.length
  );

  var buffer = new ByteBuffer(length);

  // Lookup type 4 – ligatures
  buffer.writeUint16(4);

  // Lookup flag – empty
  buffer.writeUint16(0);

  // Subtable count
  buffer.writeUint16(1);

  // Subtable[0] offset
  buffer.writeUint16(tableOffset);

  // SubstFormat
  buffer.writeUint16(1);

  // Coverage
  buffer.writeUint16(coverageOffset);

  // LigSetCount
  buffer.writeUint16(sets.length);

  _.forEach(sets, function (set) {
    // The offset to the current set, from SubstFormat
    buffer.writeUint16(setOffset);
    setOffset += set.length;
  });

  _.forEach(sets, function (set) {
    buffer.writeBytes(set.buffer);
  });

  buffer.writeBytes(coverage.buffer);

  return buffer;
}

// Add a lookup for each ligature
function createLookupList(font) {
  var ligatures = font.ligatures;

  var groupedLigatures = {};

  // Group ligatures by first code point
  _.forEach(ligatures, function (ligature) {
    var first = ligature.unicode[0];

    if (!_.has(groupedLigatures, first)) {
      groupedLigatures[first] = [];
    }
    groupedLigatures[first].push(ligature);
  });

  var ligatureGroups = [];

  _.forEach(groupedLigatures, function (ligatures, codePoint) {
    codePoint = parseInt(codePoint, 10);
    // Order ligatures by length, descending
    // “Ligatures with more components must be stored ahead of those with fewer components in order to be found”
    // From: http://partners.adobe.com/public/developer/opentype/index_tag7.html#liga
    ligatures.sort(function (ligA, ligB) {
      return ligB.unicode.length - ligA.unicode.length;
    });
    ligatureGroups.push({
      codePoint: codePoint,
      ligatures: ligatures,
      startGlyph: font.codePoints[codePoint]
    });
  });

  ligatureGroups.sort(function (a, b) {
    return a.startGlyph.id - b.startGlyph.id;
  });

  var offset = (0
    + 2 // Lookup count
    + 2 // Lookup[0] offset
  );

  var set = createLigatureList(font, ligatureGroups);

  var length = (0
    + offset
    + set.length
  );

  var buffer = new ByteBuffer(length);

  // Lookup count
  buffer.writeUint16(1);

  // Lookup[0] offset
  buffer.writeUint16(offset);

  // Lookup[0]
  buffer.writeBytes(set.buffer);

  return buffer;
}

function createGSUB(font) {
  var scriptList = createScriptList();
  var featureList = createFeatureList();
  var lookupList = createLookupList(font);

  var lists = [ scriptList, featureList, lookupList ];

  var offset = (0
    + 4 // Version
    + 2 * lists.length // List offsets
  );

  // Calculate offsets
  _.forEach(lists, function (list) {
    list._listOffset = offset;
    offset += list.length;
  });

  var length = offset;
  var buffer = new ByteBuffer(length);

  // Version
  buffer.writeUint32(0x00010000);

  // Offsets
  _.forEach(lists, function (list) {
    buffer.writeUint16(list._listOffset);
  });

  // List contents
  _.forEach(lists, function (list) {
    buffer.writeBytes(list.buffer);
  });

  return buffer;
}

module.exports = createGSUB;

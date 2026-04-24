'use strict';
/*
 * Copyright (C) 2012 Nicolas Froidure
 *
 * This file is free software;
 * you can redistribute it and/or modify it under the terms of the GNU
 * General Public License (GPL) as published by the Free Software
 * Foundation, in version 3. It is distributed in the
 * hope that it will be useful, but WITHOUT ANY WARRANTY of any kind.
 *
 */
var DuplexStream = require('readable-stream').Duplex
  , util = require('util')
  , VarStreamReader = require('./VarStreamReader')
  , VarStreamWriter = require('./VarStreamWriter')
;

// Inherit of duplex stream
util.inherits(VarStream, DuplexStream);

// Constructor
function VarStream(rootObject, rootProperty, options) {
  var self = this;

  // Ensure new were used
  if(!(this instanceof VarStream)) {
    return new VarStream(rootObject, rootProperty, options);
  }

  // Ensure we had root object and property
  if(!(rootObject instanceof Object)) {
    throw new Error('No root object provided.');
  }
  if('string' !== typeof rootProperty || rootProperty == '') {
    throw new Error('No root property name given.');
  }

  // Parent constructor
  DuplexStream.call(this);

  this._varstreamReader=new VarStreamReader(rootObject, rootProperty,
    options ? options&VarStreamReader.OPTIONS : 0);

  this._varstreamWriter = new VarStreamWriter(function(str) {
      self.push(new Buffer(str, 'utf8'));
  }, options ? options&VarStreamWriter.OPTIONS : 0);

  // Parse input
  this._write = function _write(chunk, encoding, done) {
    this._varstreamReader.read(chunk.toString(
      encoding !== 'buffer' ? encoding : 'utf8'
    ));
    done();
  };

  // Output data
  this._read = function _read() {
    this._varstreamWriter.write(rootObject[rootProperty]);
    this.push(null);
  };

}

// Parse helper
VarStream.parse = function(content) {
  var root = {};
  var stream = new VarStream(root, 'prop');
  stream.write(Buffer(content));
  stream.end();
  return root.prop || {};
};

// Export helper
VarStream.stringify = function(obj) {
  var root = {prop: obj}, stream, content;
  if('object' !== typeof obj) {
    throw new Error('The stringified object must be an instance of Object.');
  }
  stream = new VarStream(root, 'prop');
  content = stream.read();
  return String(content);
};

// Exporting
VarStream.VarStreamReader = VarStream.Reader = VarStreamReader;
VarStream.VarStreamWriter = VarStream.Writer = VarStreamWriter;
module.exports = VarStream;

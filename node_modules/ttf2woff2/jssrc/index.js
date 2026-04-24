'use strict';

var theTTFToWOFF2Module = require('./ttf2woff2');

module.exports = function ttf2woff2(inputContent) {
  // Prepare input
  var inputBuffer = theTTFToWOFF2Module._malloc(inputContent.length + 1);
  var outputSizePtr = theTTFToWOFF2Module._malloc(4); // eslint-disable-line
  var outputBufferPtr;
  var outputSize;
  var outputContent;
  var i;

  theTTFToWOFF2Module.writeArrayToMemory(inputContent, inputBuffer);

  // Run
  outputBufferPtr = theTTFToWOFF2Module.convert(
    inputBuffer,
    inputContent.length,
    outputSizePtr,
  );

  // Retrieve output
  outputSize = theTTFToWOFF2Module.getValue(outputSizePtr, 'i32');
  outputContent = Buffer.alloc(outputSize);

  for (i = 0; i < outputSize; i++) {
    outputContent[i] = theTTFToWOFF2Module.getValue(outputBufferPtr + i, 'i8');
  }

  theTTFToWOFF2Module.freePtrs(outputBufferPtr, outputSizePtr);

  return outputContent;
};

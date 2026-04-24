// Emscripten wrapper
#include <emscripten/bind.h>
#include <stdlib.h>
#include "./woff2/woff2_enc.h"

using namespace emscripten;
using std::string;

int getSizePtr() {
  int* sizePtr = reinterpret_cast<int*>(calloc(1, sizeof(int)));
  return reinterpret_cast<int>(sizePtr);
}

int convert(int inputDataAddress, int inputLength, int outputSizePtrAddress) {
  int* outputSizePtr = reinterpret_cast<int*>(outputSizePtrAddress);
  char* inputData = reinterpret_cast<char*>(inputDataAddress);

  size_t outputSize = woff2::MaxWOFF2CompressedSize(
    reinterpret_cast<const uint8_t*>(inputData),
    inputLength
  );

  uint8_t* outputData = reinterpret_cast<uint8_t*>(calloc(outputSize, sizeof(uint8_t)));


  if(!woff2::ConvertTTFToWOFF2(
    reinterpret_cast<const uint8_t*>(inputData),
    inputLength,
    outputData,
    &outputSize
  )) {
    // throw an error
  }

  *outputSizePtr = outputSize;

  return reinterpret_cast<int>(outputData);
}

void freePtrs(int outputDataAddress, int sizePtrAddress) {
  int* sizePtr = reinterpret_cast<int*>(sizePtrAddress);
  char* outputData = reinterpret_cast<char*>(outputDataAddress);
  free(outputData);
  free(sizePtr);
}

EMSCRIPTEN_BINDINGS(ttf2woff2_fallback) {
    function("getSizePtr", &getSizePtr, allow_raw_pointers());
    function("convert", &convert, allow_raw_pointers());
    function("freePtrs", &freePtrs, allow_raw_pointers());
}

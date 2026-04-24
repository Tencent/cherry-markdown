#include <nan.h>
#include <node.h>
#include <node_buffer.h>
#include <stdlib.h>
#include "./woff2/woff2_enc.h"

using namespace v8;

NAN_METHOD(convert) {
  Isolate *isolate = info.GetIsolate();
  Local<Context> context = isolate->GetCurrentContext();
  Local<Object> inputBuffer = info[0]->ToObject(context).ToLocalChecked();

  if (!node::Buffer::HasInstance(inputBuffer)) {
    Nan::ThrowError(Nan::TypeError("First arg should be a Buffer"));
    return;
  }

  size_t input_length = node::Buffer::Length(inputBuffer);
  char* input_data = node::Buffer::Data(inputBuffer);

  // Determine the maximum needed length
  size_t max_output_length = woff2::MaxWOFF2CompressedSize(
    reinterpret_cast<const uint8_t*>(input_data), input_length);
  size_t actual_output_length = max_output_length;

  char* output_data = (char*) calloc(max_output_length, 1);

  // Create the Woff2 font
  if (!woff2::ConvertTTFToWOFF2(
    reinterpret_cast<const uint8_t*>(input_data), input_length,
    reinterpret_cast<uint8_t*>(output_data), &actual_output_length
  )) {
    Nan::ThrowError(Nan::Error("Could not convert the given font."));
    return;
  }

  // Free the unused memory
  output_data = (char*) realloc(output_data, actual_output_length);

  Nan::MaybeLocal<v8::Object> outputBuffer = Nan::NewBuffer(
    output_data,
    actual_output_length
  );

  info.GetReturnValue().Set(outputBuffer.ToLocalChecked());
}


NAN_MODULE_INIT(Init) {
  Nan::Set(target, Nan::New("convert").ToLocalChecked(),
    Nan::GetFunction(Nan::New<FunctionTemplate>(convert)).ToLocalChecked());
}

NODE_MODULE(addon, Init)

// Copyright 2013 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// Helper function for bit twiddling

#ifndef WOFF2_PORT_H_
#define WOFF2_PORT_H_

#include <assert.h>

namespace woff2 {

typedef unsigned int       uint32;

inline int Log2Floor(uint32 n) {
#if defined(__GNUC__)
  return n == 0 ? -1 : 31 ^ __builtin_clz(n);
#else
  if (n == 0)
    return -1;
  int log = 0;
  uint32 value = n;
  for (int i = 4; i >= 0; --i) {
    int shift = (1 << i);
    uint32 x = value >> shift;
    if (x != 0) {
      value = x;
      log += shift;
    }
  }
  assert(value == 1);
  return log;
#endif
}

} // namespace woff2
#endif  // WOFF2_PORT_H_

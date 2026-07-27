/**
 * Copyright (C) 2021 Tencent.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

function createDecoder() {
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder('utf-8');
  }
  return createFallbackUtf8Decoder();
}

function concatBytes(left, right) {
  if (!left.length) {
    return right;
  }
  const bytes = new Uint8Array(left.length + right.length);
  bytes.set(left, 0);
  bytes.set(right, left.length);
  return bytes;
}

function createFallbackUtf8Decoder() {
  let pending = new Uint8Array(0);

  const decode = (buffer) => {
    const bytes = concatBytes(pending, new Uint8Array(buffer || 0));
    let output = '';
    let index = 0;
    pending = new Uint8Array(0);

    while (index < bytes.length) {
      const first = bytes[index];
      let length = 1;
      let codePoint = first;

      if (first >= 0xf0) {
        length = 4;
        codePoint = first & 0x07;
      } else if (first >= 0xe0) {
        length = 3;
        codePoint = first & 0x0f;
      } else if (first >= 0xc0) {
        length = 2;
        codePoint = first & 0x1f;
      } else if (first >= 0x80) {
        output += '\ufffd';
        index += 1;
        continue;
      }

      if (index + length > bytes.length) {
        pending = bytes.slice(index);
        break;
      }

      for (let offset = 1; offset < length; offset += 1) {
        const next = bytes[index + offset];
        if ((next & 0xc0) !== 0x80) {
          codePoint = 0xfffd;
          length = offset;
          break;
        }
        codePoint = (codePoint << 6) | (next & 0x3f);
      }

      output += String.fromCodePoint(codePoint);
      index += length;
    }

    return output;
  };

  return {
    decode(buffer) {
      if (buffer) {
        return decode(buffer);
      }
      const tail = pending.length ? decode(new Uint8Array(0)) : '';
      pending = new Uint8Array(0);
      return tail;
    },
  };
}

function parseSseFrame(frame) {
  const event = {
    data: '',
    event: 'message',
    id: '',
    retry: undefined,
  };

  frame.split('\n').forEach((line) => {
    if (!line || line[0] === ':') {
      return;
    }

    const separatorIndex = line.indexOf(':');
    const field = separatorIndex >= 0 ? line.slice(0, separatorIndex) : line;
    const rawValue = separatorIndex >= 0 ? line.slice(separatorIndex + 1) : '';
    const value = rawValue[0] === ' ' ? rawValue.slice(1) : rawValue;

    if (field === 'data') {
      event.data += event.data ? `\n${value}` : value;
      return;
    }
    if (field === 'event') {
      event.event = value || 'message';
      return;
    }
    if (field === 'id') {
      event.id = value;
      return;
    }
    if (field === 'retry') {
      const retry = Number(value);
      if (!Number.isNaN(retry)) {
        event.retry = retry;
      }
    }
  });

  return event;
}

/**
 * Internal parser for text/event-stream chunks from wx.request({ enableChunked: true }).
 * @returns {{ push(chunk: string | ArrayBuffer): Array<{ data: string; done: boolean }>; end(): Array<{ data: string; done: boolean }>; reset(): void }}
 */
export function createSseChunkParser() {
  const decoder = createDecoder();
  let buffer = '';

  const decodeChunk = (chunk) => {
    if (typeof chunk === 'string') {
      return chunk;
    }
    if (chunk instanceof ArrayBuffer) {
      return decoder.decode(chunk, { stream: true });
    }
    return '';
  };

  const parseFrame = (frame) => {
    const event = parseSseFrame(frame);
    if (event.data === '[DONE]') {
      return { data: '', done: true };
    }
    if (event.data || event.event !== 'message') {
      return { data: event.data, done: false };
    }
    return null;
  };

  return {
    push(chunk) {
      buffer += decodeChunk(chunk).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      const frames = buffer.split('\n\n');
      buffer = frames.pop() || '';
      return frames.map(parseFrame).filter(Boolean);
    },

    end() {
      if (decoder) {
        buffer += decoder.decode();
      }
      const frames = [];
      if (buffer.trim()) {
        frames.push(parseFrame(buffer));
      }
      buffer = '';
      return frames.filter(Boolean);
    },

    reset() {
      buffer = '';
    },
  };
}

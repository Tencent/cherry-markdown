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

function normalizeSsePayloadField(field) {
  return field === 'delta' || field === 'text' ? field : 'content';
}

/**
 * Splits markdown into stream chunks for local MiniProgram demos and tests.
 * This helper is not a Markdown parser; Cherry still owns all rendering semantics.
 * It only keeps syntactic spans together when simulating SSE locally so demos do not
 * need Markdown-aware regexes in page code.
 * @param {string} markdown
 * @returns {string[]}
 */
export function createMiniProgramStreamChunks(markdown = '') {
  const source = String(markdown || '');
  const chunks = [];
  let index = 0;

  while (index < source.length) {
    const rest = source.slice(index);
    const fencedBlock = rest.match(/^```[\s\S]*?```/);
    const mathBlock = rest.match(/^\$\$[\s\S]*?\$\$/);
    const image = rest.match(/^!\[[^\]]*\]\([^)]+\)/);
    const link = rest.match(/^\[[^\]]+\]\([^)]+\)/);
    const inlineMath = rest.match(/^\$[^$\n]+\$/);
    const chunk = fencedBlock?.[0] || mathBlock?.[0] || image?.[0] || link?.[0] || inlineMath?.[0];

    if (chunk) {
      chunks.push(chunk);
      index += chunk.length;
      continue;
    }

    const [char] = Array.from(rest);
    chunks.push(char);
    index += char.length;
  }

  return chunks;
}

/**
 * Creates text/event-stream frames for local demos from markdown chunks.
 * @param {string} markdown
 * @param {{ field?: 'content' | 'delta' | 'text'; includeDone?: boolean }} [options]
 * @returns {string[]}
 */
export function createMiniProgramSseFrames(markdown = '', options = {}) {
  const field = normalizeSsePayloadField(options.field);
  const frames = createMiniProgramStreamChunks(markdown).map((chunk) => {
    const payload = { [field]: chunk };
    return `data: ${JSON.stringify(payload)}\n\n`;
  });

  if (options.includeDone !== false) {
    frames.push('data: [DONE]\n\n');
  }

  return frames;
}

/**
 * @typedef {{ data: string; event: string; id: string; retry?: number }} MiniProgramSseEvent
 * @typedef {{ onMessage?: (event: MiniProgramSseEvent) => void; onDone?: () => void }} MiniProgramSseParserOptions
 */

/**
 * Parses text/event-stream chunks from wx.request({ enableChunked: true }).
 * @param {MiniProgramSseParserOptions} [options]
 */
export function createSseParser(options = {}) {
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

  const emitFrame = (frame) => {
    const event = parseSseFrame(frame);
    if (event.data === '[DONE]') {
      if (options.onDone) {
        options.onDone();
      }
      return;
    }
    if (event.data || event.event !== 'message') {
      if (options.onMessage) {
        options.onMessage(event);
      }
    }
  };

  return {
    push(chunk) {
      buffer += decodeChunk(chunk).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      const frames = buffer.split('\n\n');
      buffer = frames.pop() || '';
      frames.forEach(emitFrame);
    },

    end() {
      if (decoder) {
        buffer += decoder.decode();
      }
      if (buffer.trim()) {
        emitFrame(buffer);
      }
      buffer = '';
    },

    reset() {
      buffer = '';
    },
  };
}

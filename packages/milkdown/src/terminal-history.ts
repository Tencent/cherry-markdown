type LineEnding = { style: 'lf' | 'crlf'; suffix: string };

function lineEnding(raw: string): LineEnding | undefined {
  const withoutPairs = raw.replace(/\r\n/g, '');
  if (withoutPairs.includes('\r') || (raw.includes('\r') && withoutPairs.includes('\n'))) return undefined;
  return { style: raw.includes('\r') ? 'crlf' : 'lf', suffix: raw.match(/(?:\r\n|\n)*$/)![0] };
}

function historyKey(serialized: string) {
  return serialized.replace(/\r\n/g, '\n').trimEnd();
}

function normalizeListMarkers(raw: string) {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/^([ \t]*)[*+-](?=[ \t])/gm, '$1-')
    .trimEnd();
}

/** Keep uniform CRLF when the serializer falls back to its LF representation. */
export function preserveLineEndings(raw: string, candidate: string, matchesDocument: (candidate: string) => boolean) {
  if (lineEnding(raw)?.style !== 'crlf' || !candidate.includes('\n')) return candidate;
  const normalized = candidate.replace(/\r\n/g, '\n');
  if (normalized.includes('\r')) return candidate;
  const converted = normalized.replace(/\n/g, '\r\n');
  if (converted === candidate) return candidate;
  return matchesDocument(converted) ? converted : candidate;
}

/** Remember only unambiguous line-ending conventions for recent serialized documents. */
export function createTerminalHistory(limit = 100, maxCharacters = 1_000_000) {
  const counts = new Map<string, LineEnding | null>();
  const sources = new Map<string, string | null>();
  let characters = 0;
  let sourceCharacters = 0;

  const rememberSource = (serialized: string, raw: string) => {
    if (serialized.length + raw.length > maxCharacters || limit < 1) return;
    const previous = sources.get(serialized);
    if (sources.delete(serialized)) sourceCharacters -= serialized.length + (previous?.length ?? 0);
    const next = previous === undefined ? raw : previous === raw ? raw : null;
    sources.set(serialized, next);
    sourceCharacters += serialized.length + (next?.length ?? 0);
    while (sources.size > limit || sourceCharacters > maxCharacters) {
      const oldest = sources.keys().next().value!;
      sourceCharacters -= oldest.length + (sources.get(oldest)?.length ?? 0);
      sources.delete(oldest);
    }
  };

  const remember = (key: string, raw: string) => {
    if (key.length > maxCharacters || limit < 1) return;
    // Mark mixed endings as ambiguous, including when a previous observation
    // of the same serialized state had a uniform convention.
    const ending = lineEnding(raw) ?? null;
    const previous = counts.get(key);
    if (counts.delete(key)) characters -= key.length;
    counts.set(
      key,
      previous === undefined
        ? ending
        : ending && previous?.style === ending.style && previous.suffix === ending.suffix
          ? ending
          : null,
    );
    characters += key.length;
    while (counts.size > limit || characters > maxCharacters) {
      const oldest = counts.keys().next().value!;
      counts.delete(oldest);
      characters -= oldest.length;
    }
  };
  return {
    clear() {
      counts.clear();
      sources.clear();
      characters = 0;
      sourceCharacters = 0;
    },
    remember(serialized: string, raw: string) {
      remember(`=${serialized}`, raw);
      rememberSource(serialized, raw);
    },
    rememberExternalAlias(serialized: string, raw: string) {
      remember(`~${historyKey(serialized)}`, raw);
    },
    restore(serialized: string, raw: string, matchesDocument: (candidate: string) => boolean) {
      const exact = `=${serialized}`;
      const ending = counts.has(exact) ? counts.get(exact) : counts.get(`~${historyKey(serialized)}`);
      if (!ending || !lineEnding(raw)) return raw;
      const content = raw.replace(/\r\n/g, '\n').replace(/\n+$/, '');
      const candidate = `${ending.style === 'crlf' ? content.replace(/\n/g, '\r\n') : content}${ending.suffix}`;
      return candidate === raw || matchesDocument(candidate) ? candidate : raw;
    },
    restoreSource(
      serialized: string,
      raw: string,
      matchesDocument: (candidate: string) => boolean,
      matchesSourceDocument?: (candidate: string) => boolean,
    ) {
      const source = sources.get(serialized);
      return source !== undefined &&
        source !== null &&
        (normalizeListMarkers(source) === normalizeListMarkers(raw) || Boolean(matchesSourceDocument?.(source))) &&
        (source === raw || matchesDocument(source))
        ? source
        : raw;
    },
  };
}

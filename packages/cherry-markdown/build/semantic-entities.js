import { Buffer } from 'node:buffer';

/** Materialize generated entity tables at build time: MiniProgram has no atob/Buffer contract. */
export function nativeEntityTables() {
  return {
    name: 'cherry-miniprogram-entity-tables',
    transform(code, id) {
      if (!/\/entities\/dist\/esm\/generated\/decode-data-(?:html|xml)\.js$/.test(id.replace(/\\/g, '/'))) return null;
      const result = code.replace(/decodeBase64\("([A-Za-z0-9+/=]+)"\)/g, (_, encoded) => {
        const binary = Buffer.from(encoded, 'base64');
        const values = Array.from({ length: binary.length >> 1 }, (_, index) => binary.readUInt16LE(index * 2));
        return `new Uint16Array(${JSON.stringify(values)})`;
      });
      return result === code ? null : { code: result, map: null };
    },
  };
}

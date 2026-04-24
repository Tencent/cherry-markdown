"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// lib/loader.ts
var loader_exports = {};
__export(loader_exports, {
  TypeScriptLoader: () => TypeScriptLoader,
  TypeScriptLoaderSync: () => TypeScriptLoaderSync
});
module.exports = __toCommonJS(loader_exports);
var import_jiti = require("jiti");
var import_typescript_compile_error = require("./typescript-compile-error.cjs");
function TypeScriptLoader(options) {
  const loader = (0, import_jiti.createJiti)("", { interopDefault: true, ...options });
  return async (path, _content) => {
    try {
      const result = await loader.import(path);
      return result.default || result;
    } catch (error) {
      if (error instanceof Error) {
        throw import_typescript_compile_error.TypeScriptCompileError.fromError(error);
      }
      throw error;
    }
  };
}
function TypeScriptLoaderSync(options) {
  const loader = (0, import_jiti.createJiti)("", { interopDefault: true, ...options });
  return (path, _content) => {
    try {
      const result = loader(path);
      return result.default || result;
    } catch (error) {
      if (error instanceof Error) {
        throw import_typescript_compile_error.TypeScriptCompileError.fromError(error);
      }
      throw error;
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TypeScriptLoader,
  TypeScriptLoaderSync
});

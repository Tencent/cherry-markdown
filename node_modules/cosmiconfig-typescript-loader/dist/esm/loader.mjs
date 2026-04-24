// lib/loader.ts
import { createJiti } from "jiti";
import { TypeScriptCompileError } from "./typescript-compile-error.mjs";
function TypeScriptLoader(options) {
  const loader = createJiti("", { interopDefault: true, ...options });
  return async (path, _content) => {
    try {
      const result = await loader.import(path);
      return result.default || result;
    } catch (error) {
      if (error instanceof Error) {
        throw TypeScriptCompileError.fromError(error);
      }
      throw error;
    }
  };
}
function TypeScriptLoaderSync(options) {
  const loader = createJiti("", { interopDefault: true, ...options });
  return (path, _content) => {
    try {
      const result = loader(path);
      return result.default || result;
    } catch (error) {
      if (error instanceof Error) {
        throw TypeScriptCompileError.fromError(error);
      }
      throw error;
    }
  };
}
export {
  TypeScriptLoader,
  TypeScriptLoaderSync
};

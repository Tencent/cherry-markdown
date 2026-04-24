import {
  select_default
} from "./chunk-GRVEB7DL.mjs";
import {
  __name
} from "./chunk-FQFHLQFH.mjs";

// src/rendering-util/insertElementsForSize.js
var getDiagramElement = /* @__PURE__ */ __name((id, securityLevel) => {
  let sandboxElement;
  if (securityLevel === "sandbox") {
    sandboxElement = select_default("#i" + id);
  }
  const root = securityLevel === "sandbox" ? select_default(sandboxElement.nodes()[0].contentDocument.body) : select_default("body");
  const svg = root.select(`[id="${id}"]`);
  return svg;
}, "getDiagramElement");

export {
  getDiagramElement
};

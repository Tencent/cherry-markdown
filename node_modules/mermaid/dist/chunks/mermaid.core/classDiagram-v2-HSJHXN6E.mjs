import {
  ClassDB,
  classDiagram_default,
  classRenderer_v3_unified_default,
  styles_default
} from "./chunk-4TB4RGXK.mjs";
import "./chunk-FMBD7UC4.mjs";
import "./chunk-YZCP3GAM.mjs";
import "./chunk-55IACEB6.mjs";
import "./chunk-EDXVE4YY.mjs";
import "./chunk-336JU56O.mjs";
import "./chunk-ENJZ2VHE.mjs";
import "./chunk-BSJP7CBP.mjs";
import "./chunk-5FUZZQ4R.mjs";
import "./chunk-ZZ45TVLE.mjs";
import "./chunk-X2U36JSP.mjs";
import "./chunk-U2HBQHQK.mjs";
import "./chunk-5PVQY5BW.mjs";
import "./chunk-ICPOFSXX.mjs";
import {
  __name
} from "./chunk-AGHRB4JF.mjs";

// src/diagrams/class/classDiagram-v2.ts
var diagram = {
  parser: classDiagram_default,
  get db() {
    return new ClassDB();
  },
  renderer: classRenderer_v3_unified_default,
  styles: styles_default,
  init: /* @__PURE__ */ __name((cnf) => {
    if (!cnf.class) {
      cnf.class = {};
    }
    cnf.class.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
  }, "init")
};
export {
  diagram
};

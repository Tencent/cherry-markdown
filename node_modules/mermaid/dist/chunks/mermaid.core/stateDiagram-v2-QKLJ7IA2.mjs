import {
  StateDB,
  stateDiagram_default,
  stateRenderer_v3_unified_default,
  styles_default
} from "./chunk-OYMX7WX6.mjs";
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

// src/diagrams/state/stateDiagram-v2.ts
var diagram = {
  parser: stateDiagram_default,
  get db() {
    return new StateDB(2);
  },
  renderer: stateRenderer_v3_unified_default,
  styles: styles_default,
  init: /* @__PURE__ */ __name((cnf) => {
    if (!cnf.state) {
      cnf.state = {};
    }
    cnf.state.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
  }, "init")
};
export {
  diagram
};

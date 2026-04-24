import {
  StateDB,
  stateDiagram_default,
  stateRenderer_v3_unified_default,
  styles_default
} from "./chunk-D7DC6SP6.mjs";
import "./chunk-U2CUWHSV.mjs";
import "./chunk-FDRWAT7V.mjs";
import "./chunk-GQXX6INY.mjs";
import "./chunk-3ENLOZB5.mjs";
import "./chunk-UK2JF6A5.mjs";
import "./chunk-C7LX3TON.mjs";
import "./chunk-VMH3YNCZ.mjs";
import "./chunk-ESVDSNFU.mjs";
import "./chunk-D2KOLKXV.mjs";
import "./chunk-7XTQR4JX.mjs";
import "./chunk-5FJ6MPNB.mjs";
import "./chunk-3OTVAOVH.mjs";
import "./chunk-NCW2MGAP.mjs";
import "./chunk-GRVEB7DL.mjs";
import "./chunk-3QJOF6JT.mjs";
import {
  __name
} from "./chunk-FQFHLQFH.mjs";

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

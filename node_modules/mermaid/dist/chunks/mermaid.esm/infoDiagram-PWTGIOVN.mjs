import {
  parse
} from "./chunk-COTS6TSK.mjs";
import "./chunk-7TV4ZQ6C.mjs";
import "./chunk-RPUGE2OU.mjs";
import "./chunk-TQNTULNW.mjs";
import "./chunk-P6XZ56Y6.mjs";
import "./chunk-ZJYGCH2D.mjs";
import "./chunk-Q6KCKTBH.mjs";
import "./chunk-7XTPNGWE.mjs";
import "./chunk-FKWWLAQO.mjs";
import {
  selectSvgElement
} from "./chunk-2CD2RWVO.mjs";
import {
  configureSvgSize
} from "./chunk-NCW2MGAP.mjs";
import {
  log
} from "./chunk-GRVEB7DL.mjs";
import "./chunk-BPXICT63.mjs";
import "./chunk-WEB62QT6.mjs";
import "./chunk-MFRUYFWM.mjs";
import "./chunk-UKL4YMJ2.mjs";
import "./chunk-3QJOF6JT.mjs";
import {
  __name
} from "./chunk-FQFHLQFH.mjs";

// src/diagrams/info/infoParser.ts
var parser = {
  parse: /* @__PURE__ */ __name(async (input) => {
    const ast = await parse("info", input);
    log.debug(ast);
  }, "parse")
};

// src/diagrams/info/infoDb.ts
var DEFAULT_INFO_DB = {
  version: "11.14.0" + (true ? "" : "-tiny")
};
var getVersion = /* @__PURE__ */ __name(() => DEFAULT_INFO_DB.version, "getVersion");
var db = {
  getVersion
};

// src/diagrams/info/infoRenderer.ts
var draw = /* @__PURE__ */ __name((text, id, version) => {
  log.debug("rendering info diagram\n" + text);
  const svg = selectSvgElement(id);
  configureSvgSize(svg, 100, 400, true);
  const group = svg.append("g");
  group.append("text").attr("x", 100).attr("y", 40).attr("class", "version").attr("font-size", 32).style("text-anchor", "middle").text(`v${version}`);
}, "draw");
var renderer = { draw };

// src/diagrams/info/infoDiagram.ts
var diagram = {
  parser,
  db,
  renderer
};
export {
  diagram
};

import {
  selectSvgElement
} from "./chunk-426QAEUC.mjs";
import {
  populateCommonDb
} from "./chunk-4BX2VUAB.mjs";
import {
  ImperativeState
} from "./chunk-QZHKN3VN.mjs";
import {
  cleanAndMerge
} from "./chunk-5PVQY5BW.mjs";
import {
  clear,
  configureSvgSize,
  defaultConfig_default,
  getAccDescription,
  getAccTitle,
  getConfig,
  getDiagramTitle,
  setAccDescription,
  setAccTitle,
  setDiagramTitle
} from "./chunk-ICPOFSXX.mjs";
import {
  __name,
  log
} from "./chunk-AGHRB4JF.mjs";

// src/diagrams/treeView/db.ts
var state = new ImperativeState(() => ({
  cnt: 1,
  stack: [
    {
      id: 0,
      level: -1,
      name: "/",
      children: []
    }
  ]
}));
var clear2 = /* @__PURE__ */ __name(() => {
  state.reset();
  clear();
}, "clear");
var getRoot = /* @__PURE__ */ __name(() => {
  return state.records.stack[0];
}, "getRoot");
var getCount = /* @__PURE__ */ __name(() => state.records.cnt, "getCount");
var defaultConfig = defaultConfig_default.treeView;
var getConfig2 = /* @__PURE__ */ __name(() => {
  return cleanAndMerge(defaultConfig, getConfig().treeView);
}, "getConfig");
var addNode = /* @__PURE__ */ __name((level, name) => {
  while (level <= state.records.stack[state.records.stack.length - 1].level) {
    state.records.stack.pop();
  }
  const node = {
    id: state.records.cnt++,
    level,
    name,
    children: []
  };
  state.records.stack[state.records.stack.length - 1].children.push(node);
  state.records.stack.push(node);
}, "addNode");
var db = {
  clear: clear2,
  addNode,
  getRoot,
  getCount,
  getConfig: getConfig2,
  getAccTitle,
  getAccDescription,
  getDiagramTitle,
  setAccDescription,
  setAccTitle,
  setDiagramTitle
};
var db_default = db;

// src/diagrams/treeView/parser.ts
import { parse } from "@mermaid-js/parser";
var populate = /* @__PURE__ */ __name((ast) => {
  populateCommonDb(ast, db_default);
  ast.nodes.map((node) => db_default.addNode(node.indent ? parseInt(node.indent) : 0, node.name));
}, "populate");
var parser = {
  parse: /* @__PURE__ */ __name(async (input) => {
    const ast = await parse("treeView", input);
    log.debug(ast);
    populate(ast);
  }, "parse")
};

// src/diagrams/treeView/renderer.ts
var positionLabel = /* @__PURE__ */ __name((x, y, node, domElem, config) => {
  const label = domElem.append("text").text(node.name).attr("dominant-baseline", "middle").attr("class", "treeView-node-label");
  const { height: labelHeight, width: labelWidth } = label.node().getBBox();
  const height = labelHeight + config.paddingY * 2;
  const width = labelWidth + config.paddingX * 2;
  label.attr("x", x + config.paddingX);
  label.attr("y", y + height / 2);
  node.BBox = {
    x,
    y,
    width,
    height
  };
}, "positionLabel");
var positionLine = /* @__PURE__ */ __name((domElem, x1, y1, x2, y2, lineThickness) => {
  return domElem.append("line").attr("x1", x1).attr("y1", y1).attr("x2", x2).attr("y2", y2).attr("stroke-width", lineThickness).attr("class", "treeView-node-line");
}, "positionLine");
var drawTree = /* @__PURE__ */ __name((elem, root, config) => {
  let totalHeight = 0;
  let totalWidth = 0;
  const drawNode = /* @__PURE__ */ __name((elem2, node, config2, depth) => {
    const indent = depth * (config2.rowIndent + config2.paddingX);
    positionLabel(indent, totalHeight, node, elem2, config2);
    const { height, width } = node.BBox;
    positionLine(
      elem2,
      indent - config2.rowIndent,
      totalHeight + height / 2,
      indent,
      totalHeight + height / 2,
      config2.lineThickness
    );
    totalWidth = Math.max(totalWidth, indent + width);
    totalHeight += height;
  }, "drawNode");
  const processNode = /* @__PURE__ */ __name((node, depth = 0) => {
    drawNode(elem, node, config, depth);
    node.children.forEach((child) => {
      processNode(child, depth + 1);
    });
    const { x, y, height } = node.BBox;
    if (node.children.length) {
      const { y: endY, height: endHeight } = node.children[node.children.length - 1].BBox;
      positionLine(
        elem,
        x + config.paddingX,
        y + height,
        x + config.paddingX,
        endY + endHeight / 2 + config.lineThickness / 2,
        config.lineThickness
      );
    }
  }, "processNode");
  processNode(root);
  return { totalHeight, totalWidth };
}, "drawTree");
var draw = /* @__PURE__ */ __name((text, id, _ver, diagObj) => {
  log.debug("Rendering treeView diagram\n" + text);
  const db2 = diagObj.db;
  const root = db2.getRoot();
  const config = db2.getConfig();
  const svg = selectSvgElement(id);
  const treeElem = svg.append("g");
  treeElem.attr("class", "tree-view");
  const { totalHeight, totalWidth } = drawTree(treeElem, root, config);
  svg.attr("viewBox", `-${config.lineThickness / 2} 0 ${totalWidth} ${totalHeight}`);
  configureSvgSize(svg, totalHeight, totalWidth, config.useMaxWidth);
}, "draw");
var renderer = {
  draw
};
var renderer_default = renderer;

// src/diagrams/treeView/styles.ts
var defaultTreeViewDiagramStyles = {
  labelFontSize: "16px",
  labelColor: "black",
  lineColor: "black"
};
var styles = /* @__PURE__ */ __name(({
  treeView
}) => {
  const { labelFontSize, labelColor, lineColor } = cleanAndMerge(
    defaultTreeViewDiagramStyles,
    treeView
  );
  return `
    .treeView-node-label {
        font-size: ${labelFontSize};
        fill: ${labelColor};
    }
    .treeView-node-line {
        stroke: ${lineColor};
    }
    `;
}, "styles");
var styles_default = styles;

// src/diagrams/treeView/diagram.ts
var diagram = {
  db: db_default,
  renderer: renderer_default,
  parser,
  styles: styles_default
};
export {
  diagram
};

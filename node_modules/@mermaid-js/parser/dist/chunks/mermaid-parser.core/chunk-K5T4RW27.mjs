var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/language/generated/ast.ts
import * as langium from "langium";
var ArchitectureGrammar;
((ArchitectureGrammar2) => {
  ArchitectureGrammar2.Terminals = {
    ARROW_DIRECTION: /L|R|T|B/,
    ARROW_GROUP: /\{group\}/,
    ARROW_INTO: /<|>/,
    ACC_DESCR: /[\t ]*accDescr(?:[\t ]*:([^\n\r]*?(?=%%)|[^\n\r]*)|\s*{([^}]*)})/,
    ACC_TITLE: /[\t ]*accTitle[\t ]*:(?:[^\n\r]*?(?=%%)|[^\n\r]*)/,
    TITLE: /[\t ]*title(?:[\t ][^\n\r]*?(?=%%)|[\t ][^\n\r]*|)/,
    STRING: /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/,
    ID: /[\w]([-\w]*\w)?/,
    NEWLINE: /\r?\n/,
    WHITESPACE: /[\t ]+/,
    YAML: /---[\t ]*\r?\n(?:[\S\s]*?\r?\n)?---(?:\r?\n|(?!\S))/,
    DIRECTIVE: /[\t ]*%%{[\S\s]*?}%%(?:\r?\n|(?!\S))/,
    SINGLE_LINE_COMMENT: /[\t ]*%%[^\n\r]*/,
    ARCH_ICON: /\([\w-:]+\)/,
    ARCH_TITLE: /\[(?:"([^"\\]|\\.)*"|'([^'\\]|\\.)*'|[\w ]+)\]/
  };
})(ArchitectureGrammar || (ArchitectureGrammar = {}));
var GitGraphGrammar;
((GitGraphGrammar2) => {
  GitGraphGrammar2.Terminals = {
    ACC_DESCR: /[\t ]*accDescr(?:[\t ]*:([^\n\r]*?(?=%%)|[^\n\r]*)|\s*{([^}]*)})/,
    ACC_TITLE: /[\t ]*accTitle[\t ]*:(?:[^\n\r]*?(?=%%)|[^\n\r]*)/,
    TITLE: /[\t ]*title(?:[\t ][^\n\r]*?(?=%%)|[\t ][^\n\r]*|)/,
    INT: /0|[1-9][0-9]*(?!\.)/,
    STRING: /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/,
    NEWLINE: /\r?\n/,
    WHITESPACE: /[\t ]+/,
    YAML: /---[\t ]*\r?\n(?:[\S\s]*?\r?\n)?---(?:\r?\n|(?!\S))/,
    DIRECTIVE: /[\t ]*%%{[\S\s]*?}%%(?:\r?\n|(?!\S))/,
    SINGLE_LINE_COMMENT: /[\t ]*%%[^\n\r]*/,
    REFERENCE: /\w([-\./\w]*[-\w])?/
  };
})(GitGraphGrammar || (GitGraphGrammar = {}));
var InfoGrammar;
((InfoGrammar2) => {
  InfoGrammar2.Terminals = {
    ACC_DESCR: /[\t ]*accDescr(?:[\t ]*:([^\n\r]*?(?=%%)|[^\n\r]*)|\s*{([^}]*)})/,
    ACC_TITLE: /[\t ]*accTitle[\t ]*:(?:[^\n\r]*?(?=%%)|[^\n\r]*)/,
    TITLE: /[\t ]*title(?:[\t ][^\n\r]*?(?=%%)|[\t ][^\n\r]*|)/,
    NEWLINE: /\r?\n/,
    WHITESPACE: /[\t ]+/,
    YAML: /---[\t ]*\r?\n(?:[\S\s]*?\r?\n)?---(?:\r?\n|(?!\S))/,
    DIRECTIVE: /[\t ]*%%{[\S\s]*?}%%(?:\r?\n|(?!\S))/,
    SINGLE_LINE_COMMENT: /[\t ]*%%[^\n\r]*/
  };
})(InfoGrammar || (InfoGrammar = {}));
var PacketGrammar;
((PacketGrammar2) => {
  PacketGrammar2.Terminals = {
    ACC_DESCR: /[\t ]*accDescr(?:[\t ]*:([^\n\r]*?(?=%%)|[^\n\r]*)|\s*{([^}]*)})/,
    ACC_TITLE: /[\t ]*accTitle[\t ]*:(?:[^\n\r]*?(?=%%)|[^\n\r]*)/,
    TITLE: /[\t ]*title(?:[\t ][^\n\r]*?(?=%%)|[\t ][^\n\r]*|)/,
    INT: /0|[1-9][0-9]*(?!\.)/,
    STRING: /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/,
    NEWLINE: /\r?\n/,
    WHITESPACE: /[\t ]+/,
    YAML: /---[\t ]*\r?\n(?:[\S\s]*?\r?\n)?---(?:\r?\n|(?!\S))/,
    DIRECTIVE: /[\t ]*%%{[\S\s]*?}%%(?:\r?\n|(?!\S))/,
    SINGLE_LINE_COMMENT: /[\t ]*%%[^\n\r]*/
  };
})(PacketGrammar || (PacketGrammar = {}));
var PieGrammar;
((PieGrammar2) => {
  PieGrammar2.Terminals = {
    NUMBER_PIE: /(?:-?[0-9]+\.[0-9]+(?!\.))|(?:-?(0|[1-9][0-9]*)(?!\.))/,
    ACC_DESCR: /[\t ]*accDescr(?:[\t ]*:([^\n\r]*?(?=%%)|[^\n\r]*)|\s*{([^}]*)})/,
    ACC_TITLE: /[\t ]*accTitle[\t ]*:(?:[^\n\r]*?(?=%%)|[^\n\r]*)/,
    TITLE: /[\t ]*title(?:[\t ][^\n\r]*?(?=%%)|[\t ][^\n\r]*|)/,
    STRING: /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/,
    NEWLINE: /\r?\n/,
    WHITESPACE: /[\t ]+/,
    YAML: /---[\t ]*\r?\n(?:[\S\s]*?\r?\n)?---(?:\r?\n|(?!\S))/,
    DIRECTIVE: /[\t ]*%%{[\S\s]*?}%%(?:\r?\n|(?!\S))/,
    SINGLE_LINE_COMMENT: /[\t ]*%%[^\n\r]*/
  };
})(PieGrammar || (PieGrammar = {}));
var RadarGrammar;
((RadarGrammar2) => {
  RadarGrammar2.Terminals = {
    GRATICULE: /circle|polygon/,
    BOOLEAN: /true|false/,
    ACC_DESCR: /[\t ]*accDescr(?:[\t ]*:([^\n\r]*?(?=%%)|[^\n\r]*)|\s*{([^}]*)})/,
    ACC_TITLE: /[\t ]*accTitle[\t ]*:(?:[^\n\r]*?(?=%%)|[^\n\r]*)/,
    TITLE: /[\t ]*title(?:[\t ][^\n\r]*?(?=%%)|[\t ][^\n\r]*|)/,
    NUMBER: /(?:[0-9]+\.[0-9]+(?!\.))|(?:0|[1-9][0-9]*(?!\.))/,
    STRING: /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/,
    ID: /[\w]([-\w]*\w)?/,
    NEWLINE: /\r?\n/,
    WHITESPACE: /[\t ]+/,
    YAML: /---[\t ]*\r?\n(?:[\S\s]*?\r?\n)?---(?:\r?\n|(?!\S))/,
    DIRECTIVE: /[\t ]*%%{[\S\s]*?}%%(?:\r?\n|(?!\S))/,
    SINGLE_LINE_COMMENT: /[\t ]*%%[^\n\r]*/
  };
})(RadarGrammar || (RadarGrammar = {}));
var TreemapGrammar;
((TreemapGrammar2) => {
  TreemapGrammar2.Terminals = {
    ACC_DESCR: /[\t ]*accDescr(?:[\t ]*:([^\n\r]*?(?=%%)|[^\n\r]*)|\s*{([^}]*)})/,
    ACC_TITLE: /[\t ]*accTitle[\t ]*:(?:[^\n\r]*?(?=%%)|[^\n\r]*)/,
    TITLE: /[\t ]*title(?:[\t ][^\n\r]*?(?=%%)|[\t ][^\n\r]*|)/,
    TREEMAP_KEYWORD: /treemap-beta|treemap/,
    CLASS_DEF: /classDef\s+([a-zA-Z_][a-zA-Z0-9_]+)(?:\s+([^;\r\n]*))?(?:;)?/,
    STYLE_SEPARATOR: /:::/,
    SEPARATOR: /:/,
    COMMA: /,/,
    INDENTATION: /[ \t]{1,}/,
    WS: /[ \t]+/,
    ML_COMMENT: /\%\%[^\n]*/,
    NL: /\r?\n/,
    ID2: /[a-zA-Z_][a-zA-Z0-9_]*/,
    NUMBER2: /[0-9_\.\,]+/,
    STRING2: /"[^"]*"|'[^']*'/
  };
})(TreemapGrammar || (TreemapGrammar = {}));
var TreeViewGrammar;
((TreeViewGrammar2) => {
  TreeViewGrammar2.Terminals = {
    ACC_DESCR: /[\t ]*accDescr(?:[\t ]*:([^\n\r]*?(?=%%)|[^\n\r]*)|\s*{([^}]*)})/,
    ACC_TITLE: /[\t ]*accTitle[\t ]*:(?:[^\n\r]*?(?=%%)|[^\n\r]*)/,
    TITLE: /[\t ]*title(?:[\t ][^\n\r]*?(?=%%)|[\t ][^\n\r]*|)/,
    INDENTATION: /[ \t]{1,}/,
    WS: /[ \t]+/,
    ML_COMMENT: /\%\%[^\n]*/,
    NL: /\r?\n/,
    STRING2: /"[^"]*"|'[^']*'/
  };
})(TreeViewGrammar || (TreeViewGrammar = {}));
var WardleyGrammar;
((WardleyGrammar2) => {
  WardleyGrammar2.Terminals = {
    WARDLEY_NUMBER: /[0-9]+\.[0-9]+/,
    ARROW: /->/,
    LINK_PORT: /\+<>|\+>|\+</,
    LINK_ARROW: /-->|-\.->|>|\+'[^']*'<>|\+'[^']*'<|\+'[^']*'>/,
    LINK_LABEL: /;[^\n\r]+/,
    STRATEGY: /build|buy|outsource|market/,
    KW_WARDLEY: /wardley-beta/,
    KW_SIZE: /size/,
    KW_EVOLUTION: /evolution/,
    KW_ANCHOR: /anchor/,
    KW_COMPONENT: /component/,
    KW_LABEL: /label/,
    KW_INERTIA: /inertia/,
    KW_EVOLVE: /evolve/,
    KW_PIPELINE: /pipeline/,
    KW_NOTE: /note/,
    KW_ANNOTATIONS: /annotations/,
    KW_ANNOTATION: /annotation/,
    KW_ACCELERATOR: /accelerator/,
    KW_DEACCELERATOR: /deaccelerator/,
    NAME_WITH_SPACES: /(?!title\s|accTitle|accDescr)[A-Za-z][A-Za-z0-9_()&]*(?:[ \t]+[A-Za-z(][A-Za-z0-9_()&]*)*/,
    WS: /[ \t]+/,
    ACC_DESCR: /[\t ]*accDescr(?:[\t ]*:([^\n\r]*?(?=%%)|[^\n\r]*)|\s*{([^}]*)})/,
    ACC_TITLE: /[\t ]*accTitle[\t ]*:(?:[^\n\r]*?(?=%%)|[^\n\r]*)/,
    TITLE: /[\t ]*title(?:[\t ][^\n\r]*?(?=%%)|[\t ][^\n\r]*|)/,
    INT: /0|[1-9][0-9]*(?!\.)/,
    STRING: /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/,
    ID: /[\w]([-\w]*\w)?/,
    NEWLINE: /\r?\n/,
    WHITESPACE: /[\t ]+/,
    YAML: /---[\t ]*\r?\n(?:[\S\s]*?\r?\n)?---(?:\r?\n|(?!\S))/,
    DIRECTIVE: /[\t ]*%%{[\S\s]*?}%%(?:\r?\n|(?!\S))/,
    SINGLE_LINE_COMMENT: /[\t ]*%%[^\n\r]*/
  };
})(WardleyGrammar || (WardleyGrammar = {}));
var MermaidTerminals = {
  ...ArchitectureGrammar.Terminals,
  ...GitGraphGrammar.Terminals,
  ...InfoGrammar.Terminals,
  ...PacketGrammar.Terminals,
  ...PieGrammar.Terminals,
  ...RadarGrammar.Terminals,
  ...TreeViewGrammar.Terminals,
  ...TreemapGrammar.Terminals,
  ...WardleyGrammar.Terminals
};
var Accelerator = {
  $type: "Accelerator",
  name: "name",
  x: "x",
  y: "y"
};
var Anchor = {
  $type: "Anchor",
  evolution: "evolution",
  name: "name",
  visibility: "visibility"
};
var Annotation = {
  $type: "Annotation",
  number: "number",
  text: "text",
  x: "x",
  y: "y"
};
var Annotations = {
  $type: "Annotations",
  x: "x",
  y: "y"
};
var Architecture = {
  $type: "Architecture",
  accDescr: "accDescr",
  accTitle: "accTitle",
  edges: "edges",
  groups: "groups",
  junctions: "junctions",
  services: "services",
  title: "title"
};
function isArchitecture(item) {
  return reflection.isInstance(item, Architecture.$type);
}
__name(isArchitecture, "isArchitecture");
var Axis = {
  $type: "Axis",
  label: "label",
  name: "name"
};
var Branch = {
  $type: "Branch",
  name: "name",
  order: "order"
};
function isBranch(item) {
  return reflection.isInstance(item, Branch.$type);
}
__name(isBranch, "isBranch");
var Checkout = {
  $type: "Checkout",
  branch: "branch"
};
var CherryPicking = {
  $type: "CherryPicking",
  id: "id",
  parent: "parent",
  tags: "tags"
};
var ClassDefStatement = {
  $type: "ClassDefStatement",
  className: "className",
  styleText: "styleText"
};
var Commit = {
  $type: "Commit",
  id: "id",
  message: "message",
  tags: "tags",
  type: "type"
};
function isCommit(item) {
  return reflection.isInstance(item, Commit.$type);
}
__name(isCommit, "isCommit");
var Component = {
  $type: "Component",
  decorator: "decorator",
  evolution: "evolution",
  inertia: "inertia",
  label: "label",
  name: "name",
  visibility: "visibility"
};
var Curve = {
  $type: "Curve",
  entries: "entries",
  label: "label",
  name: "name"
};
var Deaccelerator = {
  $type: "Deaccelerator",
  name: "name",
  x: "x",
  y: "y"
};
var Decorator = {
  $type: "Decorator",
  strategy: "strategy"
};
var Direction = {
  $type: "Direction",
  accDescr: "accDescr",
  accTitle: "accTitle",
  dir: "dir",
  statements: "statements",
  title: "title"
};
var Edge = {
  $type: "Edge",
  lhsDir: "lhsDir",
  lhsGroup: "lhsGroup",
  lhsId: "lhsId",
  lhsInto: "lhsInto",
  rhsDir: "rhsDir",
  rhsGroup: "rhsGroup",
  rhsId: "rhsId",
  rhsInto: "rhsInto",
  title: "title"
};
var Entry = {
  $type: "Entry",
  axis: "axis",
  value: "value"
};
var Evolution = {
  $type: "Evolution",
  stages: "stages"
};
var EvolutionStage = {
  $type: "EvolutionStage",
  boundary: "boundary",
  name: "name",
  secondName: "secondName"
};
var Evolve = {
  $type: "Evolve",
  component: "component",
  target: "target"
};
var GitGraph = {
  $type: "GitGraph",
  accDescr: "accDescr",
  accTitle: "accTitle",
  statements: "statements",
  title: "title"
};
function isGitGraph(item) {
  return reflection.isInstance(item, GitGraph.$type);
}
__name(isGitGraph, "isGitGraph");
var Group = {
  $type: "Group",
  icon: "icon",
  id: "id",
  in: "in",
  title: "title"
};
var Info = {
  $type: "Info",
  accDescr: "accDescr",
  accTitle: "accTitle",
  title: "title"
};
function isInfo(item) {
  return reflection.isInstance(item, Info.$type);
}
__name(isInfo, "isInfo");
var Item = {
  $type: "Item",
  classSelector: "classSelector",
  name: "name"
};
var Junction = {
  $type: "Junction",
  id: "id",
  in: "in"
};
var Label = {
  $type: "Label",
  negX: "negX",
  negY: "negY",
  offsetX: "offsetX",
  offsetY: "offsetY"
};
var Leaf = {
  $type: "Leaf",
  classSelector: "classSelector",
  name: "name",
  value: "value"
};
var Link = {
  $type: "Link",
  arrow: "arrow",
  from: "from",
  fromPort: "fromPort",
  linkLabel: "linkLabel",
  to: "to",
  toPort: "toPort"
};
var Merge = {
  $type: "Merge",
  branch: "branch",
  id: "id",
  tags: "tags",
  type: "type"
};
function isMerge(item) {
  return reflection.isInstance(item, Merge.$type);
}
__name(isMerge, "isMerge");
var Note = {
  $type: "Note",
  evolution: "evolution",
  text: "text",
  visibility: "visibility"
};
var Option = {
  $type: "Option",
  name: "name",
  value: "value"
};
var Packet = {
  $type: "Packet",
  accDescr: "accDescr",
  accTitle: "accTitle",
  blocks: "blocks",
  title: "title"
};
function isPacket(item) {
  return reflection.isInstance(item, Packet.$type);
}
__name(isPacket, "isPacket");
var PacketBlock = {
  $type: "PacketBlock",
  bits: "bits",
  end: "end",
  label: "label",
  start: "start"
};
function isPacketBlock(item) {
  return reflection.isInstance(item, PacketBlock.$type);
}
__name(isPacketBlock, "isPacketBlock");
var Pie = {
  $type: "Pie",
  accDescr: "accDescr",
  accTitle: "accTitle",
  sections: "sections",
  showData: "showData",
  title: "title"
};
function isPie(item) {
  return reflection.isInstance(item, Pie.$type);
}
__name(isPie, "isPie");
var PieSection = {
  $type: "PieSection",
  label: "label",
  value: "value"
};
function isPieSection(item) {
  return reflection.isInstance(item, PieSection.$type);
}
__name(isPieSection, "isPieSection");
var Pipeline = {
  $type: "Pipeline",
  components: "components",
  parent: "parent"
};
var PipelineComponent = {
  $type: "PipelineComponent",
  evolution: "evolution",
  label: "label",
  name: "name"
};
var Radar = {
  $type: "Radar",
  accDescr: "accDescr",
  accTitle: "accTitle",
  axes: "axes",
  curves: "curves",
  options: "options",
  title: "title"
};
var Section = {
  $type: "Section",
  classSelector: "classSelector",
  name: "name"
};
var Service = {
  $type: "Service",
  icon: "icon",
  iconText: "iconText",
  id: "id",
  in: "in",
  title: "title"
};
var Size = {
  $type: "Size",
  height: "height",
  width: "width"
};
var Statement = {
  $type: "Statement"
};
var Treemap = {
  $type: "Treemap",
  accDescr: "accDescr",
  accTitle: "accTitle",
  title: "title",
  TreemapRows: "TreemapRows"
};
function isTreemap(item) {
  return reflection.isInstance(item, Treemap.$type);
}
__name(isTreemap, "isTreemap");
var TreemapRow = {
  $type: "TreemapRow",
  indent: "indent",
  item: "item"
};
var TreeNode = {
  $type: "TreeNode",
  indent: "indent",
  name: "name"
};
var TreeView = {
  $type: "TreeView",
  accDescr: "accDescr",
  accTitle: "accTitle",
  nodes: "nodes",
  title: "title"
};
var Wardley = {
  $type: "Wardley",
  accDescr: "accDescr",
  accelerators: "accelerators",
  accTitle: "accTitle",
  anchors: "anchors",
  annotation: "annotation",
  annotations: "annotations",
  components: "components",
  deaccelerators: "deaccelerators",
  evolution: "evolution",
  evolves: "evolves",
  links: "links",
  notes: "notes",
  pipelines: "pipelines",
  size: "size",
  title: "title"
};
function isWardley(item) {
  return reflection.isInstance(item, Wardley.$type);
}
__name(isWardley, "isWardley");
var MermaidAstReflection = class extends langium.AbstractAstReflection {
  constructor() {
    super(...arguments);
    this.types = {
      Accelerator: {
        name: Accelerator.$type,
        properties: {
          name: {
            name: Accelerator.name
          },
          x: {
            name: Accelerator.x
          },
          y: {
            name: Accelerator.y
          }
        },
        superTypes: []
      },
      Anchor: {
        name: Anchor.$type,
        properties: {
          evolution: {
            name: Anchor.evolution
          },
          name: {
            name: Anchor.name
          },
          visibility: {
            name: Anchor.visibility
          }
        },
        superTypes: []
      },
      Annotation: {
        name: Annotation.$type,
        properties: {
          number: {
            name: Annotation.number
          },
          text: {
            name: Annotation.text
          },
          x: {
            name: Annotation.x
          },
          y: {
            name: Annotation.y
          }
        },
        superTypes: []
      },
      Annotations: {
        name: Annotations.$type,
        properties: {
          x: {
            name: Annotations.x
          },
          y: {
            name: Annotations.y
          }
        },
        superTypes: []
      },
      Architecture: {
        name: Architecture.$type,
        properties: {
          accDescr: {
            name: Architecture.accDescr
          },
          accTitle: {
            name: Architecture.accTitle
          },
          edges: {
            name: Architecture.edges,
            defaultValue: []
          },
          groups: {
            name: Architecture.groups,
            defaultValue: []
          },
          junctions: {
            name: Architecture.junctions,
            defaultValue: []
          },
          services: {
            name: Architecture.services,
            defaultValue: []
          },
          title: {
            name: Architecture.title
          }
        },
        superTypes: []
      },
      Axis: {
        name: Axis.$type,
        properties: {
          label: {
            name: Axis.label
          },
          name: {
            name: Axis.name
          }
        },
        superTypes: []
      },
      Branch: {
        name: Branch.$type,
        properties: {
          name: {
            name: Branch.name
          },
          order: {
            name: Branch.order
          }
        },
        superTypes: [Statement.$type]
      },
      Checkout: {
        name: Checkout.$type,
        properties: {
          branch: {
            name: Checkout.branch
          }
        },
        superTypes: [Statement.$type]
      },
      CherryPicking: {
        name: CherryPicking.$type,
        properties: {
          id: {
            name: CherryPicking.id
          },
          parent: {
            name: CherryPicking.parent
          },
          tags: {
            name: CherryPicking.tags,
            defaultValue: []
          }
        },
        superTypes: [Statement.$type]
      },
      ClassDefStatement: {
        name: ClassDefStatement.$type,
        properties: {
          className: {
            name: ClassDefStatement.className
          },
          styleText: {
            name: ClassDefStatement.styleText
          }
        },
        superTypes: []
      },
      Commit: {
        name: Commit.$type,
        properties: {
          id: {
            name: Commit.id
          },
          message: {
            name: Commit.message
          },
          tags: {
            name: Commit.tags,
            defaultValue: []
          },
          type: {
            name: Commit.type
          }
        },
        superTypes: [Statement.$type]
      },
      Component: {
        name: Component.$type,
        properties: {
          decorator: {
            name: Component.decorator
          },
          evolution: {
            name: Component.evolution
          },
          inertia: {
            name: Component.inertia,
            defaultValue: false
          },
          label: {
            name: Component.label
          },
          name: {
            name: Component.name
          },
          visibility: {
            name: Component.visibility
          }
        },
        superTypes: []
      },
      Curve: {
        name: Curve.$type,
        properties: {
          entries: {
            name: Curve.entries,
            defaultValue: []
          },
          label: {
            name: Curve.label
          },
          name: {
            name: Curve.name
          }
        },
        superTypes: []
      },
      Deaccelerator: {
        name: Deaccelerator.$type,
        properties: {
          name: {
            name: Deaccelerator.name
          },
          x: {
            name: Deaccelerator.x
          },
          y: {
            name: Deaccelerator.y
          }
        },
        superTypes: []
      },
      Decorator: {
        name: Decorator.$type,
        properties: {
          strategy: {
            name: Decorator.strategy
          }
        },
        superTypes: []
      },
      Direction: {
        name: Direction.$type,
        properties: {
          accDescr: {
            name: Direction.accDescr
          },
          accTitle: {
            name: Direction.accTitle
          },
          dir: {
            name: Direction.dir
          },
          statements: {
            name: Direction.statements,
            defaultValue: []
          },
          title: {
            name: Direction.title
          }
        },
        superTypes: [GitGraph.$type]
      },
      Edge: {
        name: Edge.$type,
        properties: {
          lhsDir: {
            name: Edge.lhsDir
          },
          lhsGroup: {
            name: Edge.lhsGroup,
            defaultValue: false
          },
          lhsId: {
            name: Edge.lhsId
          },
          lhsInto: {
            name: Edge.lhsInto,
            defaultValue: false
          },
          rhsDir: {
            name: Edge.rhsDir
          },
          rhsGroup: {
            name: Edge.rhsGroup,
            defaultValue: false
          },
          rhsId: {
            name: Edge.rhsId
          },
          rhsInto: {
            name: Edge.rhsInto,
            defaultValue: false
          },
          title: {
            name: Edge.title
          }
        },
        superTypes: []
      },
      Entry: {
        name: Entry.$type,
        properties: {
          axis: {
            name: Entry.axis,
            referenceType: Axis.$type
          },
          value: {
            name: Entry.value
          }
        },
        superTypes: []
      },
      Evolution: {
        name: Evolution.$type,
        properties: {
          stages: {
            name: Evolution.stages,
            defaultValue: []
          }
        },
        superTypes: []
      },
      EvolutionStage: {
        name: EvolutionStage.$type,
        properties: {
          boundary: {
            name: EvolutionStage.boundary
          },
          name: {
            name: EvolutionStage.name
          },
          secondName: {
            name: EvolutionStage.secondName
          }
        },
        superTypes: []
      },
      Evolve: {
        name: Evolve.$type,
        properties: {
          component: {
            name: Evolve.component
          },
          target: {
            name: Evolve.target
          }
        },
        superTypes: []
      },
      GitGraph: {
        name: GitGraph.$type,
        properties: {
          accDescr: {
            name: GitGraph.accDescr
          },
          accTitle: {
            name: GitGraph.accTitle
          },
          statements: {
            name: GitGraph.statements,
            defaultValue: []
          },
          title: {
            name: GitGraph.title
          }
        },
        superTypes: []
      },
      Group: {
        name: Group.$type,
        properties: {
          icon: {
            name: Group.icon
          },
          id: {
            name: Group.id
          },
          in: {
            name: Group.in
          },
          title: {
            name: Group.title
          }
        },
        superTypes: []
      },
      Info: {
        name: Info.$type,
        properties: {
          accDescr: {
            name: Info.accDescr
          },
          accTitle: {
            name: Info.accTitle
          },
          title: {
            name: Info.title
          }
        },
        superTypes: []
      },
      Item: {
        name: Item.$type,
        properties: {
          classSelector: {
            name: Item.classSelector
          },
          name: {
            name: Item.name
          }
        },
        superTypes: []
      },
      Junction: {
        name: Junction.$type,
        properties: {
          id: {
            name: Junction.id
          },
          in: {
            name: Junction.in
          }
        },
        superTypes: []
      },
      Label: {
        name: Label.$type,
        properties: {
          negX: {
            name: Label.negX,
            defaultValue: false
          },
          negY: {
            name: Label.negY,
            defaultValue: false
          },
          offsetX: {
            name: Label.offsetX
          },
          offsetY: {
            name: Label.offsetY
          }
        },
        superTypes: []
      },
      Leaf: {
        name: Leaf.$type,
        properties: {
          classSelector: {
            name: Leaf.classSelector
          },
          name: {
            name: Leaf.name
          },
          value: {
            name: Leaf.value
          }
        },
        superTypes: [Item.$type]
      },
      Link: {
        name: Link.$type,
        properties: {
          arrow: {
            name: Link.arrow
          },
          from: {
            name: Link.from
          },
          fromPort: {
            name: Link.fromPort
          },
          linkLabel: {
            name: Link.linkLabel
          },
          to: {
            name: Link.to
          },
          toPort: {
            name: Link.toPort
          }
        },
        superTypes: []
      },
      Merge: {
        name: Merge.$type,
        properties: {
          branch: {
            name: Merge.branch
          },
          id: {
            name: Merge.id
          },
          tags: {
            name: Merge.tags,
            defaultValue: []
          },
          type: {
            name: Merge.type
          }
        },
        superTypes: [Statement.$type]
      },
      Note: {
        name: Note.$type,
        properties: {
          evolution: {
            name: Note.evolution
          },
          text: {
            name: Note.text
          },
          visibility: {
            name: Note.visibility
          }
        },
        superTypes: []
      },
      Option: {
        name: Option.$type,
        properties: {
          name: {
            name: Option.name
          },
          value: {
            name: Option.value,
            defaultValue: false
          }
        },
        superTypes: []
      },
      Packet: {
        name: Packet.$type,
        properties: {
          accDescr: {
            name: Packet.accDescr
          },
          accTitle: {
            name: Packet.accTitle
          },
          blocks: {
            name: Packet.blocks,
            defaultValue: []
          },
          title: {
            name: Packet.title
          }
        },
        superTypes: []
      },
      PacketBlock: {
        name: PacketBlock.$type,
        properties: {
          bits: {
            name: PacketBlock.bits
          },
          end: {
            name: PacketBlock.end
          },
          label: {
            name: PacketBlock.label
          },
          start: {
            name: PacketBlock.start
          }
        },
        superTypes: []
      },
      Pie: {
        name: Pie.$type,
        properties: {
          accDescr: {
            name: Pie.accDescr
          },
          accTitle: {
            name: Pie.accTitle
          },
          sections: {
            name: Pie.sections,
            defaultValue: []
          },
          showData: {
            name: Pie.showData,
            defaultValue: false
          },
          title: {
            name: Pie.title
          }
        },
        superTypes: []
      },
      PieSection: {
        name: PieSection.$type,
        properties: {
          label: {
            name: PieSection.label
          },
          value: {
            name: PieSection.value
          }
        },
        superTypes: []
      },
      Pipeline: {
        name: Pipeline.$type,
        properties: {
          components: {
            name: Pipeline.components,
            defaultValue: []
          },
          parent: {
            name: Pipeline.parent
          }
        },
        superTypes: []
      },
      PipelineComponent: {
        name: PipelineComponent.$type,
        properties: {
          evolution: {
            name: PipelineComponent.evolution
          },
          label: {
            name: PipelineComponent.label
          },
          name: {
            name: PipelineComponent.name
          }
        },
        superTypes: []
      },
      Radar: {
        name: Radar.$type,
        properties: {
          accDescr: {
            name: Radar.accDescr
          },
          accTitle: {
            name: Radar.accTitle
          },
          axes: {
            name: Radar.axes,
            defaultValue: []
          },
          curves: {
            name: Radar.curves,
            defaultValue: []
          },
          options: {
            name: Radar.options,
            defaultValue: []
          },
          title: {
            name: Radar.title
          }
        },
        superTypes: []
      },
      Section: {
        name: Section.$type,
        properties: {
          classSelector: {
            name: Section.classSelector
          },
          name: {
            name: Section.name
          }
        },
        superTypes: [Item.$type]
      },
      Service: {
        name: Service.$type,
        properties: {
          icon: {
            name: Service.icon
          },
          iconText: {
            name: Service.iconText
          },
          id: {
            name: Service.id
          },
          in: {
            name: Service.in
          },
          title: {
            name: Service.title
          }
        },
        superTypes: []
      },
      Size: {
        name: Size.$type,
        properties: {
          height: {
            name: Size.height
          },
          width: {
            name: Size.width
          }
        },
        superTypes: []
      },
      Statement: {
        name: Statement.$type,
        properties: {},
        superTypes: []
      },
      TreeNode: {
        name: TreeNode.$type,
        properties: {
          indent: {
            name: TreeNode.indent
          },
          name: {
            name: TreeNode.name
          }
        },
        superTypes: []
      },
      TreeView: {
        name: TreeView.$type,
        properties: {
          accDescr: {
            name: TreeView.accDescr
          },
          accTitle: {
            name: TreeView.accTitle
          },
          nodes: {
            name: TreeView.nodes,
            defaultValue: []
          },
          title: {
            name: TreeView.title
          }
        },
        superTypes: []
      },
      Treemap: {
        name: Treemap.$type,
        properties: {
          accDescr: {
            name: Treemap.accDescr
          },
          accTitle: {
            name: Treemap.accTitle
          },
          title: {
            name: Treemap.title
          },
          TreemapRows: {
            name: Treemap.TreemapRows,
            defaultValue: []
          }
        },
        superTypes: []
      },
      TreemapRow: {
        name: TreemapRow.$type,
        properties: {
          indent: {
            name: TreemapRow.indent
          },
          item: {
            name: TreemapRow.item
          }
        },
        superTypes: []
      },
      Wardley: {
        name: Wardley.$type,
        properties: {
          accDescr: {
            name: Wardley.accDescr
          },
          accelerators: {
            name: Wardley.accelerators,
            defaultValue: []
          },
          accTitle: {
            name: Wardley.accTitle
          },
          anchors: {
            name: Wardley.anchors,
            defaultValue: []
          },
          annotation: {
            name: Wardley.annotation,
            defaultValue: []
          },
          annotations: {
            name: Wardley.annotations,
            defaultValue: []
          },
          components: {
            name: Wardley.components,
            defaultValue: []
          },
          deaccelerators: {
            name: Wardley.deaccelerators,
            defaultValue: []
          },
          evolution: {
            name: Wardley.evolution
          },
          evolves: {
            name: Wardley.evolves,
            defaultValue: []
          },
          links: {
            name: Wardley.links,
            defaultValue: []
          },
          notes: {
            name: Wardley.notes,
            defaultValue: []
          },
          pipelines: {
            name: Wardley.pipelines,
            defaultValue: []
          },
          size: {
            name: Wardley.size
          },
          title: {
            name: Wardley.title
          }
        },
        superTypes: []
      }
    };
  }
  static {
    __name(this, "MermaidAstReflection");
  }
};
var reflection = new MermaidAstReflection();

// src/language/generated/grammar.ts
import { loadGrammarFromJson } from "langium";
var loadedArchitectureGrammarGrammar;
var ArchitectureGrammarGrammar = /* @__PURE__ */ __name(() => loadedArchitectureGrammarGrammar ?? (loadedArchitectureGrammarGrammar = loadGrammarFromJson(`{"$type":"Grammar","isDeclared":true,"name":"ArchitectureGrammar","imports":[],"rules":[{"$type":"ParserRule","entry":true,"name":"Architecture","definition":{"$type":"Group","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@23"},"arguments":[],"cardinality":"*"},{"$type":"Keyword","value":"architecture-beta"},{"$type":"Alternatives","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@23"},"arguments":[]},{"$type":"RuleCall","rule":{"$ref":"#/rules@13"},"arguments":[]},{"$type":"RuleCall","rule":{"$ref":"#/rules@1"},"arguments":[]}],"cardinality":"*"}]},"fragment":false,"parameters":[]},{"$type":"ParserRule","fragment":true,"name":"Statement","definition":{"$type":"Alternatives","elements":[{"$type":"Assignment","feature":"groups","operator":"+=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@5"},"arguments":[]}},{"$type":"Assignment","feature":"services","operator":"+=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@6"},"arguments":[]}},{"$type":"Assignment","feature":"junctions","operator":"+=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@7"},"arguments":[]}},{"$type":"Assignment","feature":"edges","operator":"+=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@8"},"arguments":[]}}]},"entry":false,"parameters":[]},{"$type":"ParserRule","fragment":true,"name":"LeftPort","definition":{"$type":"Group","elements":[{"$type":"Keyword","value":":"},{"$type":"Assignment","feature":"lhsDir","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@9"},"arguments":[]}}]},"entry":false,"parameters":[]},{"$type":"ParserRule","fragment":true,"name":"RightPort","definition":{"$type":"Group","elements":[{"$type":"Assignment","feature":"rhsDir","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@9"},"arguments":[]}},{"$type":"Keyword","value":":"}]},"entry":false,"parameters":[]},{"$type":"ParserRule","fragment":true,"name":"Arrow","definition":{"$type":"Group","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@2"},"arguments":[]},{"$type":"Assignment","feature":"lhsInto","operator":"?=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@11"},"arguments":[]},"cardinality":"?"},{"$type":"Alternatives","elements":[{"$type":"Keyword","value":"--"},{"$type":"Group","elements":[{"$type":"Keyword","value":"-"},{"$type":"Assignment","feature":"title","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@29"},"arguments":[]}},{"$type":"Keyword","value":"-"}]}]},{"$type":"Assignment","feature":"rhsInto","operator":"?=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@11"},"arguments":[]},"cardinality":"?"},{"$type":"RuleCall","rule":{"$ref":"#/rules@3"},"arguments":[]}]},"entry":false,"parameters":[]},{"$type":"ParserRule","name":"Group","definition":{"$type":"Group","elements":[{"$type":"Keyword","value":"group"},{"$type":"Assignment","feature":"id","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@22"},"arguments":[]}},{"$type":"Assignment","feature":"icon","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@28"},"arguments":[]},"cardinality":"?"},{"$type":"Assignment","feature":"title","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@29"},"arguments":[]},"cardinality":"?"},{"$type":"Group","elements":[{"$type":"Keyword","value":"in"},{"$type":"Assignment","feature":"in","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@22"},"arguments":[]}}],"cardinality":"?"},{"$type":"RuleCall","rule":{"$ref":"#/rules@12"},"arguments":[]}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"ParserRule","name":"Service","definition":{"$type":"Group","elements":[{"$type":"Keyword","value":"service"},{"$type":"Assignment","feature":"id","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@22"},"arguments":[]}},{"$type":"Alternatives","elements":[{"$type":"Assignment","feature":"iconText","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@21"},"arguments":[]}},{"$type":"Assignment","feature":"icon","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@28"},"arguments":[]}}],"cardinality":"?"},{"$type":"Assignment","feature":"title","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@29"},"arguments":[]},"cardinality":"?"},{"$type":"Group","elements":[{"$type":"Keyword","value":"in"},{"$type":"Assignment","feature":"in","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@22"},"arguments":[]}}],"cardinality":"?"},{"$type":"RuleCall","rule":{"$ref":"#/rules@12"},"arguments":[]}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"ParserRule","name":"Junction","definition":{"$type":"Group","elements":[{"$type":"Keyword","value":"junction"},{"$type":"Assignment","feature":"id","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@22"},"arguments":[]}},{"$type":"Group","elements":[{"$type":"Keyword","value":"in"},{"$type":"Assignment","feature":"in","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@22"},"arguments":[]}}],"cardinality":"?"},{"$type":"RuleCall","rule":{"$ref":"#/rules@12"},"arguments":[]}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"ParserRule","name":"Edge","definition":{"$type":"Group","elements":[{"$type":"Assignment","feature":"lhsId","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@22"},"arguments":[]}},{"$type":"Assignment","feature":"lhsGroup","operator":"?=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@10"},"arguments":[]},"cardinality":"?"},{"$type":"RuleCall","rule":{"$ref":"#/rules@4"},"arguments":[]},{"$type":"Assignment","feature":"rhsId","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@22"},"arguments":[]}},{"$type":"Assignment","feature":"rhsGroup","operator":"?=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@10"},"arguments":[]},"cardinality":"?"},{"$type":"RuleCall","rule":{"$ref":"#/rules@12"},"arguments":[]}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"TerminalRule","name":"ARROW_DIRECTION","definition":{"$type":"TerminalAlternatives","elements":[{"$type":"TerminalAlternatives","elements":[{"$type":"TerminalAlternatives","elements":[{"$type":"CharacterRange","left":{"$type":"Keyword","value":"L"},"parenthesized":false},{"$type":"CharacterRange","left":{"$type":"Keyword","value":"R"},"parenthesized":false}],"parenthesized":false},{"$type":"CharacterRange","left":{"$type":"Keyword","value":"T"},"parenthesized":false}],"parenthesized":false},{"$type":"CharacterRange","left":{"$type":"Keyword","value":"B"},"parenthesized":false}],"parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"ARROW_GROUP","definition":{"$type":"RegexToken","regex":"/\\\\{group\\\\}/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"ARROW_INTO","definition":{"$type":"RegexToken","regex":"/<|>/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"ParserRule","name":"EOL","dataType":"string","definition":{"$type":"Alternatives","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@23"},"arguments":[],"cardinality":"+"},{"$type":"EndOfFile"}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"ParserRule","fragment":true,"name":"TitleAndAccessibilities","definition":{"$type":"Group","elements":[{"$type":"Alternatives","elements":[{"$type":"Assignment","feature":"accDescr","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@15"},"arguments":[]}},{"$type":"Assignment","feature":"accTitle","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@16"},"arguments":[]}},{"$type":"Assignment","feature":"title","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@17"},"arguments":[]}}]},{"$type":"RuleCall","rule":{"$ref":"#/rules@12"},"arguments":[]}],"cardinality":"+"},"entry":false,"parameters":[]},{"$type":"TerminalRule","name":"BOOLEAN","type":{"$type":"ReturnType","name":"boolean"},"definition":{"$type":"TerminalAlternatives","elements":[{"$type":"CharacterRange","left":{"$type":"Keyword","value":"true"},"parenthesized":false},{"$type":"CharacterRange","left":{"$type":"Keyword","value":"false"},"parenthesized":false}],"parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"ACC_DESCR","definition":{"$type":"RegexToken","regex":"/[\\\\t ]*accDescr(?:[\\\\t ]*:([^\\\\n\\\\r]*?(?=%%)|[^\\\\n\\\\r]*)|\\\\s*{([^}]*)})/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"ACC_TITLE","definition":{"$type":"RegexToken","regex":"/[\\\\t ]*accTitle[\\\\t ]*:(?:[^\\\\n\\\\r]*?(?=%%)|[^\\\\n\\\\r]*)/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"TITLE","definition":{"$type":"RegexToken","regex":"/[\\\\t ]*title(?:[\\\\t ][^\\\\n\\\\r]*?(?=%%)|[\\\\t ][^\\\\n\\\\r]*|)/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"FLOAT","type":{"$type":"ReturnType","name":"number"},"definition":{"$type":"RegexToken","regex":"/[0-9]+\\\\.[0-9]+(?!\\\\.)/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"INT","type":{"$type":"ReturnType","name":"number"},"definition":{"$type":"RegexToken","regex":"/0|[1-9][0-9]*(?!\\\\.)/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"NUMBER","type":{"$type":"ReturnType","name":"number"},"definition":{"$type":"TerminalAlternatives","elements":[{"$type":"TerminalRuleCall","rule":{"$ref":"#/rules@18"},"parenthesized":false},{"$type":"TerminalRuleCall","rule":{"$ref":"#/rules@19"},"parenthesized":false}],"parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"STRING","type":{"$type":"ReturnType","name":"string"},"definition":{"$type":"RegexToken","regex":"/\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\"|'([^'\\\\\\\\]|\\\\\\\\.)*'/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"ID","type":{"$type":"ReturnType","name":"string"},"definition":{"$type":"RegexToken","regex":"/[\\\\w]([-\\\\w]*\\\\w)?/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"NEWLINE","definition":{"$type":"RegexToken","regex":"/\\\\r?\\\\n/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","hidden":true,"name":"WHITESPACE","definition":{"$type":"RegexToken","regex":"/[\\\\t ]+/","parenthesized":false},"fragment":false},{"$type":"TerminalRule","hidden":true,"name":"YAML","definition":{"$type":"RegexToken","regex":"/---[\\\\t ]*\\\\r?\\\\n(?:[\\\\S\\\\s]*?\\\\r?\\\\n)?---(?:\\\\r?\\\\n|(?!\\\\S))/","parenthesized":false},"fragment":false},{"$type":"TerminalRule","hidden":true,"name":"DIRECTIVE","definition":{"$type":"RegexToken","regex":"/[\\\\t ]*%%{[\\\\S\\\\s]*?}%%(?:\\\\r?\\\\n|(?!\\\\S))/","parenthesized":false},"fragment":false},{"$type":"TerminalRule","hidden":true,"name":"SINGLE_LINE_COMMENT","definition":{"$type":"RegexToken","regex":"/[\\\\t ]*%%[^\\\\n\\\\r]*/","parenthesized":false},"fragment":false},{"$type":"TerminalRule","name":"ARCH_ICON","definition":{"$type":"RegexToken","regex":"/\\\\([\\\\w-:]+\\\\)/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"ARCH_TITLE","definition":{"$type":"RegexToken","regex":"/\\\\[(?:\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\"|'([^'\\\\\\\\]|\\\\\\\\.)*'|[\\\\w ]+)\\\\]/","parenthesized":false},"fragment":false,"hidden":false}],"interfaces":[],"types":[]}`)), "ArchitectureGrammarGrammar");
var loadedGitGraphGrammarGrammar;
var GitGraphGrammarGrammar = /* @__PURE__ */ __name(() => loadedGitGraphGrammarGrammar ?? (loadedGitGraphGrammarGrammar = loadGrammarFromJson(`{"$type":"Grammar","isDeclared":true,"name":"GitGraphGrammar","imports":[],"rules":[{"$type":"ParserRule","entry":true,"name":"GitGraph","definition":{"$type":"Group","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@19"},"arguments":[],"cardinality":"*"},{"$type":"Alternatives","elements":[{"$type":"Keyword","value":"gitGraph"},{"$type":"Group","elements":[{"$type":"Keyword","value":"gitGraph"},{"$type":"Keyword","value":":"}]},{"$type":"Keyword","value":"gitGraph:"},{"$type":"Group","elements":[{"$type":"Keyword","value":"gitGraph"},{"$type":"RuleCall","rule":{"$ref":"#/rules@2"},"arguments":[]},{"$type":"Keyword","value":":"}]}]},{"$type":"Alternatives","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@19"},"arguments":[]},{"$type":"RuleCall","rule":{"$ref":"#/rules@9"},"arguments":[]},{"$type":"Assignment","feature":"statements","operator":"+=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@1"},"arguments":[]}}],"cardinality":"*"}]},"fragment":false,"parameters":[]},{"$type":"ParserRule","name":"Statement","definition":{"$type":"Alternatives","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@3"},"arguments":[]},{"$type":"RuleCall","rule":{"$ref":"#/rules@4"},"arguments":[]},{"$type":"RuleCall","rule":{"$ref":"#/rules@5"},"arguments":[]},{"$type":"RuleCall","rule":{"$ref":"#/rules@6"},"arguments":[]},{"$type":"RuleCall","rule":{"$ref":"#/rules@7"},"arguments":[]}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"ParserRule","name":"Direction","definition":{"$type":"Assignment","feature":"dir","operator":"=","terminal":{"$type":"Alternatives","elements":[{"$type":"Keyword","value":"LR"},{"$type":"Keyword","value":"TB"},{"$type":"Keyword","value":"BT"}]}},"entry":false,"fragment":false,"parameters":[]},{"$type":"ParserRule","name":"Commit","definition":{"$type":"Group","elements":[{"$type":"Keyword","value":"commit"},{"$type":"Alternatives","elements":[{"$type":"Group","elements":[{"$type":"Keyword","value":"id:"},{"$type":"Assignment","feature":"id","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@17"},"arguments":[]}}]},{"$type":"Group","elements":[{"$type":"Keyword","value":"msg:","cardinality":"?"},{"$type":"Assignment","feature":"message","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@17"},"arguments":[]}}]},{"$type":"Group","elements":[{"$type":"Keyword","value":"tag:"},{"$type":"Assignment","feature":"tags","operator":"+=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@17"},"arguments":[]}}]},{"$type":"Group","elements":[{"$type":"Keyword","value":"type:"},{"$type":"Assignment","feature":"type","operator":"=","terminal":{"$type":"Alternatives","elements":[{"$type":"Keyword","value":"NORMAL"},{"$type":"Keyword","value":"REVERSE"},{"$type":"Keyword","value":"HIGHLIGHT"}]}}]}],"cardinality":"*"},{"$type":"RuleCall","rule":{"$ref":"#/rules@8"},"arguments":[]}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"ParserRule","name":"Branch","definition":{"$type":"Group","elements":[{"$type":"Keyword","value":"branch"},{"$type":"Assignment","feature":"name","operator":"=","terminal":{"$type":"Alternatives","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@24"},"arguments":[]},{"$type":"RuleCall","rule":{"$ref":"#/rules@17"},"arguments":[]}]}},{"$type":"Group","elements":[{"$type":"Keyword","value":"order:"},{"$type":"Assignment","feature":"order","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@15"},"arguments":[]}}],"cardinality":"?"},{"$type":"RuleCall","rule":{"$ref":"#/rules@8"},"arguments":[]}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"ParserRule","name":"Merge","definition":{"$type":"Group","elements":[{"$type":"Keyword","value":"merge"},{"$type":"Assignment","feature":"branch","operator":"=","terminal":{"$type":"Alternatives","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@24"},"arguments":[]},{"$type":"RuleCall","rule":{"$ref":"#/rules@17"},"arguments":[]}]}},{"$type":"Alternatives","elements":[{"$type":"Group","elements":[{"$type":"Keyword","value":"id:"},{"$type":"Assignment","feature":"id","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@17"},"arguments":[]}}]},{"$type":"Group","elements":[{"$type":"Keyword","value":"tag:"},{"$type":"Assignment","feature":"tags","operator":"+=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@17"},"arguments":[]}}]},{"$type":"Group","elements":[{"$type":"Keyword","value":"type:"},{"$type":"Assignment","feature":"type","operator":"=","terminal":{"$type":"Alternatives","elements":[{"$type":"Keyword","value":"NORMAL"},{"$type":"Keyword","value":"REVERSE"},{"$type":"Keyword","value":"HIGHLIGHT"}]}}]}],"cardinality":"*"},{"$type":"RuleCall","rule":{"$ref":"#/rules@8"},"arguments":[]}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"ParserRule","name":"Checkout","definition":{"$type":"Group","elements":[{"$type":"Alternatives","elements":[{"$type":"Keyword","value":"checkout"},{"$type":"Keyword","value":"switch"}]},{"$type":"Assignment","feature":"branch","operator":"=","terminal":{"$type":"Alternatives","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@24"},"arguments":[]},{"$type":"RuleCall","rule":{"$ref":"#/rules@17"},"arguments":[]}]}},{"$type":"RuleCall","rule":{"$ref":"#/rules@8"},"arguments":[]}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"ParserRule","name":"CherryPicking","definition":{"$type":"Group","elements":[{"$type":"Keyword","value":"cherry-pick"},{"$type":"Alternatives","elements":[{"$type":"Group","elements":[{"$type":"Keyword","value":"id:"},{"$type":"Assignment","feature":"id","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@17"},"arguments":[]}}]},{"$type":"Group","elements":[{"$type":"Keyword","value":"tag:"},{"$type":"Assignment","feature":"tags","operator":"+=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@17"},"arguments":[]}}]},{"$type":"Group","elements":[{"$type":"Keyword","value":"parent:"},{"$type":"Assignment","feature":"parent","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@17"},"arguments":[]}}]}],"cardinality":"*"},{"$type":"RuleCall","rule":{"$ref":"#/rules@8"},"arguments":[]}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"ParserRule","name":"EOL","dataType":"string","definition":{"$type":"Alternatives","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@19"},"arguments":[],"cardinality":"+"},{"$type":"EndOfFile"}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"ParserRule","fragment":true,"name":"TitleAndAccessibilities","definition":{"$type":"Group","elements":[{"$type":"Alternatives","elements":[{"$type":"Assignment","feature":"accDescr","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@11"},"arguments":[]}},{"$type":"Assignment","feature":"accTitle","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@12"},"arguments":[]}},{"$type":"Assignment","feature":"title","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@13"},"arguments":[]}}]},{"$type":"RuleCall","rule":{"$ref":"#/rules@8"},"arguments":[]}],"cardinality":"+"},"entry":false,"parameters":[]},{"$type":"TerminalRule","name":"BOOLEAN","type":{"$type":"ReturnType","name":"boolean"},"definition":{"$type":"TerminalAlternatives","elements":[{"$type":"CharacterRange","left":{"$type":"Keyword","value":"true"},"parenthesized":false},{"$type":"CharacterRange","left":{"$type":"Keyword","value":"false"},"parenthesized":false}],"parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"ACC_DESCR","definition":{"$type":"RegexToken","regex":"/[\\\\t ]*accDescr(?:[\\\\t ]*:([^\\\\n\\\\r]*?(?=%%)|[^\\\\n\\\\r]*)|\\\\s*{([^}]*)})/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"ACC_TITLE","definition":{"$type":"RegexToken","regex":"/[\\\\t ]*accTitle[\\\\t ]*:(?:[^\\\\n\\\\r]*?(?=%%)|[^\\\\n\\\\r]*)/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"TITLE","definition":{"$type":"RegexToken","regex":"/[\\\\t ]*title(?:[\\\\t ][^\\\\n\\\\r]*?(?=%%)|[\\\\t ][^\\\\n\\\\r]*|)/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"FLOAT","type":{"$type":"ReturnType","name":"number"},"definition":{"$type":"RegexToken","regex":"/[0-9]+\\\\.[0-9]+(?!\\\\.)/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"INT","type":{"$type":"ReturnType","name":"number"},"definition":{"$type":"RegexToken","regex":"/0|[1-9][0-9]*(?!\\\\.)/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"NUMBER","type":{"$type":"ReturnType","name":"number"},"definition":{"$type":"TerminalAlternatives","elements":[{"$type":"TerminalRuleCall","rule":{"$ref":"#/rules@14"},"parenthesized":false},{"$type":"TerminalRuleCall","rule":{"$ref":"#/rules@15"},"parenthesized":false}],"parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"STRING","type":{"$type":"ReturnType","name":"string"},"definition":{"$type":"RegexToken","regex":"/\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\"|'([^'\\\\\\\\]|\\\\\\\\.)*'/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"ID","type":{"$type":"ReturnType","name":"string"},"definition":{"$type":"RegexToken","regex":"/[\\\\w]([-\\\\w]*\\\\w)?/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"NEWLINE","definition":{"$type":"RegexToken","regex":"/\\\\r?\\\\n/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","hidden":true,"name":"WHITESPACE","definition":{"$type":"RegexToken","regex":"/[\\\\t ]+/","parenthesized":false},"fragment":false},{"$type":"TerminalRule","hidden":true,"name":"YAML","definition":{"$type":"RegexToken","regex":"/---[\\\\t ]*\\\\r?\\\\n(?:[\\\\S\\\\s]*?\\\\r?\\\\n)?---(?:\\\\r?\\\\n|(?!\\\\S))/","parenthesized":false},"fragment":false},{"$type":"TerminalRule","hidden":true,"name":"DIRECTIVE","definition":{"$type":"RegexToken","regex":"/[\\\\t ]*%%{[\\\\S\\\\s]*?}%%(?:\\\\r?\\\\n|(?!\\\\S))/","parenthesized":false},"fragment":false},{"$type":"TerminalRule","hidden":true,"name":"SINGLE_LINE_COMMENT","definition":{"$type":"RegexToken","regex":"/[\\\\t ]*%%[^\\\\n\\\\r]*/","parenthesized":false},"fragment":false},{"$type":"TerminalRule","name":"REFERENCE","type":{"$type":"ReturnType","name":"string"},"definition":{"$type":"RegexToken","regex":"/\\\\w([-\\\\./\\\\w]*[-\\\\w])?/","parenthesized":false},"fragment":false,"hidden":false}],"interfaces":[],"types":[]}`)), "GitGraphGrammarGrammar");
var loadedInfoGrammarGrammar;
var InfoGrammarGrammar = /* @__PURE__ */ __name(() => loadedInfoGrammarGrammar ?? (loadedInfoGrammarGrammar = loadGrammarFromJson(`{"$type":"Grammar","isDeclared":true,"name":"InfoGrammar","imports":[],"rules":[{"$type":"ParserRule","entry":true,"name":"Info","definition":{"$type":"Group","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@12"},"arguments":[],"cardinality":"*"},{"$type":"Keyword","value":"info"},{"$type":"RuleCall","rule":{"$ref":"#/rules@12"},"arguments":[],"cardinality":"*"},{"$type":"Group","elements":[{"$type":"Keyword","value":"showInfo"},{"$type":"RuleCall","rule":{"$ref":"#/rules@12"},"arguments":[],"cardinality":"*"}],"cardinality":"?"},{"$type":"RuleCall","rule":{"$ref":"#/rules@2"},"arguments":[],"cardinality":"?"}]},"fragment":false,"parameters":[]},{"$type":"ParserRule","name":"EOL","dataType":"string","definition":{"$type":"Alternatives","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@12"},"arguments":[],"cardinality":"+"},{"$type":"EndOfFile"}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"ParserRule","fragment":true,"name":"TitleAndAccessibilities","definition":{"$type":"Group","elements":[{"$type":"Alternatives","elements":[{"$type":"Assignment","feature":"accDescr","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@4"},"arguments":[]}},{"$type":"Assignment","feature":"accTitle","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@5"},"arguments":[]}},{"$type":"Assignment","feature":"title","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@6"},"arguments":[]}}]},{"$type":"RuleCall","rule":{"$ref":"#/rules@1"},"arguments":[]}],"cardinality":"+"},"entry":false,"parameters":[]},{"$type":"TerminalRule","name":"BOOLEAN","type":{"$type":"ReturnType","name":"boolean"},"definition":{"$type":"TerminalAlternatives","elements":[{"$type":"CharacterRange","left":{"$type":"Keyword","value":"true"},"parenthesized":false},{"$type":"CharacterRange","left":{"$type":"Keyword","value":"false"},"parenthesized":false}],"parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"ACC_DESCR","definition":{"$type":"RegexToken","regex":"/[\\\\t ]*accDescr(?:[\\\\t ]*:([^\\\\n\\\\r]*?(?=%%)|[^\\\\n\\\\r]*)|\\\\s*{([^}]*)})/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"ACC_TITLE","definition":{"$type":"RegexToken","regex":"/[\\\\t ]*accTitle[\\\\t ]*:(?:[^\\\\n\\\\r]*?(?=%%)|[^\\\\n\\\\r]*)/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"TITLE","definition":{"$type":"RegexToken","regex":"/[\\\\t ]*title(?:[\\\\t ][^\\\\n\\\\r]*?(?=%%)|[\\\\t ][^\\\\n\\\\r]*|)/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"FLOAT","type":{"$type":"ReturnType","name":"number"},"definition":{"$type":"RegexToken","regex":"/[0-9]+\\\\.[0-9]+(?!\\\\.)/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"INT","type":{"$type":"ReturnType","name":"number"},"definition":{"$type":"RegexToken","regex":"/0|[1-9][0-9]*(?!\\\\.)/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"NUMBER","type":{"$type":"ReturnType","name":"number"},"definition":{"$type":"TerminalAlternatives","elements":[{"$type":"TerminalRuleCall","rule":{"$ref":"#/rules@7"},"parenthesized":false},{"$type":"TerminalRuleCall","rule":{"$ref":"#/rules@8"},"parenthesized":false}],"parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"STRING","type":{"$type":"ReturnType","name":"string"},"definition":{"$type":"RegexToken","regex":"/\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\"|'([^'\\\\\\\\]|\\\\\\\\.)*'/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"ID","type":{"$type":"ReturnType","name":"string"},"definition":{"$type":"RegexToken","regex":"/[\\\\w]([-\\\\w]*\\\\w)?/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"NEWLINE","definition":{"$type":"RegexToken","regex":"/\\\\r?\\\\n/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","hidden":true,"name":"WHITESPACE","definition":{"$type":"RegexToken","regex":"/[\\\\t ]+/","parenthesized":false},"fragment":false},{"$type":"TerminalRule","hidden":true,"name":"YAML","definition":{"$type":"RegexToken","regex":"/---[\\\\t ]*\\\\r?\\\\n(?:[\\\\S\\\\s]*?\\\\r?\\\\n)?---(?:\\\\r?\\\\n|(?!\\\\S))/","parenthesized":false},"fragment":false},{"$type":"TerminalRule","hidden":true,"name":"DIRECTIVE","definition":{"$type":"RegexToken","regex":"/[\\\\t ]*%%{[\\\\S\\\\s]*?}%%(?:\\\\r?\\\\n|(?!\\\\S))/","parenthesized":false},"fragment":false},{"$type":"TerminalRule","hidden":true,"name":"SINGLE_LINE_COMMENT","definition":{"$type":"RegexToken","regex":"/[\\\\t ]*%%[^\\\\n\\\\r]*/","parenthesized":false},"fragment":false}],"interfaces":[],"types":[]}`)), "InfoGrammarGrammar");
var loadedPacketGrammarGrammar;
var PacketGrammarGrammar = /* @__PURE__ */ __name(() => loadedPacketGrammarGrammar ?? (loadedPacketGrammarGrammar = loadGrammarFromJson(`{"$type":"Grammar","isDeclared":true,"name":"PacketGrammar","imports":[],"rules":[{"$type":"ParserRule","entry":true,"name":"Packet","definition":{"$type":"Group","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@13"},"arguments":[],"cardinality":"*"},{"$type":"Alternatives","elements":[{"$type":"Keyword","value":"packet"},{"$type":"Keyword","value":"packet-beta"}]},{"$type":"Alternatives","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@3"},"arguments":[]},{"$type":"Assignment","feature":"blocks","operator":"+=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@1"},"arguments":[]}},{"$type":"RuleCall","rule":{"$ref":"#/rules@13"},"arguments":[]}],"cardinality":"*"}]},"fragment":false,"parameters":[]},{"$type":"ParserRule","name":"PacketBlock","definition":{"$type":"Group","elements":[{"$type":"Alternatives","elements":[{"$type":"Group","elements":[{"$type":"Assignment","feature":"start","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@9"},"arguments":[]}},{"$type":"Group","elements":[{"$type":"Keyword","value":"-"},{"$type":"Assignment","feature":"end","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@9"},"arguments":[]}}],"cardinality":"?"}]},{"$type":"Group","elements":[{"$type":"Keyword","value":"+"},{"$type":"Assignment","feature":"bits","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@9"},"arguments":[]}}]}]},{"$type":"Keyword","value":":"},{"$type":"Assignment","feature":"label","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@11"},"arguments":[]}},{"$type":"RuleCall","rule":{"$ref":"#/rules@2"},"arguments":[]}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"ParserRule","name":"EOL","dataType":"string","definition":{"$type":"Alternatives","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@13"},"arguments":[],"cardinality":"+"},{"$type":"EndOfFile"}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"ParserRule","fragment":true,"name":"TitleAndAccessibilities","definition":{"$type":"Group","elements":[{"$type":"Alternatives","elements":[{"$type":"Assignment","feature":"accDescr","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@5"},"arguments":[]}},{"$type":"Assignment","feature":"accTitle","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@6"},"arguments":[]}},{"$type":"Assignment","feature":"title","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@7"},"arguments":[]}}]},{"$type":"RuleCall","rule":{"$ref":"#/rules@2"},"arguments":[]}],"cardinality":"+"},"entry":false,"parameters":[]},{"$type":"TerminalRule","name":"BOOLEAN","type":{"$type":"ReturnType","name":"boolean"},"definition":{"$type":"TerminalAlternatives","elements":[{"$type":"CharacterRange","left":{"$type":"Keyword","value":"true"},"parenthesized":false},{"$type":"CharacterRange","left":{"$type":"Keyword","value":"false"},"parenthesized":false}],"parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"ACC_DESCR","definition":{"$type":"RegexToken","regex":"/[\\\\t ]*accDescr(?:[\\\\t ]*:([^\\\\n\\\\r]*?(?=%%)|[^\\\\n\\\\r]*)|\\\\s*{([^}]*)})/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"ACC_TITLE","definition":{"$type":"RegexToken","regex":"/[\\\\t ]*accTitle[\\\\t ]*:(?:[^\\\\n\\\\r]*?(?=%%)|[^\\\\n\\\\r]*)/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"TITLE","definition":{"$type":"RegexToken","regex":"/[\\\\t ]*title(?:[\\\\t ][^\\\\n\\\\r]*?(?=%%)|[\\\\t ][^\\\\n\\\\r]*|)/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"FLOAT","type":{"$type":"ReturnType","name":"number"},"definition":{"$type":"RegexToken","regex":"/[0-9]+\\\\.[0-9]+(?!\\\\.)/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"INT","type":{"$type":"ReturnType","name":"number"},"definition":{"$type":"RegexToken","regex":"/0|[1-9][0-9]*(?!\\\\.)/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"NUMBER","type":{"$type":"ReturnType","name":"number"},"definition":{"$type":"TerminalAlternatives","elements":[{"$type":"TerminalRuleCall","rule":{"$ref":"#/rules@8"},"parenthesized":false},{"$type":"TerminalRuleCall","rule":{"$ref":"#/rules@9"},"parenthesized":false}],"parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"STRING","type":{"$type":"ReturnType","name":"string"},"definition":{"$type":"RegexToken","regex":"/\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\"|'([^'\\\\\\\\]|\\\\\\\\.)*'/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"ID","type":{"$type":"ReturnType","name":"string"},"definition":{"$type":"RegexToken","regex":"/[\\\\w]([-\\\\w]*\\\\w)?/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"NEWLINE","definition":{"$type":"RegexToken","regex":"/\\\\r?\\\\n/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","hidden":true,"name":"WHITESPACE","definition":{"$type":"RegexToken","regex":"/[\\\\t ]+/","parenthesized":false},"fragment":false},{"$type":"TerminalRule","hidden":true,"name":"YAML","definition":{"$type":"RegexToken","regex":"/---[\\\\t ]*\\\\r?\\\\n(?:[\\\\S\\\\s]*?\\\\r?\\\\n)?---(?:\\\\r?\\\\n|(?!\\\\S))/","parenthesized":false},"fragment":false},{"$type":"TerminalRule","hidden":true,"name":"DIRECTIVE","definition":{"$type":"RegexToken","regex":"/[\\\\t ]*%%{[\\\\S\\\\s]*?}%%(?:\\\\r?\\\\n|(?!\\\\S))/","parenthesized":false},"fragment":false},{"$type":"TerminalRule","hidden":true,"name":"SINGLE_LINE_COMMENT","definition":{"$type":"RegexToken","regex":"/[\\\\t ]*%%[^\\\\n\\\\r]*/","parenthesized":false},"fragment":false}],"interfaces":[],"types":[]}`)), "PacketGrammarGrammar");
var loadedPieGrammarGrammar;
var PieGrammarGrammar = /* @__PURE__ */ __name(() => loadedPieGrammarGrammar ?? (loadedPieGrammarGrammar = loadGrammarFromJson(`{"$type":"Grammar","isDeclared":true,"name":"PieGrammar","imports":[],"rules":[{"$type":"ParserRule","entry":true,"name":"Pie","definition":{"$type":"Group","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@16"},"arguments":[],"cardinality":"*"},{"$type":"Keyword","value":"pie"},{"$type":"Assignment","feature":"showData","operator":"?=","terminal":{"$type":"Keyword","value":"showData"},"cardinality":"?"},{"$type":"Alternatives","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@6"},"arguments":[]},{"$type":"Assignment","feature":"sections","operator":"+=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@1"},"arguments":[]}},{"$type":"RuleCall","rule":{"$ref":"#/rules@16"},"arguments":[]}],"cardinality":"*"}]},"fragment":false,"parameters":[]},{"$type":"ParserRule","name":"PieSection","definition":{"$type":"Group","elements":[{"$type":"Assignment","feature":"label","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@14"},"arguments":[]}},{"$type":"Keyword","value":":"},{"$type":"Assignment","feature":"value","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@4"},"arguments":[]}},{"$type":"RuleCall","rule":{"$ref":"#/rules@5"},"arguments":[]}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"TerminalRule","name":"FLOAT_PIE","type":{"$type":"ReturnType","name":"number"},"definition":{"$type":"RegexToken","regex":"/-?[0-9]+\\\\.[0-9]+(?!\\\\.)/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"INT_PIE","type":{"$type":"ReturnType","name":"number"},"definition":{"$type":"RegexToken","regex":"/-?(0|[1-9][0-9]*)(?!\\\\.)/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"NUMBER_PIE","type":{"$type":"ReturnType","name":"number"},"definition":{"$type":"TerminalAlternatives","elements":[{"$type":"TerminalRuleCall","rule":{"$ref":"#/rules@2"},"parenthesized":false},{"$type":"TerminalRuleCall","rule":{"$ref":"#/rules@3"},"parenthesized":false}],"parenthesized":false},"fragment":false,"hidden":false},{"$type":"ParserRule","name":"EOL","dataType":"string","definition":{"$type":"Alternatives","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@16"},"arguments":[],"cardinality":"+"},{"$type":"EndOfFile"}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"ParserRule","fragment":true,"name":"TitleAndAccessibilities","definition":{"$type":"Group","elements":[{"$type":"Alternatives","elements":[{"$type":"Assignment","feature":"accDescr","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@8"},"arguments":[]}},{"$type":"Assignment","feature":"accTitle","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@9"},"arguments":[]}},{"$type":"Assignment","feature":"title","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@10"},"arguments":[]}}]},{"$type":"RuleCall","rule":{"$ref":"#/rules@5"},"arguments":[]}],"cardinality":"+"},"entry":false,"parameters":[]},{"$type":"TerminalRule","name":"BOOLEAN","type":{"$type":"ReturnType","name":"boolean"},"definition":{"$type":"TerminalAlternatives","elements":[{"$type":"CharacterRange","left":{"$type":"Keyword","value":"true"},"parenthesized":false},{"$type":"CharacterRange","left":{"$type":"Keyword","value":"false"},"parenthesized":false}],"parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"ACC_DESCR","definition":{"$type":"RegexToken","regex":"/[\\\\t ]*accDescr(?:[\\\\t ]*:([^\\\\n\\\\r]*?(?=%%)|[^\\\\n\\\\r]*)|\\\\s*{([^}]*)})/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"ACC_TITLE","definition":{"$type":"RegexToken","regex":"/[\\\\t ]*accTitle[\\\\t ]*:(?:[^\\\\n\\\\r]*?(?=%%)|[^\\\\n\\\\r]*)/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"TITLE","definition":{"$type":"RegexToken","regex":"/[\\\\t ]*title(?:[\\\\t ][^\\\\n\\\\r]*?(?=%%)|[\\\\t ][^\\\\n\\\\r]*|)/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"FLOAT","type":{"$type":"ReturnType","name":"number"},"definition":{"$type":"RegexToken","regex":"/[0-9]+\\\\.[0-9]+(?!\\\\.)/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"INT","type":{"$type":"ReturnType","name":"number"},"definition":{"$type":"RegexToken","regex":"/0|[1-9][0-9]*(?!\\\\.)/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"NUMBER","type":{"$type":"ReturnType","name":"number"},"definition":{"$type":"TerminalAlternatives","elements":[{"$type":"TerminalRuleCall","rule":{"$ref":"#/rules@11"},"parenthesized":false},{"$type":"TerminalRuleCall","rule":{"$ref":"#/rules@12"},"parenthesized":false}],"parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"STRING","type":{"$type":"ReturnType","name":"string"},"definition":{"$type":"RegexToken","regex":"/\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\"|'([^'\\\\\\\\]|\\\\\\\\.)*'/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"ID","type":{"$type":"ReturnType","name":"string"},"definition":{"$type":"RegexToken","regex":"/[\\\\w]([-\\\\w]*\\\\w)?/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"NEWLINE","definition":{"$type":"RegexToken","regex":"/\\\\r?\\\\n/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","hidden":true,"name":"WHITESPACE","definition":{"$type":"RegexToken","regex":"/[\\\\t ]+/","parenthesized":false},"fragment":false},{"$type":"TerminalRule","hidden":true,"name":"YAML","definition":{"$type":"RegexToken","regex":"/---[\\\\t ]*\\\\r?\\\\n(?:[\\\\S\\\\s]*?\\\\r?\\\\n)?---(?:\\\\r?\\\\n|(?!\\\\S))/","parenthesized":false},"fragment":false},{"$type":"TerminalRule","hidden":true,"name":"DIRECTIVE","definition":{"$type":"RegexToken","regex":"/[\\\\t ]*%%{[\\\\S\\\\s]*?}%%(?:\\\\r?\\\\n|(?!\\\\S))/","parenthesized":false},"fragment":false},{"$type":"TerminalRule","hidden":true,"name":"SINGLE_LINE_COMMENT","definition":{"$type":"RegexToken","regex":"/[\\\\t ]*%%[^\\\\n\\\\r]*/","parenthesized":false},"fragment":false}],"interfaces":[],"types":[]}`)), "PieGrammarGrammar");
var loadedRadarGrammarGrammar;
var RadarGrammarGrammar = /* @__PURE__ */ __name(() => loadedRadarGrammarGrammar ?? (loadedRadarGrammarGrammar = loadGrammarFromJson(`{"$type":"Grammar","isDeclared":true,"name":"RadarGrammar","imports":[],"rules":[{"$type":"ParserRule","entry":true,"name":"Radar","definition":{"$type":"Group","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@20"},"arguments":[],"cardinality":"*"},{"$type":"Alternatives","elements":[{"$type":"Keyword","value":"radar-beta"},{"$type":"Keyword","value":"radar-beta:"},{"$type":"Group","elements":[{"$type":"Keyword","value":"radar-beta"},{"$type":"Keyword","value":":"}]}]},{"$type":"RuleCall","rule":{"$ref":"#/rules@20"},"arguments":[],"cardinality":"*"},{"$type":"Alternatives","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@10"},"arguments":[]},{"$type":"Group","elements":[{"$type":"Keyword","value":"axis"},{"$type":"Assignment","feature":"axes","operator":"+=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@2"},"arguments":[]}},{"$type":"Group","elements":[{"$type":"Keyword","value":","},{"$type":"Assignment","feature":"axes","operator":"+=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@2"},"arguments":[]}}],"cardinality":"*"}]},{"$type":"Group","elements":[{"$type":"Keyword","value":"curve"},{"$type":"Assignment","feature":"curves","operator":"+=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@3"},"arguments":[]}},{"$type":"Group","elements":[{"$type":"Keyword","value":","},{"$type":"Assignment","feature":"curves","operator":"+=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@3"},"arguments":[]}}],"cardinality":"*"}]},{"$type":"Group","elements":[{"$type":"Assignment","feature":"options","operator":"+=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@7"},"arguments":[]}},{"$type":"Group","elements":[{"$type":"Keyword","value":","},{"$type":"Assignment","feature":"options","operator":"+=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@7"},"arguments":[]}}],"cardinality":"*"}]},{"$type":"RuleCall","rule":{"$ref":"#/rules@20"},"arguments":[]}],"cardinality":"*"}]},"fragment":false,"parameters":[]},{"$type":"ParserRule","fragment":true,"name":"Label","definition":{"$type":"Group","elements":[{"$type":"Keyword","value":"["},{"$type":"Assignment","feature":"label","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@18"},"arguments":[]}},{"$type":"Keyword","value":"]"}]},"entry":false,"parameters":[]},{"$type":"ParserRule","name":"Axis","definition":{"$type":"Group","elements":[{"$type":"Assignment","feature":"name","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@19"},"arguments":[]}},{"$type":"RuleCall","rule":{"$ref":"#/rules@1"},"arguments":[],"cardinality":"?"}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"ParserRule","name":"Curve","definition":{"$type":"Group","elements":[{"$type":"Assignment","feature":"name","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@19"},"arguments":[]}},{"$type":"RuleCall","rule":{"$ref":"#/rules@1"},"arguments":[],"cardinality":"?"},{"$type":"Keyword","value":"{"},{"$type":"RuleCall","rule":{"$ref":"#/rules@4"},"arguments":[]},{"$type":"Keyword","value":"}"}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"ParserRule","fragment":true,"name":"Entries","definition":{"$type":"Alternatives","elements":[{"$type":"Group","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@20"},"arguments":[],"cardinality":"*"},{"$type":"Assignment","feature":"entries","operator":"+=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@6"},"arguments":[]}},{"$type":"Group","elements":[{"$type":"Keyword","value":","},{"$type":"RuleCall","rule":{"$ref":"#/rules@20"},"arguments":[],"cardinality":"*"},{"$type":"Assignment","feature":"entries","operator":"+=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@6"},"arguments":[]}}],"cardinality":"*"},{"$type":"RuleCall","rule":{"$ref":"#/rules@20"},"arguments":[],"cardinality":"*"}]},{"$type":"Group","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@20"},"arguments":[],"cardinality":"*"},{"$type":"Assignment","feature":"entries","operator":"+=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@5"},"arguments":[]}},{"$type":"Group","elements":[{"$type":"Keyword","value":","},{"$type":"RuleCall","rule":{"$ref":"#/rules@20"},"arguments":[],"cardinality":"*"},{"$type":"Assignment","feature":"entries","operator":"+=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@5"},"arguments":[]}}],"cardinality":"*"},{"$type":"RuleCall","rule":{"$ref":"#/rules@20"},"arguments":[],"cardinality":"*"}]}]},"entry":false,"parameters":[]},{"$type":"ParserRule","name":"DetailedEntry","returnType":{"$ref":"#/interfaces@0"},"definition":{"$type":"Group","elements":[{"$type":"Assignment","feature":"axis","operator":"=","terminal":{"$type":"CrossReference","type":{"$ref":"#/rules@2"},"terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@19"},"arguments":[]},"deprecatedSyntax":false,"isMulti":false}},{"$type":"Keyword","value":":","cardinality":"?"},{"$type":"Assignment","feature":"value","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@17"},"arguments":[]}}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"ParserRule","name":"NumberEntry","returnType":{"$ref":"#/interfaces@0"},"definition":{"$type":"Assignment","feature":"value","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@17"},"arguments":[]}},"entry":false,"fragment":false,"parameters":[]},{"$type":"ParserRule","name":"Option","definition":{"$type":"Alternatives","elements":[{"$type":"Group","elements":[{"$type":"Assignment","feature":"name","operator":"=","terminal":{"$type":"Keyword","value":"showLegend"}},{"$type":"Assignment","feature":"value","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@11"},"arguments":[]}}]},{"$type":"Group","elements":[{"$type":"Assignment","feature":"name","operator":"=","terminal":{"$type":"Keyword","value":"ticks"}},{"$type":"Assignment","feature":"value","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@17"},"arguments":[]}}]},{"$type":"Group","elements":[{"$type":"Assignment","feature":"name","operator":"=","terminal":{"$type":"Keyword","value":"max"}},{"$type":"Assignment","feature":"value","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@17"},"arguments":[]}}]},{"$type":"Group","elements":[{"$type":"Assignment","feature":"name","operator":"=","terminal":{"$type":"Keyword","value":"min"}},{"$type":"Assignment","feature":"value","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@17"},"arguments":[]}}]},{"$type":"Group","elements":[{"$type":"Assignment","feature":"name","operator":"=","terminal":{"$type":"Keyword","value":"graticule"}},{"$type":"Assignment","feature":"value","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@8"},"arguments":[]}}]}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"TerminalRule","name":"GRATICULE","type":{"$type":"ReturnType","name":"string"},"definition":{"$type":"TerminalAlternatives","elements":[{"$type":"CharacterRange","left":{"$type":"Keyword","value":"circle"},"parenthesized":false},{"$type":"CharacterRange","left":{"$type":"Keyword","value":"polygon"},"parenthesized":false}],"parenthesized":false},"fragment":false,"hidden":false},{"$type":"ParserRule","name":"EOL","dataType":"string","definition":{"$type":"Alternatives","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@20"},"arguments":[],"cardinality":"+"},{"$type":"EndOfFile"}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"ParserRule","fragment":true,"name":"TitleAndAccessibilities","definition":{"$type":"Group","elements":[{"$type":"Alternatives","elements":[{"$type":"Assignment","feature":"accDescr","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@12"},"arguments":[]}},{"$type":"Assignment","feature":"accTitle","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@13"},"arguments":[]}},{"$type":"Assignment","feature":"title","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@14"},"arguments":[]}}]},{"$type":"RuleCall","rule":{"$ref":"#/rules@9"},"arguments":[]}],"cardinality":"+"},"entry":false,"parameters":[]},{"$type":"TerminalRule","name":"BOOLEAN","type":{"$type":"ReturnType","name":"boolean"},"definition":{"$type":"TerminalAlternatives","elements":[{"$type":"CharacterRange","left":{"$type":"Keyword","value":"true"},"parenthesized":false},{"$type":"CharacterRange","left":{"$type":"Keyword","value":"false"},"parenthesized":false}],"parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"ACC_DESCR","definition":{"$type":"RegexToken","regex":"/[\\\\t ]*accDescr(?:[\\\\t ]*:([^\\\\n\\\\r]*?(?=%%)|[^\\\\n\\\\r]*)|\\\\s*{([^}]*)})/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"ACC_TITLE","definition":{"$type":"RegexToken","regex":"/[\\\\t ]*accTitle[\\\\t ]*:(?:[^\\\\n\\\\r]*?(?=%%)|[^\\\\n\\\\r]*)/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"TITLE","definition":{"$type":"RegexToken","regex":"/[\\\\t ]*title(?:[\\\\t ][^\\\\n\\\\r]*?(?=%%)|[\\\\t ][^\\\\n\\\\r]*|)/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"FLOAT","type":{"$type":"ReturnType","name":"number"},"definition":{"$type":"RegexToken","regex":"/[0-9]+\\\\.[0-9]+(?!\\\\.)/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"INT","type":{"$type":"ReturnType","name":"number"},"definition":{"$type":"RegexToken","regex":"/0|[1-9][0-9]*(?!\\\\.)/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"NUMBER","type":{"$type":"ReturnType","name":"number"},"definition":{"$type":"TerminalAlternatives","elements":[{"$type":"TerminalRuleCall","rule":{"$ref":"#/rules@15"},"parenthesized":false},{"$type":"TerminalRuleCall","rule":{"$ref":"#/rules@16"},"parenthesized":false}],"parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"STRING","type":{"$type":"ReturnType","name":"string"},"definition":{"$type":"RegexToken","regex":"/\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\"|'([^'\\\\\\\\]|\\\\\\\\.)*'/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"ID","type":{"$type":"ReturnType","name":"string"},"definition":{"$type":"RegexToken","regex":"/[\\\\w]([-\\\\w]*\\\\w)?/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"NEWLINE","definition":{"$type":"RegexToken","regex":"/\\\\r?\\\\n/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","hidden":true,"name":"WHITESPACE","definition":{"$type":"RegexToken","regex":"/[\\\\t ]+/","parenthesized":false},"fragment":false},{"$type":"TerminalRule","hidden":true,"name":"YAML","definition":{"$type":"RegexToken","regex":"/---[\\\\t ]*\\\\r?\\\\n(?:[\\\\S\\\\s]*?\\\\r?\\\\n)?---(?:\\\\r?\\\\n|(?!\\\\S))/","parenthesized":false},"fragment":false},{"$type":"TerminalRule","hidden":true,"name":"DIRECTIVE","definition":{"$type":"RegexToken","regex":"/[\\\\t ]*%%{[\\\\S\\\\s]*?}%%(?:\\\\r?\\\\n|(?!\\\\S))/","parenthesized":false},"fragment":false},{"$type":"TerminalRule","hidden":true,"name":"SINGLE_LINE_COMMENT","definition":{"$type":"RegexToken","regex":"/[\\\\t ]*%%[^\\\\n\\\\r]*/","parenthesized":false},"fragment":false}],"interfaces":[{"$type":"Interface","name":"Entry","attributes":[{"$type":"TypeAttribute","name":"axis","isOptional":true,"type":{"$type":"ReferenceType","referenceType":{"$type":"SimpleType","typeRef":{"$ref":"#/rules@2"}},"isMulti":false}},{"$type":"TypeAttribute","name":"value","type":{"$type":"SimpleType","primitiveType":"number"},"isOptional":false}],"superTypes":[]}],"types":[]}`)), "RadarGrammarGrammar");
var loadedTreemapGrammarGrammar;
var TreemapGrammarGrammar = /* @__PURE__ */ __name(() => loadedTreemapGrammarGrammar ?? (loadedTreemapGrammarGrammar = loadGrammarFromJson(`{"$type":"Grammar","isDeclared":true,"name":"TreemapGrammar","rules":[{"$type":"ParserRule","fragment":true,"name":"TitleAndAccessibilities","definition":{"$type":"Alternatives","elements":[{"$type":"Assignment","feature":"accDescr","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@2"},"arguments":[]}},{"$type":"Assignment","feature":"accTitle","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@3"},"arguments":[]}},{"$type":"Assignment","feature":"title","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@4"},"arguments":[]}}],"cardinality":"+"},"entry":false,"parameters":[]},{"$type":"TerminalRule","name":"BOOLEAN","type":{"$type":"ReturnType","name":"boolean"},"definition":{"$type":"TerminalAlternatives","elements":[{"$type":"CharacterRange","left":{"$type":"Keyword","value":"true"},"parenthesized":false},{"$type":"CharacterRange","left":{"$type":"Keyword","value":"false"},"parenthesized":false}],"parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"ACC_DESCR","definition":{"$type":"RegexToken","regex":"/[\\\\t ]*accDescr(?:[\\\\t ]*:([^\\\\n\\\\r]*?(?=%%)|[^\\\\n\\\\r]*)|\\\\s*{([^}]*)})/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"ACC_TITLE","definition":{"$type":"RegexToken","regex":"/[\\\\t ]*accTitle[\\\\t ]*:(?:[^\\\\n\\\\r]*?(?=%%)|[^\\\\n\\\\r]*)/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"TITLE","definition":{"$type":"RegexToken","regex":"/[\\\\t ]*title(?:[\\\\t ][^\\\\n\\\\r]*?(?=%%)|[\\\\t ][^\\\\n\\\\r]*|)/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"ParserRule","entry":true,"name":"Treemap","returnType":{"$ref":"#/interfaces@4"},"definition":{"$type":"Group","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@6"},"arguments":[]},{"$type":"Alternatives","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@0"},"arguments":[]},{"$type":"Assignment","feature":"TreemapRows","operator":"+=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@15"},"arguments":[]}}],"cardinality":"*"}]},"fragment":false,"parameters":[]},{"$type":"TerminalRule","name":"TREEMAP_KEYWORD","definition":{"$type":"TerminalAlternatives","elements":[{"$type":"CharacterRange","left":{"$type":"Keyword","value":"treemap-beta"},"parenthesized":false},{"$type":"CharacterRange","left":{"$type":"Keyword","value":"treemap"},"parenthesized":false}],"parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"CLASS_DEF","definition":{"$type":"RegexToken","regex":"/classDef\\\\s+([a-zA-Z_][a-zA-Z0-9_]+)(?:\\\\s+([^;\\\\r\\\\n]*))?(?:;)?/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"STYLE_SEPARATOR","definition":{"$type":"CharacterRange","left":{"$type":"Keyword","value":":::"},"parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"SEPARATOR","definition":{"$type":"CharacterRange","left":{"$type":"Keyword","value":":"},"parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"COMMA","definition":{"$type":"CharacterRange","left":{"$type":"Keyword","value":","},"parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"INDENTATION","definition":{"$type":"RegexToken","regex":"/[ \\\\t]{1,}/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","hidden":true,"name":"WS","definition":{"$type":"RegexToken","regex":"/[ \\\\t]+/","parenthesized":false},"fragment":false},{"$type":"TerminalRule","hidden":true,"name":"ML_COMMENT","definition":{"$type":"RegexToken","regex":"/\\\\%\\\\%[^\\\\n]*/","parenthesized":false},"fragment":false},{"$type":"TerminalRule","hidden":true,"name":"NL","definition":{"$type":"RegexToken","regex":"/\\\\r?\\\\n/","parenthesized":false},"fragment":false},{"$type":"ParserRule","name":"TreemapRow","definition":{"$type":"Group","elements":[{"$type":"Assignment","feature":"indent","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@11"},"arguments":[]},"cardinality":"?"},{"$type":"Alternatives","elements":[{"$type":"Assignment","feature":"item","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@17"},"arguments":[]}},{"$type":"RuleCall","rule":{"$ref":"#/rules@16"},"arguments":[]}]}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"ParserRule","name":"ClassDef","dataType":"string","definition":{"$type":"RuleCall","rule":{"$ref":"#/rules@7"},"arguments":[]},"entry":false,"fragment":false,"parameters":[]},{"$type":"ParserRule","name":"Item","returnType":{"$ref":"#/interfaces@0"},"definition":{"$type":"Alternatives","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@19"},"arguments":[]},{"$type":"RuleCall","rule":{"$ref":"#/rules@18"},"arguments":[]}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"ParserRule","name":"Section","returnType":{"$ref":"#/interfaces@1"},"definition":{"$type":"Group","elements":[{"$type":"Assignment","feature":"name","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@23"},"arguments":[]}},{"$type":"Group","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@8"},"arguments":[]},{"$type":"Assignment","feature":"classSelector","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@20"},"arguments":[]}}],"cardinality":"?"}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"ParserRule","name":"Leaf","returnType":{"$ref":"#/interfaces@2"},"definition":{"$type":"Group","elements":[{"$type":"Assignment","feature":"name","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@23"},"arguments":[]}},{"$type":"RuleCall","rule":{"$ref":"#/rules@11"},"arguments":[],"cardinality":"?"},{"$type":"Alternatives","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@9"},"arguments":[]},{"$type":"RuleCall","rule":{"$ref":"#/rules@10"},"arguments":[]}]},{"$type":"RuleCall","rule":{"$ref":"#/rules@11"},"arguments":[],"cardinality":"?"},{"$type":"Assignment","feature":"value","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@22"},"arguments":[]}},{"$type":"Group","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@8"},"arguments":[]},{"$type":"Assignment","feature":"classSelector","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@20"},"arguments":[]}}],"cardinality":"?"}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"TerminalRule","name":"ID2","definition":{"$type":"RegexToken","regex":"/[a-zA-Z_][a-zA-Z0-9_]*/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"NUMBER2","definition":{"$type":"RegexToken","regex":"/[0-9_\\\\.\\\\,]+/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"ParserRule","name":"MyNumber","dataType":"number","definition":{"$type":"RuleCall","rule":{"$ref":"#/rules@21"},"arguments":[]},"entry":false,"fragment":false,"parameters":[]},{"$type":"TerminalRule","name":"STRING2","definition":{"$type":"RegexToken","regex":"/\\"[^\\"]*\\"|'[^']*'/","parenthesized":false},"fragment":false,"hidden":false}],"interfaces":[{"$type":"Interface","name":"Item","attributes":[{"$type":"TypeAttribute","name":"name","type":{"$type":"SimpleType","primitiveType":"string"},"isOptional":false},{"$type":"TypeAttribute","name":"classSelector","isOptional":true,"type":{"$type":"SimpleType","primitiveType":"string"}}],"superTypes":[]},{"$type":"Interface","name":"Section","superTypes":[{"$ref":"#/interfaces@0"}],"attributes":[]},{"$type":"Interface","name":"Leaf","superTypes":[{"$ref":"#/interfaces@0"}],"attributes":[{"$type":"TypeAttribute","name":"value","type":{"$type":"SimpleType","primitiveType":"number"},"isOptional":false}]},{"$type":"Interface","name":"ClassDefStatement","attributes":[{"$type":"TypeAttribute","name":"className","type":{"$type":"SimpleType","primitiveType":"string"},"isOptional":false},{"$type":"TypeAttribute","name":"styleText","type":{"$type":"SimpleType","primitiveType":"string"},"isOptional":false}],"superTypes":[]},{"$type":"Interface","name":"Treemap","attributes":[{"$type":"TypeAttribute","name":"TreemapRows","type":{"$type":"ArrayType","elementType":{"$type":"SimpleType","typeRef":{"$ref":"#/rules@15"}}},"isOptional":false},{"$type":"TypeAttribute","name":"title","isOptional":true,"type":{"$type":"SimpleType","primitiveType":"string"}},{"$type":"TypeAttribute","name":"accTitle","isOptional":true,"type":{"$type":"SimpleType","primitiveType":"string"}},{"$type":"TypeAttribute","name":"accDescr","isOptional":true,"type":{"$type":"SimpleType","primitiveType":"string"}}],"superTypes":[]}],"imports":[],"types":[],"$comment":"/**\\n * Treemap grammar for Langium\\n * Converted from mindmap grammar\\n *\\n * The ML_COMMENT and NL hidden terminals handle whitespace, comments, and newlines\\n * before the treemap keyword, allowing for empty lines and comments before the\\n * treemap declaration.\\n */"}`)), "TreemapGrammarGrammar");
var loadedTreeViewGrammarGrammar;
var TreeViewGrammarGrammar = /* @__PURE__ */ __name(() => loadedTreeViewGrammarGrammar ?? (loadedTreeViewGrammarGrammar = loadGrammarFromJson(`{"$type":"Grammar","isDeclared":true,"name":"TreeViewGrammar","rules":[{"$type":"TerminalRule","name":"ACC_DESCR","definition":{"$type":"RegexToken","regex":"/[\\\\t ]*accDescr(?:[\\\\t ]*:([^\\\\n\\\\r]*?(?=%%)|[^\\\\n\\\\r]*)|\\\\s*{([^}]*)})/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"ACC_TITLE","definition":{"$type":"RegexToken","regex":"/[\\\\t ]*accTitle[\\\\t ]*:(?:[^\\\\n\\\\r]*?(?=%%)|[^\\\\n\\\\r]*)/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"TITLE","definition":{"$type":"RegexToken","regex":"/[\\\\t ]*title(?:[\\\\t ][^\\\\n\\\\r]*?(?=%%)|[\\\\t ][^\\\\n\\\\r]*|)/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"ParserRule","entry":true,"name":"TreeView","returnType":{"$ref":"#/interfaces@0"},"definition":{"$type":"Group","elements":[{"$type":"Keyword","value":"treeView-beta"},{"$type":"RuleCall","rule":{"$ref":"#/rules@4"},"arguments":[],"cardinality":"?"},{"$type":"Assignment","feature":"nodes","operator":"+=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@9"},"arguments":[]},"cardinality":"*"}]},"fragment":false,"parameters":[]},{"$type":"ParserRule","fragment":true,"name":"TitleAndAccessibilities","definition":{"$type":"Alternatives","elements":[{"$type":"Assignment","feature":"accDescr","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@0"},"arguments":[]}},{"$type":"Assignment","feature":"accTitle","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@1"},"arguments":[]}},{"$type":"Assignment","feature":"title","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@2"},"arguments":[]}}],"cardinality":"+"},"entry":false,"parameters":[]},{"$type":"TerminalRule","name":"INDENTATION","definition":{"$type":"RegexToken","regex":"/[ \\\\t]{1,}/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","hidden":true,"name":"WS","definition":{"$type":"RegexToken","regex":"/[ \\\\t]+/","parenthesized":false},"fragment":false},{"$type":"TerminalRule","hidden":true,"name":"ML_COMMENT","definition":{"$type":"RegexToken","regex":"/\\\\%\\\\%[^\\\\n]*/","parenthesized":false},"fragment":false},{"$type":"TerminalRule","hidden":true,"name":"NL","definition":{"$type":"RegexToken","regex":"/\\\\r?\\\\n/","parenthesized":false},"fragment":false},{"$type":"ParserRule","name":"TreeNode","definition":{"$type":"Group","elements":[{"$type":"Assignment","feature":"indent","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@5"},"arguments":[]},"cardinality":"?"},{"$type":"Assignment","feature":"name","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@10"},"arguments":[]}}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"TerminalRule","name":"STRING2","definition":{"$type":"RegexToken","regex":"/\\"[^\\"]*\\"|'[^']*'/","parenthesized":false},"fragment":false,"hidden":false}],"interfaces":[{"$type":"Interface","name":"TreeView","attributes":[{"$type":"TypeAttribute","name":"nodes","type":{"$type":"ArrayType","elementType":{"$type":"SimpleType","typeRef":{"$ref":"#/rules@9"}}},"isOptional":false},{"$type":"TypeAttribute","name":"title","isOptional":true,"type":{"$type":"SimpleType","primitiveType":"string"}},{"$type":"TypeAttribute","name":"accTitle","isOptional":true,"type":{"$type":"SimpleType","primitiveType":"string"}},{"$type":"TypeAttribute","name":"accDescr","isOptional":true,"type":{"$type":"SimpleType","primitiveType":"string"}}],"superTypes":[]}],"imports":[],"types":[],"$comment":"/**\\n * TreeView grammar for Langium\\n * Converted from treemap grammar\\n *\\n * The ML_COMMENT and NL hidden terminals handle whitespace, comments, and newlines\\n * before the treemap keyword, allowing for empty lines and comments before the\\n * treeView declaration.\\n */"}`)), "TreeViewGrammarGrammar");
var loadedWardleyGrammarGrammar;
var WardleyGrammarGrammar = /* @__PURE__ */ __name(() => loadedWardleyGrammarGrammar ?? (loadedWardleyGrammarGrammar = loadGrammarFromJson(`{"$type":"Grammar","isDeclared":true,"name":"WardleyGrammar","imports":[],"rules":[{"$type":"ParserRule","entry":true,"name":"Wardley","definition":{"$type":"Group","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@52"},"arguments":[],"cardinality":"*"},{"$type":"RuleCall","rule":{"$ref":"#/rules@25"},"arguments":[]},{"$type":"Alternatives","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@52"},"arguments":[]},{"$type":"RuleCall","rule":{"$ref":"#/rules@42"},"arguments":[]},{"$type":"RuleCall","rule":{"$ref":"#/rules@1"},"arguments":[]}],"cardinality":"*"}]},"fragment":false,"parameters":[]},{"$type":"ParserRule","fragment":true,"name":"Statement","definition":{"$type":"Alternatives","elements":[{"$type":"Assignment","feature":"size","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@2"},"arguments":[]}},{"$type":"Assignment","feature":"evolution","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@3"},"arguments":[]}},{"$type":"Assignment","feature":"anchors","operator":"+=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@5"},"arguments":[]}},{"$type":"Assignment","feature":"components","operator":"+=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@6"},"arguments":[]}},{"$type":"Assignment","feature":"links","operator":"+=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@9"},"arguments":[]}},{"$type":"Assignment","feature":"evolves","operator":"+=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@10"},"arguments":[]}},{"$type":"Assignment","feature":"pipelines","operator":"+=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@11"},"arguments":[]}},{"$type":"Assignment","feature":"notes","operator":"+=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@13"},"arguments":[]}},{"$type":"Assignment","feature":"annotations","operator":"+=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@14"},"arguments":[]}},{"$type":"Assignment","feature":"annotation","operator":"+=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@15"},"arguments":[]}},{"$type":"Assignment","feature":"accelerators","operator":"+=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@17"},"arguments":[]}},{"$type":"Assignment","feature":"deaccelerators","operator":"+=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@18"},"arguments":[]}}]},"entry":false,"parameters":[]},{"$type":"ParserRule","name":"Size","definition":{"$type":"Group","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@26"},"arguments":[]},{"$type":"Keyword","value":"["},{"$type":"Assignment","feature":"width","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@48"},"arguments":[]}},{"$type":"Keyword","value":","},{"$type":"Assignment","feature":"height","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@48"},"arguments":[]}},{"$type":"Keyword","value":"]"},{"$type":"RuleCall","rule":{"$ref":"#/rules@41"},"arguments":[]}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"ParserRule","name":"Evolution","definition":{"$type":"Group","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@27"},"arguments":[]},{"$type":"Assignment","feature":"stages","operator":"+=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@4"},"arguments":[]}},{"$type":"Group","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@20"},"arguments":[]},{"$type":"Assignment","feature":"stages","operator":"+=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@4"},"arguments":[]}}],"cardinality":"+"},{"$type":"RuleCall","rule":{"$ref":"#/rules@41"},"arguments":[]}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"ParserRule","name":"EvolutionStage","definition":{"$type":"Group","elements":[{"$type":"Assignment","feature":"name","operator":"=","terminal":{"$type":"Alternatives","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@51"},"arguments":[]},{"$type":"RuleCall","rule":{"$ref":"#/rules@50"},"arguments":[]},{"$type":"RuleCall","rule":{"$ref":"#/rules@39"},"arguments":[]}]}},{"$type":"Group","elements":[{"$type":"Keyword","value":"@"},{"$type":"Assignment","feature":"boundary","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@19"},"arguments":[]}}],"cardinality":"?"},{"$type":"Group","elements":[{"$type":"Keyword","value":"/"},{"$type":"Assignment","feature":"secondName","operator":"=","terminal":{"$type":"Alternatives","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@51"},"arguments":[]},{"$type":"RuleCall","rule":{"$ref":"#/rules@50"},"arguments":[]},{"$type":"RuleCall","rule":{"$ref":"#/rules@39"},"arguments":[]}]}}],"cardinality":"?"}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"ParserRule","name":"Anchor","definition":{"$type":"Group","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@28"},"arguments":[]},{"$type":"Assignment","feature":"name","operator":"=","terminal":{"$type":"Alternatives","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@50"},"arguments":[]},{"$type":"RuleCall","rule":{"$ref":"#/rules@51"},"arguments":[]},{"$type":"RuleCall","rule":{"$ref":"#/rules@39"},"arguments":[]}]}},{"$type":"Keyword","value":"["},{"$type":"Assignment","feature":"visibility","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@19"},"arguments":[]}},{"$type":"Keyword","value":","},{"$type":"Assignment","feature":"evolution","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@19"},"arguments":[]}},{"$type":"Keyword","value":"]"},{"$type":"RuleCall","rule":{"$ref":"#/rules@41"},"arguments":[]}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"ParserRule","name":"Component","definition":{"$type":"Group","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@29"},"arguments":[]},{"$type":"Assignment","feature":"name","operator":"=","terminal":{"$type":"Alternatives","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@50"},"arguments":[]},{"$type":"RuleCall","rule":{"$ref":"#/rules@51"},"arguments":[]},{"$type":"RuleCall","rule":{"$ref":"#/rules@39"},"arguments":[]}]}},{"$type":"Keyword","value":"["},{"$type":"Assignment","feature":"visibility","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@19"},"arguments":[]}},{"$type":"Keyword","value":","},{"$type":"Assignment","feature":"evolution","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@19"},"arguments":[]}},{"$type":"Keyword","value":"]"},{"$type":"Assignment","feature":"label","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@7"},"arguments":[]},"cardinality":"?"},{"$type":"Assignment","feature":"decorator","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@8"},"arguments":[]},"cardinality":"?"},{"$type":"Alternatives","elements":[{"$type":"Assignment","feature":"inertia","operator":"?=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@31"},"arguments":[]}},{"$type":"Group","elements":[{"$type":"Keyword","value":"("},{"$type":"Assignment","feature":"inertia","operator":"?=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@31"},"arguments":[]}},{"$type":"Keyword","value":")"}]}],"cardinality":"?"},{"$type":"RuleCall","rule":{"$ref":"#/rules@41"},"arguments":[]}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"ParserRule","name":"Label","definition":{"$type":"Group","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@30"},"arguments":[]},{"$type":"Keyword","value":"["},{"$type":"Assignment","feature":"negX","operator":"?=","terminal":{"$type":"Keyword","value":"-"},"cardinality":"?"},{"$type":"Assignment","feature":"offsetX","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@48"},"arguments":[]}},{"$type":"Keyword","value":","},{"$type":"Assignment","feature":"negY","operator":"?=","terminal":{"$type":"Keyword","value":"-"},"cardinality":"?"},{"$type":"Assignment","feature":"offsetY","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@48"},"arguments":[]}},{"$type":"Keyword","value":"]"}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"ParserRule","name":"Decorator","definition":{"$type":"Group","elements":[{"$type":"Keyword","value":"("},{"$type":"Assignment","feature":"strategy","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@24"},"arguments":[]}},{"$type":"Keyword","value":")"}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"ParserRule","name":"Link","definition":{"$type":"Group","elements":[{"$type":"Assignment","feature":"from","operator":"=","terminal":{"$type":"Alternatives","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@50"},"arguments":[]},{"$type":"RuleCall","rule":{"$ref":"#/rules@51"},"arguments":[]},{"$type":"RuleCall","rule":{"$ref":"#/rules@39"},"arguments":[]}]}},{"$type":"Assignment","feature":"fromPort","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@21"},"arguments":[]},"cardinality":"?"},{"$type":"Assignment","feature":"arrow","operator":"=","terminal":{"$type":"Alternatives","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@22"},"arguments":[]},{"$type":"RuleCall","rule":{"$ref":"#/rules@20"},"arguments":[]}]},"cardinality":"?"},{"$type":"Assignment","feature":"to","operator":"=","terminal":{"$type":"Alternatives","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@50"},"arguments":[]},{"$type":"RuleCall","rule":{"$ref":"#/rules@51"},"arguments":[]},{"$type":"RuleCall","rule":{"$ref":"#/rules@39"},"arguments":[]}]}},{"$type":"Assignment","feature":"toPort","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@21"},"arguments":[]},"cardinality":"?"},{"$type":"Assignment","feature":"linkLabel","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@23"},"arguments":[]},"cardinality":"?"},{"$type":"RuleCall","rule":{"$ref":"#/rules@41"},"arguments":[]}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"ParserRule","name":"Evolve","definition":{"$type":"Group","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@32"},"arguments":[]},{"$type":"Assignment","feature":"component","operator":"=","terminal":{"$type":"Alternatives","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@50"},"arguments":[]},{"$type":"RuleCall","rule":{"$ref":"#/rules@51"},"arguments":[]},{"$type":"RuleCall","rule":{"$ref":"#/rules@39"},"arguments":[]}]}},{"$type":"Assignment","feature":"target","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@19"},"arguments":[]}},{"$type":"RuleCall","rule":{"$ref":"#/rules@41"},"arguments":[]}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"ParserRule","name":"Pipeline","definition":{"$type":"Group","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@33"},"arguments":[]},{"$type":"Assignment","feature":"parent","operator":"=","terminal":{"$type":"Alternatives","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@50"},"arguments":[]},{"$type":"RuleCall","rule":{"$ref":"#/rules@51"},"arguments":[]},{"$type":"RuleCall","rule":{"$ref":"#/rules@39"},"arguments":[]}]}},{"$type":"Keyword","value":"{"},{"$type":"RuleCall","rule":{"$ref":"#/rules@52"},"arguments":[],"cardinality":"+"},{"$type":"Assignment","feature":"components","operator":"+=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@12"},"arguments":[]},"cardinality":"+"},{"$type":"Keyword","value":"}"},{"$type":"RuleCall","rule":{"$ref":"#/rules@41"},"arguments":[]}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"ParserRule","name":"PipelineComponent","definition":{"$type":"Group","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@29"},"arguments":[]},{"$type":"Assignment","feature":"name","operator":"=","terminal":{"$type":"Alternatives","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@50"},"arguments":[]},{"$type":"RuleCall","rule":{"$ref":"#/rules@51"},"arguments":[]},{"$type":"RuleCall","rule":{"$ref":"#/rules@39"},"arguments":[]}]}},{"$type":"Keyword","value":"["},{"$type":"Assignment","feature":"evolution","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@19"},"arguments":[]}},{"$type":"Keyword","value":"]"},{"$type":"Assignment","feature":"label","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@7"},"arguments":[]},"cardinality":"?"},{"$type":"RuleCall","rule":{"$ref":"#/rules@41"},"arguments":[]}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"ParserRule","name":"Note","definition":{"$type":"Group","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@34"},"arguments":[]},{"$type":"Assignment","feature":"text","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@50"},"arguments":[]}},{"$type":"Keyword","value":"["},{"$type":"Assignment","feature":"visibility","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@19"},"arguments":[]}},{"$type":"Keyword","value":","},{"$type":"Assignment","feature":"evolution","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@19"},"arguments":[]}},{"$type":"Keyword","value":"]"},{"$type":"RuleCall","rule":{"$ref":"#/rules@41"},"arguments":[]}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"ParserRule","name":"Annotations","definition":{"$type":"Group","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@35"},"arguments":[]},{"$type":"Keyword","value":"["},{"$type":"Assignment","feature":"x","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@16"},"arguments":[]}},{"$type":"Keyword","value":","},{"$type":"Assignment","feature":"y","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@16"},"arguments":[]}},{"$type":"Keyword","value":"]"},{"$type":"RuleCall","rule":{"$ref":"#/rules@41"},"arguments":[]}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"ParserRule","name":"Annotation","definition":{"$type":"Group","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@36"},"arguments":[]},{"$type":"Assignment","feature":"number","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@48"},"arguments":[]}},{"$type":"Keyword","value":","},{"$type":"Keyword","value":"["},{"$type":"Assignment","feature":"x","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@16"},"arguments":[]}},{"$type":"Keyword","value":","},{"$type":"Assignment","feature":"y","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@16"},"arguments":[]}},{"$type":"Keyword","value":"]"},{"$type":"Assignment","feature":"text","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@50"},"arguments":[]}},{"$type":"RuleCall","rule":{"$ref":"#/rules@41"},"arguments":[]}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"ParserRule","name":"CoordinateValue","dataType":"number","definition":{"$type":"Alternatives","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@19"},"arguments":[]},{"$type":"RuleCall","rule":{"$ref":"#/rules@48"},"arguments":[]}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"ParserRule","name":"Accelerator","definition":{"$type":"Group","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@37"},"arguments":[]},{"$type":"Assignment","feature":"name","operator":"=","terminal":{"$type":"Alternatives","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@50"},"arguments":[]},{"$type":"RuleCall","rule":{"$ref":"#/rules@51"},"arguments":[]},{"$type":"RuleCall","rule":{"$ref":"#/rules@39"},"arguments":[]}]}},{"$type":"Keyword","value":"["},{"$type":"Assignment","feature":"x","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@19"},"arguments":[]}},{"$type":"Keyword","value":","},{"$type":"Assignment","feature":"y","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@19"},"arguments":[]}},{"$type":"Keyword","value":"]"},{"$type":"RuleCall","rule":{"$ref":"#/rules@41"},"arguments":[]}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"ParserRule","name":"Deaccelerator","definition":{"$type":"Group","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@38"},"arguments":[]},{"$type":"Assignment","feature":"name","operator":"=","terminal":{"$type":"Alternatives","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@50"},"arguments":[]},{"$type":"RuleCall","rule":{"$ref":"#/rules@51"},"arguments":[]},{"$type":"RuleCall","rule":{"$ref":"#/rules@39"},"arguments":[]}]}},{"$type":"Keyword","value":"["},{"$type":"Assignment","feature":"x","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@19"},"arguments":[]}},{"$type":"Keyword","value":","},{"$type":"Assignment","feature":"y","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@19"},"arguments":[]}},{"$type":"Keyword","value":"]"},{"$type":"RuleCall","rule":{"$ref":"#/rules@41"},"arguments":[]}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"TerminalRule","name":"WARDLEY_NUMBER","type":{"$type":"ReturnType","name":"number"},"definition":{"$type":"RegexToken","regex":"/[0-9]+\\\\.[0-9]+/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"ARROW","definition":{"$type":"CharacterRange","left":{"$type":"Keyword","value":"->"},"parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"LINK_PORT","definition":{"$type":"TerminalAlternatives","elements":[{"$type":"TerminalAlternatives","elements":[{"$type":"CharacterRange","left":{"$type":"Keyword","value":"+<>"},"parenthesized":false},{"$type":"CharacterRange","left":{"$type":"Keyword","value":"+>"},"parenthesized":false}],"parenthesized":false},{"$type":"CharacterRange","left":{"$type":"Keyword","value":"+<"},"parenthesized":false}],"parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"LINK_ARROW","definition":{"$type":"TerminalAlternatives","elements":[{"$type":"TerminalAlternatives","elements":[{"$type":"TerminalAlternatives","elements":[{"$type":"TerminalAlternatives","elements":[{"$type":"TerminalAlternatives","elements":[{"$type":"CharacterRange","left":{"$type":"Keyword","value":"-->"},"parenthesized":false},{"$type":"CharacterRange","left":{"$type":"Keyword","value":"-.->"},"parenthesized":false}],"parenthesized":false},{"$type":"CharacterRange","left":{"$type":"Keyword","value":">"},"parenthesized":false}],"parenthesized":false},{"$type":"RegexToken","regex":"/\\\\+'[^']*'<>/","parenthesized":false}],"parenthesized":false},{"$type":"RegexToken","regex":"/\\\\+'[^']*'</","parenthesized":false}],"parenthesized":false},{"$type":"RegexToken","regex":"/\\\\+'[^']*'>/","parenthesized":false}],"parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"LINK_LABEL","definition":{"$type":"RegexToken","regex":"/;[^\\\\n\\\\r]+/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"STRATEGY","definition":{"$type":"TerminalAlternatives","elements":[{"$type":"TerminalAlternatives","elements":[{"$type":"TerminalAlternatives","elements":[{"$type":"CharacterRange","left":{"$type":"Keyword","value":"build"},"parenthesized":false},{"$type":"CharacterRange","left":{"$type":"Keyword","value":"buy"},"parenthesized":false}],"parenthesized":false},{"$type":"CharacterRange","left":{"$type":"Keyword","value":"outsource"},"parenthesized":false}],"parenthesized":false},{"$type":"CharacterRange","left":{"$type":"Keyword","value":"market"},"parenthesized":false}],"parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"KW_WARDLEY","definition":{"$type":"CharacterRange","left":{"$type":"Keyword","value":"wardley-beta"},"parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"KW_SIZE","definition":{"$type":"CharacterRange","left":{"$type":"Keyword","value":"size"},"parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"KW_EVOLUTION","definition":{"$type":"CharacterRange","left":{"$type":"Keyword","value":"evolution"},"parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"KW_ANCHOR","definition":{"$type":"CharacterRange","left":{"$type":"Keyword","value":"anchor"},"parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"KW_COMPONENT","definition":{"$type":"CharacterRange","left":{"$type":"Keyword","value":"component"},"parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"KW_LABEL","definition":{"$type":"CharacterRange","left":{"$type":"Keyword","value":"label"},"parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"KW_INERTIA","definition":{"$type":"CharacterRange","left":{"$type":"Keyword","value":"inertia"},"parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"KW_EVOLVE","definition":{"$type":"CharacterRange","left":{"$type":"Keyword","value":"evolve"},"parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"KW_PIPELINE","definition":{"$type":"CharacterRange","left":{"$type":"Keyword","value":"pipeline"},"parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"KW_NOTE","definition":{"$type":"CharacterRange","left":{"$type":"Keyword","value":"note"},"parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"KW_ANNOTATIONS","definition":{"$type":"CharacterRange","left":{"$type":"Keyword","value":"annotations"},"parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"KW_ANNOTATION","definition":{"$type":"CharacterRange","left":{"$type":"Keyword","value":"annotation"},"parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"KW_ACCELERATOR","definition":{"$type":"CharacterRange","left":{"$type":"Keyword","value":"accelerator"},"parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"KW_DEACCELERATOR","definition":{"$type":"CharacterRange","left":{"$type":"Keyword","value":"deaccelerator"},"parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"NAME_WITH_SPACES","definition":{"$type":"RegexToken","regex":"/(?!title\\\\s|accTitle|accDescr)[A-Za-z][A-Za-z0-9_()&]*(?:[ \\\\t]+[A-Za-z(][A-Za-z0-9_()&]*)*/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","hidden":true,"name":"WS","definition":{"$type":"RegexToken","regex":"/[ \\\\t]+/","parenthesized":false},"fragment":false},{"$type":"ParserRule","name":"EOL","dataType":"string","definition":{"$type":"Alternatives","elements":[{"$type":"RuleCall","rule":{"$ref":"#/rules@52"},"arguments":[],"cardinality":"+"},{"$type":"EndOfFile"}]},"entry":false,"fragment":false,"parameters":[]},{"$type":"ParserRule","fragment":true,"name":"TitleAndAccessibilities","definition":{"$type":"Group","elements":[{"$type":"Alternatives","elements":[{"$type":"Assignment","feature":"accDescr","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@44"},"arguments":[]}},{"$type":"Assignment","feature":"accTitle","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@45"},"arguments":[]}},{"$type":"Assignment","feature":"title","operator":"=","terminal":{"$type":"RuleCall","rule":{"$ref":"#/rules@46"},"arguments":[]}}]},{"$type":"RuleCall","rule":{"$ref":"#/rules@41"},"arguments":[]}],"cardinality":"+"},"entry":false,"parameters":[]},{"$type":"TerminalRule","name":"BOOLEAN","type":{"$type":"ReturnType","name":"boolean"},"definition":{"$type":"TerminalAlternatives","elements":[{"$type":"CharacterRange","left":{"$type":"Keyword","value":"true"},"parenthesized":false},{"$type":"CharacterRange","left":{"$type":"Keyword","value":"false"},"parenthesized":false}],"parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"ACC_DESCR","definition":{"$type":"RegexToken","regex":"/[\\\\t ]*accDescr(?:[\\\\t ]*:([^\\\\n\\\\r]*?(?=%%)|[^\\\\n\\\\r]*)|\\\\s*{([^}]*)})/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"ACC_TITLE","definition":{"$type":"RegexToken","regex":"/[\\\\t ]*accTitle[\\\\t ]*:(?:[^\\\\n\\\\r]*?(?=%%)|[^\\\\n\\\\r]*)/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"TITLE","definition":{"$type":"RegexToken","regex":"/[\\\\t ]*title(?:[\\\\t ][^\\\\n\\\\r]*?(?=%%)|[\\\\t ][^\\\\n\\\\r]*|)/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"FLOAT","type":{"$type":"ReturnType","name":"number"},"definition":{"$type":"RegexToken","regex":"/[0-9]+\\\\.[0-9]+(?!\\\\.)/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"INT","type":{"$type":"ReturnType","name":"number"},"definition":{"$type":"RegexToken","regex":"/0|[1-9][0-9]*(?!\\\\.)/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"NUMBER","type":{"$type":"ReturnType","name":"number"},"definition":{"$type":"TerminalAlternatives","elements":[{"$type":"TerminalRuleCall","rule":{"$ref":"#/rules@47"},"parenthesized":false},{"$type":"TerminalRuleCall","rule":{"$ref":"#/rules@48"},"parenthesized":false}],"parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"STRING","type":{"$type":"ReturnType","name":"string"},"definition":{"$type":"RegexToken","regex":"/\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\"|'([^'\\\\\\\\]|\\\\\\\\.)*'/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"ID","type":{"$type":"ReturnType","name":"string"},"definition":{"$type":"RegexToken","regex":"/[\\\\w]([-\\\\w]*\\\\w)?/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","name":"NEWLINE","definition":{"$type":"RegexToken","regex":"/\\\\r?\\\\n/","parenthesized":false},"fragment":false,"hidden":false},{"$type":"TerminalRule","hidden":true,"name":"WHITESPACE","definition":{"$type":"RegexToken","regex":"/[\\\\t ]+/","parenthesized":false},"fragment":false},{"$type":"TerminalRule","hidden":true,"name":"YAML","definition":{"$type":"RegexToken","regex":"/---[\\\\t ]*\\\\r?\\\\n(?:[\\\\S\\\\s]*?\\\\r?\\\\n)?---(?:\\\\r?\\\\n|(?!\\\\S))/","parenthesized":false},"fragment":false},{"$type":"TerminalRule","hidden":true,"name":"DIRECTIVE","definition":{"$type":"RegexToken","regex":"/[\\\\t ]*%%{[\\\\S\\\\s]*?}%%(?:\\\\r?\\\\n|(?!\\\\S))/","parenthesized":false},"fragment":false},{"$type":"TerminalRule","hidden":true,"name":"SINGLE_LINE_COMMENT","definition":{"$type":"RegexToken","regex":"/[\\\\t ]*%%[^\\\\n\\\\r]*/","parenthesized":false},"fragment":false}],"interfaces":[],"types":[]}`)), "WardleyGrammarGrammar");

// src/language/generated/module.ts
var ArchitectureGrammarLanguageMetaData = {
  languageId: "architecture",
  fileExtensions: [".mmd", ".mermaid"],
  caseInsensitive: false,
  mode: "production"
};
var GitGraphGrammarLanguageMetaData = {
  languageId: "gitGraph",
  fileExtensions: [".mmd", ".mermaid"],
  caseInsensitive: false,
  mode: "production"
};
var InfoGrammarLanguageMetaData = {
  languageId: "info",
  fileExtensions: [".mmd", ".mermaid"],
  caseInsensitive: false,
  mode: "production"
};
var PacketGrammarLanguageMetaData = {
  languageId: "packet",
  fileExtensions: [".mmd", ".mermaid"],
  caseInsensitive: false,
  mode: "production"
};
var PieGrammarLanguageMetaData = {
  languageId: "pie",
  fileExtensions: [".mmd", ".mermaid"],
  caseInsensitive: false,
  mode: "production"
};
var RadarGrammarLanguageMetaData = {
  languageId: "radar",
  fileExtensions: [".mmd", ".mermaid"],
  caseInsensitive: false,
  mode: "production"
};
var TreemapGrammarLanguageMetaData = {
  languageId: "treemap",
  fileExtensions: [".mmd", ".mermaid"],
  caseInsensitive: false,
  mode: "production"
};
var TreeViewGrammarLanguageMetaData = {
  languageId: "treeView",
  fileExtensions: [".mmd", ".mermaid"],
  caseInsensitive: false,
  mode: "production"
};
var WardleyGrammarLanguageMetaData = {
  languageId: "wardley",
  fileExtensions: [".mmd", ".mermaid"],
  caseInsensitive: false,
  mode: "production"
};
var MermaidGeneratedSharedModule = {
  AstReflection: /* @__PURE__ */ __name(() => new MermaidAstReflection(), "AstReflection")
};
var ArchitectureGrammarGeneratedModule = {
  Grammar: /* @__PURE__ */ __name(() => ArchitectureGrammarGrammar(), "Grammar"),
  LanguageMetaData: /* @__PURE__ */ __name(() => ArchitectureGrammarLanguageMetaData, "LanguageMetaData"),
  parser: {}
};
var GitGraphGrammarGeneratedModule = {
  Grammar: /* @__PURE__ */ __name(() => GitGraphGrammarGrammar(), "Grammar"),
  LanguageMetaData: /* @__PURE__ */ __name(() => GitGraphGrammarLanguageMetaData, "LanguageMetaData"),
  parser: {}
};
var InfoGrammarGeneratedModule = {
  Grammar: /* @__PURE__ */ __name(() => InfoGrammarGrammar(), "Grammar"),
  LanguageMetaData: /* @__PURE__ */ __name(() => InfoGrammarLanguageMetaData, "LanguageMetaData"),
  parser: {}
};
var PacketGrammarGeneratedModule = {
  Grammar: /* @__PURE__ */ __name(() => PacketGrammarGrammar(), "Grammar"),
  LanguageMetaData: /* @__PURE__ */ __name(() => PacketGrammarLanguageMetaData, "LanguageMetaData"),
  parser: {}
};
var PieGrammarGeneratedModule = {
  Grammar: /* @__PURE__ */ __name(() => PieGrammarGrammar(), "Grammar"),
  LanguageMetaData: /* @__PURE__ */ __name(() => PieGrammarLanguageMetaData, "LanguageMetaData"),
  parser: {}
};
var RadarGrammarGeneratedModule = {
  Grammar: /* @__PURE__ */ __name(() => RadarGrammarGrammar(), "Grammar"),
  LanguageMetaData: /* @__PURE__ */ __name(() => RadarGrammarLanguageMetaData, "LanguageMetaData"),
  parser: {}
};
var TreemapGrammarGeneratedModule = {
  Grammar: /* @__PURE__ */ __name(() => TreemapGrammarGrammar(), "Grammar"),
  LanguageMetaData: /* @__PURE__ */ __name(() => TreemapGrammarLanguageMetaData, "LanguageMetaData"),
  parser: {}
};
var TreeViewGrammarGeneratedModule = {
  Grammar: /* @__PURE__ */ __name(() => TreeViewGrammarGrammar(), "Grammar"),
  LanguageMetaData: /* @__PURE__ */ __name(() => TreeViewGrammarLanguageMetaData, "LanguageMetaData"),
  parser: {}
};
var WardleyGrammarGeneratedModule = {
  Grammar: /* @__PURE__ */ __name(() => WardleyGrammarGrammar(), "Grammar"),
  LanguageMetaData: /* @__PURE__ */ __name(() => WardleyGrammarLanguageMetaData, "LanguageMetaData"),
  parser: {}
};

// src/language/common/valueConverter.ts
import { DefaultValueConverter } from "langium";

// src/language/common/matcher.ts
var accessibilityDescrRegex = /accDescr(?:[\t ]*:([^\n\r]*)|\s*{([^}]*)})/;
var accessibilityTitleRegex = /accTitle[\t ]*:([^\n\r]*)/;
var titleRegex = /title([\t ][^\n\r]*|)/;

// src/language/common/valueConverter.ts
var rulesRegexes = {
  ACC_DESCR: accessibilityDescrRegex,
  ACC_TITLE: accessibilityTitleRegex,
  TITLE: titleRegex
};
var AbstractMermaidValueConverter = class extends DefaultValueConverter {
  static {
    __name(this, "AbstractMermaidValueConverter");
  }
  runConverter(rule, input, cstNode) {
    let value = this.runCommonConverter(rule, input, cstNode);
    if (value === void 0) {
      value = this.runCustomConverter(rule, input, cstNode);
    }
    if (value === void 0) {
      return super.runConverter(rule, input, cstNode);
    }
    return value;
  }
  runCommonConverter(rule, input, _cstNode) {
    const regex = rulesRegexes[rule.name];
    if (regex === void 0) {
      return void 0;
    }
    const match = regex.exec(input);
    if (match === null) {
      return void 0;
    }
    if (match[1] !== void 0) {
      return match[1].trim().replace(/[\t ]{2,}/gm, " ");
    }
    if (match[2] !== void 0) {
      return match[2].replace(/^\s*/gm, "").replace(/\s+$/gm, "").replace(/[\t ]{2,}/gm, " ").replace(/[\n\r]{2,}/gm, "\n");
    }
    return void 0;
  }
};
var CommonValueConverter = class extends AbstractMermaidValueConverter {
  static {
    __name(this, "CommonValueConverter");
  }
  runCustomConverter(_rule, _input, _cstNode) {
    return void 0;
  }
};

// src/language/common/tokenBuilder.ts
import { DefaultTokenBuilder } from "langium";
var AbstractMermaidTokenBuilder = class extends DefaultTokenBuilder {
  static {
    __name(this, "AbstractMermaidTokenBuilder");
  }
  constructor(keywords) {
    super();
    this.keywords = new Set(keywords);
  }
  buildKeywordTokens(rules, terminalTokens, options) {
    const tokenTypes = super.buildKeywordTokens(rules, terminalTokens, options);
    tokenTypes.forEach((tokenType) => {
      if (this.keywords.has(tokenType.name) && tokenType.PATTERN !== void 0) {
        tokenType.PATTERN = new RegExp(tokenType.PATTERN.toString() + "(?:(?=%%)|(?!\\S))");
      }
    });
    return tokenTypes;
  }
};
var CommonTokenBuilder = class extends AbstractMermaidTokenBuilder {
  static {
    __name(this, "CommonTokenBuilder");
  }
};

export {
  __name,
  Architecture,
  isArchitecture,
  Branch,
  isBranch,
  Commit,
  isCommit,
  GitGraph,
  isGitGraph,
  Info,
  isInfo,
  Merge,
  isMerge,
  Packet,
  isPacket,
  PacketBlock,
  isPacketBlock,
  Pie,
  isPie,
  PieSection,
  isPieSection,
  Radar,
  Statement,
  Treemap,
  isTreemap,
  TreeNode,
  TreeView,
  Wardley,
  isWardley,
  MermaidGeneratedSharedModule,
  ArchitectureGrammarGeneratedModule,
  GitGraphGrammarGeneratedModule,
  InfoGrammarGeneratedModule,
  PacketGrammarGeneratedModule,
  PieGrammarGeneratedModule,
  RadarGrammarGeneratedModule,
  TreemapGrammarGeneratedModule,
  TreeViewGrammarGeneratedModule,
  WardleyGrammarGeneratedModule,
  AbstractMermaidValueConverter,
  CommonValueConverter,
  AbstractMermaidTokenBuilder,
  CommonTokenBuilder
};

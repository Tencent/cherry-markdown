import {
  AbstractMermaidTokenBuilder,
  AbstractMermaidValueConverter,
  EmptyFileSystem,
  MermaidGeneratedSharedModule,
  TreeViewGrammarGeneratedModule,
  __name as __name2,
  createDefaultCoreModule,
  createDefaultSharedCoreModule,
  inject,
  lib_exports
} from "./chunk-WEB62QT6.mjs";
import {
  __name
} from "./chunk-FQFHLQFH.mjs";

// ../parser/dist/chunks/mermaid-parser.core/chunk-ORNJ4GCN.mjs
var TreeViewValueConverter = class extends AbstractMermaidValueConverter {
  static {
    __name(this, "TreeViewValueConverter");
  }
  static {
    __name2(this, "TreeViewValueConverter");
  }
  runCustomConverter(rule, input, _cstNode) {
    if (rule.name === "INDENTATION") {
      return input?.length || 0;
    } else if (rule.name === "STRING2") {
      return input.substring(1, input.length - 1);
    }
    return void 0;
  }
};
var TreeViewTokenBuilder = class extends AbstractMermaidTokenBuilder {
  static {
    __name(this, "TreeViewTokenBuilder");
  }
  static {
    __name2(this, "TreeViewTokenBuilder");
  }
  constructor() {
    super(["treeView-beta"]);
  }
};
var TreeViewModule = {
  parser: {
    TokenBuilder: /* @__PURE__ */ __name2(() => new TreeViewTokenBuilder(), "TokenBuilder"),
    ValueConverter: /* @__PURE__ */ __name2(() => new TreeViewValueConverter(), "ValueConverter")
  }
};
function createTreeViewServices(context = EmptyFileSystem) {
  const shared = inject(
    createDefaultSharedCoreModule(context),
    MermaidGeneratedSharedModule
  );
  const TreeView = inject(
    createDefaultCoreModule({ shared }),
    TreeViewGrammarGeneratedModule,
    TreeViewModule
  );
  shared.ServiceRegistry.register(TreeView);
  return { shared, TreeView };
}
__name(createTreeViewServices, "createTreeViewServices");
__name2(createTreeViewServices, "createTreeViewServices");

export {
  TreeViewModule,
  createTreeViewServices
};

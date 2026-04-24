import {
  AbstractMermaidTokenBuilder,
  AbstractMermaidValueConverter,
  MermaidGeneratedSharedModule,
  TreeViewGrammarGeneratedModule,
  __name
} from "./chunk-K5T4RW27.mjs";

// src/language/treeView/module.ts
import {
  EmptyFileSystem,
  createDefaultCoreModule,
  createDefaultSharedCoreModule,
  inject
} from "langium";

// src/language/treeView/valueConverter.ts
var TreeViewValueConverter = class extends AbstractMermaidValueConverter {
  static {
    __name(this, "TreeViewValueConverter");
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

// src/language/treeView/tokenBuilder.ts
var TreeViewTokenBuilder = class extends AbstractMermaidTokenBuilder {
  static {
    __name(this, "TreeViewTokenBuilder");
  }
  constructor() {
    super(["treeView-beta"]);
  }
};

// src/language/treeView/module.ts
var TreeViewModule = {
  parser: {
    TokenBuilder: /* @__PURE__ */ __name(() => new TreeViewTokenBuilder(), "TokenBuilder"),
    ValueConverter: /* @__PURE__ */ __name(() => new TreeViewValueConverter(), "ValueConverter")
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

export {
  TreeViewModule,
  createTreeViewServices
};

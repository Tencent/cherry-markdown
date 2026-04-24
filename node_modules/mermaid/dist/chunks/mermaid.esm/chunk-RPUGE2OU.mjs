import {
  AbstractMermaidTokenBuilder,
  AbstractMermaidValueConverter,
  EmptyFileSystem,
  MermaidGeneratedSharedModule,
  PieGrammarGeneratedModule,
  __name as __name2,
  createDefaultCoreModule,
  createDefaultSharedCoreModule,
  inject,
  lib_exports
} from "./chunk-WEB62QT6.mjs";
import {
  __name
} from "./chunk-FQFHLQFH.mjs";

// ../parser/dist/chunks/mermaid-parser.core/chunk-AA7GKIK3.mjs
var PieTokenBuilder = class extends AbstractMermaidTokenBuilder {
  static {
    __name(this, "PieTokenBuilder");
  }
  static {
    __name2(this, "PieTokenBuilder");
  }
  constructor() {
    super(["pie", "showData"]);
  }
};
var PieValueConverter = class extends AbstractMermaidValueConverter {
  static {
    __name(this, "PieValueConverter");
  }
  static {
    __name2(this, "PieValueConverter");
  }
  runCustomConverter(rule, input, _cstNode) {
    if (rule.name !== "PIE_SECTION_LABEL") {
      return void 0;
    }
    return input.replace(/"/g, "").trim();
  }
};
var PieModule = {
  parser: {
    TokenBuilder: /* @__PURE__ */ __name2(() => new PieTokenBuilder(), "TokenBuilder"),
    ValueConverter: /* @__PURE__ */ __name2(() => new PieValueConverter(), "ValueConverter")
  }
};
function createPieServices(context = EmptyFileSystem) {
  const shared = inject(
    createDefaultSharedCoreModule(context),
    MermaidGeneratedSharedModule
  );
  const Pie = inject(
    createDefaultCoreModule({ shared }),
    PieGrammarGeneratedModule,
    PieModule
  );
  shared.ServiceRegistry.register(Pie);
  return { shared, Pie };
}
__name(createPieServices, "createPieServices");
__name2(createPieServices, "createPieServices");

export {
  PieModule,
  createPieServices
};

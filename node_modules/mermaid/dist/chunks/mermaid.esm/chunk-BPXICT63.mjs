import {
  AbstractMermaidTokenBuilder,
  CommonValueConverter,
  EmptyFileSystem,
  InfoGrammarGeneratedModule,
  MermaidGeneratedSharedModule,
  __name as __name2,
  createDefaultCoreModule,
  createDefaultSharedCoreModule,
  inject,
  lib_exports
} from "./chunk-WEB62QT6.mjs";
import {
  __name
} from "./chunk-FQFHLQFH.mjs";

// ../parser/dist/chunks/mermaid-parser.core/chunk-KGLVRYIC.mjs
var InfoTokenBuilder = class extends AbstractMermaidTokenBuilder {
  static {
    __name(this, "InfoTokenBuilder");
  }
  static {
    __name2(this, "InfoTokenBuilder");
  }
  constructor() {
    super(["info", "showInfo"]);
  }
};
var InfoModule = {
  parser: {
    TokenBuilder: /* @__PURE__ */ __name2(() => new InfoTokenBuilder(), "TokenBuilder"),
    ValueConverter: /* @__PURE__ */ __name2(() => new CommonValueConverter(), "ValueConverter")
  }
};
function createInfoServices(context = EmptyFileSystem) {
  const shared = inject(
    createDefaultSharedCoreModule(context),
    MermaidGeneratedSharedModule
  );
  const Info = inject(
    createDefaultCoreModule({ shared }),
    InfoGrammarGeneratedModule,
    InfoModule
  );
  shared.ServiceRegistry.register(Info);
  return { shared, Info };
}
__name(createInfoServices, "createInfoServices");
__name2(createInfoServices, "createInfoServices");

export {
  InfoModule,
  createInfoServices
};

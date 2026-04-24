import {
  AbstractMermaidValueConverter,
  EmptyFileSystem,
  MermaidGeneratedSharedModule,
  WardleyGrammarGeneratedModule,
  __name as __name2,
  createDefaultCoreModule,
  createDefaultSharedCoreModule,
  inject,
  lib_exports
} from "./chunk-WEB62QT6.mjs";
import {
  __name
} from "./chunk-FQFHLQFH.mjs";

// ../parser/dist/chunks/mermaid-parser.core/chunk-CIAEETIT.mjs
var WardleyValueConverter = class extends AbstractMermaidValueConverter {
  static {
    __name(this, "WardleyValueConverter");
  }
  static {
    __name2(this, "WardleyValueConverter");
  }
  runCustomConverter(rule, input, _cstNode) {
    switch (rule.name.toUpperCase()) {
      case "LINK_LABEL":
        return input.substring(1).trim();
      default:
        return void 0;
    }
  }
};
var WardleyModule = {
  parser: {
    ValueConverter: /* @__PURE__ */ __name2(() => new WardleyValueConverter(), "ValueConverter")
  }
};
function createWardleyServices(context = EmptyFileSystem) {
  const shared = inject(
    createDefaultSharedCoreModule(context),
    MermaidGeneratedSharedModule
  );
  const Wardley = inject(
    createDefaultCoreModule({ shared }),
    WardleyGrammarGeneratedModule,
    WardleyModule
  );
  shared.ServiceRegistry.register(Wardley);
  return { shared, Wardley };
}
__name(createWardleyServices, "createWardleyServices");
__name2(createWardleyServices, "createWardleyServices");

export {
  WardleyModule,
  createWardleyServices
};

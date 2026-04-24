import {
  AbstractMermaidValueConverter,
  MermaidGeneratedSharedModule,
  WardleyGrammarGeneratedModule,
  __name
} from "./chunk-K5T4RW27.mjs";

// src/language/wardley/module.ts
import {
  EmptyFileSystem,
  createDefaultCoreModule,
  createDefaultSharedCoreModule,
  inject
} from "langium";

// src/language/wardley/valueConverter.ts
var WardleyValueConverter = class extends AbstractMermaidValueConverter {
  static {
    __name(this, "WardleyValueConverter");
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

// src/language/wardley/module.ts
var WardleyModule = {
  parser: {
    ValueConverter: /* @__PURE__ */ __name(() => new WardleyValueConverter(), "ValueConverter")
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

export {
  WardleyModule,
  createWardleyServices
};

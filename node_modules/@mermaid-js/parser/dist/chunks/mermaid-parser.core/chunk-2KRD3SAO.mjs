import {
  AbstractMermaidTokenBuilder,
  CommonValueConverter,
  MermaidGeneratedSharedModule,
  RadarGrammarGeneratedModule,
  __name
} from "./chunk-K5T4RW27.mjs";

// src/language/radar/module.ts
import {
  EmptyFileSystem,
  createDefaultCoreModule,
  createDefaultSharedCoreModule,
  inject
} from "langium";

// src/language/radar/tokenBuilder.ts
var RadarTokenBuilder = class extends AbstractMermaidTokenBuilder {
  static {
    __name(this, "RadarTokenBuilder");
  }
  constructor() {
    super(["radar-beta"]);
  }
};

// src/language/radar/module.ts
var RadarModule = {
  parser: {
    TokenBuilder: /* @__PURE__ */ __name(() => new RadarTokenBuilder(), "TokenBuilder"),
    ValueConverter: /* @__PURE__ */ __name(() => new CommonValueConverter(), "ValueConverter")
  }
};
function createRadarServices(context = EmptyFileSystem) {
  const shared = inject(
    createDefaultSharedCoreModule(context),
    MermaidGeneratedSharedModule
  );
  const Radar = inject(
    createDefaultCoreModule({ shared }),
    RadarGrammarGeneratedModule,
    RadarModule
  );
  shared.ServiceRegistry.register(Radar);
  return { shared, Radar };
}
__name(createRadarServices, "createRadarServices");

export {
  RadarModule,
  createRadarServices
};

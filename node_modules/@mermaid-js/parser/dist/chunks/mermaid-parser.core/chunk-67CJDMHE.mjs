import {
  AbstractMermaidTokenBuilder,
  CommonValueConverter,
  GitGraphGrammarGeneratedModule,
  MermaidGeneratedSharedModule,
  __name
} from "./chunk-K5T4RW27.mjs";

// src/language/gitGraph/module.ts
import {
  inject,
  createDefaultCoreModule,
  createDefaultSharedCoreModule,
  EmptyFileSystem
} from "langium";

// src/language/gitGraph/tokenBuilder.ts
var GitGraphTokenBuilder = class extends AbstractMermaidTokenBuilder {
  static {
    __name(this, "GitGraphTokenBuilder");
  }
  constructor() {
    super(["gitGraph"]);
  }
};

// src/language/gitGraph/module.ts
var GitGraphModule = {
  parser: {
    TokenBuilder: /* @__PURE__ */ __name(() => new GitGraphTokenBuilder(), "TokenBuilder"),
    ValueConverter: /* @__PURE__ */ __name(() => new CommonValueConverter(), "ValueConverter")
  }
};
function createGitGraphServices(context = EmptyFileSystem) {
  const shared = inject(
    createDefaultSharedCoreModule(context),
    MermaidGeneratedSharedModule
  );
  const GitGraph = inject(
    createDefaultCoreModule({ shared }),
    GitGraphGrammarGeneratedModule,
    GitGraphModule
  );
  shared.ServiceRegistry.register(GitGraph);
  return { shared, GitGraph };
}
__name(createGitGraphServices, "createGitGraphServices");

export {
  GitGraphModule,
  createGitGraphServices
};

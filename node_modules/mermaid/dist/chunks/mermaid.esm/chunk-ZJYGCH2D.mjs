import {
  AbstractMermaidTokenBuilder,
  CommonValueConverter,
  EmptyFileSystem,
  GitGraphGrammarGeneratedModule,
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

// ../parser/dist/chunks/mermaid-parser.core/chunk-67CJDMHE.mjs
var GitGraphTokenBuilder = class extends AbstractMermaidTokenBuilder {
  static {
    __name(this, "GitGraphTokenBuilder");
  }
  static {
    __name2(this, "GitGraphTokenBuilder");
  }
  constructor() {
    super(["gitGraph"]);
  }
};
var GitGraphModule = {
  parser: {
    TokenBuilder: /* @__PURE__ */ __name2(() => new GitGraphTokenBuilder(), "TokenBuilder"),
    ValueConverter: /* @__PURE__ */ __name2(() => new CommonValueConverter(), "ValueConverter")
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
__name2(createGitGraphServices, "createGitGraphServices");

export {
  GitGraphModule,
  createGitGraphServices
};

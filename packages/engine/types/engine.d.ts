export interface EngineGlobalOptions {
  classicBr?: boolean;
  htmlWhiteList?: string;
  htmlBlackList?: string;
  htmlAttrWhiteList?: string;
  flowSessionContext?: boolean;
  flowSessionCursor?: string;
  urlProcessor?: (url: string, sourceType: string, done?: (url: string) => void) => string;
  [key: string]: unknown;
}

export interface CustomSyntaxRegConfig {
  syntaxClass: any;
  force?: boolean;
  before?: string;
  after?: string;
}

export interface CherryEngineOptions {
  global: EngineGlobalOptions;
  syntax: Record<string, any>;
  customSyntax?: Record<string, CustomSyntaxRegConfig | any>;
}

export interface EngineOptions {
  externals: Record<string, unknown>;
  engine: CherryEngineOptions;
  callback: {
    urlProcessor: (url: string, sourceType: string, done?: (url: string) => void) => string;
    afterAsyncRender?: (markdown: string, html: string) => void;
  };
  hooksConfig?: { hooksList?: unknown[] };
  locale?: string;
  locales?: Record<string, unknown>;
}

declare module 'prismjs' {
  export interface Token {
    alias?: string | string[];
    content: string | Token | Array<string | Token>;
    type: string;
  }

  export interface TokenEnvironment {
    code: string;
    grammar: unknown;
    language: string;
    tokens?: Array<string | Token>;
  }

  export interface PrismApi {
    languages: Record<string, unknown>;
    hooks: { run(name: string, environment: TokenEnvironment): void };
    tokenize(source: string, grammar: unknown): Array<string | Token>;
  }

  const Prism: PrismApi;
  export default Prism;
}

declare module 'prismjs/components/*';

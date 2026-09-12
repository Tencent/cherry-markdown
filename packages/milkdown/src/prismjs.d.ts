declare module 'prismjs' {
  export interface Token {
    alias?: string | string[];
    content: string | Token | Array<string | Token>;
    type: string;
  }

  export interface PrismApi {
    languages: Record<string, unknown>;
    tokenize(source: string, grammar: unknown): Array<string | Token>;
  }

  const Prism: PrismApi;
  export default Prism;
}

declare module 'prismjs/components/*';

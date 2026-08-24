declare class CodeBlock {
  static inlineCodeCache: Record<string, string>;
  constructor(...args: any[]);
  [key: string]: any;
}
export default CodeBlock;

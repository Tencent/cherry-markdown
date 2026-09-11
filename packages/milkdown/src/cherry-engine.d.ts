declare module 'cherry-markdown/dist/cherry-markdown.engine.core.esm.js' {
  const CherryEngine: new (options?: object) => {
    makeHtml(markdown: string): string;
  };

  export default CherryEngine;
}

declare module 'cherry-markdown/dist/cherry-markdown.esm.js' {
  const Cherry: new (options: object) => any;
  export default Cherry;
}

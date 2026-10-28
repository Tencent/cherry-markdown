/** Types for Cherry's generated runtime entries used by this package. */
declare module 'cherry-markdown/dist/cherry-markdown.engine.core.esm.js' {
  const CherryEngine: new (options: object) => {
    makeHtml(markdown: string): string;
  };

  export default CherryEngine;
}

declare module 'cherry-markdown/dist/addons/advance/cherry-table-echarts-plugin.esm.js' {
  interface TableChartData {
    header: string[];
    rows: string[][];
    colLength: number;
    rowLength: number;
  }

  const EChartsTableEngine: new (options: Record<string, unknown>) => {
    $buildEchartsThemeFromCss(container: HTMLElement): void;
    $generateChartOptions(
      type: string,
      table: TableChartData,
      options: Record<string, unknown>,
    ): Record<string, unknown>;
    createChart(container: HTMLElement, options: Record<string, unknown>, type: string): { resize(): void } | null;
    destroyChart(container: HTMLElement): void;
    $applyThemeOnly(instance: { resize(): void } | null): void;
    onDestroy(): void;
  };

  export default EChartsTableEngine;
}

declare module 'cherry-markdown/dist/addons/advance/cherry-codeblock-echarts-plugin.esm.js' {
  const EChartsCodeBlockEngine: new (options: Record<string, unknown>) => {
    parseOption(source: string): Record<string, unknown>;
  };

  export default EChartsCodeBlockEngine;
}

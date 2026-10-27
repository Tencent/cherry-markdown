declare module 'virtual:cherry-semantic-theme' {
  const themes: Readonly<
    Record<
      'default' | 'dark' | 'blue' | 'green' | 'red' | 'violet' | 'gray' | 'abyss',
      Readonly<Record<string, string>>
    >
  >;
  export default themes;
}

declare const CHERRY_SEMANTIC_CORE_VERSION: string;

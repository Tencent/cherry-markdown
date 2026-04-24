import type { Plugin } from 'rollup';
import type { ESLint } from 'eslint';
import type { CreateFilter } from '@rollup/pluginutils';

export interface RollupEslintOptions extends ESLint.Options {
  /**
   * If true, will auto fix source code.
   * @default false
   */
  fix?: boolean;

  /**
   * If true, will throw an error if any errors were found.
   * @default false
   */
  throwOnError?: boolean;

  /**
   * If true, will throw an error if any warnings were found.
   * @default false
   */
  throwOnWarning?: boolean;

  /**
   * A single file, or array of files, to include when linting.
   * @default []
   */
  include?: Parameters<CreateFilter>[0];

  /**
   * A single file, or array of files, to exclude when linting.
   * @default node_modules/**
   */
  exclude?: Parameters<CreateFilter>[1];

  /**
   * Custom error formatter or the name of a built-in formatter.
   * @default stylish
   */
  formatter?: Awaited<ReturnType<ESLint['loadFormatter']>>['format'] | string;
}

/**
 * 🍣 A Rollup plugin for verifing entry points and all imported files with ESLint.
 */
export default function eslint(options?: RollupEslintOptions | string): Plugin;

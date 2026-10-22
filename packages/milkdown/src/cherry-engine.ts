/**
 * Cherry package integration seam.
 *
 * Cherry currently publishes its standalone Engine as a dist entry rather
 * than a documented package subpath. Keep the import here so a packaging
 * change has one Milkdown runtime integration point.
 */
export { default } from 'cherry-markdown/dist/cherry-markdown.engine.core.esm.js';

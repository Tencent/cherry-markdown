// Keep node registration order and internal exports stable; feature modules
// own their schemas and views without importing this assembly entrypoint.
import type { MilkdownPlugin } from '@milkdown/kit/ctx';
import {
  cherryCompoundItemSchema,
  cherryPanelSchema,
  cherryDetailSchema,
  cherryTocSchema,
  cherryFrontmatterSchema,
  cherryCommentDefinitionSchema,
  cherryDiagramSchema,
  cherryNativeBlockSchema,
  cherryHtmlBlockSchema,
  cherryHtmlInlineSchema,
  cherryEmojiSchema,
  cherryLinkTargetSchema,
  cherryFootnoteReferenceSchema,
} from './nodes/node-schemas.js';
import { cherryFootnoteDefinitionView, cherryFootnoteNavigationPlugin } from './nodes/footnotes.js';
import { cherryCompoundItemView, cherryPanelView, cherryDetailView } from './nodes/compound.js';
import {
  cherryTocView,
  cherryFrontmatterView,
  cherryCommentDefinitionView,
  cherryLinkTargetView,
  cherryLinkTargetClickPlugin,
  cherryTocRefreshPlugin,
} from './nodes/source-nodes.js';
import {
  cherryDiagramView,
  cherryHtmlBlockView,
  cherryNativeBlockView,
  cherryHtmlInlineView,
  cherryEmojiView,
} from './nodes/embed.js';

export {
  cherryCompoundItemSchema,
  cherryPanelSchema,
  cherryDetailSchema,
  cherryTocSchema,
  cherryFrontmatterSchema,
  cherryCommentDefinitionSchema,
  cherryDiagramSchema,
  cherryNativeBlockSchema,
  cherryHtmlBlockSchema,
  cherryHtmlInlineSchema,
  cherryEmojiSchema,
  cherryLinkTargetSchema,
  cherryFootnoteReferenceSchema,
  cherryFootnoteDefinitionView,
  cherryFootnoteNavigationPlugin,
  cherryCompoundItemView,
  cherryPanelView,
  cherryDetailView,
  cherryTocView,
  cherryFrontmatterView,
  cherryCommentDefinitionView,
  cherryLinkTargetView,
  cherryLinkTargetClickPlugin,
  cherryTocRefreshPlugin,
  cherryDiagramView,
  cherryHtmlBlockView,
  cherryNativeBlockView,
  cherryHtmlInlineView,
  cherryEmojiView,
};

export const cherryStructureSchemas = [
  cherryCompoundItemSchema,
  cherryPanelSchema,
  cherryDetailSchema,
  cherryTocSchema,
  cherryFrontmatterSchema,
  cherryCommentDefinitionSchema,
  cherryDiagramSchema,
  cherryNativeBlockSchema,
  cherryHtmlBlockSchema,
  cherryHtmlInlineSchema,
  cherryEmojiSchema,
  cherryLinkTargetSchema,
  cherryFootnoteReferenceSchema,
];

export const cherryStructureViews: MilkdownPlugin[] = [
  cherryCompoundItemView,
  cherryPanelView,
  cherryDetailView,
  cherryTocView,
  cherryFrontmatterView,
  cherryCommentDefinitionView,
  cherryDiagramView,
  cherryNativeBlockView,
  cherryHtmlBlockView,
  cherryHtmlInlineView,
  cherryEmojiView,
  cherryLinkTargetView,
  cherryFootnoteDefinitionView,
  cherryFootnoteNavigationPlugin,
  cherryLinkTargetClickPlugin,
  cherryTocRefreshPlugin,
];

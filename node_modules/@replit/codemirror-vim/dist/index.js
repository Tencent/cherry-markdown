import { EditorSelection, MapMode, Prec, StateEffect, RangeSetBuilder, StateField } from '@codemirror/state';
import { foldCode, matchBrackets, indentUnit, ensureSyntaxTree, StringStream } from '@codemirror/language';
import * as View from '@codemirror/view';
import { EditorView, runScopeHandlers, Direction, ViewPlugin, Decoration, showPanel } from '@codemirror/view';
import { SearchQuery, setSearchQuery, RegExpCursor } from '@codemirror/search';
import { indentMore, indentLess, cursorLineBoundaryBackward, cursorLineBoundaryForward, cursorCharBackward, indentSelection, insertNewlineAndIndent, cursorCharLeft, undo, redo } from '@codemirror/commands';

//@ts-check

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/5/LICENSE

/**
 * Supported keybindings:
 *   Too many to list. Refer to defaultKeymap below.
 *
 * Supported Ex commands:
 *   Refer to defaultExCommandMap below.
 *
 * Registers: unnamed, -, ., :, /, _, a-z, A-Z, 0-9
 *   (Does not respect the special case for number registers when delete
 *    operator is made with these commands: %, (, ),  , /, ?, n, N, {, } )
 *   TODO: Implement the remaining registers.
 *
 * Marks: a-z, A-Z, and 0-9
 *   TODO: Implement the remaining special marks. They have more complex
 *       behavior.
 *
 * Events:
 *  'vim-mode-change' - raised on the editor anytime the current mode changes,
 *                      Event object: {mode: "visual", subMode: "linewise"}
 *
 * Code structure:
 *  1. Default keymap
 *  2. Variable declarations and short basic helpers
 *  3. Instance (External API) implementation
 *  4. Internal state tracking objects (input state, counter) implementation
 *     and instantiation
 *  5. Key handler (the main command dispatcher) implementation
 *  6. Motion, operator, and action implementations
 *  7. Helper functions for the key handler, motions, operators, and actions
 *  8. Set up Vim to work as a keymap for CodeMirror.
 *  9. Ex command implementations.
 */


/** @arg {typeof import("./cm_adapter").CodeMirror} CM */
function initVim(CM) {

/**
 * @typedef { import("./cm_adapter").CodeMirror } CodeMirror
 * @typedef { import("./types").CodeMirrorV} CodeMirrorV
 * @typedef { import("./types").Pos } Pos
 * @typedef { import("./types").vimState } vimState 
 * @typedef { import("./types").ExFn } ExFn
 * @typedef { import("./types").MotionArgs } MotionArgs
 * @typedef { import("./types").ActionArgs } ActionArgs
 * @typedef { import("./types").OperatorArgs } OperatorArgs
 * @typedef { import("./types").vimKey } vimKey
 * @typedef { import("./types").Marker } Marker
 * @typedef { import("./types").InputStateInterface } InputStateInterface
 * @typedef { import("./types").SearchStateInterface } SearchStateInterface
 * @typedef { import("./types").InsertModeChanges } InsertModeChanges
 */
  var Pos = CM.Pos;

  /** @arg {CodeMirror} cm @arg {Pos} curStart @arg {Pos} curEnd */
  function updateSelectionForSurrogateCharacters(cm, curStart, curEnd) {
    // start and character position when no selection 
    // is the same in visual mode, and differs in 1 character in normal mode
    if (curStart.line === curEnd.line && curStart.ch >= curEnd.ch - 1) {
      var text = cm.getLine(curStart.line);
      var charCode = text.charCodeAt(curStart.ch);
      if (0xD800 <= charCode && charCode <= 0xD8FF) {
        curEnd.ch += 1;
      }
    }

    return {start: curStart, end: curEnd};
  }
  /** @type {import("./types").vimKeyMap} */
  var defaultKeymap = [
    // Key to key mapping. This goes first to make it possible to override
    // existing mappings.
    { keys: '<Left>', type: 'keyToKey', toKeys: 'h' },
    { keys: '<Right>', type: 'keyToKey', toKeys: 'l' },
    { keys: '<Up>', type: 'keyToKey', toKeys: 'k' },
    { keys: '<Down>', type: 'keyToKey', toKeys: 'j' },
    { keys: 'g<Up>', type: 'keyToKey', toKeys: 'gk' },
    { keys: 'g<Down>', type: 'keyToKey', toKeys: 'gj' },
    { keys: '<Space>', type: 'keyToKey', toKeys: 'l' },
    { keys: '<BS>', type: 'keyToKey', toKeys: 'h'},
    { keys: '<Del>', type: 'keyToKey', toKeys: 'x' },
    { keys: '<C-Space>', type: 'keyToKey', toKeys: 'W' },
    { keys: '<C-BS>', type: 'keyToKey', toKeys: 'B' },
    { keys: '<S-Space>', type: 'keyToKey', toKeys: 'w' },
    { keys: '<S-BS>', type: 'keyToKey', toKeys: 'b' },
    { keys: '<C-n>', type: 'keyToKey', toKeys: 'j' },
    { keys: '<C-p>', type: 'keyToKey', toKeys: 'k' },
    { keys: '<C-[>', type: 'keyToKey', toKeys: '<Esc>' },
    { keys: '<C-c>', type: 'keyToKey', toKeys: '<Esc>' },
    { keys: '<C-[>', type: 'keyToKey', toKeys: '<Esc>', context: 'insert' },
    { keys: '<C-c>', type: 'keyToKey', toKeys: '<Esc>', context: 'insert' },
    { keys: '<C-Esc>', type: 'keyToKey', toKeys: '<Esc>' }, // ipad keyboard sends C-Esc instead of C-[
    { keys: '<C-Esc>', type: 'keyToKey', toKeys: '<Esc>', context: 'insert' },
    { keys: 's', type: 'keyToKey', toKeys: 'cl', context: 'normal' },
    { keys: 's', type: 'keyToKey', toKeys: 'c', context: 'visual'},
    { keys: 'S', type: 'keyToKey', toKeys: 'cc', context: 'normal' },
    { keys: 'S', type: 'keyToKey', toKeys: 'VdO', context: 'visual' },
    { keys: '<Home>', type: 'keyToKey', toKeys: '0' },
    { keys: '<End>', type: 'keyToKey', toKeys: '$' },
    { keys: '<PageUp>', type: 'keyToKey', toKeys: '<C-b>' },
    { keys: '<PageDown>', type: 'keyToKey', toKeys: '<C-f>' },
    { keys: '<CR>', type: 'keyToKey', toKeys: 'j^', context: 'normal' },
    { keys: '<Ins>', type: 'keyToKey', toKeys: 'i', context: 'normal'},
    { keys: '<Ins>', type: 'action', action: 'toggleOverwrite', context: 'insert' },
    // Motions
    { keys: 'H', type: 'motion', motion: 'moveToTopLine', motionArgs: { linewise: true, toJumplist: true }},
    { keys: 'M', type: 'motion', motion: 'moveToMiddleLine', motionArgs: { linewise: true, toJumplist: true }},
    { keys: 'L', type: 'motion', motion: 'moveToBottomLine', motionArgs: { linewise: true, toJumplist: true }},
    { keys: 'h', type: 'motion', motion: 'moveByCharacters', motionArgs: { forward: false }},
    { keys: 'l', type: 'motion', motion: 'moveByCharacters', motionArgs: { forward: true }},
    { keys: 'j', type: 'motion', motion: 'moveByLines', motionArgs: { forward: true, linewise: true }},
    { keys: 'k', type: 'motion', motion: 'moveByLines', motionArgs: { forward: false, linewise: true }},
    { keys: 'gj', type: 'motion', motion: 'moveByDisplayLines', motionArgs: { forward: true }},
    { keys: 'gk', type: 'motion', motion: 'moveByDisplayLines', motionArgs: { forward: false }},
    { keys: 'w', type: 'motion', motion: 'moveByWords', motionArgs: { forward: true, wordEnd: false }},
    { keys: 'W', type: 'motion', motion: 'moveByWords', motionArgs: { forward: true, wordEnd: false, bigWord: true }},
    { keys: 'e', type: 'motion', motion: 'moveByWords', motionArgs: { forward: true, wordEnd: true, inclusive: true }},
    { keys: 'E', type: 'motion', motion: 'moveByWords', motionArgs: { forward: true, wordEnd: true, bigWord: true, inclusive: true }},
    { keys: 'b', type: 'motion', motion: 'moveByWords', motionArgs: { forward: false, wordEnd: false }},
    { keys: 'B', type: 'motion', motion: 'moveByWords', motionArgs: { forward: false, wordEnd: false, bigWord: true }},
    { keys: 'ge', type: 'motion', motion: 'moveByWords', motionArgs: { forward: false, wordEnd: true, inclusive: true }},
    { keys: 'gE', type: 'motion', motion: 'moveByWords', motionArgs: { forward: false, wordEnd: true, bigWord: true, inclusive: true }},
    { keys: '{', type: 'motion', motion: 'moveByParagraph', motionArgs: { forward: false, toJumplist: true }},
    { keys: '}', type: 'motion', motion: 'moveByParagraph', motionArgs: { forward: true, toJumplist: true }},
    { keys: '(', type: 'motion', motion: 'moveBySentence', motionArgs: { forward: false }},
    { keys: ')', type: 'motion', motion: 'moveBySentence', motionArgs: { forward: true }},
    { keys: '<C-f>', type: 'motion', motion: 'moveByPage', motionArgs: { forward: true }},
    { keys: '<C-b>', type: 'motion', motion: 'moveByPage', motionArgs: { forward: false }},
    { keys: '<C-d>', type: 'motion', motion: 'moveByScroll', motionArgs: { forward: true, explicitRepeat: true }},
    { keys: '<C-u>', type: 'motion', motion: 'moveByScroll', motionArgs: { forward: false, explicitRepeat: true }},
    { keys: 'gg', type: 'motion', motion: 'moveToLineOrEdgeOfDocument', motionArgs: { forward: false, explicitRepeat: true, linewise: true, toJumplist: true }},
    { keys: 'G', type: 'motion', motion: 'moveToLineOrEdgeOfDocument', motionArgs: { forward: true, explicitRepeat: true, linewise: true, toJumplist: true }},
    { keys: "g$", type: "motion", motion: "moveToEndOfDisplayLine" },
    { keys: "g^", type: "motion", motion: "moveToStartOfDisplayLine" },
    { keys: "g0", type: "motion", motion: "moveToStartOfDisplayLine" },
    { keys: '0', type: 'motion', motion: 'moveToStartOfLine' },
    { keys: '^', type: 'motion', motion: 'moveToFirstNonWhiteSpaceCharacter' },
    { keys: '+', type: 'motion', motion: 'moveByLines', motionArgs: { forward: true, toFirstChar:true }},
    { keys: '-', type: 'motion', motion: 'moveByLines', motionArgs: { forward: false, toFirstChar:true }},
    { keys: '_', type: 'motion', motion: 'moveByLines', motionArgs: { forward: true, toFirstChar:true, repeatOffset:-1 }},
    { keys: '$', type: 'motion', motion: 'moveToEol', motionArgs: { inclusive: true }},
    { keys: '%', type: 'motion', motion: 'moveToMatchedSymbol', motionArgs: { inclusive: true, toJumplist: true }},
    { keys: 'f<character>', type: 'motion', motion: 'moveToCharacter', motionArgs: { forward: true , inclusive: true }},
    { keys: 'F<character>', type: 'motion', motion: 'moveToCharacter', motionArgs: { forward: false }},
    { keys: 't<character>', type: 'motion', motion: 'moveTillCharacter', motionArgs: { forward: true, inclusive: true }},
    { keys: 'T<character>', type: 'motion', motion: 'moveTillCharacter', motionArgs: { forward: false }},
    { keys: ';', type: 'motion', motion: 'repeatLastCharacterSearch', motionArgs: { forward: true }},
    { keys: ',', type: 'motion', motion: 'repeatLastCharacterSearch', motionArgs: { forward: false }},
    { keys: '\'<register>', type: 'motion', motion: 'goToMark', motionArgs: {toJumplist: true, linewise: true}},
    { keys: '`<register>', type: 'motion', motion: 'goToMark', motionArgs: {toJumplist: true}},
    { keys: ']`', type: 'motion', motion: 'jumpToMark', motionArgs: { forward: true } },
    { keys: '[`', type: 'motion', motion: 'jumpToMark', motionArgs: { forward: false } },
    { keys: ']\'', type: 'motion', motion: 'jumpToMark', motionArgs: { forward: true, linewise: true } },
    { keys: '[\'', type: 'motion', motion: 'jumpToMark', motionArgs: { forward: false, linewise: true } },
    // the next two aren't motions but must come before more general motion declarations
    { keys: ']p', type: 'action', action: 'paste', isEdit: true, actionArgs: { after: true, isEdit: true, matchIndent: true}},
    { keys: '[p', type: 'action', action: 'paste', isEdit: true, actionArgs: { after: false, isEdit: true, matchIndent: true}},
    { keys: ']<character>', type: 'motion', motion: 'moveToSymbol', motionArgs: { forward: true, toJumplist: true}},
    { keys: '[<character>', type: 'motion', motion: 'moveToSymbol', motionArgs: { forward: false, toJumplist: true}},
    { keys: '|', type: 'motion', motion: 'moveToColumn'},
    { keys: 'o', type: 'motion', motion: 'moveToOtherHighlightedEnd', context:'visual'},
    { keys: 'O', type: 'motion', motion: 'moveToOtherHighlightedEnd', motionArgs: {sameLine: true}, context:'visual'},
    // Operators
    { keys: 'd', type: 'operator', operator: 'delete' },
    { keys: 'y', type: 'operator', operator: 'yank' },
    { keys: 'c', type: 'operator', operator: 'change' },
    { keys: '=', type: 'operator', operator: 'indentAuto' },
    { keys: '>', type: 'operator', operator: 'indent', operatorArgs: { indentRight: true }},
    { keys: '<', type: 'operator', operator: 'indent', operatorArgs: { indentRight: false }},
    { keys: 'g~', type: 'operator', operator: 'changeCase' },
    { keys: 'gu', type: 'operator', operator: 'changeCase', operatorArgs: {toLower: true}, isEdit: true },
    { keys: 'gU', type: 'operator', operator: 'changeCase', operatorArgs: {toLower: false}, isEdit: true },
    { keys: 'n', type: 'motion', motion: 'findNext', motionArgs: { forward: true, toJumplist: true }},
    { keys: 'N', type: 'motion', motion: 'findNext', motionArgs: { forward: false, toJumplist: true }},
    { keys: 'gn', type: 'motion', motion: 'findAndSelectNextInclusive', motionArgs: { forward: true }},
    { keys: 'gN', type: 'motion', motion: 'findAndSelectNextInclusive', motionArgs: { forward: false }},
    { keys: 'gq', type: 'operator', operator: 'hardWrap' },
    { keys: 'gw', type: 'operator', operator: 'hardWrap', operatorArgs: {keepCursor: true}},
    { keys: 'g?', type: 'operator', operator: 'rot13'},
    // Operator-Motion dual commands
    { keys: 'x', type: 'operatorMotion', operator: 'delete', motion: 'moveByCharacters', motionArgs: { forward: true }, operatorMotionArgs: { visualLine: false }},
    { keys: 'X', type: 'operatorMotion', operator: 'delete', motion: 'moveByCharacters', motionArgs: { forward: false }, operatorMotionArgs: { visualLine: true }},
    { keys: 'D', type: 'operatorMotion', operator: 'delete', motion: 'moveToEol', motionArgs: { inclusive: true }, context: 'normal'},
    { keys: 'D', type: 'operator', operator: 'delete', operatorArgs: { linewise: true }, context: 'visual'},
    { keys: 'Y', type: 'operatorMotion', operator: 'yank', motion: 'expandToLine', motionArgs: { linewise: true }, context: 'normal'},
    { keys: 'Y', type: 'operator', operator: 'yank', operatorArgs: { linewise: true }, context: 'visual'},
    { keys: 'C', type: 'operatorMotion', operator: 'change', motion: 'moveToEol', motionArgs: { inclusive: true }, context: 'normal'},
    { keys: 'C', type: 'operator', operator: 'change', operatorArgs: { linewise: true }, context: 'visual'},
    { keys: '~', type: 'operatorMotion', operator: 'changeCase', motion: 'moveByCharacters', motionArgs: { forward: true }, operatorArgs: { shouldMoveCursor: true }, context: 'normal'},
    { keys: '~', type: 'operator', operator: 'changeCase', context: 'visual'},
    { keys: '<C-u>', type: 'operatorMotion', operator: 'delete', motion: 'moveToStartOfLine', context: 'insert' },
    { keys: '<C-w>', type: 'operatorMotion', operator: 'delete', motion: 'moveByWords', motionArgs: { forward: false, wordEnd: false }, context: 'insert' },
    //ignore C-w in normal mode
    { keys: '<C-w>', type: 'idle', context: 'normal' },
    // Actions
    { keys: '<C-i>', type: 'action', action: 'jumpListWalk', actionArgs: { forward: true }},
    { keys: '<C-o>', type: 'action', action: 'jumpListWalk', actionArgs: { forward: false }},
    { keys: '<C-e>', type: 'action', action: 'scroll', actionArgs: { forward: true, linewise: true }},
    { keys: '<C-y>', type: 'action', action: 'scroll', actionArgs: { forward: false, linewise: true }},
    { keys: 'a', type: 'action', action: 'enterInsertMode', isEdit: true, actionArgs: { insertAt: 'charAfter' }, context: 'normal' },
    { keys: 'A', type: 'action', action: 'enterInsertMode', isEdit: true, actionArgs: { insertAt: 'eol' }, context: 'normal' },
    { keys: 'A', type: 'action', action: 'enterInsertMode', isEdit: true, actionArgs: { insertAt: 'endOfSelectedArea' }, context: 'visual' },
    { keys: 'i', type: 'action', action: 'enterInsertMode', isEdit: true, actionArgs: { insertAt: 'inplace' }, context: 'normal' },
    { keys: 'gi', type: 'action', action: 'enterInsertMode', isEdit: true, actionArgs: { insertAt: 'lastEdit' }, context: 'normal' },
    { keys: 'I', type: 'action', action: 'enterInsertMode', isEdit: true, actionArgs: { insertAt: 'firstNonBlank'}, context: 'normal' },
    { keys: 'gI', type: 'action', action: 'enterInsertMode', isEdit: true, actionArgs: { insertAt: 'bol'}, context: 'normal' },
    { keys: 'I', type: 'action', action: 'enterInsertMode', isEdit: true, actionArgs: { insertAt: 'startOfSelectedArea' }, context: 'visual' },
    { keys: 'o', type: 'action', action: 'newLineAndEnterInsertMode', isEdit: true, interlaceInsertRepeat: true, actionArgs: { after: true }, context: 'normal' },
    { keys: 'O', type: 'action', action: 'newLineAndEnterInsertMode', isEdit: true, interlaceInsertRepeat: true, actionArgs: { after: false }, context: 'normal' },
    { keys: 'v', type: 'action', action: 'toggleVisualMode' },
    { keys: 'V', type: 'action', action: 'toggleVisualMode', actionArgs: { linewise: true }},
    { keys: '<C-v>', type: 'action', action: 'toggleVisualMode', actionArgs: { blockwise: true }},
    { keys: '<C-q>', type: 'action', action: 'toggleVisualMode', actionArgs: { blockwise: true }},
    { keys: 'gv', type: 'action', action: 'reselectLastSelection' },
    { keys: 'J', type: 'action', action: 'joinLines', isEdit: true },
    { keys: 'gJ', type: 'action', action: 'joinLines', actionArgs: { keepSpaces: true }, isEdit: true },
    { keys: 'p', type: 'action', action: 'paste', isEdit: true, actionArgs: { after: true, isEdit: true }},
    { keys: 'P', type: 'action', action: 'paste', isEdit: true, actionArgs: { after: false, isEdit: true }},
    { keys: 'r<character>', type: 'action', action: 'replace', isEdit: true },
    { keys: '@<register>', type: 'action', action: 'replayMacro' },
    { keys: 'q<register>', type: 'action', action: 'enterMacroRecordMode' },
    // Handle Replace-mode as a special case of insert mode.
    { keys: 'R', type: 'action', action: 'enterInsertMode', isEdit: true, actionArgs: { replace: true }, context: 'normal'},
    { keys: 'R', type: 'operator', operator: 'change', operatorArgs: { linewise: true, fullLine: true }, context: 'visual', exitVisualBlock: true},
    { keys: 'u', type: 'action', action: 'undo', context: 'normal' },
    { keys: 'u', type: 'operator', operator: 'changeCase', operatorArgs: {toLower: true}, context: 'visual', isEdit: true },
    { keys: 'U', type: 'operator', operator: 'changeCase', operatorArgs: {toLower: false}, context: 'visual', isEdit: true },
    { keys: '<C-r>', type: 'action', action: 'redo' },
    { keys: 'm<register>', type: 'action', action: 'setMark' },
    { keys: '"<register>', type: 'action', action: 'setRegister' },
    { keys: '<C-r><register>', type: 'action', action: 'insertRegister', context: 'insert', isEdit: true },
    { keys: '<C-o>', type: 'action', action: 'oneNormalCommand', context: 'insert' },
    { keys: 'zz', type: 'action', action: 'scrollToCursor', actionArgs: { position: 'center' }},
    { keys: 'z.', type: 'action', action: 'scrollToCursor', actionArgs: { position: 'center' }, motion: 'moveToFirstNonWhiteSpaceCharacter' },
    { keys: 'zt', type: 'action', action: 'scrollToCursor', actionArgs: { position: 'top' }},
    { keys: 'z<CR>', type: 'action', action: 'scrollToCursor', actionArgs: { position: 'top' }, motion: 'moveToFirstNonWhiteSpaceCharacter' },
    { keys: 'zb', type: 'action', action: 'scrollToCursor', actionArgs: { position: 'bottom' }},
    { keys: 'z-', type: 'action', action: 'scrollToCursor', actionArgs: { position: 'bottom' }, motion: 'moveToFirstNonWhiteSpaceCharacter' },
    { keys: '.', type: 'action', action: 'repeatLastEdit' },
    { keys: '<C-a>', type: 'action', action: 'incrementNumberToken', isEdit: true, actionArgs: {increase: true, backtrack: false}},
    { keys: '<C-x>', type: 'action', action: 'incrementNumberToken', isEdit: true, actionArgs: {increase: false, backtrack: false}},
    { keys: '<C-t>', type: 'action', action: 'indent', actionArgs: { indentRight: true }, context: 'insert' },
    { keys: '<C-d>', type: 'action', action: 'indent', actionArgs: { indentRight: false }, context: 'insert' },
    // Text object motions
    { keys: 'a<register>', type: 'motion', motion: 'textObjectManipulation' },
    { keys: 'i<register>', type: 'motion', motion: 'textObjectManipulation', motionArgs: { textObjectInner: true }},
    // Search
    { keys: '/', type: 'search', searchArgs: { forward: true, querySrc: 'prompt', toJumplist: true }},
    { keys: '?', type: 'search', searchArgs: { forward: false, querySrc: 'prompt', toJumplist: true }},
    { keys: '*', type: 'search', searchArgs: { forward: true, querySrc: 'wordUnderCursor', wholeWordOnly: true, toJumplist: true }},
    { keys: '#', type: 'search', searchArgs: { forward: false, querySrc: 'wordUnderCursor', wholeWordOnly: true, toJumplist: true }},
    { keys: 'g*', type: 'search', searchArgs: { forward: true, querySrc: 'wordUnderCursor', toJumplist: true }},
    { keys: 'g#', type: 'search', searchArgs: { forward: false, querySrc: 'wordUnderCursor', toJumplist: true }},
    // Ex command
    { keys: ':', type: 'ex' }
  ];
  var usedKeys = Object.create(null);
  var defaultKeymapLength = defaultKeymap.length;

  /**
   * Ex commands
   * Care must be taken when adding to the default Ex command map. For any
   * pair of commands that have a shared prefix, at least one of their
   * shortNames must not match the prefix of the other command.
   */
  var defaultExCommandMap = [
    { name: 'colorscheme', shortName: 'colo' },
    { name: 'map' },
    { name: 'imap', shortName: 'im' },
    { name: 'nmap', shortName: 'nm' },
    { name: 'vmap', shortName: 'vm' },
    { name: 'omap', shortName: 'om' },
    { name: 'noremap', shortName: 'no' },
    { name: 'nnoremap', shortName: 'nn' },
    { name: 'vnoremap', shortName: 'vn' },
    { name: 'inoremap', shortName: 'ino' },
    { name: 'onoremap', shortName: 'ono' },
    { name: 'unmap' },
    { name: 'mapclear', shortName: 'mapc' },
    { name: 'nmapclear', shortName: 'nmapc' },
    { name: 'vmapclear', shortName: 'vmapc' },
    { name: 'imapclear', shortName: 'imapc' },
    { name: 'omapclear', shortName: 'omapc' },
    { name: 'write', shortName: 'w' },
    { name: 'undo', shortName: 'u' },
    { name: 'redo', shortName: 'red' },
    { name: 'set', shortName: 'se' },
    { name: 'setlocal', shortName: 'setl' },
    { name: 'setglobal', shortName: 'setg' },
    { name: 'sort', shortName: 'sor' },
    { name: 'substitute', shortName: 's', possiblyAsync: true },
    { name: 'startinsert', shortName: 'start' },
    { name: 'nohlsearch', shortName: 'noh' },
    { name: 'yank', shortName: 'y' },
    { name: 'delmarks', shortName: 'delm' },
    { name: 'marks',  excludeFromCommandHistory: true },
    { name: 'registers', shortName: 'reg', excludeFromCommandHistory: true },
    { name: 'vglobal', shortName: 'v' },
    { name: 'delete', shortName: 'd' },
    { name: 'join', shortName: 'j' },
    { name: 'normal', shortName: 'norm' },
    { name: 'global', shortName: 'g' }
  ];

  /**
   * Langmap
   * Determines how to interpret keystrokes in Normal and Visual mode.
   * Useful for people who use a different keyboard layout than QWERTY
   */
  var langmap = parseLangmap('');

  /** @arg {CodeMirror} cm */
  function enterVimMode(cm) {
    cm.setOption('disableInput', true);
    cm.setOption('showCursorWhenSelecting', false);
    CM.signal(cm, "vim-mode-change", {mode: "normal"});
    cm.on('cursorActivity', onCursorActivity);
    maybeInitVimState(cm);
    // @ts-ignore
    CM.on(cm.getInputField(), 'paste', getOnPasteFn(cm));
  }

  /** @arg {CodeMirror} cm */
  function leaveVimMode(cm) {
    cm.setOption('disableInput', false);
    cm.off('cursorActivity', onCursorActivity);
    // @ts-ignore
    CM.off(cm.getInputField(), 'paste', getOnPasteFn(cm));
    cm.state.vim = null;
    if (highlightTimeout) clearTimeout(highlightTimeout);
  }

  /** @arg {CodeMirrorV} cm */
  function getOnPasteFn(cm) {
    var vim = cm.state.vim;
    if (!vim.onPasteFn) {
      vim.onPasteFn = function() {
        if (!vim.insertMode) {
          cm.setCursor(offsetCursor(cm.getCursor(), 0, 1));
          actions.enterInsertMode(cm, {}, vim);
        }
      };
    }
    return vim.onPasteFn;
  }

  var numberRegex = /[\d]/;
  var wordCharTest = [CM.isWordChar, function(ch) {
    return ch && !CM.isWordChar(ch) && !/\s/.test(ch);
  }], bigWordCharTest = [function(ch) {
    return /\S/.test(ch);
  }];
  var validMarks = ['<', '>'];
  var validRegisters = ['-', '"', '.', ':', '_', '/', '+'];
  var latinCharRegex = /^\w$/;
  var upperCaseChars = /^[A-Z]$/;
  try { upperCaseChars = new RegExp("^[\\p{Lu}]$", "u"); }
  catch (_) { }

  /** @arg {CodeMirror} cm @arg {number} line */
  function isLine(cm, line) {
    return line >= cm.firstLine() && line <= cm.lastLine();
  }
  /** @arg {string} k */
  function isLowerCase(k) {
    return (/^[a-z]$/).test(k);
  }
  /** @arg {string} k */
  function isMatchableSymbol(k) {
    return '()[]{}'.indexOf(k) != -1;
  }
  /** @arg {string} k */
  function isNumber(k) {
    return numberRegex.test(k);
  }
  /** @arg {string} k */
  function isUpperCase(k) {
    return upperCaseChars.test(k);
  }
  /** @arg {string} k */
  function isWhiteSpaceString(k) {
    return (/^\s*$/).test(k);
  }
  /** @arg {string} k */
  function isEndOfSentenceSymbol(k) {
    return '.?!'.indexOf(k) != -1;
  }
  /** @arg {any} val @arg {string | any[]} arr */
  function inArray(val, arr) {
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] == val) {
        return true;
      }
    }
    return false;
  }


  /** @typedef {import("./types").vimOption} vimOption */
  /** @type {Object<string, vimOption>} */
  var options = {};
  /**
   * @overload
   * @arg {string} name 
   * @arg {boolean|null|undefined} defaultValue 
   * @arg {'boolean'} type 
   * @arg {string[]|null} [aliases] 
   * @arg {import("./types").booleanOptionCallback} [callback] 
   * @returns {void}
   */
  /**
   * @overload
   * @arg {string} name 
   * @arg {number|null|undefined} defaultValue 
   * @arg {'number'} type 
   * @arg {string[]|null} [aliases] 
   * @arg {import("./types").numberOptionCallback} [callback]
   * @returns {void} 
   */
  /**
   * @overload
   * @arg {string} name 
   * @arg {string|null|undefined} defaultValue 
   * @arg {'string'} type 
   * @arg {string[]|null} [aliases] 
   * @arg {import("./types").stringOptionCallback} [callback]
   * @returns {void}
   */
  /** 
   * @arg {string} name 
   * @arg {any} defaultValue 
   * @arg {'string'} type 
   * @arg {string[]|null} [aliases] 
   * @arg {import("./types").optionCallback} [callback] 
   * */
  function defineOption(name, defaultValue, type, aliases, callback) {
    if (defaultValue === undefined && !callback) {
      throw Error('defaultValue is required unless callback is provided');
    }
    if (!type) { type = 'string'; }
    options[name] = {
      type: type,
      defaultValue: defaultValue,
      callback: callback
    };
    if (aliases) {
      for (var i = 0; i < aliases.length; i++) {
        options[aliases[i]] = options[name];
      }
    }
    if (defaultValue) {
      setOption(name, defaultValue);
    }
  }

  /**
   * @arg {string} name 
   * @arg {any} value 
   * @arg {CodeMirrorV} [cm] 
   * @arg {{ scope?: any; } | undefined} [cfg] */
  function setOption(name, value, cm, cfg) {
    var option = options[name];
    cfg = cfg || {};
    var scope = cfg.scope;
    if (!option) {
      return new Error('Unknown option: ' + name);
    }
    if (option.type == 'boolean') {
      if (value && value !== true) {
        return new Error('Invalid argument: ' + name + '=' + value);
      } else if (value !== false) {
        // Boolean options are set to true if value is not defined.
        value = true;
      }
    }
    if (option.callback) {
      if (scope !== 'local') {
        option.callback(value, undefined);
      }
      if (scope !== 'global' && cm) {
        option.callback(value, cm);
      }
    } else {
      if (scope !== 'local') {
        option.value = option.type == 'boolean' ? !!value : value;
      }
      if (scope !== 'global' && cm) {
        cm.state.vim.options[name] = {value: value};
      }
    }
  }

  /** 
   * @arg {string} name 
   * @arg {CodeMirrorV} [cm] 
   * @arg {{ scope?: any; } | undefined} [cfg] */
  function getOption(name, cm, cfg) {
    var option = options[name];
    cfg = cfg || {};
    var scope = cfg.scope;
    if (!option) {
      return new Error('Unknown option: ' + name);
    }
    if (option.callback) {
      let local = cm && option.callback(undefined, cm);
      if (scope !== 'global' && local !== undefined) {
        return local;
      }
      if (scope !== 'local') {
        return option.callback();
      }
      return;
    } else {
      let local = (scope !== 'global') && (cm && cm.state.vim.options[name]);
      return (local || (scope !== 'local') && option || {}).value;
    }
  }
  /** @arg {string|undefined} name @arg {CodeMirrorV} [cm] */
  defineOption('filetype', undefined, 'string', ['ft'], function(name, cm) {
    // Option is local. Do nothing for global.
    if (cm === undefined) {
      return;
    }
    // The 'filetype' option proxies to the CodeMirror 'mode' option.
    if (name === undefined) {
      let mode = cm.getOption('mode');
      return mode == 'null' ? '' : mode;
    } else {
      let mode = name == '' ? 'null' : name;
      cm.setOption('mode', mode);
    }
  });
  defineOption('textwidth', 80, 'number', ['tw'], function(width, cm) {
    // Option is local. Do nothing for global.
    if (cm === undefined) {
      return;
    }
    // The 'filetype' option proxies to the CodeMirror 'mode' option.
    if (width === undefined) {
      var value = cm.getOption('textwidth');
      return value;
    } else {
      var column = Math.round(width);
      if (column > 1) {
        cm.setOption('textwidth', column);
      }
    }
  });

  var createCircularJumpList = function() {
    var size = 100;
    var pointer = -1;
    var head = 0;
    var tail = 0;
    
    var buffer = /**@type {(Marker|undefined)[]} */ (new Array(size));
    /** @arg {CodeMirror} cm  @arg {Pos} oldCur @arg {Pos} newCur */
    function add(cm, oldCur, newCur) {
      var current = pointer % size;
      var curMark = buffer[current];
      /** @arg {Pos} cursor */
      function useNextSlot(cursor) {
        var next = ++pointer % size;
        var trashMark = buffer[next];
        if (trashMark) {
          trashMark.clear();
        }
        buffer[next] = cm.setBookmark(cursor);
      }
      if (curMark) {
        var markPos = curMark.find();
        // avoid recording redundant cursor position
        if (markPos && !cursorEqual(markPos, oldCur)) {
          useNextSlot(oldCur);
        }
      } else {
        useNextSlot(oldCur);
      }
      useNextSlot(newCur);
      head = pointer;
      tail = pointer - size + 1;
      if (tail < 0) {
        tail = 0;
      }
    }
    /** @arg {CodeMirror} cm  @arg {number} offset */
    function move(cm, offset) {
      pointer += offset;
      if (pointer > head) {
        pointer = head;
      } else if (pointer < tail) {
        pointer = tail;
      }
      var mark = buffer[(size + pointer) % size];
      // skip marks that are temporarily removed from text buffer
      if (mark && !mark.find()) {
        var inc = offset > 0 ? 1 : -1;
        var newCur;
        var oldCur = cm.getCursor();
        do {
          pointer += inc;
          mark = buffer[(size + pointer) % size];
          // skip marks that are the same as current position
          if (mark &&
              (newCur = mark.find()) &&
              !cursorEqual(oldCur, newCur)) {
            break;
          }
        } while (pointer < head && pointer > tail);
      }
      return mark;
    }
    /** @arg {CodeMirror} cm @arg {number} offset */
    function find(cm, offset) {
      var oldPointer = pointer;
      var mark = move(cm, offset);
      pointer = oldPointer;
      return mark && mark.find();
    }
    return {
      /**@type{Pos|undefined} */
      cachedCursor: undefined, //used for # and * jumps
      add: add,
      find: find,
      move: move
    };
  };

  /** 
   * Returns an object to track the changes associated insert mode.  It
   * clones the object that is passed in, or creates an empty object one if
   * none is provided.
   * @arg {import("./types").InsertModeChanges | undefined} [c]
   * @returns {import("./types").InsertModeChanges} 
   */
  var createInsertModeChanges = function(c) {
    if (c) {
      // Copy construction
      return {
        changes: c.changes,
        expectCursorActivityForChange: c.expectCursorActivityForChange
      };
    }
    return {
      // Change list
      changes: [],
      // Set to true on change, false on cursorActivity.
      expectCursorActivityForChange: false
    };
  };

  class MacroModeState {
    constructor() {
      this.latestRegister = undefined;
      this.isPlaying = false;
      this.isRecording = false;
      /** @type {string[]}*/
      this.replaySearchQueries = [];
      this.onRecordingDone = undefined;
      this.lastInsertModeChanges = createInsertModeChanges();
    }
    exitMacroRecordMode() {
      var macroModeState = vimGlobalState.macroModeState;
      if (macroModeState.onRecordingDone) {
        macroModeState.onRecordingDone(); // close dialog
      }
      macroModeState.onRecordingDone = undefined;
      macroModeState.isRecording = false;
    }
    /**
     * @arg {CodeMirror} cm
     * @arg {string} registerName
     */
    enterMacroRecordMode(cm, registerName) {
      var register = vimGlobalState.registerController.getRegister(registerName);
      if (register) {
        register.clear();
        this.latestRegister = registerName;
        if (cm.openDialog) {
          var template = dom('span', {class: 'cm-vim-message'}, 'recording @' + registerName);
          this.onRecordingDone = cm.openDialog(template, function() {}, {bottom:true});
        }
        this.isRecording = true;
      }
    }
  }
  /**
   * @arg {CodeMirror} cm
   * @return {vimState}
   */
  function maybeInitVimState(cm) {
    if (!cm.state.vim) {
      // Store instance state in the CodeMirror object.
      cm.state.vim = {
        inputState: new InputState(),
        // Vim's input state that triggered the last edit, used to repeat
        // motions and operators with '.'.
        lastEditInputState: undefined,
        // Vim's action command before the last edit, used to repeat actions
        // with '.' and insert mode repeat.
        lastEditActionCommand: undefined,
        // When using jk for navigation, if you move from a longer line to a
        // shorter line, the cursor may clip to the end of the shorter line.
        // If j is pressed again and cursor goes to the next line, the
        // cursor should go back to its horizontal position on the longer
        // line if it can. This is to keep track of the horizontal position.
        lastHPos: -1,
        // Doing the same with screen-position for gj/gk
        lastHSPos: -1,
        // The last motion command run. Cleared if a non-motion command gets
        // executed in between.
        lastMotion: null,
        marks: {},
        insertMode: false,
        insertModeReturn: false,
        // Repeat count for changes made in insert mode, triggered by key
        // sequences like 3,i. Only exists when insertMode is true.
        insertModeRepeat: undefined,
        visualMode: false,
        // If we are in visual line mode. No effect if visualMode is false.
        visualLine: false,
        visualBlock: false,
        lastSelection: /**@type{vimState["lastSelection"]}*/( /**@type{unknown}*/(null)),
        lastPastedText: undefined,
        sel: {anchor: new Pos(0, 0), head: new Pos(0, 0)},
        // Buffer-local/window-local values of vim options.
        options: {},
        // Whether the next character should be interpreted literally
        // Necassary for correct implementation of f<character>, r<character> etc.
        // in terms of langmaps.
        expectLiteralNext: false,
        status: "",
      };
    }
    return cm.state.vim;
  }
  /**
   * @type { 
      {
        macroModeState: MacroModeState;
        registerController: RegisterController;
        searchHistoryController: HistoryController;
        jumpList: ReturnType<createCircularJumpList>;
        exCommandHistoryController: HistoryController; 
        lastCharacterSearch: {increment: number, forward: boolean, selectedCharacter: string}; 
        query?: any;
        isReversed?: boolean;
        lastSubstituteReplacePart: any;
        searchQuery?: null; 
        searchIsReversed?: boolean; 
      }
    }
  */
  var vimGlobalState;
  function resetVimGlobalState() {
    vimGlobalState = {
      // The current search query.
      searchQuery: null,
      // Whether we are searching backwards.
      searchIsReversed: false,
      // Replace part of the last substituted pattern
      lastSubstituteReplacePart: undefined,
      jumpList: createCircularJumpList(),
      macroModeState: new MacroModeState(),
      // Recording latest f, t, F or T motion command.
      lastCharacterSearch: {increment:0, forward:true, selectedCharacter:''},
      registerController: new RegisterController({}),
      // search history buffer
      searchHistoryController: new HistoryController(),
      // ex Command history buffer
      exCommandHistoryController : new HistoryController()
    };
    for (var optionName in options) {
      var option = options[optionName];
      option.value = option.defaultValue;
    }
  }

  class InsertModeKey {
    /**
     * Wrapper for special keys pressed in insert mode
     * @arg {string} keyName
     * @arg {KeyboardEvent} e
     * @returns
     */    
    constructor(keyName, e) {
      this.keyName = keyName;
      this.key = e.key;
      this.ctrlKey = e.ctrlKey;
      this.altKey = e.altKey;
      this.metaKey = e.metaKey;
      this.shiftKey = e.shiftKey;
    }
  }


  /** @type {number | undefined|false} */
  var lastInsertModeKeyTimer;
  var vimApi = {
    enterVimMode: enterVimMode,
    leaveVimMode: leaveVimMode,
    buildKeyMap: function() {
      // TODO: Convert keymap into dictionary format for fast lookup.
    },
    // Testing hook, though it might be useful to expose the register
    // controller anyway.
    getRegisterController: function() {
      return vimGlobalState.registerController;
    },
    // Testing hook.
    resetVimGlobalState_: resetVimGlobalState,

    // Testing hook.
    getVimGlobalState_: function() {
      return vimGlobalState;
    },

    // Testing hook.
    maybeInitVimState_: maybeInitVimState,

    suppressErrorLogging: false,

    InsertModeKey: InsertModeKey,
    /**@type {(lhs: string, rhs: string, ctx: string) => void} */
    map: function(lhs, rhs, ctx) {
      // Add user defined key bindings.
      exCommandDispatcher.map(lhs, rhs, ctx);
    },
    /**@type {(lhs: string, ctx: string) => any} */
    unmap: function(lhs, ctx) {
      return exCommandDispatcher.unmap(lhs, ctx);
    },
    // Non-recursive map function.
    // NOTE: This will not create mappings to key maps that aren't present
    // in the default key map. See TODO at bottom of function.
    /**@type {(lhs: string, rhs: string, ctx: string) => void} */
    noremap: function(lhs, rhs, ctx) {
      exCommandDispatcher.map(lhs, rhs, ctx, true);
    },
    // Remove all user-defined mappings for the provided context.
    /**@arg {string} [ctx]} */
    mapclear: function(ctx) {
      // Partition the existing keymap into user-defined and true defaults.
      var actualLength = defaultKeymap.length,
          origLength = defaultKeymapLength;
      var userKeymap = defaultKeymap.slice(0, actualLength - origLength);
      defaultKeymap = defaultKeymap.slice(actualLength - origLength);
      if (ctx) {
        // If a specific context is being cleared, we need to keep mappings
        // from all other contexts.
        for (var i = userKeymap.length - 1; i >= 0; i--) {
          var mapping = userKeymap[i];
          if (ctx !== mapping.context) {
            if (mapping.context) {
              this._mapCommand(mapping);
            } else {
              // `mapping` applies to all contexts so create keymap copies
              // for each context except the one being cleared.
              var contexts = ['normal', 'insert', 'visual'];
              for (var j in contexts) {
                if (contexts[j] !== ctx) {
                  var newMapping = Object.assign({}, mapping);
                  newMapping.context = contexts[j];
                  this._mapCommand(newMapping);
                }
              }
            }
          }
        }
      }
    },
    langmap: updateLangmap,
    vimKeyFromEvent: vimKeyFromEvent,
    // TODO: Expose setOption and getOption as instance methods. Need to decide how to namespace
    // them, or somehow make them work with the existing CodeMirror setOption/getOption API.
    setOption: setOption,
    getOption: getOption,
    defineOption: defineOption,
    /**@type {(name: string, prefix: string|undefined, func: ExFn) => void} */
    defineEx: function(name, prefix, func){
      if (!prefix) {
        prefix = name;
      } else if (name.indexOf(prefix) !== 0) {
        throw new Error('(Vim.defineEx) "'+prefix+'" is not a prefix of "'+name+'", command not registered');
      }
      exCommands[name]=func;
      exCommandDispatcher.commandMap_[prefix]={name:name, shortName:prefix, type:'api'};
    },
    /**@type {(cm: CodeMirror, key: string, origin: string) => undefined | boolean} */
    handleKey: function (cm, key, origin) {
      var command = this.findKey(cm, key, origin);
      if (typeof command === 'function') {
        return command();
      }
    },
    multiSelectHandleKey: multiSelectHandleKey,

    /**
     * This is the outermost function called by CodeMirror, after keys have
     * been mapped to their Vim equivalents.
     *
     * Finds a command based on the key (and cached keys if there is a
     * multi-key sequence). Returns `undefined` if no key is matched, a noop
     * function if a partial match is found (multi-key), and a function to
     * execute the bound command if a a key is matched. The function always
     * returns true.
     */
    /**@type {(cm_: CodeMirror, key: string, origin?: string| undefined) => (() => boolean|undefined) | undefined} */
    findKey: function(cm_, key, origin) {
      var vim = maybeInitVimState(cm_);
      var cm = /**@type {CodeMirrorV}*/(cm_);

      function handleMacroRecording() {
        var macroModeState = vimGlobalState.macroModeState;
        if (macroModeState.isRecording) {
          if (key == 'q') {
            macroModeState.exitMacroRecordMode();
            clearInputState(cm);
            return true;
          }
          if (origin != 'mapping') {
            logKey(macroModeState, key);
          }
        }
      }
      function handleEsc() {
        if (key == '<Esc>') {
          if (vim.visualMode) {
            // Get back to normal mode.
            exitVisualMode(cm);
          } else if (vim.insertMode) {
            // Get back to normal mode.
            exitInsertMode(cm);
          } else {
            // We're already in normal mode. Let '<Esc>' be handled normally.
            return;
          }
          clearInputState(cm);
          return true;
        }
      }

      function handleKeyInsertMode() {
        if (handleEsc()) { return true; }
        vim.inputState.keyBuffer.push(key);
        var keys = vim.inputState.keyBuffer.join("");
        var keysAreChars = key.length == 1;
        var match = commandDispatcher.matchCommand(keys, defaultKeymap, vim.inputState, 'insert');
        var changeQueue = vim.inputState.changeQueue;

        if (match.type == 'none') { clearInputState(cm); return false; }
        else if (match.type == 'partial') {
          if (match.expectLiteralNext) vim.expectLiteralNext = true;
          if (lastInsertModeKeyTimer) { window.clearTimeout(lastInsertModeKeyTimer); }
          lastInsertModeKeyTimer = keysAreChars && window.setTimeout(
            function() { if (vim.insertMode && vim.inputState.keyBuffer.length) { clearInputState(cm); } },
            getOption('insertModeEscKeysTimeout'));
          if (keysAreChars) {
            var selections = cm.listSelections();
            if (!changeQueue || changeQueue.removed.length != selections.length)
              changeQueue = vim.inputState.changeQueue = new ChangeQueue;
            changeQueue.inserted += key;
            for (var i = 0; i < selections.length; i++) {
              var from = cursorMin(selections[i].anchor, selections[i].head);
              var to = cursorMax(selections[i].anchor, selections[i].head);
              var text = cm.getRange(from, cm.state.overwrite ? offsetCursor(to, 0, 1) : to);
              changeQueue.removed[i] = (changeQueue.removed[i] || "") + text;
            }
          }
          return !keysAreChars;
        }
        else if (match.type == 'full') {
          vim.inputState.keyBuffer.length = 0;
        }
        vim.expectLiteralNext = false;

        if (lastInsertModeKeyTimer) { window.clearTimeout(lastInsertModeKeyTimer); }
        if (match.command && changeQueue) {
          var selections = cm.listSelections();
          for (var i = 0; i < selections.length; i++) {
            var here = selections[i].head;
            cm.replaceRange(changeQueue.removed[i] || "", 
              offsetCursor(here, 0, -changeQueue.inserted.length), here, '+input');
          }
          vimGlobalState.macroModeState.lastInsertModeChanges.changes.pop();
        }
        if (!match.command) clearInputState(cm);
        return match.command;
      }

      function handleKeyNonInsertMode() {
        if (handleMacroRecording() || handleEsc()) { return true; }

        vim.inputState.keyBuffer.push(key);
        var keys = vim.inputState.keyBuffer.join("");
        if (/^[1-9]\d*$/.test(keys)) { return true; }

        var keysMatcher = /^(\d*)(.*)$/.exec(keys);
        if (!keysMatcher) { clearInputState(cm); return false; }
        var context = vim.visualMode ? 'visual' :
                                        'normal';
        var mainKey = keysMatcher[2] || keysMatcher[1];
        if (vim.inputState.operatorShortcut && vim.inputState.operatorShortcut.slice(-1) == mainKey) {
          // multikey operators act linewise by repeating only the last character
          mainKey = vim.inputState.operatorShortcut;
        }
        var match = commandDispatcher.matchCommand(mainKey, defaultKeymap, vim.inputState, context);
        if (match.type == 'none') { clearInputState(cm); return false; }
        else if (match.type == 'partial') {
          if (match.expectLiteralNext) vim.expectLiteralNext = true;
          return true;
        }
        else if (match.type == 'clear') { clearInputState(cm); return true; }
        vim.expectLiteralNext = false;

        vim.inputState.keyBuffer.length = 0;
        keysMatcher = /^(\d*)(.*)$/.exec(keys);
        if (keysMatcher && keysMatcher[1] && keysMatcher[1] != '0') {
          vim.inputState.pushRepeatDigit(keysMatcher[1]);
        }
        return match.command;
      }

      var command = vim.insertMode
        ? handleKeyInsertMode()
        : handleKeyNonInsertMode();

      if (command === false) {
        return !vim.insertMode && (key.length === 1 || (CM.isMac && /<A-.>/.test(key)))? function() { return true; } : undefined;
      } else if (command === true) {
        // TODO: Look into using CodeMirror's multi-key handling.
        // Return no-op since we are caching the key. Counts as handled, but
        // don't want act on it just yet.
        return function() { return true; };
      } else if (command) {
        return function() {
          return cm.operation(function() {
            // @ts-ignore
            cm.curOp.isVimOp = true;
            try {
              if (typeof command != 'object') return;
              
              if (command.type == 'keyToKey') {
                doKeyToKey(cm, command.toKeys, command);
              } else {
                commandDispatcher.processCommand(cm, vim, command);
              }
            } catch (e) {
              // clear VIM state in case it's in a bad state.
              // @ts-ignore
              cm.state.vim = undefined;
              maybeInitVimState(cm);
              if (!vimApi.suppressErrorLogging) {
                console['log'](e);
              }
              throw e;
            }
            return true;
          });
        };
      }
    },
    /**@type {(cm: CodeMirrorV, input: string)=>void} */
    handleEx: function(cm, input) {
      exCommandDispatcher.processCommand(cm, input);
    },

    defineMotion: defineMotion,
    defineAction: defineAction,
    defineOperator: defineOperator,
    mapCommand: mapCommand,
    _mapCommand: _mapCommand,

    defineRegister: defineRegister,

    exitVisualMode: exitVisualMode,
    exitInsertMode: exitInsertMode
  };

  var keyToKeyStack = [];
  var noremap = false;
  /**@type {undefined | null | import("./types").PromptOptions} */
  var virtualPrompt;
  /**
   * @arg {string} key
   */
  function sendKeyToPrompt(key) {
    if (!virtualPrompt) throw new Error('No prompt to send key to');
    if (key[0] == "<") {
      var lowerKey = key.toLowerCase().slice(1, -1);
      var parts = lowerKey.split('-');
      lowerKey = parts.pop() || '';
      if (lowerKey == 'lt') key = '<';
      else if (lowerKey == 'space') key = ' ';
      else if (lowerKey == 'cr') key = '\n';
      else if (vimToCmKeyMap[lowerKey]) {
        var value = virtualPrompt.value || "";
        var event =  {
          key: vimToCmKeyMap[lowerKey],
          target: {
            value: value,
            selectionEnd: value.length,
            selectionStart: value.length
          }
        };
        if (virtualPrompt.onKeyDown) {
          virtualPrompt.onKeyDown(event, virtualPrompt.value, close);
        }
        if (virtualPrompt && virtualPrompt.onKeyUp) {
          virtualPrompt.onKeyUp(event, virtualPrompt.value, close);
        }
        return;
      }
    }
    if (key == '\n') {
      var prompt = virtualPrompt;
      virtualPrompt = null;
      prompt.onClose && prompt.onClose(prompt.value);
    } else {
      virtualPrompt.value = (virtualPrompt.value || '') + key;
    }

    /** @param {string | undefined} value */
    function close(value) {
      if (!virtualPrompt) return;
      if (typeof value == 'string') { virtualPrompt.value = value; }
      else { virtualPrompt = null; }
    }
  }
  /**
   * @arg {CodeMirrorV} cm
   * @arg {string} keys
   * @arg {vimKey|import("./types").exCommandDefinition|{noremap?: boolean}} [fromKey]
   */
  function doKeyToKey(cm, keys, fromKey) {
    var noremapBefore = noremap;
    // prevent infinite recursion.
    if (fromKey) {
      if (keyToKeyStack.indexOf(fromKey) != -1) return;
      keyToKeyStack.push(fromKey);
      noremap = fromKey.noremap != false;
    }

    try {
      var vim = maybeInitVimState(cm);
      var keyRe = /<(?:[CSMA]-)*\w+>|./gi;

      var match;
      // Pull off one command key, which is either a single character
      // or a special sequence wrapped in '<' and '>', e.g. '<Space>'.
      while ((match = keyRe.exec(keys))) {
        var key = match[0];
        var wasInsert = vim.insertMode;
        if (virtualPrompt) {
          sendKeyToPrompt(key);
          continue;
        }

        var result = vimApi.handleKey(cm, key, 'mapping');

        if (!result && wasInsert && vim.insertMode) {
          if (key[0] == "<") {
            var lowerKey = key.toLowerCase().slice(1, -1);
            var parts = lowerKey.split('-');
            lowerKey = parts.pop() || '';
            if (lowerKey == 'lt') key = '<';
            else if (lowerKey == 'space') key = ' ';
            else if (lowerKey == 'cr') key = '\n';
            else if (vimToCmKeyMap.hasOwnProperty(lowerKey)) {
              // todo support codemirror keys in insertmode vimToCmKeyMap
              key = vimToCmKeyMap[lowerKey];
              sendCmKey(cm, key);
              continue;
            } else {
              key = key[0];
              keyRe.lastIndex = match.index + 1;
            }
          }
          cm.replaceSelection(key);
        }
      }
    } finally {
      keyToKeyStack.pop();
      noremap = keyToKeyStack.length ? noremapBefore : false;
      if (!keyToKeyStack.length && virtualPrompt) {
        var promptOptions = virtualPrompt;
        virtualPrompt = null;
        showPrompt(cm, promptOptions);
      }
    }
  }

  /**@type{Record<string, string>} */
  var specialKey = {
    Return: 'CR', Backspace: 'BS', 'Delete': 'Del', Escape: 'Esc', Insert: 'Ins',
    ArrowLeft: 'Left', ArrowRight: 'Right', ArrowUp: 'Up', ArrowDown: 'Down',
    Enter: 'CR', ' ': 'Space'
  };
  var ignoredKeys = { Shift: 1, Alt: 1, Command: 1, Control: 1,
    CapsLock: 1, AltGraph: 1, Dead: 1, Unidentified: 1 };

  var vimToCmKeyMap = {};
  'Left|Right|Up|Down|End|Home'.split('|').concat(Object.keys(specialKey)).forEach(function(x) {
    vimToCmKeyMap[(specialKey[x] || '').toLowerCase()]
        = vimToCmKeyMap[x.toLowerCase()] = x;
  });

  /**
   * @param {KeyboardEvent} e
   * @param {vimState} [vim]
   */
  function vimKeyFromEvent(e, vim) {
    var key = e.key;
    if (ignoredKeys[key]) return;
    if (key.length > 1 && key[0] == "n") {
      key = key.replace("Numpad", "");
    }
    key = specialKey[key] || key;

    var name = '';
    if (e.ctrlKey) { name += 'C-'; }
    if (e.altKey) { name += 'A-'; }
    if (e.metaKey) { name += 'M-'; }
    // on mac many characters are entered as option- combos
    // (e.g. on swiss keyboard { is option-8)
    // so we ignore lonely A- modifier for keypress event on mac
    if (CM.isMac && name == "A-" && key.length == 1) {
      name = name.slice(2);
    }
    if ((name || key.length > 1) && e.shiftKey) { name += 'S-'; }

    if (vim && !vim.expectLiteralNext && key.length == 1) {
      if (langmap.keymap && key in langmap.keymap) {
        if (langmap.remapCtrl != false || !name)
          key = langmap.keymap[key];
      } else if (key.charCodeAt(0) > 128) {
        if (!usedKeys[key]) {
          var code = e.code?.slice(-1) || "";
          if (!e.shiftKey) code = code.toLowerCase();
          if (code) {
            key = code;
            // also restore A- for mac
            if (!name && e.altKey) name = 'A-';
          }
        }
      }
    }

    name += key;
    if (name.length > 1) { name = '<' + name + '>'; }
    return name;
  }
  // langmap support
  function updateLangmap(langmapString, remapCtrl) {
    if (langmap.string !== langmapString) {
      langmap = parseLangmap(langmapString);
    }
    langmap.remapCtrl = remapCtrl;
  }
  /** 
   *  From :help langmap
   *  The 'langmap' option is a list of parts, separated with commas.  Each
   *      part can be in one of two forms:
   *      1.  A list of pairs.  Each pair is a "from" character immediately
   *          followed by the "to" character.  Examples: "aA", "aAbBcC".
   *      2.  A list of "from" characters, a semi-colon and a list of "to"
   *          characters.  Example: "abc;ABC"
   * @arg {string} langmapString
   * @returns {{string: string, keymap: Record<string, string>, remapCtrl?: boolean}}
   */
  function parseLangmap(langmapString) {
    let keymap = ({})/**@type {Record<string, string>}*/;
    if (!langmapString) return { keymap: keymap, string: '' };

    /** @arg {string} list */
    function getEscaped(list) {
      return list.split(/\\?(.)/).filter(Boolean);
    }
    langmapString.split(/((?:[^\\,]|\\.)+),/).map(part => {
      if (!part) return;
      const semicolon = part.split(/((?:[^\\;]|\\.)+);/);
      if (semicolon.length == 3) {
        const from = getEscaped(semicolon[1]);
        const to = getEscaped(semicolon[2]);
        if (from.length !== to.length) return; // skip over malformed part
        for (let i = 0; i < from.length; ++i) keymap[from[i]] = to[i];
      } else if (semicolon.length == 1) {
        const pairs = getEscaped(part);
        if (pairs.length % 2 !== 0) return; // skip over malformed part
        for (let i = 0; i < pairs.length; i += 2) keymap[pairs[i]] = pairs[i + 1];
      }
    });

    return { keymap: keymap, string: langmapString };
  }

  defineOption('langmap', undefined, 'string', ['lmap'], function(name, cm) {
    // The 'filetype' option proxies to the CodeMirror 'mode' option.
    if (name === undefined) {
      return langmap.string;
    } else {
      updateLangmap(name);
    }
  });

  // Represents the current input state.
  /**@implements {InputStateInterface} */
  class InputState {
    constructor() {
      /**@type{InputStateInterface["prefixRepeat"]} */
      this.prefixRepeat = [];
      /**@type{InputStateInterface["motionRepeat"]} */
      this.motionRepeat = [];
      /**@type{InputStateInterface["operator"]} */
      this.operator = null;
      /**@type{InputStateInterface["operatorArgs"]} */
      this.operatorArgs = null;
      /**@type{InputStateInterface["motion"]} */
      this.motion = null;
      /**@type{InputStateInterface["motionArgs"]} */
      this.motionArgs = null;
      /**@type{InputStateInterface["keyBuffer"]} */
      this.keyBuffer = []; // For matching multi-key commands.
      /**@type{InputStateInterface["registerName"]} */
      this.registerName = undefined; // Defaults to the unnamed register.
      /**@type{InputStateInterface["changeQueue"]} */
      this.changeQueue = null; // For restoring text used by insert mode keybindings
    }
    /** @param {string} n */
    pushRepeatDigit(n) {
      if (!this.operator) {
        this.prefixRepeat = this.prefixRepeat.concat(n);
      } else {
        this.motionRepeat = this.motionRepeat.concat(n);
      }
    }
    getRepeat() {
      var repeat = 0;
      if (this.prefixRepeat.length > 0 || this.motionRepeat.length > 0) {
        repeat = 1;
        if (this.prefixRepeat.length > 0) {
          repeat *= parseInt(this.prefixRepeat.join(''), 10);
        }
        if (this.motionRepeat.length > 0) {
          repeat *= parseInt(this.motionRepeat.join(''), 10);
        }
      }
      return repeat;
    }
  }

  /** @arg {CodeMirrorV} cm  @arg {string} [reason] */
  function clearInputState(cm, reason) {
    cm.state.vim.inputState = new InputState();
    cm.state.vim.expectLiteralNext = false;
    CM.signal(cm, 'vim-command-done', reason);
  }

  function ChangeQueue() {
    this.removed = [];
    this.inserted = "";
  }

  /**
   * Register stores information about copy and paste registers.  Besides
   * text, a register must store whether it is linewise (i.e., when it is
   * pasted, should it insert itself into a new line, or should the text be
   * inserted at the cursor position.)
   */
  class Register {
    /** @arg {string} [text] @arg {boolean} [linewise] @arg {boolean } [blockwise] */
    constructor(text, linewise, blockwise) {
      this.clear();
      this.keyBuffer = [text || ''];
      /** @type {InsertModeChanges[]} */
      this.insertModeChanges = [];
      /** @type {string[]}*/
      this.searchQueries = [];
      this.linewise = !!linewise;
      this.blockwise = !!blockwise;
    }
    /** @arg {string} [text] @arg {boolean} [linewise] @arg {boolean } [blockwise] */
    setText(text, linewise, blockwise) {
      this.keyBuffer = [text || ''];
      this.linewise = !!linewise;
      this.blockwise = !!blockwise;
    }
    /** @arg {string} text @arg {boolean} [linewise] */
    pushText(text, linewise) {
      // if this register has ever been set to linewise, use linewise.
      if (linewise) {
        if (!this.linewise) {
          this.keyBuffer.push('\n');
        }
        this.linewise = true;
      }
      this.keyBuffer.push(text);
    }
    /** @arg {InsertModeChanges} changes */
    pushInsertModeChanges(changes) {
      this.insertModeChanges.push(createInsertModeChanges(changes));
    }
    /** @arg {string} query */
    pushSearchQuery(query) {
      this.searchQueries.push(query);
    }
    clear() {
      this.keyBuffer = [];
      this.insertModeChanges = [];
      this.searchQueries = [];
      this.linewise = false;
    }
    toString() {
      return this.keyBuffer.join('');
    }
  }

  /**
   * Defines an external register.
   *
   * The name should be a single character that will be used to reference the register.
   * The register should support setText, pushText, clear, and toString(). See Register
   * for a reference implementation.
   * @arg {string} name
   * @arg {Register} register
   */
  function defineRegister(name, register) {
    var registers = vimGlobalState.registerController.registers;
    if (!name || name.length != 1) {
      throw Error('Register name must be 1 character');
    }
    if (registers[name]) {
      throw Error('Register already defined ' + name);
    }
    registers[name] = register;
    validRegisters.push(name);
  }

  /**
   * vim registers allow you to keep many independent copy and paste buffers.
   * See http://usevim.com/2012/04/13/registers/ for an introduction.
   *
   * RegisterController keeps the state of all the registers.  An initial
   * state may be passed in.  The unnamed register '"' will always be
   * overridden.
   */
  class RegisterController {
    /** @arg {Object<string, Register>} registers */
    constructor(registers) {
      this.registers = registers;
      this.unnamedRegister = registers['"'] = new Register();
      registers['.'] = new Register();
      registers[':'] = new Register();
      registers['/'] = new Register();
      registers['+'] = new Register();
    }
    /**
     * @param {string | null | undefined} registerName
     * @param {string} operator
     * @param {string} text
     * @param {boolean} [linewise]
     * @param {boolean} [blockwise]
     */
    pushText(registerName, operator, text, linewise, blockwise) {
      // The black hole register, "_, means delete/yank to nowhere.
      if (registerName === '_') return;
      if (linewise && text.charAt(text.length - 1) !== '\n') {
        text += '\n';
      }
      // Lowercase and uppercase registers refer to the same register.
      // Uppercase just means append.
      var register = this.isValidRegister(registerName) ?
          this.getRegister(registerName) : null;
      // if no register/an invalid register was specified, things go to the
      // default registers
      if (!register || !registerName) {
        switch (operator) {
          case 'yank':
            // The 0 register contains the text from the most recent yank.
            this.registers['0'] = new Register(text, linewise, blockwise);
            break;
          case 'delete':
          case 'change':
            if (text.indexOf('\n') == -1) {
              // Delete less than 1 line. Update the small delete register.
              this.registers['-'] = new Register(text, linewise);
            } else {
              // Shift down the contents of the numbered registers and put the
              // deleted text into register 1.
              this.shiftNumericRegisters_();
              this.registers['1'] = new Register(text, linewise);
            }
            break;
        }
        // Make sure the unnamed register is set to what just happened
        this.unnamedRegister.setText(text, linewise, blockwise);
        return;
      }

      // If we've gotten to this point, we've actually specified a register
      var append = isUpperCase(registerName);
      if (append) {
        register.pushText(text, linewise);
      } else {
        register.setText(text, linewise, blockwise);
      }
      if (registerName === '+') {
        navigator.clipboard.writeText(text);
      }
      // The unnamed register always has the same value as the last used
      // register.
      this.unnamedRegister.setText(register.toString(), linewise);
    }
    /**
     * Gets the register named @name.  If one of @name doesn't already exist,
     * create it.  If @name is invalid, return the unnamedRegister.
     * @arg {string} [name]
     */
    getRegister(name) {
      if (!this.isValidRegister(name)) {
        return this.unnamedRegister;
      }
      name = name.toLowerCase();
      if (!this.registers[name]) {
        this.registers[name] = new Register();
      }
      return this.registers[name];
    }
    /**@type {{(name: any): name is string}} */
    isValidRegister(name) {
      return name && (inArray(name, validRegisters) || latinCharRegex.test(name));
    }
    shiftNumericRegisters_() {
      for (var i = 9; i >= 2; i--) {
        this.registers[i] = this.getRegister('' + (i - 1));
      }
    }
  }
  class HistoryController {
    constructor() {
      /**@type {string[]} */
      this.historyBuffer = [];
      this.iterator = 0;
      this.initialPrefix = null;
    }
    /**
     * the input argument here acts a user entered prefix for a small time
     * until we start autocompletion in which case it is the autocompleted.
     * @arg {string} input
     * @arg {boolean} up
     */
    nextMatch(input, up) {
      var historyBuffer = this.historyBuffer;
      var dir = up ? -1 : 1;
      if (this.initialPrefix === null) this.initialPrefix = input;
      for (var i = this.iterator + dir; up ? i >= 0 : i < historyBuffer.length; i += dir) {
        var element = historyBuffer[i];
        for (var j = 0; j <= element.length; j++) {
          if (this.initialPrefix == element.substring(0, j)) {
            this.iterator = i;
            return element;
          }
        }
      }
      // should return the user input in case we reach the end of buffer.
      if (i >= historyBuffer.length) {
        this.iterator = historyBuffer.length;
        return this.initialPrefix;
      }
      // return the last autocompleted query or exCommand as it is.
      if (i < 0) return input;
    }
    /** @arg {string} input */
    pushInput(input) {
      var index = this.historyBuffer.indexOf(input);
      if (index > -1) this.historyBuffer.splice(index, 1);
      if (input.length) this.historyBuffer.push(input);
    }
    reset() {
      this.initialPrefix = null;
      this.iterator = this.historyBuffer.length;
    }
  }
  var commandDispatcher = {
    /**
     * @param {string} keys
     * @param {vimKey[]} keyMap
     * @param {InputStateInterface} inputState
     * @param {string} context
     */
    matchCommand: function(keys, keyMap, inputState, context) {
      var matches = commandMatches(keys, keyMap, context, inputState);
      var bestMatch = matches.full[0];
      if (!bestMatch) {
        if (matches.partial.length) {
          return {
            type: 'partial',
            expectLiteralNext: matches.partial.length == 1 && matches.partial[0].keys.slice(-11) == '<character>' // langmap literal logic
          };
        }
        return {type: 'none'};
      }
      if (bestMatch.keys.slice(-11) == '<character>' || bestMatch.keys.slice(-10) == '<register>') {
        var character = lastChar(keys);
        if (!character || character.length > 1) return {type: 'clear'};
        inputState.selectedCharacter = character;
      }
      return {type: 'full', command: bestMatch};
    },
    /**
     * @arg {CodeMirrorV} cm
     * @arg {vimState} vim
     * @arg {vimKey} command
     */
    processCommand: function(cm, vim, command) {
      vim.inputState.repeatOverride = command.repeatOverride;
      switch (command.type) {
        case 'motion':
          this.processMotion(cm, vim, command);
          break;
        case 'operator':
          this.processOperator(cm, vim, command);
          break;
        case 'operatorMotion':
          this.processOperatorMotion(cm, vim, command);
          break;
        case 'action':
          this.processAction(cm, vim, command);
          break;
        case 'search':
          this.processSearch(cm, vim, command);
          break;
        case 'ex':
        case 'keyToEx':
          this.processEx(cm, vim, command);
          break;
      }
    },
    /**
     * @arg {CodeMirrorV} cm
     * @arg {vimState} vim
     * @arg {import("./types").motionCommand|import("./types").operatorMotionCommand} command
     */
    processMotion: function(cm, vim, command) {
      vim.inputState.motion = command.motion;
      vim.inputState.motionArgs = /**@type {MotionArgs}*/(copyArgs(command.motionArgs));
      this.evalInput(cm, vim);
    },
    /**
     * @arg {CodeMirrorV} cm
     * @arg {vimState} vim
     * @arg {import("./types").operatorCommand|import("./types").operatorMotionCommand} command
     */
    processOperator: function(cm, vim, command) {
      var inputState = vim.inputState;
      if (inputState.operator) {
        if (inputState.operator == command.operator) {
          // Typing an operator twice like 'dd' makes the operator operate
          // linewise
          inputState.motion = 'expandToLine';
          inputState.motionArgs = { linewise: true, repeat: 1 };
          this.evalInput(cm, vim);
          return;
        } else {
          // 2 different operators in a row doesn't make sense.
          clearInputState(cm);
        }
      }
      inputState.operator = command.operator;
      inputState.operatorArgs = copyArgs(command.operatorArgs);
      if (command.keys.length > 1) {
        inputState.operatorShortcut = command.keys;
      }
      if (command.exitVisualBlock) {
          vim.visualBlock = false;
          updateCmSelection(cm);
      }
      if (vim.visualMode) {
        // Operating on a selection in visual mode. We don't need a motion.
        this.evalInput(cm, vim);
      }
    },
    /**
     * @arg {CodeMirrorV} cm
     * @arg {vimState} vim
     * @arg {import("./types").operatorMotionCommand} command
     */
    processOperatorMotion: function(cm, vim, command) {
      var visualMode = vim.visualMode;
      var operatorMotionArgs = copyArgs(command.operatorMotionArgs);
      if (operatorMotionArgs) {
        // Operator motions may have special behavior in visual mode.
        if (visualMode && operatorMotionArgs.visualLine) {
          vim.visualLine = true;
        }
      }
      this.processOperator(cm, vim, command);
      if (!visualMode) {
        this.processMotion(cm, vim, command);
      }
    },
    /**
     * @arg {CodeMirrorV} cm
     * @arg {vimState} vim
     * @arg {import("./types").actionCommand} command
     */
    processAction: function(cm, vim, command) {
      var inputState = vim.inputState;
      var repeat = inputState.getRepeat();
      var repeatIsExplicit = !!repeat;
      var actionArgs = /**@type {ActionArgs}*/(copyArgs(command.actionArgs) || {repeat: 1});
      if (inputState.selectedCharacter) {
        actionArgs.selectedCharacter = inputState.selectedCharacter;
      }
      // Actions may or may not have motions and operators. Do these first.
      if (command.operator) {
        // @ts-ignore
        this.processOperator(cm, vim, command);
      }
      if (command.motion) {
        // @ts-ignore
        this.processMotion(cm, vim, command);
      }
      if (command.motion || command.operator) {
        this.evalInput(cm, vim);
      }
      actionArgs.repeat = repeat || 1;
      actionArgs.repeatIsExplicit = repeatIsExplicit;
      actionArgs.registerName = inputState.registerName;
      clearInputState(cm);
      vim.lastMotion = null;
      if (command.isEdit) {
        this.recordLastEdit(vim, inputState, command);
      }
      actions[command.action](cm, actionArgs, vim);
    },
    /** @arg {CodeMirrorV} cm @arg {vimState} vim @arg {import("./types").searchCommand} command*/
    processSearch: function(cm, vim, command) {
      if (!cm.getSearchCursor) {
        // Search depends on SearchCursor.
        return;
      }
      var forward = command.searchArgs.forward;
      var wholeWordOnly = command.searchArgs.wholeWordOnly;
      getSearchState(cm).setReversed(!forward);
      var promptPrefix = (forward) ? '/' : '?';
      var originalQuery = getSearchState(cm).getQuery();
      var originalScrollPos = cm.getScrollInfo();
      var lastQuery = "";
      /** @arg {string} query  @arg {boolean} ignoreCase  @arg {boolean} smartCase */
      function handleQuery(query, ignoreCase, smartCase) {
        vimGlobalState.searchHistoryController.pushInput(query);
        vimGlobalState.searchHistoryController.reset();
        try {
          updateSearchQuery(cm, query, ignoreCase, smartCase);
        } catch (e) {
          showConfirm(cm, 'Invalid regex: ' + query);
          clearInputState(cm);
          return;
        }
        commandDispatcher.processMotion(cm, vim, {
          keys: '',
          type: 'motion',
          motion: 'findNext',
          motionArgs: { forward: true, toJumplist: command.searchArgs.toJumplist }
        });
      }
      /** @arg {string} query */
      function onPromptClose(query) {
        cm.scrollTo(originalScrollPos.left, originalScrollPos.top);
        handleQuery(query, true /** ignoreCase */, true /** smartCase */);
        var macroModeState = vimGlobalState.macroModeState;
        if (macroModeState.isRecording) {
          logSearchQuery(macroModeState, query);
        }
      }
      function pcreLabel() {
        return getOption('pcre') ? '(JavaScript regexp: set pcre)' : '(Vim regexp: set nopcre)'
      }
      /** 
       * @arg {KeyboardEvent&{target:HTMLInputElement}} e 
       * @arg {any} query 
       * @arg {(arg0: any) => void} close 
       */
      function onPromptKeyUp(e, query, close) {
        var keyName = vimKeyFromEvent(e), up, offset;
        if (keyName == '<Up>' || keyName == '<Down>') {
          up = keyName == '<Up>' ? true : false;
          offset = e.target ? e.target.selectionEnd : 0;
          query = vimGlobalState.searchHistoryController.nextMatch(query, up) || '';
          close(query);
          if (offset && e.target) e.target.selectionEnd = e.target.selectionStart = Math.min(offset, e.target.value.length);
        } else if (keyName && keyName != '<Left>' && keyName != '<Right>') {
          vimGlobalState.searchHistoryController.reset();
        }
        lastQuery = query;
        onChange();
      }
      function onChange() {
        var parsedQuery;
        try {
          parsedQuery = updateSearchQuery(cm, lastQuery,
              true /** ignoreCase */, true /** smartCase */);
        } catch (e) {
          // Swallow bad regexes for incremental search.
        }
        if (parsedQuery) {
          cm.scrollIntoView(findNext(cm, !forward, parsedQuery), 30);
        } else {
          clearSearchHighlight(cm);
          cm.scrollTo(originalScrollPos.left, originalScrollPos.top);
        }
      }
      /** @arg {KeyboardEvent} e  @arg {string} query  @arg {(arg0?: string) => void} close */
      function onPromptKeyDown(e, query, close) {
        var keyName = vimKeyFromEvent(e);
        if (keyName == '<Esc>' || keyName == '<C-c>' || keyName == '<C-[>' ||
            (keyName == '<BS>' && query == '')) {
          vimGlobalState.searchHistoryController.pushInput(query);
          vimGlobalState.searchHistoryController.reset();
          updateSearchQuery(cm, originalQuery?.source || "");
          clearSearchHighlight(cm);
          cm.scrollTo(originalScrollPos.left, originalScrollPos.top);
          CM.e_stop(e);
          clearInputState(cm);
          close();
          cm.focus();
        } else if (keyName == '<Up>' || keyName == '<Down>') {
          CM.e_stop(e);
        } else if (keyName == '<C-u>') {
          // Ctrl-U clears input.
          CM.e_stop(e);
          close('');
        }
      }
      switch (command.searchArgs.querySrc) {
        case 'prompt':
          var macroModeState = vimGlobalState.macroModeState;
          if (macroModeState.isPlaying) {
            let query = macroModeState.replaySearchQueries.shift();
            handleQuery(query || '', true /** ignoreCase */, false /** smartCase */);
          } else {
            showPrompt(cm, {
                onClose: onPromptClose,
                prefix: promptPrefix,
                desc: dom(
                  'span',
                  {
                    $cursor: 'pointer', 
                    onmousedown: function(/** @type {MouseEvent} */ e) {
                      e.preventDefault();
                      setOption('pcre', !getOption('pcre'));
                      this.textContent = pcreLabel();
                      onChange();
                    }
                  },
                  pcreLabel()
                ),  
                onKeyUp: onPromptKeyUp,
                onKeyDown: onPromptKeyDown
            });
          }
          break;
        case 'wordUnderCursor':
          var word = expandWordUnderCursor(cm, {noSymbol: true});
          var isKeyword = true;
          if (!word) {
            word = expandWordUnderCursor(cm, {noSymbol: false});
            isKeyword = false;
          }
          if (!word) {
            showConfirm(cm, 'No word under cursor');
            clearInputState(cm);
            return;
          }
          let query = cm.getLine(word.start.line).substring(word.start.ch,
              word.end.ch);
          if (isKeyword && wholeWordOnly) {
              query = '\\b' + query + '\\b';
          } else {
            query = escapeRegex(query);
          }

          // cachedCursor is used to save the old position of the cursor
          // when * or # causes vim to seek for the nearest word and shift
          // the cursor before entering the motion.
          vimGlobalState.jumpList.cachedCursor = cm.getCursor();
          cm.setCursor(word.start);

          handleQuery(query, true /** ignoreCase */, false /** smartCase */);
          break;
      }
    },
    /**
     * @arg {CodeMirrorV} cm
     * @arg {vimState} vim
     * @arg {import("./types").exCommand | import("./types").keyToExCommand} command
     */
    processEx: function(cm, vim, command) {
      /**@arg {string} input*/
      function onPromptClose(input) {
        // Give the prompt some time to close so that if processCommand shows
        // an error, the elements don't overlap.
        vimGlobalState.exCommandHistoryController.pushInput(input);
        vimGlobalState.exCommandHistoryController.reset();
        exCommandDispatcher.processCommand(cm, input);
        if (cm.state.vim) clearInputState(cm);
        clearSearchHighlight(cm);
      }
      /**
       * @arg {KeyboardEvent&{target:HTMLInputElement}} e
       * @arg {string} input
       * @arg {(arg0?: string) => void} close
       */
      function onPromptKeyDown(e, input, close) {
        var keyName = vimKeyFromEvent(e), up, offset;
        if (keyName == '<Esc>' || keyName == '<C-c>' || keyName == '<C-[>' ||
            (keyName == '<BS>' && input == '')) {
          vimGlobalState.exCommandHistoryController.pushInput(input);
          vimGlobalState.exCommandHistoryController.reset();
          CM.e_stop(e);
          clearInputState(cm);
          clearSearchHighlight(cm);
          close();
          cm.focus();
        }
        if (keyName == '<Up>' || keyName == '<Down>') {
          CM.e_stop(e);
          up = keyName == '<Up>' ? true : false;
          offset = e.target ? e.target.selectionEnd : 0;
          input = vimGlobalState.exCommandHistoryController.nextMatch(input, up) || '';
          close(input);
          if (offset && e.target) e.target.selectionEnd = e.target.selectionStart = Math.min(offset, e.target.value.length);
        } else if (keyName == '<C-u>') {
          // Ctrl-U clears input.
          CM.e_stop(e);
          close('');
        } else if (keyName && keyName != '<Left>' && keyName != '<Right>') {
            vimGlobalState.exCommandHistoryController.reset();
        }
      }
      /**
       * @arg {KeyboardEvent&{target:HTMLInputElement}} e
       * @arg {any} query
       */
      function onPromptKeyUp(e, query) {
        var inputStream = new CM.StringStream(query);
        var params = /**@type{import("./types").exCommandArgs}*/({});
        try {
          exCommandDispatcher.parseInput_(cm, inputStream, params);
          if (params.commandName != "s") {
            clearSearchHighlight(cm);
            return;
          }
          var command = exCommandDispatcher.matchCommand_(params.commandName);
          if (!command) return;
          exCommandDispatcher.parseCommandArgs_(inputStream, params, command);
          if (!params.argString) return;
          var regex = parseQuery(params.argString.slice(1), true, true);
          if (regex) highlightSearchMatches(cm, regex);
        } catch(e) {
        }
      }
      if (command.type == 'keyToEx') {
        // Handle user defined Ex to Ex mappings
        exCommandDispatcher.processCommand(cm, command.exArgs.input);
      } else {
        /**@type{import("./types").PromptOptions} */
        var promptOptions = {
          onClose: onPromptClose,
          onKeyDown: onPromptKeyDown,
          onKeyUp: onPromptKeyUp,
          prefix: ':',
        };
        if (vim.visualMode) {
          promptOptions.value = '\'<,\'>';
          promptOptions.selectValueOnOpen = false;
        }
        showPrompt(cm, promptOptions);
      }
    },
    /**@arg {CodeMirrorV} cm   @arg {vimState} vim */
    evalInput: function(cm, vim) {
      // If the motion command is set, execute both the operator and motion.
      // Otherwise return.
      var inputState = vim.inputState;
      var motion = inputState.motion;
      /** @type {MotionArgs}*/
      var motionArgs = inputState.motionArgs || { repeat: 1};
      var operator = inputState.operator;
      /** @type {OperatorArgs}*/
      var operatorArgs = inputState.operatorArgs || {};
      var registerName = inputState.registerName;
      var sel = vim.sel;
      // TODO: Make sure cm and vim selections are identical outside visual mode.
      var origHead = copyCursor(vim.visualMode ? clipCursorToContent(cm, sel.head): cm.getCursor('head'));
      var origAnchor = copyCursor(vim.visualMode ? clipCursorToContent(cm, sel.anchor) : cm.getCursor('anchor'));
      var oldHead = copyCursor(origHead);
      var oldAnchor = copyCursor(origAnchor);
      var newHead, newAnchor;
      var repeat;
      if (operator) {
        this.recordLastEdit(vim, inputState);
      }
      if (inputState.repeatOverride !== undefined) {
        // If repeatOverride is specified, that takes precedence over the
        // input state's repeat. Used by Ex mode and can be user defined.
        repeat = inputState.repeatOverride;
      } else {
        repeat = inputState.getRepeat();
      }
      if (repeat > 0 && motionArgs.explicitRepeat) {
        motionArgs.repeatIsExplicit = true;
      } else if (motionArgs.noRepeat ||
          (!motionArgs.explicitRepeat && repeat === 0)) {
        repeat = 1;
        motionArgs.repeatIsExplicit = false;
      }
      if (inputState.selectedCharacter) {
        // If there is a character input, stick it in all of the arg arrays.
        motionArgs.selectedCharacter = operatorArgs.selectedCharacter =
            inputState.selectedCharacter;
      }
      motionArgs.repeat = repeat;
      clearInputState(cm);
      if (motion) {
        var motionResult = motions[motion](cm, origHead, motionArgs, vim, inputState);
        vim.lastMotion = motions[motion];
        if (!motionResult) {
          return;
        }
        if (motionArgs.toJumplist) {
          var jumpList = vimGlobalState.jumpList;
          // if the current motion is # or *, use cachedCursor
          var cachedCursor = jumpList.cachedCursor;
          if (cachedCursor) {
            // @ts-ignore
            recordJumpPosition(cm, cachedCursor, motionResult);
            delete jumpList.cachedCursor;
          } else {
            // @ts-ignore
            recordJumpPosition(cm, origHead, motionResult);
          }
        }
        if (motionResult instanceof Array) {
          newAnchor = motionResult[0];
          newHead = motionResult[1];
        } else {
          newHead = motionResult;
        }
        // TODO: Handle null returns from motion commands better.
        if (!newHead) {
          newHead = copyCursor(origHead);
        }
        if (vim.visualMode) {
          if (!(vim.visualBlock && newHead.ch === Infinity)) {
            newHead = clipCursorToContent(cm, newHead, oldHead);
          }
          if (newAnchor) {
            newAnchor = clipCursorToContent(cm, newAnchor);
          }
          newAnchor = newAnchor || oldAnchor;
          sel.anchor = newAnchor;
          sel.head = newHead;
          updateCmSelection(cm);
          updateMark(cm, vim, '<',
              cursorIsBefore(newAnchor, newHead) ? newAnchor
                  : newHead);
          updateMark(cm, vim, '>',
              cursorIsBefore(newAnchor, newHead) ? newHead
                  : newAnchor);
        } else if (!operator) {
          newHead = clipCursorToContent(cm, newHead, oldHead);
          cm.setCursor(newHead.line, newHead.ch);
        }
      }
      if (operator) {
        if (operatorArgs.lastSel) {
          // Replaying a visual mode operation
          newAnchor = oldAnchor;
          var lastSel = operatorArgs.lastSel;
          var lineOffset = Math.abs(lastSel.head.line - lastSel.anchor.line);
          var chOffset = Math.abs(lastSel.head.ch - lastSel.anchor.ch);
          if (lastSel.visualLine) {
            // Linewise Visual mode: The same number of lines.
            newHead = new Pos(oldAnchor.line + lineOffset, oldAnchor.ch);
          } else if (lastSel.visualBlock) {
            // Blockwise Visual mode: The same number of lines and columns.
            newHead = new Pos(oldAnchor.line + lineOffset, oldAnchor.ch + chOffset);
          } else if (lastSel.head.line == lastSel.anchor.line) {
            // Normal Visual mode within one line: The same number of characters.
            newHead = new Pos(oldAnchor.line, oldAnchor.ch + chOffset);
          } else {
            // Normal Visual mode with several lines: The same number of lines, in the
            // last line the same number of characters as in the last line the last time.
            newHead = new Pos(oldAnchor.line + lineOffset, oldAnchor.ch);
          }
          vim.visualMode = true;
          vim.visualLine = lastSel.visualLine;
          vim.visualBlock = lastSel.visualBlock;
          sel = vim.sel = {
            anchor: newAnchor,
            head: newHead
          };
          updateCmSelection(cm);
        } else if (vim.visualMode) {
          operatorArgs.lastSel = {
            anchor: copyCursor(sel.anchor),
            head: copyCursor(sel.head),
            visualBlock: vim.visualBlock,
            visualLine: vim.visualLine
          };
        }
        var curStart, curEnd, linewise;
        /** @type {'block'|'line'|'char'}*/ var mode;
        var cmSel;
        if (vim.visualMode) {
          // Init visual op
          curStart = cursorMin(sel.head, sel.anchor);
          curEnd = cursorMax(sel.head, sel.anchor);
          linewise = vim.visualLine || operatorArgs.linewise;
          mode = vim.visualBlock ? 'block' :
                  linewise ? 'line' :
                  'char';
          var newPositions = updateSelectionForSurrogateCharacters(cm, curStart, curEnd);
          cmSel = makeCmSelection(cm, {
            anchor: newPositions.start,
            head: newPositions.end
          }, mode);
          if (linewise) {
            var ranges = cmSel.ranges;
            if (mode == 'block') {
              // Linewise operators in visual block mode extend to end of line
              for (var i = 0; i < ranges.length; i++) {
                ranges[i].head.ch = lineLength(cm, ranges[i].head.line);
              }
            } else if (mode == 'line') {
              ranges[0].head = new Pos(ranges[0].head.line + 1, 0);
            }
          }
        } else {
          // Init motion op
          curStart = copyCursor(newAnchor || oldAnchor);
          curEnd = copyCursor(newHead || oldHead);
          if (cursorIsBefore(curEnd, curStart)) {
            var tmp = curStart;
            curStart = curEnd;
            curEnd = tmp;
          }
          linewise = motionArgs.linewise || operatorArgs.linewise;
          if (linewise) {
            // Expand selection to entire line.
            expandSelectionToLine(cm, curStart, curEnd);
          } else if (motionArgs.forward) {
            // Clip to trailing newlines only if the motion goes forward.
            clipToLine(cm, curStart, curEnd);
          }
          mode = 'char';
          var exclusive = !motionArgs.inclusive || linewise;
          var newPositions = updateSelectionForSurrogateCharacters(cm, curStart, curEnd);
          cmSel = makeCmSelection(cm, {
            anchor: newPositions.start,
            head: newPositions.end
          }, mode, exclusive);
        }
        cm.setSelections(cmSel.ranges, cmSel.primary);
        vim.lastMotion = null;
        operatorArgs.repeat = repeat; // For indent in visual mode.
        operatorArgs.registerName = registerName;
        // Keep track of linewise as it affects how paste and change behave.
        operatorArgs.linewise = linewise;
        var operatorMoveTo = operators[operator](
          cm, operatorArgs, cmSel.ranges, oldAnchor, newHead);
        if (vim.visualMode) {
          exitVisualMode(cm, operatorMoveTo != null);
        }
        if (operatorMoveTo) {
          cm.setCursor(operatorMoveTo);
        }
      }
    },
    /**@arg {vimState} vim  @arg {InputStateInterface} inputState, @arg {import("./types").actionCommand} [actionCommand] */
    recordLastEdit: function(vim, inputState, actionCommand) {
      var macroModeState = vimGlobalState.macroModeState;
      if (macroModeState.isPlaying) { return; }
      vim.lastEditInputState = inputState;
      vim.lastEditActionCommand = actionCommand;
      macroModeState.lastInsertModeChanges.changes = [];
      macroModeState.lastInsertModeChanges.expectCursorActivityForChange = false;
      macroModeState.lastInsertModeChanges.visualBlock = vim.visualBlock ? vim.sel.head.line - vim.sel.anchor.line : 0;
    }
  };

  /**
   * All of the functions below return Cursor objects.
   * @type {import("./types").vimMotions}}
   */
  var motions = {
    moveToTopLine: function(cm, _head, motionArgs) {
      var line = getUserVisibleLines(cm).top + motionArgs.repeat -1;
      return new Pos(line, findFirstNonWhiteSpaceCharacter(cm.getLine(line)));
    },
    moveToMiddleLine: function(cm) {
      var range = getUserVisibleLines(cm);
      var line = Math.floor((range.top + range.bottom) * 0.5);
      return new Pos(line, findFirstNonWhiteSpaceCharacter(cm.getLine(line)));
    },
    moveToBottomLine: function(cm, _head, motionArgs) {
      var line = getUserVisibleLines(cm).bottom - motionArgs.repeat +1;
      return new Pos(line, findFirstNonWhiteSpaceCharacter(cm.getLine(line)));
    },
    expandToLine: function(_cm, head, motionArgs) {
      // Expands forward to end of line, and then to next line if repeat is
      // >1. Does not handle backward motion!
      var cur = head;
      return new Pos(cur.line + motionArgs.repeat - 1, Infinity);
    },
    findNext: function(cm, _head, motionArgs) {
      var state = getSearchState(cm);
      var query = state.getQuery();
      if (!query) {
        return;
      }
      var prev = !motionArgs.forward;
      // If search is initiated with ? instead of /, negate direction.
      prev = (state.isReversed()) ? !prev : prev;
      highlightSearchMatches(cm, query);
      var result = findNext(cm, prev/** prev */, query, motionArgs.repeat);
      if (!result) {
        showConfirm(cm, 'No match found ' + query +
          (getOption('pcre') ? ' (set nopcre to use Vim regexps)' : ''));
      }
      return result; 
    },
    /**
     * Find and select the next occurrence of the search query. If the cursor is currently
     * within a match, then find and select the current match. Otherwise, find the next occurrence in the
     * appropriate direction.
     *
     * This differs from `findNext` in the following ways:
     *
     * 1. Instead of only returning the "from", this returns a "from", "to" range.
     * 2. If the cursor is currently inside a search match, this selects the current match
     *    instead of the next match.
     * 3. If there is no associated operator, this will turn on visual mode.
     */
    findAndSelectNextInclusive: function(cm, _head, motionArgs, vim, prevInputState) {
      var state = getSearchState(cm);
      var query = state.getQuery();

      if (!query) {
        return;
      }

      var prev = !motionArgs.forward;
      prev = (state.isReversed()) ? !prev : prev;

      // next: [from, to] | null
      var next = findNextFromAndToInclusive(cm, prev, query, motionArgs.repeat, vim);

      // No matches.
      if (!next) {
        return;
      }

      // If there's an operator that will be executed, return the selection.
      if (prevInputState.operator) {
        return next;
      }

      // At this point, we know that there is no accompanying operator -- let's
      // deal with visual mode in order to select an appropriate match.

      var from = next[0];
      // For whatever reason, when we use the "to" as returned by searchcursor.js directly,
      // the resulting selection is extended by 1 char. Let's shrink it so that only the
      // match is selected.
      var to = new Pos(next[1].line, next[1].ch - 1);

      if (vim.visualMode) {
        // If we were in visualLine or visualBlock mode, get out of it.
        if (vim.visualLine || vim.visualBlock) {
          vim.visualLine = false;
          vim.visualBlock = false;
          CM.signal(cm, "vim-mode-change", {mode: "visual", subMode: ""});
        }

        // If we're currently in visual mode, we should extend the selection to include
        // the search result.
        var anchor = vim.sel.anchor;
        if (anchor) {
          if (state.isReversed()) {
            if (motionArgs.forward) {
              return [anchor, from];
            }

            return [anchor, to];
          } else {
            if (motionArgs.forward) {
              return [anchor, to];
            }

            return [anchor, from];
          }
        }
      } else {
        // Let's turn visual mode on.
        vim.visualMode = true;
        vim.visualLine = false;
        vim.visualBlock = false;
        CM.signal(cm, "vim-mode-change", {mode: "visual", subMode: ""});
      }

      return prev ? [to, from] : [from, to];
    },
    goToMark: function(cm, _head, motionArgs, vim) {
      var pos = getMarkPos(cm, vim, motionArgs.selectedCharacter || "");
      if (pos) {
        return motionArgs.linewise ? { line: pos.line, ch: findFirstNonWhiteSpaceCharacter(cm.getLine(pos.line)) } : pos;
      }
      return null;
    },
    moveToOtherHighlightedEnd: function(cm, _head, motionArgs, vim) {
      var sel = vim.sel;
      if (vim.visualBlock && motionArgs.sameLine) {
        return [
          clipCursorToContent(cm, new Pos(sel.anchor.line, sel.head.ch)),
          clipCursorToContent(cm, new Pos(sel.head.line, sel.anchor.ch))
        ];
      } else {
        return ([sel.head, sel.anchor]);
      }
    },
    jumpToMark: function(cm, head, motionArgs, vim) {
      var best = head;
      for (var i = 0; i < motionArgs.repeat; i++) {
        var cursor = best;
        for (var key in vim.marks) {
          if (!isLowerCase(key)) {
            continue;
          }
          var mark = vim.marks[key].find();
          var isWrongDirection = (motionArgs.forward) ?
            // @ts-ignore
            cursorIsBefore(mark, cursor) : cursorIsBefore(cursor, mark);

          if (isWrongDirection) {
            continue;
          }
          // @ts-ignore
          if (motionArgs.linewise && (mark.line == cursor.line)) {
            continue;
          }

          var equal = cursorEqual(cursor, best);
          var between = (motionArgs.forward) ?
            // @ts-ignore
            cursorIsBetween(cursor, mark, best) :
            // @ts-ignore
            cursorIsBetween(best, mark, cursor);

          if (equal || between) {
            // @ts-ignore
            best = mark;
          }
        }
      }

      if (motionArgs.linewise) {
        // Vim places the cursor on the first non-whitespace character of
        // the line if there is one, else it places the cursor at the end
        // of the line, regardless of whether a mark was found.
        best = new Pos(best.line, findFirstNonWhiteSpaceCharacter(cm.getLine(best.line)));
      }
      return best;
    },
    moveByCharacters: function(_cm, head, motionArgs) {
      var cur = head;
      var repeat = motionArgs.repeat;
      var ch = motionArgs.forward ? cur.ch + repeat : cur.ch - repeat;
      return new Pos(cur.line, ch);
    },
    moveByLines: function(cm, head, motionArgs, vim) {
      var cur = head;
      var endCh = cur.ch;
      // Depending what our last motion was, we may want to do different
      // things. If our last motion was moving vertically, we want to
      // preserve the HPos from our last horizontal move.  If our last motion
      // was going to the end of a line, moving vertically we should go to
      // the end of the line, etc.
      switch (vim.lastMotion) {
        case this.moveByLines:
        case this.moveByDisplayLines:
        case this.moveByScroll:
        case this.moveToColumn:
        case this.moveToEol:
          endCh = vim.lastHPos;
          break;
        default:
          vim.lastHPos = endCh;
      }
      var repeat = motionArgs.repeat+(motionArgs.repeatOffset||0);
      var line = motionArgs.forward ? cur.line + repeat : cur.line - repeat;
      var first = cm.firstLine();
      var last = cm.lastLine();
      var posV = cm.findPosV(cur, (motionArgs.forward ? repeat : -repeat), 'line', vim.lastHSPos);
      var hasMarkedText = motionArgs.forward ? posV.line > line : posV.line < line;
      if (hasMarkedText) {
        line = posV.line;
        endCh = posV.ch;
      }
      // Vim go to line begin or line end when cursor at first/last line and
      // move to previous/next line is triggered.
      if (line < first && cur.line == first){
        return this.moveToStartOfLine(cm, head, motionArgs, vim);
      } else if (line > last && cur.line == last){
          return moveToEol(cm, head, motionArgs, vim, true);
      }
      if (motionArgs.toFirstChar){
        endCh=findFirstNonWhiteSpaceCharacter(cm.getLine(line));
        vim.lastHPos = endCh;
      }
      vim.lastHSPos = cm.charCoords(new Pos(line, endCh),'div').left;
      return new Pos(line, endCh);
    },
    moveByDisplayLines: function(cm, head, motionArgs, vim) {
      var cur = head;
      switch (vim.lastMotion) {
        case this.moveByDisplayLines:
        case this.moveByScroll:
        case this.moveByLines:
        case this.moveToColumn:
        case this.moveToEol:
          break;
        default:
          vim.lastHSPos = cm.charCoords(cur,'div').left;
      }
      var repeat = motionArgs.repeat;
      var res=cm.findPosV(cur,(motionArgs.forward ? repeat : -repeat),'line',vim.lastHSPos);
      if (res.hitSide) {
        if (motionArgs.forward) {
          var lastCharCoords = cm.charCoords(res, 'div');
          var goalCoords = { top: lastCharCoords.top + 8, left: vim.lastHSPos };
          res = cm.coordsChar(goalCoords, 'div');
        } else {
          var resCoords = cm.charCoords(new Pos(cm.firstLine(), 0), 'div');
          resCoords.left = vim.lastHSPos;
          res = cm.coordsChar(resCoords, 'div');
        }
      }
      vim.lastHPos = res.ch;
      return res;
    },
    moveByPage: function(cm, head, motionArgs) {
      // CodeMirror only exposes functions that move the cursor page down, so
      // doing this bad hack to move the cursor and move it back. evalInput
      // will move the cursor to where it should be in the end.
      var curStart = head;
      var repeat = motionArgs.repeat;
      return cm.findPosV(curStart, (motionArgs.forward ? repeat : -repeat), 'page');
    },
    moveByParagraph: function(cm, head, motionArgs) {
      var dir = motionArgs.forward ? 1 : -1;
      return findParagraph(cm, head, motionArgs.repeat, dir).start;
    },
    moveBySentence: function(cm, head, motionArgs) {
      var dir = motionArgs.forward ? 1 : -1;
      return findSentence(cm, head, motionArgs.repeat, dir);
    },
    moveByScroll: function(cm, head, motionArgs, vim) {
      var scrollbox = cm.getScrollInfo();
      var curEnd = null;
      var repeat = motionArgs.repeat;
      if (!repeat) {
        repeat = scrollbox.clientHeight / (2 * cm.defaultTextHeight());
      }
      var orig = cm.charCoords(head, 'local');
      motionArgs.repeat = repeat;
      curEnd = motions.moveByDisplayLines(cm, head, motionArgs, vim);
      if (!curEnd) {
        return null;
      }
      var dest = cm.charCoords(curEnd, 'local');
      cm.scrollTo(null, scrollbox.top + dest.top - orig.top);
      return curEnd;
    },
    moveByWords: function(cm, head, motionArgs) {
      return moveToWord(cm, head, motionArgs.repeat, !!motionArgs.forward,
          !!motionArgs.wordEnd, !!motionArgs.bigWord);
    },
    moveTillCharacter: function(cm, head, motionArgs) {
      var repeat = motionArgs.repeat;
      var curEnd = moveToCharacter(cm, repeat, motionArgs.forward,
          motionArgs.selectedCharacter, head);
      var increment = motionArgs.forward ? -1 : 1;
      recordLastCharacterSearch(increment, motionArgs);
      if (!curEnd) return null;
      curEnd.ch += increment;
      return curEnd;
    },
    moveToCharacter: function(cm, head, motionArgs) {
      var repeat = motionArgs.repeat;
      recordLastCharacterSearch(0, motionArgs);
      return moveToCharacter(cm, repeat, motionArgs.forward,
          motionArgs.selectedCharacter, head) || head;
    },
    moveToSymbol: function(cm, head, motionArgs) {
      var repeat = motionArgs.repeat;
      return motionArgs.selectedCharacter
       && findSymbol(cm, repeat, motionArgs.forward,
          motionArgs.selectedCharacter) || head;
    },
    moveToColumn: function(cm, head, motionArgs, vim) {
      var repeat = motionArgs.repeat;
      // repeat is equivalent to which column we want to move to!
      vim.lastHPos = repeat - 1;
      vim.lastHSPos = cm.charCoords(head,'div').left;
      return moveToColumn(cm, repeat);
    },
    moveToEol: function(cm, head, motionArgs, vim) {
      return moveToEol(cm, head, motionArgs, vim, false);
    },
    moveToFirstNonWhiteSpaceCharacter: function(cm, head) {
      // Go to the start of the line where the text begins, or the end for
      // whitespace-only lines
      var cursor = head;
      return new Pos(cursor.line,
                  findFirstNonWhiteSpaceCharacter(cm.getLine(cursor.line)));
    },
    moveToMatchedSymbol: function(cm, head) {
      var cursor = head;
      var line = cursor.line;
      var ch = cursor.ch;
      var lineText = cm.getLine(line);
      var symbol;
      for (; ch < lineText.length; ch++) {
        symbol = lineText.charAt(ch);
        if (symbol && isMatchableSymbol(symbol)) {
          var style = cm.getTokenTypeAt(new Pos(line, ch + 1));
          if (style !== "string" && style !== "comment") {
            break;
          }
        }
      }
      if (ch < lineText.length) {
        // Only include angle brackets in analysis if they are being matched.
        var re = (symbol === '<' || symbol === '>') ? /[(){}[\]<>]/ : /[(){}[\]]/;
        var matched = cm.findMatchingBracket(new Pos(line, ch), {bracketRegex: re});
        return matched.to;
      } else {
        return cursor;
      }
    },
    moveToStartOfLine: function(_cm, head) {
      return new Pos(head.line, 0);
    },
    moveToLineOrEdgeOfDocument: function(cm, _head, motionArgs) {
      var lineNum = motionArgs.forward ? cm.lastLine() : cm.firstLine();
      if (motionArgs.repeatIsExplicit) {
        lineNum = motionArgs.repeat - cm.getOption('firstLineNumber');
      }
      return new Pos(lineNum,
                  findFirstNonWhiteSpaceCharacter(cm.getLine(lineNum)));
    },
    moveToStartOfDisplayLine: function(cm) {
      cm.execCommand("goLineLeft");
      return cm.getCursor();
    },
    moveToEndOfDisplayLine: function(cm) {
      cm.execCommand("goLineRight");
      var head = cm.getCursor();
      if (head.sticky == "before") head.ch--;
      return head;
    },
    textObjectManipulation: function(cm, head, motionArgs, vim) {
      // TODO: lots of possible exceptions that can be thrown here. Try da(
      //     outside of a () block.
      /** @type{Object<string, string>} */
      var mirroredPairs = {'(': ')', ')': '(',
                            '{': '}', '}': '{',
                            '[': ']', ']': '[',
                            '<': '>', '>': '<'};
      /** @type{Object<string, boolean>} */
      var selfPaired = {'\'': true, '"': true, '`': true};

      var character = motionArgs.selectedCharacter || "";
      // 'b' refers to  '()' block.
      // 'B' refers to  '{}' block.
      if (character == 'b') {
        character = '(';
      } else if (character == 'B') {
        character = '{';
      }

      // Inclusive is the difference between a and i
      // TODO: Instead of using the additional text object map to perform text
      //     object operations, merge the map into the defaultKeyMap and use
      //     motionArgs to define behavior. Define separate entries for 'aw',
      //     'iw', 'a[', 'i[', etc.
      var inclusive = !motionArgs.textObjectInner;

      var tmp, move;
      if (mirroredPairs[character]) {
        move = true;
        tmp = selectCompanionObject(cm, head, character, inclusive);
        if (!tmp) {
          var sc = cm.getSearchCursor(new RegExp("\\" + character, "g"), head);
          if (sc.find()) {
            // @ts-ignore
            tmp = selectCompanionObject(cm, sc.from(), character, inclusive);
          }
        }
      } else if (selfPaired[character]) {
        move = true;
        tmp = findBeginningAndEnd(cm, head, character, inclusive);
      } else if (character === 'W' || character === 'w') {
        var repeat = motionArgs.repeat || 1;
        while (repeat-- > 0) {
          var repeated = expandWordUnderCursor(cm, {
            inclusive,
            innerWord: !inclusive,
            bigWord: character === 'W',
            noSymbol: character === 'W',
            multiline: true
          }, tmp && tmp.end);
          if (repeated) {
            if (!tmp) tmp = repeated;
            tmp.end = repeated.end;
          }
        }
      } else if (character === 'p') {
        tmp = findParagraph(cm, head, motionArgs.repeat, 0, inclusive);
        motionArgs.linewise = true;
        if (vim.visualMode) {
          if (!vim.visualLine) { vim.visualLine = true; }
        } else {
          var operatorArgs = vim.inputState.operatorArgs;
          if (operatorArgs) { operatorArgs.linewise = true; }
          tmp.end.line--;
        }
      } else if (character === 't') {
        tmp = expandTagUnderCursor(cm, head, inclusive);
      } else if (character === 's') {
        // account for cursor on end of sentence symbol
        var content = cm.getLine(head.line);
        if (head.ch > 0 && isEndOfSentenceSymbol(content[head.ch])) {
          head.ch -= 1;
        }
        var end = getSentence(cm, head, motionArgs.repeat, 1, inclusive);
        var start = getSentence(cm, head, motionArgs.repeat, -1, inclusive);
        // closer vim behaviour, 'a' only takes the space after the sentence if there is one before and after
        if (isWhiteSpaceString(cm.getLine(start.line)[start.ch])
            && isWhiteSpaceString(cm.getLine(end.line)[end.ch -1])) {
          start = {line: start.line, ch: start.ch + 1};
        }
        tmp = {start: start, end: end};
      }

      if (!tmp) {
        // No valid text object, don't move.
        return null;
      }

      if (!cm.state.vim.visualMode) {
        return [tmp.start, tmp.end];
      } else {
        return expandSelection(cm, tmp.start, tmp.end, move);
      }
    },

    repeatLastCharacterSearch: function(cm, head, motionArgs) {
      var lastSearch = vimGlobalState.lastCharacterSearch;
      var repeat = motionArgs.repeat;
      var forward = motionArgs.forward === lastSearch.forward;
      var increment = (lastSearch.increment ? 1 : 0) * (forward ? -1 : 1);
      cm.moveH(-increment, 'char');
      motionArgs.inclusive = forward ? true : false;
      var curEnd = moveToCharacter(cm, repeat, forward, lastSearch.selectedCharacter);
      if (!curEnd) {
        cm.moveH(increment, 'char');
        return head;
      }
      curEnd.ch += increment;
      return curEnd;
    }
  };

  /** @arg {string} name  @arg {import("./types").MotionFn} fn */
  function defineMotion(name, fn) {
    motions[name] = fn;
  }

  /** @arg {string} val @arg {number} times */
  function fillArray(val, times) {
    var arr = [];
    for (var i = 0; i < times; i++) {
      arr.push(val);
    }
    return arr;
  }
  /**
   * An operator acts on a text selection. It receives the list of selections
   * as input. The corresponding CodeMirror selection is guaranteed to
   * match the input selection.
   */
  /** @type {import("./types").vimOperators} */
  var operators = {
    change: function(cm, args, ranges) {
      var finalHead, text;
      var vim = cm.state.vim;
      var anchor = ranges[0].anchor,
          head = ranges[0].head;
      if (!vim.visualMode) {
        text = cm.getRange(anchor, head);
        var lastState = vim.lastEditInputState;
        if (lastState?.motion == "moveByWords" && !isWhiteSpaceString(text)) {
          // Exclude trailing whitespace if the range is not all whitespace.
          var match = (/\s+$/).exec(text);
          if (match && lastState.motionArgs && lastState.motionArgs.forward) {
            head = offsetCursor(head, 0, - match[0].length);
            text = text.slice(0, - match[0].length);
          }
        }
        if (args.linewise) {
          anchor = new Pos(anchor.line, findFirstNonWhiteSpaceCharacter(cm.getLine(anchor.line)));
          if (head.line > anchor.line) {
            head = new Pos(head.line - 1, Number.MAX_VALUE);
          }
        }
        cm.replaceRange('', anchor, head);
        finalHead = anchor;
      } else if (args.fullLine) {
          head.ch = Number.MAX_VALUE;
          head.line--;
          cm.setSelection(anchor, head);
          text = cm.getSelection();
          cm.replaceSelection("");
          finalHead = anchor;
      } else {
        text = cm.getSelection();
        var replacement = fillArray('', ranges.length);
        cm.replaceSelections(replacement);
        finalHead = cursorMin(ranges[0].head, ranges[0].anchor);
      }
      vimGlobalState.registerController.pushText(
          args.registerName, 'change', text,
          args.linewise, ranges.length > 1);
      actions.enterInsertMode(cm, {head: finalHead}, cm.state.vim);
    },
    delete: function(cm, args, ranges) {
      var finalHead, text;
      var vim = cm.state.vim;
      if (!vim.visualBlock) {
        var anchor = ranges[0].anchor,
            head = ranges[0].head;
        if (args.linewise &&
            head.line != cm.firstLine() &&
            anchor.line == cm.lastLine() &&
            anchor.line == head.line - 1) {
          // Special case for dd on last line (and first line).
          if (anchor.line == cm.firstLine()) {
            anchor.ch = 0;
          } else {
            anchor = new Pos(anchor.line - 1, lineLength(cm, anchor.line - 1));
          }
        }
        text = cm.getRange(anchor, head);
        cm.replaceRange('', anchor, head);
        finalHead = anchor;
        if (args.linewise) {
          finalHead = motions.moveToFirstNonWhiteSpaceCharacter(cm, anchor);
        }
      } else {
        text = cm.getSelection();
        var replacement = fillArray('', ranges.length);
        cm.replaceSelections(replacement);
        finalHead = cursorMin(ranges[0].head, ranges[0].anchor);
      }
      vimGlobalState.registerController.pushText(
          args.registerName, 'delete', text,
          args.linewise, vim.visualBlock);
      return clipCursorToContent(cm, finalHead);
    },
    indent: function(cm, args, ranges) {
      var vim = cm.state.vim;
      // In visual mode, n> shifts the selection right n times, instead of
      // shifting n lines right once.
      var repeat = vim.visualMode ? args.repeat || 1 : 1;
      if (vim.visualBlock) {
        var tabSize = cm.getOption('tabSize');
        var indent = cm.getOption('indentWithTabs') ? '\t' : ' '.repeat(tabSize);
        var cursor;
        for (var i = ranges.length - 1; i >= 0; i--) {
          cursor = cursorMin(ranges[i].anchor, ranges[i].head);
          if (args.indentRight) {
            cm.replaceRange(indent.repeat(repeat), cursor, cursor);
          } else {
            var text = cm.getLine(cursor.line);
            var end = 0;
            for (var j = 0; j < repeat; j++) {
              var ch = text[cursor.ch + end];
              if (ch == '\t') {
                end++;
              } else if (ch == ' ') {
                end++;
                for (var k = 1; k < indent.length; k++) {
                  ch = text[cursor.ch + end];
                  if (ch !== ' ') break;
                  end++;
                }
              } else {
                break
              }
            }
            cm.replaceRange('', cursor, offsetCursor(cursor, 0, end));
          }
        }
        return cursor;
      } else if (cm.indentMore) {
        for (var j = 0; j < repeat; j++) {
          if (args.indentRight) cm.indentMore();
          else cm.indentLess();
        }
      } else {
        var startLine = ranges[0].anchor.line;
        var endLine = vim.visualBlock ?
          ranges[ranges.length - 1].anchor.line :
          ranges[0].head.line;
        if (args.linewise) {
          // The only way to delete a newline is to delete until the start of
          // the next line, so in linewise mode evalInput will include the next
          // line. We don't want this in indent, so we go back a line.
          endLine--;
        }
        for (var i = startLine; i <= endLine; i++) {
          for (var j = 0; j < repeat; j++) {
            cm.indentLine(i, args.indentRight);
          }
        }
      }
      return motions.moveToFirstNonWhiteSpaceCharacter(cm, ranges[0].anchor);
    },
    indentAuto: function(cm, _args, ranges) {
      cm.execCommand("indentAuto");
      return motions.moveToFirstNonWhiteSpaceCharacter(cm, ranges[0].anchor);
    },
    hardWrap: function(cm, operatorArgs, ranges, oldAnchor) {
      if (!cm.hardWrap) return;
      var from = ranges[0].anchor.line;
      var to = ranges[0].head.line;
      if (operatorArgs.linewise) to--;
      var endRow = cm.hardWrap({from: from, to: to});
      if (endRow > from && operatorArgs.linewise) endRow--;
      return operatorArgs.keepCursor ? oldAnchor : new Pos(endRow, 0);
    },
    changeCase: function(cm, args, ranges, oldAnchor, newHead) {
      var selections = cm.getSelections();
      var swapped = [];
      var toLower = args.toLower;
      for (var j = 0; j < selections.length; j++) {
        var toSwap = selections[j];
        var text = '';
        if (toLower === true) {
          text = toSwap.toLowerCase();
        } else if (toLower === false) {
          text = toSwap.toUpperCase();
        } else {
          for (var i = 0; i < toSwap.length; i++) {
            var character = toSwap.charAt(i);
            text += isUpperCase(character) ? character.toLowerCase() :
                character.toUpperCase();
          }
        }
        swapped.push(text);
      }
      cm.replaceSelections(swapped);
      if (args.shouldMoveCursor){
        return newHead;
      } else if (!cm.state.vim.visualMode && args.linewise && ranges[0].anchor.line + 1 == ranges[0].head.line) {
        return motions.moveToFirstNonWhiteSpaceCharacter(cm, oldAnchor);
      } else if (args.linewise){
        return oldAnchor;
      } else {
        return cursorMin(ranges[0].anchor, ranges[0].head);
      }
    },
    yank: function(cm, args, ranges, oldAnchor) {
      var vim = cm.state.vim;
      var text = cm.getSelection();
      var endPos = vim.visualMode
        ? cursorMin(vim.sel.anchor, vim.sel.head, ranges[0].head, ranges[0].anchor)
        : oldAnchor;
      vimGlobalState.registerController.pushText(
          args.registerName, 'yank',
          text, args.linewise, vim.visualBlock);
      return endPos;
    },
    rot13: function(cm, args, ranges, oldAnchor, newHead) {
      var selections = cm.getSelections();
      var swapped = [];
      for (var j = 0; j < selections.length; j++) {
        const replacement = selections[j]
          .split('')
          .map(x => {
            const code = x.charCodeAt(0);
            if (code >= 65 && code <= 90) { // Uppercase
              return String.fromCharCode(65 + ((code - 65 + 13) % 26))
            } else if (code >= 97 && code <= 122) { // Lowercase
              return String.fromCharCode(97 + ((code - 97 + 13) % 26))
            } else { // Not a letter
              return x;
            }
          })
          .join('');
        swapped.push(replacement);
      }
      cm.replaceSelections(swapped);
      if (args.shouldMoveCursor){
        return newHead;
      } else if (!cm.state.vim.visualMode && args.linewise && ranges[0].anchor.line + 1 == ranges[0].head.line) {
        return motions.moveToFirstNonWhiteSpaceCharacter(cm, oldAnchor);
      } else if (args.linewise){
        return oldAnchor;
      } else {
        return cursorMin(ranges[0].anchor, ranges[0].head);
      }
    },
  };

  /** @arg {string} name  @arg {import("./types").OperatorFn} fn */
  function defineOperator(name, fn) {
    operators[name] = fn;
  }

  /** @type {import("./types").vimActions} */
  var actions = {
    jumpListWalk: function(cm, actionArgs, vim) {
      if (vim.visualMode) {
        return;
      }
      var repeat = actionArgs.repeat || 1;
      var forward = actionArgs.forward;
      var jumpList = vimGlobalState.jumpList;

      var mark = jumpList.move(cm, forward ? repeat : -repeat);
      var markPos = mark ? mark.find() : undefined;
      markPos = markPos ? markPos : cm.getCursor();
      cm.setCursor(markPos);
    },
    scroll: function(cm, actionArgs, vim) {
      if (vim.visualMode) {
        return;
      }
      var repeat = actionArgs.repeat || 1;
      var lineHeight = cm.defaultTextHeight();
      var top = cm.getScrollInfo().top;
      var delta = lineHeight * repeat;
      var newPos = actionArgs.forward ? top + delta : top - delta;
      var cursor = copyCursor(cm.getCursor());
      var cursorCoords = cm.charCoords(cursor, 'local');
      if (actionArgs.forward) {
        if (newPos > cursorCoords.top) {
            cursor.line += (newPos - cursorCoords.top) / lineHeight;
            cursor.line = Math.ceil(cursor.line);
            cm.setCursor(cursor);
            cursorCoords = cm.charCoords(cursor, 'local');
            cm.scrollTo(null, cursorCoords.top);
        } else {
            // Cursor stays within bounds.  Just reposition the scroll window.
            cm.scrollTo(null, newPos);
        }
      } else {
        var newBottom = newPos + cm.getScrollInfo().clientHeight;
        if (newBottom < cursorCoords.bottom) {
            cursor.line -= (cursorCoords.bottom - newBottom) / lineHeight;
            cursor.line = Math.floor(cursor.line);
            cm.setCursor(cursor);
            cursorCoords = cm.charCoords(cursor, 'local');
            cm.scrollTo(
                null, cursorCoords.bottom - cm.getScrollInfo().clientHeight);
        } else {
            // Cursor stays within bounds.  Just reposition the scroll window.
            cm.scrollTo(null, newPos);
        }
      }
    },
    scrollToCursor: function(cm, actionArgs) {
      var lineNum = cm.getCursor().line;
      var charCoords = cm.charCoords(new Pos(lineNum, 0), 'local');
      var height = cm.getScrollInfo().clientHeight;
      var y = charCoords.top;
      switch (actionArgs.position) {
        case 'center': y = charCoords.bottom - height / 2;
          break;
        case 'bottom':
          var lineLastCharPos = new Pos(lineNum, cm.getLine(lineNum).length - 1);
          var lineLastCharCoords = cm.charCoords(lineLastCharPos, 'local');
          var lineHeight = lineLastCharCoords.bottom - y;
          y = y - height + lineHeight;
          break;
      }
      cm.scrollTo(null, y);
    },
    replayMacro: function(cm, actionArgs, vim) {
      var registerName = actionArgs.selectedCharacter || "";
      var repeat = actionArgs.repeat || 1;
      var macroModeState = vimGlobalState.macroModeState;
      if (registerName == '@') {
        registerName = macroModeState.latestRegister || "";
      } else {
        macroModeState.latestRegister = registerName;
      }
      while(repeat--){
        executeMacroRegister(cm, vim, macroModeState, registerName);
      }
    },
    enterMacroRecordMode: function(cm, actionArgs) {
      var macroModeState = vimGlobalState.macroModeState;
      var registerName = actionArgs.selectedCharacter;
      if (vimGlobalState.registerController.isValidRegister(registerName)) {
        macroModeState.enterMacroRecordMode(cm, registerName);
      }
    },
    toggleOverwrite: function(cm) {
      if (!cm.state.overwrite) {
        cm.toggleOverwrite(true);
        cm.setOption('keyMap', 'vim-replace');
        CM.signal(cm, "vim-mode-change", {mode: "replace"});
      } else {
        cm.toggleOverwrite(false);
        cm.setOption('keyMap', 'vim-insert');
        CM.signal(cm, "vim-mode-change", {mode: "insert"});
      }
    },
    enterInsertMode: function(cm, actionArgs, vim) {
      if (cm.getOption('readOnly')) { return; }
      vim.insertMode = true;
      vim.insertModeRepeat = actionArgs && actionArgs.repeat || 1;
      var insertAt = (actionArgs) ? actionArgs.insertAt : null;
      var sel = vim.sel;
      var head = actionArgs.head || cm.getCursor('head');
      var height = cm.listSelections().length;
      if (insertAt == 'eol') {
        head = new Pos(head.line, lineLength(cm, head.line));
      } else if (insertAt == 'bol') {
        head = new Pos(head.line, 0);
      } else if (insertAt == 'charAfter') {
        var newPosition = updateSelectionForSurrogateCharacters(cm, head, offsetCursor(head, 0, 1));
        head = newPosition.end;
      } else if (insertAt == 'firstNonBlank') {
        var newPosition = updateSelectionForSurrogateCharacters(cm, head, motions.moveToFirstNonWhiteSpaceCharacter(cm, head));
        head = newPosition.end;
      } else if (insertAt == 'startOfSelectedArea') {
        if (!vim.visualMode)
            return;
        if (!vim.visualBlock) {
          if (sel.head.line < sel.anchor.line) {
            head = sel.head;
          } else {
            head = new Pos(sel.anchor.line, 0);
          }
        } else {
          head = new Pos(
              Math.min(sel.head.line, sel.anchor.line),
              Math.min(sel.head.ch, sel.anchor.ch));
          height = Math.abs(sel.head.line - sel.anchor.line) + 1;
        }
      } else if (insertAt == 'endOfSelectedArea') {
          if (!vim.visualMode)
            return;
        if (!vim.visualBlock) {
          if (sel.head.line >= sel.anchor.line) {
            head = offsetCursor(sel.head, 0, 1);
          } else {
            head = new Pos(sel.anchor.line, 0);
          }
        } else {
          head = new Pos(
              Math.min(sel.head.line, sel.anchor.line),
              Math.max(sel.head.ch, sel.anchor.ch) + 1);
          height = Math.abs(sel.head.line - sel.anchor.line) + 1;
        }
      } else if (insertAt == 'inplace') {
        if (vim.visualMode){
          return;
        }
      } else if (insertAt == 'lastEdit') {
        head = getLastEditPos(cm) || head;
      }
      cm.setOption('disableInput', false);
      if (actionArgs && actionArgs.replace) {
        // Handle Replace-mode as a special case of insert mode.
        cm.toggleOverwrite(true);
        cm.setOption('keyMap', 'vim-replace');
        CM.signal(cm, "vim-mode-change", {mode: "replace"});
      } else {
        cm.toggleOverwrite(false);
        cm.setOption('keyMap', 'vim-insert');
        CM.signal(cm, "vim-mode-change", {mode: "insert"});
      }
      if (!vimGlobalState.macroModeState.isPlaying) {
        // Only record if not replaying.
        cm.on('change', onChange);
        if (vim.insertEnd) vim.insertEnd.clear();
        vim.insertEnd = cm.setBookmark(head, {insertLeft: true});
        CM.on(cm.getInputField(), 'keydown', onKeyEventTargetKeyDown);
      }
      if (vim.visualMode) {
        exitVisualMode(cm);
      }
      selectForInsert(cm, head, height);
    },
    toggleVisualMode: function(cm, actionArgs, vim) {
      var repeat = actionArgs.repeat;
      var anchor = cm.getCursor();
      var head;
      // TODO: The repeat should actually select number of characters/lines
      //     equal to the repeat times the size of the previous visual
      //     operation.
      if (!vim.visualMode) {
        // Entering visual mode
        vim.visualMode = true;
        vim.visualLine = !!actionArgs.linewise;
        vim.visualBlock = !!actionArgs.blockwise;
        head = clipCursorToContent(
            cm, new Pos(anchor.line, anchor.ch + repeat - 1));
        var newPosition = updateSelectionForSurrogateCharacters(cm, anchor, head);
        vim.sel = {
          anchor: newPosition.start,
          head: newPosition.end
        };
        CM.signal(cm, "vim-mode-change", {mode: "visual", subMode: vim.visualLine ? "linewise" : vim.visualBlock ? "blockwise" : ""});
        updateCmSelection(cm);
        updateMark(cm, vim, '<', cursorMin(anchor, head));
        updateMark(cm, vim, '>', cursorMax(anchor, head));
      } else if (vim.visualLine != !!actionArgs.linewise ||
          vim.visualBlock != !!actionArgs.blockwise) {
        // Toggling between modes
        vim.visualLine = !!actionArgs.linewise;
        vim.visualBlock = !!actionArgs.blockwise;
        CM.signal(cm, "vim-mode-change", {mode: "visual", subMode: vim.visualLine ? "linewise" : vim.visualBlock ? "blockwise" : ""});
        updateCmSelection(cm);
      } else {
        exitVisualMode(cm);
      }
    },
    reselectLastSelection: function(cm, _actionArgs, vim) {
      var lastSelection = vim.lastSelection;
      if (vim.visualMode) {
        updateLastSelection(cm, vim);
      }
      if (lastSelection) {
        var anchor = lastSelection.anchorMark.find();
        var head = lastSelection.headMark.find();
        if (!anchor || !head) {
          // If the marks have been destroyed due to edits, do nothing.
          return;
        }
        vim.sel = {
          anchor: anchor,
          head: head
        };
        vim.visualMode = true;
        vim.visualLine = lastSelection.visualLine;
        vim.visualBlock = lastSelection.visualBlock;
        updateCmSelection(cm);
        updateMark(cm, vim, '<', cursorMin(anchor, head));
        updateMark(cm, vim, '>', cursorMax(anchor, head));
        CM.signal(cm, 'vim-mode-change', {
          mode: 'visual',
          subMode: vim.visualLine ? 'linewise' :
                    vim.visualBlock ? 'blockwise' : ''});
      }
    },
    joinLines: function(cm, actionArgs, vim) {
      var curStart, curEnd;
      if (vim.visualMode) {
        curStart = cm.getCursor('anchor');
        curEnd = cm.getCursor('head');
        if (cursorIsBefore(curEnd, curStart)) {
          var tmp = curEnd;
          curEnd = curStart;
          curStart = tmp;
        }
        curEnd.ch = lineLength(cm, curEnd.line) - 1;
      } else {
        // Repeat is the number of lines to join. Minimum 2 lines.
        var repeat = Math.max(actionArgs.repeat, 2);
        curStart = cm.getCursor();
        curEnd = clipCursorToContent(cm, new Pos(curStart.line + repeat - 1,
                                              Infinity));
      }
      var finalCh = 0;
      for (var i = curStart.line; i < curEnd.line; i++) {
        finalCh = lineLength(cm, curStart.line);
        var text = '';
        var nextStartCh = 0;
        if (!actionArgs.keepSpaces) {
          var nextLine = cm.getLine(curStart.line + 1);
          nextStartCh = nextLine.search(/\S/);
          if (nextStartCh == -1) {
            nextStartCh = nextLine.length;
          } else {
            text = " ";
          }
        }
        cm.replaceRange(text, 
          new Pos(curStart.line, finalCh),
          new Pos(curStart.line + 1, nextStartCh));
      }
      var curFinalPos = clipCursorToContent(cm, new Pos(curStart.line, finalCh));
      if (vim.visualMode) {
        exitVisualMode(cm, false);
      }
      cm.setCursor(curFinalPos);
    },
    newLineAndEnterInsertMode: function(cm, actionArgs, vim) {
      vim.insertMode = true;
      var insertAt = copyCursor(cm.getCursor());
      if (insertAt.line === cm.firstLine() && !actionArgs.after) {
        // Special case for inserting newline before start of document.
        cm.replaceRange('\n', new Pos(cm.firstLine(), 0));
        cm.setCursor(cm.firstLine(), 0);
      } else {
        insertAt.line = (actionArgs.after) ? insertAt.line :
            insertAt.line - 1;
        insertAt.ch = lineLength(cm, insertAt.line);
        cm.setCursor(insertAt);
        var newlineFn = CM.commands.newlineAndIndentContinueComment ||
            CM.commands.newlineAndIndent;
        newlineFn(cm);
      }
      this.enterInsertMode(cm, { repeat: actionArgs.repeat }, vim);
    },
    paste: function(cm, actionArgs, vim) {
      var register = vimGlobalState.registerController.getRegister(
          actionArgs.registerName);
      if (actionArgs.registerName === '+') {
        navigator.clipboard.readText().then((value) => {
          this.continuePaste(cm, actionArgs, vim, value, register);
        });
      } else {
        var text = register.toString();
        this.continuePaste(cm, actionArgs, vim, text, register);
      }
    },
    continuePaste: function(cm, actionArgs, vim, text, register) {
      var cur = copyCursor(cm.getCursor());
      if (!text) {
        return;
      }
      if (actionArgs.matchIndent) {
        var tabSize = cm.getOption("tabSize");
        // length that considers tabs and tabSize
        var whitespaceLength = function(/** @type {string} */ str) {
          var tabs = (str.split("\t").length - 1);
          var spaces = (str.split(" ").length - 1);
          return tabs * tabSize + spaces * 1;
        };
        var currentLine = cm.getLine(cm.getCursor().line);
        // @ts-ignore
        var indent = whitespaceLength(currentLine.match(/^\s*/)[0]);
        // chomp last newline b/c don't want it to match /^\s*/gm
        var chompedText = text.replace(/\n$/, '');
        var wasChomped = text !== chompedText;
        // @ts-ignore
        var firstIndent = whitespaceLength(text.match(/^\s*/)[0]);
        var text = chompedText.replace(/^\s*/gm, function(wspace) {
          var newIndent = indent + (whitespaceLength(wspace) - firstIndent);
          if (newIndent < 0) {
            return "";
          }
          else if (cm.getOption("indentWithTabs")) {
            var quotient = Math.floor(newIndent / tabSize);
            return Array(quotient + 1).join('\t');
          }
          else {
            return Array(newIndent + 1).join(' ');
          }
        });
        text += wasChomped ? "\n" : "";
      }
      if (actionArgs.repeat > 1) {
        text = Array(actionArgs.repeat + 1).join(text);
      }
      var linewise = register.linewise;
      var blockwise = register.blockwise;
      var textLines = blockwise ? text.split('\n') : undefined;
      if (textLines) {
        if (linewise) {
          textLines.pop();
        }
        for (var i = 0; i < textLines.length; i++) {
          textLines[i] = (textLines[i] == '') ? ' ' : textLines[i];
        }
        cur.ch += actionArgs.after ? 1 : 0;
        cur.ch = Math.min(lineLength(cm, cur.line), cur.ch);
      } else if (linewise) {
        if (vim.visualMode) {
          text = vim.visualLine ? text.slice(0, -1) : '\n' + text.slice(0, text.length - 1) + '\n';
        } else if (actionArgs.after) {
          // Move the newline at the end to the start instead, and paste just
          // before the newline character of the line we are on right now.
          text = '\n' + text.slice(0, text.length - 1);
          cur.ch = lineLength(cm, cur.line);
        } else {
          cur.ch = 0;
        }
      } else {
        cur.ch += actionArgs.after ? 1 : 0;
      }
      var curPosFinal;
      if (vim.visualMode) {
        //  save the pasted text for reselection if the need arises
        vim.lastPastedText = text;
        var lastSelectionCurEnd;
        var selectedArea = getSelectedAreaRange(cm);
        var selectionStart = selectedArea[0];
        var selectionEnd = selectedArea[1];
        var selectedText = cm.getSelection();
        var selections = cm.listSelections();
        var emptyStrings = new Array(selections.length).join('1').split('1');
        // save the curEnd marker before it get cleared due to cm.replaceRange.
        if (vim.lastSelection) {
          lastSelectionCurEnd = vim.lastSelection.headMark.find();
        }
        // push the previously selected text to unnamed register
        vimGlobalState.registerController.unnamedRegister.setText(selectedText);
        if (blockwise) {
          // first delete the selected text
          cm.replaceSelections(emptyStrings);
          // Set new selections as per the block length of the yanked text
          selectionEnd = new Pos(selectionStart.line + text.length-1, selectionStart.ch);
          cm.setCursor(selectionStart);
          selectBlock(cm, selectionEnd);
          // @ts-ignore
          cm.replaceSelections(text);
          curPosFinal = selectionStart;
        } else if (vim.visualBlock) {
          cm.replaceSelections(emptyStrings);
          cm.setCursor(selectionStart);
          cm.replaceRange(text, selectionStart, selectionStart);
          curPosFinal = selectionStart;
        } else {
          cm.replaceRange(text, selectionStart, selectionEnd);
          curPosFinal = cm.posFromIndex(cm.indexFromPos(selectionStart) + text.length - 1);
        }
        // restore the curEnd marker
        if(lastSelectionCurEnd) {
          vim.lastSelection.headMark = cm.setBookmark(lastSelectionCurEnd);
        }
        if (linewise) {
          curPosFinal.ch=0;
        }
      } else {
        if (blockwise && textLines) {
          cm.setCursor(cur);
          for (var i = 0; i < textLines.length; i++) {
            var line = cur.line+i;
            if (line > cm.lastLine()) {
              cm.replaceRange('\n',  new Pos(line, 0));
            }
            var lastCh = lineLength(cm, line);
            if (lastCh < cur.ch) {
              extendLineToColumn(cm, line, cur.ch);
            }
          }
          cm.setCursor(cur);
          selectBlock(cm, new Pos(cur.line + textLines.length-1, cur.ch));
          cm.replaceSelections(textLines);
          curPosFinal = cur;
        } else {
          cm.replaceRange(text, cur);
          // Now fine tune the cursor to where we want it.
          if (linewise) {
            var line = actionArgs.after ? cur.line + 1 : cur.line;
            curPosFinal = new Pos(line, findFirstNonWhiteSpaceCharacter(cm.getLine(line)));
          } else {
            curPosFinal = copyCursor(cur);
            if (!/\n/.test(text)) {
              curPosFinal.ch += text.length - (actionArgs.after ? 1 : 0);
            }
          }
        }
      }
      if (vim.visualMode) {
        exitVisualMode(cm, false);
      }
      cm.setCursor(curPosFinal);
    },
    undo: function(cm, actionArgs) {
      cm.operation(function() {
        repeatFn(cm, CM.commands.undo, actionArgs.repeat)();
        cm.setCursor(clipCursorToContent(cm, cm.getCursor('start')));
      });
    },
    redo: function(cm, actionArgs) {
      repeatFn(cm, CM.commands.redo, actionArgs.repeat)();
    },
    setRegister: function(_cm, actionArgs, vim) {
      vim.inputState.registerName = actionArgs.selectedCharacter;
    },
    insertRegister: function(cm, actionArgs, vim) {
      var registerName = actionArgs.selectedCharacter;
      var register = vimGlobalState.registerController.getRegister(registerName);
      var text = register && register.toString();
      if (text) {
        cm.replaceSelection(text);
      }
    },
    oneNormalCommand: function(cm, actionArgs, vim) {
      exitInsertMode(cm, true);
      vim.insertModeReturn = true;
      CM.on(cm, 'vim-command-done', function handler() {
        if (vim.visualMode) return;
        if (vim.insertModeReturn) {
          vim.insertModeReturn = false;
          if (!vim.insertMode) {
            actions.enterInsertMode(cm, {}, vim);
          }
        }
        CM.off(cm, 'vim-command-done', handler);
      });
    },
    setMark: function(cm, actionArgs, vim) {
      var markName = actionArgs.selectedCharacter;
      if (markName) updateMark(cm, vim, markName, cm.getCursor());
    },
    replace: function(cm, actionArgs, vim) {
      var replaceWith = actionArgs.selectedCharacter || "";
      var curStart = cm.getCursor();
      var replaceTo;
      var curEnd;
      var selections = cm.listSelections();
      if (vim.visualMode) {
        curStart = cm.getCursor('start');
        curEnd = cm.getCursor('end');
      } else {
        var line = cm.getLine(curStart.line);
        replaceTo = curStart.ch + actionArgs.repeat;
        if (replaceTo > line.length) {
          replaceTo=line.length;
        }
        curEnd = new Pos(curStart.line, replaceTo);
      }

      var newPositions = updateSelectionForSurrogateCharacters(cm, curStart, curEnd);
      curStart = newPositions.start;
      curEnd = newPositions.end;
      if (replaceWith=='\n') {
        if (!vim.visualMode) cm.replaceRange('', curStart, curEnd);
        // special case, where vim help says to replace by just one line-break
        (CM.commands.newlineAndIndentContinueComment || CM.commands.newlineAndIndent)(cm);
      } else {
        var replaceWithStr = cm.getRange(curStart, curEnd);
        // replace all surrogate characters with selected character
        replaceWithStr = replaceWithStr.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, replaceWith);
        //replace all characters in range by selected, but keep linebreaks
        replaceWithStr = replaceWithStr.replace(/[^\n]/g, replaceWith);
        if (vim.visualBlock) {
          // Tabs are split in visua block before replacing
          var spaces = new Array(cm.getOption("tabSize")+1).join(' ');
          replaceWithStr = cm.getSelection();
          replaceWithStr = replaceWithStr.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, replaceWith);
          var replaceWithStrings = replaceWithStr.replace(/\t/g, spaces).replace(/[^\n]/g, replaceWith).split('\n');
          cm.replaceSelections(replaceWithStrings);
        } else {
          cm.replaceRange(replaceWithStr, curStart, curEnd);
        }
        if (vim.visualMode) {
          curStart = cursorIsBefore(selections[0].anchor, selections[0].head) ?
                        selections[0].anchor : selections[0].head;
          cm.setCursor(curStart);
          exitVisualMode(cm, false);
        } else {
          cm.setCursor(offsetCursor(curEnd, 0, -1));
        }
      }
    },
    incrementNumberToken: function(cm, actionArgs) {
      var cur = cm.getCursor();
      var lineStr = cm.getLine(cur.line);
      var re = /(-?)(?:(0x)([\da-f]+)|(0b|0|)(\d+))/gi;
      var match;
      var start;
      var end;
      var numberStr;
      while ((match = re.exec(lineStr)) !== null) {
        start = match.index;
        end = start + match[0].length;
        if (cur.ch < end)break;
      }
      // @ts-ignore
      if (!actionArgs.backtrack && (end <= cur.ch))return;
      if (match) {
        var baseStr = match[2] || match[4];
        var digits = match[3] || match[5];
        var increment = actionArgs.increase ? 1 : -1;
        var base = {'0b': 2, '0': 8, '': 10, '0x': 16}[baseStr.toLowerCase()];
        var number = parseInt(match[1] + digits, base) + (increment * actionArgs.repeat);
        numberStr = number.toString(base);
        var zeroPadding = baseStr ? new Array(digits.length - numberStr.length + 1 + match[1].length).join('0') : '';
        if (numberStr.charAt(0) === '-') {
          numberStr = '-' + baseStr + zeroPadding + numberStr.substr(1);
        } else {
          numberStr = baseStr + zeroPadding + numberStr;
        }
        // @ts-ignore
        var from = new Pos(cur.line, start);
        // @ts-ignore
        var to = new Pos(cur.line, end);
        cm.replaceRange(numberStr, from, to);
      } else {
        return;
      }
      // @ts-ignore
      cm.setCursor(new Pos(cur.line, start + numberStr.length - 1));
    },
    repeatLastEdit: function(cm, actionArgs, vim) {
      var lastEditInputState = vim.lastEditInputState;
      if (!lastEditInputState) { return; }
      var repeat = actionArgs.repeat;
      if (repeat && actionArgs.repeatIsExplicit) {
        lastEditInputState.repeatOverride = repeat;
      } else {
        repeat = lastEditInputState.repeatOverride || repeat;
      }
      repeatLastEdit(cm, vim, repeat, false /** repeatForInsert */);
    },
    indent: function(cm, actionArgs) {
      cm.indentLine(cm.getCursor().line, actionArgs.indentRight);
    },
    exitInsertMode: function(cm, actionArgs) {
      exitInsertMode(cm);
    }
  };

  /** @arg {string } name  @arg {import("./types").ActionFn} fn */
  function defineAction(name, fn) {
    actions[name] = fn;
  }

  /*
   * Below are miscellaneous utility functions used by vim.js
   */

  /**
   * Clips cursor to ensure that line is within the buffer's range
   * and is not inside surrogate pair
   * If includeLineBreak is true, then allow cur.ch == lineLength.
   * @arg {CodeMirrorV} cm 
   * @arg {Pos} cur 
   * @arg {Pos} [oldCur]
   * @return {Pos}
   */
  function clipCursorToContent(cm, cur, oldCur) {
    var vim = cm.state.vim;
    var includeLineBreak = vim.insertMode || vim.visualMode;
    var line = Math.min(Math.max(cm.firstLine(), cur.line), cm.lastLine() );
    var text = cm.getLine(line);
    var maxCh = text.length - 1 + Number(!!includeLineBreak);
    var ch = Math.min(Math.max(0, cur.ch), maxCh);
    // prevent cursor from entering surrogate pair
    var charCode = text.charCodeAt(ch);
    if (0xDC00 <= charCode && charCode <= 0xDFFF) {
      var direction = 1;
      if (oldCur && oldCur.line == line && oldCur.ch > ch) {
        direction = -1;
      }
      ch +=direction;
      if (ch > maxCh) ch -=2;
    }
    return new Pos(line, ch);
  }
  /**@type <T>(args: T)=>T */
  function copyArgs(args) {
    var ret = /**@type{typeof args}*/({});
    for (var prop in args) {
      if (Object.prototype.hasOwnProperty.call(args, prop)) {
        ret[prop] = args[prop];
      }
    }
    return  /**@type{typeof args}*/(ret);
  }
  /**
   * @param {Pos} cur
   * @param {number|Pos} offsetLine
   * @param {number} offsetCh
   */
  function offsetCursor(cur, offsetLine, offsetCh) {
    if (typeof offsetLine === 'object') {
      offsetCh = offsetLine.ch;
      offsetLine = offsetLine.line;
    }
    return new Pos(cur.line + offsetLine, cur.ch + offsetCh);
  }
  /**
   * @param {string} keys
   * @param {vimKey[]} keyMap
   * @param {string} context
   * @param {InputStateInterface} inputState
   */
  function commandMatches(keys, keyMap, context, inputState) {
    // Partial matches are not applied. They inform the key handler
    // that the current key sequence is a subsequence of a valid key
    // sequence, so that the key buffer is not cleared.
    if (inputState.operator) context = "operatorPending";
    var match, partial = [], full = [];
    // if currently expanded key comes from a noremap, searcg only in default keys
    var startIndex = noremap ? keyMap.length - defaultKeymapLength : 0;
    for (var i = startIndex; i < keyMap.length; i++) {
      var command = keyMap[i];
      if (context == 'insert' && command.context != 'insert' ||
          (command.context && command.context != context) ||
          inputState.operator && command.type == 'action' ||
          !(match = commandMatch(keys, command.keys))) { continue; }
      if (match == 'partial') { partial.push(command); }
      if (match == 'full') { full.push(command); }
    }
    return {
      partial: partial,
      full: full
    };
  }
  /** @arg {string} pressed  @arg {string} mapped  @return {'full'|'partial'|false}*/
  function commandMatch(pressed, mapped) {
    const isLastCharacter = mapped.slice(-11) == '<character>';
    const isLastRegister = mapped.slice(-10) == '<register>';
    if (isLastCharacter || isLastRegister) {
      // Last character matches anything.
      var prefixLen = mapped.length - (isLastCharacter ? 11 : 10);
      var pressedPrefix = pressed.slice(0, prefixLen);
      var mappedPrefix = mapped.slice(0, prefixLen);
      return pressedPrefix == mappedPrefix && pressed.length > prefixLen ? 'full' :
              mappedPrefix.indexOf(pressedPrefix) == 0 ? 'partial' : false;
    } else {
      return pressed == mapped ? 'full' :
              mapped.indexOf(pressed) == 0 ? 'partial' : false;
    }
  }
  /** @arg {string} keys */
  function lastChar(keys) {
    var match = /^.*(<[^>]+>)$/.exec(keys);
    var selectedCharacter = match ? match[1] : keys.slice(-1);
    if (selectedCharacter.length > 1){
      switch(selectedCharacter){
        case '<CR>':
        case '<S-CR>':
          selectedCharacter='\n';
          break;
        case '<Space>':
        case '<S-Space>':
          selectedCharacter=' ';
          break;
        default:
          selectedCharacter='';
          break;
      }
    }
    return selectedCharacter;
  }
  /** @arg {CodeMirror} cm   @arg {{ (cm: CodeMirror): void }} fn   @arg {number} repeat */
  function repeatFn(cm, fn, repeat) {
    return function() {
      for (var i = 0; i < repeat; i++) {
        fn(cm);
      }
    };
  }
  /** @arg {Pos} cur   @return {Pos}*/
  function copyCursor(cur) {
    return new Pos(cur.line, cur.ch);
  }
  /** @arg {Pos} cur1 @arg {Pos} cur2  @return {boolean} */
  function cursorEqual(cur1, cur2) {
    return cur1.ch == cur2.ch && cur1.line == cur2.line;
  }
  /** @arg {Pos} cur1  @arg {Pos} cur2 @return {boolean}*/
  function cursorIsBefore(cur1, cur2) {
    if (cur1.line < cur2.line) {
      return true;
    }
    if (cur1.line == cur2.line && cur1.ch < cur2.ch) {
      return true;
    }
    return false;
  }
  /** @arg {Pos} cur1 @arg {Pos} cur2  @return {Pos}*/
  function cursorMin(cur1, cur2) {
    if (arguments.length > 2) {
      // @ts-ignore
      cur2 = cursorMin.apply(undefined, Array.prototype.slice.call(arguments, 1));
    }
    return cursorIsBefore(cur1, cur2) ? cur1 : cur2;
  }
  /** @arg {Pos} cur1  @arg {Pos} cur2  @return {Pos} */
  function cursorMax(cur1, cur2) {
    if (arguments.length > 2) {
      // @ts-ignore
      cur2 = cursorMax.apply(undefined, Array.prototype.slice.call(arguments, 1));
    }
    return cursorIsBefore(cur1, cur2) ? cur2 : cur1;
  }
  /** @arg {Pos} cur1   @arg {Pos} cur2  @arg {Pos} cur3  @return {boolean}*/ 
  function cursorIsBetween(cur1, cur2, cur3) {
    // returns true if cur2 is between cur1 and cur3.
    var cur1before2 = cursorIsBefore(cur1, cur2);
    var cur2before3 = cursorIsBefore(cur2, cur3);
    return cur1before2 && cur2before3;
  }
  /** @arg {CodeMirror} cm  @arg {number} lineNum */
  function lineLength(cm, lineNum) {
    return cm.getLine(lineNum).length;
  }
  /** @arg {string} s */
  function trim(s) {
    if (s.trim) {
      return s.trim();
    }
    return s.replace(/^\s+|\s+$/g, '');
  }
  /** @arg {string} s */
  function escapeRegex(s) {
    return s.replace(/([.?*+$\[\]\/\\(){}|\-])/g, '\\$1');
  }
  /** @arg {CodeMirror} cm  @arg {number} lineNum  @arg {number} column */
  function extendLineToColumn(cm, lineNum, column) {
    var endCh = lineLength(cm, lineNum);
    var spaces = new Array(column-endCh+1).join(' ');
    cm.setCursor(new Pos(lineNum, endCh));
    cm.replaceRange(spaces, cm.getCursor());
  }
  // This functions selects a rectangular block
  // of text with selectionEnd as any of its corner
  // Height of block:
  // Difference in selectionEnd.line and first/last selection.line
  // Width of the block:
  // Distance between selectionEnd.ch and any(first considered here) selection.ch
  /** @arg {CodeMirror} cm  @arg {Pos} selectionEnd */
  function selectBlock(cm, selectionEnd) {
    var selections = [], ranges = cm.listSelections();
    var head = copyCursor(cm.clipPos(selectionEnd));
    var isClipped = !cursorEqual(selectionEnd, head);
    var curHead = cm.getCursor('head');
    var primIndex = getIndex(ranges, curHead);
    var wasClipped = cursorEqual(ranges[primIndex].head, ranges[primIndex].anchor);
    var max = ranges.length - 1;
    var index = max - primIndex > primIndex ? max : 0;
    var base = ranges[index].anchor;

    var firstLine = Math.min(base.line, head.line);
    var lastLine = Math.max(base.line, head.line);
    var baseCh = base.ch, headCh = head.ch;

    var dir = ranges[index].head.ch - baseCh;
    var newDir = headCh - baseCh;
    if (dir > 0 && newDir <= 0) {
      baseCh++;
      if (!isClipped) { headCh--; }
    } else if (dir < 0 && newDir >= 0) {
      baseCh--;
      if (!wasClipped) { headCh++; }
    } else if (dir < 0 && newDir == -1) {
      baseCh--;
      headCh++;
    }
    for (var line = firstLine; line <= lastLine; line++) {
      var range = {anchor: new Pos(line, baseCh), head: new Pos(line, headCh)};
      selections.push(range);
    }
    cm.setSelections(selections);
    selectionEnd.ch = headCh;
    base.ch = baseCh;
    return base;
  }
  /** @arg {CodeMirror} cm  @arg {any} head  @arg {number} height */
  function selectForInsert(cm, head, height) {
    var sel = [];
    for (var i = 0; i < height; i++) {
      var lineHead = offsetCursor(head, i, 0);
      sel.push({anchor: lineHead, head: lineHead});
    }
    cm.setSelections(sel, 0);
  }
  // getIndex returns the index of the cursor in the selections.
  /** @arg {vimState["sel"][]} ranges  @arg {Pos} cursor  @arg {string | undefined} [end] */
  function getIndex(ranges, cursor, end) {
    for (var i = 0; i < ranges.length; i++) {
      var atAnchor = cursorEqual(ranges[i].anchor, cursor);
      var atHead = cursorEqual(ranges[i].head, cursor);
      if (atAnchor || atHead) {
        return i;
      }
    }
    return -1;
  }
  /** @arg {CodeMirror} cm  @arg {vimState} vim  @return {[Pos,Pos]}*/
  function getSelectedAreaRange(cm, vim) {
    var selections = cm.listSelections();
    var start =  selections[0];
    var end = selections[selections.length-1];
    var selectionStart = cursorIsBefore(start.anchor, start.head) ? start.anchor : start.head;
    var selectionEnd = cursorIsBefore(end.anchor, end.head) ? end.head : end.anchor;
    return [selectionStart, selectionEnd];
  }
  // Updates the previous selection with the current selection's values. This
  // should only be called in visual mode.
  /** @arg {CodeMirror} cm @arg {vimState} vim */
  function updateLastSelection(cm, vim) {
    var anchor = vim.sel.anchor;
    var head = vim.sel.head;
    // To accommodate the effect of lastPastedText in the last selection
    if (vim.lastPastedText) {
      head = cm.posFromIndex(cm.indexFromPos(anchor) + vim.lastPastedText.length);
      vim.lastPastedText = undefined;
    }
    vim.lastSelection = {'anchorMark': cm.setBookmark(anchor),
                          'headMark': cm.setBookmark(head),
                          'anchor': copyCursor(anchor),
                          'head': copyCursor(head),
                          'visualMode': vim.visualMode,
                          'visualLine': vim.visualLine,
                          'visualBlock': vim.visualBlock};
  }
  /** @arg {CodeMirrorV} cm @arg {Pos} start @arg {Pos} end @arg {Boolean} [move] @returns {[Pos, Pos]} */
  function expandSelection(cm, start, end, move) {
    var sel = cm.state.vim.sel;
    var head = move ? start: sel.head;
    var anchor = move ? start: sel.anchor;
    var tmp;
    if (cursorIsBefore(end, start)) {
      tmp = end;
      end = start;
      start = tmp;
    }
    if (cursorIsBefore(head, anchor)) {
      head = cursorMin(start, head);
      anchor = cursorMax(anchor, end);
    } else {
      anchor = cursorMin(start, anchor);
      head = cursorMax(head, end);
      head = offsetCursor(head, 0, -1);
      if (head.ch == -1 && head.line != cm.firstLine()) {
        head = new Pos(head.line - 1, lineLength(cm, head.line - 1));
      }
    }
    return [anchor, head];
  }
  /**
   * Updates the CodeMirror selection to match the provided vim selection.
   * If no arguments are given, it uses the current vim selection state.
   * @arg {CodeMirrorV} cm 
   * @arg {vimState["sel"]} [sel] 
   * @arg {"char"|"line"|"block" | undefined} [mode]
   */
  function updateCmSelection(cm, sel, mode) {
    var vim = cm.state.vim;
    sel = sel || vim.sel;
    if (!mode) {
      mode = vim.visualLine ? 'line' : vim.visualBlock ? 'block' : 'char';
    }
    var cmSel = makeCmSelection(cm, sel, mode);
    cm.setSelections(cmSel.ranges, cmSel.primary);
  }
  /**
   * @arg {CodeMirror} cm 
   * @arg {import("./types").CM5RangeInterface} sel
   * @arg {"char"|"line"|"block"} mode 
   * @arg {boolean|undefined} [exclusive] 
   */
  function makeCmSelection(cm, sel, mode, exclusive) {
    var head = copyCursor(sel.head);
    var anchor = copyCursor(sel.anchor);
    if (mode == 'char') {
      var headOffset = !exclusive && !cursorIsBefore(sel.head, sel.anchor) ? 1 : 0;
      var anchorOffset = cursorIsBefore(sel.head, sel.anchor) ? 1 : 0;
      head = offsetCursor(sel.head, 0, headOffset);
      anchor = offsetCursor(sel.anchor, 0, anchorOffset);
      return {
        ranges: [{anchor: anchor, head: head}],
        primary: 0
      };
    } else if (mode == 'line') {
      if (!cursorIsBefore(sel.head, sel.anchor)) {
        anchor.ch = 0;

        var lastLine = cm.lastLine();
        if (head.line > lastLine) {
          head.line = lastLine;
        }
        head.ch = lineLength(cm, head.line);
      } else {
        head.ch = 0;
        anchor.ch = lineLength(cm, anchor.line);
      }
      return {
        ranges: [{anchor: anchor, head: head}],
        primary: 0
      };
    } else if (mode == 'block') {
      var top = Math.min(anchor.line, head.line),
          fromCh = anchor.ch,
          bottom = Math.max(anchor.line, head.line),
          toCh = head.ch;
      if (fromCh < toCh) { toCh += 1; }
      else { fromCh += 1; }      var height = bottom - top + 1;
      var primary = head.line == top ? 0 : height - 1;
      var ranges = [];
      for (var i = 0; i < height; i++) {
        ranges.push({
          anchor: new Pos(top + i, fromCh),
          head: new Pos(top + i, toCh)
        });
      }
      return {
        ranges: ranges,
        primary: primary
      };
    }
    throw "never happens";
  }
  /** @arg {CodeMirror} cm */
  function getHead(cm) {
    var cur = cm.getCursor('head');
    if (cm.getSelection().length == 1) {
      // Small corner case when only 1 character is selected. The "real"
      // head is the left of head and anchor.
      cur = cursorMin(cur, cm.getCursor('anchor'));
    }
    return cur;
  }

  /**
   * If moveHead is set to false, the CodeMirror selection will not be
   * touched. The caller assumes the responsibility of putting the cursor
   * in the right place.
   * @arg {CodeMirrorV} cm 
   * @arg {boolean} [moveHead]
   */
  function exitVisualMode(cm, moveHead) {
    var vim = cm.state.vim;
    if (moveHead !== false) {
      cm.setCursor(clipCursorToContent(cm, vim.sel.head));
    }
    updateLastSelection(cm, vim);
    vim.visualMode = false;
    vim.visualLine = false;
    vim.visualBlock = false;
    if (!vim.insertMode) CM.signal(cm, "vim-mode-change", {mode: "normal"});
  }

  /** 
   * Remove any trailing newlines from the selection. For
   * example, with the caret at the start of the last word on the line,
   * 'dw' should word, but not the newline, while 'w' should advance the
   * caret to the first character of the next line.
   * @arg {CodeMirror} cm
   * @arg {Pos} curStart
   * @arg {Pos} curEnd
   */
  function clipToLine(cm, curStart, curEnd) {
    var selection = cm.getRange(curStart, curEnd);
    // Only clip if the selection ends with trailing newline + whitespace
    if (/\n\s*$/.test(selection)) {
      var lines = selection.split('\n');
      // We know this is all whitespace.
      lines.pop();

      // Cases:
      // 1. Last word is an empty line - do not clip the trailing '\n'
      // 2. Last word is not an empty line - clip the trailing '\n'
      // Find the line containing the last word, and clip all whitespace up
      // to it.
      for (var line = lines.pop(); lines.length > 0 && line && isWhiteSpaceString(line); line = lines.pop()) {
        curEnd.line--;
        curEnd.ch = 0;
      }
      // If the last word is not an empty line, clip an additional newline
      if (line) {
        curEnd.line--;
        curEnd.ch = lineLength(cm, curEnd.line);
      } else {
        curEnd.ch = 0;
      }
    }
  }

  // Expand the selection to line ends.
  /** @arg {CodeMirror} _cm  @arg {Pos} curStart  @arg {Pos} curEnd */
  function expandSelectionToLine(_cm, curStart, curEnd) {
    curStart.ch = 0;
    curEnd.ch = 0;
    curEnd.line++;
  }

  /** @arg {string} [text] */
  function findFirstNonWhiteSpaceCharacter(text) {
    if (!text) {
      return 0;
    }
    var firstNonWS = text.search(/\S/);
    return firstNonWS == -1 ? text.length : firstNonWS;
  }

  /** 
   * @arg {CodeMirror} cm 
   * @arg {{inclusive?: boolean, innerWord?: boolean, bigWord?: boolean, noSymbol?: boolean, multiline?: boolean}} options
   * @arg {Pos} [cursor]
   **/
  function expandWordUnderCursor(cm, {inclusive, innerWord, bigWord, noSymbol, multiline}, cursor) {
    var cur = cursor || getHead(cm);
    var line = cm.getLine(cur.line);
    var endLine = line;
    var startLineNumber = cur.line;
    var endLineNumber = startLineNumber;
    var idx = cur.ch;

    var wordOnNextLine;
    // Seek to first word or non-whitespace character, depending on if
    // noSymbol is true.
    var test = noSymbol ? wordCharTest[0] : bigWordCharTest [0];
    if (innerWord && /\s/.test(line.charAt(idx))) {
      test = function(/** @type {string} */ ch) { return /\s/.test(ch); };
    } else {
      while (!test(line.charAt(idx))) {
        idx++;
        if (idx >= line.length) {
          if (!multiline) return null;
          idx--;
          wordOnNextLine = findWord(cm, cur, true, bigWord, true);
          break
        }
      }

      if (bigWord) {
        test = bigWordCharTest[0];
      } else {
        test = wordCharTest[0];
        if (!test(line.charAt(idx))) {
          test = wordCharTest[1];
        }
      }
    }

    var end = idx, start = idx;
    while (test(line.charAt(start)) && start >= 0) { start--; }
    start++;
    if (wordOnNextLine) {
      end = wordOnNextLine.to;
      endLineNumber = wordOnNextLine.line;
      endLine = cm.getLine(endLineNumber);
      if (!endLine && end == 0) end++;
    } else {
      while (test(line.charAt(end)) && end < line.length) { end++; }
    }

    if (inclusive) {
      // If present, include all whitespace after word.
      // Otherwise, include all whitespace before word, except indentation.
      var wordEnd = end;
      var startsWithSpace = cur.ch <= start && /\s/.test(line.charAt(cur.ch));
      if (!startsWithSpace) {
        while (/\s/.test(endLine.charAt(end)) && end < endLine.length) { end++; }
      }
      if (wordEnd == end || startsWithSpace) {
        var wordStart = start;
        while (/\s/.test(line.charAt(start - 1)) && start > 0) { start--; }
        if (!start && !startsWithSpace) { start = wordStart; }
      }
    }

    return { start: new Pos(startLineNumber, start), end: new Pos(endLineNumber, end) };
  }

  /**
   * Depends on the following:
   *
   * - editor mode should be htmlmixedmode / xml
   * - mode/xml/xml.js should be loaded
   * - addon/fold/xml-fold.js should be loaded
   *
   * If any of the above requirements are not true, this function noops.
   *
   * This is _NOT_ a 100% accurate implementation of vim tag text objects.
   * The following caveats apply (based off cursory testing, I'm sure there
   * are other discrepancies):
   *
   * - Does not work inside comments:
   *   ```
   *   <!-- <div>broken</div> -->
   *   ```
   * - Does not work when tags have different cases:
   *   ```
   *   <div>broken</DIV>
   *   ```
   * - Does not work when cursor is inside a broken tag:
   *   ```
   *   <div><brok><en></div>
   *   ```
   * @arg {CodeMirror} cm 
   * @arg {Pos} head 
   * @arg {boolean} [inclusive]
   */
  function expandTagUnderCursor(cm, head, inclusive) {
    var cur = head;
    if (!CM.findMatchingTag || !CM.findEnclosingTag) {
      return { start: cur, end: cur };
    }

    var tags = CM.findMatchingTag(cm, head) || CM.findEnclosingTag(cm, head);
    if (!tags || !tags.open || !tags.close) {
      return { start: cur, end: cur };
    }

    if (inclusive) {
      return { start: tags.open.from, end: tags.close.to };
    }
    return { start: tags.open.to, end: tags.close.from };
  }

  /** @arg {CodeMirror} cm @arg {Pos} oldCur @arg {Pos} newCur */
  function recordJumpPosition(cm, oldCur, newCur) {
    if (!cursorEqual(oldCur, newCur)) {
      vimGlobalState.jumpList.add(cm, oldCur, newCur);
    }
  }

  /** @arg {number} increment  @arg {{ forward?: any; selectedCharacter?: any; }} args */
  function recordLastCharacterSearch(increment, args) {
      vimGlobalState.lastCharacterSearch.increment = increment;
      vimGlobalState.lastCharacterSearch.forward = args.forward;
      vimGlobalState.lastCharacterSearch.selectedCharacter = args.selectedCharacter;
  }

  /**@type{Record<string, keyof findSymbolModes>} */
  var symbolToMode = {
      '(': 'bracket', ')': 'bracket', '{': 'bracket', '}': 'bracket',
      '[': 'section', ']': 'section',
      '*': 'comment', '/': 'comment',
      'm': 'method', 'M': 'method',
      '#': 'preprocess'
  };

  /** 
    @typedef { {
    lineText: string,
    nextCh: string,
    lastCh: string|null,
    index: number,
    symb: string,
    reverseSymb: any,
    forward?: boolean,
    depth: number,
    curMoveThrough: boolean
  } } findSymbolState */
  /** 
   * @type {Record<string, { 
   *  isComplete(state: findSymbolState): boolean,
   *  init?(state: findSymbolState): void 
   * }>} */
  var findSymbolModes = {
    bracket: {
      isComplete: function(state) {
        if (state.nextCh === state.symb) {
          state.depth++;
          if (state.depth >= 1)return true;
        } else if (state.nextCh === state.reverseSymb) {
          state.depth--;
        }
        return false;
      }
    },
    section: {
      init: function(state) {
        state.curMoveThrough = true;
        state.symb = (state.forward ? ']' : '[') === state.symb ? '{' : '}';
      },
      isComplete: function(state) {
        return state.index === 0 && state.nextCh === state.symb;
      }
    },
    comment: {
      isComplete: function(state) {
        var found = state.lastCh === '*' && state.nextCh === '/';
        state.lastCh = state.nextCh;
        return found;
      }
    },
    // TODO: The original Vim implementation only operates on level 1 and 2.
    // The current implementation doesn't check for code block level and
    // therefore it operates on any levels.
    method: {
      init: function(state) {
        state.symb = (state.symb === 'm' ? '{' : '}');
        state.reverseSymb = state.symb === '{' ? '}' : '{';
      },
      isComplete: function(state) {
        if (state.nextCh === state.symb)return true;
        return false;
      }
    },
    preprocess: {
      init: function(state) {
        state.index = 0;
      },
      isComplete: function(state) {
        if (state.nextCh === '#') {
          var token = state.lineText.match(/^#(\w+)/)?.[1];
          if (token === 'endif') {
            if (state.forward && state.depth === 0) {
              return true;
            }
            state.depth++;
          } else if (token === 'if') {
            if (!state.forward && state.depth === 0) {
              return true;
            }
            state.depth--;
          }
          if (token === 'else' && state.depth === 0)return true;
        }
        return false;
      }
    }      
  };
  /** @arg {CodeMirrorV} cm  @arg {number} repeat  @arg {boolean|undefined} forward  @arg {string} symb */
  function findSymbol(cm, repeat, forward, symb) {
    var cur = copyCursor(cm.getCursor());
    var increment = forward ? 1 : -1;
    var endLine = forward ? cm.lineCount() : -1;
    var curCh = cur.ch;
    var line = cur.line;
    var lineText = cm.getLine(line);
    var state = {
      lineText: lineText,
      nextCh: lineText.charAt(curCh),
      lastCh: null,
      index: curCh,
      symb: symb,
      reverseSymb: (forward ?  { ')': '(', '}': '{' } : { '(': ')', '{': '}' })[symb],
      forward: forward,
      depth: 0,
      curMoveThrough: false
    };
    var mode = symbolToMode[symb];
    if (!mode)return cur;
    var init = findSymbolModes[mode].init;
    var isComplete = findSymbolModes[mode].isComplete;
    if (init) { init(state); }
    while (line !== endLine && repeat) {
      state.index += increment;
      state.nextCh = state.lineText.charAt(state.index);
      if (!state.nextCh) {
        line += increment;
        state.lineText = cm.getLine(line) || '';
        if (increment > 0) {
          state.index = 0;
        } else {
          var lineLen = state.lineText.length;
          state.index = (lineLen > 0) ? (lineLen-1) : 0;
        }
        state.nextCh = state.lineText.charAt(state.index);
      }
      if (isComplete(state)) {
        cur.line = line;
        cur.ch = state.index;
        repeat--;
      }
    }
    if (state.nextCh || state.curMoveThrough) {
      return new Pos(line, state.index);
    }
    return cur;
  }

  /**
   * Returns the boundaries of the next word. If the cursor in the middle of
   * the word, then returns the boundaries of the current word, starting at
   * the cursor. If the cursor is at the start/end of a word, and we are going
   * forward/backward, respectively, find the boundaries of the next word.
   *
   * @arg {CodeMirror} cm CodeMirror object.
   * @arg {Pos} cur The cursor position.
   * @arg {boolean} forward True to search forward. False to search
   *     backward.
   * @arg {boolean|undefined} bigWord True if punctuation count as part of the word.
   *     False if only [a-zA-Z0-9] characters count as part of the word.
   * @arg {boolean|undefined} emptyLineIsWord True if empty lines should be treated
   *     as words.
   * @return {{from:number, to:number, line: number}|null} The boundaries of
   *     the word, or null if there are no more words.
   */
  function findWord(cm, cur, forward, bigWord, emptyLineIsWord) {
    var lineNum = cur.line;
    var pos = cur.ch;
    var line = cm.getLine(lineNum);
    var dir = forward ? 1 : -1;
    var charTests = bigWord ? bigWordCharTest: wordCharTest;

    if (emptyLineIsWord && line == '') {
      lineNum += dir;
      line = cm.getLine(lineNum);
      if (!isLine(cm, lineNum)) {
        return null;
      }
      pos = (forward) ? 0 : line.length;
    }

    while (true) {
      if (emptyLineIsWord && line == '') {
        return { from: 0, to: 0, line: lineNum };
      }
      var stop = (dir > 0) ? line.length : -1;
      var wordStart = stop, wordEnd = stop;
      // Find bounds of next word.
      while (pos != stop) {
        var foundWord = false;
        for (var i = 0; i < charTests.length && !foundWord; ++i) {
          if (charTests[i](line.charAt(pos))) {
            wordStart = pos;
            // Advance to end of word.
            while (pos != stop && charTests[i](line.charAt(pos))) {
              pos += dir;
            }
            wordEnd = pos;
            foundWord = wordStart != wordEnd;
            if (wordStart == cur.ch && lineNum == cur.line &&
                wordEnd == wordStart + dir) {
              // We started at the end of a word. Find the next one.
              continue;
            } else {
              return {
                from: Math.min(wordStart, wordEnd + 1),
                to: Math.max(wordStart, wordEnd),
                line: lineNum };
            }
          }
        }
        if (!foundWord) {
          pos += dir;
        }
      }
      // Advance to next/prev line.
      lineNum += dir;
      if (!isLine(cm, lineNum)) {
        return null;
      }
      line = cm.getLine(lineNum);
      pos = (dir > 0) ? 0 : line.length;
    }
  }

  /**
   * @arg {CodeMirror} cm CodeMirror object.
   * @arg {Pos} cur The position to start from.
   * @arg {number} repeat Number of words to move past.
   * @arg {boolean} forward True to search forward. False to search
   *     backward.
   * @arg {boolean} wordEnd True to move to end of word. False to move to
   *     beginning of word.
   * @arg {boolean} bigWord True if punctuation count as part of the word.
   *     False if only alphabet characters count as part of the word.
   * @return {Pos|undefined} The position the cursor should move to.
   */
  function moveToWord(cm, cur, repeat, forward, wordEnd, bigWord) {
    var curStart = copyCursor(cur);
    var words = [];
    if (forward && !wordEnd || !forward && wordEnd) {
      repeat++;
    }
    // For 'e', empty lines are not considered words, go figure.
    var emptyLineIsWord = !(forward && wordEnd);
    for (var i = 0; i < repeat; i++) {
      var word = findWord(cm, cur, forward, bigWord, emptyLineIsWord);
      if (!word) {
        var eodCh = lineLength(cm, cm.lastLine());
        words.push(forward
            ? {line: cm.lastLine(), from: eodCh, to: eodCh}
            : {line: 0, from: 0, to: 0});
        break;
      }
      words.push(word);
      cur = new Pos(word.line, forward ? (word.to - 1) : word.from);
    }
    var shortCircuit = words.length != repeat;
    var firstWord = words[0];
    var lastWord = words.pop();
    if (forward && !wordEnd) {
      // w
      if (!shortCircuit && (firstWord.from != curStart.ch || firstWord.line != curStart.line)) {
        // We did not start in the middle of a word. Discard the extra word at the end.
        lastWord = words.pop();
      }
      return lastWord && new Pos(lastWord.line, lastWord.from);
    } else if (forward && wordEnd) {
      return lastWord && new Pos(lastWord.line, lastWord.to - 1);
    } else if (!forward && wordEnd) {
      // ge
      if (!shortCircuit && (firstWord.to != curStart.ch || firstWord.line != curStart.line)) {
        // We did not start in the middle of a word. Discard the extra word at the end.
        lastWord = words.pop();
      }
      return lastWord && new Pos(lastWord.line, lastWord.to);
    } else {
      // b
      return lastWord && new Pos(lastWord.line, lastWord.from);
    }
  }

  /**
   * @arg {CodeMirror} cm 
   * @arg {Pos} head 
   * @arg {MotionArgs} motionArgs 
   * @arg {vimState} vim 
   * @arg {boolean} keepHPos */
  function moveToEol(cm, head, motionArgs, vim, keepHPos) {
    var cur = head;
    var retval= new Pos(cur.line + motionArgs.repeat - 1, Infinity);
    var end=cm.clipPos(retval);
    end.ch--;
    if (!keepHPos) {
      vim.lastHPos = Infinity;
      vim.lastHSPos = cm.charCoords(end,'div').left;
    }
    return retval;
  }

  /** 
   * @arg {CodeMirror} cm 
   * @arg {number} repeat 
   * @arg {boolean} [forward]
   * @arg {string} [character]
   * @arg {Pos} [head]
   */
  function moveToCharacter(cm, repeat, forward, character, head) {
    if (!character) return;
    var cur = head || cm.getCursor();
    var start = cur.ch;
    var idx;
    for (var i = 0; i < repeat; i ++) {
      var line = cm.getLine(cur.line);
      idx = charIdxInLine(start, line, character, forward);
      if (idx == -1) {
        return undefined;
      }
      start = idx;
    }
    if (idx != undefined)
      return new Pos(cm.getCursor().line, idx);
  }

  /** @arg {CodeMirrorV} cm @arg {number} repeat */
  function moveToColumn(cm, repeat) {
    // repeat is always >= 1, so repeat - 1 always corresponds
    // to the column we want to go to.
    var line = cm.getCursor().line;
    return clipCursorToContent(cm, new Pos(line, repeat - 1));
  }

  /**
   * @arg {CodeMirror} cm 
   * @arg {vimState} vim 
   * @arg {string} markName 
   * @arg {Pos} pos */
  function updateMark(cm, vim, markName, pos) {
    if (!inArray(markName, validMarks) && !latinCharRegex.test(markName)) {
      return;
    }
    if (vim.marks[markName]) {
      vim.marks[markName].clear();
    }
    vim.marks[markName] = cm.setBookmark(pos);
  }

  /**
   * @arg {number} start 
   * @arg {string | any[]} line 
   * @arg {any} character 
   * @arg {boolean} [forward] 
   * @arg {boolean} [includeChar] */
  function charIdxInLine(start, line, character, forward, includeChar) {
    // Search for char in line.
    // motion_options: {forward, includeChar}
    // If includeChar = true, include it too.
    // If forward = true, search forward, else search backwards.
    // If char is not found on this line, do nothing
    var idx;
    if (forward) {
      idx = line.indexOf(character, start + 1);
    } else {
      idx = line.lastIndexOf(character, start - 1);
    }
    return idx;
  }

  /** @arg {CodeMirrorV} cm 
   * @arg {Pos} head 
   * @arg {number} repeat 
   * @arg {number} dir 
   * @arg {boolean} [inclusive] */
  function findParagraph(cm, head, repeat, dir, inclusive) {
    var line = head.line;
    var min = cm.firstLine();
    var max = cm.lastLine();
    var start, end, i = line;
    /** @arg {number} i */
    function isEmpty(i) { return !cm.getLine(i); }
    /** @arg {number} i @arg {number} dir @arg {boolean} [any] */
    function isBoundary(i, dir, any) {
      if (any) { return isEmpty(i) != isEmpty(i + dir); }
      return !isEmpty(i) && isEmpty(i + dir);
    }
    if (dir) {
      while (min <= i && i <= max && repeat > 0) {
        if (isBoundary(i, dir)) { repeat--; }
        i += dir;
      }
      return {start: new Pos(i, 0), end: head};
    }

    var vim = cm.state.vim;
    if (vim.visualLine && isBoundary(line, 1, true)) {
      var anchor = vim.sel.anchor;
      if (isBoundary(anchor.line, -1, true)) {
        if (!inclusive || anchor.line != line) {
          line += 1;
        }
      }
    }
    var startState = isEmpty(line);
    for (i = line; i <= max && repeat; i++) {
      if (isBoundary(i, 1, true)) {
        if (!inclusive || isEmpty(i) != startState) {
          repeat--;
        }
      }
    }
    end = new Pos(i, 0);
    // select boundary before paragraph for the last one
    if (i > max && !startState) { startState = true; }
    else { inclusive = false; }
    for (i = line; i > min; i--) {
      if (!inclusive || isEmpty(i) == startState || i == line) {
        if (isBoundary(i, -1, true)) { break; }
      }
    }
    start = new Pos(i, 0);
    return { start: start, end: end };
  }

  /**
   * Based on {@link findSentence}. The internal functions have the same names,
   * but their behaviour is different. findSentence() crosses line breaks and 
   * is used for jumping to sentence beginnings before or after the current cursor position, 
   * whereas getSentence() is for getting the beginning or end of the sentence 
   * at the current cursor position, either including (a) or excluding (i) whitespace.
   * @arg {CodeMirror} cm
   * @arg {Pos} cur
   * @arg {number} repeat
   * @arg {1|-1} dir
   * @arg {boolean} inclusive
   */
  function getSentence(cm, cur, repeat, dir, inclusive /*includes whitespace*/) {

    /**
      Takes an index object
      @arg {{
        line: string|null,
        ln:  number,
        pos: number,
        dir: -1|1
      }} curr
      and modifies the pos member to represent the
      next valid position or sets the line to null if there are
      no more valid positions.
      */
    function nextChar(curr) {
      if (curr.line === null) return;
      if (curr.pos + curr.dir < 0 || curr.pos + curr.dir >= curr.line.length) {
        curr.line = null;
      }
      else {
        curr.pos += curr.dir;
      }
    }
    /**
     * Performs one iteration of traversal in forward direction
     * Returns an index object of the sentence end
     * @arg {CodeMirror} cm
     * @arg {number} ln
     * @arg {number} pos
     * @arg {1|-1} dir
     */
    function forward(cm, ln, pos, dir) {
      var line = cm.getLine(ln);

      var curr = {
        line: line,
        ln: ln,
        pos: pos,
        dir: dir,
      };

      if (curr.line === "") {
        return { ln: curr.ln, pos: curr.pos };
      }

      var lastSentencePos = curr.pos;

      // Move one step to skip character we start on
      nextChar(curr);

      while (curr.line !== null) {
        lastSentencePos = curr.pos;
        if (isEndOfSentenceSymbol(curr.line[curr.pos])) {
          if (!inclusive) {
            return { ln: curr.ln, pos: curr.pos + 1 };
          } 
          else {
            nextChar(curr);
            while (curr.line !== null ) {
              if (isWhiteSpaceString(curr.line[curr.pos])) {
                lastSentencePos = curr.pos;
                nextChar(curr);
              } 
              else {
                break;
              }
            }
            return { ln: curr.ln, pos: lastSentencePos + 1 };
          }
        }
        nextChar(curr);
      }
      return { ln: curr.ln, pos: lastSentencePos + 1 };
    }

    /** 
     * Performs one iteration of traversal in reverse direction
     * Returns an index object of the sentence start
     * @arg {CodeMirror} cm  
     * @arg {number} ln  
     * @arg {number} pos  
     * @arg {1|-1} dir
     */
    function reverse(cm, ln, pos, dir) {
      var line = cm.getLine(ln);

      var curr = {
        line: line,
        ln: ln,
        pos: pos,
        dir: dir,
      };

      if (curr.line === "") {
        return { ln: curr.ln, pos: curr.pos };
      }

      var lastSentencePos = curr.pos;

      // Move one step to skip character we start on
      nextChar(curr);

      while (curr.line !== null) {
        if (!isWhiteSpaceString(curr.line[curr.pos]) && !isEndOfSentenceSymbol(curr.line[curr.pos])) {
          lastSentencePos = curr.pos;
        }

        else if (isEndOfSentenceSymbol(curr.line[curr.pos]) ) {
          if (!inclusive) {
            return { ln: curr.ln, pos: lastSentencePos };
          } 
          else {
            if (isWhiteSpaceString(curr.line[curr.pos + 1])) {
              return { ln: curr.ln, pos: curr.pos + 1 };
            } 
            else {
              return { ln: curr.ln, pos: lastSentencePos };
            }
          }
        }

        nextChar(curr);
      }
      curr.line = line;
      if (inclusive && isWhiteSpaceString(curr.line[curr.pos])) {
        return { ln: curr.ln, pos: curr.pos };
      } 
      else {
        return { ln: curr.ln, pos: lastSentencePos };
      }

    }

    var curr_index = {
      ln: cur.line,
      pos: cur.ch,
    };

    while (repeat > 0) {
      if (dir < 0) {
        curr_index = reverse(cm, curr_index.ln, curr_index.pos, dir);
      }
      else {
        curr_index = forward(cm, curr_index.ln, curr_index.pos, dir);
      }
      repeat--;
    }

    return new Pos(curr_index.ln, curr_index.pos);
  }
  /**
   * @arg {CodeMirror} cm
   * @arg {Pos} cur
   * @arg {number} repeat
   * @arg {number} dir
   */
  function findSentence(cm, cur, repeat, dir) {

      /**
       * @arg {CodeMirror} cm
        Takes an index object
        @arg { {
          line: string|null,
          ln: number, // line number
          pos: number, // index in line,
          dir: number // direction of traversal (-1 or 1)
        }} idx
        and modifies the line, ln, and pos members to represent the
        next valid position or sets them to null if there are
        no more valid positions.
      */
    function nextChar(cm, idx) {
      if (idx.line === null) return;
      if (idx.pos + idx.dir < 0 || idx.pos + idx.dir >= idx.line.length) {
        idx.ln += idx.dir;
        if (!isLine(cm, idx.ln)) {
          idx.line = null;
          return;
        }
        idx.line = cm.getLine(idx.ln);
        idx.pos = (idx.dir > 0) ? 0 : idx.line.length - 1;
      }
      else {
        idx.pos += idx.dir;
      }
    }

    /*
      Performs one iteration of traversal in forward direction
      Returns an index object of the new location
      */
    /** @arg {CodeMirror} cm @arg {number} ln  @arg {number} pos  @arg {number} dir */
    function forward(cm, ln, pos, dir) {
      var line = cm.getLine(ln);
      var stop = (line === "");

      var curr = {
        line: line,
        ln: ln,
        pos: pos,
        dir: dir,
      };

      var last_valid = {
        ln: curr.ln,
        pos: curr.pos,
      };

      var skip_empty_lines = (curr.line === "");

      // Move one step to skip character we start on
      nextChar(cm, curr);

      while (curr.line !== null) {
        last_valid.ln = curr.ln;
        last_valid.pos = curr.pos;

        if (curr.line === "" && !skip_empty_lines) {
          return { ln: curr.ln, pos: curr.pos, };
        }
        else if (stop && curr.line !== "" && !isWhiteSpaceString(curr.line[curr.pos])) {
          return { ln: curr.ln, pos: curr.pos, };
        }
        else if (isEndOfSentenceSymbol(curr.line[curr.pos])
          && !stop
          && (curr.pos === curr.line.length - 1
            || isWhiteSpaceString(curr.line[curr.pos + 1]))) {
          stop = true;
        }

        nextChar(cm, curr);
      }

      /*
        Set the position to the last non whitespace character on the last
        valid line in the case that we reach the end of the document.
      */
      var line = cm.getLine(last_valid.ln);
      last_valid.pos = 0;
      for(var i = line.length - 1; i >= 0; --i) {
        if (!isWhiteSpaceString(line[i])) {
          last_valid.pos = i;
          break;
        }
      }

      return last_valid;

    }

    /**
     * Performs one iteration of traversal in reverse direction
     * Returns an index object of the new location
     * @arg {CodeMirror} cm  @arg {number} ln  @arg {number} pos  @arg {number} dir
     */
    function reverse(cm, ln, pos, dir) {
      var line = cm.getLine(ln);

      var curr = {
        line: line,
        ln: ln,
        pos: pos,
        dir: dir,
      };

      var last_valid_ln = curr.ln;
      /**@type{number|null}*/var last_valid_pos = null;

      var skip_empty_lines = (curr.line === "");

      // Move one step to skip character we start on
      nextChar(cm, curr);

      while (curr.line !== null) {

        if (curr.line === "" && !skip_empty_lines) {
          if (last_valid_pos !== null) {
            return { ln: last_valid_ln, pos: last_valid_pos };
          }
          else {
            return { ln: curr.ln, pos: curr.pos };
          }
        }
        else if (isEndOfSentenceSymbol(curr.line[curr.pos])
            && last_valid_pos !== null
            && !(curr.ln === last_valid_ln && curr.pos + 1 === last_valid_pos)) {
          return { ln: last_valid_ln, pos: last_valid_pos  };
        }
        else if (curr.line !== "" && !isWhiteSpaceString(curr.line[curr.pos])) {
          skip_empty_lines = false;
          last_valid_ln = curr.ln;
          last_valid_pos = curr.pos;
        }

        nextChar(cm, curr);
      }

      /*
        Set the position to the first non whitespace character on the last
        valid line in the case that we reach the beginning of the document.
      */
      var line = cm.getLine(last_valid_ln);
      last_valid_pos = 0;
      for(var i = 0; i < line.length; ++i) {
        if (!isWhiteSpaceString(line[i])) {
          last_valid_pos = i;
          break;
        }
      }
      return { ln: last_valid_ln, pos: last_valid_pos };
    }

    var curr_index = {
      ln: cur.line,
      pos: cur.ch,
    };

    while (repeat > 0) {
      if (dir < 0) {
        curr_index = reverse(cm, curr_index.ln, curr_index.pos, dir);
      }
      else {
        curr_index = forward(cm, curr_index.ln, curr_index.pos, dir);
      }
      repeat--;
    }

    return new Pos(curr_index.ln, curr_index.pos);
  }

  // TODO: perhaps this finagling of start and end positions belongs
  // in codemirror/replaceRange?
  /** @arg {CodeMirror} cm  @arg {Pos} head @arg {string | number} symb @arg {boolean} inclusive */
  function selectCompanionObject(cm, head, symb, inclusive) {
    var cur = head;

    var bracketRegexp = ({
      '(': /[()]/, ')': /[()]/,
      '[': /[[\]]/, ']': /[[\]]/,
      '{': /[{}]/, '}': /[{}]/,
      '<': /[<>]/, '>': /[<>]/})[symb];
    var openSym = ({
      '(': '(', ')': '(',
      '[': '[', ']': '[',
      '{': '{', '}': '{',
      '<': '<', '>': '<'})[symb];
    var curChar = cm.getLine(cur.line).charAt(cur.ch);
    // Due to the behavior of scanForBracket, we need to add an offset if the
    // cursor is on a matching open bracket.
    var offset = curChar === openSym ? 1 : 0;

    var startBracket = cm.scanForBracket(new Pos(cur.line, cur.ch + offset), -1, undefined, {'bracketRegex': bracketRegexp});
    var endBracket = cm.scanForBracket(new Pos(cur.line, cur.ch + offset), 1, undefined, {'bracketRegex': bracketRegexp});

    if (!startBracket || !endBracket) return null;

    var start = startBracket.pos; 
    var end = endBracket.pos;

    if ((start.line == end.line && start.ch > end.ch)
        || (start.line > end.line)) {
      var tmp = start;
      start = end;
      end = tmp;
    }

    if (inclusive) {
      end.ch += 1;
    } else {
      start.ch += 1;
    }

    return { start: start, end: end };
  }

  // Takes in a symbol and a cursor and tries to simulate text objects that
  // have identical opening and closing symbols
  // TODO support across multiple lines
  /** @arg {CodeMirror} cm  @arg {Pos} head  @arg {string} symb @arg {boolean} inclusive */
  function findBeginningAndEnd(cm, head, symb, inclusive) {
    var cur = copyCursor(head);
    var line = cm.getLine(cur.line);
    var chars = line.split('');
    var start, end, i, len;
    var firstIndex = chars.indexOf(symb);

    // the decision tree is to always look backwards for the beginning first,
    // but if the cursor is in front of the first instance of the symb,
    // then move the cursor forward
    if (cur.ch < firstIndex) {
      cur.ch = firstIndex;
    }
    // otherwise if the cursor is currently on the closing symbol
    else if (firstIndex < cur.ch && chars[cur.ch] == symb) {
      var stringAfter = /string/.test(cm.getTokenTypeAt(offsetCursor(head, 0, 1)));
      var stringBefore = /string/.test(cm.getTokenTypeAt(head));
      var isStringStart = stringAfter && !stringBefore;
      if (!isStringStart) {
        end = cur.ch; // assign end to the current cursor
        --cur.ch; // make sure to look backwards
      }
    }

    // if we're currently on the symbol, we've got a start
    if (chars[cur.ch] == symb && !end) {
      start = cur.ch + 1; // assign start to ahead of the cursor
    } else {
      // go backwards to find the start
      for (i = cur.ch; i > -1 && !start; i--) {
        if (chars[i] == symb) {
          start = i + 1;
        }
      }
    }

    // look forwards for the end symbol
    if (start && !end) {
      for (i = start, len = chars.length; i < len && !end; i++) {
        if (chars[i] == symb) {
          end = i;
        }
      }
    }

    // nothing found
    if (!start || !end) {
      return { start: cur, end: cur };
    }

    // include the symbols
    if (inclusive) {
      --start; ++end;
    }

    return {
      start: new Pos(cur.line, start),
      end: new Pos(cur.line, end)
    };
  }

  // Search functions
  defineOption('pcre', true, 'boolean');
  
  /**@type {SearchStateInterface} */
  class SearchState {
    constructor() {
      /**@type{number|undefined} */
      this.highlightTimeout;
    }
    getQuery() {
      return vimGlobalState.query;
    };
    setQuery(query) {
      vimGlobalState.query = query;
    };
    getOverlay() {
      return this.searchOverlay;
    };
    setOverlay(overlay) {
      this.searchOverlay = overlay;
    };
    isReversed() {
      return vimGlobalState.isReversed;
    };
    setReversed(reversed) {
      vimGlobalState.isReversed = reversed;
    };
    getScrollbarAnnotate() {
      return this.annotate;
    };
    setScrollbarAnnotate(annotate) {
      this.annotate = annotate;
    };
  }  /** @arg {CodeMirrorV} cm @returns {SearchStateInterface} */
  function getSearchState(cm) {
    var vim = cm.state.vim;
    return vim.searchState_ || (vim.searchState_ = new SearchState());
  }
  /** @arg {string} argString */
  function splitBySlash(argString) {
    return splitBySeparator(argString, '/');
  }

  /** @arg {string} argString */
  function findUnescapedSlashes(argString) {
    return findUnescapedSeparators(argString, '/');
  }

  /** @arg {string} argString  @arg {string} separator */
  function splitBySeparator(argString, separator) {
    var slashes = findUnescapedSeparators(argString, separator) || [];
    if (!slashes.length) return [];
    var tokens = [];
    // in case of strings like foo/bar
    if (slashes[0] !== 0) return;
    for (var i = 0; i < slashes.length; i++) {
      if (typeof slashes[i] == 'number')
        tokens.push(argString.substring(slashes[i] + 1, slashes[i+1]));
    }
    return tokens;
  }

  /** @arg {string} str  @arg {string} separator */
  function findUnescapedSeparators(str, separator) {
    if (!separator)
      separator = '/';

    var escapeNextChar = false;
    var slashes = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.charAt(i);
      if (!escapeNextChar && c == separator) {
        slashes.push(i);
      }
      escapeNextChar = !escapeNextChar && (c == '\\');
    }
    return slashes;
  }

  // Translates a search string from ex (vim) syntax into javascript form.
  /** @arg {string} str */
  function translateRegex(str) {
    // When these match, add a '\' if unescaped or remove one if escaped.
    var modes = {
      V: '|(){+?*.[$^', // verynomagic
      M: '|(){+?*.[', // nomagic
      m: '|(){+?', // magic
      v: '<>', // verymagic
    };
    var escapes = {
      '>': '(?<=[\\w])(?=[^\\w]|$)',
      '<': '(?<=[^\\w]|^)(?=[\\w])',
    };
    var specials = modes.m;
    var regex = str.replace(/\\.|[\[|(){+*?.$^<>]/g, function(match) {
      if (match[0] === '\\') {
        var nextChar = match[1];
        if (nextChar === '}' || specials.indexOf(nextChar) != -1) {
          return nextChar;
        }
        if (nextChar in modes) {
           specials = modes[nextChar];
           return '';
        }
        if (nextChar in escapes) {
          return escapes[nextChar];
        }
        return match;
      } else {
        if (specials.indexOf(match) != -1) {
          return escapes[match] || '\\' + match; 
        }
        return match;
      }
    });

    var i = regex.indexOf('\\zs');
    if (i != -1) {
      regex = '(?<=' + regex.slice(0, i) + ')' + regex.slice(i + 3);
    }
    i = regex.indexOf('\\ze');
    if (i != -1) {
      regex = regex.slice(0, i) +  '(?=' + regex.slice(i + 3) + ')';
    }

    return regex;
  }

  // Translates the replace part of a search and replace from ex (vim) syntax into
  // javascript form.  Similar to translateRegex, but additionally fixes back references
  // (translates '\[0..9]' to '$[0..9]') and follows different rules for escaping '$'.
  /** @type{Object<string, string>} */
  var charUnescapes = {'\\n': '\n', '\\r': '\r', '\\t': '\t'};
  /** @arg {string} str */
  function translateRegexReplace(str) {
    var escapeNextChar = false;
    var out = [];
    for (var i = -1; i < str.length; i++) {
      var c = str.charAt(i) || '';
      var n = str.charAt(i+1) || '';
      if (charUnescapes[c + n]) {
        out.push(charUnescapes[c+n]);
        i++;
      } else if (escapeNextChar) {
        // At any point in the loop, escapeNextChar is true if the previous
        // character was a '\' and was not escaped.
        out.push(c);
        escapeNextChar = false;
      } else {
        if (c === '\\') {
          escapeNextChar = true;
          if ((isNumber(n) || n === '$')) {
            out.push('$');
          } else if (n !== '/' && n !== '\\') {
            out.push('\\');
          }
        } else {
          if (c === '$') {
            out.push('$');
          }
          out.push(c);
          if (n === '/') {
            out.push('\\');
          }
        }
      }
    }
    return out.join('');
  }

  // Unescape \ and / in the replace part, for PCRE mode.
  /** @type{Record<string, string>} */
  var unescapes = {'\\/': '/', '\\\\': '\\', '\\n': '\n', '\\r': '\r', '\\t': '\t', '\\&':'&'};
  /** @arg {string} str */
  function unescapeRegexReplace(str) {
    var stream = new CM.StringStream(str);
    var output = [];
    while (!stream.eol()) {
      // Search for \.
      while (stream.peek() && stream.peek() != '\\') {
        output.push(stream.next());
      }
      var matched = false;
      for (var matcher in unescapes) {
        if (stream.match(matcher, true)) {
          matched = true;
          output.push(unescapes[matcher]);
          break;
        }
      }
      if (!matched) {
        // Don't change anything
        output.push(stream.next());
      }
    }
    return output.join('');
  }

  /**
   * Extract the regular expression from the query and return a Regexp object.
   * Returns null if the query is blank.
   * If ignoreCase is passed in, the Regexp object will have the 'i' flag set.
   * If smartCase is passed in, and the query contains upper case letters,
   *   then ignoreCase is overridden, and the 'i' flag will not be set.
   * If the query contains the /i in the flag part of the regular expression,
   *   then both ignoreCase and smartCase are ignored, and 'i' will be passed
   *   through to the Regex object.
   * @arg {string} query
   * @arg {boolean} ignoreCase
   * @arg {boolean} smartCase
   */
  function parseQuery(query, ignoreCase, smartCase) {
    // First update the last search register
    var lastSearchRegister = vimGlobalState.registerController.getRegister('/');
    lastSearchRegister.setText(query);
    // First try to extract regex + flags from the input. If no flags found,
    // extract just the regex. IE does not accept flags directly defined in
    // the regex string in the form /regex/flags
    var slashes = findUnescapedSlashes(query);
    var regexPart;
    var forceIgnoreCase;
    if (!slashes.length) {
      // Query looks like 'regexp'
      regexPart = query;
    } else {
      // Query looks like 'regexp/...'
      regexPart = query.substring(0, slashes[0]);
      var flagsPart = query.substring(slashes[0]);
      forceIgnoreCase = (flagsPart.indexOf('i') != -1);
    }
    if (!regexPart) {
      return null;
    }
    if (!getOption('pcre')) {
      regexPart = translateRegex(regexPart);
    }
    if (smartCase) {
      ignoreCase = (/^[^A-Z]*$/).test(regexPart);
    }
    var regexp = new RegExp(regexPart,
        (ignoreCase || forceIgnoreCase) ? 'im' : 'm');
    return regexp;
  }

  /**
   * dom - Document Object Manipulator
   * Usage:
   *   dom('<tag>'|<node>[, ...{<attributes>|<$styles>}|<child-node>|'<text>'])
   * Examples:
   *   dom('div', {id:'xyz'}, dom('p', 'CM rocks!', {$color:'red'}))
   *   dom(document.head, dom('script', 'alert("hello!")'))
   * Not supported:
   *   dom('p', ['arrays are objects'], Error('objects specify attributes'))
   * @arg {string | HTMLElement } n
   */
  function dom(n) {
    if (typeof n === 'string') n = document.createElement(n);
    for (var i = 1; i < arguments.length; i++) {
      var a = arguments[i];
      if (!a) continue;
      if (typeof a !== 'object') a = document.createTextNode(a);
      if (a.nodeType) n.appendChild(a);
      else for (var key in a) {
        if (!Object.prototype.hasOwnProperty.call(a, key)) continue;
        if (key[0] === '$') n.style[key.slice(1)] = a[key];
        else if (typeof a[key] == "function") n[key] = a[key];
        else n.setAttribute(key, a[key]);
      }
    }
    return n;
  }

  /** @arg {CodeMirror} cm  @arg {any} template  @arg {boolean} [long]*/
  function showConfirm(cm, template, long) {
    var pre = dom('div', {$color: 'red', $whiteSpace: 'pre', class: 'cm-vim-message'}, template);
    if (cm.openNotification) {
      if (long) {
        pre = dom('div', {}, pre, dom('div', {}, 'Press ENTER or type command to continue'));
        if (cm.state.closeVimNotification) {
          cm.state.closeVimNotification();
        }
        cm.state.closeVimNotification = cm.openNotification(pre, {bottom: true, duration: 0});
      } else {
        cm.openNotification(pre, {bottom: true, duration: 15000});
      }
    } else {
      alert(pre.innerText);
    }
  }
  /** @arg {string|HTMLElement} prefix  @arg {string|HTMLElement} [desc] */
  function makePrompt(prefix, desc) {
    return dom('div', {$display: 'flex', $flex: 1},
              dom('span', {$fontFamily: 'monospace', $whiteSpace: 'pre', $flex: 1, $display: 'flex'},
                prefix,
                dom('input', {type: 'text', autocorrect: 'off',
                              autocapitalize: 'off', spellcheck: 'false', $flex: 1})),
              desc && dom('span', {$color: '#888'}, desc));
  }
  /**
   * @arg {CodeMirror} cm 
   * @arg {import("./types").PromptOptions} options 
   */
  function showPrompt(cm, options) {
    if (keyToKeyStack.length) {
      if (!options.value) options.value = '';
      virtualPrompt = options;
      return;
    }
    var template = makePrompt(options.prefix, options.desc);
    if (cm.openDialog) {
      cm.openDialog(template, options.onClose, {
        onKeyDown: options.onKeyDown, onKeyUp: options.onKeyUp,
        bottom: true, selectValueOnOpen: false, value: options.value
      });
    }
    else {
      var shortText = '';
      if (typeof options.prefix != "string" && options.prefix) shortText += options.prefix.textContent;
      if (options.desc) shortText += " " + options.desc;
      options.onClose?.(prompt(shortText, ''));
    }
  }

  /** @arg {RegExp|unknown} r1  @arg {RegExp|unknown} r2 */
  function regexEqual(r1, r2) {
    if (r1 instanceof RegExp && r2 instanceof RegExp) {
      return r1.flags == r2.flags && r1.source == r2.source;
    }
    return false;
  }
  // Returns true if the query is valid.
  /**
   * @arg {CodeMirrorV} cm 
   * @arg {string } rawQuery 
   * @arg {boolean | undefined} [ignoreCase] 
   * @arg {boolean | undefined} [smartCase]
  */
  function updateSearchQuery(cm, rawQuery, ignoreCase, smartCase) {
    if (!rawQuery) {
      return;
    }
    var state = getSearchState(cm);
    var query = parseQuery(rawQuery, !!ignoreCase, !!smartCase);
    if (!query) {
      return;
    }
    highlightSearchMatches(cm, query);
    if (regexEqual(query, state.getQuery())) {
      return query;
    }
    state.setQuery(query);
    return query;
  }
  /** @arg {RegExp} query */
  function searchOverlay(query) {
    if (query.source.charAt(0) == '^') {
      var matchSol = true;
    }
    return {
      token: function(stream) {
        if (matchSol && !stream.sol()) {
          stream.skipToEnd();
          return;
        }
        var match = stream.match(query, false);
        if (match) {
          if (match[0].length == 0) {
            // Matched empty string, skip to next.
            stream.next();
            return 'searching';
          }
          if (!stream.sol()) {
            // Backtrack 1 to match \b
            stream.backUp(1);
            if (!query.exec(stream.next() + match[0])) {
              stream.next();
              return null;
            }
          }
          stream.match(query);
          return 'searching';
        }
        while (!stream.eol()) {
          stream.next();
          if (stream.match(query, false)) break;
        }
      },
      query: query
    };
  }
  var highlightTimeout = 0;
  /** @arg {CodeMirrorV} cm  @arg {RegExp} query */
  function highlightSearchMatches(cm, query) {
    clearTimeout(highlightTimeout);
    var searchState = getSearchState(cm);
    searchState.highlightTimeout = highlightTimeout;
    highlightTimeout = setTimeout(function() {
      if (!cm.state.vim) return;
      var searchState = getSearchState(cm);
      searchState.highlightTimeout = undefined;
      var overlay = searchState.getOverlay();
      if (!overlay || query != overlay.query) {
        if (overlay) {
          cm.removeOverlay(overlay);
        }
        overlay = searchOverlay(query);
        cm.addOverlay(overlay);
        if (cm.showMatchesOnScrollbar) {
          if (searchState.getScrollbarAnnotate()) {
            searchState.getScrollbarAnnotate().clear();
          }
          searchState.setScrollbarAnnotate(cm.showMatchesOnScrollbar(query));
        }
        searchState.setOverlay(overlay);
      }
    }, 50);
  }
  /** @arg {CodeMirror} cm @arg {boolean} prev @arg {RegExp} query @arg {number | undefined} [repeat] */
  function findNext(cm, prev, query, repeat) {
    return cm.operation(function() {
      if (repeat === undefined) { repeat = 1; }
      var pos = cm.getCursor();
      var cursor = cm.getSearchCursor(query, pos);
      for (var i = 0; i < repeat; i++) {
        var found = cursor.find(prev);
        // @ts-ignore
        if (i == 0 && found && cursorEqual(cursor.from(), pos)) {
          var lastEndPos = prev ? cursor.from() : cursor.to();
          found = cursor.find(prev);
          // @ts-ignore
          if (found && !found[0] && cursorEqual(cursor.from(), lastEndPos)) {
            // @ts-ignore
            if (cm.getLine(lastEndPos.line).length == lastEndPos.ch)
              found = cursor.find(prev);
          }
        }
        if (!found) {
          // SearchCursor may have returned null because it hit EOF, wrap
          // around and try again.
          cursor = cm.getSearchCursor(query,
              // @ts-ignore
              (prev) ? new Pos(cm.lastLine()) : new Pos(cm.firstLine(), 0) );
          if (!cursor.find(prev)) {
            return;
          }
        }
      }
      return cursor.from();
    });
  }
  /**
   * Pretty much the same as `findNext`, except for the following differences:
   *
   * 1. Before starting the search, move to the previous search. This way if our cursor is
   * already inside a match, we should return the current match.
   * 2. Rather than only returning the cursor's from, we return the cursor's from and to as a tuple.
   * @arg {CodeMirror} cm
   * @arg {boolean} prev
   * @arg {RegExp} query
   * @arg {number | undefined} repeat
   * @arg {vimState} vim
   * @returns {[Pos, Pos] | undefined}
   */
  function findNextFromAndToInclusive(cm, prev, query, repeat, vim) {
    return cm.operation(function() {
      if (repeat === undefined) { repeat = 1; }
      var pos = cm.getCursor();
      var cursor = cm.getSearchCursor(query, pos);

      // Go back one result to ensure that if the cursor is currently a match, we keep it.
      var found = cursor.find(!prev);

      // If we haven't moved, go back one more (similar to if i==0 logic in findNext).
      // @ts-ignore
      if (!vim.visualMode && found && cursorEqual(cursor.from(), pos)) {
        cursor.find(!prev);
      }

      for (var i = 0; i < repeat; i++) {
        found = cursor.find(prev);
        if (!found) {
          // SearchCursor may have returned null because it hit EOF, wrap
          // around and try again.
          cursor = cm.getSearchCursor(query,
              // @ts-ignore
              (prev) ? new Pos(cm.lastLine()) : new Pos(cm.firstLine(), 0) );
          if (!cursor.find(prev)) {
            return;
          }
        }
      }
      var from = cursor.from();
      var to = cursor.to();
      return from && to && [from, to];
    });
  }
  /** @arg {CodeMirrorV} cm */
  function clearSearchHighlight(cm) {
    var state = getSearchState(cm);
    if (state.highlightTimeout) {
      clearTimeout(state.highlightTimeout);
      state.highlightTimeout = undefined;
    }
    cm.removeOverlay(getSearchState(cm).getOverlay());
    state.setOverlay(null);
    if (state.getScrollbarAnnotate()) {
      state.getScrollbarAnnotate().clear();
      state.setScrollbarAnnotate(null);
    }
  }
  /**
   * Check if pos is in the specified range, INCLUSIVE.
   * Range can be specified with 1 or 2 arguments.
   * If the first range argument is an array, treat it as an array of line
   * numbers. Match pos against any of the lines.
   * If the first range argument is a number,
   *   if there is only 1 range argument, check if pos has the same line
   *       number
   *   if there are 2 range arguments, then check if pos is in between the two
   *       range arguments.
   * @arg {number|Pos} pos
   * @arg {number|number[]} start
   * @arg {number} end
   */
  function isInRange(pos, start, end) {
    if (typeof pos != 'number') {
      // Assume it is a cursor position. Get the line number.
      pos = pos.line;
    }
    if (start instanceof Array) {
      return inArray(pos, start);
    } else {
      if (typeof end == 'number') {
        return (pos >= start && pos <= end);
      } else {
        return pos == start;
      }
    }
  }
  /** @arg {CodeMirror} cm */
  function getUserVisibleLines(cm) {
    var scrollInfo = cm.getScrollInfo();
    var occludeToleranceTop = 6;
    var occludeToleranceBottom = 10;
    var from = cm.coordsChar({left:0, top: occludeToleranceTop + scrollInfo.top}, 'local');
    var bottomY = scrollInfo.clientHeight - occludeToleranceBottom + scrollInfo.top;
    var to = cm.coordsChar({left:0, top: bottomY}, 'local');
    return {top: from.line, bottom: to.line};
  }

  /** @arg {CodeMirror} cm @arg {vimState} vim  @arg {string} markName */
  function getMarkPos(cm, vim, markName) {
    if (markName == '\'' || markName == '`') {
      return vimGlobalState.jumpList.find(cm, -1) || new Pos(0, 0);
    } else if (markName == '.') {
      return getLastEditPos(cm);
    }

    var mark = vim.marks[markName];
    return mark && mark.find();
  }

  /** @arg {CodeMirror} cm */
  function getLastEditPos(cm) {
    if (cm.getLastEditEnd) {
      return cm.getLastEditEnd();
    }
    // for old cm
    var done = /**@type{any}*/(cm).doc.history.done;
    for (var i = done.length; i--;) {
      if (done[i].changes) {
        return copyCursor(done[i].changes[0].to);
      }
    }
  }

  class ExCommandDispatcher {
    constructor() {
      /**@type {Record<string, import("./types").exCommandDefinition>} */
      this.commandMap_;
      this.buildCommandMap_();
    }
    /**
     * @arg {CodeMirrorV} cm
     * @arg {string} input
     * @arg {{ callback: () => void; } | undefined} [opt_params]
     */
    processCommand(cm, input, opt_params) {
      var that = this;
      cm.operation(function () {
        if (cm.curOp) cm.curOp.isVimOp = true;
        that._processCommand(cm, input, opt_params);
      });
    }
    /**
     * @arg {CodeMirrorV} cm
     * @arg {string} input
     * @arg {{ callback?: () => void; input?: string, line?: string, commandName?: string  } } [opt_params]
     */
    _processCommand(cm, input, opt_params) {
      var vim = cm.state.vim;
      var commandHistoryRegister = vimGlobalState.registerController.getRegister(':');
      var previousCommand = commandHistoryRegister.toString();
      var inputStream = new CM.StringStream(input);
      // update ": with the latest command whether valid or invalid
      commandHistoryRegister.setText(input);
      var params = opt_params || {};
      params.input = input;
      try {
        this.parseInput_(cm, inputStream, params);
      } catch(e) {
        showConfirm(cm, e + "");
        throw e;
      }

      if (vim.visualMode) {
        exitVisualMode(cm);
      }

      var command;
      var commandName;
      if (!params.commandName) {
        // If only a line range is defined, move to the line.
        if (params.line !== undefined) {
          commandName = 'move';
        }
      } else {
        command = this.matchCommand_(params.commandName);
        if (command) {
          commandName = command.name;
          if (command.excludeFromCommandHistory) {
            commandHistoryRegister.setText(previousCommand);
          }
          this.parseCommandArgs_(inputStream, params, command);
          if (command.type == 'exToKey') {
            // Handle Ex to Key mapping.
            doKeyToKey(cm, command.toKeys || '', command);
            return;
          } else if (command.type == 'exToEx') {
            // Handle Ex to Ex mapping.
            this.processCommand(cm, command.toInput || '');
            return;
          }
        }
      }
      if (!commandName) {
        showConfirm(cm, 'Not an editor command ":' + input + '"');
        return;
      }
      try {
        exCommands[commandName](cm, params);
        // Possibly asynchronous commands (e.g. substitute, which might have a
        // user confirmation), are responsible for calling the callback when
        // done. All others have it taken care of for them here.
        if ((!command || !command.possiblyAsync) && params.callback) {
          params.callback();
        }
      } catch(e) {
        showConfirm(cm, e + "");
        throw e;
      }
    }
    /**
     * @param {CodeMirrorV} cm
     * @param {import("@codemirror/language").StringStream} inputStream
     * @param {{ callback?: (() => void) | undefined; input?: string | undefined; line?: any; commandName?: any; lineEnd?: any; selectionLine?: any; selectionLineEnd?: any; }} result
     */
    parseInput_(cm, inputStream, result) {
      inputStream.eatWhile(':');
      // Parse range.
      if (inputStream.eat('%')) {
        result.line = cm.firstLine();
        result.lineEnd = cm.lastLine();
      } else {
        result.line = this.parseLineSpec_(cm, inputStream);
        if (result.line !== undefined && inputStream.eat(',')) {
          result.lineEnd = this.parseLineSpec_(cm, inputStream);
        }
      }

      if (result.line == undefined) {
        if (cm.state.vim.visualMode) {
          result.selectionLine = getMarkPos(cm, cm.state.vim, '<')?.line;
          result.selectionLineEnd = getMarkPos(cm, cm.state.vim, '>')?.line;
        } else {
          result.selectionLine = cm.getCursor().line;
        }
      } else {
        result.selectionLine = result.line;
        result.selectionLineEnd = result.lineEnd;
      }

      // Parse command name.
      var commandMatch = inputStream.match(/^(\w+|!!|@@|[!#&*<=>@~])/);
      if (commandMatch) {
        result.commandName = commandMatch[1];
      } else {
        result.commandName = (inputStream.match(/.*/) || [""])[0];
      }

      return result;
    }
    /**
     * @param {CodeMirrorV} cm
     * @param {import("@codemirror/language").StringStream} inputStream
     */
    parseLineSpec_(cm, inputStream) {
      var numberMatch = inputStream.match(/^(\d+)/);
      if (numberMatch) {
        // Absolute line number plus offset (N+M or N-M) is probably a typo,
        // not something the user actually wanted. (NB: vim does allow this.)
        return parseInt(numberMatch[1], 10) - 1;
      }
      switch (inputStream.next()) {
        case '.':
          return this.parseLineSpecOffset_(inputStream, cm.getCursor().line);
        case '$':
          return this.parseLineSpecOffset_(inputStream, cm.lastLine());
        case '\'':
          var markName = inputStream.next() || "";
          var markPos = getMarkPos(cm, cm.state.vim, markName);
          if (!markPos) throw new Error('Mark not set');
          return this.parseLineSpecOffset_(inputStream, markPos.line);
        case '-':
        case '+':
          inputStream.backUp(1);
          // Offset is relative to current line if not otherwise specified.
          return this.parseLineSpecOffset_(inputStream, cm.getCursor().line);
        default:
          inputStream.backUp(1);
          return undefined;
      }
    }
    /**
     * @param {string | import("@codemirror/language").StringStream} inputStream
     * @param {number} line
     */
    parseLineSpecOffset_(inputStream, line) {
      var offsetMatch = inputStream.match(/^([+-])?(\d+)/);
      if (offsetMatch) {
        var offset = parseInt(offsetMatch[2], 10);
        if (offsetMatch[1] == "-") {
          line -= offset;
        } else {
          line += offset;
        }
      }
      return line;
    }
    /**
     * @param {import("@codemirror/language").StringStream} inputStream
     * @param {import("./types").exCommandArgs} params
     * @param {import("./types").exCommandDefinition} command
     */
    parseCommandArgs_(inputStream, params, command) {
      if (inputStream.eol()) {
        return;
      }
      params.argString = inputStream.match(/.*/)?.[0];
      // Parse command-line arguments
      var delim = command.argDelimiter || /\s+/;
      var args = trim(params.argString || "").split(delim);
      if (args.length && args[0]) {
        params.args = args;
      }
    }
    /**
     * @arg {string} commandName
     */
    matchCommand_(commandName) {
      // Return the command in the command map that matches the shortest
      // prefix of the passed in command name. The match is guaranteed to be
      // unambiguous if the defaultExCommandMap's shortNames are set up
      // correctly. (see @code{defaultExCommandMap}).
      for (var i = commandName.length; i > 0; i--) {
        var prefix = commandName.substring(0, i);
        if (this.commandMap_[prefix]) {
          var command = this.commandMap_[prefix];
          if (command.name.indexOf(commandName) === 0) {
            return command;
          }
        }
      }
    }
    buildCommandMap_() {
      this.commandMap_ = {};
      for (var i = 0; i < defaultExCommandMap.length; i++) {
        var command = defaultExCommandMap[i];
        var key = command.shortName || command.name;
        this.commandMap_[key] = command;
      }
    }
    /**@type {(lhs: string, rhs: string, ctx: string|void, noremap?: boolean) => void} */
    map(lhs, rhs, ctx, noremap) {
      if (lhs != ':' && lhs.charAt(0) == ':') {
        if (ctx) { throw Error('Mode not supported for ex mappings'); }
        var commandName = lhs.substring(1);
        if (rhs != ':' && rhs.charAt(0) == ':') {
          // Ex to Ex mapping
          this.commandMap_[commandName] = {
            name: commandName,
            type: 'exToEx',
            toInput: rhs.substring(1),
            user: true
          };
        } else {
          // Ex to key mapping
          this.commandMap_[commandName] = {
            name: commandName,
            type: 'exToKey',
            toKeys: rhs,
            user: true
          };
        }
      } else {
        // Key to key or ex mapping
        /**@type {vimKey} */
        var mapping = {
          keys: lhs,
          type: 'keyToKey',
          toKeys: rhs,
          noremap: !!noremap
        };
        if (ctx) { mapping.context = ctx; }
        _mapCommand(mapping);
      }
    }
    /**@type {(lhs: string, ctx: string) => boolean|void} */
    unmap(lhs, ctx) {
      if (lhs != ':' && lhs.charAt(0) == ':') {
        // Ex to Ex or Ex to key mapping
        if (ctx) { throw Error('Mode not supported for ex mappings'); }
        var commandName = lhs.substring(1);
        if (this.commandMap_[commandName] && this.commandMap_[commandName].user) {
          delete this.commandMap_[commandName];
          return true;
        }
      } else {
        // Key to Ex or key to key mapping
        var keys = lhs;
        for (var i = 0; i < defaultKeymap.length; i++) {
          if (keys == defaultKeymap[i].keys
              && defaultKeymap[i].context === ctx) {
            defaultKeymap.splice(i, 1);
            removeUsedKeys(keys);
            return true;
          }
        }
      }
    }
  }

  /** @typedef { import("./types").ExParams} ExParams */
  var exCommands = {
    /** @arg {CodeMirrorV} cm @arg {ExParams} params*/
    colorscheme: function(cm, params) {
      if (!params.args || params.args.length < 1) {
        showConfirm(cm, cm.getOption('theme'));
        return;
      }
      cm.setOption('theme', params.args[0]);
    },
    /** @arg {CodeMirrorV} cm @arg {ExParams} params @arg {'insert'|'normal'|string} [ctx] @arg {boolean} [defaultOnly]*/
    map: function(cm, params, ctx, defaultOnly) {
      var mapArgs = params.args;
      if (!mapArgs || mapArgs.length < 2) {
        if (cm) {
          showConfirm(cm, 'Invalid mapping: ' + params.input);
        }
        return;
      }
      exCommandDispatcher.map(mapArgs[0], mapArgs[1], ctx, defaultOnly);
    },
    /** @arg {CodeMirrorV} cm @arg {ExParams} params*/
    imap: function(cm, params) { this.map(cm, params, 'insert'); },
    /** @arg {CodeMirrorV} cm @arg {ExParams} params*/
    nmap: function(cm, params) { this.map(cm, params, 'normal'); },
    /** @arg {CodeMirrorV} cm @arg {ExParams} params*/
    vmap: function(cm, params) { this.map(cm, params, 'visual'); },
    /** @arg {CodeMirrorV} cm @arg {ExParams} params*/
    omap: function(cm, params) { this.map(cm, params, 'operatorPending'); },
    /** @arg {CodeMirrorV} cm @arg {ExParams} params*/
    noremap: function(cm, params) { this.map(cm, params, undefined, true); },
    /** @arg {CodeMirrorV} cm @arg {ExParams} params*/
    inoremap: function(cm, params) { this.map(cm, params, 'insert', true); },
    /** @arg {CodeMirrorV} cm @arg {ExParams} params*/
    nnoremap: function(cm, params) { this.map(cm, params, 'normal', true); },
    /** @arg {CodeMirrorV} cm @arg {ExParams} params*/
    vnoremap: function(cm, params) { this.map(cm, params, 'visual', true); },
    /** @arg {CodeMirrorV} cm @arg {ExParams} params*/
    onoremap: function(cm, params) { this.map(cm, params, 'operatorPending', true); },
    /** @arg {CodeMirrorV} cm @arg {ExParams} params @arg {string} ctx*/
    unmap: function(cm, params, ctx) {
      var mapArgs = params.args;
      if (!mapArgs || mapArgs.length < 1 || !exCommandDispatcher.unmap(mapArgs[0], ctx)) {
        if (cm) {
          showConfirm(cm, 'No such mapping: ' + params.input);
        }
      }
    },
    /** @arg {CodeMirrorV} cm @arg {ExParams} params*/
    mapclear: function(cm, params) { vimApi.mapclear(); },
    /** @arg {CodeMirrorV} cm @arg {ExParams} params*/
    imapclear: function(cm, params) { vimApi.mapclear('insert'); },
    /** @arg {CodeMirrorV} cm @arg {ExParams} params*/
    nmapclear: function(cm, params) { vimApi.mapclear('normal'); },
    /** @arg {CodeMirrorV} cm @arg {ExParams} params*/
    vmapclear: function(cm, params) { vimApi.mapclear('visual'); },
    /** @arg {CodeMirrorV} cm @arg {ExParams} params*/
    omapclear: function(cm, params) { vimApi.mapclear('operatorPending'); },
    /** @arg {CodeMirrorV} cm @arg {ExParams} params*/
    move: function(cm, params) {
      commandDispatcher.processCommand(cm, cm.state.vim, {
        keys: "",
        type: 'motion',
        motion: 'moveToLineOrEdgeOfDocument',
        motionArgs: { forward: false, explicitRepeat: true, linewise: true },
        repeatOverride: params.line+1
      });
    },
    /** @arg {CodeMirrorV} cm @arg {ExParams} params*/
    set: function(cm, params) {
      var setArgs = params.args;
      // Options passed through to the setOption/getOption calls. May be passed in by the
      // local/global versions of the set command
      var setCfg = params.setCfg || {};
      if (!setArgs || setArgs.length < 1) {
        if (cm) {
          showConfirm(cm, 'Invalid mapping: ' + params.input);
        }
        return;
      }
      var expr = setArgs[0].split('=');
      var optionName = expr.shift() || "";
      /**@type {string|boolean|undefined} */
      var value = expr.length > 0 ? expr.join('=') : undefined;
      var forceGet = false;
      var forceToggle = false;

      if (optionName.charAt(optionName.length - 1) == '?') {
        // If post-fixed with ?, then the set is actually a get.
        if (value) { throw Error('Trailing characters: ' + params.argString); }
        optionName = optionName.substring(0, optionName.length - 1);
        forceGet = true;
      } else if (optionName.charAt(optionName.length - 1) == '!') {
        optionName = optionName.substring(0, optionName.length - 1);
        forceToggle = true;
      }
      if (value === undefined && optionName.substring(0, 2) == 'no') {
        // To set boolean options to false, the option name is prefixed with
        // 'no'.
        optionName = optionName.substring(2);
        value = false;
      }

      var optionIsBoolean = options[optionName] && options[optionName].type == 'boolean';
      if (optionIsBoolean) {
        if (forceToggle) {
          value = !getOption(optionName, cm, setCfg);
        } else if (value == undefined) {
          // Calling set with a boolean option sets it to true.
          value = true;
        }
      }
      // If no value is provided, then we assume this is a get.
      if (!optionIsBoolean && value === undefined || forceGet) {
        var oldValue = getOption(optionName, cm, setCfg);
        if (oldValue instanceof Error) {
          showConfirm(cm, oldValue.message);
        } else if (oldValue === true || oldValue === false) {
          showConfirm(cm, ' ' + (oldValue ? '' : 'no') + optionName);
        } else {
          showConfirm(cm, '  ' + optionName + '=' + oldValue);
        }
      } else {
        var setOptionReturn = setOption(optionName, value, cm, setCfg);
        if (setOptionReturn instanceof Error) {
          showConfirm(cm, setOptionReturn.message);
        }
      }
    },
    /** @arg {CodeMirrorV} cm @arg {ExParams} params*/
    setlocal: function (cm, params) {
      // setCfg is passed through to setOption
      params.setCfg = {scope: 'local'};
      this.set(cm, params);
    },
    /** @arg {CodeMirrorV} cm @arg {ExParams} params*/
    setglobal: function (cm, params) {
      // setCfg is passed through to setOption
      params.setCfg = {scope: 'global'};
      this.set(cm, params);
    },
    /** @arg {CodeMirrorV} cm @arg {ExParams} params*/
    registers: function(cm, params) {
      var regArgs = params.args;
      var registers = vimGlobalState.registerController.registers;
      var regInfo = '----------Registers----------\n\n';
      if (!regArgs) {
        for (var registerName in registers) {
          var text = registers[registerName].toString();
          if (text.length) {
            regInfo += '"' + registerName + '    ' + text + '\n';
          }
        }
      } else {
        var registerNames = regArgs.join('');
        for (var i = 0; i < registerNames.length; i++) {
          var registerName = registerNames.charAt(i);
          if (!vimGlobalState.registerController.isValidRegister(registerName)) {
            continue;
          }
          var register = registers[registerName] || new Register();
          regInfo += '"' + registerName + '    ' + register.toString() + '\n';
        }
      }
      showConfirm(cm, regInfo, true);
    },
    /** @arg {CodeMirrorV} cm @arg {ExParams} params*/
    marks: function(cm, params) {
      var filterArgs = params.args;
      var marks = cm.state.vim.marks;
      var regInfo = '-----------Marks-----------\nmark\tline\tcol\n\n';
      if (!filterArgs) {
        for (var name in marks) {
          var marker = marks[name] && marks[name].find();
          if (marker) {
            regInfo += name + '\t' + marker.line + '\t' + marker.ch +  '\n';
          }
        }
      } else {
        var registerNames = filterArgs.join('');
        for (var i = 0; i < registerNames.length; i++) {
          var name = registerNames.charAt(i);
          var marker = marks[name] && marks[name].find();
          if (marker) {
            regInfo += name + '\t' + marker.line + '\t' + marker.ch +  '\n';
          }
        }
      }
      showConfirm(cm, regInfo, true);
    },
    /** @arg {CodeMirrorV} cm @arg {ExParams} params*/
    sort: function(cm, params) {
      var reverse, ignoreCase, unique, number, pattern;
      function parseArgs() {
        if (params.argString) {
          var args = new CM.StringStream(params.argString);
          if (args.eat('!')) { reverse = true; }
          if (args.eol()) { return; }
          if (!args.eatSpace()) { return 'Invalid arguments'; }
          var opts = args.match(/([dinuox]+)?\s*(\/.+\/)?\s*/);
          if (!opts || !args.eol()) { return 'Invalid arguments'; }
          if (opts[1]) {
            ignoreCase = opts[1].indexOf('i') != -1;
            unique = opts[1].indexOf('u') != -1;
            var decimal = opts[1].indexOf('d') != -1 || opts[1].indexOf('n') != -1;
            var hex = opts[1].indexOf('x') != -1;
            var octal = opts[1].indexOf('o') != -1;
            if (Number(decimal) + Number(hex) + Number(octal) > 1) { return 'Invalid arguments'; }
            number = decimal && 'decimal' || hex && 'hex' || octal && 'octal';
          }
          if (opts[2]) {
            pattern = new RegExp(opts[2].substr(1, opts[2].length - 2), ignoreCase ? 'i' : '');
          }
        }
      }
      var err = parseArgs();
      if (err) {
        showConfirm(cm, err + ': ' + params.argString);
        return;
      }
      var lineStart = params.line || cm.firstLine();
      var lineEnd = params.lineEnd || params.line || cm.lastLine();
      if (lineStart == lineEnd) { return; }
      var curStart = new Pos(lineStart, 0);
      var curEnd = new Pos(lineEnd, lineLength(cm, lineEnd));
      var text = cm.getRange(curStart, curEnd).split('\n');
      var numberRegex =
          (number == 'decimal') ? /(-?)([\d]+)/ :
          (number == 'hex') ? /(-?)(?:0x)?([0-9a-f]+)/i :
          (number == 'octal') ? /([0-7]+)/ : null;
      var radix = (number == 'decimal') ? 10 : (number == 'hex') ? 16 : (number == 'octal') ? 8 : undefined;
      var numPart = [], textPart = [];
      if (number || pattern) {
        for (var i = 0; i < text.length; i++) {
          var matchPart = pattern ? text[i].match(pattern) : null;
          if (matchPart && matchPart[0] != '') {
            numPart.push(matchPart);
          } else if (numberRegex && numberRegex.exec(text[i])) {
            numPart.push(text[i]);
          } else {
            textPart.push(text[i]);
          }
        }
      } else {
        textPart = text;
      }
      /** @arg {string} a  @arg {string} b */
      function compareFn(a, b) {
        if (reverse) { var tmp; tmp = a; a = b; b = tmp; }
        if (ignoreCase) { a = a.toLowerCase(); b = b.toLowerCase(); }
        var amatch = numberRegex && numberRegex.exec(a);
        var bmatch = numberRegex && numberRegex.exec(b);
        if (!amatch || !bmatch) { return a < b ? -1 : 1; }
        var anum = parseInt((amatch[1] + amatch[2]).toLowerCase(), radix);
        var bnum = parseInt((bmatch[1] + bmatch[2]).toLowerCase(), radix);
        return anum - bnum;
      }
      /** @arg {string[]} a  @arg {string[]} b */
      function comparePatternFn(a, b) {
        if (reverse) { var tmp; tmp = a; a = b; b = tmp; }
        if (ignoreCase) { a[0] = a[0].toLowerCase(); b[0] = b[0].toLowerCase(); }
        return (a[0] < b[0]) ? -1 : 1;
      }
      // @ts-ignore
      numPart.sort(pattern ? comparePatternFn : compareFn);
      if (pattern) {
        for (var i = 0; i < numPart.length; i++) {
          // @ts-ignore
          numPart[i] = numPart[i].input;
        }
      } else if (!number) { textPart.sort(compareFn); }
      text = (!reverse) ? textPart.concat(numPart) : numPart.concat(textPart);
      if (unique) { // Remove duplicate lines
        var textOld = text;
        var lastLine;
        text = [];
        for (var i = 0; i < textOld.length; i++) {
          if (textOld[i] != lastLine) {
            text.push(textOld[i]);
          }
          lastLine = textOld[i];
        }
      }
      cm.replaceRange(text.join('\n'), curStart, curEnd);
    },
    /** @arg {CodeMirrorV} cm @arg {ExParams} params*/
    vglobal: function(cm, params) {
      // global inspects params.commandName
      this.global(cm, params);
    },
    /** @arg {CodeMirrorV} cm @arg {ExParams} params*/
    normal: function(cm, params) {
      var noremap = false;
      var argString = params.argString;
      if (argString && argString[0] == '!') {
          argString = argString.slice(1);
          noremap = true;
      }
      argString = argString.trimStart();
      if (!argString) {
        showConfirm(cm, 'Argument is required.');
        return;
      }
      var line = params.line;
      if (typeof line == 'number') {
        var lineEnd = isNaN(params.lineEnd) ? line : params.lineEnd;
        for (var i = line; i <= lineEnd; i++) {
          cm.setCursor(i, 0);
          doKeyToKey(cm, params.argString.trimStart(), {noremap});
          if (cm.state.vim.insertMode) {
            exitInsertMode(cm, true);
          }
        }
      } else {
        doKeyToKey(cm, params.argString.trimStart(), {noremap});
        if (cm.state.vim.insertMode) {
          exitInsertMode(cm, true);
        }
      }
    },
    /** @arg {CodeMirrorV} cm @arg {ExParams} params*/
    global: function(cm, params) {
      // a global command is of the form
      // :[range]g/pattern/[cmd]
      // argString holds the string /pattern/[cmd]
      var argString = params.argString;
      if (!argString) {
        showConfirm(cm, 'Regular Expression missing from global');
        return;
      }
      var inverted = params.commandName[0] === 'v';
      if (argString[0] === '!' && params.commandName[0] === 'g') {
        inverted = true;
        argString = argString.slice(1);
      }
      // range is specified here
      var lineStart = (params.line !== undefined) ? params.line : cm.firstLine();
      var lineEnd = params.lineEnd || params.line || cm.lastLine();
      // get the tokens from argString
      var tokens = splitBySlash(argString);
      var regexPart = argString, cmd = "";
      if (tokens && tokens.length) {
        regexPart = tokens[0];
        cmd = tokens.slice(1, tokens.length).join('/');
      }
      if (regexPart) {
        // If regex part is empty, then use the previous query. Otherwise
        // use the regex part as the new query.
        try {
          updateSearchQuery(cm, regexPart, true /** ignoreCase */,
            true /** smartCase */);
        } catch (e) {
          showConfirm(cm, 'Invalid regex: ' + regexPart);
          return;
        }
      }
      // now that we have the regexPart, search for regex matches in the
      // specified range of lines
      var query = getSearchState(cm).getQuery();
      /**@type {(string|import("./types").LineHandle)[]}*/
      var matchedLines = [];
      for (var i = lineStart; i <= lineEnd; i++) {
        var line = cm.getLine(i);
        var matched = query.test(line);
        if (matched !== inverted) {
          matchedLines.push(cmd ? cm.getLineHandle(i) : line);
        }
      }
      // if there is no [cmd], just display the list of matched lines
      if (!cmd) {
        showConfirm(cm, matchedLines.join('\n'));
        return;
      }
      var index = 0;
      var nextCommand = function() {
        if (index < matchedLines.length) {
          var lineHandle = matchedLines[index++];
          var lineNum = cm.getLineNumber(lineHandle);
          if (lineNum == null) {
            nextCommand();
            return;
          }
          var command = (lineNum + 1) + cmd;
          exCommandDispatcher.processCommand(cm, command, {
            callback: nextCommand
          });
        } else if (cm.releaseLineHandles) {
          cm.releaseLineHandles();
        }
      };
      nextCommand();
    },
    /** @arg {CodeMirrorV} cm @arg {ExParams} params*/
    substitute: function(cm, params) {
      if (!cm.getSearchCursor) {
        throw new Error('Search feature not available. Requires searchcursor.js or ' +
            'any other getSearchCursor implementation.');
      }
      var argString = params.argString;
      var tokens = argString ? splitBySeparator(argString, argString[0]) : [];
      var regexPart = '', replacePart = '', trailing, flagsPart, count;
      var confirm = false; // Whether to confirm each replace.
      var global = false; // True to replace all instances on a line, false to replace only 1.
      if (tokens && tokens.length) {
        regexPart = tokens[0];
        if (getOption('pcre') && regexPart !== '') {
            regexPart = new RegExp(regexPart).source; //normalize not escaped characters
        }
        replacePart = tokens[1];
        if (replacePart !== undefined) {
          if (getOption('pcre')) {
            replacePart = unescapeRegexReplace(replacePart.replace(/([^\\])&/g,"$1$$&"));
          } else {
            replacePart = translateRegexReplace(replacePart);
          }
          vimGlobalState.lastSubstituteReplacePart = replacePart;
        }
        trailing = tokens[2] ? tokens[2].split(' ') : [];
      } else {
        // either the argString is empty or its of the form ' hello/world'
        // actually splitBySlash returns a list of tokens
        // only if the string starts with a '/'
        if (argString && argString.length) {
          showConfirm(cm, 'Substitutions should be of the form ' +
              ':s/pattern/replace/');
          return;
        }
      }
      // After the 3rd slash, we can have flags followed by a space followed
      // by count.
      if (trailing) {
        flagsPart = trailing[0];
        count = parseInt(trailing[1]);
        if (flagsPart) {
          if (flagsPart.indexOf('c') != -1) {
            confirm = true;
          }
          if (flagsPart.indexOf('g') != -1) {
            global = true;
          }
          if (getOption('pcre')) {
            regexPart = regexPart + '/' + flagsPart;
          } else {
            regexPart = regexPart.replace(/\//g, "\\/") + '/' + flagsPart;
          }
        }
      }
      if (regexPart) {
        // If regex part is empty, then use the previous query. Otherwise use
        // the regex part as the new query.
        try {
          updateSearchQuery(cm, regexPart, true /** ignoreCase */,
            true /** smartCase */);
        } catch (e) {
          showConfirm(cm, 'Invalid regex: ' + regexPart);
          return;
        }
      }
      replacePart = replacePart || vimGlobalState.lastSubstituteReplacePart;
      if (replacePart === undefined) {
        showConfirm(cm, 'No previous substitute regular expression');
        return;
      }
      var state = getSearchState(cm);
      var query = state.getQuery();
      var lineStart = (params.line !== undefined) ? params.line : cm.getCursor().line;
      var lineEnd = params.lineEnd || lineStart;
      if (lineStart == cm.firstLine() && lineEnd == cm.lastLine()) {
        lineEnd = Infinity;
      }
      if (count) {
        lineStart = lineEnd;
        lineEnd = lineStart + count - 1;
      }
      var startPos = clipCursorToContent(cm, new Pos(lineStart, 0));
      var cursor = cm.getSearchCursor(query, startPos);
      doReplace(cm, confirm, global, lineStart, lineEnd, cursor, query, replacePart, params.callback);
    },
    /** @arg {CodeMirrorV} cm @arg {ExParams} params*/
    startinsert: function(cm, params) {
      doKeyToKey(cm, params.argString == '!' ? 'A' : 'i', {});
    },
    redo: CM.commands.redo,
    undo: CM.commands.undo,
    /** @arg {CodeMirrorV} cm */
    write: function(cm) {
      if (CM.commands.save) {
        CM.commands.save(cm);
      } else if (cm.save) {
        // Saves to text area if no save command is defined and cm.save() is available.
        cm.save();
      }
    },
    /** @arg {CodeMirrorV} cm */
    nohlsearch: function(cm) {
      clearSearchHighlight(cm);
    },
    /** @arg {CodeMirrorV} cm */
    yank: function (cm) {
      var cur = copyCursor(cm.getCursor());
      var line = cur.line;
      var lineText = cm.getLine(line);
      vimGlobalState.registerController.pushText(
        '0', 'yank', lineText, true, true);
    },
    /** @arg {CodeMirrorV} cm @arg {ExParams} params*/
    delete: function(cm, params) {
      var line = params.selectionLine;
      var lineEnd = isNaN(params.selectionLineEnd) ? line : params.selectionLineEnd;
      operators.delete(cm, {linewise: true}, [
        { anchor: new Pos(line, 0),
          head: new Pos(lineEnd + 1, 0) }
      ]);
    },
    /** @arg {CodeMirrorV} cm @arg {ExParams} params*/
    join: function(cm, params) {
      var line = params.selectionLine;
      var lineEnd = isNaN(params.selectionLineEnd) ? line : params.selectionLineEnd;
      cm.setCursor(new Pos(line, 0));
      actions.joinLines(cm, {repeat: lineEnd - line}, cm.state.vim);
    },
    /** @arg {CodeMirrorV} cm @arg {ExParams} params*/
    delmarks: function(cm, params) {
      if (!params.argString || !trim(params.argString)) {
        showConfirm(cm, 'Argument required');
        return;
      }

      var state = cm.state.vim;
      var stream = new CM.StringStream(trim(params.argString));
      while (!stream.eol()) {
        stream.eatSpace();

        // Record the streams position at the beginning of the loop for use
        // in error messages.
        var count = stream.pos;

        if (!stream.match(/[a-zA-Z]/, false)) {
          showConfirm(cm, 'Invalid argument: ' + params.argString.substring(count));
          return;
        }

        var sym = stream.next();
        // Check if this symbol is part of a range
        if (stream.match('-', true)) {
          // This symbol is part of a range.

          // The range must terminate at an alphabetic character.
          if (!stream.match(/[a-zA-Z]/, false)) {
            showConfirm(cm, 'Invalid argument: ' + params.argString.substring(count));
            return;
          }

          var startMark = sym;
          var finishMark = stream.next();
          // The range must terminate at an alphabetic character which
          // shares the same case as the start of the range.
          if (startMark && finishMark && isLowerCase(startMark) == isLowerCase(finishMark)) {
            var start = startMark.charCodeAt(0);
            var finish = finishMark.charCodeAt(0);
            if (start >= finish) {
              showConfirm(cm, 'Invalid argument: ' + params.argString.substring(count));
              return;
            }

            // Because marks are always ASCII values, and we have
            // determined that they are the same case, we can use
            // their char codes to iterate through the defined range.
            for (var j = 0; j <= finish - start; j++) {
              var mark = String.fromCharCode(start + j);
              delete state.marks[mark];
            }
          } else {
            showConfirm(cm, 'Invalid argument: ' + startMark + '-');
            return;
          }
        } else if (sym) {
          // This symbol is a valid mark, and is not part of a range.
          delete state.marks[sym];
        }
      }
    }
  };

  var exCommandDispatcher = new ExCommandDispatcher();

  vimApi.defineEx("version", "ve", (cm) => {
    showConfirm(cm, "Codemirror-vim version: 6.3.0");
  });

  /**
   * @arg {CodeMirrorV} cm CodeMirror instance we are in.
   * @arg {boolean} confirm Whether to confirm each replace.
   * @arg {boolean} global 
   * @arg {number} lineStart Line to start replacing from.
   * @arg {number} lineEnd Line to stop replacing at.
   * TODO: find a way for typescript to understand that when match is found searchCursor.from() is not null
   * @arg {ReturnType<CodeMirror["getSearchCursor"]>|any} searchCursor Search cursor to use for finding matches.
   * @arg {RegExp} query Query for performing matches with.
   * @arg {string} replaceWith Text to replace matches with. May contain $1,
   *     $2, etc for replacing captured groups using JavaScript replace.
   * @arg {function} [callback] A callback for when the replace is done.
   */
  function doReplace(cm, confirm, global, lineStart, lineEnd, searchCursor, query,
      replaceWith, callback) {
    // Set up all the functions.
    cm.state.vim.exMode = true;
    var done = false;
    var matches = 0;
    
    /** @type {Pos}*/ var lastPos;
    /** @type {number}*/ var modifiedLineNumber;
    /** @type {boolean}*/var joined;
    function replaceAll() {
      cm.operation(function() {
        while (!done) {
          replace();
          next();
        }
        stop();
      });
    }
    function replace() {
      var newText = '';
      var match = searchCursor.match || searchCursor.pos && searchCursor.pos.match;
      if (match) {
        newText = replaceWith.replace(/\$(\d{1,3}|[$&])/g, function(_, x) {
          if (x == "$") return "$";
          if (x == '&') return match[0];
          var x1 = x;
          while (parseInt(x1) >= match.length && x1.length > 0) {
            x1 = x1.slice(0, x1.length - 1);
          }
          if (x1) return match[x1] + x.slice(x1.length, x.length);
          return _;
        });
      } else {
        var text = cm.getRange(searchCursor.from(), searchCursor.to());
        newText = text.replace(query, replaceWith);
      }
      var unmodifiedLineNumber = searchCursor.to().line;
      searchCursor.replace(newText);
      modifiedLineNumber = searchCursor.to().line;
      lineEnd += modifiedLineNumber - unmodifiedLineNumber;
      joined = modifiedLineNumber < unmodifiedLineNumber;
    }
    function findNextValidMatch() {
      var lastMatchTo = lastPos && copyCursor(searchCursor.to());
      var match = searchCursor.findNext();
      if (match && !match[0] && lastMatchTo && cursorEqual(searchCursor.from(), lastMatchTo)) {
        match = searchCursor.findNext();
      }
      if (match) matches++;
      return match;
    }
    function next() {
      // The below only loops to skip over multiple occurrences on the same
      // line when 'global' is not true.
      while(findNextValidMatch() &&
            isInRange(searchCursor.from(), lineStart, lineEnd)) {
        if (!global && searchCursor.from().line == modifiedLineNumber && !joined) {
          continue;
        }
        cm.scrollIntoView(searchCursor.from(), 30);
        cm.setSelection(searchCursor.from(), searchCursor.to());
        lastPos = searchCursor.from();
        done = false;
        return;
      }
      done = true;
    }
    /** @arg {(() => void) | undefined} [close] */
    function stop(close) {
      if (close) { close(); }
      cm.focus();
      if (lastPos) {
        cm.setCursor(lastPos);
        var vim = cm.state.vim;
        vim.exMode = false;
        vim.lastHPos = vim.lastHSPos = lastPos.ch;
      }
      if (callback) { callback(); }
      else if (done) {
        showConfirm(cm, 
          (matches ? 'Found ' + matches + ' matches' : 'No matches found') +
          ' for pattern: ' + query +
          (getOption('pcre') ? ' (set nopcre to use Vim regexps)' : '')
        );
      }
    }
    /** @arg {KeyboardEvent} e   @arg {any} _value   @arg {any} close */
    function onPromptKeyDown(e, _value, close) {
      // Swallow all keys.
      CM.e_stop(e);
      var keyName = vimKeyFromEvent(e);
      switch (keyName) {
        case 'y':
          replace(); next(); break;
        case 'n':
          next(); break;
        case 'a':
          // replaceAll contains a call to close of its own. We don't want it
          // to fire too early or multiple times.
          var savedCallback = callback;
          callback = undefined;
          cm.operation(replaceAll);
          callback = savedCallback;
          break;
        case 'l':
          replace();
          // fall through and exit.
        case 'q':
        case '<Esc>':
        case '<C-c>':
        case '<C-[>':
          stop(close);
          break;
      }
      if (done) { stop(close); }
      return true;
    }

    // Actually do replace.
    next();
    if (done) {
      showConfirm(cm, 'No matches for ' + query +  (getOption('pcre') ? ' (set nopcre to use vim regexps)' : ''));
      return;
    }
    if (!confirm) {
      replaceAll();
      if (callback) { callback(); }
      return;
    }
    showPrompt(cm, {
      prefix: dom('span', 'replace with ', dom('strong', replaceWith), ' (y/n/a/q/l)'),
      onKeyDown: onPromptKeyDown
    });
  }

  /** @arg {CodeMirrorV} cm  @arg {boolean} [keepCursor] */
  function exitInsertMode(cm, keepCursor) {
    var vim = cm.state.vim;
    var macroModeState = vimGlobalState.macroModeState;
    var insertModeChangeRegister = vimGlobalState.registerController.getRegister('.');
    var isPlaying = macroModeState.isPlaying;
    var lastChange = macroModeState.lastInsertModeChanges;
    if (!isPlaying) {
      cm.off('change', onChange);
      if (vim.insertEnd) vim.insertEnd.clear();
      vim.insertEnd = undefined;
      CM.off(cm.getInputField(), 'keydown', onKeyEventTargetKeyDown);
    }
    if (!isPlaying && vim.insertModeRepeat && vim.insertModeRepeat > 1) {
      // Perform insert mode repeat for commands like 3,a and 3,o.
      repeatLastEdit(cm, vim, vim.insertModeRepeat - 1,
          true /** repeatForInsert */);
      // @ts-ignore
      vim.lastEditInputState.repeatOverride = vim.insertModeRepeat;
    }
    delete vim.insertModeRepeat;
    vim.insertMode = false;
    if (!keepCursor) {
      cm.setCursor(cm.getCursor().line, cm.getCursor().ch-1);
    }
    cm.setOption('keyMap', 'vim');
    cm.setOption('disableInput', true);
    cm.toggleOverwrite(false); // exit replace mode if we were in it.
    // update the ". register before exiting insert mode
    insertModeChangeRegister.setText(lastChange.changes.join(''));
    CM.signal(cm, "vim-mode-change", {mode: "normal"});
    if (macroModeState.isRecording) {
      logInsertModeChange(macroModeState);
    }
  }

  /** @arg {vimKey} command*/
  function _mapCommand(command) {
    defaultKeymap.unshift(command);
    if (command.keys) addUsedKeys(command.keys);
  }

  /** @arg {string} keys */
  function addUsedKeys(keys) {
    keys.split(/(<(?:[CSMA]-)*\w+>|.)/i).forEach(function(part) {
      if (part) {
        if (!usedKeys[part]) usedKeys[part] = 0;
        usedKeys[part]++;
      }
    });
  }

  /** @arg {string} keys */
  function removeUsedKeys(keys) {
    keys.split(/(<(?:[CSMA]-)*\w+>|.)/i).forEach(function(part) {
      if (usedKeys[part])
        usedKeys[part]--;
    });
  }

  /** 
   * @arg {string} keys
   * @arg {string} type   
   * @arg {string} name
   * @arg {any} args
   * @arg {{ [x: string]: any; }} extra 
   **/
  function mapCommand(keys, type, name, args, extra) {
    /**@type{any} */
    var command = {keys: keys, type: type};
    command[type] = name;
    command[type + "Args"] = args;
    for (var key in extra)
      command[key] = extra[key];
    _mapCommand(command);
  }

  // The timeout in milliseconds for the two-character ESC keymap should be
  // adjusted according to your typing speed to prevent false positives.
  defineOption('insertModeEscKeysTimeout', 200, 'number');


  /**
   * @arg {CodeMirrorV} cm 
   * @arg {vimState} vim 
   * @arg {MacroModeState} macroModeState 
   * @arg {string} registerName
   */
  function executeMacroRegister(cm, vim, macroModeState, registerName) {
    var register = vimGlobalState.registerController.getRegister(registerName);
    if (registerName == ':') {
      // Read-only register containing last Ex command.
      if (register.keyBuffer[0]) {
        exCommandDispatcher.processCommand(cm, register.keyBuffer[0]);
      }
      macroModeState.isPlaying = false;
      return;
    }
    var keyBuffer = register.keyBuffer;
    var imc = 0;
    macroModeState.isPlaying = true;
    macroModeState.replaySearchQueries = register.searchQueries.slice(0);
    for (var i = 0; i < keyBuffer.length; i++) {
      var text = keyBuffer[i];
      var match, key;
      var keyRe = /<(?:[CSMA]-)*\w+>|./gi;
      while ((match = keyRe.exec(text))) {
        // Pull off one command key, which is either a single character
        // or a special sequence wrapped in '<' and '>', e.g. '<Space>'.
        key = match[0];
        vimApi.handleKey(cm, key, 'macro');
        if (vim.insertMode) {
          var changes = register.insertModeChanges[imc++].changes;
          vimGlobalState.macroModeState.lastInsertModeChanges.changes = changes;
          repeatInsertModeChanges(cm, changes, 1);
          exitInsertMode(cm);
        }
      }
    }
    macroModeState.isPlaying = false;
  }

  /** @arg {MacroModeState} macroModeState @arg {any} key */
  function logKey(macroModeState, key) {
    if (macroModeState.isPlaying) { return; }
    var registerName = macroModeState.latestRegister;
    var register = vimGlobalState.registerController.getRegister(registerName);
    if (register) {
      register.pushText(key);
    }
  }

  /** @arg {MacroModeState} macroModeState */
  function logInsertModeChange(macroModeState) {
    if (macroModeState.isPlaying) { return; }
    var registerName = macroModeState.latestRegister;
    var register = vimGlobalState.registerController.getRegister(registerName);
    if (register && register.pushInsertModeChanges) {
      register.pushInsertModeChanges(macroModeState.lastInsertModeChanges);
    }
  }

  /** @arg {MacroModeState} macroModeState @arg {string} query */
  function logSearchQuery(macroModeState, query) {
    if (macroModeState.isPlaying) { return; }
    var registerName = macroModeState.latestRegister;
    var register = vimGlobalState.registerController.getRegister(registerName);
    if (register && register.pushSearchQuery) {
      register.pushSearchQuery(query);
    }
  }

  /**
   * Listens for changes made in insert mode.
   * Should only be active in insert mode.
   * @arg {CodeMirror} cm
   * @arg {{ origin: string | undefined; text: any[]; next: any; }} changeObj
   */
  function onChange(cm, changeObj) {
    var macroModeState = vimGlobalState.macroModeState;
    var lastChange = macroModeState.lastInsertModeChanges;
    if (!macroModeState.isPlaying) {
      var vim = cm.state.vim;
      while(changeObj) {
        lastChange.expectCursorActivityForChange = true;
        // @ts-ignore
        if (lastChange.ignoreCount > 1) {
          // @ts-ignore
          lastChange.ignoreCount--;
        } else if (changeObj.origin == '+input' || changeObj.origin == 'paste'
            || changeObj.origin === undefined /* only in testing */) {
          var selectionCount = cm.listSelections().length;
          if (selectionCount > 1)
            lastChange.ignoreCount = selectionCount;
          var text = changeObj.text.join('\n');
          if (lastChange.maybeReset) {
            lastChange.changes = [];
            lastChange.maybeReset = false;
          }
          if (text) {
            if (cm.state.overwrite && !/\n/.test(text)) {
              lastChange.changes.push([text]);
            } else {
              if (text.length > 1) {
                var insertEnd = vim && vim.insertEnd && vim.insertEnd.find();
                var cursor = cm.getCursor();
                if (insertEnd && insertEnd.line == cursor.line) {
                  var offset = insertEnd.ch - cursor.ch;
                  if (offset > 0 && offset < text.length) {
                    lastChange.changes.push([text, offset]);
                    text = '';
                  }
                }
              }
              if (text) lastChange.changes.push(text);
            }
          }
        }
        // Change objects may be chained with next.
        changeObj = changeObj.next;
      }
    }
  }

  /**
   * Listens for any kind of cursor activity on CodeMirror.
   * @arg {CodeMirrorV} cm
   */
  function onCursorActivity(cm) {
    var vim = cm.state.vim;
    if (vim.insertMode) {
      // Tracking cursor activity in insert mode (for macro support).
      var macroModeState = vimGlobalState.macroModeState;
      if (macroModeState.isPlaying) { return; }
      var lastChange = macroModeState.lastInsertModeChanges;
      if (lastChange.expectCursorActivityForChange) {
        lastChange.expectCursorActivityForChange = false;
      } else {
        // Cursor moved outside the context of an edit. Reset the change.
        lastChange.maybeReset = true;
        if (vim.insertEnd) vim.insertEnd.clear();
        vim.insertEnd = cm.setBookmark(cm.getCursor(), {insertLeft: true});
      }
    } else if (!cm.curOp?.isVimOp) {
      handleExternalSelection(cm, vim);
    }
  }
  /** @arg {CodeMirrorV} cm  @arg {vimState} vim */
  function handleExternalSelection(cm, vim) {
    var anchor = cm.getCursor('anchor');
    var head = cm.getCursor('head');
    // Enter or exit visual mode to match mouse selection.
    if (vim.visualMode && !cm.somethingSelected()) {
      exitVisualMode(cm, false);
    } else if (!vim.visualMode && !vim.insertMode && cm.somethingSelected()) {
      vim.visualMode = true;
      vim.visualLine = false;
      CM.signal(cm, "vim-mode-change", {mode: "visual"});
    }
    if (vim.visualMode) {
      // Bind CodeMirror selection model to vim selection model.
      // Mouse selections are considered visual characterwise.
      var headOffset = !cursorIsBefore(head, anchor) ? -1 : 0;
      var anchorOffset = cursorIsBefore(head, anchor) ? -1 : 0;
      head = offsetCursor(head, 0, headOffset);
      anchor = offsetCursor(anchor, 0, anchorOffset);
      vim.sel = {
        anchor: anchor,
        head: head
      };
      updateMark(cm, vim, '<', cursorMin(head, anchor));
      updateMark(cm, vim, '>', cursorMax(head, anchor));
    } else if (!vim.insertMode) {
      // Reset lastHPos if selection was modified by something outside of vim mode e.g. by mouse.
      vim.lastHPos = cm.getCursor().ch;
    }
  }

  /**
   * Handles raw key down events from the text area.
   * - Should only be active in insert mode.
   * - For recording deletes in insert mode.
   * @arg {KeyboardEvent} e
   */
  function onKeyEventTargetKeyDown(e) {
    var macroModeState = vimGlobalState.macroModeState;
    var lastChange = macroModeState.lastInsertModeChanges;
    var keyName = CM.keyName ? CM.keyName(e) : e.key;
    if (!keyName) { return; }
    
    if (keyName.indexOf('Delete') != -1 || keyName.indexOf('Backspace') != -1) {
      if (lastChange.maybeReset) {
        lastChange.changes = [];
        lastChange.maybeReset = false;
      }
      lastChange.changes.push(new InsertModeKey(keyName, e));
    }
  }

  /**
   * Repeats the last edit, which includes exactly 1 command and at most 1
   * insert. Operator and motion commands are read from lastEditInputState,
   * while action commands are read from lastEditActionCommand.
   *
   * If repeatForInsert is true, then the function was called by
   * exitInsertMode to repeat the insert mode changes the user just made. The
   * corresponding enterInsertMode call was made with a count.
   * @arg {CodeMirrorV} cm 
   * @arg {vimState} vim 
   * @arg {number} repeat  
   * @arg {boolean} repeatForInsert
   */
  function repeatLastEdit(cm, vim, repeat, repeatForInsert) {
    var macroModeState = vimGlobalState.macroModeState;
    macroModeState.isPlaying = true;
    var lastAction = vim.lastEditActionCommand;
    var cachedInputState = vim.inputState;
    function repeatCommand() {
      if (lastAction) {
        commandDispatcher.processAction(cm, vim, lastAction);
      } else {
        commandDispatcher.evalInput(cm, vim);
      }
    }
    /** @arg {number} repeat */
    function repeatInsert(repeat) {
      if (macroModeState.lastInsertModeChanges.changes.length > 0) {
        // For some reason, repeat cw in desktop VIM does not repeat
        // insert mode changes. Will conform to that behavior.
        repeat = !vim.lastEditActionCommand ? 1 : repeat;
        var changeObject = macroModeState.lastInsertModeChanges;
        repeatInsertModeChanges(cm, changeObject.changes, repeat);
      }
    }
    // @ts-ignore
    vim.inputState = vim.lastEditInputState;
    if (lastAction && lastAction.interlaceInsertRepeat) {
      // o and O repeat have to be interlaced with insert repeats so that the
      // insertions appear on separate lines instead of the last line.
      for (var i = 0; i < repeat; i++) {
        repeatCommand();
        repeatInsert(1);
      }
    } else {
      if (!repeatForInsert) {
        // Hack to get the cursor to end up at the right place. If I is
        // repeated in insert mode repeat, cursor will be 1 insert
        // change set left of where it should be.
        repeatCommand();
      }
      repeatInsert(repeat);
    }
    vim.inputState = cachedInputState;
    if (vim.insertMode && !repeatForInsert) {
      // Don't exit insert mode twice. If repeatForInsert is set, then we
      // were called by an exitInsertMode call lower on the stack.
      exitInsertMode(cm);
    }
    macroModeState.isPlaying = false;
  }
  /**@arg {CodeMirrorV} cm, @arg {string} key */
  function sendCmKey(cm, key) {
    CM.lookupKey(key, 'vim-insert', function keyHandler(binding) {
      if (typeof binding == 'string') {
        CM.commands[binding](cm);
      } else {
        binding(cm);
      }
      return true;
    });
  }
  /**
   * @param {CodeMirrorV} cm
   * @param {InsertModeChanges["changes"]} changes
   * @param {number} repeat
   */
  function repeatInsertModeChanges(cm, changes, repeat) {
    var head = cm.getCursor('head');
    var visualBlock = vimGlobalState.macroModeState.lastInsertModeChanges.visualBlock;
    if (visualBlock) {
      // Set up block selection again for repeating the changes.
      selectForInsert(cm, head, visualBlock + 1);
      repeat = cm.listSelections().length;
      cm.setCursor(head);
    }
    for (var i = 0; i < repeat; i++) {
      if (visualBlock) {
        cm.setCursor(offsetCursor(head, i, 0));
      }
      for (var j = 0; j < changes.length; j++) {
        var change = changes[j];
        if (change instanceof InsertModeKey) {
          sendCmKey(cm, change.keyName);
        } else if (typeof change == "string") {
          cm.replaceSelection(change);
        } else {
          var start = cm.getCursor();
          var end = offsetCursor(start, 0, change[0].length - (change[1] || 0));
          cm.replaceRange(change[0], start, change[1] ? start: end);
          cm.setCursor(end);
        }
      }
    }
    if (visualBlock) {
      cm.setCursor(offsetCursor(head, 0, 1));
    }
  }

  // multiselect support
  /** @arg {vimState} state */
  function cloneVimState(state) {
    // @ts-ignore
    var n = new state.constructor();
    Object.keys(state).forEach(function(key) {
      if (key == "insertEnd") return;
      var o = state[key];
      if (Array.isArray(o))
        o = o.slice();
      else if (o && typeof o == "object" && o.constructor != Object)
        o = cloneVimState(o);
      n[key] = o;
    });
    if (state.sel) {
      n.sel = {
        head: state.sel.head && copyCursor(state.sel.head),
        anchor: state.sel.anchor && copyCursor(state.sel.anchor)
      };
    }
    return n;
  }
  /** @arg {CodeMirror} cm_  @arg {string} key @arg {string} origin */
  function multiSelectHandleKey(cm_, key, origin) {
    var vim = maybeInitVimState(cm_);
    var cm = /**@type {CodeMirrorV}*/(cm_);
    /** @type {boolean | undefined} */
    var isHandled = false;
    var vim = vimApi.maybeInitVimState_(cm);
    var visualBlock = vim.visualBlock || vim.wasInVisualBlock;

    if (cm.state.closeVimNotification) {
      var close = cm.state.closeVimNotification;
      cm.state.closeVimNotification = null;
      close();
      if (key == '<CR>') {
        clearInputState(cm);
        return true;
      }
    }

    var wasMultiselect = cm.isInMultiSelectMode();
    if (vim.wasInVisualBlock && !wasMultiselect) {
      vim.wasInVisualBlock = false;
    } else if (wasMultiselect && vim.visualBlock) {
        vim.wasInVisualBlock = true;
    }

    if (key == '<Esc>' && !vim.insertMode && !vim.visualMode && wasMultiselect && vim.status == "<Esc>") {
      // allow editor to exit multiselect
      clearInputState(cm);
    // @ts-ignore
    } else if (visualBlock || !wasMultiselect || cm.inVirtualSelectionMode) {
      isHandled = vimApi.handleKey(cm, key, origin);
    } else {
      var old = cloneVimState(vim);
      var changeQueueList = vim.inputState.changeQueueList || [];

      cm.operation(function() {
        if (cm.curOp)
          cm.curOp.isVimOp = true;
        var index = 0;
        cm.forEachSelection(function() {
          cm.state.vim.inputState.changeQueue = changeQueueList[index];
          var head = cm.getCursor("head");
          var anchor = cm.getCursor("anchor");
          var headOffset = !cursorIsBefore(head, anchor) ? -1 : 0;
          var anchorOffset = cursorIsBefore(head, anchor) ? -1 : 0;
          head = offsetCursor(head, 0, headOffset);
          anchor = offsetCursor(anchor, 0, anchorOffset);
          cm.state.vim.sel.head = head;
          cm.state.vim.sel.anchor = anchor;

          isHandled = vimApi.handleKey(cm, key, origin);
          if (cm.virtualSelection) {
            changeQueueList[index] = cm.state.vim.inputState.changeQueue;
            cm.state.vim = cloneVimState(old);
          }
          index++;
        });
        if (cm.curOp?.cursorActivity && !isHandled)
          cm.curOp.cursorActivity = false;
        cm.state.vim = vim;
        vim.inputState.changeQueueList = changeQueueList;
        vim.inputState.changeQueue = null;
      }, true);
    }
    // some commands may bring visualMode and selection out of sync
    if (isHandled && !vim.visualMode && !vim.insertMode && vim.visualMode != cm.somethingSelected()) {
      handleExternalSelection(cm, vim);
    }
    return isHandled;
  }
  resetVimGlobalState();

  return vimApi;
}

function indexFromPos(doc, pos) {
    var ch = pos.ch;
    var lineNumber = pos.line + 1;
    if (lineNumber < 1) {
        lineNumber = 1;
        ch = 0;
    }
    if (lineNumber > doc.lines) {
        lineNumber = doc.lines;
        ch = Number.MAX_VALUE;
    }
    var line = doc.line(lineNumber);
    return Math.min(line.from + Math.max(0, ch), line.to);
}
function posFromIndex(doc, offset) {
    let line = doc.lineAt(offset);
    return { line: line.number - 1, ch: offset - line.from };
}
class Pos {
    constructor(line, ch) {
        this.line = line;
        this.ch = ch;
    }
}
function on(emitter, type, f) {
    if (emitter.addEventListener) {
        emitter.addEventListener(type, f, false);
    }
    else {
        var map = emitter._handlers || (emitter._handlers = {});
        map[type] = (map[type] || []).concat(f);
    }
}
function off(emitter, type, f) {
    if (emitter.removeEventListener) {
        emitter.removeEventListener(type, f, false);
    }
    else {
        var map = emitter._handlers, arr = map && map[type];
        if (arr) {
            var index = arr.indexOf(f);
            if (index > -1) {
                map[type] = arr.slice(0, index).concat(arr.slice(index + 1));
            }
        }
    }
}
function signal(emitter, type, ...args) {
    var _a;
    var handlers = (_a = emitter._handlers) === null || _a === void 0 ? void 0 : _a[type];
    if (!handlers)
        return;
    for (var i = 0; i < handlers.length; ++i) {
        handlers[i](...args);
    }
}
function signalTo(handlers, ...args) {
    if (!handlers)
        return;
    for (var i = 0; i < handlers.length; ++i) {
        handlers[i](...args);
    }
}
let wordChar;
try {
    wordChar = /*@__PURE__*/new RegExp("[\\w\\p{Alphabetic}\\p{Number}_]", "u");
}
catch (_) {
    wordChar = /[\w]/;
}
// workaround for missing api for merging transactions
function dispatchChange(cm, transaction) {
    var view = cm.cm6;
    if (view.state.readOnly)
        return;
    var type = "input.type.compose";
    if (cm.curOp) {
        if (!cm.curOp.lastChange)
            type = "input.type.compose.start";
    }
    if (transaction.annotations) {
        try {
            transaction.annotations.some(function (note) {
                if (note.value == "input")
                    note.value = type;
            });
        }
        catch (e) {
            console.error(e);
        }
    }
    else {
        transaction.userEvent = type;
    }
    return view.dispatch(transaction);
}
function runHistoryCommand(cm, revert) {
    var _a;
    if (cm.curOp) {
        cm.curOp.$changeStart = undefined;
    }
    (revert ? undo : redo)(cm.cm6);
    let changeStartIndex = (_a = cm.curOp) === null || _a === void 0 ? void 0 : _a.$changeStart;
    // vim mode expects the changed text to be either selected or cursor placed at the start
    if (changeStartIndex != null) {
        cm.cm6.dispatch({ selection: { anchor: changeStartIndex } });
    }
}
var keys = {
    Left: (cm) => runScopeHandlers(cm.cm6, { key: "Left" }, "editor"),
    Right: (cm) => runScopeHandlers(cm.cm6, { key: "Right" }, "editor"),
    Up: (cm) => runScopeHandlers(cm.cm6, { key: "Up" }, "editor"),
    Down: (cm) => runScopeHandlers(cm.cm6, { key: "Down" }, "editor"),
    Backspace: (cm) => runScopeHandlers(cm.cm6, { key: "Backspace" }, "editor"),
    Delete: (cm) => runScopeHandlers(cm.cm6, { key: "Delete" }, "editor"),
};
class CodeMirror {
    // --------------------------
    openDialog(template, callback, options) {
        return openDialog(this, template, callback, options);
    }
    ;
    openNotification(template, options) {
        return openNotification(this, template, options);
    }
    ;
    constructor(cm6) {
        this.state = {};
        this.marks = Object.create(null);
        this.$mid = 0; // marker id counter
        this.options = {};
        this._handlers = {};
        this.$lastChangeEndOffset = 0;
        this.virtualSelection = null;
        this.cm6 = cm6;
        this.onChange = this.onChange.bind(this);
        this.onSelectionChange = this.onSelectionChange.bind(this);
    }
    ;
    on(type, f) { on(this, type, f); }
    off(type, f) { off(this, type, f); }
    signal(type, e, handlers) { signal(this, type, e, handlers); }
    indexFromPos(pos) {
        return indexFromPos(this.cm6.state.doc, pos);
    }
    ;
    posFromIndex(offset) {
        return posFromIndex(this.cm6.state.doc, offset);
    }
    ;
    foldCode(pos) {
        let view = this.cm6;
        let ranges = view.state.selection.ranges;
        let doc = this.cm6.state.doc;
        let index = indexFromPos(doc, pos);
        let tmpRanges = EditorSelection.create([EditorSelection.range(index, index)], 0).ranges;
        view.state.selection.ranges = tmpRanges;
        foldCode(view);
        view.state.selection.ranges = ranges;
    }
    firstLine() { return 0; }
    ;
    lastLine() { return this.cm6.state.doc.lines - 1; }
    ;
    lineCount() { return this.cm6.state.doc.lines; }
    ;
    setCursor(line, ch) {
        if (typeof line === 'object') {
            ch = line.ch;
            line = line.line;
        }
        var offset = indexFromPos(this.cm6.state.doc, { line, ch: ch || 0 });
        this.cm6.dispatch({ selection: { anchor: offset } }, { scrollIntoView: !this.curOp });
        if (this.curOp && !this.curOp.isVimOp)
            this.onBeforeEndOperation();
    }
    ;
    getCursor(p) {
        var sel = this.cm6.state.selection.main;
        var offset = p == "head" || !p
            ? sel.head
            : p == "anchor"
                ? sel.anchor
                : p == "start"
                    ? sel.from
                    : p == "end"
                        ? sel.to
                        : null;
        if (offset == null)
            throw new Error("Invalid cursor type");
        return this.posFromIndex(offset);
    }
    ;
    listSelections() {
        var doc = this.cm6.state.doc;
        return this.cm6.state.selection.ranges.map(r => {
            return {
                anchor: posFromIndex(doc, r.anchor),
                head: posFromIndex(doc, r.head),
            };
        });
    }
    ;
    setSelections(p, primIndex) {
        var doc = this.cm6.state.doc;
        var ranges = p.map(x => {
            var head = indexFromPos(doc, x.head);
            var anchor = indexFromPos(doc, x.anchor);
            // workaround for codemirror bug, see https://github.com/replit/codemirror-vim/issues/169
            if (head == anchor)
                return EditorSelection.cursor(head, 1);
            return EditorSelection.range(anchor, head);
        });
        this.cm6.dispatch({
            selection: EditorSelection.create(ranges, primIndex)
        });
    }
    ;
    setSelection(anchor, head, options) {
        this.setSelections([{ anchor, head }], 0);
        if (options && options.origin == '*mouse') {
            this.onBeforeEndOperation();
        }
    }
    ;
    getLine(row) {
        var doc = this.cm6.state.doc;
        if (row < 0 || row >= doc.lines)
            return "";
        return this.cm6.state.doc.line(row + 1).text;
    }
    ;
    getLineHandle(row) {
        if (!this.$lineHandleChanges)
            this.$lineHandleChanges = [];
        return { row: row, index: this.indexFromPos(new Pos(row, 0)) };
    }
    getLineNumber(handle) {
        var updates = this.$lineHandleChanges;
        if (!updates)
            return null;
        var offset = handle.index;
        for (var i = 0; i < updates.length; i++) {
            offset = updates[i].changes.mapPos(offset, 1, MapMode.TrackAfter);
            if (offset == null)
                return null;
        }
        var pos = this.posFromIndex(offset);
        return pos.ch == 0 ? pos.line : null;
    }
    releaseLineHandles() {
        this.$lineHandleChanges = undefined;
    }
    getRange(s, e) {
        var doc = this.cm6.state.doc;
        return this.cm6.state.sliceDoc(indexFromPos(doc, s), indexFromPos(doc, e));
    }
    ;
    replaceRange(text, s, e, source) {
        if (!e)
            e = s;
        var doc = this.cm6.state.doc;
        var from = indexFromPos(doc, s);
        var to = indexFromPos(doc, e);
        dispatchChange(this, { changes: { from, to, insert: text } });
    }
    ;
    replaceSelection(text) {
        dispatchChange(this, this.cm6.state.replaceSelection(text));
    }
    ;
    replaceSelections(replacements) {
        var ranges = this.cm6.state.selection.ranges;
        var changes = ranges.map((r, i) => {
            return { from: r.from, to: r.to, insert: replacements[i] || "" };
        });
        dispatchChange(this, { changes });
    }
    ;
    getSelection() {
        return this.getSelections().join("\n");
    }
    ;
    getSelections() {
        var cm = this.cm6;
        return cm.state.selection.ranges.map(r => cm.state.sliceDoc(r.from, r.to));
    }
    ;
    somethingSelected() {
        return this.cm6.state.selection.ranges.some(r => !r.empty);
    }
    ;
    getInputField() {
        return this.cm6.contentDOM;
    }
    ;
    clipPos(p) {
        var doc = this.cm6.state.doc;
        var ch = p.ch;
        var lineNumber = p.line + 1;
        if (lineNumber < 1) {
            lineNumber = 1;
            ch = 0;
        }
        if (lineNumber > doc.lines) {
            lineNumber = doc.lines;
            ch = Number.MAX_VALUE;
        }
        var line = doc.line(lineNumber);
        ch = Math.min(Math.max(0, ch), line.to - line.from);
        return new Pos(lineNumber - 1, ch);
    }
    ;
    getValue() {
        return this.cm6.state.doc.toString();
    }
    ;
    setValue(text) {
        var cm = this.cm6;
        return cm.dispatch({
            changes: { from: 0, to: cm.state.doc.length, insert: text },
            selection: EditorSelection.range(0, 0)
        });
    }
    ;
    focus() {
        return this.cm6.focus();
    }
    ;
    blur() {
        return this.cm6.contentDOM.blur();
    }
    ;
    defaultTextHeight() {
        return this.cm6.defaultLineHeight;
    }
    ;
    findMatchingBracket(pos, _options) {
        var state = this.cm6.state;
        var offset = indexFromPos(state.doc, pos);
        var m = matchBrackets(state, offset + 1, -1);
        if (m && m.end) {
            return { to: posFromIndex(state.doc, m.end.from) };
        }
        m = matchBrackets(state, offset, 1);
        if (m && m.end) {
            return { to: posFromIndex(state.doc, m.end.from) };
        }
        return { to: undefined };
    }
    ;
    scanForBracket(pos, dir, style, config) {
        return scanForBracket(this, pos, dir, style, config);
    }
    ;
    indentLine(line, more) {
        // todo how to indent only one line instead of selection
        if (more)
            this.indentMore();
        else
            this.indentLess();
    }
    ;
    indentMore() {
        indentMore(this.cm6);
    }
    ;
    indentLess() {
        indentLess(this.cm6);
    }
    ;
    execCommand(name) {
        if (name == "indentAuto")
            CodeMirror.commands.indentAuto(this);
        else if (name == "goLineLeft")
            cursorLineBoundaryBackward(this.cm6);
        else if (name == "goLineRight") {
            cursorLineBoundaryForward(this.cm6);
            let state = this.cm6.state;
            let cur = state.selection.main.head;
            if (cur < state.doc.length && state.sliceDoc(cur, cur + 1) !== "\n") {
                cursorCharBackward(this.cm6);
            }
        }
        else
            console.log(name + " is not implemented");
    }
    ;
    setBookmark(cursor, options) {
        var assoc = (options === null || options === void 0 ? void 0 : options.insertLeft) ? 1 : -1;
        var offset = this.indexFromPos(cursor);
        var bm = new Marker(this, offset, assoc);
        return bm;
    }
    ;
    addOverlay({ query }) {
        let cm6Query = new SearchQuery({
            regexp: true,
            search: query.source,
            caseSensitive: !/i/.test(query.flags),
        });
        if (cm6Query.valid) {
            cm6Query.forVim = true;
            this.cm6Query = cm6Query;
            let effect = setSearchQuery.of(cm6Query);
            this.cm6.dispatch({ effects: effect });
            return cm6Query;
        }
    }
    ;
    removeOverlay(overlay) {
        if (!this.cm6Query)
            return;
        this.cm6Query.forVim = false;
        let effect = setSearchQuery.of(this.cm6Query);
        this.cm6.dispatch({ effects: effect });
    }
    ;
    getSearchCursor(query, pos) {
        var cm = this;
        var last = null;
        var lastCM5Result = null;
        var afterEmptyMatch = false;
        if (pos.ch == undefined)
            pos.ch = Number.MAX_VALUE;
        var firstOffset = indexFromPos(cm.cm6.state.doc, pos);
        var source = query.source.replace(/(\\.|{(?:\d+(?:,\d*)?|,\d+)})|[{}]/g, function (a, b) {
            if (!b)
                return "\\" + a;
            return b;
        });
        function rCursor(doc, from = 0, to = doc.length) {
            return new RegExpCursor(doc, source, { ignoreCase: query.ignoreCase }, from, to);
        }
        function nextMatch(from) {
            var doc = cm.cm6.state.doc;
            if (from > doc.length)
                return null;
            let res = rCursor(doc, from).next();
            return res.done ? null : res.value;
        }
        var ChunkSize = 10000;
        function prevMatchInRange(from, to) {
            var doc = cm.cm6.state.doc;
            for (let size = 1;; size++) {
                let start = Math.max(from, to - size * ChunkSize);
                let cursor = rCursor(doc, start, to), range = null;
                while (!cursor.next().done)
                    range = cursor.value;
                if (range && (start == from || range.from > start + 10))
                    return range;
                if (start == from)
                    return null;
            }
        }
        return {
            findNext: function () { return this.find(false); },
            findPrevious: function () { return this.find(true); },
            find: function (back) {
                var doc = cm.cm6.state.doc;
                if (back) {
                    let endAt = last ? (afterEmptyMatch ? last.to - 1 : last.from) : firstOffset;
                    last = prevMatchInRange(0, endAt);
                }
                else {
                    let startFrom = last ? (afterEmptyMatch ? last.to + 1 : last.to) : firstOffset;
                    last = nextMatch(startFrom);
                }
                lastCM5Result = last && {
                    from: posFromIndex(doc, last.from),
                    to: posFromIndex(doc, last.to),
                    match: last.match,
                };
                afterEmptyMatch = last ? last.from == last.to : false;
                return last && last.match;
            },
            from: function () { return lastCM5Result === null || lastCM5Result === void 0 ? void 0 : lastCM5Result.from; },
            to: function () { return lastCM5Result === null || lastCM5Result === void 0 ? void 0 : lastCM5Result.to; },
            replace: function (text) {
                if (last) {
                    dispatchChange(cm, {
                        changes: { from: last.from, to: last.to, insert: text }
                    });
                    last.to = last.from + text.length;
                    if (lastCM5Result) {
                        lastCM5Result.to = posFromIndex(cm.cm6.state.doc, last.to);
                    }
                }
            },
            get match() {
                return lastCM5Result && lastCM5Result.match;
            }
        };
    }
    ;
    findPosV(start, amount, unit, goalColumn) {
        let { cm6 } = this;
        const doc = cm6.state.doc;
        let pixels = unit == 'page' ? cm6.dom.clientHeight : 0;
        const startOffset = indexFromPos(doc, start);
        let range = EditorSelection.cursor(startOffset, 1, undefined, goalColumn);
        let count = Math.round(Math.abs(amount));
        for (let i = 0; i < count; i++) {
            if (unit == 'page') {
                range = cm6.moveVertically(range, amount > 0, pixels);
            }
            else if (unit == 'line') {
                range = cm6.moveVertically(range, amount > 0);
            }
        }
        let pos = posFromIndex(doc, range.head);
        // set hitside to true if there was no place to move and cursor was clipped to the edge
        // of document. Needed for gj/gk
        if ((amount < 0 &&
            range.head == 0 && goalColumn != 0 &&
            start.line == 0 && start.ch != 0) || (amount > 0 &&
            range.head == doc.length && pos.ch != goalColumn
            && start.line == pos.line)) {
            pos.hitSide = true;
        }
        return pos;
    }
    ;
    charCoords(pos, mode) {
        var rect = this.cm6.contentDOM.getBoundingClientRect();
        var offset = indexFromPos(this.cm6.state.doc, pos);
        var coords = this.cm6.coordsAtPos(offset);
        var d = -rect.top;
        return { left: ((coords === null || coords === void 0 ? void 0 : coords.left) || 0) - rect.left, top: ((coords === null || coords === void 0 ? void 0 : coords.top) || 0) + d, bottom: ((coords === null || coords === void 0 ? void 0 : coords.bottom) || 0) + d };
    }
    ;
    coordsChar(coords, mode) {
        var rect = this.cm6.contentDOM.getBoundingClientRect();
        var offset = this.cm6.posAtCoords({ x: coords.left + rect.left, y: coords.top + rect.top }) || 0;
        return posFromIndex(this.cm6.state.doc, offset);
    }
    ;
    getScrollInfo() {
        var scroller = this.cm6.scrollDOM;
        return {
            left: scroller.scrollLeft, top: scroller.scrollTop,
            height: scroller.scrollHeight,
            width: scroller.scrollWidth,
            clientHeight: scroller.clientHeight, clientWidth: scroller.clientWidth
        };
    }
    ;
    scrollTo(x, y) {
        if (x != null)
            this.cm6.scrollDOM.scrollLeft = x;
        if (y != null)
            this.cm6.scrollDOM.scrollTop = y;
    }
    ;
    scrollIntoView(pos, margin) {
        if (pos) {
            var offset = this.indexFromPos(pos);
            this.cm6.dispatch({
                effects: EditorView.scrollIntoView(offset)
            });
        }
        else {
            this.cm6.dispatch({ scrollIntoView: true, userEvent: "scroll" });
        }
    }
    ;
    getWrapperElement() {
        return this.cm6.dom;
    }
    ;
    // for tests
    getMode() {
        return { name: this.getOption("mode") };
    }
    ;
    setSize(w, h) {
        this.cm6.dom.style.width = w + 4 + "px";
        this.cm6.dom.style.height = h + "px";
        this.refresh();
    }
    refresh() {
        this.cm6.measure();
    }
    // event listeners
    destroy() {
        this.removeOverlay();
    }
    ;
    getLastEditEnd() {
        return this.posFromIndex(this.$lastChangeEndOffset);
    }
    ;
    onChange(update) {
        if (this.$lineHandleChanges) {
            this.$lineHandleChanges.push(update);
        }
        for (let i in this.marks) {
            let m = this.marks[i];
            m.update(update.changes);
        }
        if (this.virtualSelection) {
            this.virtualSelection.ranges = this.virtualSelection.ranges.map(range => range.map(update.changes));
        }
        var curOp = this.curOp = this.curOp || {};
        update.changes.iterChanges((fromA, toA, fromB, toB, text) => {
            if (curOp.$changeStart == null || curOp.$changeStart > fromB)
                curOp.$changeStart = fromB;
            this.$lastChangeEndOffset = toB;
            var change = { text: text.toJSON() };
            if (!curOp.lastChange) {
                curOp.lastChange = curOp.change = change;
            }
            else {
                curOp.lastChange.next = curOp.lastChange = change;
            }
        }, true);
        if (!curOp.changeHandlers)
            curOp.changeHandlers = this._handlers["change"] && this._handlers["change"].slice();
    }
    ;
    onSelectionChange() {
        var curOp = this.curOp = this.curOp || {};
        if (!curOp.cursorActivityHandlers)
            curOp.cursorActivityHandlers = this._handlers["cursorActivity"] && this._handlers["cursorActivity"].slice();
        this.curOp.cursorActivity = true;
    }
    ;
    operation(fn, force) {
        if (!this.curOp)
            this.curOp = { $d: 0 };
        this.curOp.$d++;
        try {
            var result = fn();
        }
        finally {
            if (this.curOp) {
                this.curOp.$d--;
                if (!this.curOp.$d)
                    this.onBeforeEndOperation();
            }
        }
        return result;
    }
    ;
    onBeforeEndOperation() {
        var op = this.curOp;
        var scrollIntoView = false;
        if (op) {
            if (op.change) {
                signalTo(op.changeHandlers, this, op.change);
            }
            if (op && op.cursorActivity) {
                signalTo(op.cursorActivityHandlers, this, null);
                if (op.isVimOp)
                    scrollIntoView = true;
            }
            this.curOp = null;
        }
        if (scrollIntoView)
            this.scrollIntoView();
    }
    ;
    moveH(increment, unit) {
        if (unit == 'char') {
            // todo
            var cur = this.getCursor();
            this.setCursor(cur.line, cur.ch + increment);
        }
    }
    ;
    setOption(name, val) {
        switch (name) {
            case "keyMap":
                this.state.keyMap = val;
                break;
            case "textwidth":
                this.state.textwidth = val;
                break;
        }
    }
    ;
    getOption(name) {
        switch (name) {
            case "firstLineNumber": return 1;
            case "tabSize": return this.cm6.state.tabSize || 4;
            case "readOnly": return this.cm6.state.readOnly;
            case "indentWithTabs": return this.cm6.state.facet(indentUnit) == "\t"; // TODO
            case "indentUnit": return this.cm6.state.facet(indentUnit).length || 2;
            case "textwidth": return this.state.textwidth;
            // for tests
            case "keyMap": return this.state.keyMap || "vim";
        }
    }
    ;
    toggleOverwrite(on) {
        this.state.overwrite = on;
    }
    ;
    getTokenTypeAt(pos) {
        var _a;
        // only comment|string are needed
        var offset = this.indexFromPos(pos);
        var tree = ensureSyntaxTree(this.cm6.state, offset);
        var node = tree === null || tree === void 0 ? void 0 : tree.resolve(offset);
        var type = ((_a = node === null || node === void 0 ? void 0 : node.type) === null || _a === void 0 ? void 0 : _a.name) || "";
        if (/comment/i.test(type))
            return "comment";
        if (/string/i.test(type))
            return "string";
        return "";
    }
    ;
    overWriteSelection(text) {
        var doc = this.cm6.state.doc;
        var sel = this.cm6.state.selection;
        var ranges = sel.ranges.map(x => {
            if (x.empty) {
                var ch = x.to < doc.length ? doc.sliceString(x.from, x.to + 1) : "";
                if (ch && !/\n/.test(ch))
                    return EditorSelection.range(x.from, x.to + 1);
            }
            return x;
        });
        this.cm6.dispatch({
            selection: EditorSelection.create(ranges, sel.mainIndex)
        });
        this.replaceSelection(text);
    }
    /*** multiselect ****/
    isInMultiSelectMode() {
        return this.cm6.state.selection.ranges.length > 1;
    }
    virtualSelectionMode() {
        return !!this.virtualSelection;
    }
    forEachSelection(command) {
        var selection = this.cm6.state.selection;
        this.virtualSelection = EditorSelection.create(selection.ranges, selection.mainIndex);
        for (var i = 0; i < this.virtualSelection.ranges.length; i++) {
            var range = this.virtualSelection.ranges[i];
            if (!range)
                continue;
            this.cm6.dispatch({ selection: EditorSelection.create([range]) });
            command();
            this.virtualSelection.ranges[i] = this.cm6.state.selection.ranges[0];
        }
        this.cm6.dispatch({ selection: this.virtualSelection });
        this.virtualSelection = null;
    }
    hardWrap(options) {
        return hardWrap(this, options);
    }
}
CodeMirror.isMac = typeof navigator != "undefined" && /*@__PURE__*//Mac/.test(navigator.platform);
// --------------------------
CodeMirror.Pos = Pos;
CodeMirror.StringStream = StringStream;
CodeMirror.commands = {
    cursorCharLeft: function (cm) { cursorCharLeft(cm.cm6); },
    redo: function (cm) { runHistoryCommand(cm, false); },
    undo: function (cm) { runHistoryCommand(cm, true); },
    newlineAndIndent: function (cm) {
        insertNewlineAndIndent({
            state: cm.cm6.state,
            dispatch: (tr) => {
                return dispatchChange(cm, tr);
            }
        });
    },
    indentAuto: function (cm) {
        indentSelection(cm.cm6);
    },
    newlineAndIndentContinueComment: undefined,
    save: undefined,
};
CodeMirror.isWordChar = function (ch) {
    return wordChar.test(ch);
};
CodeMirror.keys = keys;
CodeMirror.addClass = function (el, str) { };
CodeMirror.rmClass = function (el, str) { };
CodeMirror.e_preventDefault = function (e) {
    e.preventDefault();
};
CodeMirror.e_stop = function (e) {
    var _a, _b;
    (_a = e === null || e === void 0 ? void 0 : e.stopPropagation) === null || _a === void 0 ? void 0 : _a.call(e);
    (_b = e === null || e === void 0 ? void 0 : e.preventDefault) === null || _b === void 0 ? void 0 : _b.call(e);
};
CodeMirror.lookupKey = function lookupKey(key, map, handle) {
    var result = CodeMirror.keys[key];
    if (!result && /^Arrow/.test(key))
        result = CodeMirror.keys[key.slice(5)];
    if (result)
        handle(result);
};
CodeMirror.on = on;
CodeMirror.off = off;
CodeMirror.signal = signal;
CodeMirror.findMatchingTag = findMatchingTag;
CodeMirror.findEnclosingTag = findEnclosingTag;
CodeMirror.keyName = undefined;
/************* dialog *************/
function dialogDiv(cm, template, bottom) {
    var dialog = document.createElement("div");
    dialog.appendChild(template);
    return dialog;
}
function closeNotification(cm, newVal) {
    if (cm.state.currentNotificationClose)
        cm.state.currentNotificationClose();
    cm.state.currentNotificationClose = newVal;
}
function openNotification(cm, template, options) {
    closeNotification(cm, close);
    var dialog = dialogDiv(cm, template, options && options.bottom);
    var closed = false;
    var doneTimer;
    var duration = options && typeof options.duration !== "undefined" ? options.duration : 5000;
    function close() {
        if (closed)
            return;
        closed = true;
        clearTimeout(doneTimer);
        dialog.remove();
        hideDialog(cm, dialog);
    }
    dialog.onclick = function (e) {
        e.preventDefault();
        close();
    };
    showDialog(cm, dialog);
    if (duration)
        doneTimer = setTimeout(close, duration);
    return close;
}
function showDialog(cm, dialog) {
    var oldDialog = cm.state.dialog;
    cm.state.dialog = dialog;
    dialog.style.flex = "1";
    if (dialog && oldDialog !== dialog) {
        if (oldDialog && oldDialog.contains(document.activeElement))
            cm.focus();
        if (oldDialog && oldDialog.parentElement) {
            oldDialog.parentElement.replaceChild(dialog, oldDialog);
        }
        else if (oldDialog) {
            oldDialog.remove();
        }
        CodeMirror.signal(cm, "dialog");
    }
}
function hideDialog(cm, dialog) {
    if (cm.state.dialog == dialog) {
        cm.state.dialog = null;
        CodeMirror.signal(cm, "dialog");
    }
}
function openDialog(me, template, callback, options) {
    if (!options)
        options = {};
    closeNotification(me, undefined);
    var dialog = dialogDiv(me, template, options.bottom);
    var closed = false;
    showDialog(me, dialog);
    function close(newVal) {
        if (typeof newVal == 'string') {
            inp.value = newVal;
        }
        else {
            if (closed)
                return;
            closed = true;
            hideDialog(me, dialog);
            if (!me.state.dialog)
                me.focus();
            if (options.onClose)
                options.onClose(dialog);
        }
    }
    var inp = dialog.getElementsByTagName("input")[0];
    if (inp) {
        if (options.value) {
            inp.value = options.value;
            if (options.selectValueOnOpen !== false)
                inp.select();
        }
        if (options.onInput)
            CodeMirror.on(inp, "input", function (e) { options.onInput(e, inp.value, close); });
        if (options.onKeyUp)
            CodeMirror.on(inp, "keyup", function (e) { options.onKeyUp(e, inp.value, close); });
        CodeMirror.on(inp, "keydown", function (e) {
            if (options && options.onKeyDown && options.onKeyDown(e, inp.value, close)) {
                return;
            }
            if (e.keyCode == 13)
                callback && callback(inp.value);
            if (e.keyCode == 27 || (options.closeOnEnter !== false && e.keyCode == 13)) {
                inp.blur();
                CodeMirror.e_stop(e);
                close();
            }
        });
        if (options.closeOnBlur !== false)
            CodeMirror.on(inp, "blur", function () {
                setTimeout(function () {
                    if (document.activeElement === inp)
                        return;
                    close();
                });
            });
        inp.focus();
    }
    return close;
}
var matching = { "(": ")>", ")": "(<", "[": "]>", "]": "[<", "{": "}>", "}": "{<", "<": ">>", ">": "<<" };
function bracketRegex(config) {
    return config && config.bracketRegex || /[(){}[\]]/;
}
function scanForBracket(cm, where, dir, style, config) {
    var maxScanLen = (config && config.maxScanLineLength) || 10000;
    var maxScanLines = (config && config.maxScanLines) || 1000;
    var stack = [];
    var re = bracketRegex(config);
    var lineEnd = dir > 0 ? Math.min(where.line + maxScanLines, cm.lastLine() + 1)
        : Math.max(cm.firstLine() - 1, where.line - maxScanLines);
    for (var lineNo = where.line; lineNo != lineEnd; lineNo += dir) {
        var line = cm.getLine(lineNo);
        if (!line)
            continue;
        var pos = dir > 0 ? 0 : line.length - 1, end = dir > 0 ? line.length : -1;
        if (line.length > maxScanLen)
            continue;
        if (lineNo == where.line)
            pos = where.ch - (dir < 0 ? 1 : 0);
        for (; pos != end; pos += dir) {
            var ch = line.charAt(pos);
            if (re.test(ch) /*&& (style === undefined ||
                                (cm.getTokenTypeAt(new Pos(lineNo, pos + 1)) || "") == (style || ""))*/) {
                var match = matching[ch];
                if (match && (match.charAt(1) == ">") == (dir > 0))
                    stack.push(ch);
                else if (!stack.length)
                    return { pos: new Pos(lineNo, pos), ch: ch };
                else
                    stack.pop();
            }
        }
    }
    return lineNo - dir == (dir > 0 ? cm.lastLine() : cm.firstLine()) ? false : null;
}
function findMatchingTag(cm, pos) {
    return null;
}
function findEnclosingTag(cm, pos) {
    var _a, _b;
    var state = cm.cm6.state;
    var offset = cm.indexFromPos(pos);
    if (offset < state.doc.length) {
        var text = state.sliceDoc(offset, offset + 1);
        if (text == "<")
            offset++;
    }
    var tree = ensureSyntaxTree(state, offset);
    var node = (tree === null || tree === void 0 ? void 0 : tree.resolve(offset)) || null;
    while (node) {
        if (((_a = node.firstChild) === null || _a === void 0 ? void 0 : _a.type.name) == 'OpenTag'
            && ((_b = node.lastChild) === null || _b === void 0 ? void 0 : _b.type.name) == 'CloseTag') {
            return {
                open: convertRange(state.doc, node.firstChild),
                close: convertRange(state.doc, node.lastChild),
            };
        }
        node = node.parent;
    }
}
function convertRange(doc, cm6Range) {
    return {
        from: posFromIndex(doc, cm6Range.from),
        to: posFromIndex(doc, cm6Range.to)
    };
}
class Marker {
    constructor(cm, offset, assoc) {
        this.cm = cm;
        this.id = cm.$mid++;
        this.offset = offset;
        this.assoc = assoc;
        cm.marks[this.id] = this;
    }
    ;
    clear() { delete this.cm.marks[this.id]; }
    ;
    find() {
        if (this.offset == null)
            return null;
        return this.cm.posFromIndex(this.offset);
    }
    ;
    update(change) {
        if (this.offset != null)
            this.offset = change.mapPos(this.offset, this.assoc, MapMode.TrackDel);
    }
}
function hardWrap(cm, options) {
    var _a;
    var max = options.column || cm.getOption('textwidth') || 80;
    var allowMerge = options.allowMerge != false;
    var row = Math.min(options.from, options.to);
    var endRow = Math.max(options.from, options.to);
    while (row <= endRow) {
        var line = cm.getLine(row);
        if (line.length > max) {
            var space = findSpace(line, max, 5);
            if (space) {
                var indentation = (_a = /^\s*/.exec(line)) === null || _a === void 0 ? void 0 : _a[0];
                cm.replaceRange("\n" + indentation, new Pos(row, space.start), new Pos(row, space.end));
            }
            endRow++;
        }
        else if (allowMerge && /\S/.test(line) && row != endRow) {
            var nextLine = cm.getLine(row + 1);
            if (nextLine && /\S/.test(nextLine)) {
                var trimmedLine = line.replace(/\s+$/, "");
                var trimmedNextLine = nextLine.replace(/^\s+/, "");
                var mergedLine = trimmedLine + " " + trimmedNextLine;
                var space = findSpace(mergedLine, max, 5);
                if (space && space.start > trimmedLine.length || mergedLine.length < max) {
                    cm.replaceRange(" ", new Pos(row, trimmedLine.length), new Pos(row + 1, nextLine.length - trimmedNextLine.length));
                    row--;
                    endRow--;
                }
                else if (trimmedLine.length < line.length) {
                    cm.replaceRange("", new Pos(row, trimmedLine.length), new Pos(row, line.length));
                }
            }
        }
        row++;
    }
    return row;
    function findSpace(line, max, min) {
        if (line.length < max)
            return;
        var before = line.slice(0, max);
        var after = line.slice(max);
        var spaceAfter = /^(?:(\s+)|(\S+)(\s+))/.exec(after);
        var spaceBefore = /(?:(\s+)|(\s+)(\S+))$/.exec(before);
        var start = 0;
        var end = 0;
        if (spaceBefore && !spaceBefore[2]) {
            start = max - spaceBefore[1].length;
            end = max;
        }
        if (spaceAfter && !spaceAfter[2]) {
            if (!start)
                start = max;
            end = max + spaceAfter[1].length;
        }
        if (start) {
            return {
                start: start,
                end: end
            };
        }
        if (spaceBefore && spaceBefore[2] && spaceBefore.index > min) {
            return {
                start: spaceBefore.index,
                end: spaceBefore.index + spaceBefore[2].length
            };
        }
        if (spaceAfter && spaceAfter[2]) {
            start = max + spaceAfter[2].length;
            return {
                start: start,
                end: start + spaceAfter[3].length
            };
        }
    }
}

// backwards compatibility for old versions not supporting getDrawSelectionConfig
let getDrawSelectionConfig = View.getDrawSelectionConfig || /*@__PURE__*/function () {
    let defaultConfig = { cursorBlinkRate: 1200 };
    return function () {
        return defaultConfig;
    };
}();
class Piece {
    constructor(left, top, height, fontFamily, fontSize, fontWeight, color, className, letter, partial) {
        this.left = left;
        this.top = top;
        this.height = height;
        this.fontFamily = fontFamily;
        this.fontSize = fontSize;
        this.fontWeight = fontWeight;
        this.color = color;
        this.className = className;
        this.letter = letter;
        this.partial = partial;
    }
    draw() {
        let elt = document.createElement("div");
        elt.className = this.className;
        this.adjust(elt);
        return elt;
    }
    adjust(elt) {
        elt.style.left = this.left + "px";
        elt.style.top = this.top + "px";
        elt.style.height = this.height + "px";
        elt.style.lineHeight = this.height + "px";
        elt.style.fontFamily = this.fontFamily;
        elt.style.fontSize = this.fontSize;
        elt.style.fontWeight = this.fontWeight;
        elt.style.color = this.partial ? "transparent" : this.color;
        elt.className = this.className;
        elt.textContent = this.letter;
    }
    eq(p) {
        return this.left == p.left && this.top == p.top && this.height == p.height &&
            this.fontFamily == p.fontFamily && this.fontSize == p.fontSize &&
            this.fontWeight == p.fontWeight && this.color == p.color &&
            this.className == p.className &&
            this.letter == p.letter;
    }
}
class BlockCursorPlugin {
    constructor(view, cm) {
        this.view = view;
        this.rangePieces = [];
        this.cursors = [];
        this.cm = cm;
        this.measureReq = { read: this.readPos.bind(this), write: this.drawSel.bind(this) };
        this.cursorLayer = view.scrollDOM.appendChild(document.createElement("div"));
        this.cursorLayer.className = "cm-cursorLayer cm-vimCursorLayer";
        this.cursorLayer.setAttribute("aria-hidden", "true");
        view.requestMeasure(this.measureReq);
        this.setBlinkRate();
    }
    setBlinkRate() {
        let config = getDrawSelectionConfig(this.cm.cm6.state);
        let blinkRate = config.cursorBlinkRate;
        this.cursorLayer.style.animationDuration = blinkRate + "ms";
    }
    update(update) {
        if (update.selectionSet || update.geometryChanged || update.viewportChanged) {
            this.view.requestMeasure(this.measureReq);
            this.cursorLayer.style.animationName = this.cursorLayer.style.animationName == "cm-blink" ? "cm-blink2" : "cm-blink";
        }
        if (configChanged(update))
            this.setBlinkRate();
    }
    scheduleRedraw() {
        this.view.requestMeasure(this.measureReq);
    }
    readPos() {
        let { state } = this.view;
        let cursors = [];
        for (let r of state.selection.ranges) {
            let prim = r == state.selection.main;
            let piece = measureCursor(this.cm, this.view, r, prim);
            if (piece)
                cursors.push(piece);
        }
        return { cursors };
    }
    drawSel({ cursors }) {
        if (cursors.length != this.cursors.length || cursors.some((c, i) => !c.eq(this.cursors[i]))) {
            let oldCursors = this.cursorLayer.children;
            if (oldCursors.length !== cursors.length) {
                this.cursorLayer.textContent = "";
                for (const c of cursors)
                    this.cursorLayer.appendChild(c.draw());
            }
            else {
                cursors.forEach((c, idx) => c.adjust(oldCursors[idx]));
            }
            this.cursors = cursors;
        }
    }
    destroy() {
        this.cursorLayer.remove();
    }
}
function configChanged(update) {
    return getDrawSelectionConfig(update.startState) != getDrawSelectionConfig(update.state);
}
const themeSpec = {
    ".cm-vimMode .cm-line": {
        "& ::selection": { backgroundColor: "transparent !important" },
        "&::selection": { backgroundColor: "transparent !important" },
        caretColor: "transparent !important",
    },
    ".cm-fat-cursor": {
        position: "absolute",
        background: "#ff9696",
        border: "none",
        whiteSpace: "pre",
    },
    "&:not(.cm-focused) .cm-fat-cursor": {
        background: "none",
        outline: "solid 1px #ff9696",
        color: "transparent !important",
    },
};
const hideNativeSelection = /*@__PURE__*/Prec.highest(/*@__PURE__*/EditorView.theme(themeSpec));
function getBase(view) {
    let rect = view.scrollDOM.getBoundingClientRect();
    let left = view.textDirection == Direction.LTR ? rect.left : rect.right - view.scrollDOM.clientWidth;
    return { left: left - view.scrollDOM.scrollLeft * view.scaleX, top: rect.top - view.scrollDOM.scrollTop * view.scaleY };
}
function measureCursor(cm, view, cursor, primary) {
    var _a, _b, _c, _d;
    let head = cursor.head;
    let fatCursor = false;
    let hCoeff = 1;
    let vim = cm.state.vim;
    if (vim && (!vim.insertMode || cm.state.overwrite)) {
        fatCursor = true;
        if (vim.visualBlock && !primary)
            return null;
        if (cursor.anchor < cursor.head) {
            let letter = head < view.state.doc.length && view.state.sliceDoc(head, head + 1);
            if (letter != "\n")
                head--;
        }
        if (cm.state.overwrite)
            hCoeff = 0.2;
        else if (vim.status)
            hCoeff = 0.5;
    }
    if (fatCursor) {
        let letter = head < view.state.doc.length && view.state.sliceDoc(head, head + 1);
        if (letter && (/[\uDC00-\uDFFF]/.test(letter) && head > 1)) {
            // step back if cursor is on the second half of a surrogate pair
            head--;
            letter = view.state.sliceDoc(head, head + 1);
        }
        let pos = view.coordsAtPos(head, 1);
        if (!pos)
            return null;
        let base = getBase(view);
        let domAtPos = view.domAtPos(head);
        let node = domAtPos ? domAtPos.node : view.contentDOM;
        if (node instanceof Text && domAtPos.offset >= node.data.length) {
            if ((_a = node.parentElement) === null || _a === void 0 ? void 0 : _a.nextSibling) {
                node = (_b = node.parentElement) === null || _b === void 0 ? void 0 : _b.nextSibling;
                domAtPos = { node: node, offset: 0 };
            }
        }
        while (domAtPos && domAtPos.node instanceof HTMLElement) {
            node = domAtPos.node;
            domAtPos = { node: domAtPos.node.childNodes[domAtPos.offset], offset: 0 };
        }
        if (!(node instanceof HTMLElement)) {
            if (!node.parentNode)
                return null;
            node = node.parentNode;
        }
        let style = getComputedStyle(node);
        let left = pos.left;
        // TODO remove coordsAtPos when all supported versions of codemirror have coordsForChar api
        let charCoords = (_d = (_c = view).coordsForChar) === null || _d === void 0 ? void 0 : _d.call(_c, head);
        if (charCoords) {
            left = charCoords.left;
        }
        if (!letter || letter == "\n" || letter == "\r") {
            letter = "\xa0";
        }
        else if (letter == "\t") {
            letter = "\xa0";
            var nextPos = view.coordsAtPos(head + 1, -1);
            if (nextPos) {
                left = nextPos.left - (nextPos.left - pos.left) / parseInt(style.tabSize);
            }
        }
        else if ((/[\uD800-\uDBFF]/.test(letter) && head < view.state.doc.length - 1)) {
            // include the second half of a surrogate pair in cursor
            letter += view.state.sliceDoc(head + 1, head + 2);
        }
        let h = (pos.bottom - pos.top);
        return new Piece((left - base.left) / view.scaleX, (pos.top - base.top + h * (1 - hCoeff)) / view.scaleY, h * hCoeff / view.scaleY, style.fontFamily, style.fontSize, style.fontWeight, style.color, primary ? "cm-fat-cursor cm-cursor-primary" : "cm-fat-cursor cm-cursor-secondary", letter, hCoeff != 1);
    }
    else {
        return null;
    }
}

var FIREFOX_LINUX = typeof navigator != "undefined"
    && /*@__PURE__*//linux/i.test(navigator.platform)
    && /*@__PURE__*// Gecko\/\d+/.exec(navigator.userAgent);
const Vim = /*@__PURE__*/initVim(CodeMirror);
const HighlightMargin = 250;
const vimStyle = /*@__PURE__*/EditorView.baseTheme({
    ".cm-vimMode .cm-cursorLayer:not(.cm-vimCursorLayer)": {
        display: "none",
    },
    ".cm-vim-panel": {
        padding: "0px 10px",
        fontFamily: "monospace",
        minHeight: "1.3em",
        display: 'flex',
    },
    ".cm-vim-panel input": {
        border: "none",
        outline: "none",
        backgroundColor: "inherit",
    },
    "&light .cm-searchMatch": { backgroundColor: "#ffff0054" },
    "&dark .cm-searchMatch": { backgroundColor: "#00ffff8a" },
});
const vimPlugin = /*@__PURE__*/ViewPlugin.fromClass(class {
    constructor(view) {
        this.status = "";
        this.query = null;
        this.decorations = Decoration.none;
        this.waitForCopy = false;
        this.lastKeydown = '';
        this.useNextTextInput = false;
        this.compositionText = '';
        this.view = view;
        const cm = (this.cm = new CodeMirror(view));
        Vim.enterVimMode(this.cm);
        this.view.cm = this.cm;
        this.cm.state.vimPlugin = this;
        this.blockCursor = new BlockCursorPlugin(view, cm);
        this.updateClass();
        this.cm.on("vim-command-done", () => {
            if (cm.state.vim)
                cm.state.vim.status = "";
            this.blockCursor.scheduleRedraw();
            this.updateStatus();
        });
        this.cm.on("vim-mode-change", (e) => {
            if (!cm.state.vim)
                return;
            cm.state.vim.mode = e.mode;
            if (e.subMode) {
                cm.state.vim.mode += " block";
            }
            cm.state.vim.status = "";
            this.blockCursor.scheduleRedraw();
            this.updateClass();
            this.updateStatus();
        });
        this.cm.on("dialog", () => {
            if (this.cm.state.statusbar) {
                this.updateStatus();
            }
            else {
                view.dispatch({
                    effects: showVimPanel.of(!!this.cm.state.dialog),
                });
            }
        });
        this.dom = document.createElement("span");
        this.spacer = document.createElement("span");
        this.spacer.style.flex = "1";
        this.statusButton = document.createElement("span");
        this.statusButton.onclick = (e) => {
            Vim.handleKey(this.cm, "<Esc>", "user");
            this.cm.focus();
        };
        this.statusButton.style.cssText = "cursor: pointer";
    }
    update(update) {
        var _a;
        if ((update.viewportChanged || update.docChanged) && this.query) {
            this.highlight(this.query);
        }
        if (update.docChanged) {
            this.cm.onChange(update);
        }
        if (update.selectionSet) {
            this.cm.onSelectionChange();
        }
        if (update.viewportChanged) ;
        if (this.cm.curOp && !this.cm.curOp.isVimOp) {
            this.cm.onBeforeEndOperation();
        }
        if (update.transactions) {
            for (let tr of update.transactions)
                for (let effect of tr.effects) {
                    if (effect.is(setSearchQuery)) {
                        let forVim = (_a = effect.value) === null || _a === void 0 ? void 0 : _a.forVim;
                        if (!forVim) {
                            this.highlight(null);
                        }
                        else {
                            let query = effect.value.create();
                            this.highlight(query);
                        }
                    }
                }
        }
        this.blockCursor.update(update);
    }
    updateClass() {
        const state = this.cm.state;
        if (!state.vim || (state.vim.insertMode && !state.overwrite))
            this.view.scrollDOM.classList.remove("cm-vimMode");
        else
            this.view.scrollDOM.classList.add("cm-vimMode");
    }
    updateStatus() {
        let dom = this.cm.state.statusbar;
        let vim = this.cm.state.vim;
        if (!dom || !vim)
            return;
        let dialog = this.cm.state.dialog;
        if (dialog) {
            if (dialog.parentElement != dom) {
                dom.textContent = "";
                dom.appendChild(dialog);
            }
        }
        else {
            dom.textContent = "";
            var status = (vim.mode || "normal").toUpperCase();
            if (vim.insertModeReturn)
                status += "(C-O)";
            this.statusButton.textContent = `--${status}--`;
            dom.appendChild(this.statusButton);
            dom.appendChild(this.spacer);
        }
        this.dom.textContent = vim.status;
        dom.appendChild(this.dom);
    }
    destroy() {
        Vim.leaveVimMode(this.cm);
        this.updateClass();
        this.blockCursor.destroy();
        delete this.view.cm;
    }
    highlight(query) {
        this.query = query;
        if (!query)
            return (this.decorations = Decoration.none);
        let { view } = this;
        let builder = new RangeSetBuilder();
        for (let i = 0, ranges = view.visibleRanges, l = ranges.length; i < l; i++) {
            let { from, to } = ranges[i];
            while (i < l - 1 && to > ranges[i + 1].from - 2 * HighlightMargin)
                to = ranges[++i].to;
            query.highlight(view.state, from, to, (from, to) => {
                builder.add(from, to, matchMark);
            });
        }
        return (this.decorations = builder.finish());
    }
    handleKey(e, view) {
        const cm = this.cm;
        let vim = cm.state.vim;
        if (!vim)
            return;
        const key = Vim.vimKeyFromEvent(e, vim);
        CodeMirror.signal(this.cm, 'inputEvent', { type: "handleKey", key });
        if (!key)
            return;
        // clear search highlight
        if (key == "<Esc>" &&
            !vim.insertMode &&
            !vim.visualMode &&
            this.query /* && !cm.inMultiSelectMode*/) {
            const searchState = vim.searchState_;
            if (searchState) {
                cm.removeOverlay(searchState.getOverlay());
                searchState.setOverlay(null);
            }
        }
        let isCopy = key === "<C-c>" && !CodeMirror.isMac;
        if (isCopy && cm.somethingSelected()) {
            this.waitForCopy = true;
            return true;
        }
        vim.status = (vim.status || "") + key;
        let result = Vim.multiSelectHandleKey(cm, key, "user");
        vim = Vim.maybeInitVimState_(cm); // the object can change if there is an exception in handleKey
        // insert mode
        if (!result && vim.insertMode && cm.state.overwrite) {
            if (e.key && e.key.length == 1 && !/\n/.test(e.key)) {
                result = true;
                cm.overWriteSelection(e.key);
            }
            else if (e.key == "Backspace") {
                result = true;
                CodeMirror.commands.cursorCharLeft(cm);
            }
        }
        if (result) {
            CodeMirror.signal(this.cm, 'vim-keypress', key);
            e.preventDefault();
            e.stopPropagation();
            this.blockCursor.scheduleRedraw();
        }
        this.updateStatus();
        return !!result;
    }
}, {
    eventHandlers: {
        copy: function (e, view) {
            if (!this.waitForCopy)
                return;
            this.waitForCopy = false;
            Promise.resolve().then(() => {
                var cm = this.cm;
                var vim = cm.state.vim;
                if (!vim)
                    return;
                if (vim.insertMode) {
                    cm.setSelection(cm.getCursor(), cm.getCursor());
                }
                else {
                    cm.operation(() => {
                        if (cm.curOp)
                            cm.curOp.isVimOp = true;
                        Vim.handleKey(cm, '<Esc>', 'user');
                    });
                }
            });
        },
        compositionstart: function (e, view) {
            this.useNextTextInput = true;
            CodeMirror.signal(this.cm, 'inputEvent', e);
        },
        compositionupdate: function (e, view) {
            CodeMirror.signal(this.cm, 'inputEvent', e);
        },
        compositionend: function (e, view) {
            CodeMirror.signal(this.cm, 'inputEvent', e);
        },
        keypress: function (e, view) {
            CodeMirror.signal(this.cm, 'inputEvent', e);
            if (this.lastKeydown == "Dead")
                this.handleKey(e, view);
        },
        keydown: function (e, view) {
            CodeMirror.signal(this.cm, 'inputEvent', e);
            this.lastKeydown = e.key;
            if (this.lastKeydown == "Unidentified"
                || this.lastKeydown == "Process"
                || this.lastKeydown == "Dead") {
                this.useNextTextInput = true;
            }
            else {
                this.useNextTextInput = false;
                this.handleKey(e, view);
            }
        },
    },
    provide: () => {
        return [
            EditorView.inputHandler.of((view, from, to, text) => {
                var _a, _b;
                var cm = getCM(view);
                if (!cm)
                    return false;
                var vim = (_a = cm.state) === null || _a === void 0 ? void 0 : _a.vim;
                var vimPlugin = cm.state.vimPlugin;
                if (vim && !vim.insertMode && !((_b = cm.curOp) === null || _b === void 0 ? void 0 : _b.isVimOp)) {
                    if (text === "\0\0") {
                        return true;
                    }
                    CodeMirror.signal(cm, 'inputEvent', {
                        type: "text",
                        text,
                        from,
                        to,
                    });
                    if (text.length == 1 && vimPlugin.useNextTextInput) {
                        if (vim.expectLiteralNext && view.composing) {
                            vimPlugin.compositionText = text;
                            return false;
                        }
                        if (vimPlugin.compositionText) {
                            var toRemove = vimPlugin.compositionText;
                            vimPlugin.compositionText = '';
                            var head = view.state.selection.main.head;
                            var textInDoc = view.state.sliceDoc(head - toRemove.length, head);
                            if (toRemove === textInDoc) {
                                var pos = cm.getCursor();
                                cm.replaceRange('', cm.posFromIndex(head - toRemove.length), pos);
                            }
                        }
                        vimPlugin.handleKey({
                            key: text,
                            preventDefault: () => { },
                            stopPropagation: () => { }
                        });
                        forceEndComposition(view);
                        return true;
                    }
                }
                return false;
            })
        ];
    },
    decorations: (v) => v.decorations,
});
/**
 * removes contenteditable element and adds it back to end
 * IME composition in normal mode
 * this method works on all browsers except for Firefox on Linux
 * where we need to reset textContent of editor
 * (which doesn't work on other browsers)
 */
function forceEndComposition(view) {
    var parent = view.scrollDOM.parentElement;
    if (!parent)
        return;
    if (FIREFOX_LINUX) {
        view.contentDOM.textContent = "\0\0";
        view.contentDOM.dispatchEvent(new CustomEvent("compositionend"));
        return;
    }
    var sibling = view.scrollDOM.nextSibling;
    var selection = window.getSelection();
    var savedSelection = selection && {
        anchorNode: selection.anchorNode,
        anchorOffset: selection.anchorOffset,
        focusNode: selection.focusNode,
        focusOffset: selection.focusOffset
    };
    view.scrollDOM.remove();
    parent.insertBefore(view.scrollDOM, sibling);
    try {
        if (savedSelection && selection) {
            selection.setPosition(savedSelection.anchorNode, savedSelection.anchorOffset);
            if (savedSelection.focusNode) {
                selection.extend(savedSelection.focusNode, savedSelection.focusOffset);
            }
        }
    }
    catch (e) {
        console.error(e);
    }
    view.focus();
    view.contentDOM.dispatchEvent(new CustomEvent("compositionend"));
}
const matchMark = /*@__PURE__*/Decoration.mark({ class: "cm-searchMatch" });
const showVimPanel = /*@__PURE__*/StateEffect.define();
const vimPanelState = /*@__PURE__*/StateField.define({
    create: () => false,
    update(value, tr) {
        for (let e of tr.effects)
            if (e.is(showVimPanel))
                value = e.value;
        return value;
    },
    provide: (f) => {
        return showPanel.from(f, (on) => (on ? createVimPanel : null));
    },
});
function createVimPanel(view) {
    let dom = document.createElement("div");
    dom.className = "cm-vim-panel";
    let cm = view.cm;
    if (cm.state.dialog) {
        dom.appendChild(cm.state.dialog);
    }
    return { top: false, dom };
}
function statusPanel(view) {
    let dom = document.createElement("div");
    dom.className = "cm-vim-panel";
    let cm = view.cm;
    cm.state.statusbar = dom;
    cm.state.vimPlugin.updateStatus();
    return { dom };
}
function vim(options = {}) {
    return [
        vimStyle,
        vimPlugin,
        hideNativeSelection,
        options.status ? showPanel.of(statusPanel) : vimPanelState,
    ];
}
function getCM(view) {
    return view.cm || null;
}

export { CodeMirror, Vim, getCM, vim };

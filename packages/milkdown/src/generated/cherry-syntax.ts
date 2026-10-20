// Generated from Tencent Cherry Markdown (Apache-2.0) by sync-cherry-helpers.mjs. Do not edit.
export const cherryInlineRules = {
  Color: { begin: '((?<!\\\\))!!', content: '(#[0-9a-zA-Z]{3,6}|[a-z]{3,20})[\\s]([\\w\\W]+?)', end: '!!' },
  BackgroundColor: {
    begin: '((?<!\\\\))!!!',
    content: '(#[0-9a-zA-Z]{3,6}|[a-z]{3,10})[\\s]([\\w\\W]+?)',
    end: '!!!',
  },
  Size: { begin: '((?<!\\\\))!', content: '([0-9]{1,2})[\\s]([\\w\\W]*?)', end: '!' },
  Sub: { begin: '((?<!\\\\))\\^\\^', content: '([\\w\\W]+?)', end: '\\^\\^' },
  Sup: { begin: '((?<!\\\\))\\^', content: '([\\w\\W]+?)', end: '\\^' },
  Ruby: { begin: '(^| )\\{', content: '([^\n]+?)\\|([^\n]+?)', end: '\\}( |$)' },
  Underline: { begin: '(^| )\\/', content: '([^\\n]+?)', end: '\\/( |$)' },
  HighLight: { begin: '(^| )==', content: '([^\\n]+?)', end: '==( |$|\\n)' },
} as const;
export const cherryImagePatterns = {
  size: /#([0-9]+(px|em|pt|pc|in|mm|cm|ex|%)|auto)/g,
  decoration: /#(border|shadow|radius|B|S|R)/g,
  alignment: /#(center|right|left|float-right|float-left)/i,
};

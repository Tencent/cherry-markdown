// 预览区域代码块可切换语言功能: https://github.com/Tencent/cherry-markdown/issues/433;

export const CODE_PREVIEWER_LANG_SELECT_ID = 'cherry-code-preview-lang-select';

/**
 * 生成preview区域的代码语言设置区域
 */
export const getCodePreviewLangSelectElement = (lang) => {
  const optionsElement = codePreviewLangSelectList.map((item) => {
    console.log(item, lang, lang === item, lang === item ? 'selected' : '');
    if (lang === item) {
      return `<option value="${item}" selected>${item}</option>`;
    }
    return `<option value="${item}">${item}</option>`;
    // return `<option value="${item}" ${lang === item ? 'selected' : ''}>${item}</option>`;
  });

  console.log(optionsElement);
  return `<select id="code-preview-lang-select" class="${CODE_PREVIEWER_LANG_SELECT_ID}">
      <option value="" selected disabled hidden>Choose here</option>
      ${optionsElement.join('')}
    </select>`;
};

// program language list:
const codePreviewLangSelectList = [
  'javascript',
  'typescript',
  'html',
  'css',
  'shell',
  'python',
  'golang',
  'java',
  'c',
  'c++',
  'c#',
  'php',
  'ruby',
  'swift',
  'kotlin',
  'scala',
  'rust',
  'dart',
  'elixir',
  'haskell',
  'lua',
  'perl',
  'r',
  'sql',
];

import juice from 'juice';

export const inlineStyle = (content = ''): string => {
  if (typeof content !== 'string' || !content) {
    return content;
  }
  return juice(content);
};

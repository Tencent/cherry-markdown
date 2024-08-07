import Cherry from 'cherry-markdown';
import { defineStore } from 'pinia'

type CherryToc = {
  id: string;
  level: number;
  text: string;
}

/**
 * @param cherry - Cherry 实例
 * @param cherryMarkdown - CherryMarkdown 的 markdown 文本
 * @param cherryMarkdownHtml - CherryMarkdown 的 markdown 转换成的 html 文本
 */
type CherryState = {
  cherry: Cherry | null;
  cherryMarkdown: string;
  cherryMarkdownHtml: string;
}

export const useStoreCherry = defineStore('cherry', {
  state: (): CherryState => ({
    cherry: null,
    cherryMarkdown: '',
    cherryMarkdownHtml: '',
  }),
})

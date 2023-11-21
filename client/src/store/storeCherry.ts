import Cherry from 'cherry-markdown';
import { defineStore } from 'pinia'

type CherryToc = {
  id: string;
  level: number;
  text: string;
}

/**
 * 
 * @param cherry - Cherry 实例
 * @param cherryMarkdown - CherryMarkdown 的 markdown 文本
 */
type CherryState = {
  cherry: Cherry | null;
  cherryMarkdown: string;
  cherryMarkdownHtml: string;
  cherryToc: CherryToc[];
}

export const useStoreCherry = defineStore('cherry', {
  state: (): CherryState => ({
    cherry: null,
    cherryMarkdown: '',
    cherryMarkdownHtml: '',
    cherryToc: [],
  }),
})

/**
 * Framework-neutral Markdown editor contract.
 * Implementations must persist Markdown and must never silently discard syntax.
 * @abstract
 */
export default class EditorAdapter {
  /** @returns {Promise<any>} */
  async create() {
    throw new Error('EditorAdapter.create() must be implemented');
  }

  /** @returns {Promise<string>} */
  async getMarkdown() {
    throw new Error('EditorAdapter.getMarkdown() must be implemented');
  }

  async setMarkdown(_markdown) {
    throw new Error('EditorAdapter.setMarkdown() must be implemented');
  }

  getEditor() {
    throw new Error('EditorAdapter.getEditor() must be implemented');
  }

  async destroy() {
    throw new Error('EditorAdapter.destroy() must be implemented');
  }
}

/**
 * LRU缓存类
 * 使用Map实现LRU缓存，Map会保持键的插入顺序
 */
export default class LRUCache {
  /**
   * 创建一个LRU缓存
   * @param {number} capacity 缓存容量
   */
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  /**
   * 获取缓存项
   * @param {string} key 缓存键
   * @returns {any} 缓存值，不存在则返回undefined
   */
  get(key) {
    if (!this.cache.has(key)) return undefined;

    // 获取值并更新位置（删除后重新插入到末尾）
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  /**
   * 设置缓存项
   * @param {string} key 缓存键
   * @param {any} value 缓存值
   */
  set(key, value) {
    // 如果键已存在，先删除（相当于更新位置）
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // 如果缓存已满，删除最旧的100个项（或者全部，如果少于100个）
    if (this.cache.size >= this.capacity) {
      const deleteCount = Math.min(100, this.cache.size);
      const keys = Array.from(this.cache.keys()).slice(0, deleteCount);
      keys.forEach((oldKey) => this.cache.delete(oldKey));
    }

    // 添加新项到缓存末尾
    this.cache.set(key, value);
  }

  /**
   * 检查键是否存在
   * @param {string} key 缓存键
   * @returns {boolean} 是否存在
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * 删除缓存项
   * @param {string} key 缓存键
   * @returns {boolean} 是否删除成功
   */
  delete(key) {
    return this.cache.delete(key);
  }

  /**
   * 清空缓存
   */
  clear() {
    this.cache.clear();
  }

  /**
   * 获取所有键
   * @returns {Array} 键数组
   */
  keys() {
    return Array.from(this.cache.keys());
  }

  /**
   * 获取所有值
   * @returns {Array} 值数组
   */
  values() {
    return Array.from(this.cache.values());
  }

  /**
   * 获取所有键值对
   * @returns {Array} 键值对数组
   */
  entries() {
    return Array.from(this.cache.entries());
  }

  /**
   * 获取缓存大小
   * @returns {number} 缓存大小
   */
  get size() {
    return this.cache.size;
  }
}

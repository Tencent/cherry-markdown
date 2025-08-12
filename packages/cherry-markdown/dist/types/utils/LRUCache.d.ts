/**
 * LRU缓存类
 * 使用Map实现LRU缓存，Map会保持键的插入顺序
 */
export default class LRUCache {
    /**
     * 创建一个LRU缓存
     * @param {number} capacity 缓存容量
     */
    constructor(capacity: number);
    capacity: number;
    cache: Map<any, any>;
    /**
     * 获取缓存项
     * @param {string} key 缓存键
     * @returns {any} 缓存值，不存在则返回undefined
     */
    get(key: string): any;
    /**
     * 设置缓存项
     * @param {string} key 缓存键
     * @param {any} value 缓存值
     */
    set(key: string, value: any): void;
    /**
     * 检查键是否存在
     * @param {string} key 缓存键
     * @returns {boolean} 是否存在
     */
    has(key: string): boolean;
    /**
     * 删除缓存项
     * @param {string} key 缓存键
     * @returns {boolean} 是否删除成功
     */
    delete(key: string): boolean;
    /**
     * 清空缓存
     */
    clear(): void;
    /**
     * 获取所有键
     * @returns {Array} 键数组
     */
    keys(): any[];
    /**
     * 获取所有值
     * @returns {Array} 值数组
     */
    values(): any[];
    /**
     * 获取所有键值对
     * @returns {Array} 键值对数组
     */
    entries(): any[];
    /**
     * 获取缓存大小
     * @returns {number} 缓存大小
     */
    get size(): number;
}

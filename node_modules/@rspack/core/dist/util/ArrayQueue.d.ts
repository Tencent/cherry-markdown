/**
 * The following code is modified based on
 * https://github.com/webpack/webpack/blob/4b4ca3b/lib/util/ArrayQueue.js
 *
 * MIT Licensed
 * Author Tobias Koppers @sokra
 * Copyright (c) JS Foundation and other contributors
 * https://github.com/webpack/webpack/blob/main/LICENSE
 */
/**
 * @template T
 */
declare class ArrayQueue<T> {
    _list: T[];
    _listReversed: T[];
    constructor(items?: T[]);
    /**
     * Returns the number of elements in this queue.
     * @returns {number} The number of elements in this queue.
     */
    get length(): number;
    /**
     * Empties the queue.
     */
    clear(): void;
    /**
     * Appends the specified element to this queue.
     * @param {T} item The element to add.
     * @returns {void}
     */
    enqueue(item: T): void;
    /**
     * Retrieves and removes the head of this queue.
     * @returns {T | undefined} The head of the queue of `undefined` if this queue is empty.
     */
    dequeue(): T | undefined;
    /**
     * Finds and removes an item
     * @param {T} item the item
     * @returns {void}
     */
    delete(item: T): void;
    [Symbol.iterator](): Generator<T, void, unknown>;
}
export default ArrayQueue;

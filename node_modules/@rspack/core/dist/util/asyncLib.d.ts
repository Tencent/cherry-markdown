/**
 * The following code is modified based on
 * https://github.com/suguru03/neo-async/blob/master/lib/async.js
 *
 * MIT Licensed
 * Author Suguru Motegi
 * Copyright (c) 2014-2018 Suguru Motegi
 * https://github.com/suguru03/neo-async/blob/master/LICENSE
 */
export interface Dictionary<T> {
    [key: string]: T;
}
export type IterableCollection<T> = T[] | IterableIterator<T> | Dictionary<T>;
export type ErrorCallback<E = Error> = (err?: E | null) => void;
export type AsyncIterator<T, E = Error> = (item: T, callback: ErrorCallback<E>) => void;
/**
 * @example
 *
 * // array
 * var order = [];
 * var array = [1, 3, 2];
 * var iterator = function(num, done) {
 *   setTimeout(function() {
 *     order.push(num);
 *     done();
 *   }, num * 10);
 * };
 * asyncLib.each(array, iterator, function(err, res) {
 *   console.log(res); // undefined
 *   console.log(order); // [1, 2, 3]
 * });
 *
 * @example
 *
 * // break
 * var order = [];
 * var array = [1, 3, 2];
 * var iterator = function(num, done) {
 *   setTimeout(function() {
 *     order.push(num);
 *     done(null, num !== 2);
 *   }, num * 10);
 * };
 * asyncLib.each(array, iterator, function(err, res) {
 *   console.log(res); // undefined
 *   console.log(order); // [1, 2]
 * });
 *
 */
declare function each<T, E = Error>(collection: IterableCollection<T>, iterator: AsyncIterator<T, E>, originalCallback: ErrorCallback<E>): void;
declare const _default: {
    each: typeof each;
};
export default _default;

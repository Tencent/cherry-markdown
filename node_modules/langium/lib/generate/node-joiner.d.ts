/******************************************************************************
 * Copyright 2023 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import type { AstNode, Properties } from '../syntax-tree.js';
import { CompositeGeneratorNode, type Generated, NewLineNode } from './generator-node.js';
import type { SourceRegion } from './generator-tracing.js';
export interface JoinOptions<T, U extends T = T> {
    /**
     * A plain or type guard filter function.
     *
     * Benefit compared to pre-filtering the joined iterable: Original indices of the elements are preserved and forwarded to the `toGenerated` function.
     */
    filter?: ((element: T, index: number, isLast: boolean) => boolean) | ((element: T, index: number, isLast: boolean) => element is U);
    /** A fixed prefix or prefix computation function to be prepended before each element of the iterable. */
    prefix?: Generated | ((element: U, index: number, isLast: boolean) => Generated | undefined);
    /** A fixed suffix or suffix computation function to be appended after each element of the iterable. */
    suffix?: Generated | ((element: U, index: number, isLast: boolean) => Generated | undefined);
    /** A fixed element separator to be inserted between 2 consecutive non-undefined item representations incl. their suffixes and prefixes. */
    separator?: Generated;
    /**
     * Activates appending of up 6 line breaks after a non-undefined element + suffix + separator if given.
     *
     * If `true` a single line break is appended.
     *
     * If a number `> 6` is required you can achieve that via the `separator` or `suffix` options,
     *  e.g. `separator: new CompositeGeneratorNode(calcLineBreaks(...))`.
     */
    appendNewLineIfNotEmpty?: true | NewLineNode.NoOfLineBreaks;
    /**
     * Suppresses appending trailing line breaks after the last item in the iterable if activated via `appendNewLineIfNotEmpty`.
     */
    skipNewLineAfterLastItem?: true;
}
/**
 * Joins the elements of the given `iterable` of pre-computed instances of {@link Generated}
 * by appending the results to a {@link CompositeGeneratorNode} being returned finally.
 * Each individual element is tested to be a string, a {@link CompositeGeneratorNode},
 * or `undefined` and included as is if that test is satisfied. Otherwise the result of
 * applying {@link String} (string constructor) to the element is included.
 *
 * Note: empty strings being included in `iterable` are treated as ordinary string
 * representations, while the value of `undefined` makes this function to ignore the
 * corresponding item and no separator is appended, if configured.
 *
 * Examples:
 * ```
 *   expandToNode`
 *       ${ joinToNode(['a', 'b'], { appendNewLineIfNotEmpty: true }) }
 *
 *       ${ joinToNode(new Set(['a', undefined, getElementNode()]), { separator: ',', appendNewLineIfNotEmpty: true }) }
 *   `
 * ```
 *
 * @param iterable an {@link Array} or {@link Iterable} providing the elements to be joined
 *
 * @param options optional config object for defining a `separator`, contributing specialized
 *  `prefix` and/or `suffix` providers, and activating conditional line-break insertion. In addition,
 *  a dedicated `filter` function can be provided that enables the provision of the original
 *  element indices to the aforementioned functions, if the list is to be filtered. If
 *  {@link Array.filter} would be applied to the original list, the indices will be those of the
 *  filtered list during subsequent processing that in particular will cause confusion when using
 *  the tracing variant of this function named ({@link joinTracedToNode}).
 * @returns the resulting {@link CompositeGeneratorNode} representing `iterable`'s content
 */
export declare function joinToNode<Generated>(iterable: Iterable<Generated> | Generated[], options?: JoinOptions<Generated>): CompositeGeneratorNode | undefined;
/**
 * Joins the elements of the given `iterable` by applying `toGenerated` to each element
 * and appending the results to a {@link CompositeGeneratorNode} being returned finally.
 *
 * Note: empty strings being returned by `toGenerated` are treated as ordinary string
 * representations, while the result of `undefined` makes this function to ignore the
 * corresponding item and no separator is appended, if configured.
 *
 * Examples:
 * ```
 *   expandToNode`
 *       ${ joinToNode(['a', 'b'], String, { appendNewLineIfNotEmpty: true }) }
 *
 *       ${ joinToNode(new Set(['a', undefined, 'b']), e => e && String(e), { separator: ',', appendNewLineIfNotEmpty: true }) }
 *   `
 * ```
 *
 * @param iterable an {@link Array} or {@link Iterable} providing the elements to be joined
 *
 * @param toGenerated a callback converting each individual element to a string, a
 *  {@link CompositeGeneratorNode}, or to `undefined` if to be omitted, defaults to the `identity`
 *  for strings, generator nodes, and `undefined`, and to {@link String} otherwise.
 *
 * @param options optional config object for defining a `separator`, contributing specialized
 *  `prefix` and/or `suffix` providers, and activating conditional line-break insertion. In addition,
 *  a dedicated `filter` function can be provided that enables the provision of the
 *  original element indices to the aforementioned functions, if the list is to be filtered. If
 *  {@link Array.filter} would be applied to the original list, the indices will be those of the
 *  filtered list during subsequent processing that in particular will cause confusion when using
 *  the tracing variant of this function named ({@link joinTracedToNode}).
 * @returns the resulting {@link CompositeGeneratorNode} representing `iterable`'s content
 */
export declare function joinToNode<T>(iterable: Iterable<T> | T[], toGenerated?: ((element: T, index: number, isLast: boolean) => Generated), options?: JoinOptions<T>): CompositeGeneratorNode | undefined;
/**
 * Joins the elements of the given `iterable` by applying `toGenerated` to each element
 * and appending the results to a {@link CompositeGeneratorNode} being returned finally.
 *
 * Here the mandatory type guard `filter` function is used to filter the elements of
 * `iterable` and to apply the `toGenerated` function as well as the optional
 * `prefix` and `suffix` functions to the accepted items with the more specific type
 * `U` and their original indices.
 *
 * Note: empty strings being returned by `toGenerated` are treated as ordinary string
 * representations, while the result of `undefined` makes this function to ignore the
 * corresponding item and no separator is appended, if configured.
 *
 * Example:
 * ```
 *   expandToNode`
 *       ${ joinToNode([x, y], e => e.propertyOfX, { filter: (e): e is X => e.$type === 'X' }) }
 *   `
 * ```
 *
 * @param iterable an {@link Array} or {@link Iterable} providing the elements to be joined
 *
 * @param toGenerated a callback converting each individual element to a string, a
 *  {@link CompositeGeneratorNode}, or to `undefined` if to be omitted, defaults to the `identity`
 *  for strings, generator nodes, and `undefined`, and to {@link String} otherwise.
 *
 * @param options config object including the here required type guard filter function, as well as
 *  optional `separator` and `prefix` and/or `suffix` providers, and activating conditional
 *  line-break insertion.
 *  In contrast to {@link Array.filter} the dedicated `filter` function enables the provision of the
 *  original element indices to `toGenerated` and the aforementioned functions, if the list is to be
 *  filtered.
 * @returns the resulting {@link CompositeGeneratorNode} representing `iterable`'s content
 */
export declare function joinToNode<T, U extends T>(iterable: Iterable<T> | T[], toGenerated: ((element: U, index: number, isLast: boolean) => Generated), options: JoinOptions<T, U> & {
    filter: (element: T, index: number, isLast: boolean) => element is U;
}): CompositeGeneratorNode | undefined;
/**
 * Convenience function for joining the elements of some `iterable` and gathering tracing information.
 *
 * This function returns another function that does the processing, and that expects same list of
 *  arguments as expected by {@link joinToNode}, i.e. an `iterable`, a function `toGenerated`
 *  converting each element into a `Generated`, as well as some `options`.
 *
 * That function then joins the elements of `iterable` by delegating to {@link joinToNode}.
 * Via {@link traceToNode} the resulting generator node is supplemented with the provided tracing
 *  information in form of `{astNode, property?, index?}`, and finally returned. In addition,
 *  if `property` is given each element's generator node representation is augmented with the
 *  provided tracing information plus the index of the element within `iterable`.
 *
 * @param astNode the AstNode corresponding to the appended content
 *
 * @param property the value property name (string) corresponding to the appended content,
 *  if e.g. the content corresponds to some `string` or `number` property of `astNode`, is optional
 *
 * @returns a function behaving as described above, which in turn returns a {@link CompositeGeneratorNode}.
 *
 * @example
 *   expandToNode`
 *       children: ${ joinTracedToNode(entity, 'children')(entity.children, child => child.name, { separator: ' ' }) };
 *   `.appendNewLine()
 */
export declare function joinTracedToNode<T extends AstNode>(astNode: T, property?: Properties<T>): <E>(iterable: Iterable<E> | E[], toGenerated?: ((element: E, index: number, isLast: boolean) => Generated) | JoinOptions<E>, options?: JoinOptions<E>) => CompositeGeneratorNode;
/**
 * Convenience function for joining the elements of some `iterable` and gathering tracing information
 *  in form of concrete coordinates.
 *
 * This function returns another function that does the processing, and that expects same list of
 *  arguments as expected by {@link joinToNode}, i.e. an `iterable`, a function `toGenerated`
 *  converting each element into a `Generated`, as well as some `options`.
 *
 * That function then joins the elements of `iterable` by delegating to {@link joinToNode}.
 * Via {@link traceToNode} the resulting generator node is supplemented with the provided tracing
 *  information, and finally returned. Elementwise tracing need to be implemented by client code
 *  within `toGenerated`, if required.
 *
 * @param sourceRegion a text region within some file in form of concrete coordinates,
 *  if `undefined` no tracing will happen
 *
 * @returns a function behaving as described above, which in turn returns a {@link CompositeGeneratorNode}.
 *
 * @example
 *   expandToNode`
 *       children: ${ joinTracedToNode(findNodesForProperty(entity.$cstNode, 'children'))(entity.children, child => child.name, { separator: ' ' }) };
 *   `.appendNewLine()
 */
export declare function joinTracedToNode(sourceRegion: SourceRegion | undefined): <E>(iterable: Iterable<E> | E[], toGenerated?: ((element: E, index: number, isLast: boolean) => Generated) | JoinOptions<E>, options?: JoinOptions<E>) => CompositeGeneratorNode;
/**
 * Convenience function for joining the elements of some `iterable` and gathering tracing information
 *  in form of a list of concrete coordinates.
 *
 * This function returns another function that does the processing, and that expects same list of
 *  arguments as expected by {@link joinToNode}, i.e. an `iterable`, a function `toGenerated`
 *  converting each element into a `Generated`, as well as some `options`.
 *
 * That function then joins the elements of `iterable` by delegating to {@link joinToNode}.
 * Via {@link traceToNode} the resulting generator node is supplemented with the provided tracing
 *  information, and finally returned. Elementwise tracing need to be implemented by client code
 *  within `toGenerated`, if required.
 *
 * The list of regions in `sourceRegions` will later be reduced to the smallest encompassing region
 *  of all the contained source regions.
 *
 * @param sourceRegions a list of text regions within some file in form of concrete coordinates,
 *  if empty no tracing will happen
 *
 * @returns a function behaving as described above, which in turn returns a {@link CompositeGeneratorNode}.
 *
 * @example
 *   expandToNode`
 *       children: ${ joinTracedToNode(findNodesForProperty(entity.$cstNode, 'children'))(entity.children, child => child.name, { separator: ' ' }) };
 *   `.appendNewLine()
 */
export declare function joinTracedToNode(sourceRegions: SourceRegion[]): <E>(iterable: Iterable<E> | E[], toGenerated?: ((element: E, index: number, isLast: boolean) => Generated) | JoinOptions<E>, options?: JoinOptions<E>) => CompositeGeneratorNode;
/**
 * Convenience function for joining the elements of some `iterable` and gathering tracing information,
 *  if `condition` is equal to `true`.
 *
 * If `condition` is satisfied, this function returns another function that does the processing,
 *  and that expects same list of arguments as expected by {@link joinToNode}, i.e. an `iterable`,
 *  a function `toGenerated` converting each element into a `Generated`, as well as some `options`.
 *
 * That function then joins the elements of `iterable` by delegating to {@link joinToNode}.
 * Via {@link traceToNode} the resulting generator node is supplemented with the provided tracing
 *  information, and finally returned. In addition, if `property` is given each element's
 *  generator node representation is augmented with the provided tracing information
 *  plus the index of the element within `iterable`.
 *
 * Otherwise, if `condition` is equal to false, the returned function just returns `undefined`.
 *
 * @param condition a boolean value indicating whether to evaluate the provided iterable.
 *
 * @param astNode the AstNode corresponding to the appended content
 *
 * @param property the value property name (string) corresponding to the appended content,
 *  if e.g. the content corresponds to some `string` or `number` property of `astNode`, is optional
 *
 * @returns a function behaving as described above, which in turn returns a {@link CompositeGeneratorNode} or `undefined`.
 *
 * @example
 *   expandToNode`
 *       children: ${ joinTracedToNode(entity, 'children')(entity.children, child => child.name, { separator: ' ' }) };
 *   `.appendNewLine()
 */
export declare function joinTracedToNodeIf<T extends AstNode>(condition: boolean, astNode: T, property?: Properties<T>): <E>(iterable: Iterable<E> | E[], toGenerated?: ((element: E, index: number, isLast: boolean) => Generated) | JoinOptions<E>, options?: JoinOptions<E>) => CompositeGeneratorNode | undefined;
/**
 * Convenience function for joining the elements of some `iterable` and gathering tracing information
 *  in form of a list of concrete coordinates, if `condition` is equal to `true`.
 *
 * If `condition` is satisfied, this function returns another function that does the processing,
 *  and that expects same list of arguments as expected by {@link joinToNode}, i.e. an `iterable`,
 *  a function `toGenerated` converting each element into a `Generated`, as well as some `options`.
 *
 * That function then joins the elements of `iterable` by delegating to {@link joinToNode}.
 * Via {@link traceToNode} the resulting generator node is supplemented with the provided tracing
 *  information, and finally returned. Element-wise tracing need to be implemented by client code
 *  within `toGenerated`, if required.
 *
 * Otherwise, if `condition` is equal to false, the returned function just returns `undefined`.
 *
 * If `sourceRegion` is a function supplying the corresponding regions, it's only called if `condition` is satisfied.
 *
 * @param condition a boolean value indicating whether to evaluate the provided iterable.
 *
 * @param sourceRegion a text region within some file in form of concrete coordinates or a supplier function,
 *  if `undefined` no tracing will happen
 *
 * @returns a function behaving as described above, which in turn returns a {@link CompositeGeneratorNode}.
 *
 * @example
 *   expandToNode`
 *       children: ${ joinTracedToNodeIf(entity !== undefined, () => entity.$cstNode)(entity.children, child => child.name, { separator: ' ' }) };
 *   `.appendNewLine()
 */
export declare function joinTracedToNodeIf(condition: boolean, sourceRegion: SourceRegion | undefined | (() => SourceRegion | undefined)): <E>(iterable: Iterable<E> | E[], toGenerated?: ((element: E, index: number, isLast: boolean) => Generated) | JoinOptions<E>, options?: JoinOptions<E>) => CompositeGeneratorNode | undefined;
/**
 * Convenience function for joining the elements of some `iterable` and gathering tracing information
 *  in form of a list of concrete coordinates, if `condition` is equal to `true`.
 *
 * If `condition` is satisfied, this function returns another function that does the processing,
 *  and that expects same list of arguments as expected by {@link joinToNode}, i.e. an `iterable`,
 *  a function `toGenerated` converting each element into a `Generated`, as well as some `options`.
 *
 * That function then joins the elements of `iterable` by delegating to {@link joinToNode}.
 * Via {@link traceToNode} the resulting generator node is supplemented with the provided tracing
 *  information, and finally returned. Element-wise tracing need to be implemented by client code
 *  within `toGenerated`, if required.
 *
 * Otherwise, if `condition` is equal to false, the returned function just returns `undefined`.
 *
 * The list of regions in `sourceRegions` will later be reduced to the smallest encompassing region
 *  of all the contained source regions.
 * If `sourceRegions` is a function supplying the corresponding regions, it's only called if `condition` is satisfied.
 *
 * @param condition a boolean value indicating whether to evaluate the provided iterable.
 *
 * @param sourceRegions a list of text regions within some file in form of concrete coordinates or a supplier function,
 *  if empty no tracing will happen
 *
 * @returns a function behaving as described above, which in turn returns a {@link CompositeGeneratorNode}.
 *
 * @example
 *   expandToNode`
 *       children: ${ joinTracedToNodeIf(entity !== undefined, () => findNodesForProperty(entity.$cstNode, 'children'))(entity.children, child => child.name, { separator: ' ' }) };
 *   `.appendNewLine()
 */
export declare function joinTracedToNodeIf(condition: boolean, sourceRegions: SourceRegion[] | (() => SourceRegion[])): <E>(iterable: Iterable<E> | E[], toGenerated?: ((element: E, index: number, isLast: boolean) => Generated) | JoinOptions<E>, options?: JoinOptions<E>) => CompositeGeneratorNode | undefined;
//# sourceMappingURL=node-joiner.d.ts.map
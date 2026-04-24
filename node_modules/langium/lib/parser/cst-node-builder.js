/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import { Position } from 'vscode-languageserver-types';
import { tokenToRange } from '../utils/cst-utils.js';
export class CstNodeBuilder {
    constructor() {
        this.nodeStack = [];
    }
    get current() {
        return this.nodeStack[this.nodeStack.length - 1] ?? this.rootNode;
    }
    buildRootNode(input) {
        this.rootNode = new RootCstNodeImpl(input);
        this.rootNode.root = this.rootNode;
        this.nodeStack = [this.rootNode];
        return this.rootNode;
    }
    buildCompositeNode(feature) {
        const compositeNode = new CompositeCstNodeImpl();
        compositeNode.grammarSource = feature;
        compositeNode.root = this.rootNode;
        this.current.content.push(compositeNode);
        this.nodeStack.push(compositeNode);
        return compositeNode;
    }
    buildLeafNode(token, feature) {
        const leafNode = new LeafCstNodeImpl(token.startOffset, token.image.length, tokenToRange(token), token.tokenType, !feature);
        leafNode.grammarSource = feature;
        leafNode.root = this.rootNode;
        this.current.content.push(leafNode);
        return leafNode;
    }
    removeNode(node) {
        const parent = node.container;
        if (parent) {
            const index = parent.content.indexOf(node);
            if (index >= 0) {
                parent.content.splice(index, 1);
            }
        }
    }
    addHiddenNodes(tokens) {
        const nodes = [];
        for (const token of tokens) {
            const leafNode = new LeafCstNodeImpl(token.startOffset, token.image.length, tokenToRange(token), token.tokenType, true);
            leafNode.root = this.rootNode;
            nodes.push(leafNode);
        }
        let current = this.current;
        let added = false;
        // If we are within a composite node, we add the hidden nodes to the content
        if (current.content.length > 0) {
            current.content.push(...nodes);
            return;
        }
        // Otherwise we are at a newly created node
        // Instead of adding the hidden nodes here, we search for the first parent node with content
        while (current.container) {
            const index = current.container.content.indexOf(current);
            if (index > 0) {
                // Add the hidden nodes before the current node
                current.container.content.splice(index, 0, ...nodes);
                added = true;
                break;
            }
            current = current.container;
        }
        // If we arrive at the root node, we add the hidden nodes at the beginning
        // This is the case if the hidden nodes are the first nodes in the tree
        if (!added) {
            this.rootNode.content.unshift(...nodes);
        }
    }
    construct(item) {
        const current = this.current;
        // The specified item could be a datatype ($type is symbol), fragment ($type is undefined) or infix rule ($infix is true)
        // Only if the $type is a string, we actually assign the element
        if (typeof item.$type === 'string' && !item.$infixName) {
            this.current.astNode = item;
        }
        item.$cstNode = current;
        const node = this.nodeStack.pop();
        // Empty composite nodes are not valid
        // Simply remove the node from the tree
        if (node?.content.length === 0) {
            this.removeNode(node);
        }
    }
}
export class AbstractCstNode {
    get hidden() {
        return false;
    }
    get astNode() {
        const node = typeof this._astNode?.$type === 'string' ? this._astNode : this.container?.astNode;
        if (!node) {
            throw new Error('This node has no associated AST element');
        }
        return node;
    }
    set astNode(value) {
        this._astNode = value;
    }
    get text() {
        return this.root.fullText.substring(this.offset, this.end);
    }
}
export class LeafCstNodeImpl extends AbstractCstNode {
    get offset() {
        return this._offset;
    }
    get length() {
        return this._length;
    }
    get end() {
        return this._offset + this._length;
    }
    get hidden() {
        return this._hidden;
    }
    get tokenType() {
        return this._tokenType;
    }
    get range() {
        return this._range;
    }
    constructor(offset, length, range, tokenType, hidden = false) {
        super();
        this._hidden = hidden;
        this._offset = offset;
        this._tokenType = tokenType;
        this._length = length;
        this._range = range;
    }
}
export class CompositeCstNodeImpl extends AbstractCstNode {
    constructor() {
        super(...arguments);
        this.content = new CstNodeContainer(this);
    }
    get offset() {
        return this.firstNonHiddenNode?.offset ?? 0;
    }
    get length() {
        return this.end - this.offset;
    }
    get end() {
        return this.lastNonHiddenNode?.end ?? 0;
    }
    get range() {
        const firstNode = this.firstNonHiddenNode;
        const lastNode = this.lastNonHiddenNode;
        if (firstNode && lastNode) {
            if (this._rangeCache === undefined) {
                const { range: firstRange } = firstNode;
                const { range: lastRange } = lastNode;
                this._rangeCache = { start: firstRange.start, end: lastRange.end.line < firstRange.start.line ? firstRange.start : lastRange.end };
            }
            return this._rangeCache;
        }
        else {
            return { start: Position.create(0, 0), end: Position.create(0, 0) };
        }
    }
    get firstNonHiddenNode() {
        for (const child of this.content) {
            if (!child.hidden) {
                return child;
            }
        }
        return this.content[0];
    }
    get lastNonHiddenNode() {
        for (let i = this.content.length - 1; i >= 0; i--) {
            const child = this.content[i];
            if (!child.hidden) {
                return child;
            }
        }
        return this.content[this.content.length - 1];
    }
}
class CstNodeContainer extends Array {
    constructor(parent) {
        super();
        this.parent = parent;
        Object.setPrototypeOf(this, CstNodeContainer.prototype);
    }
    push(...items) {
        this.addParents(items);
        return super.push(...items);
    }
    unshift(...items) {
        this.addParents(items);
        return super.unshift(...items);
    }
    splice(start, count, ...items) {
        this.addParents(items);
        return super.splice(start, count, ...items);
    }
    addParents(items) {
        for (const item of items) {
            item.container = this.parent;
        }
    }
}
export class RootCstNodeImpl extends CompositeCstNodeImpl {
    get text() {
        return this._text.substring(this.offset, this.end);
    }
    get fullText() {
        return this._text;
    }
    constructor(input) {
        super();
        this._text = '';
        this._text = input ?? '';
    }
}
//# sourceMappingURL=cst-node-builder.js.map
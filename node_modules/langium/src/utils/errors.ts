/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import type { CstNode } from '../syntax-tree.js';

export class ErrorWithLocation extends Error {
    constructor(node: CstNode | undefined, message: string) {
        super(node ? `${message} at ${node.range.start.line}:${node.range.start.character}` : message);
    }
}

export function assertUnreachable(_: never, message = 'Error: Got unexpected value.'): never {
    throw new Error(message);
}

export function assertCondition(condition: boolean, message: string = 'Error: Condition is violated.'): asserts condition {
    if (!condition) {
        throw new Error(message);
    }
}

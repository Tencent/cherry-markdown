/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
export class ErrorWithLocation extends Error {
    constructor(node, message) {
        super(node ? `${message} at ${node.range.start.line}:${node.range.start.character}` : message);
    }
}
export function assertUnreachable(_, message = 'Error: Got unexpected value.') {
    throw new Error(message);
}
export function assertCondition(condition, message = 'Error: Condition is violated.') {
    if (!condition) {
        throw new Error(message);
    }
}
//# sourceMappingURL=errors.js.map
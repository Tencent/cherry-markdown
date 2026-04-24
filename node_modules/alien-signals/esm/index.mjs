import { createReactiveSystem } from './system.mjs';
let cycle = 0;
let batchDepth = 0;
let notifyIndex = 0;
let queuedLength = 0;
let activeSub;
const queued = [];
const { link, unlink, propagate, checkDirty, shallowPropagate, } = createReactiveSystem({
    update(node) {
        if (node.depsTail !== undefined) {
            return updateComputed(node);
        }
        else {
            return updateSignal(node);
        }
    },
    notify(effect) {
        let insertIndex = queuedLength;
        let firstInsertedIndex = insertIndex;
        do {
            queued[insertIndex++] = effect;
            effect.flags &= ~2;
            effect = effect.subs?.sub;
            if (effect === undefined || !(effect.flags & 2)) {
                break;
            }
        } while (true);
        queuedLength = insertIndex;
        while (firstInsertedIndex < --insertIndex) {
            const left = queued[firstInsertedIndex];
            queued[firstInsertedIndex++] = queued[insertIndex];
            queued[insertIndex] = left;
        }
    },
    unwatched(node) {
        if (!(node.flags & 1)) {
            effectScopeOper.call(node);
        }
        else if (node.depsTail !== undefined) {
            node.depsTail = undefined;
            node.flags = 1 | 16;
            purgeDeps(node);
        }
    },
});
export function getActiveSub() {
    return activeSub;
}
export function setActiveSub(sub) {
    const prevSub = activeSub;
    activeSub = sub;
    return prevSub;
}
export function getBatchDepth() {
    return batchDepth;
}
export function startBatch() {
    ++batchDepth;
}
export function endBatch() {
    if (!--batchDepth) {
        flush();
    }
}
export function isSignal(fn) {
    return fn.name === 'bound ' + signalOper.name;
}
export function isComputed(fn) {
    return fn.name === 'bound ' + computedOper.name;
}
export function isEffect(fn) {
    return fn.name === 'bound ' + effectOper.name;
}
export function isEffectScope(fn) {
    return fn.name === 'bound ' + effectScopeOper.name;
}
export function signal(initialValue) {
    return signalOper.bind({
        currentValue: initialValue,
        pendingValue: initialValue,
        subs: undefined,
        subsTail: undefined,
        flags: 1,
    });
}
export function computed(getter) {
    return computedOper.bind({
        value: undefined,
        subs: undefined,
        subsTail: undefined,
        deps: undefined,
        depsTail: undefined,
        flags: 0,
        getter: getter,
    });
}
export function effect(fn) {
    const e = {
        fn,
        subs: undefined,
        subsTail: undefined,
        deps: undefined,
        depsTail: undefined,
        flags: 2 | 4,
    };
    const prevSub = setActiveSub(e);
    if (prevSub !== undefined) {
        link(e, prevSub, 0);
    }
    try {
        e.fn();
    }
    finally {
        activeSub = prevSub;
        e.flags &= ~4;
    }
    return effectOper.bind(e);
}
export function effectScope(fn) {
    const e = {
        deps: undefined,
        depsTail: undefined,
        subs: undefined,
        subsTail: undefined,
        flags: 0,
    };
    const prevSub = setActiveSub(e);
    if (prevSub !== undefined) {
        link(e, prevSub, 0);
    }
    try {
        fn();
    }
    finally {
        activeSub = prevSub;
    }
    return effectScopeOper.bind(e);
}
export function trigger(fn) {
    const sub = {
        deps: undefined,
        depsTail: undefined,
        flags: 2,
    };
    const prevSub = setActiveSub(sub);
    try {
        fn();
    }
    finally {
        activeSub = prevSub;
        let link = sub.deps;
        while (link !== undefined) {
            const dep = link.dep;
            link = unlink(link, sub);
            const subs = dep.subs;
            if (subs !== undefined) {
                sub.flags = 0;
                propagate(subs);
                shallowPropagate(subs);
            }
        }
        if (!batchDepth) {
            flush();
        }
    }
}
function updateComputed(c) {
    ++cycle;
    c.depsTail = undefined;
    c.flags = 1 | 4;
    const prevSub = setActiveSub(c);
    try {
        const oldValue = c.value;
        return oldValue !== (c.value = c.getter(oldValue));
    }
    finally {
        activeSub = prevSub;
        c.flags &= ~4;
        purgeDeps(c);
    }
}
function updateSignal(s) {
    s.flags = 1;
    return s.currentValue !== (s.currentValue = s.pendingValue);
}
function run(e) {
    const flags = e.flags;
    if (flags & 16
        || (flags & 32
            && checkDirty(e.deps, e))) {
        ++cycle;
        e.depsTail = undefined;
        e.flags = 2 | 4;
        const prevSub = setActiveSub(e);
        try {
            e.fn();
        }
        finally {
            activeSub = prevSub;
            e.flags &= ~4;
            purgeDeps(e);
        }
    }
    else {
        e.flags = 2;
    }
}
function flush() {
    try {
        while (notifyIndex < queuedLength) {
            const effect = queued[notifyIndex];
            queued[notifyIndex++] = undefined;
            run(effect);
        }
    }
    finally {
        while (notifyIndex < queuedLength) {
            const effect = queued[notifyIndex];
            queued[notifyIndex++] = undefined;
            effect.flags |= 2 | 8;
        }
        notifyIndex = 0;
        queuedLength = 0;
    }
}
function computedOper() {
    const flags = this.flags;
    if (flags & 16
        || (flags & 32
            && (checkDirty(this.deps, this)
                || (this.flags = flags & ~32, false)))) {
        if (updateComputed(this)) {
            const subs = this.subs;
            if (subs !== undefined) {
                shallowPropagate(subs);
            }
        }
    }
    else if (!flags) {
        this.flags = 1 | 4;
        const prevSub = setActiveSub(this);
        try {
            this.value = this.getter();
        }
        finally {
            activeSub = prevSub;
            this.flags &= ~4;
        }
    }
    const sub = activeSub;
    if (sub !== undefined) {
        link(this, sub, cycle);
    }
    return this.value;
}
function signalOper(...value) {
    if (value.length) {
        if (this.pendingValue !== (this.pendingValue = value[0])) {
            this.flags = 1 | 16;
            const subs = this.subs;
            if (subs !== undefined) {
                propagate(subs);
                if (!batchDepth) {
                    flush();
                }
            }
        }
    }
    else {
        if (this.flags & 16) {
            if (updateSignal(this)) {
                const subs = this.subs;
                if (subs !== undefined) {
                    shallowPropagate(subs);
                }
            }
        }
        let sub = activeSub;
        while (sub !== undefined) {
            if (sub.flags & (1 | 2)) {
                link(this, sub, cycle);
                break;
            }
            sub = sub.subs?.sub;
        }
        return this.currentValue;
    }
}
function effectOper() {
    effectScopeOper.call(this);
}
function effectScopeOper() {
    this.depsTail = undefined;
    this.flags = 0;
    purgeDeps(this);
    const sub = this.subs;
    if (sub !== undefined) {
        unlink(sub);
    }
}
function purgeDeps(sub) {
    const depsTail = sub.depsTail;
    let dep = depsTail !== undefined ? depsTail.nextDep : sub.deps;
    while (dep !== undefined) {
        dep = unlink(dep, sub);
    }
}

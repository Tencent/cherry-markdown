"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactiveFlags = void 0;
exports.createReactiveSystem = createReactiveSystem;
exports.ReactiveFlags = {
    None: 0,
    Mutable: 1,
    Watching: 2,
    RecursedCheck: 4,
    Recursed: 8,
    Dirty: 16,
    Pending: 32,
};
function createReactiveSystem({ update, notify, unwatched, }) {
    return {
        link,
        unlink,
        propagate,
        checkDirty,
        shallowPropagate,
    };
    function link(dep, sub, version) {
        const prevDep = sub.depsTail;
        if (prevDep !== undefined && prevDep.dep === dep) {
            return;
        }
        const nextDep = prevDep !== undefined ? prevDep.nextDep : sub.deps;
        if (nextDep !== undefined && nextDep.dep === dep) {
            nextDep.version = version;
            sub.depsTail = nextDep;
            return;
        }
        const prevSub = dep.subsTail;
        if (prevSub !== undefined && prevSub.version === version && prevSub.sub === sub) {
            return;
        }
        const newLink = sub.depsTail
            = dep.subsTail
                = {
                    version,
                    dep,
                    sub,
                    prevDep,
                    nextDep,
                    prevSub,
                    nextSub: undefined,
                };
        if (nextDep !== undefined) {
            nextDep.prevDep = newLink;
        }
        if (prevDep !== undefined) {
            prevDep.nextDep = newLink;
        }
        else {
            sub.deps = newLink;
        }
        if (prevSub !== undefined) {
            prevSub.nextSub = newLink;
        }
        else {
            dep.subs = newLink;
        }
    }
    function unlink(link, sub = link.sub) {
        const dep = link.dep;
        const prevDep = link.prevDep;
        const nextDep = link.nextDep;
        const nextSub = link.nextSub;
        const prevSub = link.prevSub;
        if (nextDep !== undefined) {
            nextDep.prevDep = prevDep;
        }
        else {
            sub.depsTail = prevDep;
        }
        if (prevDep !== undefined) {
            prevDep.nextDep = nextDep;
        }
        else {
            sub.deps = nextDep;
        }
        if (nextSub !== undefined) {
            nextSub.prevSub = prevSub;
        }
        else {
            dep.subsTail = prevSub;
        }
        if (prevSub !== undefined) {
            prevSub.nextSub = nextSub;
        }
        else if ((dep.subs = nextSub) === undefined) {
            unwatched(dep);
        }
        return nextDep;
    }
    function propagate(link) {
        let next = link.nextSub;
        let stack;
        top: do {
            const sub = link.sub;
            let flags = sub.flags;
            if (!(flags & (4 | 8 | 16 | 32))) {
                sub.flags = flags | 32;
            }
            else if (!(flags & (4 | 8))) {
                flags = 0;
            }
            else if (!(flags & 4)) {
                sub.flags = (flags & ~8) | 32;
            }
            else if (!(flags & (16 | 32)) && isValidLink(link, sub)) {
                sub.flags = flags | (8 | 32);
                flags &= 1;
            }
            else {
                flags = 0;
            }
            if (flags & 2) {
                notify(sub);
            }
            if (flags & 1) {
                const subSubs = sub.subs;
                if (subSubs !== undefined) {
                    const nextSub = (link = subSubs).nextSub;
                    if (nextSub !== undefined) {
                        stack = { value: next, prev: stack };
                        next = nextSub;
                    }
                    continue;
                }
            }
            if ((link = next) !== undefined) {
                next = link.nextSub;
                continue;
            }
            while (stack !== undefined) {
                link = stack.value;
                stack = stack.prev;
                if (link !== undefined) {
                    next = link.nextSub;
                    continue top;
                }
            }
            break;
        } while (true);
    }
    function checkDirty(link, sub) {
        let stack;
        let checkDepth = 0;
        let dirty = false;
        top: do {
            const dep = link.dep;
            const flags = dep.flags;
            if (sub.flags & 16) {
                dirty = true;
            }
            else if ((flags & (1 | 16)) === (1 | 16)) {
                if (update(dep)) {
                    const subs = dep.subs;
                    if (subs.nextSub !== undefined) {
                        shallowPropagate(subs);
                    }
                    dirty = true;
                }
            }
            else if ((flags & (1 | 32)) === (1 | 32)) {
                if (link.nextSub !== undefined || link.prevSub !== undefined) {
                    stack = { value: link, prev: stack };
                }
                link = dep.deps;
                sub = dep;
                ++checkDepth;
                continue;
            }
            if (!dirty) {
                const nextDep = link.nextDep;
                if (nextDep !== undefined) {
                    link = nextDep;
                    continue;
                }
            }
            while (checkDepth--) {
                const firstSub = sub.subs;
                const hasMultipleSubs = firstSub.nextSub !== undefined;
                if (hasMultipleSubs) {
                    link = stack.value;
                    stack = stack.prev;
                }
                else {
                    link = firstSub;
                }
                if (dirty) {
                    if (update(sub)) {
                        if (hasMultipleSubs) {
                            shallowPropagate(firstSub);
                        }
                        sub = link.sub;
                        continue;
                    }
                    dirty = false;
                }
                else {
                    sub.flags &= ~32;
                }
                sub = link.sub;
                const nextDep = link.nextDep;
                if (nextDep !== undefined) {
                    link = nextDep;
                    continue top;
                }
            }
            return dirty;
        } while (true);
    }
    function shallowPropagate(link) {
        do {
            const sub = link.sub;
            const flags = sub.flags;
            if ((flags & (32 | 16)) === 32) {
                sub.flags = flags | 16;
                if ((flags & (2 | 4)) === 2) {
                    notify(sub);
                }
            }
        } while ((link = link.nextSub) !== undefined);
    }
    function isValidLink(checkLink, sub) {
        let link = sub.depsTail;
        while (link !== undefined) {
            if (link === checkLink) {
                return true;
            }
            link = link.prevDep;
        }
        return false;
    }
}

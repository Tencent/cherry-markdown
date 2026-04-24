function _define_property(obj, key, value) {
    if (key in obj) Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
    });
    else obj[key] = value;
    return obj;
}
class HookBase {
    intercept(interceptor) {
        this.interceptors.push(Object.assign({}, interceptor));
        if (interceptor.register) for(let i = 0; i < this.taps.length; i++)this.taps[i] = interceptor.register(this.taps[i]);
    }
    _runRegisterInterceptors(options) {
        return this.interceptors.reduce((options, interceptor)=>interceptor.register?.(options) ?? options, options);
    }
    _runCallInterceptors(...args) {
        for (const interceptor of this.interceptors)if (interceptor.call) interceptor.call(...args);
    }
    _runErrorInterceptors(e) {
        for (const interceptor of this.interceptors)if (interceptor.error) interceptor.error(e);
    }
    _runTapInterceptors(tap) {
        for (const interceptor of this.interceptors)if (interceptor.tap) interceptor.tap(tap);
    }
    _runDoneInterceptors() {
        for (const interceptor of this.interceptors)if (interceptor.done) interceptor.done();
    }
    _runResultInterceptors(r) {
        for (const interceptor of this.interceptors)if (interceptor.result) interceptor.result(r);
    }
    withOptions(options) {
        const mergeOptions = (opt)=>Object.assign({}, options, 'string' == typeof opt ? {
                name: opt
            } : opt);
        return {
            name: this.name,
            tap: (opt, fn)=>this.tap(mergeOptions(opt), fn),
            tapAsync: (opt, fn)=>this.tapAsync(mergeOptions(opt), fn),
            tapPromise: (opt, fn)=>this.tapPromise(mergeOptions(opt), fn),
            intercept: (interceptor)=>this.intercept(interceptor),
            isUsed: ()=>this.isUsed(),
            withOptions: (opt)=>this.withOptions(mergeOptions(opt)),
            queryStageRange: (stageRange)=>this.queryStageRange(stageRange)
        };
    }
    isUsed() {
        return this.taps.length > 0 || this.interceptors.length > 0;
    }
    queryStageRange(stageRange) {
        return new QueriedHook(stageRange, this);
    }
    callAsyncStageRange(queried) {
        throw new Error('Hook should implement there own _callAsyncStageRange');
    }
    callAsync(...args) {
        return this.callAsyncStageRange(this.queryStageRange(allStageRange), ...args);
    }
    promiseStageRange(queried, ...args) {
        return new Promise((resolve, reject)=>{
            this.callAsyncStageRange(queried, ...args, (e, r)=>{
                if (e) return reject(e);
                return resolve(r);
            });
        });
    }
    promise(...args) {
        return this.promiseStageRange(this.queryStageRange(allStageRange), ...args);
    }
    tap(options, fn) {
        this._tap('sync', options, fn);
    }
    tapAsync(options, fn) {
        this._tap('async', options, fn);
    }
    tapPromise(options, fn) {
        this._tap('promise', options, fn);
    }
    _tap(type, options, fn) {
        let normalizedOptions = options;
        if ('string' == typeof options) normalizedOptions = {
            name: options.trim()
        };
        else if ('object' != typeof options || null === options) throw new Error('Invalid tap options');
        if ('string' != typeof normalizedOptions.name || '' === normalizedOptions.name) throw new Error('Missing name for tap');
        this._insert(this._runRegisterInterceptors(Object.assign({
            type,
            fn
        }, normalizedOptions)));
    }
    _insert(item) {
        let before;
        if ('string' == typeof item.before) before = new Set([
            item.before
        ]);
        else if (Array.isArray(item.before)) before = new Set(item.before);
        let stage = 0;
        if ('number' == typeof item.stage) stage = item.stage;
        let i = this.taps.length;
        while(i > 0){
            i--;
            const x = this.taps[i];
            this.taps[i + 1] = x;
            const xStage = x.stage || 0;
            if (before) {
                if (before.has(x.name)) {
                    before.delete(x.name);
                    continue;
                }
                if (before.size > 0) continue;
            }
            if (xStage > stage) continue;
            i++;
            break;
        }
        this.taps[i] = item;
    }
    _prepareArgs(args) {
        const len = this.args.length;
        if (args.length < len) {
            args.length = len;
            return args.fill(void 0, args.length, len);
        }
        if (args.length > len) args.length = len;
        return args;
    }
    constructor(args = [], name){
        _define_property(this, "args", void 0);
        _define_property(this, "name", void 0);
        _define_property(this, "taps", void 0);
        _define_property(this, "interceptors", void 0);
        this.args = args;
        this.name = name;
        this.taps = [];
        this.interceptors = [];
    }
}
const minStage = -1 / 0;
const maxStage = 1 / 0;
const allStageRange = [
    minStage,
    maxStage
];
const i32MIN = -(2 ** 31);
const i32MAX = 2 ** 31 - 1;
const safeStage = (stage)=>{
    if (stage < i32MIN) return i32MIN;
    if (stage > i32MAX) return i32MAX;
    return stage;
};
class QueriedHook {
    isUsed() {
        if (this.tapsInRange.length > 0) return true;
        if (this.stageRange[0] === minStage && this.hook.interceptors.some((i)=>i.call)) return true;
        if (this.stageRange[1] === maxStage && this.hook.interceptors.some((i)=>i.done)) return true;
        return false;
    }
    call(...args) {
        if ('function' != typeof this.hook.callStageRange) throw new Error('hook is not a SyncHook, call methods only exists on SyncHook');
        return this.hook.callStageRange(this, ...args);
    }
    callAsync(...args) {
        return this.hook.callAsyncStageRange(this, ...args);
    }
    promise(...args) {
        return this.hook.promiseStageRange(this, ...args);
    }
    constructor(stageRange, hook){
        _define_property(this, "stageRange", void 0);
        _define_property(this, "hook", void 0);
        _define_property(this, "tapsInRange", void 0);
        const tapsInRange = [];
        const [from, to] = stageRange;
        for (const tap of hook.taps){
            const stage = tap.stage ?? 0;
            if (from <= stage && stage < to) tapsInRange.push(tap);
            else if (to === maxStage && stage === maxStage) tapsInRange.push(tap);
        }
        this.stageRange = stageRange;
        this.hook = hook;
        this.tapsInRange = tapsInRange;
    }
}
class SyncHook extends HookBase {
    callAsyncStageRange(queried, ...args) {
        const { stageRange: [from, to], tapsInRange } = queried;
        const argsWithoutCb = args.slice(0, args.length - 1);
        const cb = args[args.length - 1];
        const args2 = this._prepareArgs(argsWithoutCb);
        if (from === minStage) this._runCallInterceptors(...args2);
        for (const tap of tapsInRange){
            this._runTapInterceptors(tap);
            try {
                tap.fn(...args2);
            } catch (e) {
                const err = e;
                this._runErrorInterceptors(err);
                return cb(err);
            }
        }
        if (to === maxStage) {
            this._runDoneInterceptors();
            cb(null);
        }
    }
    call(...args) {
        return this.callStageRange(this.queryStageRange(allStageRange), ...args);
    }
    callStageRange(queried, ...args) {
        let result;
        let error;
        this.callAsyncStageRange(queried, ...args, (e, r)=>{
            error = e;
            result = r;
        });
        if (error) throw error;
        return result;
    }
    tapAsync() {
        throw new Error('tapAsync is not supported on a SyncHook');
    }
    tapPromise() {
        throw new Error('tapPromise is not supported on a SyncHook');
    }
}
class SyncBailHook extends HookBase {
    callAsyncStageRange(queried, ...args) {
        const { stageRange: [from, to], tapsInRange } = queried;
        const argsWithoutCb = args.slice(0, args.length - 1);
        const cb = args[args.length - 1];
        const args2 = this._prepareArgs(argsWithoutCb);
        if (from === minStage) this._runCallInterceptors(...args2);
        for (const tap of tapsInRange){
            this._runTapInterceptors(tap);
            let r;
            try {
                r = tap.fn(...args2);
            } catch (e) {
                const err = e;
                this._runErrorInterceptors(err);
                return cb(err);
            }
            if (void 0 !== r) {
                this._runResultInterceptors(r);
                return cb(null, r);
            }
        }
        if (to === maxStage) {
            this._runDoneInterceptors();
            cb(null);
        }
    }
    call(...args) {
        return this.callStageRange(this.queryStageRange(allStageRange), ...args);
    }
    callStageRange(queried, ...args) {
        let result;
        let error;
        this.callAsyncStageRange(queried, ...args, (e, r)=>{
            error = e;
            result = r;
        });
        if (error) throw error;
        return result;
    }
    tapAsync() {
        throw new Error('tapAsync is not supported on a SyncBailHook');
    }
    tapPromise() {
        throw new Error('tapPromise is not supported on a SyncBailHook');
    }
}
class SyncWaterfallHook extends HookBase {
    callAsyncStageRange(queried, ...args) {
        const { stageRange: [from, to], tapsInRange } = queried;
        const argsWithoutCb = args.slice(0, args.length - 1);
        const cb = args[args.length - 1];
        const args2 = this._prepareArgs(argsWithoutCb);
        if (from === minStage) this._runCallInterceptors(...args2);
        for (const tap of tapsInRange){
            this._runTapInterceptors(tap);
            try {
                const r = tap.fn(...args2);
                if (void 0 !== r) args2[0] = r;
            } catch (e) {
                const err = e;
                this._runErrorInterceptors(err);
                return cb(err);
            }
        }
        if (to === maxStage) {
            this._runDoneInterceptors();
            cb(null, args2[0]);
        }
    }
    call(...args) {
        return this.callStageRange(this.queryStageRange(allStageRange), ...args);
    }
    callStageRange(queried, ...args) {
        let result;
        let error;
        this.callAsyncStageRange(queried, ...args, (e, r)=>{
            error = e;
            result = r;
        });
        if (error) throw error;
        return result;
    }
    tapAsync() {
        throw new Error('tapAsync is not supported on a SyncWaterfallHook');
    }
    tapPromise() {
        throw new Error('tapPromise is not supported on a SyncWaterfallHook');
    }
    constructor(args = [], name){
        if (args.length < 1) throw new Error('Waterfall hooks must have at least one argument');
        super(args, name);
    }
}
class AsyncParallelHook extends HookBase {
    callAsyncStageRange(queried, ...args) {
        const { stageRange: [from], tapsInRange } = queried;
        const argsWithoutCb = args.slice(0, args.length - 1);
        const cb = args[args.length - 1];
        const args2 = this._prepareArgs(argsWithoutCb);
        if (from === minStage) this._runCallInterceptors(...args2);
        const done = ()=>{
            this._runDoneInterceptors();
            cb(null);
        };
        const error = (e)=>{
            this._runErrorInterceptors(e);
            cb(e);
        };
        if (0 === tapsInRange.length) return done();
        let counter = tapsInRange.length;
        for (const tap of tapsInRange){
            this._runTapInterceptors(tap);
            if ('promise' === tap.type) {
                const promise = tap.fn(...args2);
                if (!promise || !promise.then) throw new Error(`Tap function (tapPromise) did not return promise (returned ${promise})`);
                promise.then(()=>{
                    counter -= 1;
                    if (0 === counter) done();
                }, (e)=>{
                    counter = 0;
                    error(e);
                });
            } else if ('async' === tap.type) tap.fn(...args2, (e)=>{
                if (e) {
                    counter = 0;
                    error(e);
                } else {
                    counter -= 1;
                    if (0 === counter) done();
                }
            });
            else {
                let hasError = false;
                try {
                    tap.fn(...args2);
                } catch (e) {
                    hasError = true;
                    counter = 0;
                    error(e);
                }
                if (!hasError && 0 === --counter) done();
            }
            if (counter <= 0) return;
        }
    }
}
class AsyncSeriesHook extends HookBase {
    callAsyncStageRange(queried, ...args) {
        const { stageRange: [from], tapsInRange } = queried;
        const argsWithoutCb = args.slice(0, args.length - 1);
        const cb = args[args.length - 1];
        const args2 = this._prepareArgs(argsWithoutCb);
        if (from === minStage) this._runCallInterceptors(...args2);
        const done = ()=>{
            this._runDoneInterceptors();
            cb(null);
        };
        const error = (e)=>{
            this._runErrorInterceptors(e);
            cb(e);
        };
        if (0 === tapsInRange.length) return done();
        let index = 0;
        const next = ()=>{
            const tap = tapsInRange[index];
            this._runTapInterceptors(tap);
            if ('promise' === tap.type) {
                const promise = tap.fn(...args2);
                if (!promise || !promise.then) throw new Error(`Tap function (tapPromise) did not return promise (returned ${promise})`);
                promise.then(()=>{
                    index += 1;
                    if (index === tapsInRange.length) done();
                    else next();
                }, (e)=>{
                    index = tapsInRange.length;
                    error(e);
                });
            } else if ('async' === tap.type) tap.fn(...args2, (e)=>{
                if (e) {
                    index = tapsInRange.length;
                    error(e);
                } else {
                    index += 1;
                    if (index === tapsInRange.length) done();
                    else next();
                }
            });
            else {
                let hasError = false;
                try {
                    tap.fn(...args2);
                } catch (e) {
                    hasError = true;
                    index = tapsInRange.length;
                    error(e);
                }
                if (!hasError) {
                    index += 1;
                    if (index === tapsInRange.length) done();
                    else next();
                }
            }
            if (index === tapsInRange.length) return;
        };
        next();
    }
}
class AsyncSeriesBailHook extends HookBase {
    callAsyncStageRange(queried, ...args) {
        const { stageRange: [from], tapsInRange } = queried;
        const argsWithoutCb = args.slice(0, args.length - 1);
        const cb = args[args.length - 1];
        const args2 = this._prepareArgs(argsWithoutCb);
        if (from === minStage) this._runCallInterceptors(...args2);
        const done = ()=>{
            this._runDoneInterceptors();
            cb(null);
        };
        const error = (e)=>{
            this._runErrorInterceptors(e);
            cb(e);
        };
        const result = (r)=>{
            this._runResultInterceptors(r);
            cb(null, r);
        };
        if (0 === tapsInRange.length) return done();
        let index = 0;
        const next = ()=>{
            const tap = tapsInRange[index];
            this._runTapInterceptors(tap);
            if ('promise' === tap.type) {
                const promise = tap.fn(...args2);
                if (!promise || !promise.then) throw new Error(`Tap function (tapPromise) did not return promise (returned ${promise})`);
                promise.then((r)=>{
                    index += 1;
                    if (void 0 !== r) result(r);
                    else if (index === tapsInRange.length) done();
                    else next();
                }, (e)=>{
                    index = tapsInRange.length;
                    error(e);
                });
            } else if ('async' === tap.type) tap.fn(...args2, (e, r)=>{
                if (e) {
                    index = tapsInRange.length;
                    error(e);
                } else {
                    index += 1;
                    if (void 0 !== r) result(r);
                    else if (index === tapsInRange.length) done();
                    else next();
                }
            });
            else {
                let hasError = false;
                let r;
                try {
                    r = tap.fn(...args2);
                } catch (e) {
                    hasError = true;
                    index = tapsInRange.length;
                    error(e);
                }
                if (!hasError) {
                    index += 1;
                    if (void 0 !== r) result(r);
                    else if (index === tapsInRange.length) done();
                    else next();
                }
            }
            if (index === tapsInRange.length) return;
        };
        next();
    }
}
class AsyncSeriesWaterfallHook extends HookBase {
    callAsyncStageRange(queried, ...args) {
        const { stageRange: [from], tapsInRange } = queried;
        const argsWithoutCb = args.slice(0, args.length - 1);
        const cb = args[args.length - 1];
        const args2 = this._prepareArgs(argsWithoutCb);
        if (from === minStage) this._runCallInterceptors(...args2);
        const result = (r)=>{
            this._runResultInterceptors(r);
            cb(null, r);
        };
        const error = (e)=>{
            this._runErrorInterceptors(e);
            cb(e);
        };
        if (0 === tapsInRange.length) return result(args2[0]);
        let index = 0;
        const next = ()=>{
            const tap = tapsInRange[index];
            this._runTapInterceptors(tap);
            if ('promise' === tap.type) {
                const promise = tap.fn(...args2);
                if (!promise || !promise.then) throw new Error(`Tap function (tapPromise) did not return promise (returned ${promise})`);
                promise.then((r)=>{
                    index += 1;
                    if (void 0 !== r) args2[0] = r;
                    if (index === tapsInRange.length) result(args2[0]);
                    else next();
                }, (e)=>{
                    index = tapsInRange.length;
                    error(e);
                });
            } else if ('async' === tap.type) tap.fn(...args2, (e, r)=>{
                if (e) {
                    index = tapsInRange.length;
                    error(e);
                } else {
                    index += 1;
                    if (void 0 !== r) args2[0] = r;
                    if (index === tapsInRange.length) result(args2[0]);
                    else next();
                }
            });
            else {
                let hasError = false;
                try {
                    const r = tap.fn(...args2);
                    if (void 0 !== r) args2[0] = r;
                } catch (e) {
                    hasError = true;
                    index = tapsInRange.length;
                    error(e);
                }
                if (!hasError) {
                    index += 1;
                    if (index === tapsInRange.length) result(args2[0]);
                    else next();
                }
            }
            if (index === tapsInRange.length) return;
        };
        next();
    }
    constructor(args = [], name){
        if (args.length < 1) throw new Error('Waterfall hooks must have at least one argument');
        super(args, name);
    }
}
const defaultFactory = (key, hook)=>hook;
class HookMap {
    get(key) {
        return this._map.get(key);
    }
    for(key) {
        const hook = this.get(key);
        if (void 0 !== hook) return hook;
        let newHook = this._factory(key);
        const interceptors = this._interceptors;
        for(let i = 0; i < interceptors.length; i++){
            const factory = interceptors[i].factory;
            if (factory) newHook = factory(key, newHook);
        }
        this._map.set(key, newHook);
        return newHook;
    }
    intercept(interceptor) {
        this._interceptors.push(Object.assign({
            factory: defaultFactory
        }, interceptor));
    }
    isUsed() {
        for (const key of this._map.keys()){
            const hook = this.get(key);
            if (hook?.isUsed()) return true;
        }
        return false;
    }
    queryStageRange(stageRange) {
        return new QueriedHookMap(stageRange, this);
    }
    constructor(factory, name){
        _define_property(this, "_map", new Map());
        _define_property(this, "_factory", void 0);
        _define_property(this, "name", void 0);
        _define_property(this, "_interceptors", void 0);
        this.name = name;
        this._factory = factory;
        this._interceptors = [];
    }
}
class QueriedHookMap {
    get(key) {
        return this.hookMap.get(key)?.queryStageRange(this.stageRange);
    }
    for(key) {
        return this.hookMap.for(key).queryStageRange(this.stageRange);
    }
    isUsed() {
        for (const key of this.hookMap._map.keys())if (this.get(key)?.isUsed()) return true;
        return false;
    }
    constructor(stageRange, hookMap){
        _define_property(this, "stageRange", void 0);
        _define_property(this, "hookMap", void 0);
        this.stageRange = stageRange;
        this.hookMap = hookMap;
    }
}
class MultiHook {
    tap(options, fn) {
        for (const hook of this.hooks)hook.tap(options, fn);
    }
    tapAsync(options, fn) {
        for (const hook of this.hooks)hook.tapAsync(options, fn);
    }
    tapPromise(options, fn) {
        for (const hook of this.hooks)hook.tapPromise(options, fn);
    }
    isUsed() {
        for (const hook of this.hooks)if (hook.isUsed()) return true;
        return false;
    }
    intercept(interceptor) {
        for (const hook of this.hooks)hook.intercept(interceptor);
    }
    withOptions(options) {
        return new MultiHook(this.hooks.map((h)=>h.withOptions(options)), this.name);
    }
    constructor(hooks, name){
        _define_property(this, "hooks", void 0);
        _define_property(this, "name", void 0);
        this.hooks = hooks;
        this.name = name;
    }
}
export { AsyncParallelHook, AsyncSeriesBailHook, AsyncSeriesHook, AsyncSeriesWaterfallHook, HookBase, HookMap, MultiHook, QueriedHook, QueriedHookMap, SyncBailHook, SyncHook, SyncWaterfallHook, maxStage, minStage, safeStage };

/******************************************************************************
 * Copyright 2025 Y. Daveluy
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import { MultiMap } from '../utils/collections.js';
export class DefaultLangiumProfiler {
    constructor(activeCategories) {
        this.activeCategories = new Set();
        this.allCategories = new Set(['validating', 'parsing', 'linking']);
        this.activeCategories = activeCategories ?? new Set(this.allCategories);
        this.records = new MultiMap();
    }
    isActive(category) {
        return this.activeCategories.has(category);
    }
    start(...categories) {
        if (!categories) {
            // Create a new set with all categories (immutable copy)
            this.activeCategories = new Set(this.allCategories);
        }
        else {
            categories.forEach(category => this.activeCategories.add(category));
        }
    }
    stop(...categories) {
        if (!categories) {
            this.activeCategories.clear();
        }
        else {
            categories.forEach(category => this.activeCategories.delete(category));
        }
    }
    createTask(category, taskId) {
        if (!this.isActive(category)) {
            throw new Error(`Category "${category}" is not active.`);
        }
        console.log(`Creating profiling task for '${category}.${taskId}'.`);
        return new ProfilingTask((record) => this.records.add(category, this.dumpRecord(category, record)), taskId);
    }
    dumpRecord(category, record) {
        console.info(`Task ${category}.${record.identifier} executed in ${record.duration.toFixed(2)}ms and ended at ${record.date.toISOString()}`);
        const result = [];
        for (const key of record.entries.keys()) {
            const values = record.entries.get(key);
            const duration = values.reduce((p, c) => p + c);
            result.push({ name: `${record.identifier}.${key}`, count: values.length, duration: duration });
        }
        // sum all duration
        const taskInternalDuration = record.duration - result.map(r => r.duration).reduce((a, b) => a + b, 0);
        result.push({ name: record.identifier, count: 1, duration: taskInternalDuration });
        result.sort((a, b) => b.duration - a.duration);
        function Round(value) { return Math.round(100 * value) / 100; }
        console.table(result.map(e => { return { Element: e.name, Count: e.count, 'Self %': Round(100 * e.duration / record.duration), 'Time (ms)': Round(e.duration) }; }));
        return record;
    }
    getRecords(...categories) {
        if (categories.length === 0) {
            // return all records
            return this.records.values();
        }
        else {
            // return records for the given categories
            return this.records.entries().filter((e) => categories.some(c => c === e[0])).flatMap(e => e[1]);
        }
    }
}
export class ProfilingTask {
    constructor(addRecord, identifier) {
        this.stack = [];
        this.entries = new MultiMap();
        this.addRecord = addRecord;
        this.identifier = identifier;
    }
    start() {
        if (this.startTime !== undefined) {
            throw new Error(`Task "${this.identifier}" is already started.`);
        }
        this.startTime = performance.now();
    }
    stop() {
        if (this.startTime === undefined) {
            throw new Error(`Task "${this.identifier}" was not started.`);
        }
        if (this.stack.length !== 0) {
            throw new Error(`Task "${this.identifier}" cannot be stopped before sub-task(s): ${this.stack.map(s => s.id).join(', ')}.`);
        }
        const record = {
            identifier: this.identifier,
            date: new Date(),
            duration: performance.now() - this.startTime,
            entries: this.entries
        };
        this.addRecord(record);
        this.startTime = undefined;
        this.entries.clear();
    }
    startSubTask(subTaskId) {
        this.stack.push({ id: subTaskId, start: performance.now(), content: 0 });
    }
    stopSubTask(subTaskId) {
        const subStack = this.stack.pop();
        if (!subStack) {
            throw new Error(`Task "${this.identifier}.${subTaskId}" was not started.`);
        }
        if (subStack.id !== subTaskId) {
            throw new Error(`Sub-Task "${subStack.id}" is not already stopped.`);
        }
        const duration = performance.now() - subStack.start;
        if (this.stack.at(-1) !== undefined) {
            this.stack[this.stack.length - 1].content += duration;
        }
        // we are interested here by the duration of the current sub-task without the duration of nested sub-tasks.
        const selfDuration = duration - subStack.content;
        this.entries.add(subTaskId, selfDuration);
    }
}
//# sourceMappingURL=profiler.js.map
/******************************************************************************
 * Copyright 2025 Y. Daveluy
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import { MultiMap } from '../utils/collections.js';
import type { Stream } from '../utils/stream.js';

export type ProfilingCategory = 'validating' | 'parsing' | 'linking';

export interface LangiumProfiler {

    /**
     * Checks if the given category is active.
     * @param category The category to check.
     * @returns `true` if the category is active, `false` otherwise.
     */
    isActive(category: ProfilingCategory): boolean;

    /**
     * Starts the profiling for the given categories. If none are provided, all categories are started.
     * @param categories The categories to start profiling for.
     */
    start(...categories: ProfilingCategory[]): void;

    /**
     * Stops the profiling for the given categories. If none are provided, all categories are stopped.
     * @param categories The categories to stop profiling for.
     */
    stop(...categories: ProfilingCategory[]): void;

    /**
     * Creates a new {@link ProfilingTask} for the given category.
     * @param category The category to create the task for.
     * @param taskId The identifier of the task.
     */
    createTask(category: ProfilingCategory, taskId: string): ProfilingTask;

    /**
     * Gets the {@link ProfilingRecord}s for the given categories. If none are provided, all records are returned.
     * @param categories The categories to get the records for.
     * @returns A stream of profiling records.
     */
    getRecords(...categories: ProfilingCategory[]): Stream<ProfilingRecord>;
}

export class DefaultLangiumProfiler implements LangiumProfiler {
    protected activeCategories: Set<ProfilingCategory> = new Set<ProfilingCategory>();
    protected readonly allCategories: ReadonlySet<ProfilingCategory> = new Set<ProfilingCategory>([ 'validating', 'parsing', 'linking' ]);
    protected readonly records: MultiMap<string, ProfilingRecord>;

    constructor(activeCategories?: Set<ProfilingCategory>) {
        this.activeCategories = activeCategories ?? new Set<ProfilingCategory>(this.allCategories);
        this.records = new MultiMap();
    }

    isActive(category: ProfilingCategory): boolean {
        return this.activeCategories.has(category);
    }

    start(...categories: ProfilingCategory[]): void {
        if (!categories) {
            // Create a new set with all categories (immutable copy)
            this.activeCategories = new Set(this.allCategories);
        }
        else {
            categories.forEach(category => this.activeCategories.add(category));
        }
    }

    stop(...categories: ProfilingCategory[]): void {
        if (!categories) {
            this.activeCategories.clear();
        } else {
            categories.forEach(category => this.activeCategories.delete(category));
        }
    }

    createTask(category: ProfilingCategory, taskId: string): ProfilingTask {
        if (!this.isActive(category)) {
            throw new Error(`Category "${category}" is not active.`);
        }
        console.log(`Creating profiling task for '${category}.${taskId}'.`);
        return new ProfilingTask((record: ProfilingRecord) => this.records.add(category, this.dumpRecord(category, record)), taskId);
    }

    protected dumpRecord(category: string, record: ProfilingRecord): ProfilingRecord {
        console.info(`Task ${category}.${record.identifier} executed in ${record.duration.toFixed(2)}ms and ended at ${record.date.toISOString()}`);

        const result: Array<{ name: string, count: number, duration: number }> = [];
        for (const key of record.entries.keys()) {
            const values = record.entries.get(key);
            const duration = values.reduce((p, c) => p + c);
            result.push({ name: `${record.identifier}.${key}`, count: values.length, duration: duration });
        }

        // sum all duration
        const taskInternalDuration = record.duration - result.map(r => r.duration).reduce((a, b) => a + b, 0);

        result.push({ name: record.identifier, count: 1, duration: taskInternalDuration });

        result.sort((a, b) => b.duration - a.duration);
        function Round(value: number) { return Math.round(100 * value) / 100; }
        console.table(result.map(e => { return { Element: e.name, Count: e.count, 'Self %': Round(100 * e.duration / record.duration), 'Time (ms)': Round(e.duration) }; }));
        return record;
    }

    getRecords(...categories: ProfilingCategory[]): Stream<ProfilingRecord> {
        if (categories.length === 0) {
            // return all records
            return this.records.values();
        } else {
            // return records for the given categories
            return this.records.entries().filter((e) => categories.some(c => c === e[0])).flatMap(e => e[1]);
        }
    }
}

export interface ProfilingRecord {
    // the record identifier (e.g: the grammar name)
    identifier: string
    // the date at which the record is generated
    date: Date
    // the duration of the record
    duration: number
    // a list of sub-tasks(string) called during the recording with
    // for each sub-task the duration of each call.
    entries: MultiMap<string, number>
}

export class ProfilingTask {
    protected startTime?: number;
    protected readonly addRecord: (record: ProfilingRecord) => void;

    protected readonly identifier: string;
    protected readonly stack: Array<{ id: string, start: number, content: number }> = [];
    protected readonly entries = new MultiMap<string, number>();

    constructor(addRecord: (record: ProfilingRecord) => void, identifier: string) {
        this.addRecord = addRecord;
        this.identifier = identifier;
    }

    start(): void {
        if (this.startTime !== undefined) {
            throw new Error(`Task "${this.identifier}" is already started.`);
        }
        this.startTime = performance.now();
    }

    stop(): void {
        if (this.startTime === undefined) {
            throw new Error(`Task "${this.identifier}" was not started.`);
        }
        if (this.stack.length !== 0) {
            throw new Error(`Task "${this.identifier}" cannot be stopped before sub-task(s): ${this.stack.map(s => s.id).join(', ')}.`);
        }
        const record: ProfilingRecord = {
            identifier: this.identifier,
            date: new Date(),
            duration: performance.now() - this.startTime,
            entries: this.entries
        };
        this.addRecord(record);
        this.startTime = undefined;
        this.entries.clear();
    }

    startSubTask(subTaskId: string): void {
        this.stack.push({ id: subTaskId, start: performance.now(), content: 0 });
    }

    stopSubTask(subTaskId: string): void {
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

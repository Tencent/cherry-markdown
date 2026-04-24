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
export declare class DefaultLangiumProfiler implements LangiumProfiler {
    protected activeCategories: Set<ProfilingCategory>;
    protected readonly allCategories: ReadonlySet<ProfilingCategory>;
    protected readonly records: MultiMap<string, ProfilingRecord>;
    constructor(activeCategories?: Set<ProfilingCategory>);
    isActive(category: ProfilingCategory): boolean;
    start(...categories: ProfilingCategory[]): void;
    stop(...categories: ProfilingCategory[]): void;
    createTask(category: ProfilingCategory, taskId: string): ProfilingTask;
    protected dumpRecord(category: string, record: ProfilingRecord): ProfilingRecord;
    getRecords(...categories: ProfilingCategory[]): Stream<ProfilingRecord>;
}
export interface ProfilingRecord {
    identifier: string;
    date: Date;
    duration: number;
    entries: MultiMap<string, number>;
}
export declare class ProfilingTask {
    protected startTime?: number;
    protected readonly addRecord: (record: ProfilingRecord) => void;
    protected readonly identifier: string;
    protected readonly stack: Array<{
        id: string;
        start: number;
        content: number;
    }>;
    protected readonly entries: MultiMap<string, number>;
    constructor(addRecord: (record: ProfilingRecord) => void, identifier: string);
    start(): void;
    stop(): void;
    startSubTask(subTaskId: string): void;
    stopSubTask(subTaskId: string): void;
}
//# sourceMappingURL=profiler.d.ts.map
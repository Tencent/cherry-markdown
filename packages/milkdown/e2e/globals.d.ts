import type { CherryMilkdownErrorContext, CherryMilkdownFileUploadParams, CherryMilkdownInstance } from '../src/types';

declare global {
  interface Window {
    createResourceProbe: () => Promise<{ instance: CherryMilkdownInstance; engine: { makeHtml(markdown: string): string }; onError: () => void; fileUpload: () => void; renderer: () => void }>;
    milkdownEditor?: CherryMilkdownInstance;
    uploads: Array<{
      finish: (url: string, params?: CherryMilkdownFileUploadParams) => void;
      reject: (reason?: unknown) => void;
      signal: AbortSignal;
    }>;
    uploadChanges: string[];
    uploadEditor?: CherryMilkdownInstance;
    secondUploadEditor?: CherryMilkdownInstance;
    createUploadEditor: () => Promise<CherryMilkdownInstance>;
    retryUploadEditor: () => Promise<CherryMilkdownInstance>;
    editAndDestroySynchronously: () => Promise<{ immediate: string; after: string }>;
    editAndDestroyReentrantly: () => { shared: boolean; markdown: string };
    editDuringDestroySnapshot: () => Promise<string>;
    destroyDuringExternalSerialization: () => Promise<string>;
    editorStateIsAligned: () => boolean;
    recoverPendingEditDuringFailure: () => { previous: string; current: string };
    measureExternalAfterLocalEdit: (source: string, target: string, settle: boolean) => Promise<number>;
    recoveryContext?: CherryMilkdownErrorContext;
    failedEditorCleaned?: boolean;
    failedEditorRejected?: boolean;
    failedEditorError?: string;
    failedEditorRejection?: string;
    installSerializerFailure: (after?: number) => void;
    installSerializerCounter: () => void;
    installSerializerReentry: () => void;
    installFinalSerializerEdit: () => void;
    serializerCalls?: number;
    restoreSerializer: () => void;
    asyncParseErrors?: string[];
    releaseEditorCleanup?: () => void;
    firstEditorDestroy?: Promise<void>;
    secondEditorDestroy?: Promise<void>;
    secondEditorDestroyFinished?: boolean;
    failedDestroyViewCleaned?: boolean;
  }
}

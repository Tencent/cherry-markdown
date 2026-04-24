export interface CommitMessageData {
    header: string | null;
    body?: string | null;
    footer?: string | null;
}
export declare const buildCommitMessage: ({ header, body, footer, }: CommitMessageData) => string;
//# sourceMappingURL=commit-message.d.ts.map
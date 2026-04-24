export declare function getInfo(request: {
    commit: string;
    repo: string;
}): Promise<{
    user: string | null;
    pull: number | null;
    links: {
        commit: string;
        pull: string | null;
        user: string | null;
    };
}>;
export declare function getInfoFromPullRequest(request: {
    pull: number;
    repo: string;
}): Promise<{
    user: string | null;
    commit: string | null;
    links: {
        commit: string | null;
        pull: string;
        user: string | null;
    };
}>;

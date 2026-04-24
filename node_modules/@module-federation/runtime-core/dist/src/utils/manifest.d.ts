import { Remote } from '../type';
export declare function matchRemoteWithNameAndExpose(remotes: Array<Remote>, id: string): {
    pkgNameOrAlias: string;
    expose: string;
    remote: Remote;
} | undefined;
export declare function matchRemote(remotes: Array<Remote>, nameOrAlias: string): Remote | undefined;

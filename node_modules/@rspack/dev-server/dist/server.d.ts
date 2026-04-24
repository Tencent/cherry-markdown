/// <reference types="node" />
/// <reference types="node" />
/**
 * The following code is modified based on
 * https://github.com/webpack/webpack-dev-server/blob/b0f15ace0123c125d5870609ef4691c141a6d187/lib/Server.js
 *
 * MIT Licensed
 * Author Tobias Koppers @sokra
 * Copyright (c) JS Foundation and other contributors
 * https://github.com/webpack/webpack-dev-server/blob/b0f15ace0123c125d5870609ef4691c141a6d187/LICENSE
 */
import type { Server } from "node:http";
import type { Socket } from "node:net";
import { type Compiler, MultiCompiler } from "@rspack/core";
import type { FSWatcher } from "chokidar";
import WebpackDevServer from "webpack-dev-server";
import type { DevServer, ResolvedDevServer } from "./config";
export declare class RspackDevServer extends WebpackDevServer {
    static getFreePort: (port: string, host: string) => Promise<any>;
    /**
     * resolved after `normalizedOptions`
     */
    /** @ts-ignore: types of path data of rspack is not compatible with webpack */
    options: ResolvedDevServer;
    staticWatchers: FSWatcher[];
    sockets: Socket[];
    server: Server;
    /** @ts-ignore */
    compiler: Compiler | MultiCompiler;
    webSocketServer: WebpackDevServer.WebSocketServerImplementation | undefined;
    static version: string;
    constructor(options: DevServer, compiler: Compiler | MultiCompiler);
    initialize(): Promise<void>;
    getClientEntry(): string;
    getClientHotEntry(): string | undefined;
}

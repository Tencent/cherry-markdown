import type { RspackCLI } from "../cli";
import type { RspackCommand } from "../types";
export declare class ServeCommand implements RspackCommand {
    apply(cli: RspackCLI): Promise<void>;
}

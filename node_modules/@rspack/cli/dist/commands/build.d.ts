import type { RspackCLI } from "../cli";
import type { RspackCommand } from "../types";
export declare class BuildCommand implements RspackCommand {
    apply(cli: RspackCLI): Promise<void>;
}

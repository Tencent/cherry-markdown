import type { RspackCLI } from "../cli";
import type { RspackCommand } from "../types";
export declare class PreviewCommand implements RspackCommand {
    apply(cli: RspackCLI): Promise<void>;
}

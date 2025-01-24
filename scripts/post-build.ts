import * as path from "path";
import * as fs from "fs";

const cwd = process.cwd();
const cherryDist = path.join(cwd, "packages/cherry-markdown/dist");
const cherryVscodePlugin = path.join(cwd, "packages/vscodePlugin/web-resources/dist");

fs.cpSync(cherryDist, cherryVscodePlugin, { recursive: true });

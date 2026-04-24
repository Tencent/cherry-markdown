import { resolvePath } from "mlly";

/**
* Resolve path to package
*/
async function resolvePathAsync(packageName, cwd) {
	try {
		return await resolvePath(packageName, { url: cwd });
	} catch {}
}

export { resolvePathAsync };
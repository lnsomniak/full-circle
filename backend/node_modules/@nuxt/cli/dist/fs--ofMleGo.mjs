import { t as logger } from "./logger-Dk0gkCkX.mjs";
import { existsSync, promises } from "node:fs";
import { join } from "pathe";

//#region ../nuxi/src/utils/fs.ts
async function clearDir(path, exclude) {
	if (!exclude) await promises.rm(path, {
		recursive: true,
		force: true
	});
	else if (existsSync(path)) {
		const files = await promises.readdir(path);
		await Promise.all(files.map(async (name) => {
			if (!exclude.includes(name)) await promises.rm(join(path, name), {
				recursive: true,
				force: true
			});
		}));
	}
	await promises.mkdir(path, { recursive: true });
}
function clearBuildDir(path) {
	return clearDir(path, [
		"cache",
		"analyze",
		"nuxt.json"
	]);
}
async function rmRecursive(paths) {
	await Promise.all(paths.filter((p) => typeof p === "string").map(async (path) => {
		logger.debug("Removing recursive path", path);
		await promises.rm(path, {
			recursive: true,
			force: true
		}).catch(() => {});
	}));
}

//#endregion
export { clearDir as n, rmRecursive as r, clearBuildDir as t };
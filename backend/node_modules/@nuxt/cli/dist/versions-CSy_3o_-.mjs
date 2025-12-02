import { coerce } from "semver";
import { readPackageJSON } from "pkg-types";

//#region ../nuxi/src/utils/versions.ts
async function getNuxtVersion(cwd, cache = true) {
	const nuxtPkg = await readPackageJSON("nuxt", {
		url: cwd,
		try: true,
		cache
	});
	if (nuxtPkg) return nuxtPkg.version;
	const pkg = await readPackageJSON(cwd);
	const pkgDep = pkg?.dependencies?.nuxt || pkg?.devDependencies?.nuxt;
	return pkgDep && coerce(pkgDep)?.version || "3.0.0";
}

//#endregion
export { getNuxtVersion as t };
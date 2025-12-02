import { t as logger } from "./logger-Dk0gkCkX.mjs";
import { n as tryResolveNuxt } from "./kit-f7zsnm10.mjs";
import { readFileSync } from "node:fs";
import { resolveModulePath } from "exsolve";
import { colors } from "consola/utils";

//#region ../nuxi/src/utils/banner.ts
function showVersionsFromConfig(cwd, config) {
	const { bold, gray, green } = colors;
	function getBuilder() {
		switch (config.builder) {
			case "@nuxt/rspack-builder": return {
				name: "Rspack",
				version: getPkgVersion("@rspack/core")
			};
			case "@nuxt/webpack-builder": return {
				name: "Webpack",
				version: getPkgVersion("webpack")
			};
			case "@nuxt/vite-builder":
			default: {
				const pkgJSON = getPkgJSON("vite");
				return {
					name: pkgJSON.name.includes("rolldown") ? "Rolldown-Vite" : "Vite",
					version: pkgJSON.version
				};
			}
		}
	}
	function getPkgJSON(pkg) {
		for (const url of [cwd, tryResolveNuxt(cwd)]) {
			if (!url) continue;
			const p = resolveModulePath(`${pkg}/package.json`, {
				from: url,
				try: true
			});
			if (p) return JSON.parse(readFileSync(p, "utf-8"));
		}
		return null;
	}
	function getPkgVersion(pkg) {
		return getPkgJSON(pkg)?.version ?? "";
	}
	const nuxtVersion = getPkgVersion("nuxt") || getPkgVersion("nuxt-nightly") || getPkgVersion("nuxt3") || getPkgVersion("nuxt-edge");
	const nitroVersion = getPkgVersion("nitropack") || getPkgVersion("nitro") || getPkgVersion("nitropack-nightly") || getPkgVersion("nitropack-edge");
	const builder = getBuilder();
	const vueVersion = getPkgVersion("vue") || null;
	logger.log(green(`Nuxt ${bold(nuxtVersion)}`) + gray(" (with ") + (nitroVersion ? gray(`Nitro ${bold(nitroVersion)}`) : "") + gray(`, ${builder.name} ${bold(builder.version)}`) + (vueVersion ? gray(` and Vue ${bold(vueVersion)}`) : "") + gray(")"));
}
async function showVersions(cwd, kit) {
	return showVersionsFromConfig(cwd, await kit.loadNuxtConfig({ cwd }));
}

//#endregion
export { showVersionsFromConfig as n, showVersions as t };
import { a as legacyRootDirArgs, t as cwdArgs } from "./_shared-C3vB2YLc.mjs";
import { t as logger } from "./logger-Dk0gkCkX.mjs";
import { n as tryResolveNuxt } from "./kit-f7zsnm10.mjs";
import { t as getPackageManagerVersion } from "./packageManagers-DbVB5cXf.mjs";
import process from "node:process";
import { defineCommand } from "citty";
import { isMinimal } from "std-env";
import { resolve } from "pathe";
import { splitByCase } from "scule";
import os from "node:os";
import { copy } from "copy-paste";
import { detectPackageManager } from "nypm";
import { readPackageJSON } from "pkg-types";

//#region ../nuxi/package.json
var version = "3.30.0";

//#endregion
//#region ../nuxi/src/commands/info.ts
var info_default = defineCommand({
	meta: {
		name: "info",
		description: "Get information about Nuxt project"
	},
	args: {
		...cwdArgs,
		...legacyRootDirArgs
	},
	async run(ctx) {
		const cwd = resolve(ctx.args.cwd || ctx.args.rootDir);
		const nuxtConfig = await getNuxtConfig(cwd);
		const { dependencies = {}, devDependencies = {} } = await readPackageJSON(cwd).catch(() => ({}));
		const nuxtPath = tryResolveNuxt(cwd);
		async function getDepVersion(name) {
			for (const url of [cwd, nuxtPath]) {
				if (!url) continue;
				const pkg = await readPackageJSON(name, { url }).catch(() => null);
				if (pkg) return pkg.version;
			}
			return dependencies[name] || devDependencies[name];
		}
		async function listModules(arr = []) {
			const info = [];
			for (let m of arr) {
				if (Array.isArray(m)) m = m[0];
				const name = normalizeConfigModule(m, cwd);
				if (name) {
					const v = await getDepVersion(name.split("/").splice(0, 2).join("/"));
					info.push(`\`${v ? `${name}@${v}` : name}\``);
				}
			}
			return info.join(", ");
		}
		const nuxtVersion = await getDepVersion("nuxt") || await getDepVersion("nuxt-nightly") || await getDepVersion("nuxt-edge") || await getDepVersion("nuxt3") || "-";
		const isLegacy = nuxtVersion.startsWith("2");
		const builder = !isLegacy ? nuxtConfig.builder || "-" : nuxtConfig.bridge?.vite ? "vite" : nuxtConfig.buildModules?.includes("nuxt-vite") ? "vite" : "webpack";
		let packageManager = (await detectPackageManager(cwd))?.name;
		if (packageManager) packageManager += `@${getPackageManagerVersion(packageManager)}`;
		const infoObj = {
			OperatingSystem: os.type(),
			NodeVersion: process.version,
			NuxtVersion: nuxtVersion,
			CLIVersion: version,
			NitroVersion: await getDepVersion("nitropack"),
			PackageManager: packageManager ?? "unknown",
			Builder: typeof builder === "string" ? builder : "custom",
			UserConfig: Object.keys(nuxtConfig).map((key) => `\`${key}\``).join(", "),
			RuntimeModules: await listModules(nuxtConfig.modules),
			BuildModules: await listModules(nuxtConfig.buildModules || [])
		};
		logger.log("Working directory:", cwd);
		let maxLength = 0;
		const entries = Object.entries(infoObj).map(([key, val]) => {
			const label = splitByCase(key).join(" ");
			if (label.length > maxLength) maxLength = label.length;
			return [label, val || "-"];
		});
		let infoStr = "";
		for (const [label, value] of entries) infoStr += `- ${`${label}: `.padEnd(maxLength + 2)}${value.includes("`") ? value : `\`${value}\``}\n`;
		const copied = !isMinimal && await new Promise((resolve$1) => copy(infoStr, (err) => resolve$1(!err)));
		const isNuxt3 = !isLegacy;
		const isBridge = !isNuxt3 && infoObj.BuildModules.includes("bridge");
		const repo = isBridge ? "nuxt/bridge" : "nuxt/nuxt";
		const log = [
			(isNuxt3 || isBridge) && `👉 Report an issue: https://github.com/${repo}/issues/new?template=bug-report.yml`,
			(isNuxt3 || isBridge) && `👉 Suggest an improvement: https://github.com/${repo}/discussions/new`,
			`👉 Read documentation: ${isNuxt3 || isBridge ? "https://nuxt.com" : "https://v2.nuxt.com"}`
		].filter(Boolean).join("\n");
		const splitter = "------------------------------";
		logger.log(`Nuxt project info: ${copied ? "(copied to clipboard)" : ""}\n\n${splitter}\n${infoStr}${splitter}\n\n${log}\n`);
	}
});
function normalizeConfigModule(module, rootDir) {
	if (!module) return null;
	if (typeof module === "string") return module.split(rootDir).pop().split("node_modules").pop().replace(/^\//, "");
	if (typeof module === "function") return `${module.name}()`;
	if (Array.isArray(module)) return normalizeConfigModule(module[0], rootDir);
	return null;
}
async function getNuxtConfig(rootDir) {
	try {
		const { createJiti } = await import("jiti");
		const jiti = createJiti(rootDir, {
			interopDefault: true,
			alias: {
				"~": rootDir,
				"@": rootDir
			}
		});
		globalThis.defineNuxtConfig = (c) => c;
		const result = await jiti.import("./nuxt.config", { default: true });
		delete globalThis.defineNuxtConfig;
		return result;
	} catch {
		return {};
	}
}

//#endregion
export { info_default as default };
import { a as legacyRootDirArgs, t as cwdArgs } from "./_shared-C3vB2YLc.mjs";
import "./logger-Dk0gkCkX.mjs";
import { t as loadKit } from "./kit-f7zsnm10.mjs";
import "./fs--ofMleGo.mjs";
import { t as cleanupNuxtDirs } from "./nuxt-CfBR40hD.mjs";
import { defineCommand } from "citty";
import { resolve } from "pathe";

//#region ../nuxi/src/commands/cleanup.ts
var cleanup_default = defineCommand({
	meta: {
		name: "cleanup",
		description: "Clean up generated Nuxt files and caches"
	},
	args: {
		...cwdArgs,
		...legacyRootDirArgs
	},
	async run(ctx) {
		const cwd = resolve(ctx.args.cwd || ctx.args.rootDir);
		const { loadNuxtConfig } = await loadKit(cwd);
		const nuxtOptions = await loadNuxtConfig({
			cwd,
			overrides: { dev: true }
		});
		await cleanupNuxtDirs(nuxtOptions.rootDir, nuxtOptions.buildDir);
	}
});

//#endregion
export { cleanup_default as default };
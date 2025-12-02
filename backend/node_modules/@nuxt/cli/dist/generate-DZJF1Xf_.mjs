import { a as legacyRootDirArgs, i as extendsArgs, n as dotEnvArgs, o as logLevelArgs, r as envNameArgs, t as cwdArgs } from "./_shared-C3vB2YLc.mjs";
import "./logger-Dk0gkCkX.mjs";
import "./kit-f7zsnm10.mjs";
import "./banner-CWBLwDiB.mjs";
import "./fs--ofMleGo.mjs";
import "./env-CamzysGq.mjs";
import { t as build_default } from "./build-CVr-ruAe.mjs";
import { defineCommand } from "citty";

//#region ../nuxi/src/commands/generate.ts
var generate_default = defineCommand({
	meta: {
		name: "generate",
		description: "Build Nuxt and prerender all routes"
	},
	args: {
		...cwdArgs,
		...logLevelArgs,
		preset: {
			type: "string",
			description: "Nitro server preset"
		},
		...dotEnvArgs,
		...envNameArgs,
		...extendsArgs,
		...legacyRootDirArgs
	},
	async run(ctx) {
		ctx.args.prerender = true;
		await build_default.run(ctx);
	}
});

//#endregion
export { generate_default as default };
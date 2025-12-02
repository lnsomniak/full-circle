import { a as legacyRootDirArgs, i as extendsArgs, n as dotEnvArgs, o as logLevelArgs, r as envNameArgs, t as cwdArgs } from "./_shared-C3vB2YLc.mjs";
import { t as logger } from "./logger-Dk0gkCkX.mjs";
import { t as loadKit } from "./kit-f7zsnm10.mjs";
import { dirname, relative } from "node:path";
import process from "node:process";
import { defineCommand } from "citty";
import { existsSync, promises } from "node:fs";
import { resolve as resolve$1 } from "pathe";
import { box, colors } from "consola/utils";
import { x } from "tinyexec";
import { setupDotenv } from "c12";

//#region ../nuxi/src/commands/preview.ts
const command = defineCommand({
	meta: {
		name: "preview",
		description: "Launches Nitro server for local testing after `nuxi build`."
	},
	args: {
		...cwdArgs,
		...logLevelArgs,
		...envNameArgs,
		...extendsArgs,
		...legacyRootDirArgs,
		port: {
			type: "string",
			description: "Port to listen on",
			alias: ["p"]
		},
		...dotEnvArgs
	},
	async run(ctx) {
		process.env.NODE_ENV = process.env.NODE_ENV || "production";
		const cwd = resolve$1(ctx.args.cwd || ctx.args.rootDir);
		const { loadNuxt } = await loadKit(cwd);
		const nitroJSONPaths = [await new Promise((res) => {
			loadNuxt({
				cwd,
				envName: ctx.args.envName,
				ready: true,
				overrides: {
					...ctx.args.extends && { extends: ctx.args.extends },
					modules: [function(_, nuxt) {
						nuxt.hook("nitro:init", (nitro) => {
							res(resolve$1(nuxt.options.srcDir || cwd, nitro.options.output.dir || ".output", "nitro.json"));
						});
					}]
				}
			}).then((nuxt) => nuxt.close()).catch(() => "");
		}), resolve$1(cwd, ".output", "nitro.json")].filter(Boolean);
		const nitroJSONPath = nitroJSONPaths.find((p) => existsSync(p));
		if (!nitroJSONPath) {
			logger.error("Cannot find `nitro.json`. Did you run `nuxi build` first? Search path:\n", nitroJSONPaths);
			process.exit(1);
		}
		const outputPath = dirname(nitroJSONPath);
		const nitroJSON = JSON.parse(await promises.readFile(nitroJSONPath, "utf-8"));
		if (!nitroJSON.commands.preview) {
			logger.error("Preview is not supported for this build.");
			process.exit(1);
		}
		const info = [
			["Node.js:", `v${process.versions.node}`],
			["Nitro Preset:", nitroJSON.preset],
			["Working directory:", relative(process.cwd(), outputPath)]
		];
		const _infoKeyLen = Math.max(...info.map(([label]) => label.length));
		logger.log(box([
			"You are running Nuxt production build in preview mode.",
			`For production deployments, please directly use ${colors.cyan(nitroJSON.commands.preview)} command.`,
			"",
			...info.map(([label, value]) => `${label.padEnd(_infoKeyLen, " ")} ${colors.cyan(value)}`)
		].join("\n"), {
			title: colors.yellow("Preview Mode"),
			style: { borderColor: "yellow" }
		}));
		const envFileName = ctx.args.dotenv || ".env";
		if (existsSync(resolve$1(cwd, envFileName))) {
			logger.info(`Loading \`${envFileName}\`. This will not be loaded when running the server in production.`);
			await setupDotenv({
				cwd,
				fileName: envFileName
			});
		} else if (ctx.args.dotenv) logger.error(`Cannot find \`${envFileName}\`.`);
		const port = ctx.args.port ?? process.env.NUXT_PORT ?? process.env.NITRO_PORT ?? process.env.PORT;
		logger.info(`Starting preview command: \`${nitroJSON.commands.preview}\``);
		const [command$1, ...commandArgs] = nitroJSON.commands.preview.split(" ");
		logger.log("");
		await x(command$1, commandArgs, {
			throwOnError: true,
			nodeOptions: {
				stdio: "inherit",
				cwd: outputPath,
				env: {
					...process.env,
					NUXT_PORT: port,
					NITRO_PORT: port
				}
			}
		});
	}
});
var preview_default = command;

//#endregion
export { preview_default as default };
import { t as cwdArgs } from "./_shared-C3vB2YLc.mjs";
import { t as logger } from "./logger-Dk0gkCkX.mjs";
import { resolve } from "node:path";
import process from "node:process";
import { defineCommand, runCommand as runCommand$1, runMain as runMain$1 } from "citty";
import { provider } from "std-env";
import { consola } from "consola";
import { fileURLToPath } from "node:url";

//#region ../nuxi/src/commands/index.ts
const _rDefault = (r) => r.default || r;
const commands = {
	add: () => import("./add-CHVmfYrF.mjs").then(_rDefault),
	analyze: () => import("./analyze-Ji0eD4TL.mjs").then(_rDefault),
	build: () => import("./build-BEXmJONc.mjs").then(_rDefault),
	cleanup: () => import("./cleanup-X4v95Xqm.mjs").then(_rDefault),
	_dev: () => import("./dev-child-Dcs4VQnN.mjs").then(_rDefault),
	dev: () => import("./dev-nr2jb3A5.mjs").then(_rDefault),
	devtools: () => import("./devtools-BLGzUSNU.mjs").then(_rDefault),
	generate: () => import("./generate-DZJF1Xf_.mjs").then(_rDefault),
	info: () => import("./info-CfkhuU_d.mjs").then(_rDefault),
	init: () => import("./init-BQkH4r8t.mjs").then(_rDefault),
	module: () => import("./module-DLtKXRxA.mjs").then(_rDefault),
	prepare: () => import("./prepare-ZByeo9vQ.mjs").then(_rDefault),
	preview: () => import("./preview-CgpLKg-X.mjs").then(_rDefault),
	start: () => import("./preview-CgpLKg-X.mjs").then(_rDefault),
	test: () => import("./test-CBt1emEB.mjs").then(_rDefault),
	typecheck: () => import("./typecheck-egvrxpjV.mjs").then(_rDefault),
	upgrade: () => import("./upgrade-knZur6qb.mjs").then(_rDefault)
};

//#endregion
//#region ../nuxi/src/utils/console.ts
function wrapReporter(reporter) {
	return { log(logObj, ctx) {
		if (!logObj.args || !logObj.args.length) return;
		const msg = logObj.args[0];
		if (typeof msg === "string" && !process.env.DEBUG) {
			if (msg.startsWith("[Vue Router warn]: No match found for location with path")) return;
			if (msg.includes("ExperimentalWarning: The Fetch API is an experimental feature")) return;
			if (msg.startsWith("Sourcemap") && msg.includes("node_modules")) return;
		}
		return reporter.log(logObj, ctx);
	} };
}
function setupGlobalConsole(opts = {}) {
	consola.options.reporters = consola.options.reporters.map(wrapReporter);
	if (opts.dev) consola.wrapAll();
	else consola.wrapConsole();
	process.on("unhandledRejection", (err) => consola.error("[unhandledRejection]", err));
	process.on("uncaughtException", (err) => consola.error("[uncaughtException]", err));
}

//#endregion
//#region ../nuxi/src/utils/engines.ts
async function checkEngines() {
	const satisfies = await import("semver/functions/satisfies.js").then((r) => r.default || r);
	const currentNode = process.versions.node;
	const nodeRange = ">= 18.0.0";
	if (!satisfies(currentNode, nodeRange)) logger.warn(`Current version of Node.js (\`${currentNode}\`) is unsupported and might cause issues.\n       Please upgrade to a compatible version \`${nodeRange}\`.`);
}

//#endregion
//#region package.json
var name = "@nuxt/cli";
var version = "3.30.0";
var description = "Nuxt CLI";

//#endregion
//#region src/main.ts
const _main = defineCommand({
	meta: {
		name: name.endsWith("nightly") ? name : "nuxi",
		version,
		description
	},
	args: {
		...cwdArgs,
		command: {
			type: "positional",
			required: false
		}
	},
	subCommands: commands,
	async setup(ctx) {
		const command = ctx.args._[0];
		setupGlobalConsole({ dev: command === "dev" });
		let backgroundTasks;
		if (command !== "_dev" && provider !== "stackblitz") backgroundTasks = Promise.all([checkEngines()]).catch((err) => logger.error(err));
		if (command === "init") await backgroundTasks;
		if (ctx.args.command && !(ctx.args.command in commands)) {
			const cwd = resolve(ctx.args.cwd);
			try {
				const { x } = await import("tinyexec");
				await x(`nuxt-${ctx.args.command}`, ctx.rawArgs.slice(1), {
					nodeOptions: {
						stdio: "inherit",
						cwd
					},
					throwOnError: true
				});
			} catch (err) {
				if (err instanceof Error && "code" in err && err.code === "ENOENT") return;
			}
			process.exit();
		}
	}
});
const main = _main;

//#endregion
//#region src/run.ts
globalThis.__nuxt_cli__ = globalThis.__nuxt_cli__ || {
	startTime: Date.now(),
	entry: fileURLToPath(new URL("../../bin/nuxi.mjs", import.meta.url)),
	devEntry: fileURLToPath(new URL("../dev/index.mjs", import.meta.url))
};
const runMain = () => runMain$1(main);
async function runCommand(name$1, argv = process.argv.slice(2), data = {}) {
	argv.push("--no-clear");
	if (!(name$1 in commands)) throw new Error(`Invalid command ${name$1}`);
	return await runCommand$1(await commands[name$1](), {
		rawArgs: argv,
		data: { overrides: data.overrides || {} }
	});
}

//#endregion
export { main, runCommand, runMain };
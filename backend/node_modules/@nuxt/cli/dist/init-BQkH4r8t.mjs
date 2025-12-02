import { o as logLevelArgs, t as cwdArgs } from "./_shared-C3vB2YLc.mjs";
import { t as logger } from "./logger-Dk0gkCkX.mjs";
import "./kit-f7zsnm10.mjs";
import "./fs--ofMleGo.mjs";
import { n as runCommand$1, t as add_default } from "./add-kZRi0oTW.mjs";
import "./versions-CSy_3o_-.mjs";
import "./prepare-DjR-jyiQ.mjs";
import "./_utils-DTrPahho.mjs";
import process from "node:process";
import { defineCommand } from "citty";
import { hasTTY } from "std-env";
import { existsSync } from "node:fs";
import { basename, join, relative, resolve } from "pathe";
import { colors } from "consola/utils";
import { x } from "tinyexec";
import { installDependencies } from "nypm";
import { findFile, readPackageJSON, writePackageJSON } from "pkg-types";
import { downloadTemplate, startShell } from "giget";
import { $fetch } from "ofetch";

//#region ../nuxi/src/utils/ascii.ts
/**
* Thank you to IndyJoenz for this ASCII art
* https://bsky.app/profile/durdraw.org/post/3liadod3gv22a
*/
const themeColor = "\x1B[38;2;0;220;130m";
const icon = [
	`        .d$b.`,
	`       i$$A$$L  .d$b`,
	`     .$$F\` \`$$L.$$A$$.`,
	`    j$$'    \`4$$:\` \`$$.`,
	`   j$$'     .4$:    \`$$.`,
	`  j$$\`     .$$:      \`4$L`,
	` :$$:____.d$$:  _____.:$$:`,
	` \`4$$$$$$$$P\` .i$$$$$$$$P\``
];
const nuxtIcon = icon.map((line) => line.split("").join(themeColor)).join("\n");

//#endregion
//#region ../nuxi/src/commands/init.ts
const DEFAULT_REGISTRY = "https://raw.githubusercontent.com/nuxt/starter/templates/templates";
const DEFAULT_TEMPLATE_NAME = "v4";
const packageManagerOptions = Object.keys({
	npm: void 0,
	pnpm: void 0,
	yarn: void 0,
	bun: void 0,
	deno: void 0
});
async function getModuleDependencies(moduleName) {
	try {
		const dependencies = (await $fetch(`https://registry.npmjs.org/${moduleName}/latest`)).dependencies || {};
		return Object.keys(dependencies);
	} catch (err) {
		logger.warn(`Could not get dependencies for ${moduleName}: ${err}`);
		return [];
	}
}
function filterModules(modules, allDependencies) {
	const result = {
		toInstall: [],
		skipped: []
	};
	for (const module of modules) if (modules.some((otherModule) => {
		if (otherModule === module) return false;
		return (allDependencies[otherModule] || []).includes(module);
	})) result.skipped.push(module);
	else result.toInstall.push(module);
	return result;
}
async function getTemplateDependencies(templateDir) {
	try {
		const packageJsonPath = join(templateDir, "package.json");
		if (!existsSync(packageJsonPath)) return [];
		const packageJson = await readPackageJSON(packageJsonPath);
		const directDeps = {
			...packageJson.dependencies,
			...packageJson.devDependencies
		};
		const directDepNames = Object.keys(directDeps);
		const allDeps = new Set(directDepNames);
		(await Promise.all(directDepNames.map((dep) => getModuleDependencies(dep)))).forEach((deps) => {
			deps.forEach((dep) => allDeps.add(dep));
		});
		return Array.from(allDeps);
	} catch (err) {
		logger.warn(`Could not read template dependencies: ${err}`);
		return [];
	}
}
var init_default = defineCommand({
	meta: {
		name: "init",
		description: "Initialize a fresh project"
	},
	args: {
		...cwdArgs,
		...logLevelArgs,
		dir: {
			type: "positional",
			description: "Project directory",
			default: ""
		},
		template: {
			type: "string",
			alias: "t",
			description: "Template name"
		},
		force: {
			type: "boolean",
			alias: "f",
			description: "Override existing directory"
		},
		offline: {
			type: "boolean",
			description: "Force offline mode"
		},
		preferOffline: {
			type: "boolean",
			description: "Prefer offline mode"
		},
		install: {
			type: "boolean",
			default: true,
			description: "Skip installing dependencies"
		},
		gitInit: {
			type: "boolean",
			description: "Initialize git repository"
		},
		shell: {
			type: "boolean",
			description: "Start shell after installation in project directory"
		},
		packageManager: {
			type: "string",
			description: "Package manager choice (npm, pnpm, yarn, bun)"
		},
		modules: {
			type: "string",
			required: false,
			description: "Nuxt modules to install (comma separated without spaces)",
			negativeDescription: "Skip module installation prompt",
			alias: "M"
		},
		nightly: {
			type: "string",
			description: "Use Nuxt nightly release channel (3x or latest)"
		}
	},
	async run(ctx) {
		if (hasTTY) process.stdout.write(`\n${nuxtIcon}\n\n`);
		logger.info(colors.bold(`Welcome to Nuxt!`.split("").map((m) => `${themeColor}${m}`).join("")));
		if (ctx.args.dir === "") ctx.args.dir = await logger.prompt("Where would you like to create your project?", {
			placeholder: "./nuxt-app",
			type: "text",
			default: "nuxt-app",
			cancel: "reject"
		}).catch(() => process.exit(1));
		const cwd = resolve(ctx.args.cwd);
		let templateDownloadPath = resolve(cwd, ctx.args.dir);
		logger.info(`Creating a new project in ${colors.cyan(relative(cwd, templateDownloadPath) || templateDownloadPath)}.`);
		const templateName = ctx.args.template || DEFAULT_TEMPLATE_NAME;
		if (typeof templateName !== "string") {
			logger.error("Please specify a template!");
			process.exit(1);
		}
		let shouldForce = Boolean(ctx.args.force);
		if (!shouldForce && existsSync(templateDownloadPath)) switch (await logger.prompt(`The directory ${colors.cyan(templateDownloadPath)} already exists. What would you like to do?`, {
			type: "select",
			options: [
				"Override its contents",
				"Select different directory",
				"Abort"
			]
		})) {
			case "Override its contents":
				shouldForce = true;
				break;
			case "Select different directory":
				templateDownloadPath = resolve(cwd, await logger.prompt("Please specify a different directory:", {
					type: "text",
					cancel: "reject"
				}).catch(() => process.exit(1)));
				break;
			default: process.exit(1);
		}
		let template;
		try {
			template = await downloadTemplate(templateName, {
				dir: templateDownloadPath,
				force: shouldForce,
				offline: Boolean(ctx.args.offline),
				preferOffline: Boolean(ctx.args.preferOffline),
				registry: process.env.NUXI_INIT_REGISTRY || DEFAULT_REGISTRY
			});
			if (ctx.args.dir.length > 0) {
				const path = await findFile("package.json", {
					startingFrom: join(templateDownloadPath, "package.json"),
					reverse: true
				});
				if (path) {
					const pkg = await readPackageJSON(path, { try: true });
					if (pkg && pkg.name) {
						const slug = basename(templateDownloadPath).replace(/[^\w-]/g, "-").replace(/-{2,}/g, "-").replace(/^-|-$/g, "");
						if (slug) {
							pkg.name = slug;
							await writePackageJSON(path, pkg);
						}
					}
				}
			}
		} catch (err) {
			if (process.env.DEBUG) throw err;
			logger.error(err.toString());
			process.exit(1);
		}
		if (ctx.args.nightly !== void 0 && !ctx.args.offline && !ctx.args.preferOffline) {
			const response = await $fetch("https://registry.npmjs.org/nuxt-nightly");
			const nightlyChannelTag = ctx.args.nightly || "latest";
			if (!nightlyChannelTag) {
				logger.error(`Error getting nightly channel tag.`);
				process.exit(1);
			}
			const nightlyChannelVersion = response["dist-tags"][nightlyChannelTag];
			if (!nightlyChannelVersion) {
				logger.error(`Nightly channel version for tag '${nightlyChannelTag}' not found.`);
				process.exit(1);
			}
			const nightlyNuxtPackageJsonVersion = `npm:nuxt-nightly@${nightlyChannelVersion}`;
			const packageJsonPath = resolve(cwd, ctx.args.dir);
			const packageJson = await readPackageJSON(packageJsonPath);
			if (packageJson.dependencies && "nuxt" in packageJson.dependencies) packageJson.dependencies.nuxt = nightlyNuxtPackageJsonVersion;
			else if (packageJson.devDependencies && "nuxt" in packageJson.devDependencies) packageJson.devDependencies.nuxt = nightlyNuxtPackageJsonVersion;
			await writePackageJSON(join(packageJsonPath, "package.json"), packageJson);
		}
		function detectCurrentPackageManager() {
			const userAgent = process.env.npm_config_user_agent;
			if (!userAgent) return;
			const [name] = userAgent.split("/");
			if (packageManagerOptions.includes(name)) return name;
		}
		const currentPackageManager = detectCurrentPackageManager();
		const packageManagerArg = ctx.args.packageManager;
		const packageManagerSelectOptions = packageManagerOptions.map((pm) => ({
			label: pm,
			value: pm,
			hint: currentPackageManager === pm ? "current" : void 0
		}));
		const selectedPackageManager = packageManagerOptions.includes(packageManagerArg) ? packageManagerArg : await logger.prompt("Which package manager would you like to use?", {
			type: "select",
			options: packageManagerSelectOptions,
			initial: currentPackageManager,
			cancel: "reject"
		}).catch(() => process.exit(1));
		if (ctx.args.install === false) logger.info("Skipping install dependencies step.");
		else {
			logger.start("Installing dependencies...");
			try {
				await installDependencies({
					cwd: template.dir,
					packageManager: {
						name: selectedPackageManager,
						command: selectedPackageManager
					}
				});
			} catch (err) {
				if (process.env.DEBUG) throw err;
				logger.error(err.toString());
				process.exit(1);
			}
			logger.success("Installation completed.");
		}
		if (ctx.args.gitInit === void 0) ctx.args.gitInit = await logger.prompt("Initialize git repository?", {
			type: "confirm",
			cancel: "reject"
		}).catch(() => process.exit(1));
		if (ctx.args.gitInit) {
			logger.info("Initializing git repository...\n");
			try {
				await x("git", ["init", template.dir], {
					throwOnError: true,
					nodeOptions: { stdio: "inherit" }
				});
			} catch (err) {
				logger.warn(`Failed to initialize git repository: ${err}`);
			}
		}
		const modulesToAdd = [];
		if (ctx.args.modules !== void 0) modulesToAdd.push(...(ctx.args.modules || "").split(",").map((module) => module.trim()).filter(Boolean));
		else if (!ctx.args.offline && !ctx.args.preferOffline) {
			const modulesPromise = $fetch("https://api.nuxt.com/modules");
			if (await logger.prompt(`Would you like to install any of the official modules?`, {
				initial: false,
				type: "confirm",
				cancel: "reject"
			}).catch(() => process.exit(1))) {
				const [response, templateDeps] = await Promise.all([modulesPromise, getTemplateDependencies(template.dir)]);
				const officialModules = response.modules.filter((module) => module.type === "official" && module.npm !== "@nuxt/devtools").filter((module) => !templateDeps.includes(module.npm));
				if (officialModules.length === 0) logger.info("All official modules are already included in this template.");
				else {
					const selectedOfficialModules = await logger.prompt("Pick the modules to install:", {
						type: "multiselect",
						options: officialModules.map((module) => ({
							label: `${colors.bold(colors.greenBright(module.npm))} – ${module.description.replace(/\.$/, "")}`,
							value: module.npm
						})),
						required: false
					});
					if (selectedOfficialModules === void 0) process.exit(1);
					if (selectedOfficialModules.length > 0) {
						const modules = selectedOfficialModules;
						const { toInstall, skipped } = filterModules(modules, Object.fromEntries(await Promise.all(modules.map(async (module) => [module, await getModuleDependencies(module)]))));
						if (skipped.length) logger.info(`The following modules are already included as dependencies of another module and will not be installed: ${skipped.map((m) => colors.cyan(m)).join(", ")}`);
						modulesToAdd.push(...toInstall);
					}
				}
			}
		}
		if (modulesToAdd.length > 0) await runCommand$1(add_default, [
			...modulesToAdd,
			`--cwd=${templateDownloadPath}`,
			ctx.args.install ? "" : "--skipInstall",
			ctx.args.logLevel ? `--logLevel=${ctx.args.logLevel}` : ""
		].filter(Boolean));
		logger.log(`\n✨ Nuxt project has been created with the \`${template.name}\` template. Next steps:`);
		const relativeTemplateDir = relative(process.cwd(), template.dir) || ".";
		const runCmd = selectedPackageManager === "deno" ? "task" : "run";
		const nextSteps = [!ctx.args.shell && relativeTemplateDir.length > 1 && `\`cd ${relativeTemplateDir}\``, `Start development server with \`${selectedPackageManager} ${runCmd} dev\``].filter(Boolean);
		for (const step of nextSteps) logger.log(` › ${step}`);
		if (ctx.args.shell) startShell(template.dir);
	}
});

//#endregion
export { init_default as default };
import { t as logger } from "./logger-Dk0gkCkX.mjs";
import process from "node:process";

//#region ../nuxi/src/utils/env.ts
function overrideEnv(targetEnv) {
	const currentEnv = process.env.NODE_ENV;
	if (currentEnv && currentEnv !== targetEnv) logger.warn(`Changing \`NODE_ENV\` from \`${currentEnv}\` to \`${targetEnv}\`, to avoid unintended behavior.`);
	process.env.NODE_ENV = targetEnv;
}

//#endregion
export { overrideEnv as t };
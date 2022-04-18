import graphqlLoaderPlugin from "@luckycatfactory/esbuild-graphql-loader";
import cpy, { Options } from "cpy";
import { build, BuildOptions } from "esbuild";
import * as path from "path";
import { commonEsbuildOptions, processArgs } from "../util/src/esbuildCommon";
import { nativeNodeModulesPlugin } from "../util/src/nativeNodeModulesPlugin";

const outputDir = path.resolve(__dirname, "dist");

interface CopyStuff {
	from: string;
	to: string;
	options?: Options;
}

const postBuildCopy: CopyStuff[] = [
	{
		from: "node_modules/opn/**/xdg-open",
		to: outputDir
	},
	{
		from: `${outputDir}/agent.*`,
		// TODO: Use environment variable if exists
		to: path.resolve(__dirname, "../../vscode/dist/")
	},
	{
		from: `${outputDir}/agent.*`,
		// TODO: Use environment variable if exists
		to: path.resolve(__dirname, "../../atom/dist/")
	},
	{
		from: `${outputDir}/agent-pkg.js`,
		// TODO: Use environment variable if exists
		to: path.resolve(__dirname, "../../vs/src/CodeStream.VisualStudio/dist"),
		options: { rename: "agent.js" }
	},
	{
		from: `${outputDir}/agent-pkg.js.map`,
		// TODO: Use environment variable if exists
		to: path.resolve(__dirname, "../../vs/src/CodeStream.VisualStudio/dist"),
		options: { rename: "agent-pkg.js.map" }
	},
	{
		from: `${outputDir}/agent-pkg.js`,
		// TODO: Use environment variable if exists
		to: path.resolve(__dirname, "../../jb/src/main/resources/agent")
	},
	{
		from: `${outputDir}/agent-pkg.js.map`,
		// TODO: Use environment variable if exists
		to: path.resolve(__dirname, "../../jb/src/main/resources/agent")
	}
];

(async function() {
	const start = Date.now();
	const args = processArgs();
	const buildOption: BuildOptions = {
		...commonEsbuildOptions(false, args),
		entryPoints: {
			agent: "./src/main.ts",
			"agent-pkg": "./src/main-vs.ts"
		},
		external: ["vm2"],
		plugins: [graphqlLoaderPlugin(), nativeNodeModulesPlugin],
		format: "iife",
		platform: "node",
		target: "node16",
		outdir: outputDir
	};

	await build(buildOption);

	for (const entry of postBuildCopy) {
		await cpy(entry.from, entry.to, entry.options);
	}
	const elapsed = Date.now() - start;
	console.info(`Build complete in ${elapsed}ms`);
})();

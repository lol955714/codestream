import graphqlLoaderPlugin from "@luckycatfactory/esbuild-graphql-loader";
import cpy from "cpy";
import { build, OnLoadArgs, OnResolveArgs, PluginBuild } from "esbuild";
import * as path from "path";
// import alias from "esbuild-plugin-alias";

const outputDir = path.resolve(__dirname, "dist");

const watchEnabled = process.argv.findIndex(arg => arg === "--watch") !== -1;

if (watchEnabled) {
	console.log("watch mode");
}

const nativeNodeModulesPlugin = {
	name: "native-node-modules",
	setup(build: PluginBuild) {
		// If a ".node" file is imported within a module in the "file" namespace, resolve
		// it to an absolute path and put it into the "node-file" virtual namespace.
		build.onResolve({ filter: /\.node$/, namespace: "file" }, (args: OnResolveArgs) => ({
			path: require.resolve(args.path, { paths: [args.resolveDir] }),
			namespace: "node-file"
		}));

		// Files in the "node-file" virtual namespace call "require()" on the
		// path from esbuild of the ".node" file in the output directory.
		build.onLoad({ filter: /.*/, namespace: "node-file" }, (args: OnLoadArgs) => ({
			contents: `
        import path from ${JSON.stringify(args.path)}
        try { module.exports = require(path) }
        catch {}
      `
		}));

		// If a ".node" file is imported within a module in the "node-file" namespace, put
		// it in the "file" namespace where esbuild's default loading behavior will handle
		// it. It is already an absolute path since we resolved it to one above.
		build.onResolve({ filter: /\.node$/, namespace: "node-file" }, (args: OnResolveArgs) => ({
			path: args.path,
			namespace: "file"
		}));

		// Tell esbuild's default loading behavior to use the "file" loader for
		// these ".node" files.
		let opts = build.initialOptions;
		opts.loader = opts.loader || {};
		opts.loader[".node"] = "file";
	}
};

interface CopyStuff {
	from: string;
	to: string;
	options?: cpy.Options;
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
	await build({
		watch: watchEnabled
			? {
					onRebuild(error, result) {
						console.log(`${new Date().toISOString()} watch build succeeded`);
					}
			  }
			: false,
		entryPoints: {
			agent: "./src/main.ts",
			"agent-pkg": "./src/main-vs.ts"
		},
		external: ["vm2"],
		plugins: [graphqlLoaderPlugin(), nativeNodeModulesPlugin],
		bundle: true,
		outdir: outputDir,
		sourcemap: "external",
		minify: false,
		// minifyIdentifiers: false,
		// minifySyntax: false,
		// keepNames: true,
		format: "iife",
		platform: "node",
		target: "node16"
		// loader: {
		// 	".js": "jsx"
		// }
	});
	for (const entry of postBuildCopy) {
		await cpy(entry.from, entry.to, entry.options);
	}
	console.info("build complete");
	// process.exit(0);
})();

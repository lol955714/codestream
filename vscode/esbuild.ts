import { build, BuildOptions } from "esbuild";
import * as fs from "fs";
import * as path from "path";
import cpy from "cpy";
import { commonEsbuildOptions, processArgs, CopyStuff } from "../shared/util/src/esbuildCommon";
import { createSymlinks } from "../shared/util/src/symlinks";
import { Args } from "../shared/util/src/esbuildCommon";
import { statsPlugin } from "../shared/util/src/statsPlugin";
 
async function webBuild(args: Args) {
	const context = path.resolve(__dirname, "src/webviews/app");
	const target = path.resolve(__dirname, "dist/webview");

	const buildOptions: BuildOptions = {
		...commonEsbuildOptions(true, args),
		entryPoints: [
			path.resolve(context, "./index.ts"),
			path.resolve(context, "styles", "webview.less")
		],
		outdir: target
	};

	await build(buildOptions);
	
	fs.copyFileSync(
		path.resolve(context, "index.html"),
		path.resolve(__dirname, "webview.html")
	);
}

async function extensionBuild(args: Args) {
	const context = path.resolve(__dirname);
	const dist = path.resolve(__dirname, "dist");

	const postBuildCopy: CopyStuff[] = [
		{
			from: path.resolve(__dirname, "../shared/agent/dist/*"),
			to: dist
		},
		{
			from: path.resolve(__dirname, "codestream-*.info"),
			// TODO: Use environment variable if exists
			to: dist
		},
		
	];

	const buildOptions: BuildOptions = {
		...commonEsbuildOptions(false, args),
		entryPoints: [
			path.resolve(context, "./src/extension.ts"),
		],
		external: ["vscode"],
		outfile: path.resolve(dist, "extension.js"),
		plugins: [statsPlugin],
		format: "cjs",
		platform: "node",
		target: "node16",
	};

	await build(buildOptions);
	for (const entry of postBuildCopy) {
		await cpy(entry.from, entry.to, entry.options);
	}

}

(async function() {
	const args = processArgs();
	createSymlinks(__dirname, args);
	console.info("Starting webBuild");
	await webBuild(args);
	console.info("Starting extensionBuild");
	await extensionBuild(args);
})();

import { build, BuildOptions } from "esbuild";
import * as fs from "fs";
import * as path from "path";
import { commonEsbuildOptions, processArgs } from "../shared/util/src/esbuildCommon";
import { createSymlinks } from "../shared/util/src/symlinks";

const context = path.resolve(__dirname, "webview");
const target = path.resolve(__dirname, "src/main/resources/webview");

(async function() {
	const args = processArgs();
	createSymlinks(__dirname, args);
	const buildOptions: BuildOptions = {
		...commonEsbuildOptions(true, args),
		entryPoints: [
			path.resolve(context, "webview.ts"),
			path.resolve(context, "styles", "webview.less")
		],
		outdir: target
	};
	await build(buildOptions);
	fs.copyFileSync(
		path.resolve(context, "index.html"),
		path.resolve(target, "webview-template.html")
	);
})();

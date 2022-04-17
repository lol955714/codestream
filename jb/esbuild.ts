import { build } from "esbuild";
import { lessLoader } from "esbuild-plugin-less";
import * as fs from "fs";
import * as path from "path";
import alias from "esbuild-plugin-path-alias";

const context = path.resolve(__dirname, "webview");
const target = path.resolve(__dirname, "src/main/resources/webview");
const shimTarget = path.resolve(__dirname, "../shared/ui/vscode-jsonrpc.shim.ts");

const watchEnabled = process.argv.findIndex(arg => arg === "--watch") !== -1;

const aliasPlugin = alias({
	"@codestream/protocols/agent": path.resolve(
		__dirname,
		"../shared/ui/protocols/agent/agent.protocol.ts"
	),
	"@codestream/protocols/api": path.resolve(
		__dirname,
		"../shared/ui/protocols/agent/api.protocol.ts"
	),
	"@codestream/protocols/webview": path.resolve(__dirname, "../shared/ui/ipc/webview.protocol.ts")
});

if (watchEnabled) {
	console.log("watch mode");
}

const shimPlugin = {
	name: "shimmy",
	setup(build) {
		// Redirect all paths starting with "images/" to "./public/images/"
		build.onResolve({ filter: /^vscode-jsonrpc$/ }, args => {
			return { path: shimTarget };
		});
	}
};

(async function() {
	await build({
		watch: watchEnabled
			? {
					onRebuild(error, result) {
						console.log(`${new Date().toISOString()} watch build succeeded`);
					}
			  }
			: false,
		entryPoints: [
			path.resolve(context, "webview.ts"),
			path.resolve(context, "styles", "webview.less")
		],
		bundle: true,
		outdir: target,
		plugins: [lessLoader(), shimPlugin, aliasPlugin],
		inject: ["../shared/ui/vscode-jsonrpc.shim.ts"],
		sourcemap: "external",
		minify: true,
		/*
        alias({
            "@codestream/webview": path.resolve(__dirname, "../shared/ui/"),
        })
         */
		loader: {
			".js": "jsx"
		}
	});
	fs.copyFileSync(
		path.resolve(context, "index.html"),
		path.resolve(target, "webview-template.html")
	);
	console.info("build complete");
})();

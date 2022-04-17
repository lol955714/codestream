import { build } from "esbuild";
import { lessLoader } from "esbuild-plugin-less";
import * as fs from "fs";
import * as path from "path";

const context = path.resolve(__dirname, "webview");
const target = path.resolve(__dirname, "src/main/resources/webview");
const shimTarget = path.resolve(__dirname, "../shared/ui/vscode-jsonrpc.shim.ts");

const watchEnabled = process.argv.findIndex(arg => arg === "--watch") !== -1;

const env = {};

if (watchEnabled) {
    console.log("watch mode");
}

createAllSymlinks();

const shimPlugin = {
    name: "shimmy",
    setup(build) {
        // Redirect all paths starting with "images/" to "./public/images/"
        build.onResolve({filter: /^vscode-jsonrpc$/}, args => {
            return {path: shimTarget};
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
        plugins: [lessLoader(), shimPlugin],
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

function createAllSymlinks() {
    let protocolPath = path.resolve(__dirname, "src/protocols");
    if (!fs.existsSync(protocolPath)) {
        console.warn("Creating protocol folder...");
        fs.mkdirSync(protocolPath);
    }

    console.log("Ensuring extension symlink to the agent protocol folder...");
    createFolderSymlinkSync(
        path.resolve(__dirname, "../shared/agent/src/protocol"),
        path.resolve(protocolPath, "agent"),
        env
    );

    console.log("Ensuring extension symlink to the webview protocol folder...");
    createFolderSymlinkSync(
        path.resolve(__dirname, "../shared/ui/ipc"),
        path.resolve(protocolPath, "webview"),
        env
    );

    protocolPath = path.resolve(__dirname, "../shared/ui/protocols");
    if (!fs.existsSync(protocolPath)) {
        fs.mkdirSync(protocolPath);
    }

    console.log("Ensuring webview symlink to the agent protocol folder...");
    createFolderSymlinkSync(
        path.resolve(__dirname, "../shared/agent/src/protocol"),
        path.resolve(protocolPath, "agent"),
        env
    );

}

function createFolderSymlinkSync(source, target, env) {
    if (env.reset) {
        console.log("Unlinking symlink... (env.reset)");
        try {
            fs.unlinkSync(target);
        } catch (ex) {
        }
    } else if (fs.existsSync(target)) {
        return;
    }

    console.log("Creating symlink...", source, target);
    try {
        fs.symlinkSync(source, target, "dir");
    } catch (ex) {
        console.log(`Symlink creation failed; ${ex}`);
        try {
            fs.unlinkSync(target);
            fs.symlinkSync(source, target, "dir");
        } catch (ex) {
            console.log(`Symlink creation failed; ${ex}`);
            console.warn("Are you running this as an administrator?");
        }
    }
    console.log("\n");
}

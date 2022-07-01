"use strict";

import { Range } from "vscode-languageserver";
import { Logger } from "../logger";
import {
	UserDidCopyRequest,
	UserDidCopyRequestType,
	UserDidCopyResponse
} from "../protocol/agent.protocol";
import { CodeStreamSession } from "../session";
import { log } from "../system/decorators/log";
import { lsp, lspHandler } from "../system/decorators/lsp";

@lsp
export class ClipboardManager {
	constructor(readonly session: CodeStreamSession) {}

	private _lastCopyRequest: UserDidCopyRequest | undefined;
	get lastCopyRequest(): UserDidCopyRequest | undefined {
		return this._lastCopyRequest;
	}

	@lspHandler(UserDidCopyRequestType)
	@log()
	async userDidCopy(request: UserDidCopyRequest): Promise<UserDidCopyResponse> {
		Logger.log("User did copy: " + request.text);
		this._lastCopyRequest = request;
		return {};
	}
}

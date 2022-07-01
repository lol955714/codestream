"use strict";

import { Range } from "vscode-languageserver";
import { RequestType } from "vscode-languageserver-protocol";

export interface UserDidCopyRequest {
	range: Range;
	text: string;
	uri: string;
}

export interface UserDidCopyResponse {}

export const UserDidCopyRequestType = new RequestType<
	UserDidCopyRequest,
	UserDidCopyResponse,
	void,
	void
>("codestream/clipboard/userDidCopy");

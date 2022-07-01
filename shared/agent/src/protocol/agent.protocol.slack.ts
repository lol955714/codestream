"use strict";

import { RequestType } from "vscode-languageserver-protocol";
import { AddNewRelicIncludeRequest, AddNewRelicIncludeResponse } from "./agent.protocol.nr";

export interface SlackChannel {
	id: string;
	name: string;
	type: string;
}

export const GetSlackThreadSnippetRequestType = new RequestType<
	GetSlackThreadSnippetRequest,
	GetSlackThreadSnippetResponse,
	void,
	void
>("codestream/slack/threadSnippet");

export interface GetSlackThreadSnippetRequest {
	providerTeamId: string;
	providerChannelId: string;
	ts: string;
}

export interface GetSlackThreadSnippetResponse {}

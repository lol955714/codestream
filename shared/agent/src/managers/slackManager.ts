"use strict";

import { MessageType, RawRTMessage } from "../api/apiProvider";
import { SessionContainer } from "../container";
import { Logger } from "../logger";
import { ParseStackTraceRequestType } from "../protocol/agent.protocol.nr";
import {
	GetSlackThreadSnippetRequest,
	GetSlackThreadSnippetRequestType,
	GetSlackThreadSnippetResponse
} from "../protocol/agent.protocol.slack";
import { CodemarkType } from "../protocol/api.protocol.models";
import { CodeStreamSession } from "../session";
import { lsp, lspHandler } from "../system/decorators/lsp";

@lsp
export class SlackManager {
	constructor(readonly session: CodeStreamSession) {
		session.api.onDidReceiveMessage(this._onRTMessageReceived.bind(this));
	}

	private async _onRTMessageReceived(e: RawRTMessage) {
		if (e.type !== MessageType.SlackPosts) return;
		const { lastCopyRequest } = SessionContainer.instance().clipboard;
		if (lastCopyRequest == null) return;

		const { text, teamId, channelId, ts } = e.data[0] || "";
		try {
			const normalizedSlackText = this._normalizeText(text);
			const normalizedCopiedText = this._normalizeText(lastCopyRequest.text);

			if (normalizedSlackText.indexOf(normalizedCopiedText) >= 0) {
				const rangeInfo = await SessionContainer.instance().scm.getRangeInfo({
					uri: lastCopyRequest.uri,
					range: lastCopyRequest.range
				});
				const { posts, providerRegistry } = SessionContainer.instance();
				const permalink = await providerRegistry.executeMethod({
					providerId: "slack*com",
					method: "getPermalink",
					params: {
						teamId,
						channelId,
						ts
					}
				});
				const parts = text.split("```");
				const textWithoutCode = parts[0] || "" + parts[2] || "";
				const createPostResponse = await posts.createSharingCodemarkPost({
					attributes: {
						text:
							"#slack#" +
							permalink + // 1
							"#slack#" +
							teamId + // 2
							"#slack#" +
							channelId + // 3
							"#slack#" +
							ts + // 4
							"#slack#" +
							textWithoutCode, // 5
						// this._removeText(text, lastCopyRequest.text).replace(/```/g, ""),
						codeBlocks: [rangeInfo],
						type: CodemarkType.Comment
					}
				});
				const createPermalinkResponse = await posts.createSharingCodemarkPost({
					attributes: {
						codeBlocks: [rangeInfo],
						type: CodemarkType.Link
					}
				});
				console.log(createPermalinkResponse);
				const sharePostResponse = await this.session.api.sharePostViaServer({
					providerId: "slack*com",
					codemarkId: createPermalinkResponse?.codemark?.id,
					destination: {
						channelId,
						teamId,
						parentPostId: ts
					}
				});
				console.log(sharePostResponse);

				Logger.log("CHUPACABRA PROFIT");
			}
		} catch (ex) {
			Logger.error(ex);
		}
	}

	@lspHandler(GetSlackThreadSnippetRequestType)
	getSlackThreadSnippet(
		request: GetSlackThreadSnippetRequest
	): Promise<GetSlackThreadSnippetResponse> {
		return this.session.api.getSlackThreadSnippet(request);
	}

	private _normalizeText(text: string): string {
		return text
			.replace(/\s/g, "")
			.replace(/&amp;/g, "&")
			.replace(/&lt;/g, "<")
			.replace(/&gt;/g, ">");
	}

	private _removeText(text: string, textToRemove: string): string {
		text = text
			.replace(/&amp;/g, "&")
			.replace(/&lt;/g, "<")
			.replace(/&gt;/g, ">");
		textToRemove = textToRemove
			.replace(/&amp;/g, "&")
			.replace(/&lt;/g, "<")
			.replace(/&gt;/g, ">");
		return text.replace(textToRemove, "");
	}
}

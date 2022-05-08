import { describe, expect, it } from "@jest/globals";
import { CSUser } from "protocol/api.protocol";
import { stubInterface } from "ts-sinon";
import { toSlackPostBlocks, toSlackTextSafe, UserMaps } from "../../../../src/api/slack/slackSharingApi.adapters";

describe("slackSharingApi.adapters.ts", () => {
	const userMaps = stubInterface<UserMaps>();
	userMaps.codeStreamUsersByUsername = new Map<string, CSUser>();
	const user = {
		id: "123",
		username: "cheese",
		email: "cheese@codestream.com"
	};
	userMaps.codeStreamUsersByUsername.set("cheese", user as any);
	userMaps.slackUserIdsByEmail = new Map<string, string>();
	userMaps.slackUserIdsByEmail.set("cheese@codestream.com", "456");

	describe("toSlackTextSafe", () => {
		it("has a long text block", () => {
			const text = toSlackTextSafe("x".repeat(3200), stubInterface<UserMaps>(), undefined, 3000);
			expect(text.wasTruncated).toBe(true);
			expect(text.text.length).toBeLessThan(3000);
		});

		it("has replaceable mentions", () => {
			const text = toSlackTextSafe("@cheese what is this?", userMaps);
			expect(text.text).toBe("<@456> what is this?");
		});
	});

	describe("toSlackPostBlocks", () => {
		it("can create slack blocks", () => {
			const blocks = toSlackPostBlocks(
				{
					text: "hey @cheese, what is going on this this `variable`?",
					type: "comment"
				} as any,
				undefined,
				userMaps,
				{
					r123: {
						name: "repo123"
					} as any
				},
				""
			);
			expect(blocks.length).toBeGreaterThan(2);
		});
	});
});

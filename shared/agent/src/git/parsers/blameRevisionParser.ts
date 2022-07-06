"use strict";
import { Strings } from "../../system";
import { isUncommitted } from "../common";

export interface RevisionEntry {
	sha: string;
	date: Date;
	authorName: string;
}

export class GitBlameRevisionParser {
	static parse(data: string): RevisionEntry[] {
		if (!data) return [];

		const references = new Map<string, RevisionEntry>();

		let index;
		let line;
		let sha: string | undefined;
		let date: Date | undefined;
		let authorName: string | undefined;
		let process = false;

		for (line of Strings.lines(data + "\n")) {
			index = line.indexOf(" ");

			if (sha === undefined || process) {
				if (process) {
					process = false;
				}

				if (index === -1) continue;

				sha = line.substring(0, index);
				index = line.lastIndexOf(" ") + 1;

				continue;
			}

			if (index === -1) continue;

			switch (line.substring(0, index)) {
				case "author-time":
					date = new Date((line.substring(index).trim() as any) * 1000);
					break;

				case "author":
					if (!isUncommitted(sha!)) {
						authorName = line.substring(index).trim();
					}
					break;

				case "filename":
					process = true;
					if (!references.has(sha)) {
						references.set(sha, {
							sha,
							date,
							authorName
						} as RevisionEntry);
					}
					break;

				default:
					break;
			}
		}

		return [...references.values()].sort((a, b) => b.date.getTime() - a.date.getTime());
	}
}

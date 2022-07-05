/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Alessandro Fragnani. All rights reserved.
 *  Licensed under the MIT License. See License.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import path = require("path");
import * as fs from "fs";
import * as semver from "semver";
import * as vscode from "vscode";

// common
export interface Image {
	src: string;
	width: number;
	height: number;
	light?: string;
	dark?: string;
}

// header
export interface Header {
	logo: Image;
	message: string;
}

// changelog
export enum ChangeLogKind {
	NEW = "NEW",
	CHANGED = "CHANGED",
	FIXED = "FIXED",
	VERSION = "VERSION",
	INTERNAL = "INTERNAL"
}

export enum IssueKind {
	Issue = "Issue",
	PR = "PR"
}

export interface ChangeLogIssue {
	message: string;
	id?: number;
	kind?: IssueKind;
	kudos?: string;
}

export interface ChangeLogVersion {
	releaseNumber: string;
	releaseDate: string;
}

export interface ChangeLogItem {
	kind: ChangeLogKind;
	detail: ChangeLogIssue | ChangeLogVersion | string;
}

// sponsor
export interface Sponsor {
	title: string;
	link: string;
	image: Image;
	width: number;
	message: string;
	extra: string;
}

export interface SupportChannel {
	title: string;
	link: string;
	message: string;
}

export interface ContentProvider {
	provideHeader(logoUrl: string): Header;
	provideChangeLog(): ChangeLogItem[];
	provideSupportChannels(): SupportChannel[];
}

export interface SponsorProvider {
	provideSponsors(): Sponsor[];
}

export interface SocialMedia {
	link: string;
	title: string;
}

export interface SocialMediaProvider {
	provideSocialMedias(): SocialMedia[];
}

export class WhatsNewManager {
	private publisher!: string;
	private extensionName!: string;
	private context: vscode.ExtensionContext;
	private contentProvider!: ContentProvider;
	private socialMediaProvider!: SocialMediaProvider | undefined;
	private sponsorProvider: SponsorProvider | undefined;

	private extension!: vscode.Extension<any>;
	private versionKey!: string;

	constructor(context: vscode.ExtensionContext) {
		this.context = context;
	}

	private isRunningOnCodespaces(): boolean {
		return vscode.env.remoteName?.toLocaleLowerCase() === "codespaces";
	}

	public registerContentProvider(
		publisher: string,
		extensionName: string,
		contentProvider: ContentProvider
	): WhatsNewManager {
		this.publisher = publisher;
		this.extensionName = extensionName;
		this.contentProvider = contentProvider;
		this.versionKey = `${this.extensionName}.version`;

		this.context.globalState.setKeysForSync([this.versionKey]);

		return this;
	}

	public registerSocialMediaProvider(socialMediaProvider: SocialMediaProvider): WhatsNewManager {
		this.socialMediaProvider = socialMediaProvider;
		return this;
	}

	public registerSponsorProvider(sponsorProvider: SponsorProvider): WhatsNewManager {
		this.sponsorProvider = sponsorProvider;
		return this;
	}

	public showPageInActivation() {
		// load data from extension manifest
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		this.extension = vscode.extensions.getExtension(`${this.publisher}.${this.extensionName}`)!;

		const previousExtensionVersion = this.context.globalState.get<string>(this.versionKey);

		this.showPageIfVersionDiffers(this.extension.packageJSON.version, previousExtensionVersion);
	}

	public showPage() {
		// Create and show panel
		const panel = vscode.window.createWebviewPanel(
			`${this.extensionName}.whatsNew`,
			//			`What's New in ${this.extension.packageJSON.displayName}`,
			"What's New in New Relic CodeStream",
			vscode.ViewColumn.One,
			{ enableScripts: true }
		);

		// src/providers/whatsNew.css
		// Get path to resource on disk
		const onDiskPath = vscode.Uri.file(
			path.join(this.context.extensionPath, "src", "providers", "whatsNew.html")
		);
		const pageUri = onDiskPath.with({ scheme: "codestream" });

		// Local path to main script run in the webview
		const cssPathOnDisk = vscode.Uri.file(
			path.join(this.context.extensionPath, "src", "providers", "whatsNew.css")
		);
		const cssUri = cssPathOnDisk.with({ scheme: "vscode-resource" });

		// TODO fix this

		// Local path to main script run in the webview
		// const logoPathOnDisk = vscode.Uri.file(
		// 	path.join(
		// 		this.context.extensionPath,
		// 		"assets",
		// 		"images",
		// 		"codestream.png"
		// 		// `vscode-${this.extensionName.toLowerCase()}-logo-readme.png`
		// 	)
		// );

		// 	const logoUri = logoPathOnDisk.with({ scheme: "vscode-resource" });

		panel.webview.html = this.getWebviewContentLocal(
			pageUri.fsPath,
			cssUri.toString(),
			"https://camo.githubusercontent.com/c25e961f5c660679d2b1a64c2a54b2b9e1a2a95077ffcda4799ff963ce191642/68747470733a2f2f616c742d696d616765732e636f646573747265616d2e636f6d2f636f646573747265616d5f6c6f676f5f7673636d61726b6574706c6163652e706e67"
			// logoUri.toString()
		);
	}

	public showPageIfVersionDiffers(currentVersion: string, previousVersion: string | undefined) {
		// TODO fix all this

		// if (previousVersion) {
		// 	const differs: semver.ReleaseType | null = semver.diff(currentVersion, previousVersion);

		// 	// only "patch" should be suppressed
		// 	if (!differs || differs === "patch") {
		// 		return;
		// 	}
		// }

		// // "major", "minor"
		// this.context.globalState.update(this.versionKey, currentVersion);

		// //
		if (this.isRunningOnCodespaces()) {
			return;
		}

		this.showPage();
	}

	private getWebviewContentLocal(htmlFile: string, cssUrl: string, logoUrl: string): string {
		return WhatsNewPageBuilder.newBuilder(htmlFile)
			.updateExtensionPublisher(this.publisher)
			.updateExtensionDisplayName("New Relic CodeStream") // this.extension.packageJSON.displayName)
			.updateExtensionName(this.extensionName)
			.updateExtensionVersion(this.extension.packageJSON.version)
			.updateRepositoryUrl(
				this.extension.packageJSON.repository.url.slice(
					0,
					this.extension.packageJSON.repository.url.length - 4
				)
			)
			.updateRepositoryIssues(this.extension.packageJSON.bugs.url)
			.updateRepositoryHomepage(this.extension.packageJSON.homepage)
			.updateCSS(cssUrl)
			.updateHeader(this.contentProvider.provideHeader(logoUrl))
			.updateChangeLog(this.contentProvider.provideChangeLog())
			.updateSponsors(this.sponsorProvider?.provideSponsors())
			.updateSupportChannels(this.contentProvider.provideSupportChannels())
			.updateSocialMedias(this.socialMediaProvider?.provideSocialMedias())
			.build();
	}
}

export class WhatsNewPageBuilder {
	public static newBuilder(htmlFile: string): WhatsNewPageBuilder {
		return new WhatsNewPageBuilder(htmlFile);
	}

	private htmlFile: string;
	private repositoryUrl!: string;

	constructor(htmlFile: string) {
		this.htmlFile = fs.readFileSync(htmlFile).toString();
	}

	public updateExtensionPublisher(publisher: string) {
		this.htmlFile = this.htmlFile.replace(/\$\{publisher\}/g, publisher);
		return this;
	}

	public updateExtensionDisplayName(extensionDisplayName: string) {
		this.htmlFile = this.htmlFile.replace(/\$\{extensionDisplayName\}/g, extensionDisplayName);
		return this;
	}

	public updateExtensionName(extensionName: string) {
		this.htmlFile = this.htmlFile.replace(/\$\{extensionName\}/g, extensionName);
		return this;
	}

	public updateExtensionVersion(extensionVersion: string) {
		this.htmlFile = this.htmlFile.replace(
			"${extensionVersion}",
			`${semver.major(extensionVersion)}.${semver.minor(extensionVersion)}`
		);
		return this;
	}

	public updateRepositoryUrl(repositoryUrl: string) {
		this.htmlFile = this.htmlFile.replace(/\$\{repositoryUrl\}/g, repositoryUrl);
		this.repositoryUrl = repositoryUrl;
		return this;
	}

	public updateRepositoryIssues(repositoryIssues: string) {
		this.htmlFile = this.htmlFile.replace("${repositoryIssues}", repositoryIssues);
		return this;
	}

	public updateRepositoryHomepage(repositoryHomepage: string) {
		this.htmlFile = this.htmlFile.replace("${repositoryHomepage}", repositoryHomepage);
		return this;
	}

	public updateCSS(cssUrl: string): WhatsNewPageBuilder {
		this.htmlFile = this.htmlFile.replace("${cssUrl}", cssUrl);
		return this;
	}

	public updateHeader(header: Header): WhatsNewPageBuilder {
		this.htmlFile = this.htmlFile.replace("${headerLogo}", header.logo.src);
		this.htmlFile = this.htmlFile.replace("${headerWidth}", header.logo.width.toString());
		this.htmlFile = this.htmlFile.replace("${headerHeight}", header.logo.height.toString());
		this.htmlFile = this.htmlFile.replace("${headerMessage}", header.message);
		return this;
	}

	public updateChangeLog(changeLog: ChangeLogItem[]): WhatsNewPageBuilder {
		let changeLogString = "";

		for (const cl of changeLog) {
			if (cl.kind === ChangeLogKind.VERSION) {
				const cc: ChangeLogVersion = (cl as any).detail;
				const borderTop = changeLogString === "" ? "" : "changelog__version__borders__top";
				changeLogString = changeLogString.concat(
					`<li class="changelog__version__borders ${borderTop}">
                        <span class="changelog__badge changelog__badge--version">${cc.releaseNumber}</span>
                        <span class="uppercase bold">${cc.releaseDate}</span>
                    </li>`
				);
			} else {
				const badge: string = this.getBadgeFromChangeLogKind(cl.kind);
				let message: string | undefined = undefined;

				if (typeof cl.detail === "string") {
					message = cl.detail;
				} else {
					const cc: ChangeLogIssue = (cl as any).detail;
					if (cc.kind === IssueKind.Issue) {
						message = `${cc.message}
                            (<a title="Open Issue #${cc.id}" 
                            href="${this.repositoryUrl}/issues/${cc.id}">Issue #${cc.id}</a>)`;
					} else if (cc.kind === IssueKind.PR) {
						message = `${cc.message}
                            (Thanks to ${cc.kudos} - <a title="Open PR #${cc.id}" 
                            href="${this.repositoryUrl}/pull/${cc.id}">PR #${cc.id}</a>)`;
					} else if (cc.message) {
						message = `${cc.message}`;
					}
				}
				if (message) {
					changeLogString = changeLogString.concat(
						`<li><span class="changelog__badge changelog__badge--${badge}">${cl.kind}</span>
                        ${message}
                    </li>`
					);
				}
			}
		}
		this.htmlFile = this.htmlFile.replace("${changeLog}", changeLogString);
		return this;
	}

	public updateSponsors(sponsors: Sponsor[] | undefined): WhatsNewPageBuilder {
		if (!sponsors || sponsors.length === 0) {
			this.htmlFile = this.htmlFile.replace("${sponsors}", "");
			return this;
		}

		let sponsorsString = `<p>
          <h2>Sponsors</h2>`;

		for (const sp of sponsors) {
			if (sp.message) {
				sponsorsString = sponsorsString.concat(
					`<a title="${sp.title}" href="${sp.link}">
                    <img class="dark" src="${sp.image.light}" width="${sp.width}%"/>
                    <img class="light" src="${sp.image.dark}" width="${sp.width}%"/>
                    </a>
                    ${sp.message} 
                    ${sp.extra}<br><br>`
				);
			} else {
				sponsorsString = sponsorsString.concat(
					`<div align="center"><a title="${sp.title}" href="${sp.link}">
                    <img class="dark" src="${sp.image.light}" width="${sp.width}%"/>
                    <img class="light" src="${sp.image.dark}" width="${sp.width}%"/>
                    </a></div><br>`
				);
			}
		}
		sponsorsString = sponsorsString.concat("</p>");
		this.htmlFile = this.htmlFile.replace("${sponsors}", sponsorsString);
		return this;
	}

	public updateSupportChannels(supportChannels: SupportChannel[]): WhatsNewPageBuilder {
		if (supportChannels.length === 0) {
			this.htmlFile = this.htmlFile.replace("${supportChannels}", "");
			return this;
		}

		let supportChannelsString = '<div class="button-group button-group--support-alefragnani">';

		for (const sc of supportChannels) {
			supportChannelsString = supportChannelsString.concat(
				`<a class="button button--flat-primary" title="${sc.title}" href="${sc.link}" target="_blank">
                    ${sc.message} 
                </a>`
			);
		}
		supportChannelsString = supportChannelsString.concat("</div>");
		this.htmlFile = this.htmlFile.replace("${supportChannels}", supportChannelsString);
		return this;
	}

	public updateSocialMedias(socialMedias: SocialMedia[] | undefined): WhatsNewPageBuilder {
		if (!socialMedias || socialMedias.length === 0) {
			this.htmlFile = this.htmlFile.replace("${socialMedias}", "");
			return this;
		}

		let socialMediasString = "";

		for (const sm of socialMedias) {
			socialMediasString = socialMediasString.concat(
				`<li><a title="${sm.title}" href="${sm.link}">${sm.title}</a></li>`
			);
		}
		this.htmlFile = this.htmlFile.replace("${socialMedias}", socialMediasString);
		return this;
	}

	public build(): string {
		return this.htmlFile.toString();
	}

	private getBadgeFromChangeLogKind(kind: ChangeLogKind): string {
		switch (kind) {
			case ChangeLogKind.NEW:
				return "added";

			case ChangeLogKind.CHANGED:
				return "changed";

			case ChangeLogKind.FIXED:
				return "fixed";

			case ChangeLogKind.INTERNAL:
				return "internal";

			default:
				return "internal";
		}
	}
}

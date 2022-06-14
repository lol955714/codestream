import * as Sentry from "@sentry/node";
import { Severity } from "@sentry/node";
import * as os from "os";
import { ReportSuppressedMessages } from "./agentError";
import { Team } from "./api/extensions";
import { SessionContainer } from "./container";
import {
	ReportBreadcrumbRequest,
	ReportBreadcrumbRequestType,
	ReportMessageRequest,
	ReportMessageRequestType,
	WebviewErrorRequest,
	WebviewErrorRequestType
} from "./protocol/agent.protocol";
import { CodeStreamSession, SessionStatus } from "./session";
import { lsp, lspHandler, Strings } from "./system";
import { Logger } from "./logger";
import * as NewRelic from "newrelic";
import md5 = Strings.md5;
import { CodeStreamAgent } from "./agent";

interface IErrorReporterProvider {
	reportMessage(request: ReportMessageRequest): void;
	reportBreadcrumb(request: ReportBreadcrumbRequest): void;
	webviewError(request: WebviewErrorRequest): void;
}

abstract class ErrorReporterProviderBase {
	protected _errorCache = new Set<string>();
	constructor(protected session: CodeStreamSession) {}
}

@lsp
export class ErrorReporter {
	private readonly _errorProviders: IErrorReporterProvider[];

	constructor(agent: CodeStreamAgent, session: CodeStreamSession) {
		// use both error providers for now
		this._errorProviders = [
			new SentryErrorReporterProvider(session),
			new NewRelicErrorReporterProvider(agent, session)
		];
	}

	@lspHandler(ReportMessageRequestType)
	reportMessage(request: ReportMessageRequest) {
		this._errorProviders.forEach(_ => _.reportMessage(request));
	}

	@lspHandler(ReportBreadcrumbRequestType)
	reportBreadcrumb(request: ReportBreadcrumbRequest) {
		this._errorProviders.forEach(_ => _.reportBreadcrumb(request));
	}

	@lspHandler(WebviewErrorRequestType)
	webviewError(request: WebviewErrorRequest) {
		this._errorProviders.forEach(_ => _.webviewError(request));
	}
}

class SentryErrorReporterProvider extends ErrorReporterProviderBase
	implements IErrorReporterProvider {
	constructor(session: CodeStreamSession) {
		super(session);
		if (session.isProductionCloud) {
			Logger.log("Initializing Sentry...");
			Sentry.init({
				dsn: "https://7c34949981cc45848fc4e3548363bb17@sentry.io/1314159",
				release: session.versionInfo.extension.versionFormatted,
				environment: session.environment,
				maxBreadcrumbs: 500,
				maxValueLength: 500
			});

			Sentry.configureScope(scope => {
				scope.setTag("platform", os.platform());
				scope.setTag("ide", session.versionInfo.ide.name);
				scope.setTag("ideDetail", session.versionInfo.ide.detail);
				scope.setExtra("ideVersion", session.versionInfo.ide.version);
				scope.setTag("source", "agent");

				// we purposefully intercept certain errors, and don't send them to Sentry
				// would be better to actually get the original exception here, and not have to rely on the
				// exception message, but sadly, Sentry doesn't seem to give us the original exception
				// for rejects promises
				const suppressMessages = Object.values(ReportSuppressedMessages).map(v => v as string);
				scope.addEventProcessor(event => {
					if (event.exception?.values) {
						for (const value of event.exception.values) {
							if (value.value) {
								if (this._errorCache.has(value.value)) {
									Logger.warn("Ignoring duplicate error", {
										key: value.value
									});
									return null;
								} else {
									this._errorCache.add(value.value);
								}
								if (suppressMessages.indexOf(value.value) !== -1) {
									return null;
								}
							}
							if (value.type === "InternalError") {
								return null;
							}
						}
					}

					return event;
				});
			});

			session.onDidChangeSessionStatus(event => {
				if (event.getStatus() === SessionStatus.SignedOut) return;

				Sentry.configureScope(async scope => {
					const team = await SessionContainer.instance().teams.getById(session.teamId);
					//  TODO: acknowledge telemetryConsent
					scope.setUser({
						id: session.userId,
						email: session.email,
						team: {
							id: team.id,
							name: team.name,
							provider: Team.isSlack(team)
								? "Slack"
								: Team.isMSTeams(team)
								? "MSTeams"
								: "CodeStream"
						}
					});
				});
			});
		} else {
			Logger.log("Not initializing Sentry, this is not production");
		}
	}

	webviewError(request: WebviewErrorRequest): void {
		Logger.log(`Webview error: ${request.error.message}\n${request.error.stack}`);
	}

	reportMessage(request: ReportMessageRequest) {
		const key = `${request.message}`;
		if (this._errorCache.has(key)) {
			Logger.warn("Ignoring duplicate error", {
				key: key
			});
			return;
		}

		this._errorCache.add(key);
		Sentry.captureEvent({
			level: Severity.fromString(request.type),
			timestamp: Date.now(),
			message: request.message,
			extra: request.extra,
			tags: {
				source: request.source
			}
		});
	}
	reportBreadcrumb(request: ReportBreadcrumbRequest) {
		Sentry.addBreadcrumb({
			message: request.message,
			data: request.data,
			level: request.level ? Severity.fromString(request.level) : undefined,
			category: request.category
		});
	}
}

class NewRelicErrorReporterProvider extends ErrorReporterProviderBase
	implements IErrorReporterProvider {
	constructor(private agent: CodeStreamAgent, session: CodeStreamSession) {
		super(session);
	}

	reportMessage(request: ReportMessageRequest) {
		if (!request.error && !request.message) return;

		const key = request.error ? md5(JSON.stringify(request.error)) : `${request.message}`;
		if (this._errorCache.has(key)) {
			Logger.warn("Ignoring duplicate error", {
				key: key
			});
			return;
		}

		this._errorCache.add(key);

		try {
			NewRelic.noticeError(request.error || new Error(request.message), {
				...((this.agent.createNewRelicCustomAttributes() as any) || {}),
				extra:
					typeof request.extra === "object" ? JSON.stringify(request.extra) : request.extra || "",
				type: request.type,
				source: request.source || "agent"
			});
		} catch (ex) {
			Logger.warn("Failed to reportMessage", {
				error: ex
			});
		}
	}

	webviewError(request: WebviewErrorRequest): void {
		// try {
		// 	NewRelic.noticeError(new Error(request.error.message), {
		// 		...this.agent.createNewRelicCustomAttributes,
		// 		stack: request.error.stack
		// 	});
		// } catch (e) {
		// 	Logger.warn(e);
		// }

		Logger.log(`Webview error: ${request.error.message}\n${request.error.stack}`);
	}

	reportBreadcrumb(request: ReportBreadcrumbRequest) {
		// noop
	}
}

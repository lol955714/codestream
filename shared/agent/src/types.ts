// import { Agent as HttpAgent } from "http";
// import { Agent as HttpsAgent } from "https";
// import HttpsProxyAgent from "https-proxy-agent";
// import {
// 	_RemoteWorkspace,
// 	Connection,
// 	Emitter,
// 	Event,
// 	MessageActionItem
// } from "vscode-languageserver";
// import { Configuration } from "vscode-languageserver/lib/configuration";
// import { WorkspaceFolders } from "vscode-languageserver/lib/workspaceFolders";
// import { CodeStreamAgent } from "./agent";
// import { ApiProvider, LoginOptions, RTMessage } from "./api/apiProvider";
// import {
// 	ApiVersionCompatibilityChangedEvent,
// 	VersionCompatibilityChangedEvent
// } from "./api/middleware/versionMiddleware";
// import { DocumentEventHandler } from "./documentEventHandler";
// import { GitRepository } from "./git/models/repository";
// import {
// 	BaseAgentOptions,
// 	CodeStreamEnvironment,
// 	CodeStreamEnvironmentInfo,
// 	ConfirmLoginCodeRequest,
// 	ConfirmRegistrationRequest,
// 	ConfirmRegistrationResponse,
// 	GenerateLoginCodeRequest,
// 	GetInviteInfoRequest,
// 	JoinCompanyRequest,
// 	LoginResponse,
// 	LogoutReason,
// 	OtcLoginRequest,
// 	PasswordLoginRequest,
// 	RegisterNrUserRequest,
// 	RegisterUserRequest,
// 	SetServerUrlRequest,
// 	ThirdPartyProviders,
// 	TokenLoginRequest,
// 	VerifyConnectivityResponse
// } from "./protocol/agent.protocol";
// import { CSCompany, CSGetInviteInfoResponse, LoginResult } from "./protocol/api.protocol";
// import {
// 	CSApiCapabilities,
// 	CSCodemark,
// 	CSMarker,
// 	CSMarkerLocations,
// 	CSMe,
// 	CSMePreferences,
// 	CSPost,
// 	CSRepository,
// 	CSStream,
// 	CSTeam,
// 	CSUser
// } from "./protocol/api.protocol.models";
// import { SessionStatusChangedEvent } from "./session";

export enum TraceLevel {
	Silent = "silent",
	Errors = "errors",
	Verbose = "verbose",
	Debug = "debug"
}

export interface LogCorrelationContext {
	readonly correlationId?: number;
	readonly prefix: string;
	exitDetails?: string;
}

export enum SessionStatus {
	SignedOut = "signedOut",
	SignedIn = "signedIn"
}

export interface TelemetryData {
	hasCreatedPost: boolean;
}

export interface VersionInfo {
	extension: {
		build: string;
		buildEnv: string;
		version: string;
		versionFormatted: string;
	};

	ide: {
		name: string;
		version: string;
		detail: string;
	};

	machine?: {
		machineId?: string;
	};
}

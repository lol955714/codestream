"use strict";
import { createConnection, ProposedFeatures } from "vscode-languageserver";
import { CodeStreamAgent } from "./agent";

export * from "./providers/trello";
export * from "./providers/jira";
export * from "./providers/jiraserver";
export * from "./providers/github";
export * from "./providers/githubEnterprise";
export * from "./providers/gitlab";
export * from "./providers/gitlabEnterprise";
export * from "./providers/asana";
export * from "./providers/bitbucket";
export * from "./providers/bitbucketServer";
export * from "./providers/youtrack";
export * from "./providers/azuredevops";
export * from "./providers/slack";
export * from "./providers/msteams";
export * from "./providers/okta";
export * from "./providers/shortcut";
export * from "./providers/linear";
export * from "./providers/newrelic";

process.title = "CodeStream";

// Create a connection for the server. The connection uses Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

new CodeStreamAgent(connection);

connection.listen();

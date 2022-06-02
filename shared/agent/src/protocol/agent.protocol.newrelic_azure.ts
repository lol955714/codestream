"use strict";

export interface NewRelicAzureUser {
	identity: {
		id: string;
		displayName: string;
		uniqueName: string;
	};
}

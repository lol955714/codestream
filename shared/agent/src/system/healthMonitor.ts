import { SessionContainer } from "../container";
import { Logger } from "../logger";
import { RestartRequiredNotificationType } from "../protocol/agent.protocol.notifications";

const errors = ["GIT_SIGKILL"] as const;
export type ErrorType = "GIT_SIGKILL";

interface Threshold {
	timeSpanSeconds: number;
	count: number;
	action: ThresholdAction;
}

interface ThresholdAction {
	name: string;
	runner: Function;
}

const restartAction: ThresholdAction = {
	name: "Restart Agent",
	runner: () => {
		SessionContainer.instance().session.agent.sendNotification(RestartRequiredNotificationType, {});
	}
};

const thresholdMap: Map<ErrorType, Threshold> = new Map([
	["GIT_SIGKILL", { timeSpanSeconds: 300, count: 1, action: restartAction }]
]);

class HealthMonitor {
	private errorMap = new Map<ErrorType, Date[]>();

	constructor() {
		for (const err of errors) {
			this.errorMap.set(err, []);
		}
	}

	reportError(errorType: ErrorType): void {
		const dateHistory = this.errorMap.get(errorType);
		if (dateHistory) {
			dateHistory.push(new Date());
		}
		this.checkThresholds(errorType);
	}

	private checkThresholds(errorType: ErrorType) {
		const threshold = thresholdMap.get(errorType);
		if (!threshold) {
			return;
		}
		const startTime = new Date().getTime() - threshold.timeSpanSeconds * 1000;
		const history = this.errorMap.get(errorType);
		if (!history) {
			return;
		}
		const filtered = history.filter(date => date.getTime() > startTime);
		this.errorMap.set(errorType, filtered); // Keep list from growing infinitely
		if (filtered.length > threshold.count) {
			Logger.warn(
				`Health Monitor threshold met for ${errorType} - performing action ${threshold.action.name}`
			);
			threshold.action.runner();
		}
		// TODO Assuming future actions where we don't restart - do we clear out the map for this errorType??
	}
}

export const healthMonitor = new HealthMonitor();

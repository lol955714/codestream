import PubNub from "pubnub";
import Raven from "raven-js";
import _ from "underscore-plus";
import { normalize } from "./actions/utils";
import { resolveFromPubnub } from "./actions/pubnub-event";
import { saveMarkerLocations } from "./actions/marker-location";
import { lastMessageReceived, historyRetrievalFailure } from "./actions/messaging";
import rootLogger from "./util/Logger";
import PubnubSubscription from "./pubnub-subscription"

const logger = rootLogger.forClass("pubnub-receiver");

export default class PubNubReceiver {

	constructor(store) {
		this.store = store;
		this.subscriptions = {};
	}

	initialize(authKey, userId, sessionId, subscribeKey) {
		const uuid = `${userId}/${sessionId}`;
		this.pubnub = new PubNub({
			authKey,
			uuid,
			subscribeKey: subscribeKey,
			restore: true,
			logVerbosity: false,
			heartBeatInterval: 30
		});
		this.setupListener();
	}

	isInitialized() {
		return Boolean(this.pubNub);
	}

	setupListener() {
		this.pubnub.addListener({
			status: this.pubnubStatus.bind(this),
			presence: this.pubnubPresence.bind(this),
			message: this.pubnubEvent.bind(this)
		});
	}

	pubnubStatus(status) {
		logger.debug("pubnub status", status);
		if (status.error) {
			// this sucks ... pubnub does not send us the channel that failed,
			// meaning that if we try to subscribe to two channels around the same
			// time, we can't know which one this is a status error for ...
			// so we'll spit out the error here, but we'll have to rely on the 
			// subscription timeout to actually handle the failure
			console.warn('PUBNUB STATUS ERROR: ', status);
			Raven.captureBreadcrumb({
				message: `Pubnub status error: ${JSON.stringify(status)}`,
				category: "pubnub",
				level: "warning"
			});
			return;
		}

		const channels = status.affectedChannels || Object.keys(this.subscriptions);
		channels.forEach(channel => {
			if (this.subscriptions[channel]) {
				this.subscriptions[channel].status(status);
			}
		});
	}

	pubnubPresence(event) {
		logger.debug(`user ${event.uuid} ${event.action}. occupancy is ${event.occupancy}`); // uuid of the user
	}

	pubnubEvent(event) {
		this.store.dispatch(lastMessageReceived(event.timetoken));
		this.pubnubMessage(event.timetoken, event.message);
	}

	pubnubMessage(timetoken, message, { isHistory = false } = {}) {
		const { requestId, ...objects } = message;
		// console.log(`pubnub event - ${requestId}`, message);
		Raven.captureBreadcrumb({
			message: "pubnub event",
			category: "pubnub",
			data: { requestId, isHistory, ...Object.keys(objects) },
			level: "debug"
		});
		Object.keys(objects).forEach(key => {
			const handler = this.getMessageHandler(key);
			if (handler) handler(objects[key], isHistory);
		});
		if (isHistory) {
			if (this.lastHistoryTimeToken === timetoken) this.store.dispatch({ type: "CAUGHT_UP" });
		}
	}

	subscribe(channels) {
		if (this.pubnub === null)
			throw new Error(
				"PubNubReceiver must be initialized with an authKey and userId before subscribing to channels"
			);

		channels.forEach(channel => {
			logger.debug("subscribing to", channel);
			if (!this.subscriptions[channel]) {
				this.subscriptions[channel] = new PubnubSubscription({
					pubnub: this.pubnub,
					channel: channel,
					store: this.store
				});
			}
			this.subscriptions[channel].subscribe();
		});
	}

	unsubscribeAll() {
		for (let channel in this.subscriptions) {
			this.subscriptions[channel].unsubscribe();
			delete this.subscriptions[channel];
		}
	}

	getMessageHandler(type) {
		let tableName;
		switch (type) {
			case "stream":
			case "streams":
				tableName = "streams";
				break;
			case "post":
			case "posts":
				tableName = "posts";
				break;
			case "user":
			case "users":
				tableName = "users";
				break;
			case "team":
			case "teams":
				tableName = "teams";
				break;
			case "repo":
			case "repos":
				tableName = "repos";
				break;
			case "marker":
			case "markers":
				tableName = "markers";
				break;
			case "markerLocations":
				return data => this.store.dispatch(saveMarkerLocations(normalize(data)));
		}
		if (tableName)
			return (data, isHistory) =>
				this.store.dispatch(resolveFromPubnub(tableName, normalize(data), isHistory));
	}

	getSubscribedChannels() {
		return Object.keys(this.subscriptions).filter(channel => this.subscriptions[channel].isSubscribed());
	}

	async retrieveHistory(channels, messaging = {}) {
		let retrieveSince;
		channels = channels || this.getSubscribedChannels();
		if (messaging.lastMessageReceived) {
			retrieveSince = messaging.lastMessageReceived;
		} else {
			// once this mechanism is in operation this should never happen, but until then,
			// we'll need to invent a beginning of time (like before codestream existed)
			retrieveSince = (new Date("1/1/2018").getTime() * 10000).toString();
		}
		// FIXME: there probably needs to be a time limit here, where we assume it isn't
		// worth replaying all the messages ... instead we just wipe the DB and refresh
		// the session ... maybe a week?
		return await this.retrieveHistorySince(channels, retrieveSince);
	}

	async retrieveHistorySince(channels, timeToken) {
		// fetch the history for each subscribed channel individually...
		let allMessages = [];
		await Promise.all(
			channels.map(channel => {
				return this.retrieveChannelHistorySince(channel, timeToken, allMessages);
			})
		);

		// now get numeric timestamps (from the stringified time tokens) and sort based on
		// timestamp ... to ensure we process messages in order
		allMessages.forEach(message => {
			message.timestamp = parseInt(message.timetoken, 10) / 10000;
		});
		allMessages.sort((a, b) => {
			return a.timestamp - b.timestamp;
		});

		if (allMessages.length > 0) {
			// store the last message received, so we know where to start from next time
			const lastMessage = allMessages[allMessages.length - 1];
			this.lastHistoryTimeToken = lastMessage.timetoken;
			this.store.dispatch(lastMessageReceived(lastMessage.timetoken));
		} 
		else {
			this.store.dispatch({ type: "CAUGHT_UP" });
		}

		for (var message of allMessages) {
			this.pubnubMessage(message.timetoken, message.entry, { isHistory: true });
		}
	}

	async retrieveChannelHistorySince(channel, timeToken, allMessages) {
		let response = null;
		let retries = 0;
		while (!response) {
			try {
				response = await this.pubnub.history({
					channel: channel,
					reverse: true, // oldest message first
					start: timeToken,
					stringifiedTimeToken: true
				});
			} catch (error) {
				console.warn(`PubNub history failed for ${channel}:`, error);
				if (retries === 5) {
					console.warn(`Giving up fetching history for ${channel}`);
					this.store.dispatch(historyRetrievalFailure());
					return true;
				}
				retries++;
			}
		}
		allMessages.push(...response.messages);
		if (response.messages.length < 100) {
			return true; // resolves the promise
		} else {
			// FIXME: we can't let this go on too deep, there needs to be a limit
			// once we reach that limit, we probably need to just clear the database and
			// refresh the session (like you're coming back from vacation)
			return this.retrieveChannelHistorySince(channel, response.endTimeToken, allMessages);
		}
	}
}

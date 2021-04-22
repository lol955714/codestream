'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');
const Assert = require('assert');

class MessageTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		const type = this.streamType || 'team';
		return `members of the ${type} should receive a message on the ${type} channel with the codemark when someone unfollows a codemark in ${type} by clicking an email link`;
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		if (this.streamType === 'direct') {
			this.skipFollow = true;
			this.expectedVersion = 2;
		}
		this.init(callback);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// since posting to a stream other than the team stream is no longer allowed,
		// just listen on the team channel
		this.channelName = `team-${this.team.id}`;

		/*
		if (!this.isTeamStream) {
			throw 'stream channels are deprecated';
		}
		this.channelName = `team-${this.team.id}`;
		//this.channelName = this.isTeamStream ? `team-${this.team.id}` : `stream-${this.stream.id}`;
		*/
		
		callback();
	}

	// generate the message by issuing a request to relate the codemarks
	generateMessage (callback) {
		this.unfollowCodemark(callback);
	}

	validateMessage (message) {
		Assert(message.message.codemark.$set.modifiedAt >= this.modifiedAfter, 'modifiedAt set in codemark message not properly set');
		this.message.codemark.$set.modifiedAt = message.message.codemark.$set.modifiedAt;
		super.validateMessage(message);
		return true;
	}
}

module.exports = MessageTest;

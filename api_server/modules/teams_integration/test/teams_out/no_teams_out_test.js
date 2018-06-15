'use strict';

const Assert = require('assert');
const TeamsOutTest = require('./teams_out_test');

class NoTeamsOutTest extends TeamsOutTest {

	get description () {
		let streamType = this.streamType === 'channel' ? 
			(this.isTeamStream ? 'team' : 'channel') :
			this.streamType;
		if (this.privacy) {
			streamType = `${this.privacy} ${streamType}`;
		}
		return `when a team has MS Teams integration enabled, a new post in a ${streamType} stream owned by that team should NOT send a message to the slack bot`;
	}

	// called if message doesn't arrive after timeout, in this case, this is what we want
	messageTimeout () {
		this.messageCallback();
	}

	// called when a message has been received, in this case this is bad
	messageReceived (error) {
		if (error) { return this.messageCallback(error); }
		Assert.fail('teams bot message was received');
	}
}

module.exports = NoTeamsOutTest;

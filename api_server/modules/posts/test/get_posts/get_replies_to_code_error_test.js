'use strict';

const GetChildPostsTest = require('./get_child_posts_test');

class GetRepliesToCodeErrorTest extends GetChildPostsTest {

	constructor (options) {
		super(options);
		this.postOptions.creatorIndex = 0;
		this.postOptions.postData[this.whichPostToReplyTo] = { wantCodeError: true };
	}

	get description () {
		return 'should return the correct posts when requesting replies to a code error';
	}

	// set the path for the request
	setPath (callback) {
		super.setPath(() => {
			this.path = `/posts?codeErrorId=${this.postData[this.whichPostToReplyTo].post.codeErrorId}`;
			callback();
		});
	}
}

module.exports = GetRepliesToCodeErrorTest;
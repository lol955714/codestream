// provide basic test class for login request tests

'use strict';

const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const UserTestConstants = require('../user_test_constants');
const UserAttributes = require('../../user_attributes');

class LoginTest extends CodeStreamAPITest {

	get description () {
		return 'should return valid user when doing login';
	}

	get method () {
		return 'put';
	}

	get path () {
		return '/no-auth/login';
	}

	getExpectedFields () {
		return UserTestConstants.EXPECTED_LOGIN_RESPONSE;
	}

	// before the test runs...
	before (callback) {
		// create a random registered user, then prepare to submit the login request
		// with the user's email and password
		const func = this.noConfirm ? 'registerUser' : 'createUser';
		this.userData = this.getUserData();
		this.userFactory[func](this.userData, (error, userData) => {
			if (error) { return callback(error); }
			this.user = userData.user;
			this.data = {
				email: this.user.email,
				password: this.userData.password
			};
			this.accessToken = userData.accessToken;
			this.beforeLogin = Date.now();
			callback();
		});
	}

	getUserData () {
		return this.userFactory.getRandomUserData();
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate we get back the expected user, an access token, and a pubnub subscription key
		Assert(data.user._id === data.user.id, 'id not set to _id');
		Assert(data.user.email === this.data.email, 'email doesn\'t match');
		Assert(data.user.lastLogin > this.beforeLogin, 'lastLogin not set to most recent login time');
		Assert(data.accessToken, 'no access token');
		Assert(data.pubnubKey, 'no pubnub key');
		Assert(data.pubnubToken, 'no pubnub token');
		this.validateSanitized(data.user, UserTestConstants.UNSANITIZED_ATTRIBUTES_FOR_ME);
	}

	// validate that the received user data does not have any attributes a client shouldn't see
	validateSanitized (user, fields) {
		// because me-attributes are usually sanitized out (for other users), but not for the fetching user,
		// we'll need to filter these out before calling the "base" validateSanitized, which would otherwise
		// fail when it sees these attributes
		let meAttributes = Object.keys(UserAttributes).filter(attribute => UserAttributes[attribute].forMe);
		meAttributes.forEach(attribute => {
			let index = fields.indexOf(attribute);
			if (index !== -1) {
				fields.splice(index, 1);
			}
		});
		super.validateSanitized(user, fields);
	}
}

module.exports = LoginTest;

'use strict';

const GetCompanyTest = require('./get_company_test');
const ObjectID = require('mongodb').ObjectID;

class NotFoundTest extends GetCompanyTest {

	get description () {
		return 'should return an error when trying to fetch a company that doesn\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}

	// set the path for the request to test
	setPath (callback) {
		// try to fetch some company that doesn't exist
		this.path = '/companies/' + ObjectID();
		callback();

	}
}

module.exports = NotFoundTest;

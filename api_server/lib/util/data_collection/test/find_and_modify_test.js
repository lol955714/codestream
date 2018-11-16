'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var GetByIdFromDatabaseTest = require('./get_by_id_from_database_test');
var Assert = require('assert');

class FindAndModifyTest extends GetByIdFromDatabaseTest {

	get description () {
		return 'should get the original model, and then the modified model, when performing a find-and-modify operation';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,		// set up mongo client and create a document directly in the database
			this.updateDocument	// do the find-and-modify update
		], callback);
	}

	// run the test...
	run (callback) {
		BoundAsync.series(this, [
			this.checkFetchedDocument,	// we should get the document as it looks after the update
			super.run					// do the overall check of the document
		], callback);
	}

	async updateDocument (callback) {
		// here we're incrementing the number field in the document, but the document we get back
		// from the operation should NOT show the increment ... note that this is a direct-to-database
		// operation, the operation is immediately persisted
		const update = {
			number: 5
		};
		let document;
		try {
			document = await this.data.test.findAndModify(
				{ _id: this.data.test.objectIdSafe(this.testModel.id) },
				{ '$inc': update }
			);
		}
		catch (error) {
			return callback(error);
		}
		this.fetchedDocument = document;	 // this is our fetched document, without the increment
		callback();
	}

	checkFetchedDocument (callback) {
		// first make sure the find-and-modify returned the document without the increment,
		// then run the base-class validation WITH the increment ... this will retrieve the document
		// again, now showing the increment
		this.testModel.attributes.id = this.testModel.attributes._id;
		Assert.deepEqual(this.testModel.attributes, this.fetchedDocument, 'fetched document not equal to test model attributes');
		this.testModel.attributes.number += 5;
		callback();
	}
}

module.exports = FindAndModifyTest;

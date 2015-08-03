var Gini = require('../lib/gini-promise');

var giniClient = new Gini({
	clientId: 'YOUR-CLIENT-ID',
	clientSecret: 'YOUR-CLIENT-SECRET',
	username: 'YOUR-ACCOUNT-USERNAME',
	password: 'YOUR-ACCOUNT-PASSWORD',
});

// get all documents
giniClient.documents.get().then(function(allDocs) {
    console.log(allDocs);
});

// get one specific document
giniClient.documents.get('00000000-0000-0000-0000-000000000000').then(function(doc) {
	console.log(doc);
});

// search for documents
giniClient.search('test', {limit: 5}).then(function(results) {
    console.log(results);
});

// upload new document
gini.documents.post({
	file: 'example.pdf'
}).then(function(response) {
	return gini.request.get(response.location);
}).then(function(uploadedDoc) {
	console.log('Uploaded document:', uploadedDoc);
}).catch(function(err) {
	console.error('ERROR:', err);
});

// usercenter request: create new user
gini.users.post({
	email: "test@example.org",
	password: "supersecret"
}).then(function(response) {
	console.log('New user can be found at', response.location);
}).catch(function(err) {
	console.log('ERROR', err);
});

// get one specific user
gini.users.get('00000000-0000-0000-0000-000000000000').then(function(users) {
	console.log('User:', user);
}).catch(function(err) {
	console.log('ERROR', err);
});
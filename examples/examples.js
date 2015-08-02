var Gini = require('../lib/gini-promise');

var giniClient = new Gini({
	clientId: 'YOUR-CLIENT-ID',
	clientSecret: 'YOUR-CLIENT-SECRET',
	username: 'YOUR-ACCOUNT-USERNAME',
	password: 'YOUR-ACCOUNT-PASSWORD',
});

giniClient.documents.get().then(function(docs) {
	console.log(docs);
});

giniClient.search('test', {limit: 5}).then(function(results) {
    console.log(results);
});

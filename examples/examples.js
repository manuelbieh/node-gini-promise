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
giniClient.documents.post({
    file: 'example.pdf'
}).then(function(response) {
    return giniClient.request.get(response.location);
}).then(function(uploadedDoc) {
    console.log('Uploaded document:', uploadedDoc);
}).catch(function(err) {
    console.error('ERROR:', err);
});

// usercenter request: create new user
giniClient.users.post({
    email: "test@example.org",
    password: "supersecret"
}).then(function(response) {
    console.log('New user can be found at', response.location);
}).catch(function(err) {
    console.log('ERROR', err);
});

// get one specific user
giniClient.users.get('00000000-0000-0000-0000-000000000000').then(function(users) {
    console.log('User:', user);
}).catch(function(err) {
    console.log('ERROR', err);
});

// download all images in 750x900 for a single document
giniClient.documents.downloadImages('00000000-0000-0000-0000-000000000000', {
 	sizes: ['750x900'],
 	filename: '{id}-{size}_{page}'
});
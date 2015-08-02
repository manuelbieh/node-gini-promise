var request = require('request-promise');
var q = require('q');
var fs = require('fs');

var GiniClient = function(opts) {

    var _gini = this;
    var _giniToken;

    var clientId        = opts && opts.clientId;
    var clientSecret    = opts && opts.clientSecret;
    var username        = opts && opts.username;
    var password        = opts && opts.password;

    var apiProtocol     = 'https';
    var apiHost         = 'api.gini.net';
    var userHost        = 'user.gini.net';

    if(!clientId || !clientSecret || !username || !password) {
        throw new Error('Invalid credentials. Please specify clientId, clientSecret, username and password.');
    }

    var _requestWrapper = function() {

        return _gini.getToken().then(function(token) {

            return request.defaults({
                json: true,
                headers: {
                    "Authorization": "BEARER " + token.access_token,
                    "Accept": "application/vnd.gini.v1+json",
                }
            });

        });

    };

    this.tokenInfo = function() {
        return _giniToken;
    };

    this.getToken = function() {

        var dfd = q.defer();

        if(typeof this.tokenInfo() !== 'undefined') {

            dfd.resolve(this.tokenInfo());

        } else {

            request.post('https://' + clientId + ':' + clientSecret + '@' + userHost + '/oauth/token?grant_type=password', {
                json: true,
                form: {
                    username: username,
                    password: password
                },
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Accept": "application/json"
                }
            }).then(function(token) {
                _giniToken = token;
                dfd.resolve(token);
            }).catch(function(err) {
                dfd.reject(err);
            });

        }

        return dfd.promise;

    };

    this.request = {

        get: function() {
            var args = arguments;
            return _requestWrapper().then(function(request) {
                return request.get.apply(request, args);
            });
        },

        post: function() {
            var args = arguments;
            return _requestWrapper().then(function(request) {
                return request.post.apply(request, args);
            });
        },

        delete: function() {
            var args = arguments;
            return _requestWrapper().then(function(request) {
                return request.del.apply(request, args);
            });
        },

        patch: function() {
            var args = arguments;
            return _requestWrapper().then(function(request) {
                return request.patch.apply(request, args);
            });
        },

        put: function() {
            var args = arguments;
            return _requestWrapper().then(function(request) {
                return request.put.apply(request, args);
            });
        }

    };

    this.documents = {

        endpoint: apiProtocol + '://'+ apiHost + '/documents/',

        // @TODO: Add optional parameters
        // @status: works (without optional parameters);
        post: function(opts) {
            return gini.request.post({
                formData: {
                    file: fs.createReadStream(opts.file) // path to file
                }
            });
        },

        // @status: works
        get: function(docId) {
            var docId = docId || '';
            return _gini.request.get(this.endpoint + docId);
        },

        // @status: works
        delete: function(docId) {
            return _gini.request.delete(this.endpoint + docId);
        },

        // @status: works
        extractions: function(docId) {
            return _gini.request.get(this.endpoint + docId + '/extractions');
        },

        // @status: works
        layout: function(docId) {
            return _gini.request.get(this.endpoint + docId + '/layout');
        },

        // @status: experimental/untested
        errorreport: function(docId, error) {
            return _gini.request.post(this.endpoint + docId + '/errorreport', {
                qs: {
                    summary: error.summary,
                    details: error.details
                }
            });
        },

        // @status: experimental/unstested
        bulkPost: function(fileArray) {
            return fileArray.map(function(file) {
                _gini.documents.post({
                    file: file.file
                });
            });
        }

    };

    this.search = function(q, opts) {

        return _gini.request.get(apiProtocol + '://' + apiHost + '/search', {qs: {
            q: q,
            limit: opts && opts.limit || 20,
            offset: opts && opts.offset || 0,
            docType: opts && opts.docType || null
        }});

    };

};

module.exports = GiniClient;

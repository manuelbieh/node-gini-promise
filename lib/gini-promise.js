var request = require('request-promise');
var q = require('q');
var fs = require('fs');

var GiniClient = function(opts) {

    var _gini = this;
    var _giniApiToken;
    var _giniUserCenterToken;

    var clientId        = opts && opts.clientId;
    var clientSecret    = opts && opts.clientSecret;
    var username        = opts && opts.username;
    var password        = opts && opts.password;

    var apiProtocol     = 'https';
    var apiHost         = 'api.gini.net';
    var userHost        = 'user.gini.net';

    var uuidRegex       = new RegExp('[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');

    if(!clientId || !clientSecret || !username || !password) {
        throw new Error('Invalid credentials. Please specify clientId, clientSecret, username and password.');
    }

    var _requestWrapper = function() {

        return _gini.getApiToken().then(function(token) {

            return request.defaults({
                json: true,
                headers: {
                    "Authorization": "BEARER " + token.access_token,
                    "Accept": "application/vnd.gini.v1+json",
                }
            });

        });

    };

    var _userRequestWrapper = function() {

        return _gini.getUserCenterToken().then(function(token) {

            return request.defaults({
                json: true,
                headers: {
                    "Authorization": "BEARER " + token.access_token,
                    "Accept": "application/vnd.gini.v1+json",
                }
            });

        });

    };

    var _request = function(wrapper, verb, args) {

        var wrapper = wrapper || _requestWrapper;
        return wrapper().then(function(request) {
            return request[verb].apply(request, args);
        });

    }

    this.login = function(u, p) {
        username = u;
        password = p;
    };

    this.apiTokenInfo = function() {
        return _giniApiToken;
    };

    this.userCenterTokenInfo = function() {
        return _giniUserCenterToken;
    };

    this.getApiToken = function() {

        var dfd = q.defer();

        if(typeof this.apiTokenInfo() !== 'undefined') {

            dfd.resolve(this.apiTokenInfo());

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
                _giniApiToken = token;
                dfd.resolve(token);
            }).catch(function(err) {
                dfd.reject(err);
            });

        }

        return dfd.promise;

    };

    this.getUserCenterToken = function() {

        var dfd = q.defer();

        if(typeof this.userCenterTokenInfo() !== 'undefined') {

            dfd.resolve(this.userCenterTokenInfo());

        } else {

            request.post('https://' + clientId + ':' + clientSecret + '@' + userHost + '/oauth/token?grant_type=client_credentials', {
                json: true,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Accept": "application/json"
                }
            }).then(function(token) {
                _giniUserCenterToken = token;
                dfd.resolve(token);
            }).catch(function(err) {
                dfd.reject(err);
            });

        }

        return dfd.promise;

    };

    this.userRequest = {

        get: function() {
            return _request(_userRequestWrapper, 'get', arguments);
        },

        post: function() {
            return _request(_userRequestWrapper, 'post', arguments);
        },

        delete: function() {
            return _request(_userRequestWrapper, 'delete', arguments);
        },

        put: function() {
            return _request(_userRequestWrapper, 'put', arguments);
        }

    };

    this.request = {

        get: function() {
            return _request(_requestWrapper, 'get', arguments);
        },

        post: function() {
            return _request(_requestWrapper, 'post', arguments);
        },

        delete: function() {
            return _request(_requestWrapper, 'delete', arguments);
        },

        put: function() {
            return _request(_requestWrapper, 'put', arguments);
        }

    };

    this.documents = {

        endpoint: apiProtocol + '://'+ apiHost + '/documents/',

        // @TODO: Add optional parameters
        // working (without optional parameters)
        post: function(opts) {

            var dfd = q.defer();

            _gini.request.post(this.endpoint, {
                resolveWithFullResponse: true,
                formData: {
                    file: fs.createReadStream(opts.file) // path to file
                }
            }).then(function(response) {

                dfd.resolve({
                    location: response.headers['location'],
                    uuid: uuidRegex.exec(response.headers['location'])[0],
                    status: response.statusCode
                });

            }).catch(function(response) {

                dfd.reject({
                    status: response.statusCode
                });

            });

            return dfd.promise;

        },

        get: function(docId) {
            var docId = docId || '';
            return _gini.request.get(this.endpoint + docId);
        },

        delete: function(docId) {
            return _gini.request.delete(this.endpoint + docId);
        },

        extractions: function(docId) {
            return _gini.request.get(this.endpoint + docId + '/extractions');
        },

        layout: function(docId) {
            return _gini.request.get(this.endpoint + docId + '/layout');
        },

        pages: function(docId) {
            return _gini.request.get(this.endpoint + docId + '/pages');
        },

        // works but is not intended for production use yet
        downloadImages: function(docId, opts) {

            var targetFolder    = opts && opts.targetFolder || '.';
            var filename        = opts && opts.filename || '{id}-{page}-{size}';

            this.get(docId).then(function(doc) {

                var id = doc.id;

                doc.pages.map(function(page) {

                    var pageNum = page.pageNumber;
                    var images = page.images;
                    var sizes = opts && opts.sizes || Object.keys(images);

                    sizes.map(function(size) {

                        _gini.request.get(images[size], {
                            encoding: null,
                            headers: {
                                "Accept": "image/jpeg"
                            }
                        }).then(function(res) {

                            var file = filename
                                .replace('{id}', id)
                                .replace('{page}', pageNum)
                                .replace('{size}', size)
                                .replace(/.jpg$/,'')
                                + '.jpg';

                            var wstream = fs.createWriteStream(targetFolder + '/' + file);
                            wstream.write(res);
                            wstream.end();

                        });

                    });

                });

            });

        },

        // @status: experimental/untested
        errorreport: function(docId, error) {
            return _gini.request.post(this.endpoint + docId + '/errorreport', {
                qs: error
            });
        },

        // @status: experimental/unstested
        // bulkPost: function(fileArray) {
        //     return fileArray.map(function(file) {
        //         _gini.documents.post({
        //             file: file.file
        //         });
        //     });
        // }

    };

    this.search = function(q, opts) {

        return _gini.request.get(apiProtocol + '://' + apiHost + '/search', {qs: {
            q: q,
            limit: opts && opts.limit || 20,
            offset: opts && opts.offset || 0,
            docType: opts && opts.docType || null
        }});

    };


    this.users = {

        endpoint: apiProtocol + '://'+ userHost + '/api/users/',

        get: function(userId) {
            return _gini.userRequest.get(this.endpoint + userId);
        },

        post: function(opts) {

            var dfd = q.defer();

            _gini.userRequest.post(this.endpoint, {
                resolveWithFullResponse: true,
                body: opts
            }).then(function(response) {

                dfd.resolve({
                    location: response.headers['location'],
                    uuid: uuidRegex.exec(response.headers['location'])[0],
                    status: response.statusCode
                });

            }).catch(function(response) {

                dfd.reject({
                    status: response.statusCode
                });

            })

            return dfd.promise;

        },

        put: function(userId, opts) {
            return _gini.userRequest.put(this.endpoint + userId, {body: opts});
        },

        delete: function(userId) {
            return _gini.userRequest.delete(this.endpoint + userId);
        },

        // convenience method
        changePassword: function(userId, oldPw, newPw) {

            return _gini.userRequest.put(this.endpoint + userId, {body: {
                oldPassword: oldPw,
                password: newPw
            }});

        }

    }

};

module.exports = GiniClient;

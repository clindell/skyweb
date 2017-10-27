"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var request = require("request");
var URIObjectService = (function () {
    function URIObjectService(cookieJar, eventEmitter) {
        this.requestWithJar = request.defaults({ jar: cookieJar });
        this.eventEmitter = eventEmitter;
    }
    URIObjectService.prototype.fetchURIObject = function (skypeAccount, uri, referenceId, callback) {
        var _this = this;
        this.requestWithJar.get(uri, {
            headers: {
                'Authorization': 'skype_token ' + skypeAccount.skypeToken,
            }
        }, function (error, response, body) {
            if (!error) {
                console.log('First Step fetchURIObject \n'
                    + 'Response code: ' + response.statusCode);
                var contentType = URIObjectService.getContentType(JSON.parse(body));
                if (contentType == 'unknown') {
                    console.warn('Unknown URIObject content type' + '.\n Body: ' + body);
                    callback(referenceId, false, {});
                    return;
                }
                console.log("Using contentType: " + contentType);
                var requestPath = URIObjectService.getRequestPathForType(uri, contentType);
                console.log("Using requestPath: " + requestPath);
                return _this.downloadFile(skypeAccount, requestPath, contentType, referenceId, callback);
            }
            else {
                _this.eventEmitter.fire('error', 'Failed to fetch image' +
                    '.\n Error code: ' + response +
                    '.\n Error: ' + error +
                    '.\n Body: ' + body);
            }
        });
    };
    URIObjectService.getContentType = function (body) {
        var contentType = 'unknown';
        if (body.type && body.contents) {
            if (body.type == 'pish/image') {
                contentType = 'imgpsh';
            }
            else if (body.contents.imgt1) {
                contentType = 'imgt1';
            }
            else if (body.type == 'sharing/file') {
                if (body.filename) {
                    if (body.filename.indexOf('.gif') > -1) {
                        contentType = 'gif';
                    }
                    else if (body.filename.indexOf('.bmp') > -1) {
                        contentType = 'bmp';
                    }
                    else if (body.filename.indexOf('.tif') > -1) {
                        contentType = 'tif';
                    }
                    else if (body.filename.indexOf('.tga') > -1) {
                        contentType = 'tga';
                    }
                    else {
                        contentType = 'file';
                    }
                }
            }
        }
        return contentType;
    };
    URIObjectService.getRequestPathForType = function (uri, contentType) {
        var path = uri;
        switch (contentType) {
            case 'imgpsh':
                path = path + '/content/imgpsh';
                break;
            case 'imgt1':
                path = path + '/views/imgt1';
                break;
            default:
                path = path + '/content/original';
        }
        return path;
    };
    URIObjectService.prototype.downloadFile = function (skypeAccount, requestPath, type, referenceId, callback) {
        this.requestWithJar.get(requestPath, {
            encoding: null,
            headers: {
                'Authorization': 'skype_token ' + skypeAccount.skypeToken,
            }
        }, function (error, response, body) {
            console.log('Second Step downloadFile \n');
            if (error)
                console.log(error);
            if (response)
                console.log('Response code: ' + response.statusCode);
            if (!error && response.statusCode === 200) {
                var data = { buffer: body, type: type };
                callback(referenceId, true, data);
            }
            else {
                callback(referenceId, false, {});
            }
        });
    };
    return URIObjectService;
}());
exports.URIObjectService = URIObjectService;
exports.default = URIObjectService;
//# sourceMappingURL=uriobject_service.js.map
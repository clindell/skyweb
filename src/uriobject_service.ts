import * as request from 'request';
import * as Consts from './consts';
import SkypeAccount from './skype_account';
import Utils from './utils';
import * as http from 'http';
import {CookieJar} from "request";
import Status from "./status/status";
import {EventEmitter} from "./utils";
import * as fs from 'fs';
import * as Stream from 'stream';

export class URIObjectService {
    private requestWithJar: any;
    private eventEmitter: EventEmitter;

    constructor(cookieJar:CookieJar, eventEmitter: EventEmitter) {
        this.requestWithJar = request.defaults({jar: cookieJar});
        this.eventEmitter = eventEmitter;
    }

    // This method begins the fetching of a URI object. However, it fetches only the data.
    public fetchURIObject(skypeAccount:SkypeAccount, uri: string, referenceId: any, callback:(referenceId: any, success: any, data: {})=>{}) {
        this.requestWithJar.get(uri, {
            headers: {
                'Authorization': 'skype_token ' + skypeAccount.skypeToken,
            }
        }, (error:any, response:http.IncomingMessage, body:any) => {
            if (!error) {
                
                console.log('First Step fetchURIObject \n'
                     + 'Response code: ' + response.statusCode);

                // Identify content type
                var contentType = URIObjectService.getContentType(JSON.parse(body));
                if(contentType == 'unknown') { // Most content will be catch-all:ed into 'file', so this should be a rare case.
                    console.warn('Unknown URIObject content type' + '.\n Body: ' + body);
                    callback(referenceId, false, {});
                    return;
                }
                console.log("Using contentType: " + contentType);

                // Get request path
                var requestPath = URIObjectService.getRequestPathForType(uri, contentType);
                console.log("Using requestPath: " + requestPath);

                // Fetch
                return this.downloadFile(skypeAccount, requestPath, contentType, referenceId, callback);

            } else {
                this.eventEmitter.fire('error', 'Failed to fetch image' +
                    '.\n Error code: ' + response +
                    '.\n Error: ' + error +
                    '.\n Body: ' + body);                
            }
        })

    }

    // What kind of URIObject is this?
    private static getContentType(body: any) {
        var contentType = 'unknown';

        if(body.type && body.contents) {

            // PNG, JPG
            if(body.type == 'pish/image') {
                contentType = 'imgpsh';
            }
            // ? Thumbnail
            else if(body.contents.imgt1) {
                contentType = 'imgt1';
            }
            // GIF, BMP, TIF, TGA, And more
            else if(body.type == 'sharing/file') {
                if(body.filename) {
                    if(body.filename.indexOf('.gif') > -1) {
                        contentType = 'gif';
                    } else if(body.filename.indexOf('.bmp') > -1) {
                        contentType = 'bmp';
                    } else if(body.filename.indexOf('.tif') > -1) {
                        contentType = 'tif';
                    } else if(body.filename.indexOf('.tga') > -1) {
                        contentType = 'tga';
                    } else {
                        contentType = 'file';
                    }
                }
            }
        }

        return contentType;
    }

    // Based on type, how to retrieve the file
    private static getRequestPathForType(uri: string, contentType: string) {
        var path = uri;

        switch(contentType) {
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
    }

    // Download the file behind a URIOBject
    private downloadFile(skypeAccount:SkypeAccount, requestPath: string, type: string, referenceId: any, callback:(referenceId: any, success: any, data: {})=>{}) {

        this.requestWithJar.get(requestPath, {
            encoding: null,
            headers: {
            'Authorization': 'skype_token ' + skypeAccount.skypeToken,
            }
        }, (error:any, response:http.IncomingMessage, body:any) => {
                console.log('Second Step downloadFile \n');
                if(error) console.log(error);
                if(response) console.log('Response code: ' + response.statusCode);

                if (!error && response.statusCode === 200) {
                    var data = {buffer: body, type: type};
                    callback(referenceId, true, data);
                } else {
                    callback(referenceId, false, {});
                }
            });
    }
}

export default URIObjectService;

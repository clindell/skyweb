import SkypeAccount from './skype_account';
import { CookieJar } from "request";
import { EventEmitter } from "./utils";
export declare class URIObjectService {
    private requestWithJar;
    private eventEmitter;
    constructor(cookieJar: CookieJar, eventEmitter: EventEmitter);
    fetchURIObject(skypeAccount: SkypeAccount, uri: string, referenceId: any, callback: (referenceId: any, success: any, data: {}) => {}): void;
    private static getContentType(body);
    private static getRequestPathForType(uri, contentType);
    private downloadFile(skypeAccount, requestPath, type, referenceId, callback);
}
export default URIObjectService;

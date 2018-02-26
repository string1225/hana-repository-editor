'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import { template } from './template';
import "jquery/jquery.d.ts"
// const template = require('./hanaTemplate');

export default class HanaConnector {

    static tokenApi = '/sap/hana/xs/dt/base/server/csrf.xsjs';
    static infoApi = '/sap/hana/xs/dt/base/info';
    static fileApi = '/sap/hana/xs/dt/base/file';
    static transferApi = '/sap/hana/xs/dt/base/xfer/import';

    private _ip: string;
    private _instanceNo: string;
    private _username: string;
    private _password: string;
    private _token: string;
    constructor() {

    };
    private static _getToken(): Promise<string> {
        return new Promise(function (resolve, reject) {
            $.ajax({
                url: this.tokenApi,
                type: 'HEAD',
                headers: { "X-CSRF-Token": "Fetch" },
                success: (data, textStatus, jqXHR) => {
                    if (jqXHR.getResponseHeader("x-sap-login-page")) {
                        return;
                    }
                    this._token = jqXHR.getResponseHeader("X-CSRF-Token");
                    resolve(this._token);
                }
            });
        });
    }
}

function Hana() {

}

Hana.prototype = {
    prepareProject: (context) => {
        let filePath = '';
        if (context && context.fsPath) {
            filePath = context.fsPath;
        } else {
            vscode.window.showOpenDialog({
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false
            }).then((uri) => {
                if (uri) {
                    filePath = uri[0].fsPath;
                } else {
                    vscode.window.showInformationMessage('You cancel the preparation!');
                }
            });
        }
        let bChanged = false;
        for (let i in template) {
            if (!fs.existsSync(filePath + '/' + i)) {
                bChanged = true;
                fs.writeFileSync(filePath + '/' + i, JSON.stringify(template[i]));
            }
        }
        if (bChanged) {
            vscode.window.showInformationMessage('Files are created.');
        } else {
            vscode.window.showInformationMessage('Files are existed. Nothing changed.');
        }
    }
};

module.exports = Hana;
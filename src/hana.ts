'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import template from './template';
const enum Protocal {
    HTTP = "http:",
    HTTPS = "https:"
}

export default class HanaConnector {
    static tokenApi = '/sap/hana/xs/dt/base/server/csrf.xsjs';
    static infoApi = '/sap/hana/xs/dt/base/info';
    static fileApi = '/sap/hana/xs/dt/base/file';
    static transferApi = '/sap/hana/xs/dt/base/xfer/import';

    private _protocol: Protocal;
    private _hostname: string;
    private _port: string;
    private _user: string;
    private _password: string;
    private _token: string;

    constructor() {
        this._protocol = Protocal.HTTP;
        this._hostname = "192.168.1.20";
        this._port = "8090";
        this._password = "SJsj901225";
        this._user = "SYSTEM";
        this.getToken();
    }

    private getToken() {
        http.get({
            protocol: this._protocol,
            hostname: this._hostname,
            port: this._port,
            path: "/sap/hana/xs/dt/base/server/csrf.xsjs",
            headers: {
                "X-CSRF-Token": "Fetch"
            },
            auth: this._user + ":" + this._password
        }, (res) => {
            const { statusCode } = res;
            let error: Error;
            if (statusCode !== 200) {
                error = new Error("Bad Request: " + statusCode);
            } else if (res.headers["x-sap-login-page"]) {
                error = new Error("Wrong User Name or Password.");
            } else if (!res.headers["x-csrf-token"]) {
                error = new Error("Invalid Token.");
            }
            if (error) {
                console.error(error.message);
                res.resume();
                return;
            }
            this._token = String(res.headers["x-csrf-token"]);
            vscode.window.showInformationMessage('HANA is connected!');
        });
    }

    private getFile(filePath: string) {
        let req = http.get({
            protocol: this._protocol,
            hostname: this._hostname,
            port: this._port,
            path: "/sap/hana/xs/dt/base/file/" + filePath,
            headers: {
                "X-CSRF-Token": this._token,
                "Content-Type": "application/json",
                "Slug": ""
            },
        }, (res) => {
            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(rawData);
                    console.log(parsedData);
                } catch (e) {
                    console.error(e.message);
                }
            });
        });
    }

    private getFolder(folderPath: string) {
        let req = http.get({
            protocol: this._protocol,
            hostname: this._hostname,
            port: this._port,
            path: "/sap/hana/xs/dt/base/file/" + folderPath,
            headers: {
                "X-CSRF-Token": this._token,
                "Content-Type": "application/json",
                "Slug": ""
            },
        }, (res) => { });
    }

    private submitFile(filePath: string, fileName: string, data: string) {
        let req = http.request({
            protocol: this._protocol,
            hostname: this._hostname,
            port: this._port,
            method: "POST",
            path: "/sap/hana/xs/dt/base/file/" + filePath,
            headers: {
                "X-CSRF-Token": this._token,
                "Content-Type": "application/json",
                "Slug": fileName,
                "SapBackPack": "{'Activate':true}"
            }
        }, (res) => {
            this.changeFile(filePath, fileName, data);
        });
        req.on("error", (e) => {
            console.error(e.message);
        })
        req.write(data);
        req.end();
    }

    private changeFile(filePath: string, fileName: string, data: string) {
        let req = http.request({
            protocol: this._protocol,
            hostname: this._hostname,
            port: this._port,
            method: "PUT",
            path: "/sap/hana/xs/dt/base/file/" + filePath + fileName,
            headers: {
                "X-CSRF-Token": this._token,
                "Content-Type": "text/plain",
                "SapBackPack": "{'Activate':true}"
            }
        }, (res) => {

        });
        req.on("error", (e) => {
            console.error(e.message);
        })
        req.write(data);
        req.end();
    }

    private submitFolder(folderPath: string, folderName: string) {
        let req = http.request({
            protocol: this._protocol,
            hostname: this._hostname,
            port: this._port,
            method: "POST",
            path: "/sap/hana/xs/dt/base/file/" + folderPath,
            headers: {
                "X-CSRF-Token": this._token,
                "Content-Type": "application/json",
                "Slug": folderName
            }
        }, (res) => { });
        req.on("error", (e) => {
            console.error(e.message);
        })
        req.write({ "Name": folderName, "Directory": "true" });
        req.end();
    }

    private getPath(context) {
        let filePath: string;
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
                    vscode.window.showInformationMessage('Operation is cancelled!');
                }
            });
        }
        return { "path": filePath, "isDirectory": fs.statSync(filePath).isDirectory() };
    }

    private handleHttpError(res) {
        return false;
    }

    public initProject(context) {
        let file = this.getPath(context);
        if (!file.isDirectory) {
            vscode.window.showInformationMessage('Please select a folder to initialize the project file.');
            return;
        }
        let bChanged = false;
        for (let i in template.folder) {
            let currentPath = path.join(file.path, i);
            if (!fs.existsSync(currentPath)) {
                fs.mkdirSync(currentPath);
                bChanged = true;
            }
        }
        for (let i in template.file) {
            let currentPath = path.join(file.path, i);
            if (!fs.existsSync(currentPath)) {
                fs.writeFileSync(currentPath, template.file[i], "utf8");
                bChanged = true;
            }
        }
        if (bChanged) {
            vscode.window.showInformationMessage('Files are created.');
        } else {
            vscode.window.showInformationMessage('Files are existed. Nothing changed.');
        }
    }

    private iterDir(root, callback) {
        let aTemplate = fs.readdirSync(root);
        aTemplate.forEach((x) => {
            let currentPath = path.join(root, x);
            console.log(currentPath);
            let info = fs.statSync(currentPath);
            if (info.isDirectory()) {
                callback(root, x, true);
                this.iterDir(currentPath, callback);
            } else {
                callback(root, x, false);
            }
        });
    };

    public submitProject(context) {
        let file = this.getPath(context);
        let rootName = vscode.workspace.name;

        let root = vscode.workspace.rootPath;
        // let rootSplit = root.split("\\");
        // rootSplit.splice(rootSplit.length - 1, 1);
        // let rootPath = rootSplit.join("\\");
        let relativePath = path.relative(root, file.path);

        this.submitFolder(relativePath, rootName);
        this.iterDir(root, (currentPath, currentFile, isDirectory) => {
            if (isDirectory) {
                this.submitFolder(path.relative(root, currentPath), currentFile);
            } else {
                this.submitFile(path.relative(root, currentPath), currentFile, fs.readFileSync(currentPath, "utf8"));
            }
        });

        // let bChanged = false;
        // for (let i in template) {
        //     if (!fs.existsSync(filePath + '/' + i)) {
        //         bChanged = true;
        //         fs.writeFileSync(filePath + '/' + i, JSON.stringify(template[i]));
        //     }
        // }
        // if (bChanged) {
        //     vscode.window.showInformationMessage('Files are created.');
        // } else {
        //     vscode.window.showInformationMessage('Files are existed. Nothing changed.');
        // }
    }

    public retrieveProject(context) {
        let filePath = '';
        // if (context && context.fsPath) {
        //     filePath = context.fsPath;
        // } else {
        //     vscode.window.showOpenDialog({
        //         canSelectFiles: false,
        //         canSelectFolders: true,
        //         canSelectMany: false
        //     }).then((uri) => {
        //         if (uri) {
        //             filePath = uri[0].fsPath;
        //         } else {
        //             vscode.window.showInformationMessage('You cancel the preparation!');
        //         }
        //     });
        // }
        // let bChanged = false;
        // for (let i in template) {
        //     if (!fs.existsSync(filePath + '/' + i)) {
        //         bChanged = true;
        //         fs.writeFileSync(filePath + '/' + i, JSON.stringify(template[i]));
        //     }
        // }
        // if (bChanged) {
        //     vscode.window.showInformationMessage('Files are created.');
        // } else {
        //     vscode.window.showInformationMessage('Files are existed. Nothing changed.');
        // }
    }

}
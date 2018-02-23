'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
const template = require('./hanaTemplate');

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
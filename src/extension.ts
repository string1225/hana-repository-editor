'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
var hana = require('./hana');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "hana-repository-editor" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let prepareObject = vscode.commands.registerCommand('hana.PrepareProject', (context) => {
        // The code you place here will be executed every time your command is executed
        new hana().prepareProject(context);
        // Display a message box to the user
        // vscode.window.showInformationMessage('Project files are prepared!');
    });

    context.subscriptions.push(prepareObject);
}

// this method is called when your extension is deactivated
export function deactivate() {
}
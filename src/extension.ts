// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as path from 'path';
import * as util from 'util';
const execAsync = util.promisify(exec);

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "init-dev-base-1c" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
    const disposable = vscode.commands.registerCommand('init-dev-base-1c.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from init_dev_base_1C!');
	});

	context.subscriptions.push(disposable);

    const createBaseCmd = vscode.commands.registerCommand('init-dev-base-1c.createBase', async () => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('Рабочая папка не открыта. Откройте папку репозитория.');
            return;
        }

        const config = vscode.workspace.getConfiguration();
        const basesPath = config.get<string>('initDevBase1c.basesPath') || '';
        const srcCf = config.get<string>('initDevBase1c.srcCf') || 'src\\cf';
        const v8version = config.get<string>('initDevBase1c.v8version') || '8.3.24.1667';
        const extensionPath = config.get<string>('initDevBase1c.extensionPath') || '';

        if (!basesPath) {
            const openSettingsAction = 'Открыть настройки';
            const choice = await vscode.window.showWarningMessage(
                'Не указан путь к каталогам ИБ (initDevBase1c.basesPath).',
                openSettingsAction
            );
            if (choice === openSettingsAction) {
                vscode.commands.executeCommand('workbench.action.openSettings', 'initDevBase1c');
            }
            return;
        }

        const terminal = vscode.window.createTerminal({ name: 'Init Dev Base 1C' });
        const scriptPath = context.asAbsolutePath(path.join('scripts', 'init_dev_base.ps1'));

        // Вызываем внешний скрипт .ps1, передавая параметры
        const arg = (label: string, value: string) => ` -${label} '${value.replace(/'/g, "''")}'`;
        const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"` +
            arg('projectPath', workspaceFolder) +
            arg('basesPath', basesPath) +
            arg('src_cf', srcCf) +
            arg('v8version', v8version);

        terminal.show(true);
        terminal.sendText(cmd);
    });

    context.subscriptions.push(createBaseCmd);

    const connectExtensionCmd = vscode.commands.registerCommand('init-dev-base-1c.connectExtension', async () => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('Рабочая папка не открыта. Откройте папку репозитория.');
            return;
        }

        const config = vscode.workspace.getConfiguration();
        const basesPath = config.get<string>('initDevBase1c.basesPath') || '';
        const srcCf = config.get<string>('initDevBase1c.srcCf') || 'src\\cf';
        const v8version = config.get<string>('initDevBase1c.v8version') || '8.3.24.1667';
        const extensionPath = config.get<string>('initDevBase1c.extensionPath') || '';

        if (!basesPath) {
            const openSettingsAction = 'Открыть настройки';
            const choice = await vscode.window.showWarningMessage(
                'Не указан путь к каталогам ИБ (initDevBase1c.basesPath).',
                openSettingsAction
            );
            if (choice === openSettingsAction) {
                vscode.commands.executeCommand('workbench.action.openSettings', 'initDevBase1c');
            }
            return;
        }

        if (!extensionPath) {
            const openSettingsAction = 'Открыть настройки';
            const choice = await vscode.window.showWarningMessage(
                'Не указан путь к расширению (initDevBase1c.extensionPath).',
                openSettingsAction
            );
            if (choice === openSettingsAction) {
                vscode.commands.executeCommand('workbench.action.openSettings', 'initDevBase1c');
            }
            return;
        }

        const terminal = vscode.window.createTerminal({ name: 'Connect Extension 1C' });
        const scriptPath = context.asAbsolutePath(path.join('scripts', 'connect_extension.ps1'));

        // Вызываем отдельный скрипт для подключения расширения
        const arg = (label: string, value: string) => ` -${label} '${value.replace(/'/g, "''")}'`;
        const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"` +
            arg('projectPath', workspaceFolder) +
            arg('basesPath', basesPath) +
            arg('extensionPath', extensionPath) +
            arg('v8version', v8version);

        terminal.show(true);
        terminal.sendText(cmd);
    });

    context.subscriptions.push(connectExtensionCmd);

    // Регистрация webview view провайдера для боковой панели
    const provider: vscode.WebviewViewProvider = {
        resolveWebviewView(webviewView: vscode.WebviewView) {
            webviewView.webview.options = { enableScripts: true };
            const config = vscode.workspace.getConfiguration();
            const html = getSidebarHtml(
                config.get<string>('initDevBase1c.basesPath') || '',
                config.get<string>('initDevBase1c.srcCf') || 'src\\cf',
                config.get<string>('initDevBase1c.v8version') || '8.3.24.1667',
                config.get<string>('initDevBase1c.extensionPath') || ''
            );
            webviewView.webview.html = html;

            webviewView.webview.onDidReceiveMessage(async (msg) => {
                if (msg?.type === 'saveSettings') {
                    await Promise.all([
                        vscode.workspace.getConfiguration().update('initDevBase1c.basesPath', msg.basesPath, vscode.ConfigurationTarget.Global),
                        vscode.workspace.getConfiguration().update('initDevBase1c.srcCf', msg.srcCf, vscode.ConfigurationTarget.Global),
                        vscode.workspace.getConfiguration().update('initDevBase1c.v8version', msg.v8version, vscode.ConfigurationTarget.Global),
                        vscode.workspace.getConfiguration().update('initDevBase1c.extensionPath', msg.extensionPath, vscode.ConfigurationTarget.Global)
                    ]);
                    vscode.window.showInformationMessage('Настройки сохранены');
                }
                if (msg?.type === 'run') {
                    await vscode.commands.executeCommand('init-dev-base-1c.createBase');
                }
                if (msg?.type === 'connectExtension') {
                    await vscode.commands.executeCommand('init-dev-base-1c.connectExtension');
                }
            });
        }
    };
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('initDevBase1c.view', provider));
}

function getSidebarHtml(basesPath: string, srcCf: string, v8version: string, extensionPath: string): string {
    const nonce = Date.now().toString();
    return `<!DOCTYPE html>
    <html lang="ru"><head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      :root {
        color-scheme: light dark;
      }
      body {
        font-family: var(--vscode-font-family);
        padding: 8px;
        color: var(--vscode-foreground);
        background: var(--vscode-sideBar-background);
      }
      .row { margin-bottom: 8px; }
      label { display:block; margin-bottom: 4px; }
      input {
        width: 100%;
        padding: 4px 6px;
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border: 1px solid var(--vscode-input-border, transparent);
        border-radius: 3px;
        box-sizing: border-box;
      }
      button {
        width: 100%;
        padding: 6px 10px;
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border: 1px solid var(--vscode-button-border, transparent);
        border-radius: 3px;
        cursor: pointer;
      }
      button:hover { background: var(--vscode-button-hoverBackground); }
      .hint { color: var(--vscode-descriptionForeground); font-size: 12px; }
    </style>
    </head>
    <body>
      <div class="row">
        <label>Путь к ИБ</label>
        <input id="basesPath" value="${basesPath}" />
      </div>
      <div class="row">
        <label>Путь к конфигурации (srcCf)</label>
        <input id="srcCf" value="${srcCf}" />
      </div>
      <div class="row">
        <label>Версия 1С</label>
        <input id="v8version" value="${v8version}" />
      </div>
      <div class="row">
        <label>Расширение для подключения</label>
        <input id="extensionPath" value="${extensionPath}" />
      </div>
      <div class="row">
        <button id="save">Сохранить настройки</button>
      </div>
      <div class="row">
        <button id="run">Создать ИБ из текущей ветки</button>
      </div>
      <div class="row">
        <button id="connectExtension">Подключить расширение к ИБ текущей ветки</button>
      </div>
      <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        document.getElementById('save').addEventListener('click', () => {
          vscode.postMessage({
            type: 'saveSettings',
            basesPath: document.getElementById('basesPath').value,
            srcCf: document.getElementById('srcCf').value,
            v8version: document.getElementById('v8version').value,
            extensionPath: document.getElementById('extensionPath').value
          });
        });
        document.getElementById('run').addEventListener('click', () => {
          vscode.postMessage({ type: 'run' });
        });
        document.getElementById('connectExtension').addEventListener('click', () => {
          vscode.postMessage({ type: 'connectExtension' });
        });
      </script>
    </body></html>`;
}

export function deactivate() {}

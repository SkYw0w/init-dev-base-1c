import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as path from 'path';
import * as util from 'util';
const execAsync = util.promisify(exec);

interface GitExtension {
    getAPI(version: number): any;
    isActive?: boolean;
    activate?: () => Promise<void>;
}

async function getActiveGitRepository(): Promise<any | null> {
    const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git');

    if (!gitExtension) {
        return null;
    }

    if (!gitExtension.isActive && gitExtension.activate) {
        try {
            await gitExtension.activate();
        } catch {
            // ignore
        }
    }

    const git = gitExtension.exports?.getAPI?.(1);

    if (!git || !git.repositories || git.repositories.length === 0) {
        return null;
    }

    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        const uri = activeEditor.document.uri;
        const repoByEditor = git.getRepository?.(uri);
        if (repoByEditor) {
            return repoByEditor;
        }
    }

    if (git.repositories.length === 1) {
        return git.repositories[0];
    }

    const items: Array<{ label: string; repository: any }> = git.repositories.map((r: any) => ({ label: r.rootUri.fsPath, repository: r }));
    const pick = await vscode.window.showQuickPick(items, { placeHolder: 'Выберите Git репозиторий' });
    return pick?.repository ?? null;
}

async function getActiveWorkspaceFolder(): Promise<string | undefined> {
    const activeRepo = await getActiveGitRepository();
    if (activeRepo) {
        return activeRepo.rootUri.fsPath;
    }
    
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        return undefined;
    }
    
    if (vscode.workspace.workspaceFolders.length === 1) {
        return vscode.workspace.workspaceFolders[0].uri.fsPath;
    }
    
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        const activeFileUri = activeEditor.document.uri;
        const activeWorkspaceFolder = vscode.workspace.getWorkspaceFolder(activeFileUri);
        if (activeWorkspaceFolder) {
            return activeWorkspaceFolder.uri.fsPath;
        }
    }
    
    const folderNames = vscode.workspace.workspaceFolders.map(folder => ({
        label: folder.name,
        description: folder.uri.fsPath,
        folder: folder
    }));
    
    const selectedFolder = await vscode.window.showQuickPick(folderNames, {
        placeHolder: 'Выберите репозиторий',
        title: 'Выбор репозитория'
    });
    
    return selectedFolder?.folder.uri.fsPath;
}

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "init-dev-base-1c" is now active!');

    const disposable = vscode.commands.registerCommand('init-dev-base-1c.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from init_dev_base_1C!');
	});

	context.subscriptions.push(disposable);

    const createBaseCmd = vscode.commands.registerCommand('init-dev-base-1c.createBase', async () => {
        const workspaceFolder = await getActiveWorkspaceFolder();
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('Рабочая папка не открыта. Откройте папку репозитория.');
            return;
        }

        const activeRepo = await getActiveGitRepository();
        const branchName = activeRepo?.state?.HEAD?.name || 'unknown';
        const repoName = path.basename(workspaceFolder);

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

        vscode.window.showInformationMessage(
            `Создание ИБ из репозитория: ${repoName}, ветка: ${branchName}`
        );

        const terminal = vscode.window.createTerminal({ name: 'Init Dev Base 1C' });
        const scriptPath = context.asAbsolutePath(path.join('scripts', 'init_dev_base.ps1'));

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
        const workspaceFolder = await getActiveWorkspaceFolder();
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('Рабочая папка не открыта. Откройте папку репозитория.');
            return;
        }

        const activeRepo = await getActiveGitRepository();
        const branchName = activeRepo?.state?.HEAD?.name || 'unknown';
        const repoName = path.basename(workspaceFolder);

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

        vscode.window.showInformationMessage(
            `Подключение расширения к ИБ репозитория: ${repoName}, ветка: ${branchName}`
        );

        const terminal = vscode.window.createTerminal({ name: 'Connect Extension 1C' });
        const scriptPath = context.asAbsolutePath(path.join('scripts', 'connect_extension.ps1'));

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

import * as vscode from 'vscode';
import { Project, ProjectsNodeProvider } from './projects';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
	const projectsProvider = new ProjectsNodeProvider();
	vscode.window.registerTreeDataProvider('projects', projectsProvider);

	vscode.commands.registerCommand('lsio-projects.addProject', () => {
		vscode.window.showOpenDialog({
			canSelectFiles: false,
			canSelectFolders: true,
			canSelectMany: false,
			title: "Select project root folder",
			openLabel: "Add",
		}).then(uri => {
			if(!uri || uri.length === 0) {
				vscode.window.showErrorMessage("No project selected");
				return;
			}
			const path = uri[0].fsPath;
			const name = path.split('/').pop()?.split("//").pop()?.split("\\").pop() || "New Project";
			projectsProvider.addProject(name, path);
		});
	});
	vscode.commands.registerCommand('lsio-projects.deleteProject', (project: Project) => {
		projectsProvider.deleteProject(project);
	});
	vscode.commands.registerCommand('lsio-projects.nav.moveProjectUp', (project: Project) => {
		projectsProvider.moveProject(project, true);
	});
	vscode.commands.registerCommand('lsio-projects.nav.moveProjectDown', (project: Project) => {
		projectsProvider.moveProject(project, false);
	});
	vscode.commands.registerCommand('lsio-projects.openProject', (project: Project) => {
		if (!fs.existsSync(project.path)) {
			vscode.window.showErrorMessage("Project not found - has it been moved or deleted?");
			return;
		}
		vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(project.path));
	});
	vscode.commands.registerCommand('lsio-projects.renameProject', async (project: Project) => {
		const newName = await vscode.window.showInputBox({
			placeHolder: "Provide a name",
			prompt: "New name",
			value: project.label
		}) || "";
		if(newName === ""){
			vscode.window.showErrorMessage('Please provide some name for this action');
		} else {
			projectsProvider.renameProject(project, newName);
		}
	});
}

// this method is called when your extension is deactivated
export function deactivate() {}

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface ProjectConfig {
    name: string;
    path: string;
}

export class ProjectsNodeProvider implements vscode.TreeDataProvider<Project> {

	private _onDidChangeTreeData: vscode.EventEmitter<Project | undefined | void> = new vscode.EventEmitter<Project | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<Project | undefined | void> = this._onDidChangeTreeData.event;

    private _onDidChangeSelection: vscode.EventEmitter<Project> = new vscode.EventEmitter<Project>();
    readonly onDidChangeSelection: vscode.Event<Project> = this._onDidChangeSelection.event;

	constructor() {
        
	}

	getTreeItem(element: Project): vscode.TreeItem {
		return element;
	}

	getChildren(element?: Project): Thenable<Project[]> {
		const config = vscode.workspace.getConfiguration("lsio-projects");
        const projectConfigs: ProjectConfig[] = config.get("paths") || [];
        const projects = projectConfigs.map(p => new Project(
            p.name, 
            p.path, 
            vscode.TreeItemCollapsibleState.None,
            {
                command: 'lsio-projects.openProject',
                title: '',
                arguments: [p]
            }
        ));

        return Promise.resolve(projects);
	}

    public refresh() {
        this._onDidChangeTreeData.fire();
    }

    public deleteProject(project: Project) {
        const config = vscode.workspace.getConfiguration("lsio-projects");
        const projectConfigs: ProjectConfig[] = (config.get("paths") || []);
        const newProjectConfigs = projectConfigs.filter(p => p.path !== project.path);
        config.update("paths", newProjectConfigs, vscode.ConfigurationTarget.Global).then(() => this.refresh());
    }

    public addProject(name: string, path: string) {
        const config = vscode.workspace.getConfiguration("lsio-projects");
        const projectConfigs: ProjectConfig[] = (config.get("paths") || []);
        if(projectConfigs.findIndex(p => p.path === path) !== -1) {
            vscode.window.showErrorMessage("Projet already exists in project list");
            return;
        }
        const newProjectConfigs = [...projectConfigs, {name, path}];
        config.update("paths", newProjectConfigs, vscode.ConfigurationTarget.Global).then(() => this.refresh());
    }

    public moveProject(project: Project, up: boolean) {
        const config = vscode.workspace.getConfiguration("lsio-projects");
        const projectConfigs: ProjectConfig[] = (config.get("paths") || []);
        if(projectConfigs.length < 2) {
            return;
        }

        const newProjectConfigs: ProjectConfig[] = [];
        const projectIndex = projectConfigs.findIndex(p => p.path === project.path);
        for(let i = 0; i < projectConfigs.length; i++) {
            console.log(`[${i}] = ${projectConfigs[i].name}`);
            if(up && i === projectIndex - 1) {
                newProjectConfigs.push(projectConfigs[projectIndex]);
                newProjectConfigs.push(projectConfigs[i]);
                i++;
            } else if(!up && projectIndex !== projectConfigs.length - 1 && i === projectIndex + 1) {
                newProjectConfigs.push(projectConfigs[i]);
                newProjectConfigs.push(projectConfigs[projectIndex]);
            } else if(!up && i === projectIndex && projectIndex !== projectConfigs.length - 1) {
                continue;
            } else {
                newProjectConfigs.push(projectConfigs[i]);
            }
        }

        config.update("paths", newProjectConfigs, vscode.ConfigurationTarget.Global).then(() => this.refresh());
    }
}

export class Project extends vscode.TreeItem {

	constructor(
		public readonly label: string,
        public readonly path: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);

		this.tooltip = `${this.path}`;
		this.description = "";
        this.iconPath = vscode.ThemeIcon.Folder;
	}

	contextValue = 'dependency';
}
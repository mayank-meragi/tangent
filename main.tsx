import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, View } from 'obsidian';
import * as React from 'react';
import { createRoot, Root } from 'react-dom/client';
import ChatPanelWithProvider from './ChatPanel';
import { streamAIResponse, ConversationMessage } from './ai';
import { MCPServerConfig, MCPServerManager, UnifiedToolManager } from './mcp';
import { getPreconfiguredServers } from './mcp/preconfiguredServers';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
	geminiApiKey?: string;
	mcpEnabled: boolean;
	mcpServers: MCPServerConfig[];
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default',
	geminiApiKey: '',
	mcpEnabled: false,
	mcpServers: [],
};

const CHAT_VIEW_TYPE = 'tangent-chat-view';

class ChatView extends View {
	messages: string[] = [];
	root: Root | null = null;

	constructor(leaf: WorkspaceLeaf, private plugin: MyPlugin) {
		super(leaf);
	}

	getViewType() {
		return CHAT_VIEW_TYPE;
	}

	getDisplayText() {
		return 'Tangent Chat';
	}

	async onOpen() {
		this.renderReact();
	}

	renderReact() {
		const apiKey = this.plugin.settings.geminiApiKey || '';
		
		this.root = createRoot(this.containerEl);
		this.root.render(
			<ChatPanelWithProvider 
				geminiApiKey={apiKey} 
				streamAIResponse={this.streamAIResponse}
				app={this.plugin.app}
				unifiedToolManager={this.plugin.unifiedToolManager}
			/>
		);
	}

	async onClose(): Promise<void> {
		if (this.root) {
			this.root.unmount();
			this.root = null;
		}
	}

	streamAIResponse = async (
		prompt: string,
		onToken: (token: string) => void,
		modelId: string,
		onToolCall?: (toolName: string, toolArgs: any) => void,
		onToolResult?: (toolName: string, result: any) => void,
		onToolsComplete?: (toolResults: string) => void,
		conversationHistory?: ConversationMessage[],
		thinkingBudget?: number,
		onThinking?: (thoughts: string) => void,
		onToolConfirmationNeeded?: (pendingTool: any) => Promise<any>
	) => {
		
		
		// Use conversation history if provided, otherwise build from prompt
		const messages: ConversationMessage[] = conversationHistory && conversationHistory.length > 0 
			? conversationHistory
			: (prompt.trim() ? [{ role: 'user', parts: [{ text: prompt }] }] : []);
		
		await streamAIResponse({
			apiKey: this.plugin.settings.geminiApiKey || '',
			modelId,
			messages,
			onToken,
			onToolCall,
			onToolResult,
			onToolsComplete,
			onThinking,
			onToolConfirmationNeeded,
			app: this.plugin.app,
			thinkingBudget,
			unifiedToolManager: this.plugin.unifiedToolManager,
		});
	};
}

export default class MyPlugin extends Plugin {
	settings!: MyPluginSettings;
	public mcpServerManager!: MCPServerManager;
	public unifiedToolManager!: UnifiedToolManager;

	async onload() {
		await this.loadSettings();

		// Initialize MCP managers
		this.initializeMCP();

		// Register the chat view
		this.registerView(
			CHAT_VIEW_TYPE,
			(leaf) => new ChatView(leaf, this)
		);

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// Add a ribbon icon to open the right panel with chat view
		const openRightPanelRibbon = this.addRibbonIcon('right-arrow', 'Open Chat Panel', async () => {
			// Open the right sidebar/panel
			// @ts-ignore: rightSplit is not in the official types but exists in Obsidian
			this.app.workspace.rightSplit.expand();

			// Try to find an existing chat view in the right sidebar
			let chatLeaf = this.app.workspace.getLeavesOfType(CHAT_VIEW_TYPE).find(leaf => (leaf.getRoot() as any).side === 'right');
			if (!chatLeaf) {
				// @ts-ignore: getRightLeaf is not in the official types but exists in Obsidian
				chatLeaf = this.app.workspace.getRightLeaf(false);
				if (chatLeaf) {
					await chatLeaf.setViewState({
						type: CHAT_VIEW_TYPE,
						active: true,
					});
				}
			} else {
				this.app.workspace.revealLeaf(chatLeaf);
			}
		});
		openRightPanelRibbon.addClass('open-right-panel-ribbon');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, ctx: MarkdownView | any) => {
				if (ctx instanceof MarkdownView) {
					
					editor.replaceSelection('Sample Editor Command');
				}
			},
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// Add MCP server manager command
		this.addCommand({
			id: 'open-mcp-server-manager',
			name: 'Open MCP Server Manager',
			callback: () => {
				new MCPServerManagerModal(this.app, this).open();
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new GeminiSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {

		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
		(window as any).tangentPluginInstance = this;
	}

	onunload() {
		// Cleanup MCP managers
		if (this.mcpServerManager) {
			this.mcpServerManager.cleanup();
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		console.log('Loaded settings:', this.settings);
	}

	/**
	 * Initialize MCP managers
	 */
	private initializeMCP(): void {
		// Initialize MCP server manager with settings change callback
		this.mcpServerManager = new MCPServerManager((servers) => {
			console.log('Server manager callback triggered with servers:', servers);
			this.settings.mcpServers = servers;
			this.saveSettings();
		});

		// Initialize unified tool manager
		this.unifiedToolManager = new UnifiedToolManager(
			this.app,
			this.mcpServerManager.getClient(),
			this.mcpServerManager.getSecurityManager()
		);

		// Wire up the tool manager to the server manager
		this.mcpServerManager.setUnifiedToolManager(this.unifiedToolManager);

		// Load server configurations from settings
		this.mcpServerManager.loadServerConfigurations(this.settings.mcpServers);

		// Start enabled servers if MCP is enabled
		if (this.settings.mcpEnabled) {
			this.startEnabledMCPServers();
		}
	}

	/**
	 * Start enabled MCP servers
	 */
	public async startEnabledMCPServers(): Promise<void> {
		try {
			await this.mcpServerManager.startAllEnabledServers();
		} catch (error) {
			console.error('Failed to start MCP servers:', error);
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
		console.log('Saved settings:', this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class MCPServerManagerModal extends Modal {
	private preconfiguredServers: MCPServerConfig[] = [];
	
	constructor(app: App, private plugin: MyPlugin) {
		super(app);
	}

	async onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl('h2', { text: 'MCP Server Manager' });
		
		// Load preconfigured servers
		try {
			this.preconfiguredServers = await getPreconfiguredServers();
		} catch (error) {
			console.error('Failed to load preconfigured servers:', error);
			this.preconfiguredServers = [];
		}
		
		// Create a simple server management interface
		const container = contentEl.createDiv('mcp-server-manager-modal');
		
		// Show current servers
		const servers = this.plugin.mcpServerManager.getAllServerConfigs();
		const serverStatuses = this.plugin.mcpServerManager.getAllServerStatuses();
		
		if (servers.length === 0) {
			container.createEl('p', { text: 'No MCP servers configured. Add a server to get started.' });
		} else {
			servers.forEach(server => {
				const status = serverStatuses.find(s => s.name === server.name);
				const serverEl = container.createDiv('server-item');
				serverEl.createEl('h3', { text: server.name });
				serverEl.createEl('p', { text: server.description || 'No description' });
				serverEl.createEl('p', { text: `Status: ${status?.status || 'unknown'}` });

				if ((status?.status || 'stopped') === 'stopped') {
					const instructions = serverEl.createEl('div', { cls: 'mcp-server-instructions' });
					instructions.innerHTML = `
						<b>This server is currently stopped.</b><br>
						To start it, make sure it is enabled and then click the <b>Start</b> (▶️) button above.<br>
						If this is your first time, you may need to install the MCP servers package:<br>
						<code>npm install -g @modelcontextprotocol/servers</code><br>
						The plugin will automatically launch the server for you when you click Start.
					`;
				}
				
				// Add controls
				const controls = serverEl.createDiv('server-controls');
				
				// Enable/disable toggle
				const toggleEl = controls.createEl('button', { 
					text: server.enabled ? 'Disable' : 'Enable',
					cls: server.enabled ? 'mod-warning' : 'mod-cta'
				});
				toggleEl.onclick = async () => {
					this.plugin.mcpServerManager.setServerEnabled(server.name, !server.enabled);
					this.onOpen(); // Refresh the modal
				};

				// Start/stop button
				const isRunning = this.plugin.mcpServerManager.isServerRunning(server.name);
				const startStopEl = controls.createEl('button', { 
					text: isRunning ? 'Stop' : 'Start',
					cls: isRunning ? 'mod-warning' : 'mod-cta'
				});
				startStopEl.onclick = async () => {
					try {
						if (isRunning) {
							await this.plugin.mcpServerManager.stopServer(server.name);
						} else {
							await this.plugin.mcpServerManager.startServer(server.name);
						}
						this.onOpen(); // Refresh the modal
					} catch (error) {
						console.error('Failed to start/stop server:', error);
						new Notice(`Failed to ${isRunning ? 'stop' : 'start'} server: ${error}`);
					}
				};

				// Remove button
				controls.createEl('button', { text: 'Remove', cls: 'mod-danger' }).onclick = async () => {
					await this.plugin.mcpServerManager.removeServer(server.name);
					this.onOpen(); // Refresh the modal
				};
			});
		}
		
		// Add server button
		const addButton = container.createEl('button', { text: 'Add Pre-configured Server' });
		addButton.onclick = () => {
			this.showAddServerDialog(container);
		};
	}

	showAddServerDialog(container: HTMLElement) {
		const dialog = container.createDiv('add-server-dialog');
		dialog.createEl('h3', { text: 'Add Server' });
		
		const select = dialog.createEl('select');
		select.createEl('option', { text: 'Select a server...', value: '' });
		
		// Add pre-configured servers
		this.preconfiguredServers.forEach((server: any) => {
			select.createEl('option', { 
				text: `${server.name} - ${server.description}`, 
				value: server.name 
			});
		});
		
		const addButton = dialog.createEl('button', { text: 'Add' });
		addButton.onclick = async () => {
			const selectedServer = this.preconfiguredServers.find((s: any) => s.name === select.value);
			if (selectedServer) {
				this.plugin.mcpServerManager.addServer(selectedServer);
				this.onOpen(); // Refresh the modal
			}
		};
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class GeminiSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// Gemini API Key Setting
		new Setting(containerEl)
			.setName('Gemini API Key')
			.setDesc('Enter your Gemini API key for AI chat.')
			.addText(text => text
				.setPlaceholder('API Key')
				.setValue(this.plugin.settings.geminiApiKey || '')
				.onChange(async (value) => {
					this.plugin.settings.geminiApiKey = value;
					await this.plugin.saveSettings();
				})
			);

		// MCP Settings Section
		containerEl.createEl('h2', { text: 'Model Context Protocol (MCP)' });

		new Setting(containerEl)
			.setName('Enable MCP')
			.setDesc('Enable Model Context Protocol support for additional tools and capabilities.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.mcpEnabled)
				.onChange(async (value) => {
					this.plugin.settings.mcpEnabled = value;
					await this.plugin.saveSettings();
					
					// Start/stop servers based on setting
					if (value) {
						this.plugin.startEnabledMCPServers();
					} else {
						this.plugin.mcpServerManager?.stopAllServers();
					}
				})
			);

		// MCP Server Management Section
		if (this.plugin.settings.mcpEnabled) {
			const mcpContainer = containerEl.createDiv('mcp-settings');
			mcpContainer.createEl('h3', { text: 'MCP Servers' });
			
			// Add a button to open MCP server manager modal
			new Setting(mcpContainer)
				.setName('Manage MCP Servers')
				.setDesc('Add, remove, and configure MCP servers.')
				.addButton(button => button
					.setButtonText('Open Server Manager')
					.onClick(() => {
						new MCPServerManagerModal(this.app, this.plugin).open();
					})
				);
		}
	}
}

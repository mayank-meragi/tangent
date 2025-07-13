import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, ItemView } from 'obsidian';
import * as React from 'react';
import { createRoot, Root } from 'react-dom/client';
import ChatPanelWithProvider from './ChatPanel';
import { streamAIResponse } from './ai';
import { MCPServerConfig, MCPServerManager, UnifiedToolManager } from './mcp';
import { getPreconfiguredServers, getAvailablePreconfiguredServers, getServerInstallationInstructions, getCommandDiagnosticInfo, checkMemoryFileAccess, checkGoogleCalendarCredentials } from './mcp/preconfiguredServers';
import { getObsidianTasksGlobalFilter, convertTasksFilterToDataviewConditions } from './tools/dataviewTasks';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
	geminiApiKey?: string;
	mcpEnabled: boolean;
	mcpServers: MCPServerConfig[];
	mcpGlobalEnv: Record<string, string>;
	mcpSettings: {
		defaultTimeout: number;
		maxRetryAttempts: number;
		enableLogging: boolean;
		logLevel: 'debug' | 'info' | 'warn' | 'error';
	};
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default',
	mcpEnabled: false,
	mcpServers: [],
	mcpGlobalEnv: {},
	mcpSettings: {
		defaultTimeout: 30,
		maxRetryAttempts: 3,
		enableLogging: true,
		logLevel: 'info'
	}
};

export default class MyPlugin extends Plugin {
	settings!: MyPluginSettings;
	public mcpServerManager!: MCPServerManager;
	public unifiedToolManager!: UnifiedToolManager;
	public chatPanelRoot: Root | null = null;
	private chatPanelLeaf: WorkspaceLeaf | null = null;

	async onload() {
		await this.loadSettings();

		// Register the custom view type
		this.registerView('tangent-chat', (leaf: WorkspaceLeaf) => {
			return new ChatPanelView(leaf, this);
		});

		// Make plugin instance globally accessible for ChatPanel component
		(window as any).tangentPluginInstance = this;

		// Initialize MCP managers
		this.initializeMCP();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('message-circle', 'Tangent Chat', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			this.openChatPanel();
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Tangent Chat');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-tangent-chat',
			name: 'Open Tangent Chat',
			callback: () => {
				this.openChatPanel();
			}
		});

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, ctx: MarkdownView | any) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
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

		// Add debug command for Tasks plugin integration
		this.addCommand({
			id: 'debug-tasks-integration',
			name: 'Debug Tasks Plugin Integration',
			callback: () => {
				this.debugTasksIntegration();
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new GeminiSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			// console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {
		// Cleanup MCP managers
		if (this.mcpServerManager) {
			this.mcpServerManager.cleanup();
		}

		// Cleanup React root
		if (this.chatPanelRoot) {
			this.chatPanelRoot.unmount();
			this.chatPanelRoot = null;
		}

		// Close any open chat panels
		const existingLeaves = this.app.workspace.getLeavesOfType('tangent-chat');
		existingLeaves.forEach(leaf => {
			this.app.workspace.detachLeavesOfType('tangent-chat');
		});

		// Clean up global reference
		delete (window as any).tangentPluginInstance;
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	/**
	 * Initialize MCP managers
	 */
	private async initializeMCP(): Promise<void> {
		// Initialize unified tool manager
		this.unifiedToolManager = new UnifiedToolManager(
			this.app,
			undefined // We'll set the client after MCPServerManager is created
		);

		// Initialize MCP server manager with settings change callback and unified tool manager
		this.mcpServerManager = new MCPServerManager((servers) => {
			console.log('Server manager callback triggered with servers:', servers);
			this.settings.mcpServers = servers;
			this.saveSettings();
		}, this.unifiedToolManager);

		// Set the client for the unified tool manager
		this.unifiedToolManager.mcpClient = this.mcpServerManager.getClient();

		// Load server configurations from settings
		await this.mcpServerManager.loadServers(this.settings.mcpServers);
	}

	openChatPanel() {
		// Check if chat panel is already open
		const existingLeaf = this.app.workspace.getLeavesOfType('tangent-chat');
		if (existingLeaf.length > 0) {
			this.app.workspace.revealLeaf(existingLeaf[0]);
			return;
		}

		// Create new leaf
		this.chatPanelLeaf = this.app.workspace.getRightLeaf(false);
		if (this.chatPanelLeaf) {
			this.chatPanelLeaf.setViewState({
				type: 'tangent-chat',
				active: true,
			});

			// Activate the leaf
			this.app.workspace.revealLeaf(this.chatPanelLeaf);
		}
	}

	async debugTasksIntegration() {
		console.log('🔍 DEBUGGING TASKS PLUGIN INTEGRATION');
		console.log('=====================================');
		
		// Show all available plugins
		const allPlugins = (this.app as any).plugins.plugins;
		console.log('All available plugins:', Object.keys(allPlugins));
		
		// Check for Tasks plugin with different possible IDs
		const possiblePluginIds = [
			'obsidian-tasks',
			'tasks',
			'obsidian-tasks-group',
			'obsidian-tasks-group-obsidian-tasks',
			'obsidian-tasks-plugin'
		];
		
		console.log('Looking for Tasks plugin with IDs:', possiblePluginIds);
		
		for (const id of possiblePluginIds) {
			const plugin = allPlugins[id];
			if (plugin) {
				console.log(`Found plugin with ID '${id}':`, {
					enabled: plugin.enabled,
					hasSettings: !!plugin.settings,
					hasInstance: !!plugin.instance,
					hasData: !!plugin.data,
					hasLoadData: !!plugin.loadData,
					properties: Object.keys(plugin)
				});
			}
		}
		
		// Try to get global filter
		const globalFilter = await getObsidianTasksGlobalFilter(this.app);
		console.log('Global filter:', globalFilter);
		
		if (globalFilter) {
			const conditions = convertTasksFilterToDataviewConditions(globalFilter);
			console.log('Converted conditions:', conditions);
		}
		
		// Test with a simple query
		console.log('\nTesting with sample tasks...');
		const sampleTasks = [
			'- [ ] #task this is a task 📅 2025-07-14',
			'- [ ] this is not a task 📅 2025-07-14'
		];
		
		sampleTasks.forEach((taskLine, index) => {
			console.log(`Task ${index + 1}: ${taskLine}`);
		});
		
		console.log('\nDebug complete. Check console for details.');
		new Notice('Tasks integration debug complete. Check console for details.');
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
		
		// Create the main container
		const container = contentEl.createDiv('mcp-server-manager-modal');
		
		// Create tabs for different sections
		const tabsContainer = container.createDiv('mcp-tabs');
		const currentServersTab = tabsContainer.createEl('button', { 
			text: 'Current Servers',
			cls: 'mcp-tab active'
		});
		const addServersTab = tabsContainer.createEl('button', { 
			text: 'Add Servers',
			cls: 'mcp-tab'
		});
		
		// Create content areas
		const currentServersContent = container.createDiv('mcp-tab-content active');
		const addServersContent = container.createDiv('mcp-tab-content');
		
		// Tab switching logic
		currentServersTab.addEventListener('click', () => {
			tabsContainer.querySelectorAll('.mcp-tab').forEach(tab => tab.removeClass('active'));
			container.querySelectorAll('.mcp-tab-content').forEach(content => content.removeClass('active'));
			currentServersTab.addClass('active');
			currentServersContent.addClass('active');
		});
		
		addServersTab.addEventListener('click', () => {
			tabsContainer.querySelectorAll('.mcp-tab').forEach(tab => tab.removeClass('active'));
			container.querySelectorAll('.mcp-tab-content').forEach(content => content.removeClass('active'));
			addServersTab.addClass('active');
			addServersContent.addClass('active');
		});
		
		// Populate current servers tab
		this.populateCurrentServersTab(currentServersContent);
		
		// Populate add servers tab
		this.populateAddServersTab(addServersContent);
	}

	private populateCurrentServersTab(container: HTMLElement) {
		const serverStatuses = this.plugin.mcpServerManager.getAllServerStatuses();
		
		if (serverStatuses.length === 0) {
			container.createEl('p', { text: 'No MCP servers configured. Switch to the "Add Servers" tab to add preconfigured servers.' });
			return;
		}
		
		// Create server list
		const serverList = container.createDiv('server-list');
		
		serverStatuses.forEach((status) => {
			const serverEl = serverList.createDiv('server-item');
			const header = serverEl.createDiv('server-header');
			
			// Server name and status
			header.createEl('h3', { text: status.name });
			header.createEl('span', { 
				text: status.status,
				cls: `status-badge status-${status.status}`
			});
			
			// Server details
			const details = serverEl.createDiv('server-details');
			const config = this.plugin.mcpServerManager.getServerConfig(status.name);
			
			if (config) {
				details.createEl('p', { text: `Command: ${config.command} ${config.args?.join(' ') || ''}` });
				details.createEl('p', { text: `Transport: ${config.transport}` });
				details.createEl('p', { text: `Timeout: ${config.timeout}s` });
			}
			
			// Error display
			if (status.lastError) {
				details.createEl('p', { 
					text: `Error: ${status.lastError}`, 
					cls: 'error-message' 
				});
				
				// Add diagnostic information for common errors
				if (status.lastError.includes('ENOENT') || status.lastError.includes('spawn')) {
					const config = this.plugin.mcpServerManager.getServerConfig(status.name);
					if (config && config.command) {
						const diagnosticInfo = getCommandDiagnosticInfo(config.command);
						const diagnosticEl = details.createEl('div', { cls: 'diagnostic-info' });
						diagnosticEl.innerHTML = `<strong>Diagnostic Information:</strong><br>${diagnosticInfo}`;
					}
				}
				
				// Special handling for memory server errors
				if (status.name === 'memory' && status.lastError.includes('memory.json')) {
					const memoryStatus = checkMemoryFileAccess();
					const memoryEl = details.createEl('div', { cls: 'memory-status' });
					
					if (!memoryStatus.exists) {
						memoryEl.innerHTML = `
							<strong>Memory File Status:</strong><br>
							❌ Memory file does not exist at: ${memoryStatus.path}<br>
							The plugin will automatically create this file when starting the memory server.
						`;
					} else if (!memoryStatus.accessible) {
						memoryEl.innerHTML = `
							<strong>Memory File Status:</strong><br>
							⚠️ Memory file exists but is not accessible: ${memoryStatus.path}<br>
							Error: ${memoryStatus.error}<br>
							Please check file permissions.
						`;
					}
				}

				// Special handling for Google Calendar server
				if (status.name === 'google-calendar') {
					const config = this.plugin.mcpServerManager.getServerConfig(status.name);
					if (config && config.env) {
						const credentialsPath = config.env.GOOGLE_OAUTH_CREDENTIALS as string;
						const credentialsStatus = checkGoogleCalendarCredentials(credentialsPath);
						const calendarEl = details.createEl('div', { cls: 'google-calendar-status' });
						
						if (!credentialsStatus.exists) {
							calendarEl.innerHTML = `
								<strong>Google Calendar Credentials Status:</strong><br>
								❌ Credentials not configured<br>
								Error: ${credentialsStatus.error}<br>
								Please set the GOOGLE_OAUTH_CREDENTIALS environment variable to your OAuth credentials file path.
							`;
						} else if (!credentialsStatus.valid) {
							calendarEl.innerHTML = `
								<strong>Google Calendar Credentials Status:</strong><br>
								⚠️ Credentials file exists but is invalid<br>
								Path: ${credentialsStatus.path}<br>
								Error: ${credentialsStatus.error}<br>
								Please check your OAuth credentials file format.
							`;
						} else {
							calendarEl.innerHTML = `
								<strong>Google Calendar Credentials Status:</strong><br>
								✅ Credentials configured and valid<br>
								Path: ${credentialsStatus.path}
							`;
						}
					}
				}
			}
			
			// Installation instructions for stopped servers
			if (status.status === 'stopped') {
				const instructions = details.createEl('div', { cls: 'installation-instructions' });
				const instructionsText = getServerInstallationInstructions(status.name);
				if (instructionsText) {
					instructions.innerHTML = `<strong>Installation Instructions:</strong><br>${instructionsText}`;
				}
			}
			
			// Server controls
			const controls = serverEl.createDiv('server-controls');
			
			// Enable/disable toggle
			const configEl = this.plugin.mcpServerManager.getServerConfig(status.name);
			if (configEl) {
				const toggleContainer = controls.createDiv('toggle-container');
				toggleContainer.createEl('span', { text: 'Enabled:' });
				const toggle = toggleContainer.createEl('input', { type: 'checkbox' });
				toggle.checked = configEl.enabled || false;
				
				toggle.addEventListener('change', async () => {
					try {
						this.plugin.mcpServerManager.updateServerConfig(status.name, { enabled: toggle.checked });
						this.onOpen(); // Refresh the modal
					} catch (error) {
						console.error('Failed to update server config:', error);
						new Notice(`Failed to update server: ${error}`);
					}
				});
			}
			
			// Start/stop button
			const isRunning = status.status === 'running';
			const startStopEl = controls.createEl('button', { 
				text: isRunning ? 'Stop' : 'Start',
				cls: isRunning ? 'mod-warning' : 'mod-cta'
			});
			
			startStopEl.addEventListener('click', async () => {
				try {
					if (isRunning) {
						await this.plugin.mcpServerManager.stopServer(status.name);
					} else {
						await this.plugin.mcpServerManager.startServer(status.name);
					}
					this.onOpen(); // Refresh the modal
				} catch (error) {
					console.error(`Failed to ${isRunning ? 'stop' : 'start'} server:`, error);
					new Notice(`Failed to ${isRunning ? 'stop' : 'start'} server: ${error}`);
				}
			});
			
			// Remove button
			const removeEl = controls.createEl('button', { 
				text: 'Remove',
				cls: 'mod-warning'
			});
			
			removeEl.addEventListener('click', async () => {
				try {
					await this.plugin.mcpServerManager.removeServer(status.name);
					new Notice(`Server '${status.name}' removed successfully`);
					this.onOpen(); // Refresh the modal
				} catch (error) {
					console.error('Failed to remove server:', error);
					new Notice(`Failed to remove server: ${error}`);
				}
			});

			// Configuration button for Google Calendar
			if (status.name === 'google-calendar') {
				const configEl = controls.createEl('button', { 
					text: 'Configure Credentials',
					cls: 'mod-cta'
				});
				
				configEl.addEventListener('click', () => {
					this.showGoogleCalendarConfig(status.name);
				});
			}
		});
	}

	private populateAddServersTab(container: HTMLElement) {
		// Get current server configurations
		const currentServers = this.plugin.mcpServerManager.getAllServerConfigs();
		
		// Get available preconfigured servers
		const availableServers = getAvailablePreconfiguredServers(currentServers);
		
		if (availableServers.length === 0) {
			container.createEl('p', { text: 'All preconfigured servers are already added to your configuration.' });
			return;
		}
		
		// Create server list
		const serverList = container.createDiv('available-servers-list');
		
		availableServers.forEach(server => {
			const serverEl = serverList.createDiv('available-server-item');
			
			// Server header
			const header = serverEl.createDiv('server-header');
			header.createEl('h3', { text: server.name });
			
			// Server details
			const details = serverEl.createDiv('server-details');
			details.createEl('p', { text: `Command: ${server.command} ${server.args?.join(' ') || ''}` });
			details.createEl('p', { text: `Transport: ${server.transport}` });
			details.createEl('p', { text: `Timeout: ${server.timeout}s` });
			
			// Description based on server type
			let description = '';
			switch (server.name) {
				case 'time':
					description = 'Provides current time and date information. Useful for time-sensitive operations and scheduling.';
					break;
				case 'memory':
					description = 'Provides persistent memory capabilities. Stores and retrieves information across conversations.';
					break;
				case 'filesystem':
					description = 'Provides file and directory operations. Read, write, and manage files on your system.';
					break;
				case 'git':
					description = 'Provides Git repository operations. Commit, push, pull, and manage version control.';
					break;
				case 'search':
					description = 'Provides file and content search capabilities. Find files and text across your system.';
					break;
				case 'google-calendar':
					description = 'Provides Google Calendar integration. Create, update, delete, and search calendar events. Requires OAuth setup.';
					break;
				default:
					description = 'MCP server providing additional tools and capabilities.';
			}
			details.createEl('p', { text: description, cls: 'server-description' });
			
			// Installation instructions
			const instructions = getServerInstallationInstructions(server.name);
			if (instructions) {
				const instructionsEl = details.createEl('div', { cls: 'installation-instructions' });
				instructionsEl.innerHTML = `<strong>Installation Instructions:</strong><br>${instructions}`;
			}
			
			// Add button
			const addEl = serverEl.createEl('button', { 
				text: 'Add Server',
				cls: 'mod-cta'
			});
			
			addEl.addEventListener('click', async () => {
				try {
					await this.plugin.mcpServerManager.addServer({ ...server, enabled: false });
					new Notice(`Server '${server.name}' added successfully`);
					this.onOpen(); // Refresh the modal
				} catch (error) {
					console.error('Failed to add server:', error);
					new Notice(`Failed to add server: ${error}`);
				}
			});
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}

	private showGoogleCalendarConfig(serverName: string) {
		const config = this.plugin.mcpServerManager.getServerConfig(serverName);
		if (!config) return;

		const currentPath = config.env?.GOOGLE_OAUTH_CREDENTIALS as string || '';
		
		const modal = new Modal(this.app);
		modal.titleEl.setText('Configure Google Calendar Credentials');
		
		const content = modal.contentEl.createDiv('google-calendar-config');
		
		// Instructions
		content.createEl('p', { 
			text: 'Set the path to your Google OAuth credentials JSON file:',
			cls: 'config-instructions'
		});
		
		// File path input
		const inputContainer = content.createDiv('input-container');
		const input = inputContainer.createEl('input', {
			type: 'text',
			placeholder: '/path/to/your/gcp-oauth.keys.json',
			value: currentPath
		});
		
		// Browse button
		const browseBtn = inputContainer.createEl('button', {
			text: 'Browse',
			cls: 'mod-cta'
		});
		
		browseBtn.addEventListener('click', () => {
			// Create a file input element
			const fileInput = document.createElement('input');
			fileInput.type = 'file';
			fileInput.accept = '.json';
			fileInput.style.display = 'none';
			
			fileInput.addEventListener('change', (event) => {
				const target = event.target as HTMLInputElement;
				if (target.files && target.files[0]) {
					const file = target.files[0];
					// For security reasons, we can't get the full path in the browser
					// So we'll just show the filename and let user enter the full path
					input.value = file.name;
				}
			});
			
			fileInput.click();
		});
		
		// Validation status
		const statusEl = content.createDiv('validation-status');
		const updateValidation = () => {
			const path = input.value.trim();
			const status = checkGoogleCalendarCredentials(path);
			
			if (!status.exists) {
				statusEl.innerHTML = `<span style="color: red;">❌ ${status.error}</span>`;
			} else if (!status.valid) {
				statusEl.innerHTML = `<span style="color: orange;">⚠️ ${status.error}</span>`;
			} else {
				statusEl.innerHTML = `<span style="color: green;">✅ Credentials file is valid</span>`;
			}
		};
		
		input.addEventListener('input', updateValidation);
		updateValidation();
		
		// Setup instructions
		const instructionsEl = content.createDiv('setup-instructions');
		instructionsEl.innerHTML = `
			<strong>Setup Instructions:</strong><br>
			1. Go to <a href="https://console.cloud.google.com" target="_blank">Google Cloud Console</a><br>
			2. Create a project and enable Google Calendar API<br>
			3. Create OAuth 2.0 credentials (Desktop app type)<br>
			4. Download the JSON credentials file<br>
			5. Enter the full path to the file above
		`;
		
		// Buttons
		const buttonContainer = content.createDiv('button-container');
		
		const saveBtn = buttonContainer.createEl('button', {
			text: 'Save',
			cls: 'mod-cta'
		});
		
		const cancelBtn = buttonContainer.createEl('button', {
			text: 'Cancel',
			cls: 'mod-warning'
		});
		
		saveBtn.addEventListener('click', async () => {
			try {
				const newPath = input.value.trim();
				const newEnv = { ...config.env, GOOGLE_OAUTH_CREDENTIALS: newPath };
				
				this.plugin.mcpServerManager.updateServerConfig(serverName, {
					env: newEnv
				});
				
				new Notice('Google Calendar credentials updated successfully');
				modal.close();
				this.onOpen(); // Refresh the modal
			} catch (error) {
				console.error('Failed to update credentials:', error);
				new Notice(`Failed to update credentials: ${error}`);
			}
		});
		
		cancelBtn.addEventListener('click', () => {
			modal.close();
		});
		
		modal.open();
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
					
					// Note: Server management is now simplified
					// Servers are started/stopped individually through the UI
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

			// MCP Global Settings
			mcpContainer.createEl('h3', { text: 'MCP Global Settings' });

			new Setting(mcpContainer)
				.setName('Default Timeout')
				.setDesc('Default timeout for MCP tool calls (seconds)')
				.addSlider(slider => slider
					.setLimits(5, 300, 5)
					.setValue(this.plugin.settings.mcpSettings.defaultTimeout)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.mcpSettings.defaultTimeout = value;
						await this.plugin.saveSettings();
					})
				);

			new Setting(mcpContainer)
				.setName('Max Retry Attempts')
				.setDesc('Maximum number of retry attempts for failed connections')
				.addSlider(slider => slider
					.setLimits(1, 10, 1)
					.setValue(this.plugin.settings.mcpSettings.maxRetryAttempts)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.mcpSettings.maxRetryAttempts = value;
						await this.plugin.saveSettings();
					})
				);

			new Setting(mcpContainer)
				.setName('Enable Logging')
				.setDesc('Enable detailed logging for MCP operations')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.mcpSettings.enableLogging)
					.onChange(async (value) => {
						this.plugin.settings.mcpSettings.enableLogging = value;
						await this.plugin.saveSettings();
					})
				);

			new Setting(mcpContainer)
				.setName('Log Level')
				.setDesc('Set the logging level for MCP operations')
				.addDropdown(dropdown => dropdown
					.addOption('debug', 'Debug')
					.addOption('info', 'Info')
					.addOption('warn', 'Warning')
					.addOption('error', 'Error')
					.setValue(this.plugin.settings.mcpSettings.logLevel)
					.onChange(async (value) => {
						this.plugin.settings.mcpSettings.logLevel = value as 'debug' | 'info' | 'warn' | 'error';
						await this.plugin.saveSettings();
					})
				);
		}
	}
}

// Add the ChatPanelView class
class ChatPanelView extends ItemView {
	constructor(leaf: WorkspaceLeaf, private plugin: MyPlugin) {
		super(leaf);
	}

	getViewType(): string {
		return 'tangent-chat';
	}

	getDisplayText(): string {
		return 'Tangent Chat';
	}

	getIcon(): string {
		return 'message-circle';
	}

	async onOpen() {
		// Create a wrapper function to match the expected signature
		const streamAIResponseWrapper = async (
			prompt: string,
			onToken: (token: string) => void,
			modelId: string,
			onToolCall: (toolName: string, toolArgs: any) => void,
			onToolResult: (toolName: string, result: any) => void,
			onToolsComplete: (toolResults: string) => void,
			conversationHistory?: any[],
			thinkingBudget?: number,
			onThinking?: (thoughts: string) => void,
			onToolConfirmationNeeded?: (pendingTool: any) => Promise<any>
		) => {
					await streamAIResponse({
			apiKey: this.plugin.settings.geminiApiKey || '',
			modelId,
			messages: conversationHistory || [{ role: 'user', parts: [{ text: prompt }] }],
			onToken,
			onToolCall,
			onToolResult,
			onToolsComplete,
			onThinking,
			onToolConfirmationNeeded,
			app: this.plugin.app,
			thinkingBudget,
			unifiedToolManager: this.plugin.unifiedToolManager,
			maxNestedCalls: 3,
		});
		};

		// Create React root and render chat panel
		const container = this.containerEl;
		this.plugin.chatPanelRoot = createRoot(container);
		this.plugin.chatPanelRoot.render(
			React.createElement(ChatPanelWithProvider, {
				geminiApiKey: this.plugin.settings.geminiApiKey || '',
				streamAIResponse: streamAIResponseWrapper,
				app: this.plugin.app,
				unifiedToolManager: this.plugin.unifiedToolManager
			})
		);
	}

	async onClose() {
		// Cleanup React root when the view is closed
		if (this.plugin.chatPanelRoot) {
			this.plugin.chatPanelRoot.unmount();
			this.plugin.chatPanelRoot = null;
		}
	}
}

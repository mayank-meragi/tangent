import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, View } from 'obsidian';
import * as React from 'react';
import { createRoot, Root } from 'react-dom/client';
import ChatPanelWithProvider from './ChatPanel';
import { streamAIResponse, ConversationMessage } from './ai';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
	geminiApiKey?: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default',
	geminiApiKey: '',
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
		console.log('[AI DEBUG] Loaded API key from settings:', apiKey ? apiKey.slice(0, 4) + '...' : '(none)');
		this.root = createRoot(this.containerEl);
		this.root.render(
			<ChatPanelWithProvider 
				geminiApiKey={apiKey} 
				streamAIResponse={this.streamAIResponse}
				app={this.plugin.app}
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
		console.log('[AI DEBUG] streamAIResponse called with:', { prompt, modelId, apiKey: (this.plugin.settings.geminiApiKey || '').slice(0, 4) + '...', thinkingBudget });
		
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
		});
	};
}

export default class MyPlugin extends Plugin {
	settings!: MyPluginSettings;

	async onload() {
		await this.loadSettings();

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
					console.log(editor.getSelection());
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

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new GeminiSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {

		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
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

class GeminiSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

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
	}
}

import { CommandLoadingModal } from 'commands/components/loadingModal';
import { App, Modal } from 'obsidian';
import { Type } from 'src/api/gemini';
import { GoogleGenAI } from 'src/api/gemini';
import { insertNumberedContent, numberFileContent } from 'src/utils/content';

export interface DietLogOptions {
    app: App;
    geminiApiKey?: string;
    // Add more options as needed
}

export class DietLogCommand {
    private app: App;
    private geminiApiKey?: string;

    constructor(options: DietLogOptions) {
        this.app = options.app;
        this.geminiApiKey = options.geminiApiKey;
    }

    /**
     * Execute the AI Tag Suggest command
     */
    async execute(): Promise<void> {
        console.log('Diet Log command triggered!');
        // @ts-ignore
        // Call Gemini AI to get tag suggestions using structured output
        if (!this.geminiApiKey) {
            console.log('Gemini API key not set');
            return;
        }

        // Show user input modal
        const modal = new UserInputModal(
            this.app,
            async (input: string) => {
                console.log('User input:', input);
                modal.close();
                await this.callGemini(input);
            }
        );
        modal.open();
    }

    async callGemini(input: string) {

        // Get dietician persona// Get dietician persona
        const dieticianPersona = this.app.vault.getFileByPath('tangent/personas/system/dietician.md');
        const dieticianPersonaContent = await this.app.vault.cachedRead(dieticianPersona!);
        console.log('Dietician persona content:', dieticianPersonaContent);

        // Get diet-log.md file
        let dietLogFile = this.app.vault.getFileByPath('diet-log.md');
        if (!dietLogFile) {
            // create diet-log.md file
            await this.app.vault.create('diet-log.md', '');
            dietLogFile = this.app.vault.getFileByPath('diet-log.md');
        }

        // Read the content of the diet-log.md file
        const fileContent = await this.app.vault.cachedRead(dietLogFile!);
        const numberedFileContent = numberFileContent(fileContent);
        console.log('Diet log file content:', numberedFileContent);
        const prompt = ` ${dieticianPersonaContent}

        Diet log content:
        ${numberedFileContent}

        User input:
        ${input}

        Date and time:
        ${new Date().toLocaleString()}
        `;

        const loadingModal = new CommandLoadingModal(this.app);
        loadingModal.open();

        try {
            // Initialize Google AI
            const genAI = new GoogleGenAI({ apiKey: this.geminiApiKey! });

            // Define the response schema for structured output
            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    insertions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                startLine: {
                                    type: Type.NUMBER
                                },
                                content: {
                                    type: Type.STRING
                                }
                            },
                            required: [
                                "startLine",
                                "content"
                            ],
                            propertyOrdering: [
                                "startLine",
                                "content"
                            ]
                        }
                    },
                    reasoning: {
                        type: Type.STRING,
                        description: 'Brief explanation of the insertions to be made to the diet log'
                    },
                },
                required: ['reasoning']
            };

            // Generate structured response using the models API
            const result = await genAI.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: {
                    responseSchema: responseSchema,
                    responseMimeType: 'application/json',
                }
            });

            console.log('Gemini AI Response:', result);

            const structuredResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!structuredResponse) {
                console.error('No response text received from Gemini AI');
                return;
            }

            console.log('Structured AI Response:', structuredResponse);

            // Parse the structured response
            const parsedResponse = JSON.parse(structuredResponse);
            console.log('Parsed insertions:', parsedResponse);

            // Show insertions modal
            if (parsedResponse.insertions && Array.isArray(parsedResponse.insertions)) {
                const insertionsModal = new InsertionsModal(this.app, parsedResponse.insertions, parsedResponse.reasoning);
                insertionsModal.open();
            }

        } catch (error) {
            console.error('Error calling Gemini AI:', error);
        } finally {
            // Close the loading modal
            loadingModal.close();
        }
    }

    /**
     * Get command configuration for Obsidian
     */
    static getCommandConfig() {
        return {
            id: 'diet-log',
            name: 'Diet Log',
        };
    }
}

/**
 * User input modal for diet log
 */
class UserInputModal extends Modal {
    private onConfirm: (input: string) => void;

    constructor(app: App, onConfirm: (input: string) => void) {
        super(app);
        this.onConfirm = onConfirm;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        // Create modal content
        const container = contentEl.createDiv('user-input-modal');

        const input = container.createEl('input');
        input.placeholder = 'Enter your input here';

        input.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            this.onConfirm(target.value);
        });

        // Actions
        const actions = container.createDiv('user-input-actions');

        const cancelBtn = actions.createEl('button', { text: 'Cancel' });
        cancelBtn.addClass('mod-warning');
        cancelBtn.addEventListener('click', () => {
            this.close();
        });

        const confirmBtn = actions.createEl('button', { text: 'Confirm' });
        confirmBtn.addClass('mod-cta');
        confirmBtn.addEventListener('click', () => {
            this.onConfirm(input.value);
            this.close();
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

/**
 * Insertions modal for diet log
 */
class InsertionsModal extends Modal {
    private insertions: Array<{ startLine: number; content: string }>;
    private reasoning: string;

    constructor(app: App, insertions: Array<{ startLine: number; content: string }>, reasoning: string) {
        super(app);
        this.insertions = insertions;
        this.reasoning = reasoning;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        // Modal container
        const container = contentEl.createDiv({ cls: 'insertions-modal obsidian-modal' });

        // Header
        const header = container.createDiv({ cls: 'modal-title' });
        header.createEl('h2', { text: 'Diet Log Suggestions' });

        // Insertions section
        const section = container.createDiv({ cls: 'insertions-section' });
        section.createEl('h3', { text: 'Proposed Insertions' });
        const list = section.createEl('ul', { cls: 'insertions-list' });
        this.insertions.forEach(insertion => {
            const item = list.createEl('li', { cls: 'insertions-list-item' });
            // Line number badge
            const badge = item.createSpan({ cls: 'insertions-line-badge' });
            badge.setText(`#${insertion.startLine}`);
            // Content
            const content = item.createSpan({ cls: 'insertions-content' });
            content.setText(insertion.content);
        });

        // Reasoning section
        const reasoningSection = container.createDiv({ cls: 'insertions-reasoning-section' });
        reasoningSection.createEl('h3', { text: 'Reasoning' });
        const reasoningBox = reasoningSection.createDiv({ cls: 'insertions-reasoning-box' });
        reasoningBox.setText(this.reasoning);

        // Actions (footer)
        const actions = container.createDiv({ cls: 'modal-button-container' });
        const cancelBtn = actions.createEl('button', { text: 'Cancel' });
        cancelBtn.addClass('mod-warning');
        cancelBtn.addEventListener('click', () => this.close());
        const confirmBtn = actions.createEl('button', { text: 'Confirm' });
        confirmBtn.addClass('mod-cta');
        confirmBtn.addEventListener('click', async () => {
            const dietLogFile = this.app.vault.getFileByPath('diet-log.md');
            const fileContent = await this.app.vault.cachedRead(dietLogFile!);
            const newFileContent = insertNumberedContent(fileContent, this.insertions);
            await this.app.vault.modify(dietLogFile!, newFileContent);
            this.close();
        });
    }
}

export function createDietLogCommand(options: DietLogOptions): DietLogCommand {
    return new DietLogCommand(options);
} 
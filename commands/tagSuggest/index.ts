import { App, Modal } from 'obsidian';
import { GoogleGenAI, Type } from '@google/genai';

export interface TagSuggestOptions {
  app: App;
  geminiApiKey?: string;
  // Add more options as needed
}

export class TagSuggestCommand {
  private app: App;
  private geminiApiKey?: string;

  constructor(options: TagSuggestOptions) {
    this.app = options.app;
    this.geminiApiKey = options.geminiApiKey;
  }

  /**
   * Execute the AI Tag Suggest command
   */
  async execute(): Promise<void> {
    console.log('AI Tag Suggest command triggered!');
    
    // Get the currently open file
    const currentFile = this.app.workspace.getActiveFile();
    if (!currentFile) {
      console.log('No file is currently open');
      return;
    }

    // Read the content of the current file
    const fileContent = await this.app.vault.read(currentFile);
    console.log('Current file content:', fileContent);
    
    // Get all tags in the vault
    const cache = this.app.metadataCache;
    // @ts-ignore
    const allTags = cache.getTags();
    console.log('All tags in vault:', allTags);
    
    // Call Gemini AI to get tag suggestions using structured output
    if (!this.geminiApiKey) {
      console.log('Gemini API key not set');
      return;
    }

    // Show loading modal
    const loadingModal = new TagSuggestLoadingModal(this.app);
    loadingModal.open();

    const prompt = `Analyze the following content and suggest relevant tags. 

Current file content:
${fileContent}

Existing tags in the vault:
${JSON.stringify(allTags, null, 2)}

Please provide a structured response with suggested tags. Consider:
1. The main topics and themes in the content
2. The existing tags in the vault for consistency
3. Appropriate categorization tags
4. Action-oriented tags if applicable`;

    try {
      // Initialize Google AI
      const genAI = new GoogleGenAI({ apiKey: this.geminiApiKey });

      // Define the response schema for structured output
      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          suggestedTags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Array of suggested tags for the content'
          },
          reasoning: {
            type: Type.STRING,
            description: 'Brief explanation of why these tags are suggested'
          },
          confidence: {
            type: Type.NUMBER,
            description: 'Confidence score between 0 and 1'
          }
        },
        required: ['suggestedTags', 'reasoning', 'confidence']
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

      const structuredResponse = result.text;
      
      if (!structuredResponse) {
        console.error('No response text received from Gemini AI');
        return;
      }
      
      console.log('Structured AI Response:', structuredResponse);
      
      // Parse the structured response
      const parsedResponse = JSON.parse(structuredResponse);
      console.log('Parsed tag suggestions:', parsedResponse);
      
      // Show tag selection modal
      if (parsedResponse.suggestedTags && Array.isArray(parsedResponse.suggestedTags)) {
        await this.showTagSelectionModal(currentFile, parsedResponse);
      }
      
    } catch (error) {
      console.error('Error calling Gemini AI:', error);
    } finally {
      // Close the loading modal
      loadingModal.close();
    }
  }

    /**
   * Show tag selection modal
   */
  private async showTagSelectionModal(file: any, aiResponse: any): Promise<void> {
    return new Promise((resolve) => {
      const modal = new TagSelectionModal(
        this.app,
        aiResponse.suggestedTags || [],
        aiResponse.reasoning || '',
        async (selectedTags: string[]) => {
          if (selectedTags.length > 0) {
            await this.updateFileTags(file, selectedTags);
          }
          resolve();
        }
      );
      modal.open();
    });
  }

  /**
   * Update the tags of the current file
   */
  private async updateFileTags(file: any, suggestedTags: string[]): Promise<void> {
    try {
      // Get current frontmatter to see existing tags
      const fileCache = this.app.metadataCache.getFileCache(file);
      const existingTags = fileCache?.frontmatter?.tags || [];
      
      // Combine existing tags with new suggested tags, avoiding duplicates
      const allTags = [...new Set([...existingTags, ...suggestedTags])];
      
      // Update the file's frontmatter with the new tags
      await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
        frontmatter.tags = allTags;
      });
      
      console.log(`Updated file tags. Added: ${suggestedTags.join(', ')}`);
      console.log(`All tags in file: ${allTags.join(', ')}`);
      
    } catch (error) {
      console.error('Error updating file tags:', error);
    }
  }

  /**
   * Get command configuration for Obsidian
   */
  static getCommandConfig() {
    return {
      id: 'ai-tag-suggest',
      name: 'AI Tag Suggest',
    };
  }
}

/**
 * Factory function to create the command instance
 */
/**
 * Loading modal for AI tag suggestions
 */
class TagSuggestLoadingModal extends Modal {
  constructor(app: App) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    
    // Create modal content
    const container = contentEl.createDiv('tag-suggest-loading-modal');
    
    // Add spinning icon
    const spinner = container.createDiv('loading-spinner');
    spinner.innerHTML = `
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" stroke-width="4" stroke-dasharray="30 100" stroke-dashoffset="0">
          <animate attributeName="stroke-dashoffset" values="0;-100" dur="1s" repeatCount="indefinite"/>
        </svg>
    `;
    
    // Add loading text
    const text = container.createDiv('loading-text');
    text.setText('Analyzing content and generating tag suggestions...');
    
    // Add subtitle
    const subtitle = container.createDiv('loading-subtitle');
    subtitle.setText('This may take a few seconds');
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

/**
 * Tag selection modal for AI suggestions
 */
class TagSelectionModal extends Modal {
  private selectedTags: Set<string>;
  private reasoning: string;
  private onConfirm: (selectedTags: string[]) => void;

  constructor(app: App, suggestedTags: string[], reasoning: string, onConfirm: (selectedTags: string[]) => void) {
    super(app);
    this.selectedTags = new Set(suggestedTags);
    this.reasoning = reasoning;
    this.onConfirm = onConfirm;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    
    // Create modal content
    const container = contentEl.createDiv('tag-selection-modal');
    
    // Header
    const header = container.createDiv('tag-selection-header');
    const title = header.createEl('h2');
    title.setText('AI Tag Suggestions');
    
    // Reasoning
    if (this.reasoning) {
      const reasoningEl = header.createDiv('tag-selection-reasoning');
      reasoningEl.setText(this.reasoning);
    }
    
    // Tag list
    const tagList = container.createDiv('tag-selection-list');
    const tagArray = Array.from(this.selectedTags);
    
    tagArray.forEach(tag => {
      const tagItem = tagList.createDiv('tag-selection-item');
      
      const checkbox = tagItem.createEl('input', { type: 'checkbox' });
      checkbox.checked = true;
      checkbox.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        if (target.checked) {
          this.selectedTags.add(tag);
        } else {
          this.selectedTags.delete(tag);
        }
      });
      
      const tagLabel = tagItem.createEl('label');
      tagLabel.setText(`#${tag}`);
    });
    
    // Actions
    const actions = container.createDiv('tag-selection-actions');
    
    const cancelBtn = actions.createEl('button', { text: 'Cancel' });
    cancelBtn.addClass('mod-warning');
    cancelBtn.addEventListener('click', () => {
      this.close();
    });
    
    const confirmBtn = actions.createEl('button', { text: 'Add Selected Tags' });
    confirmBtn.addClass('mod-cta');
    confirmBtn.addEventListener('click', () => {
      this.onConfirm(Array.from(this.selectedTags));
      this.close();
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

export function createTagSuggestCommand(options: TagSuggestOptions): TagSuggestCommand {
  return new TagSuggestCommand(options);
} 
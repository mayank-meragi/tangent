import { App } from 'obsidian';
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
      
      // Update the file with suggested tags
      if (parsedResponse.suggestedTags && Array.isArray(parsedResponse.suggestedTags)) {
        await this.updateFileTags(currentFile, parsedResponse.suggestedTags);
      }
      
    } catch (error) {
      console.error('Error calling Gemini AI:', error);
    }
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
export function createTagSuggestCommand(options: TagSuggestOptions): TagSuggestCommand {
  return new TagSuggestCommand(options);
} 
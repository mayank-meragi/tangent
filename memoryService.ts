import { App, TFile } from 'obsidian';

export class MemoryService {
  private app: App;
  private memoryFilePath: string;

  constructor(app: App, memoryFilePath = 'assistant_memory.md') {
    this.app = app;
    this.memoryFilePath = memoryFilePath;
  }

  /**
   * Read the current memory content
   */
  async readMemory(): Promise<string> {
    try {
      const file = this.app.vault.getAbstractFileByPath(this.memoryFilePath);
      
      if (!file || !(file instanceof TFile)) {
        // Memory file doesn't exist, return empty string
        return '';
      }

      const content = await this.app.vault.read(file);
      return content;
    } catch (error) {
      console.error('Error reading memory:', error);
      return '';
    }
  }

  /**
   * Append content to memory
   */
  async appendToMemory(content: string): Promise<void> {
    try {
      const existingContent = await this.readMemory();
      const newEntry = `${existingContent ? '\n\n' : ''}${content} (timestamp:: ${new Date().toISOString()})`;
      const updatedContent = existingContent + newEntry;
      await this.writeMemory(updatedContent);
    } catch (error) {
      console.error('Error appending to memory:', error);
      throw error;
    }
  }

  /**
   * Write content to memory (overwrites existing content)
   */
  async writeMemory(content: string): Promise<void> {
    try {
      const file = this.app.vault.getAbstractFileByPath(this.memoryFilePath);
      
      if (file && file instanceof TFile) {
        // File exists, modify it
        await this.app.vault.modify(file, content);
      } else {
        // File doesn't exist, create it
        await this.app.vault.create(this.memoryFilePath, content);
      }
    } catch (error) {
      console.error('Error writing memory:', error);
      throw error;
    }
  }

  /**
   * Clear all memory content
   */
  async clearMemory(): Promise<void> {
    try {
      await this.writeMemory('');
    } catch (error) {
      console.error('Error clearing memory:', error);
      throw error;
    }
  }

  /**
   * Get memory file path
   */
  getMemoryFilePath(): string {
    return this.memoryFilePath;
  }

  /**
   * Check if memory file exists
   */
  async memoryFileExists(): Promise<boolean> {
    const file = this.app.vault.getAbstractFileByPath(this.memoryFilePath);
    return file instanceof TFile;
  }
} 
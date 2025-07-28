import { App, TFile, TFolder, EventRef } from 'obsidian';
import { Persona } from './tools/types';
import * as path from 'path';

// Extend globalThis to include bundled personas
declare global {
  // eslint-disable-next-line no-var
  var __SYSTEM_PERSONAS__: Record<string, string> | undefined;
}

export class PersonaService {
  private app: App;
  private personaFolder = 'tangent/personas';
  private personas: Map<string, Persona> = new Map();
  private fileWatcher?: EventRef;
  private isInitialized = false;

  constructor(app: App) {
    this.app = app;
  }

  /**
   * Initialize the persona service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.ensurePersonaFolder();
      await this.loadBuiltInPersonas();
      await this.loadUserPersonas();
      this.setupFileWatcher();
      this.isInitialized = true;
      console.log('Persona service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize persona service:', error);
      // Don't throw error, just log it and continue
      // This prevents the plugin from failing to load
    }
  }

  /**
   * Ensure persona folder exists
   */
  private async ensurePersonaFolder(): Promise<void> {
    try {
      const folder = this.app.vault.getAbstractFileByPath(this.personaFolder);
      if (!folder) {
        await this.safeCreateFolder(this.personaFolder);
        console.log(`Created persona folder: ${this.personaFolder}`);
      } else {
        console.log(`Persona folder already exists: ${this.personaFolder}`);
      }
    } catch (error) {
      // If folder creation fails, it might already exist
      console.log(`Persona folder check completed: ${this.personaFolder}`);
    }
  }

  /**
   * Safely create a folder, handling the case where it already exists
   */
  private async safeCreateFolder(folderPath: string): Promise<void> {
    try {
      await this.app.vault.createFolder(folderPath);
    } catch (error) {
      // Check if the error is because the folder already exists
      const existingFolder = this.app.vault.getAbstractFileByPath(folderPath);
      if (!existingFolder) {
        // If folder doesn't exist, re-throw the error
        throw error;
      }
      // Folder exists, which is fine
      console.log(`Folder already exists: ${folderPath}`);
    }
  }

  /**
   * Load built-in personas from plugin bundle
   */
  private async loadBuiltInPersonas(): Promise<void> {
    try {
      // First try to load from bundled personas
      const bundledPersonas = await this.loadBundledPersonas();
      if (bundledPersonas && Object.keys(bundledPersonas).length > 0) {
        console.log(`Loading ${Object.keys(bundledPersonas).length} bundled system personas`);
        await this.installBundledPersonas(bundledPersonas);
        return;
      }

      // Fallback to loading from folder (development environment)
      await this.loadBuiltInPersonasFromFolder();
    } catch (error) {
      console.error('Failed to load built-in personas:', error);
    }
  }

  /**
   * Load bundled personas from the plugin bundle
   */
  private async loadBundledPersonas(): Promise<Record<string, string> | null> {
    try {
      // Access bundled personas from global variable injected by esbuild
      if (typeof globalThis.__SYSTEM_PERSONAS__ !== 'undefined') {
        return globalThis.__SYSTEM_PERSONAS__;
      }
      
      // Fallback for development environment
      if (typeof window !== 'undefined' && (window as any).__SYSTEM_PERSONAS__) {
        return (window as any).__SYSTEM_PERSONAS__;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to load bundled personas:', error);
      return null;
    }
  }

  /**
   * Install bundled personas to the user's persona folder
   */
  private async installBundledPersonas(bundledPersonas: Record<string, string>): Promise<void> {
    let installedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const [relativePath, content] of Object.entries(bundledPersonas)) {
      try {
        // Extract filename from relative path
        const fileName = path.basename(relativePath);
        const systemPersonaPath = `${this.personaFolder}/system/${fileName}`;
        
        // Check if persona already exists (preserve user customizations)
        const existingFile = this.app.vault.getAbstractFileByPath(systemPersonaPath);
        if (existingFile) {
          console.log(`System persona already exists, skipping: ${fileName}`);
          skippedCount++;
          continue;
        }

        // Ensure system folder exists
        const systemFolderPath = `${this.personaFolder}/system`;
        const systemFolder = this.app.vault.getAbstractFileByPath(systemFolderPath);
        if (!systemFolder) {
          await this.safeCreateFolder(systemFolderPath);
          console.log(`Created system folder: ${systemFolderPath}`);
        }

        // Create the persona file
        await this.app.vault.create(systemPersonaPath, content);
        installedCount++;
        console.log(`Installed system persona: ${fileName}`);
      } catch (error) {
        console.error(`Failed to install bundled persona ${relativePath}:`, error);
        errorCount++;
      }
    }

    console.log(`System personas: ${installedCount} installed, ${skippedCount} skipped, ${errorCount} errors`);
  }

  /**
   * Load built-in personas from personas folder (development fallback)
   */
  private async loadBuiltInPersonasFromFolder(): Promise<void> {
    const builtInPersonasFolder = 'tangent/personas';
    
    try {
      // Check if personas folder exists in the plugin directory
      const folder = this.app.vault.getAbstractFileByPath(builtInPersonasFolder);
      if (!folder || !(folder instanceof TFolder)) {
        console.log('Built-in personas folder not found, skipping built-in personas');
        return;
      }

      let loadedCount = 0;
      let errorCount = 0;

      for (const child of folder.children) {
        if (child instanceof TFile && child.extension === 'md') {
          try {
            const persona = await this.parsePersonaFromFile(child);
            if (persona && persona.author === 'system') {
              this.personas.set(persona.id, persona);
              loadedCount++;
            }
          } catch (error) {
            console.error(`Failed to parse built-in persona from ${child.path}:`, error);
            errorCount++;
          }
        }
      }

      console.log(`Loaded ${loadedCount} built-in personas from folder, ${errorCount} errors`);
    } catch (error) {
      console.error('Failed to load built-in personas from folder:', error);
    }
  }

  /**
   * Load user personas from the personas folder
   */
  private async loadUserPersonas(): Promise<void> {
    const folder = this.app.vault.getAbstractFileByPath(this.personaFolder);
    if (!folder || !(folder instanceof TFolder)) {
      console.log('Persona folder not found, skipping user personas');
      return;
    }

    // Load personas from all subfolders recursively
    const result = await this.loadPersonasFromFolder(folder);

    console.log(`Loaded ${result.loadedCount} personas from folder, ${result.errorCount} errors`);
  }

  /**
   * Recursively load personas from a folder and its subfolders
   */
  private async loadPersonasFromFolder(folder: TFolder): Promise<{ loadedCount: number; errorCount: number }> {
    let loadedCount = 0;
    let errorCount = 0;
    
    for (const child of folder.children) {
      if (child instanceof TFile && child.extension === 'md') {
        try {
          const persona = await this.parsePersonaFromFile(child);
          if (persona) {
            this.personas.set(persona.id, persona);
            loadedCount++;
          }
        } catch (error) {
          console.error(`Failed to parse persona from ${child.path}:`, error);
          errorCount++;
        }
      } else if (child instanceof TFolder) {
        // Recursively load from subfolders
        const subResult = await this.loadPersonasFromFolder(child);
        loadedCount += subResult.loadedCount;
        errorCount += subResult.errorCount;
      }
    }
    
    return { loadedCount, errorCount };
  }

  /**
   * Parse a persona from a markdown file
   */
  async parsePersonaFromFile(file: TFile): Promise<Persona | null> {
    try {
      const content = await this.app.vault.read(file);
      const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
      
      if (!frontmatter) {
        console.warn(`No frontmatter found in ${file.path}`);
        return null;
      }

      // Extract content (everything after frontmatter)
      const contentMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      if (!contentMatch) {
        console.warn(`Invalid frontmatter format in ${file.path}`);
        return null;
      }

      const personaContent = contentMatch[2].trim();

      if (!this.validatePersonaStructure(frontmatter)) {
        console.warn(`Persona validation failed for ${file.path}`);
        return null;
      }

      return {
        id: frontmatter.id,
        name: frontmatter.name,
        description: frontmatter.description,
        content: personaContent,
        color: frontmatter.color,
        author: frontmatter.author || 'user',
        created: frontmatter.created || new Date().toISOString(),
        updated: frontmatter.updated || new Date().toISOString(),
        filePath: file.path
      };
    } catch (error) {
      console.error(`Error parsing persona from ${file.path}:`, error);
      return null;
    }
  }



  /**
   * Validate persona structure
   */
  private validatePersonaStructure(frontmatter: any): boolean {
    const requiredFields = ['id', 'name', 'description', 'color', 'author', 'created', 'updated'];
    
    for (const field of requiredFields) {
      if (!frontmatter[field]) {
        console.warn(`Missing required field: ${field}`);
        return false;
      }
    }

    // Validate color format (basic hex validation)
    const colorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!colorRegex.test(frontmatter.color)) {
      console.warn(`Invalid color format: ${frontmatter.color}`);
      return false;
    }

    return true;
  }

  /**
   * Setup file watcher for persona folder
   */
  private setupFileWatcher(): void {
    // This will be implemented in Phase 2
    console.log('File watcher setup - to be implemented in Phase 2');
  }

  /**
   * Get all personas
   */
  async getAllPersonas(): Promise<Persona[]> {
    await this.ensureInitialized();
    return Array.from(this.personas.values());
  }

  /**
   * Get persona by ID
   */
  async getPersonaById(id: string): Promise<Persona | null> {
    await this.ensureInitialized();
    return this.personas.get(id) || null;
  }

  /**
   * Ensure service is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.fileWatcher) {
      this.app.vault.offref(this.fileWatcher);
      this.fileWatcher = undefined;
    }
  }
} 
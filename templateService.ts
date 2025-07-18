import { App, TFile, TFolder, EventRef } from 'obsidian';
import { 
  ConversationTemplate, 
  TemplateCategory, 
  TemplateSearchResult, 
  TemplateValidationResult,
  TemplateVariable
} from './tools/types';
import { TemplateSearchEngine } from './tools/templateSearchEngine';
import * as path from 'path'; // Added for path.basename

// Extend globalThis to include bundled templates
declare global {
  // eslint-disable-next-line no-var
  var __SYSTEM_TEMPLATES__: Record<string, string> | undefined;
}

export class TemplateService {
  private app: App;
  private templateFolder = 'tangent/templates';
  private templates: Map<string, ConversationTemplate> = new Map();
  private fileWatcher?: EventRef;
  private isInitialized = false;
  private searchEngine: TemplateSearchEngine;

  constructor(app: App) {
    this.app = app;
    this.searchEngine = new TemplateSearchEngine();
  }

  /**
   * Initialize the template service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.ensureTemplateFolder();
      await this.loadBuiltInTemplates();
      await this.loadUserTemplates();
      this.setupFileWatcher();
      this.isInitialized = true;
      console.log('Template service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize template service:', error);
      // Don't throw error, just log it and continue
      // This prevents the plugin from failing to load
    }
  }

  /**
   * Ensure template folder exists
   */
  private async ensureTemplateFolder(): Promise<void> {
    try {
      const folder = this.app.vault.getAbstractFileByPath(this.templateFolder);
      if (!folder) {
        await this.safeCreateFolder(this.templateFolder);
        console.log(`Created template folder: ${this.templateFolder}`);
      } else {
        console.log(`Template folder already exists: ${this.templateFolder}`);
      }
    } catch (error) {
      // If folder creation fails, it might already exist
      console.log(`Template folder check completed: ${this.templateFolder}`);
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
   * Load built-in templates from plugin bundle
   */
  private async loadBuiltInTemplates(): Promise<void> {
    try {
      // First try to load from bundled templates
      const bundledTemplates = await this.loadBundledTemplates();
      if (bundledTemplates && Object.keys(bundledTemplates).length > 0) {
        console.log(`Loading ${Object.keys(bundledTemplates).length} bundled system templates`);
        await this.installBundledTemplates(bundledTemplates);
        return;
      }

      // Fallback to loading from templates folder (for development)
      console.log('No bundled templates found, falling back to templates folder');
      await this.loadBuiltInTemplatesFromFolder();
    } catch (error) {
      console.error('Failed to load built-in templates:', error);
    }
  }

  /**
   * Load bundled templates from the plugin bundle
   */
  private async loadBundledTemplates(): Promise<Record<string, string> | null> {
    try {
      // Access bundled templates from global variable injected by esbuild
      if (typeof globalThis.__SYSTEM_TEMPLATES__ !== 'undefined') {
        return globalThis.__SYSTEM_TEMPLATES__;
      }
      
      // Fallback for development environment
      if (typeof window !== 'undefined' && (window as any).__SYSTEM_TEMPLATES__) {
        return (window as any).__SYSTEM_TEMPLATES__;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to load bundled templates:', error);
      return null;
    }
  }

  /**
   * Install bundled templates to the user's template folder
   */
  private async installBundledTemplates(bundledTemplates: Record<string, string>): Promise<void> {
    let installedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const [relativePath, content] of Object.entries(bundledTemplates)) {
      try {
        // Extract filename from relative path
        const fileName = path.basename(relativePath);
        const systemTemplatePath = `${this.templateFolder}/system/${fileName}`;
        
        // Check if template already exists (preserve user customizations)
        const existingFile = this.app.vault.getAbstractFileByPath(systemTemplatePath);
        if (existingFile) {
          console.log(`System template already exists, skipping: ${fileName}`);
          skippedCount++;
          continue;
        }

        // Ensure system folder exists
        const systemFolderPath = `${this.templateFolder}/system`;
        const systemFolder = this.app.vault.getAbstractFileByPath(systemFolderPath);
        if (!systemFolder) {
          await this.safeCreateFolder(systemFolderPath);
          console.log(`Created system folder: ${systemFolderPath}`);
        }

        // Create the template file
        await this.app.vault.create(systemTemplatePath, content);
        installedCount++;
        console.log(`Installed system template: ${fileName}`);
      } catch (error) {
        console.error(`Failed to install bundled template ${relativePath}:`, error);
        errorCount++;
      }
    }

    console.log(`System templates: ${installedCount} installed, ${skippedCount} skipped, ${errorCount} errors`);
  }

  /**
   * Load built-in templates from templates folder (development fallback)
   */
  private async loadBuiltInTemplatesFromFolder(): Promise<void> {
    const builtInTemplatesFolder = 'templates';
    
    try {
      // Check if templates folder exists in the plugin directory
      const folder = this.app.vault.getAbstractFileByPath(builtInTemplatesFolder);
      if (!folder || !(folder instanceof TFolder)) {
        console.log('Built-in templates folder not found, skipping built-in templates');
        return;
      }

      let loadedCount = 0;
      let errorCount = 0;

      for (const child of folder.children) {
        if (child instanceof TFile && child.extension === 'md') {
          try {
            const template = await this.parseTemplateFromFile(child);
            if (template && template.author === 'system') {
              this.templates.set(template.id, template);
              loadedCount++;
            }
          } catch (error) {
            console.error(`Failed to parse built-in template from ${child.path}:`, error);
            errorCount++;
          }
        }
      }

      console.log(`Loaded ${loadedCount} built-in templates from folder, ${errorCount} errors`);
    } catch (error) {
      console.error('Failed to load built-in templates from folder:', error);
    }
  }

  /**
   * Load all templates from the template folder (including system and user templates)
   */
  private async loadUserTemplates(): Promise<void> {
    const folder = this.app.vault.getAbstractFileByPath(this.templateFolder);
    if (!folder || !(folder instanceof TFolder)) {
      console.log('Template folder not found, skipping user templates');
      return;
    }

    // Load templates from all subfolders recursively
    const result = await this.loadTemplatesFromFolder(folder);

    console.log(`Loaded ${result.loadedCount} templates from folder, ${result.errorCount} errors`);
  }

  /**
   * Recursively load templates from a folder and its subfolders
   */
  private async loadTemplatesFromFolder(folder: TFolder): Promise<{ loadedCount: number; errorCount: number }> {
    let loadedCount = 0;
    let errorCount = 0;
    
    for (const child of folder.children) {
      if (child instanceof TFile && child.extension === 'md') {
        try {
          const template = await this.parseTemplateFromFile(child);
          if (template) {
            this.templates.set(template.id, template);
            loadedCount++;
          }
        } catch (error) {
          console.error(`Failed to parse template from ${child.path}:`, error);
          errorCount++;
        }
      } else if (child instanceof TFolder) {
        // Recursively load from subfolders
        const subResult = await this.loadTemplatesFromFolder(child);
        loadedCount += subResult.loadedCount;
        errorCount += subResult.errorCount;
      }
    }
    
    return { loadedCount, errorCount };
  }

  /**
   * Parse a template from a markdown file
   */
  async parseTemplateFromFile(file: TFile): Promise<ConversationTemplate | null> {
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

      const templateContent = contentMatch[2].trim();

      // Validate required fields
      const validation = this.validateTemplateStructure(frontmatter, templateContent);
      if (!validation.isValid) {
        console.warn(`Template validation failed for ${file.path}:`, validation.errors);
        return null;
      }

      const template: ConversationTemplate = {
        id: frontmatter.id || this.generateTemplateId(),
        title: frontmatter.title,
        content: templateContent,
        category: frontmatter.category,
        description: frontmatter.description,
        tags: frontmatter.tags || [],
        created: frontmatter.created || new Date().toISOString(),
        updated: frontmatter.updated || new Date().toISOString(),
        favorite: frontmatter.favorite || false,
        author: frontmatter.author || 'user',
        version: frontmatter.version,
        aliases: frontmatter.aliases,
        variables: this.convertVariablesToArray(frontmatter.variables),
        filePath: file.path
      };

      return template;
    } catch (error) {
      console.error(`Error parsing template from ${file.path}:`, error);
      return null;
    }
  }

  /**
   * Convert variables from object format to array format
   */
  private convertVariablesToArray(variables: any): TemplateVariable[] {
    if (!variables) return [];
    
    // If it's already an array, return it
    if (Array.isArray(variables)) {
      return variables;
    }
    
    // If it's an object, convert to array
    if (typeof variables === 'object') {
      const variablesArray: TemplateVariable[] = [];
      
      for (const [name, variableData] of Object.entries(variables)) {
        if (typeof variableData === 'object' && variableData !== null) {
          const varData = variableData as any;
          variablesArray.push({
            name,
            type: varData.type || 'string',
            default: varData.default,
            description: varData.description,
            options: varData.options,
            required: varData.required || false
          });
        }
      }
      
      return variablesArray;
    }
    
    return [];
  }

  /**
   * Validate template structure
   */
  private validateTemplateStructure(frontmatter: any, content: string): TemplateValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!frontmatter.title) {
      errors.push('Missing required field: title');
    }
    if (!frontmatter.category) {
      errors.push('Missing required field: category');
    }
    if (!frontmatter.description) {
      errors.push('Missing required field: description');
    }

    // Check content
    if (!content || content.trim().length === 0) {
      errors.push('Template content is empty');
    }

    // Check variables format - can be object or array
    if (frontmatter.variables && typeof frontmatter.variables !== 'object') {
      warnings.push('Variables should be an object or array');
    }

    // Check tags format
    if (frontmatter.tags && !Array.isArray(frontmatter.tags)) {
      warnings.push('Tags should be an array');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Setup file watcher for automatic template updates
   */
  private setupFileWatcher(): void {
    if (this.fileWatcher) {
      this.app.vault.offref(this.fileWatcher);
    }

    this.fileWatcher = this.app.vault.on('modify', async (file) => {
      if (file instanceof TFile && file.path.startsWith(this.templateFolder) && file.extension === 'md') {
        console.log(`Template file modified: ${file.path}`);
        await this.handleTemplateFileChange(file);
      }
    });

    this.app.vault.on('create', async (file) => {
      if (file instanceof TFile && file.path.startsWith(this.templateFolder) && file.extension === 'md') {
        console.log(`New template file created: ${file.path}`);
        await this.handleTemplateFileChange(file);
      }
    });

    this.app.vault.on('delete', async (file) => {
      if (file instanceof TFile && file.path.startsWith(this.templateFolder) && file.extension === 'md') {
        console.log(`Template file deleted: ${file.path}`);
        await this.handleTemplateFileRemoval(file);
      }
    });
  }

  /**
   * Handle template file changes
   */
  private async handleTemplateFileChange(file: TFile): Promise<void> {
    try {
      const template = await this.parseTemplateFromFile(file);
      if (template) {
        this.templates.set(template.id, template);
        this.invalidateSearchCache();
        console.log(`Template updated: ${template.title}`);
      } else {
        // Remove invalid template from cache
        const existingTemplate = Array.from(this.templates.values()).find(t => t.filePath === file.path);
        if (existingTemplate) {
          this.templates.delete(existingTemplate.id);
          this.invalidateSearchCache();
          console.log(`Invalid template removed from cache: ${file.path}`);
        }
      }
    } catch (error) {
      console.error(`Error handling template file change for ${file.path}:`, error);
    }
  }

  /**
   * Handle template file removal
   */
  private async handleTemplateFileRemoval(file: TFile): Promise<void> {
    const existingTemplate = Array.from(this.templates.values()).find(t => t.filePath === file.path);
    if (existingTemplate) {
      this.templates.delete(existingTemplate.id);
      this.invalidateSearchCache();
      console.log(`Template removed from cache: ${existingTemplate.title}`);
    }
  }

  /**
   * Invalidate search cache
   */
  private invalidateSearchCache(): void {
    this.searchEngine.clearCache();
  }

  /**
   * Get all templates
   */
  async getAllTemplates(): Promise<ConversationTemplate[]> {
    await this.ensureInitialized();
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by category
   */
  async getTemplatesByCategory(category: string): Promise<ConversationTemplate[]> {
    await this.ensureInitialized();
    return Array.from(this.templates.values()).filter(template => template.category === category);
  }

  /**
   * Search templates
   */
  async searchTemplates(query: string): Promise<TemplateSearchResult[]> {
    await this.ensureInitialized();
    
    const templates = Array.from(this.templates.values());
    return this.searchEngine.searchTemplates(query, templates);
  }

  /**
   * Create a new custom template
   */
  async createCustomTemplate(template: Omit<ConversationTemplate, 'id' | 'created' | 'updated' | 'author'>): Promise<string> {
    await this.ensureInitialized();

    const newTemplate: ConversationTemplate = {
      ...template,
      id: this.generateTemplateId(),
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      author: 'user'
    };

    // Create the template file
    const file = await this.createTemplateFile(newTemplate);
    newTemplate.filePath = file.path;

    // Add to cache
    this.templates.set(newTemplate.id, newTemplate);
    this.invalidateSearchCache();

    console.log(`Created new template: ${newTemplate.title}`);
    return newTemplate.id;
  }

  /**
   * Create a template file
   */
  async createTemplateFile(template: ConversationTemplate): Promise<TFile> {
    const filename = `${template.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    const filepath = `${this.templateFolder}/${filename}`;
    
    const content = this.serializeTemplateToFrontmatter(template);
    
    try {
      const file = await this.app.vault.create(filepath, content);
      return file as TFile;
    } catch (error) {
      console.error('Failed to create template file:', error);
      throw error;
    }
  }

  /**
   * Serialize template to frontmatter format
   */
  serializeTemplateToFrontmatter(template: ConversationTemplate): string {
    const frontmatter: any = {
      id: template.id,
      title: template.title,
      category: template.category,
      description: template.description,
      tags: template.tags,
      created: template.created,
      updated: template.updated,
      favorite: template.favorite,
      author: template.author
    };

    if (template.version) frontmatter.version = template.version;
    if (template.aliases) frontmatter.aliases = template.aliases;
    if (template.variables) frontmatter.variables = template.variables;

    const frontmatterString = Object.entries(frontmatter)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}:\n${value.map(item => `  - ${item}`).join('\n')}`;
        }
        return `${key}: ${JSON.stringify(value)}`;
      })
      .join('\n');

    return `---\n${frontmatterString}\n---\n\n${template.content}`;
  }

  /**
   * Update a custom template
   */
  async updateCustomTemplate(id: string, updates: Partial<ConversationTemplate>): Promise<void> {
    await this.ensureInitialized();

    const template = this.templates.get(id);
    if (!template) {
      throw new Error(`Template not found: ${id}`);
    }

    if (template.author === 'system') {
      throw new Error('Cannot update built-in templates');
    }

    const updatedTemplate: ConversationTemplate = {
      ...template,
      ...updates,
      updated: new Date().toISOString()
    };

    // Update the file
    if (template.filePath) {
      const file = this.app.vault.getAbstractFileByPath(template.filePath);
      if (file instanceof TFile) {
        const content = this.serializeTemplateToFrontmatter(updatedTemplate);
        await this.app.vault.modify(file, content);
      }
    }

    // Update cache
    this.templates.set(id, updatedTemplate);
    this.invalidateSearchCache();

    console.log(`Updated template: ${updatedTemplate.title}`);
  }

  /**
   * Delete a custom template
   */
  async deleteCustomTemplate(id: string): Promise<void> {
    await this.ensureInitialized();

    const template = this.templates.get(id);
    if (!template) {
      throw new Error(`Template not found: ${id}`);
    }

    if (template.author === 'system') {
      throw new Error('Cannot delete built-in templates');
    }

    // Delete the file
    if (template.filePath) {
      const file = this.app.vault.getAbstractFileByPath(template.filePath);
      if (file instanceof TFile) {
        await this.app.vault.delete(file);
      }
    }

    // Remove from cache
    this.templates.delete(id);
    this.invalidateSearchCache();

    console.log(`Deleted template: ${template.title}`);
  }

  /**
   * Get template by ID
   */
  async getTemplateById(id: string): Promise<ConversationTemplate | null> {
    await this.ensureInitialized();
    return this.templates.get(id) || null;
  }

  /**
   * Get template categories
   */
  async getTemplateCategories(): Promise<TemplateCategory[]> {
    await this.ensureInitialized();
    
    const categories = new Map<string, TemplateCategory>();
    
    for (const template of this.templates.values()) {
      if (!categories.has(template.category)) {
        categories.set(template.category, {
          id: template.category.toLowerCase().replace(/\s+/g, '-'),
          name: template.category,
          description: `Templates for ${template.category.toLowerCase()} tasks`,
          icon: this.getCategoryIcon(template.category),
          color: this.getCategoryColor(template.category),
          isCustom: template.author === 'user'
        });
      }
    }

    return Array.from(categories.values());
  }

  /**
   * Get category icon
   */
  private getCategoryIcon(category: string): string {
    const iconMap: Record<string, string> = {
      'Writing': 'pen-tool',
      'Analysis': 'bar-chart-3',
      'Research': 'search',
      'Productivity': 'check-square',
      'Creative': 'palette',
      'Learning': 'book-open',
      'Technical': 'code'
    };
    return iconMap[category] || 'message-square';
  }

  /**
   * Get category color
   */
  private getCategoryColor(category: string): string {
    const colorMap: Record<string, string> = {
      'Writing': '#3b82f6',
      'Analysis': '#10b981',
      'Research': '#f59e0b',
      'Productivity': '#8b5cf6',
      'Creative': '#ec4899',
      'Learning': '#06b6d4',
      'Technical': '#ef4444'
    };
    return colorMap[category] || '#6b7280';
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
   * Generate a unique template ID
   */
  private generateTemplateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.fileWatcher) {
      this.app.vault.offref(this.fileWatcher);
      this.fileWatcher = undefined;
    }
    this.templates.clear();
    this.searchEngine.clearCache();
    this.isInitialized = false;
  }
} 
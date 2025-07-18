import { 
  ConversationTemplate, 
  TemplateVariable, 
  TemplateValidationResult,
  CreateTemplatePayload,
  UpdateTemplatePayload 
} from './types';

/**
 * Template validation utilities
 * Provides functions to validate template structures and data types
 */

export class TemplateValidator {
  /**
   * Validate a complete template structure
   */
  static validateTemplate(template: ConversationTemplate): TemplateValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!template.id || template.id.trim() === '') {
      errors.push('Template ID is required');
    }

    if (!template.title || template.title.trim() === '') {
      errors.push('Template title is required');
    }

    if (!template.content || template.content.trim() === '') {
      errors.push('Template content is required');
    }

    if (!template.category || template.category.trim() === '') {
      errors.push('Template category is required');
    }

    if (!template.description || template.description.trim() === '') {
      errors.push('Template description is required');
    }

    // Field length validation
    if (template.title && template.title.length > 100) {
      warnings.push('Template title is quite long (max 100 characters recommended)');
    }

    if (template.description && template.description.length > 500) {
      warnings.push('Template description is quite long (max 500 characters recommended)');
    }

    if (template.content && template.content.length > 10000) {
      warnings.push('Template content is quite long (max 10,000 characters recommended)');
    }

    // Date validation
    if (template.created && !this.isValidDate(template.created)) {
      errors.push('Invalid created date format');
    }

    if (template.updated && !this.isValidDate(template.updated)) {
      errors.push('Invalid updated date format');
    }

    // Tags validation
    if (template.tags && !Array.isArray(template.tags)) {
      errors.push('Tags must be an array');
    } else if (template.tags) {
      for (const tag of template.tags) {
        if (typeof tag !== 'string' || tag.trim() === '') {
          errors.push('Tags must be non-empty strings');
          break;
        }
      }
    }

    // Variables validation
    if (template.variables) {
      const variableValidation = this.validateVariables(template.variables);
      errors.push(...variableValidation.errors);
      warnings.push(...variableValidation.warnings);
    }

    // Author validation
    if (template.author && !['system', 'user'].includes(template.author)) {
      errors.push('Author must be either "system" or "user"');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate template variables
   */
  static validateVariables(variables: TemplateVariable[]): TemplateValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(variables)) {
      errors.push('Variables must be an array');
      return { isValid: false, errors, warnings };
    }

    for (let i = 0; i < variables.length; i++) {
      const variable = variables[i];
      const variableErrors = this.validateVariable(variable, i);
      errors.push(...variableErrors);
    }

    // Check for duplicate variable names
    const names = variables.map(v => v.name);
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
    if (duplicates.length > 0) {
      errors.push(`Duplicate variable names found: ${duplicates.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate a single template variable
   */
  static validateVariable(variable: TemplateVariable, index: number): string[] {
    const errors: string[] = [];

    // Required fields
    if (!variable.name || variable.name.trim() === '') {
      errors.push(`Variable ${index}: Name is required`);
    }

    if (!variable.type || !['string', 'number', 'boolean', 'select'].includes(variable.type)) {
      errors.push(`Variable ${index}: Type must be one of: string, number, boolean, select`);
    }

    // Type-specific validation
    if (variable.type === 'select') {
      if (!variable.options || !Array.isArray(variable.options) || variable.options.length === 0) {
        errors.push(`Variable ${index}: Select type requires options array`);
      }
    }

    // Name format validation
    if (variable.name && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(variable.name)) {
      errors.push(`Variable ${index}: Name must be a valid identifier (letters, numbers, underscore, starting with letter or underscore)`);
    }

    // Description length
    if (variable.description && variable.description.length > 200) {
      errors.push(`Variable ${index}: Description is too long (max 200 characters)`);
    }

    return errors;
  }

  /**
   * Validate a create template payload
   */
  static validateCreatePayload(payload: CreateTemplatePayload): TemplateValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!payload.title || payload.title.trim() === '') {
      errors.push('Title is required');
    }

    if (!payload.content || payload.content.trim() === '') {
      errors.push('Content is required');
    }

    if (!payload.category || payload.category.trim() === '') {
      errors.push('Category is required');
    }

    if (!payload.description || payload.description.trim() === '') {
      errors.push('Description is required');
    }

    // Field length validation
    if (payload.title && payload.title.length > 100) {
      warnings.push('Title is quite long (max 100 characters recommended)');
    }

    if (payload.description && payload.description.length > 500) {
      warnings.push('Description is quite long (max 500 characters recommended)');
    }

    if (payload.content && payload.content.length > 10000) {
      warnings.push('Content is quite long (max 10,000 characters recommended)');
    }

    // Tags validation
    if (payload.tags && !Array.isArray(payload.tags)) {
      errors.push('Tags must be an array');
    } else if (payload.tags) {
      for (const tag of payload.tags) {
        if (typeof tag !== 'string' || tag.trim() === '') {
          errors.push('Tags must be non-empty strings');
          break;
        }
      }
    }

    // Variables validation
    if (payload.variables) {
      const variableValidation = this.validateVariables(payload.variables);
      errors.push(...variableValidation.errors);
      warnings.push(...variableValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate an update template payload
   */
  static validateUpdatePayload(payload: UpdateTemplatePayload): TemplateValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Field length validation for provided fields
    if (payload.title !== undefined) {
      if (!payload.title || payload.title.trim() === '') {
        errors.push('Title cannot be empty');
      } else if (payload.title.length > 100) {
        warnings.push('Title is quite long (max 100 characters recommended)');
      }
    }

    if (payload.description !== undefined) {
      if (!payload.description || payload.description.trim() === '') {
        errors.push('Description cannot be empty');
      } else if (payload.description.length > 500) {
        warnings.push('Description is quite long (max 500 characters recommended)');
      }
    }

    if (payload.content !== undefined) {
      if (!payload.content || payload.content.trim() === '') {
        errors.push('Content cannot be empty');
      } else if (payload.content.length > 10000) {
        warnings.push('Content is quite long (max 10,000 characters recommended)');
      }
    }

    if (payload.category !== undefined) {
      if (!payload.category || payload.category.trim() === '') {
        errors.push('Category cannot be empty');
      }
    }

    // Tags validation
    if (payload.tags !== undefined) {
      if (!Array.isArray(payload.tags)) {
        errors.push('Tags must be an array');
      } else {
        for (const tag of payload.tags) {
          if (typeof tag !== 'string' || tag.trim() === '') {
            errors.push('Tags must be non-empty strings');
            break;
          }
        }
      }
    }

    // Variables validation
    if (payload.variables !== undefined) {
      const variableValidation = this.validateVariables(payload.variables);
      errors.push(...variableValidation.errors);
      warnings.push(...variableValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate template content for variable syntax
   */
  static validateTemplateContent(content: string): TemplateValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for valid variable syntax {{variable}}
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const matches = content.match(variableRegex);
    
    if (matches) {
      for (const match of matches) {
        const variableName = match.slice(2, -2).trim();
        
        if (variableName === '') {
          errors.push('Empty variable placeholder found');
        } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(variableName)) {
          errors.push(`Invalid variable name in placeholder: ${match}`);
        }
      }
    }

    // Check for unclosed variable placeholders
    const openBraces = (content.match(/\{\{/g) || []).length;
    const closeBraces = (content.match(/\}\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      errors.push('Mismatched variable placeholder braces');
    }

    // Check for very long content
    if (content.length > 10000) {
      warnings.push('Template content is quite long (max 10,000 characters recommended)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate category name
   */
  static validateCategory(category: string): TemplateValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!category || category.trim() === '') {
      errors.push('Category name is required');
    } else if (category.length > 50) {
      warnings.push('Category name is quite long (max 50 characters recommended)');
    }

    // Check for invalid characters
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(category)) {
      errors.push('Category name contains invalid characters (only letters, numbers, spaces, hyphens, and underscores allowed)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Check if a string is a valid date
   */
  private static isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Sanitize template content to prevent XSS
   */
  static sanitizeContent(content: string): string {
    // Basic HTML tag removal (for safety)
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
  }

  /**
   * Generate a safe template ID
   */
  static generateSafeId(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }
} 
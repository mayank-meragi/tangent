import { ConversationTemplate, TemplateSearchResult } from './types';

/**
 * Template Search Engine
 * Provides advanced search functionality with fuzzy matching, relevance scoring, and caching
 */
export class TemplateSearchEngine {
  private searchCache: Map<string, { results: TemplateSearchResult[]; timestamp: number }> = new Map();
  private searchIndex: Map<string, Set<string>> = new Map(); // term -> template IDs
  private templateIndex: Map<string, ConversationTemplate> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 100;
  private readonly MAX_SEARCH_RESULTS = 50;
  private debounceTimer: NodeJS.Timeout | null = null;

  // Search field weights for relevance scoring
  private readonly FIELD_WEIGHTS = {
    title: 10,
    tags: 8,
    category: 6,
    description: 5,
    content: 2,
    aliases: 7
  };

  // Fuzzy search configuration
  private readonly FUZZY_CONFIG = {
    maxDistance: 3,
    minScore: 0.3
  };

  constructor() {
    this.clearCache();
  }

  /**
   * Index templates for fast searching
   */
  indexTemplates(templates: ConversationTemplate[]): void {
    this.templateIndex.clear();
    this.searchIndex.clear();

    for (const template of templates) {
      this.templateIndex.set(template.id, template);
      this.indexTemplate(template);
    }

    console.log(`Indexed ${templates.length} templates for search`);
  }

  /**
   * Index a single template
   */
  private indexTemplate(template: ConversationTemplate): void {
    const terms = this.extractSearchTerms(template);
    
    for (const term of terms) {
      if (!this.searchIndex.has(term)) {
        this.searchIndex.set(term, new Set());
      }
      this.searchIndex.get(term)!.add(template.id);
    }
  }

  /**
   * Extract searchable terms from a template
   */
  private extractSearchTerms(template: ConversationTemplate): Set<string> {
    const terms = new Set<string>();

    // Add title terms
    this.addTermsFromText(template.title, terms);
    
    // Add description terms
    this.addTermsFromText(template.description, terms);
    
    // Add category terms
    this.addTermsFromText(template.category, terms);
    
    // Add tag terms
    for (const tag of template.tags) {
      this.addTermsFromText(tag, terms);
    }
    
    // Add alias terms
    if (template.aliases) {
      for (const alias of template.aliases) {
        this.addTermsFromText(alias, terms);
      }
    }
    
    // Add content terms (limited to first 500 characters for performance)
    const contentPreview = template.content.substring(0, 500);
    this.addTermsFromText(contentPreview, terms);

    return terms;
  }

  /**
   * Add terms from text to the terms set
   */
  private addTermsFromText(text: string, terms: Set<string>): void {
    const words = text.toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length >= 2);

    for (const word of words) {
      terms.add(word);
      // Add partial matches for fuzzy search
      for (let i = 1; i <= Math.min(word.length - 1, 3); i++) {
        terms.add(word.substring(0, i));
      }
    }
  }

  /**
   * Search templates with debouncing
   */
  async searchTemplates(query: string, templates: ConversationTemplate[]): Promise<TemplateSearchResult[]> {
    return new Promise((resolve) => {
      // Clear existing timer
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      // Set new debounced search
      this.debounceTimer = setTimeout(() => {
        const results = this.performSearch(query, templates);
        resolve(results);
      }, 300); // 300ms debounce
    });
  }

  /**
   * Perform the actual search
   */
  private performSearch(query: string, templates: ConversationTemplate[]): TemplateSearchResult[] {
    const queryLower = query.toLowerCase().trim();
    
    // Check cache first
    const cacheKey = queryLower;
    const cached = this.searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.results;
    }

    // Update index if needed
    if (this.templateIndex.size === 0) {
      this.indexTemplates(templates);
    }

    const results: TemplateSearchResult[] = [];

    if (!queryLower) {
      // Return all templates sorted by favorites first, then by title
      const sortedTemplates = templates
        .sort((a, b) => {
          if (a.favorite && !b.favorite) return -1;
          if (!a.favorite && b.favorite) return 1;
          return a.title.localeCompare(b.title);
        })
        .slice(0, this.MAX_SEARCH_RESULTS);

      const searchResults = sortedTemplates.map(template => ({
        template,
        relevanceScore: 1,
        matchedFields: []
      }));

      this.cacheResults(cacheKey, searchResults);
      return searchResults;
    }

    // Perform fuzzy search
    for (const template of templates) {
      const score = this.calculateRelevanceScore(queryLower, template);
      if (score > 0) {
        results.push({
          template,
          relevanceScore: score,
          matchedFields: this.getMatchedFields(queryLower, template)
        });
      }
    }

    // Sort by relevance score (descending)
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Limit results
    const limitedResults = results.slice(0, this.MAX_SEARCH_RESULTS);

    // Cache results
    this.cacheResults(cacheKey, limitedResults);

    return limitedResults;
  }

  /**
   * Calculate relevance score for a template
   */
  private calculateRelevanceScore(query: string, template: ConversationTemplate): number {
    let totalScore = 0;
    const queryTerms = query.split(/\s+/).filter(term => term.length > 0);

    for (const term of queryTerms) {
      const termScore = this.calculateTermScore(term, template);
      totalScore += termScore;
    }

    // Boost for favorites
    if (template.favorite) {
      totalScore += 3;
    }

    // Boost for exact matches
    if (template.title.toLowerCase().includes(query)) {
      totalScore += 5;
    }

    // Boost for category matches
    if (template.category.toLowerCase().includes(query)) {
      totalScore += 4;
    }

    return totalScore;
  }

  /**
   * Calculate score for a single search term
   */
  private calculateTermScore(term: string, template: ConversationTemplate): number {
    let score = 0;

    // Title match (highest weight)
    const titleScore = this.getFuzzyMatchScore(term, template.title.toLowerCase());
    score += titleScore * this.FIELD_WEIGHTS.title;

    // Tag matches (high weight)
    for (const tag of template.tags) {
      const tagScore = this.getFuzzyMatchScore(term, tag.toLowerCase());
      score += tagScore * this.FIELD_WEIGHTS.tags;
    }

    // Category match (medium weight)
    const categoryScore = this.getFuzzyMatchScore(term, template.category.toLowerCase());
    score += categoryScore * this.FIELD_WEIGHTS.category;

    // Description match (medium weight)
    const descScore = this.getFuzzyMatchScore(term, template.description.toLowerCase());
    score += descScore * this.FIELD_WEIGHTS.description;

    // Alias matches (high weight)
    if (template.aliases) {
      for (const alias of template.aliases) {
        const aliasScore = this.getFuzzyMatchScore(term, alias.toLowerCase());
        score += aliasScore * this.FIELD_WEIGHTS.aliases;
      }
    }

    // Content match (low weight, limited to first 500 chars)
    const contentPreview = template.content.substring(0, 500).toLowerCase();
    const contentScore = this.getFuzzyMatchScore(term, contentPreview);
    score += contentScore * this.FIELD_WEIGHTS.content;

    return score;
  }

  /**
   * Get fuzzy match score between a term and text
   */
  private getFuzzyMatchScore(term: string, text: string): number {
    // Exact match
    if (text.includes(term)) {
      return 1.0;
    }

    // Prefix match
    if (text.startsWith(term)) {
      return 0.9;
    }

    // Suffix match
    if (text.endsWith(term)) {
      return 0.8;
    }

    // Substring match
    if (text.includes(term)) {
      return 0.7;
    }

    // Fuzzy match using Levenshtein distance
    const distance = this.levenshteinDistance(term, text);
    const maxLength = Math.max(term.length, text.length);
    const similarity = 1 - (distance / maxLength);

    if (similarity >= this.FUZZY_CONFIG.minScore) {
      return similarity * 0.6; // Lower weight for fuzzy matches
    }

    return 0;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Get matched fields for search result
   */
  private getMatchedFields(query: string, template: ConversationTemplate): string[] {
    const matchedFields: string[] = [];
    const queryTerms = query.split(/\s+/);

    for (const term of queryTerms) {
      if (template.title.toLowerCase().includes(term)) {
        matchedFields.push('title');
      }
      if (template.category.toLowerCase().includes(term)) {
        matchedFields.push('category');
      }
      if (template.description.toLowerCase().includes(term)) {
        matchedFields.push('description');
      }
      if (template.tags.some(tag => tag.toLowerCase().includes(term))) {
        matchedFields.push('tags');
      }
      if (template.aliases && template.aliases.some(alias => alias.toLowerCase().includes(term))) {
        matchedFields.push('aliases');
      }
      if (template.content.toLowerCase().includes(term)) {
        matchedFields.push('content');
      }
    }

    return [...new Set(matchedFields)]; // Remove duplicates
  }

  /**
   * Cache search results
   */
  private cacheResults(query: string, results: TemplateSearchResult[]): void {
    // Limit cache size
    if (this.searchCache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.searchCache.keys().next().value;
      if (oldestKey) {
        this.searchCache.delete(oldestKey);
      }
    }

    this.searchCache.set(query, {
      results,
      timestamp: Date.now()
    });
  }

  /**
   * Clear search cache
   */
  clearCache(): void {
    this.searchCache.clear();
    this.searchIndex.clear();
    this.templateIndex.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.searchCache.size,
      hitRate: 0 // Would need to track hits/misses for accurate hit rate
    };
  }

  /**
   * Search by category
   */
  searchByCategory(category: string, templates: ConversationTemplate[]): TemplateSearchResult[] {
    const categoryLower = category.toLowerCase();
    const results: TemplateSearchResult[] = [];

    for (const template of templates) {
      if (template.category.toLowerCase().includes(categoryLower)) {
        results.push({
          template,
          relevanceScore: template.favorite ? 2 : 1,
          matchedFields: ['category']
        });
      }
    }

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Search by tags
   */
  searchByTags(tags: string[], templates: ConversationTemplate[]): TemplateSearchResult[] {
    const results: TemplateSearchResult[] = [];

    for (const template of templates) {
      const matchingTags = template.tags.filter(tag => 
        tags.some(searchTag => tag.toLowerCase().includes(searchTag.toLowerCase()))
      );

      if (matchingTags.length > 0) {
        results.push({
          template,
          relevanceScore: matchingTags.length + (template.favorite ? 1 : 0),
          matchedFields: ['tags']
        });
      }
    }

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Get search suggestions based on partial query
   */
  getSearchSuggestions(query: string, templates: ConversationTemplate[]): string[] {
    const suggestions = new Set<string>();
    const queryLower = query.toLowerCase();

    for (const template of templates) {
      // Title suggestions
      if (template.title.toLowerCase().includes(queryLower)) {
        suggestions.add(template.title);
      }

      // Category suggestions
      if (template.category.toLowerCase().includes(queryLower)) {
        suggestions.add(template.category);
      }

      // Tag suggestions
      for (const tag of template.tags) {
        if (tag.toLowerCase().includes(queryLower)) {
          suggestions.add(tag);
        }
      }

      // Alias suggestions
      if (template.aliases) {
        for (const alias of template.aliases) {
          if (alias.toLowerCase().includes(queryLower)) {
            suggestions.add(alias);
          }
        }
      }
    }

    return Array.from(suggestions).slice(0, 10);
  }
} 
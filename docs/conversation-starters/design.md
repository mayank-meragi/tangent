# Conversation Starters Feature Design

## Overview
This document outlines the detailed design and implementation approach for the conversation starters feature in the Tangent plugin. The design focuses on seamless integration with the existing chat interface while providing an intuitive template selection experience.

## Architecture Overview

### High-Level Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Chat Input    │    │ Template Service │    │ Template Store  │
│   Component     │◄──►│                  │◄──►│                 │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Template        │    │ Template         │    │ Built-in        │
│ Dropdown        │    │ Manager          │    │ Templates       │
│ Component       │    │ Component        │    │ (JSON)          │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Data Models

### Template Interface
```typescript
interface ConversationTemplate {
  id: string;
  title: string;
  content: string;
  category: string;
  description: string;
  tags: string[];
  created: string;
  updated: string;
  favorite?: boolean;
  author: string; // "system" for built-in, "user" for custom
  version?: string;
  aliases?: string[];
  variables?: TemplateVariable[];
  filePath?: string; // Path to the markdown file for user templates
}

interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  default?: any;
  description?: string;
  options?: string[]; // For select type
  required?: boolean;
}
```

### Template Category Interface
```typescript
interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  isCustom: boolean;
}
```

### Template Search Result Interface
```typescript
interface TemplateSearchResult {
  template: ConversationTemplate;
  relevanceScore: number;
  matchedFields: string[];
}
```

## Component Design

### 1. Template Service (`templateService.ts`)

**Purpose**: Core service for managing templates, search, and storage operations.

**Key Methods**:
```typescript
class TemplateService {
  // Template Management
  async getAllTemplates(): Promise<ConversationTemplate[]>
  async getTemplatesByCategory(category: string): Promise<ConversationTemplate[]>
  async searchTemplates(query: string): Promise<TemplateSearchResult[]>
  
  // Custom Template Operations
  async createCustomTemplate(template: Omit<ConversationTemplate, 'id' | 'createdDate' | 'usageCount'>): Promise<string>
  async updateCustomTemplate(id: string, updates: Partial<ConversationTemplate>): Promise<void>
  async deleteCustomTemplate(id: string): Promise<void>
  

  
  // Storage Operations
  async loadBuiltInTemplates(): Promise<void>
  async loadUserTemplates(): Promise<void>
  async watchTemplateFolder(): Promise<void>
  
  // File Operations
  async createTemplateFile(template: ConversationTemplate): Promise<TFile>
  async updateTemplateFile(file: TFile, updates: Partial<ConversationTemplate>): Promise<void>
  async deleteTemplateFile(file: TFile): Promise<void>
  
  // Frontmatter Parsing
  parseTemplateFromFile(file: TFile): Promise<ConversationTemplate | null>
  serializeTemplateToFrontmatter(template: ConversationTemplate): string
}
```

**Implementation Details**:
- All templates stored as individual `.md` files in configurable folder
- Built-in templates distributed as markdown files in plugin bundle
- Uses Obsidian's built-in frontmatter parser for metadata
- File watcher for automatic template reloading and discovery
- Search uses fuzzy matching with relevance scoring
- Templates cached in memory for performance
- Automatic file change detection and template updates
- Auto-discovery of new templates when files are added to folder

### 2. Generic Dropdown Component (`GenericDropdown.tsx`)

**Purpose**: Reusable dropdown interface for both file selection ("@") and template selection ("/") with consistent UX.

**Props Interface**:
```typescript
interface GenericDropdownProps {
  isVisible: boolean;
  searchQuery: string;
  items: DropdownItem[];
  selectedIndex: number;
  onItemSelect: (item: DropdownItem) => void;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  placeholder?: string;
  noResultsMessage?: string;
}

interface DropdownItem {
  id: string;
  title: string;
  description?: string;
  category?: string;
  icon?: string;
  metadata?: Record<string, any>;
}
```

**Component Structure**:
```tsx
const GenericDropdown: React.FC<GenericDropdownProps> = ({
  isVisible,
  searchQuery,
  items,
  selectedIndex,
  onItemSelect,
  onClose,
  onIndexChange,
  placeholder = "No items found",
  noResultsMessage = "No results found"
}) => {
  // Generic dropdown logic
  // Keyboard navigation
  // Item rendering with consistent styling
}
```

**Key Features**:
- Generic interface for any type of searchable items
- Consistent keyboard navigation (arrow keys, Enter, Escape)
- Flexible item rendering with icons and metadata
- Reusable styling and animations
- Configurable placeholder and no-results messages

### 3. Template Manager Component (`TemplateManager.tsx`)

**Purpose**: Full-featured template management interface for creating, editing, and organizing templates.

**Component Structure**:
```tsx
const TemplateManager: React.FC<TemplateManagerProps> = () => {
  const [templates, setTemplates] = useState<ConversationTemplate[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  // Template CRUD operations
  // Category management
  // Search and filtering
  // Import/export functionality
}
```

**Key Features**:
- Grid/list view of templates
- Category filtering and management
- Template creation wizard
- Bulk operations (delete, move, favorite)
- Template preview and testing
- Direct file editing integration

### 4. Template Creation and Editing Workflow

**Template Creation Process**:
1. **Auto-Discovery**: User simply adds a `.md` file with valid frontmatter to the template folder
2. **Manual Creation**: User clicks "Create Template" in manager or uses keyboard shortcut
3. **System opens a new markdown file** in the configured template folder
4. **Pre-populated with frontmatter structure** and example content
5. **User edits the file directly** in Obsidian
6. **System automatically detects changes** and updates template cache
7. **Template becomes available immediately** in dropdown

**Template Editing Process**:
1. User can edit templates directly in Obsidian file explorer
2. Changes are automatically detected and reflected in template system
3. No need for special editing interface
4. Full markdown editing capabilities
5. Version control through Obsidian's file system

**Template File Naming Convention**:
- `{descriptive-name}.md` for all templates (no special prefixes)
- Users can name files however they prefer
- System uses frontmatter `id` field for unique identification
- Automatic ID generation if not specified in frontmatter

**Auto-Discovery Process**:
1. System monitors the configured template folder for new `.md` files
2. When a new file is detected, system attempts to parse frontmatter
3. If valid frontmatter is found, file becomes a template immediately
4. If frontmatter is invalid or missing, file is ignored (with optional notification)
5. Users can add templates by simply creating markdown files with proper frontmatter

### 5. Enhanced Chat Input Component

**Purpose**: Extend existing chat input to support both "@" file selection and "/" template selection using the generic dropdown.

**Modifications to `ChatInputContainer.tsx`**:
```typescript
// Add generic dropdown state
const [showDropdown, setShowDropdown] = useState(false);
const [dropdownType, setDropdownType] = useState<'files' | 'templates' | null>(null);
const [dropdownQuery, setDropdownQuery] = useState('');
const [dropdownItems, setDropdownItems] = useState<DropdownItem[]>([]);
const [selectedDropdownIndex, setSelectedDropdownIndex] = useState(0);

// Enhanced input change handler
const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  const value = e.target.value;
  setInput(value);
  
  // Check for triggers
  if (value.includes('@') && !value.includes(' ')) {
    const query = value.substring(value.indexOf('@') + 1);
    setDropdownQuery(query);
    setDropdownType('files');
    setShowDropdown(true);
    // Load file items
    loadFileItems(query);
  } else if (value.includes('/') && !value.includes(' ')) {
    const query = value.substring(value.indexOf('/') + 1);
    setDropdownQuery(query);
    setDropdownType('templates');
    setShowDropdown(true);
    // Load template items
    loadTemplateItems(query);
  } else {
    setShowDropdown(false);
    setDropdownType(null);
  }
};

// Generic item selection handler
const handleDropdownItemSelect = (item: DropdownItem) => {
  if (dropdownType === 'files') {
    handleFileSelect(item.metadata.file);
  } else if (dropdownType === 'templates') {
    handleTemplateSelect(item.metadata.template);
  }
  setShowDropdown(false);
  setDropdownType(null);
};

// Load items for different dropdown types
const loadFileItems = async (query: string) => {
  const files = await searchFiles(query);
  const items = files.map(file => ({
    id: file.path,
    title: file.name,
    description: file.path,
    icon: 'file-text',
    metadata: { file }
  }));
  setDropdownItems(items);
  setSelectedDropdownIndex(0);
};

const loadTemplateItems = async (query: string) => {
  const templates = await templateService.searchTemplates(query);
  const items = templates.map(result => ({
    id: result.template.id,
    title: result.template.title,
    description: result.template.description,
    category: result.template.category,
    icon: 'message-square',
    metadata: { template: result.template }
  }));
  setDropdownItems(items);
  setSelectedDropdownIndex(0);
};
```

## Built-in Templates

### Template Distribution and Bundling
Built-in templates will be bundled with the plugin and automatically installed to the user's vault during initialization. This ensures all templates follow the same format and can be easily customized while maintaining system integrity.

### Template Folder Structure
Following industry best practices for template organization (inspired by AUGI's template organization principles), the system implements a logical folder structure:

```
tangent/templates/
├── system/                    # Built-in templates (read-only)
│   ├── writing/
│   │   ├── essay-writing.md
│   │   ├── blog-post.md
│   │   ├── creative-writing.md
│   │   └── technical-writing.md
│   ├── technical/
│   │   ├── code-review.md
│   │   ├── bug-report.md
│   │   ├── api-documentation.md
│   │   └── system-design.md
│   ├── productivity/
│   │   ├── meeting-notes.md
│   │   ├── task-planning.md
│   │   ├── project-review.md
│   │   └── goal-setting.md
│   ├── creative/
│   │   ├── brainstorming.md
│   │   ├── ideation.md
│   │   ├── story-outline.md
│   │   └── design-thinking.md
│   ├── research/
│   │   ├── research-plan.md
│   │   ├── literature-review.md
│   │   ├── data-analysis.md
│   │   └── market-research.md
│   └── learning/
│       ├── study-plan.md
│       ├── concept-explanation.md
│       ├── skill-development.md
│       └── knowledge-synthesis.md
├── user/                      # User-created templates
│   ├── work/
│   ├── personal/
│   └── projects/
└── shared/                    # Team/shared templates
    ├── company/
    └── team/
```

### System Template Initialization Process

**Phase 1: Plugin Bundle Integration**
```typescript
// System templates are bundled with the plugin
const SYSTEM_TEMPLATES = {
  'writing/essay-writing.md': { /* template content */ },
  'writing/blog-post.md': { /* template content */ },
  'technical/code-review.md': { /* template content */ },
  // ... all built-in templates
};
```

**Phase 2: Automatic Installation**
```typescript
class TemplateService {
  async initialize(): Promise<void> {
    await this.ensureTemplateFolder();
    await this.installSystemTemplates();
    await this.loadUserTemplates();
    this.setupFileWatcher();
  }

  private async installSystemTemplates(): Promise<void> {
    const systemTemplates = await this.getBundledTemplates();
    
    for (const [path, content] of Object.entries(systemTemplates)) {
      const fullPath = `${this.templateFolder}/system/${path}`;
      
      // Only create if it doesn't exist (preserve user customizations)
      if (!this.app.vault.getAbstractFileByPath(fullPath)) {
        await this.ensureFolderStructure(fullPath);
        await this.app.vault.create(fullPath, content);
      }
    }
  }

  private async ensureFolderStructure(filePath: string): Promise<void> {
    const pathParts = filePath.split('/');
    const fileName = pathParts.pop();
    const folderPath = pathParts.join('/');
    
    if (!this.app.vault.getAbstractFileByPath(folderPath)) {
      await this.app.vault.createFolder(folderPath);
    }
  }
}
```

**Phase 3: Template Update Mechanism**
```typescript
async updateSystemTemplates(): Promise<void> {
  const currentVersion = this.getPluginVersion();
  const lastUpdateVersion = this.getLastTemplateUpdate();
  
  if (currentVersion > lastUpdateVersion) {
    // Backup user customizations
    await this.backupUserTemplates();
    
    // Update system templates
    await this.installSystemTemplates();
    
    // Restore user customizations
    await this.restoreUserTemplates();
    
    // Update version tracking
    this.setLastTemplateUpdate(currentVersion);
  }
}
```

### Template Categories and Organization

Following AUGI's template organization principles, templates are categorized with consistent naming conventions:

```typescript
const TEMPLATE_CATEGORIES = {
  'writing': {
    name: 'Writing',
    icon: 'pen-tool',
    color: '#4CAF50',
    description: 'Writing and content creation templates',
    prefix: 'WR'
  },
  'technical': {
    name: 'Technical', 
    icon: 'code',
    color: '#2196F3',
    description: 'Technical documentation and code templates',
    prefix: 'TC'
  },
  'productivity': {
    name: 'Productivity',
    icon: 'trending-up', 
    color: '#FF9800',
    description: 'Productivity and workflow templates',
    prefix: 'PR'
  },
  'creative': {
    name: 'Creative',
    icon: 'lightbulb',
    color: '#9C27B0', 
    description: 'Creative and brainstorming templates',
    prefix: 'CR'
  },
  'research': {
    name: 'Research',
    icon: 'search',
    color: '#607D8B',
    description: 'Research and analysis templates',
    prefix: 'RS'
  },
  'learning': {
    name: 'Learning',
    icon: 'book-open',
    color: '#795548',
    description: 'Learning and educational templates',
    prefix: 'LR'
  }
};
```

### Template Naming Conventions

Following AUGI's naming conventions, templates use consistent prefixes and structure:

```markdown
---
id: "WR-essay-writing"
title: "Essay Writing Template"
category: "writing"
description: "Help me write a well-structured essay"
tags: ["writing", "academic", "essay"]
author: "system"
version: "1.0.0"
created: "2024-01-01T00:00:00Z"
updated: "2024-01-01T00:00:00Z"
favorite: false
variables:
  - name: "topic"
    type: "string"
    description: "Essay topic"
    required: true
  - name: "wordCount"
    type: "number"
    description: "Target word count"
    default: 1000
  - name: "audience"
    type: "select"
    description: "Target audience"
    options: ["academic", "general", "professional"]
    default: "academic"
---
```

### Template Management Features

**A. System Template Protection**
- System templates are marked with `author: "system"` in frontmatter
- Users cannot directly modify system templates
- System templates are recreated on plugin updates
- User customizations are preserved during updates

**B. Template Customization**
- Users can create copies of system templates in the `user/` folder
- Custom templates inherit from system templates but can be modified
- Version tracking shows which system template was the base
- Custom templates can override system templates

**C. Template Sharing and Collaboration**
- Templates in `shared/` folder are available to team members
- Company templates in `shared/company/` for organization-wide use
- Team templates in `shared/team/` for specific team use
- Template version control and conflict resolution

### Template Categories and Content

**Writing Templates**:
```markdown
---
id: "writing-brainstorm"
title: "Brainstorm Writing Ideas"
category: "Writing"
description: "Generate creative writing ideas and explore different angles"
tags: ["writing", "brainstorming", "creativity"]
author: "system"
version: "1.0"
created: "2024-01-01T00:00:00Z"
updated: "2024-01-01T00:00:00Z"
favorite: false
variables:
  topic:
    type: "string"
    default: "general topic"
    description: "The topic or theme to brainstorm about"
  constraints:
    type: "string"
    default: ""
    description: "Any specific requirements or constraints"
---

# Brainstorm Writing Ideas

I need help brainstorming ideas for {{topic}}. Can you help me explore different angles, perspectives, and approaches I could take? Please consider {{constraints}}.

## What I'm looking for:
- Creative angles and perspectives
- Different writing styles and formats
- Potential audiences and approaches
- Unique hooks or entry points
```

**Analysis Templates**:
```markdown
---
id: "analysis-breakdown"
title: "Analyze and Break Down"
category: "Analysis"
description: "Deep analysis and breakdown of complex topics"
tags: ["analysis", "breakdown", "understanding"]
author: "system"
version: "1.0"
created: "2024-01-01T00:00:00Z"
updated: "2024-01-01T00:00:00Z"
favorite: false
variables:
  topic:
    type: "string"
    default: "the topic or concept"
    description: "The topic or concept to analyze"
---

# Analyze and Break Down

Please analyze {{topic}} and break it down into its key components. Help me understand the main elements, their relationships, and any underlying patterns or principles.

## Analysis Framework:
- Core components and elements
- Relationships and dependencies
- Patterns and principles
- Implications and applications
```

**Research Templates**:
```markdown
---
id: "research-explore"
title: "Research and Explore"
category: "Research"
description: "Comprehensive research exploration and guidance"
tags: ["research", "exploration", "learning"]
author: "system"
version: "1.0"
created: "2024-01-01T00:00:00Z"
updated: "2024-01-01T00:00:00Z"
favorite: false
variables:
  topic:
    type: "string"
    default: "the research topic"
    description: "The topic to research"
---

# Research and Explore

I want to research {{topic}}. Can you help me explore this subject by providing an overview, key concepts, important sources, and areas for deeper investigation?

## Research Areas:
- Overview and background
- Key concepts and terminology
- Important sources and references
- Areas for deeper investigation
- Current trends and developments
```

**Productivity Templates**:
```markdown
---
id: "productivity-plan"
title: "Create Action Plan"
category: "Productivity"
description: "Structured planning and task organization"
tags: ["productivity", "planning", "organization"]
author: "system"
version: "1.0"
created: "2024-01-01T00:00:00Z"
updated: "2024-01-01T00:00:00Z"
favorite: false
variables:
  goal:
    type: "string"
    default: "achieve my goal"
    description: "The goal or task to plan for"
  constraints:
    type: "string"
    default: ""
    description: "Any constraints or resources to consider"
---

# Create Action Plan

I need to {{goal}}. Can you help me create a structured action plan with clear steps, priorities, and timelines? Consider {{constraints}}.

## Plan Structure:
- Clear objectives and milestones
- Prioritized action steps
- Timeline and deadlines
- Resource requirements
- Risk mitigation strategies
```

## Storage Design

### Unified Template Storage (Markdown with Frontmatter)

All templates (both built-in and user) will be stored as individual markdown files in a configurable folder, using Obsidian's frontmatter for metadata. This approach provides maximum flexibility and leverages Obsidian's native editing capabilities.

#### Template Folder Configuration
- **Default folder**: `tangent/templates/` (configurable in settings)
- **Settings UI**: Users can specify custom template folder path
- **Auto-discovery**: Any `.md` file with valid frontmatter becomes a template
- **No special structure**: Users simply add files to the folder

#### Built-in Templates Distribution
- Built-in templates distributed as markdown files in plugin bundle
- Copied to user's template folder on first run
- Users can modify, delete, or add to built-in templates
- Plugin updates can refresh built-in templates (with user confirmation)

#### Template File Structure
Each template is stored as a `.md` file with the following structure:

```markdown
---
id: "user-template-1"
title: "My Custom Template"
category: "Custom"
description: "My personal template for brainstorming"
tags: ["custom", "personal", "brainstorming"]
created: "2024-01-01T00:00:00Z"
updated: "2024-01-15T10:30:00Z"
favorite: true
author: "user"
version: "1.0"
---

# Template Content

This is the actual template content that will be inserted into the chat input.

You can use markdown formatting here, including:
- **Bold text**
- *Italic text*
- [Links](https://example.com)
- `Code snippets`

## Variables

Templates can include variables that users can fill in:
- `{{topic}}` - The main topic to discuss
- `{{context}}` - Additional context or constraints
- `{{style}}` - Writing style preference

### Current Variable Behavior

When a template is selected, variables are automatically replaced with their default values or fallback text. The current implementation provides basic variable substitution without interactive user input.

### Current Limitations

**No User Input**: Variables are automatically replaced with defaults
- Variables are replaced with their `default` values when templates are selected
- No prompt is shown for users to enter custom values
- Users must manually edit the inserted content to customize variables

**No Interactive UI**: No prompt for user to enter custom values
- No modal dialog or form for variable input
- No validation of user-provided values against variable types
- No support for select-type variables with dropdown options
- No real-time preview of variable replacement

### Future Enhancements

The variable system is designed to be extensible for future interactive features:
- Interactive variable input dialogs
- Type validation for user-provided values
- Select dropdowns for choice-based variables
- Real-time preview of variable replacement
- Variable dependencies and conditional logic

## Example Usage

When this template is selected, the content below the frontmatter will be inserted into the chat input, with any variables replaced by user input or left as placeholders for manual editing.
```

#### Frontmatter Schema
```yaml
---
# Required fields
id: string                    # Unique identifier
title: string                 # Template title
category: string              # Template category
description: string           # Template description

# Optional fields
tags: string[]                # Searchable tags
created: string               # ISO date string
updated: string               # ISO date string
favorite: boolean             # Whether marked as favorite
author: string                # Template author (user for custom, "system" for built-in)
version: string               # Template version
aliases: string[]             # Alternative names for the template
variables: object             # Variable definitions and defaults
  topic:
    type: "string"
    default: "general discussion"
    description: "The main topic to discuss"
  context:
    type: "string"
    default: ""
    description: "Additional context or constraints"
---
```

#### Template Service Integration
The `TemplateService` will:
- Scan the configured template folder for `.md` files
- Parse frontmatter using Obsidian's built-in frontmatter parser
- Extract template content (everything below frontmatter)
- Cache templates in memory for performance
- Watch for file changes and reload templates automatically
- Auto-discover new templates when files are added to the folder
- Validate frontmatter structure and provide feedback for invalid templates

#### Benefits of Unified Markdown Storage
1. **Native Obsidian Editing**: Users can edit templates directly in Obsidian
2. **Version Control**: Templates are backed up with the vault
3. **Rich Formatting**: Support for markdown formatting in templates
4. **Easy Sharing**: Templates can be shared as regular markdown files
5. **Obsidian Features**: Templates benefit from Obsidian's linking, tagging, and search
6. **No Special Tools**: Users don't need to learn a new interface to edit templates
7. **Auto-Discovery**: Simply add a markdown file with frontmatter to create a template
8. **Configurable Location**: Users can choose where to store their templates
9. **Unified Experience**: All templates (built-in and custom) work the same way
10. **Easy Backup**: Templates are just regular files in the vault

## Search and Filtering Implementation

### Search Algorithm
```typescript
class TemplateSearchEngine {
  search(query: string, templates: ConversationTemplate[]): TemplateSearchResult[] {
    const results: TemplateSearchResult[] = [];
    
    for (const template of templates) {
      const score = this.calculateRelevanceScore(query, template);
      if (score > 0) {
        results.push({
          template,
          relevanceScore: score,
          matchedFields: this.getMatchedFields(query, template)
        });
      }
    }
    
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }
  
  private calculateRelevanceScore(query: string, template: ConversationTemplate): number {
    const queryLower = query.toLowerCase();
    let score = 0;
    
    // Title match (highest weight)
    if (template.title.toLowerCase().includes(queryLower)) {
      score += 10;
    }
    
    // Tag match (high weight)
    if (template.tags.some(tag => tag.toLowerCase().includes(queryLower))) {
      score += 8;
    }
    
    // Description match (medium weight)
    if (template.description.toLowerCase().includes(queryLower)) {
      score += 5;
    }
    
    // Content match (low weight)
    if (template.content.toLowerCase().includes(queryLower)) {
      score += 2;
    }
    
    // Category match (medium weight)
    if (template.category.toLowerCase().includes(queryLower)) {
      score += 6;
    }
    
    // Boost for favorites
    if (template.favorite) score += 3;
    
    return score;
  }
}
```

## Integration Points

### 1. Chat Panel Integration
- Extend `ChatPanel.tsx` to include template service
- Add template dropdown to chat input area
- Handle template selection and insertion

### 2. Settings Integration
- Add template management to plugin settings
- Configure template folder path with folder picker
- Configure default categories and preferences
- Import/export template functionality
- Template validation and error reporting

### 3. Keyboard Shortcuts
- `/` - Trigger template search
- `Ctrl/Cmd + /` - Open template manager
- `Ctrl/Cmd + Shift + T` - Create new template from current conversation

### 4. Obsidian File System Integration
- Leverage Obsidian's file watcher for automatic template updates
- Use Obsidian's frontmatter parser for metadata extraction
- Integrate with Obsidian's file explorer for template management
- Support Obsidian's linking and tagging system for templates
- Auto-discovery of new templates in configured folder

## Settings UI Design

### Template Settings Tab
```typescript
interface TemplateSettings {
  templateFolder: string;           // Path to template folder
  autoDiscovery: boolean;           // Enable auto-discovery of new templates
  validateTemplates: boolean;       // Validate frontmatter on load
  showInvalidTemplates: boolean;    // Show invalid templates in list
  defaultCategory: string;          // Default category for new templates
  maxSearchResults: number;         // Maximum search results to show

}
```

### Settings UI Components
1. **Folder Picker**: Browse and select template folder
2. **Template Validation**: Show validation status and errors
3. **Template Preview**: Preview of templates in current folder
4. **Import/Export**: Import templates from other sources
5. **Built-in Templates**: Manage built-in template updates

### Settings Features
- **Folder Validation**: Check if selected folder exists and is writable
- **Template Scanning**: Scan current folder and show template count
- **Error Reporting**: Show which files have invalid frontmatter
- **Quick Actions**: Open template folder, create new template, etc.

## Performance Considerations

### Optimization Strategies
1. **Lazy Loading**: Load template manager only when accessed
2. **Debounced Search**: Implement 300ms debounce for search queries
3. **Virtual Scrolling**: For large template lists in manager
4. **Caching**: Cache search results and template data
5. **Indexed Search**: Pre-index template content for faster search
6. **Incremental Scanning**: Only scan new/modified files

### Memory Management
- Limit cached search results to 100 items
- Clear unused template data periodically
- Implement template data compression for storage

## Security and Privacy

### Data Protection
- All user templates stored locally in Obsidian vault
- No template data transmitted to external services
- Template usage analytics stored locally only
- User consent required for any data collection

### Input Validation
- Sanitize template content to prevent XSS
- Validate template structure and content length
- Rate limit template creation and updates

## Error Handling

### Error Scenarios
1. **Template Loading Failures**: Graceful fallback to built-in templates
2. **Storage Errors**: Retry mechanism with user notification
3. **Search Failures**: Fallback to basic text search
4. **Template Corruption**: Automatic backup and recovery

### User Feedback
- Loading states for template operations
- Error messages with actionable guidance
- Success confirmations for template actions
- Progress indicators for bulk operations

## Testing Strategy

### Unit Tests
- Template service methods
- Search algorithm accuracy
- Storage operations
- Component rendering

### Integration Tests
- Template dropdown interaction
- Chat input integration
- Settings integration
- Keyboard navigation

### User Acceptance Tests
- Template creation workflow
- Search and selection experience
- Template management operations
- Performance under load

## Accessibility

### Keyboard Navigation
- Full keyboard support for template selection
- Clear focus indicators
- Logical tab order
- Escape key to close dropdowns

### Screen Reader Support
- Proper ARIA labels and descriptions
- Semantic HTML structure
- Announcements for template selection
- Clear navigation instructions

### Visual Accessibility
- High contrast mode support
- Scalable text and icons
- Clear visual hierarchy
- Consistent color usage

## Future Enhancements

### Phase 2 Features
- Template sharing between vaults
- Template versioning and history
- Advanced template variables
- Template performance analytics

### Phase 3 Features
- Community template marketplace
- AI-powered template suggestions
- Template collaboration features
- Advanced search filters

## Implementation Timeline

### Phase 1 (Core Features) - 2 weeks
- Template service and storage
- Basic template dropdown
- Built-in template library
- Simple template management

### Phase 2 (Enhanced Features) - 1 week
- Advanced search and filtering
- Template categories and organization
- Custom template creation
- Settings integration

### Phase 3 (Polish) - 1 week
- Performance optimization
- Accessibility improvements
- Error handling and edge cases
- Documentation and testing 
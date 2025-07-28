# Personas Feature - Technical Design Document

## Overview
This document outlines the technical implementation of the Personas feature for the Tangent plugin. The feature will allow users to select different AI personas that modify the AI's behavior and communication style, with visual indicators in the chat interface.

## Architecture Overview

### High-Level Architecture
The personas feature will follow a similar architecture to the existing templates system:

```
PersonaService (Core Service)
├── PersonaFileManager (File Operations)
├── PersonaParser (Markdown Parsing)
├── PersonaUI (Selection Interface)
└── PersonaIntegration (System Prompt Integration)
```

### Integration Points
- **TemplateService**: Leverage existing file management patterns
- **ChatPanel**: Add persona selection UI and visual indicators
- **systemPrompt.ts**: Integrate persona content with system prompt
- **types.ts**: Add persona-related type definitions

## Data Models

### Persona Interface
```typescript
interface Persona {
  id: string;
  name: string;
  description: string;
  content: string;           // Behavior instructions
  color: string;             // Hex color for visual identification
  author: string;            // "system" for built-in, "user" for custom
  created: string;
  updated: string;
  filePath?: string;         // Path to markdown file for user personas
}
```

### Persona File Structure
Personas will be stored as markdown files with frontmatter:

```markdown
---
id: "product-manager"
name: "Product Manager"
description: "AI that thinks like a product manager, focusing on user needs, business value, and strategic thinking"
color: "#3B82F6"
author: "system"
created: "2024-01-01T00:00:00Z"
updated: "2024-01-01T00:00:00Z"
---
You are a Product Manager AI assistant. Your role is to:

- Think strategically about user needs and business value
- Ask clarifying questions to understand requirements
- Provide structured analysis with clear recommendations
- Focus on user experience and market fit
- Consider technical feasibility and resource constraints

When responding, always:
1. Start by understanding the user's goal
2. Break down complex problems into manageable pieces
3. Provide actionable next steps
4. Consider both short-term and long-term implications
```

## Core Components

### 1. PersonaService
**Location**: `personaService.ts`

**Responsibilities**:
- Load and manage persona files
- Parse persona markdown files
- Provide persona selection interface
- Handle persona file watching for changes

**Key Methods**:
```typescript
class PersonaService {
  async initialize(): Promise<void>
  async getAllPersonas(): Promise<Persona[]>
  async getPersonaById(id: string): Promise<Persona | null>
  async parsePersonaFromFile(file: TFile): Promise<Persona | null>
  private setupFileWatcher(): void
  private async handlePersonaFileChange(file: TFile): Promise<void>
  private async handlePersonaFileRemoval(file: TFile): Promise<void>
}
```

**Implementation Details**:
- Follows same patterns as TemplateService
- Uses Obsidian's file system for storage
- Implements file watching for real-time updates
- Handles both built-in and custom personas
- No UI for persona creation - purely file-based

### 2. PersonaFileManager
**Location**: `personaService.ts` (internal class)

**Responsibilities**:
- Manage persona folder structure
- Ensure folder exists and is accessible
- Monitor folder for file changes

**Folder Structure**:
```
tangent/
├── templates/          (existing)
└── personas/          (new)
    ├── product-manager.md
    ├── technical-writer.md
    ├── prompt-enhancer.md
    └── ...
```

### 3. PersonaParser
**Location**: `personaService.ts` (internal methods)

**Responsibilities**:
- Parse markdown files with frontmatter
- Validate persona structure
- Convert frontmatter to Persona interface

**Parsing Logic**:
```typescript
private async parsePersonaFromFile(file: TFile): Promise<Persona | null> {
  const content = await this.app.vault.read(file);
  const frontmatter = this.extractFrontmatter(content);
  const personaContent = this.extractContent(content);
  
  return {
    id: frontmatter.id,
    name: frontmatter.name,
    description: frontmatter.description,
    content: personaContent,
    color: frontmatter.color,
    author: frontmatter.author,
    created: frontmatter.created,
    updated: frontmatter.updated,
    filePath: file.path
  };
}
```

### 4. PersonaUI Components

#### PersonaSelector Component
**Location**: `src/components/PersonaSelector.tsx`

**Responsibilities**:
- Display persona selection in the center of empty chat panel
- Show persona information (name, description, color)
- Handle persona selection
- Hide when chat has messages

**UI Structure**:
```typescript
interface PersonaSelectorProps {
  personas: Persona[];
  selectedPersona: Persona | null;
  onPersonaSelect: (persona: Persona) => void;
  onPersonaClear: () => void;
  isVisible: boolean; // Controls visibility based on chat state
}
```

**Visual Design**:
- Centered in empty chat panel
- Card-style layout with persona options
- Color indicators next to each persona
- Clear selection option
- Responsive design matching existing UI
- Only visible when chat is empty (no messages sent)

#### PersonaHeader Component
**Location**: `src/components/PersonaHeader.tsx`

**Responsibilities**:
- Display active persona name in chat header
- Show persona color indicator
- Provide persona switching functionality

**UI Structure**:
```typescript
interface PersonaHeaderProps {
  activePersona: Persona | null;
  onPersonaChange: (persona: Persona | null) => void;
  personas: Persona[];
}
```

### 5. System Prompt Integration

#### Enhanced System Prompt
**Location**: `systemPrompt.ts`

**Implementation**:
```typescript
export const createSystemPrompt = (persona?: Persona): string => {
  const basePrompt = `You are an AI assistant whose job is to help the user with their questions.

# Obsidian: How It Works
...`;

  if (persona) {
    return `${basePrompt}

# Active Persona: ${persona.name}
${persona.content}`;
  }

  return basePrompt;
};
```

#### ChatPanel Integration
**Location**: `ChatPanel.tsx`

**Changes Required**:
- Add persona state management
- Integrate persona selection UI
- Apply persona styling to chat panel
- Pass persona-enhanced system prompt to AI

## Implementation Details

### US-1: Select a Persona for New Chat

**Implementation**:
1. **Persona State Management**:
   ```typescript
   const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
   const [personas, setPersonas] = useState<Persona[]>([]);
   const [isPersonaSelectorVisible, setIsPersonaSelectorVisible] = useState(true);
   ```

2. **Persona Loading**:
   ```typescript
   useEffect(() => {
     const loadPersonas = async () => {
       const allPersonas = await personaService.getAllPersonas();
       setPersonas(allPersonas);
     };
     loadPersonas();
   }, []);
   ```

3. **Persona Selection Handler**:
   ```typescript
   const handlePersonaSelect = (persona: Persona) => {
     setSelectedPersona(persona);
     // Apply persona styling
     applyPersonaStyling(persona);
   };
   ```

4. **Visibility Control**:
   ```typescript
   const handleFirstMessage = () => {
     setIsPersonaSelectorVisible(false);
   };
   
   const handleNewChat = () => {
     setSelectedPersona(null);
     setIsPersonaSelectorVisible(true);
     clearPersonaStyling();
   };
   ```

### US-2: View Available Personas

**Implementation**:
1. **Centered Persona Selector Component**:
   ```typescript
   const PersonaSelector: React.FC<{personas: Persona[], onSelect: (p: Persona) => void, isVisible: boolean}> = ({personas, onSelect, isVisible}) => {
     if (!isVisible) return null;
     
     return (
       <div className="tangent-persona-selector-container">
         <div className="tangent-persona-selector">
           <h3 className="tangent-persona-selector-title">Choose a Persona</h3>
           <p className="tangent-persona-selector-subtitle">Select how you'd like the AI to behave in this conversation</p>
           <div className="tangent-persona-options">
             {personas.map(persona => (
               <div 
                 key={persona.id} 
                 className="tangent-persona-option"
                 onClick={() => onSelect(persona)}
               >
                 <div 
                   className="tangent-persona-color" 
                   style={{backgroundColor: persona.color}}
                 />
                 <div className="tangent-persona-info">
                   <div className="tangent-persona-name">{persona.name}</div>
                   <div className="tangent-persona-description">{persona.description}</div>
                 </div>
               </div>
             ))}
           </div>
         </div>
       </div>
     );
   };
   ```

### US-3: Create Custom Personas

**Implementation**:
1. **File-based Creation**: Users create personas by adding markdown files to the `tangent/personas/` folder
2. **Automatic Loading**: PersonaService automatically detects and loads new persona files
3. **File Watching**: Real-time updates when persona files are added, modified, or deleted

**User Process**:
- Navigate to `tangent/personas/` folder in Obsidian
- Create new markdown file with appropriate frontmatter and content
- File is automatically loaded and available for selection
- No UI interface needed for persona creation

### US-4: Visual Persona Identification

**Implementation**:
1. **Chat Panel Styling**:
   ```typescript
   const applyPersonaStyling = (persona: Persona) => {
     const chatPanel = document.querySelector('.tangent-chat-panel');
     if (chatPanel) {
       chatPanel.style.borderColor = persona.color;
       chatPanel.style.borderWidth = '2px';
       chatPanel.style.borderStyle = 'solid';
     }
   };
   ```

2. **Persona Header Display**:
   ```typescript
   const PersonaHeader: React.FC<{persona: Persona}> = ({persona}) => {
     return (
       <div className="tangent-persona-header">
         <div 
           className="tangent-persona-indicator"
           style={{backgroundColor: persona.color}}
         />
         <span className="tangent-persona-name">{persona.name}</span>
       </div>
     );
   };
   ```

### US-5: Persona Behavior Integration

**Implementation**:
1. **Enhanced System Prompt**:
   ```typescript
   const getSystemPrompt = (persona?: Persona): string => {
     const basePrompt = systemPrompt;
     
     if (persona) {
       return `${basePrompt}

# Active Persona: ${persona.name}
${persona.content}`;
     }
     
     return basePrompt;
   };
   ```

2. **AI Integration with Message Handling**:
   ```typescript
   const sendMessage = async (messageText?: string) => {
     // Hide persona selector on first message
     if (isPersonaSelectorVisible) {
       handleFirstMessage();
     }
     
     const currentSystemPrompt = getSystemPrompt(selectedPersona);
     
     await streamAIResponse(
       messageText || inputValue,
       onToken,
       selectedModel,
       onToolCall,
       onToolResult,
       onToolsComplete,
       conversationHistory,
       thinkingBudget,
       onThinking,
       onToolConfirmationNeeded,
       webSearchEnabled,
       abortController,
       onSearchResults,
       currentSystemPrompt  // Pass enhanced system prompt
     );
   };
   ```

3. **New Chat Handler**:
   ```typescript
   const handleNewChat = () => {
     setSelectedPersona(null);
     setIsPersonaSelectorVisible(true);
     clearPersonaStyling();
     // ... other new chat logic
   };
   ```

## Built-in Personas

### Initial Persona Set
1. **Product Manager** (`product-manager.md`)
   - Focus on user needs and business value
   - Strategic thinking and structured analysis

2. **Technical Writer** (`technical-writer.md`)
   - Clear, concise documentation
   - User-friendly explanations

3. **Prompt Enhancer** (`prompt-enhancer.md`)
   - Help users improve their prompts
   - Suggest better ways to ask questions

4. **Creative Assistant** (`creative-assistant.md`)
   - Brainstorming and ideation
   - Creative problem solving

5. **Code Reviewer** (`code-reviewer.md`)
   - Code analysis and suggestions
   - Best practices and optimization

## CSS Styling

### Persona Visual Elements
```css
/* Centered persona selector styling */
.tangent-persona-selector-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
  padding: 20px;
}

.tangent-persona-selector {
  background: var(--background-primary);
  border: 1px solid var(--background-modifier-border);
  border-radius: 12px;
  padding: 24px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.tangent-persona-selector-title {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  text-align: center;
  color: var(--text-normal);
}

.tangent-persona-selector-subtitle {
  margin: 0 0 24px 0;
  font-size: 14px;
  text-align: center;
  color: var(--text-muted);
}

.tangent-persona-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tangent-persona-option {
  display: flex;
  align-items: center;
  padding: 16px;
  cursor: pointer;
  border: 1px solid var(--background-modifier-border);
  border-radius: 8px;
  transition: all 0.2s ease;
  background: var(--background-secondary);
}

.tangent-persona-option:hover {
  background: var(--background-modifier-hover);
  border-color: var(--interactive-accent);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tangent-persona-color {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  margin-right: 12px;
  flex-shrink: 0;
  border: 2px solid var(--background-modifier-border);
}

.tangent-persona-info {
  flex: 1;
}

.tangent-persona-name {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 4px;
  color: var(--text-normal);
}

.tangent-persona-description {
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.4;
}

/* Persona header styling */
.tangent-persona-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: var(--background-secondary);
  border-bottom: 1px solid var(--background-modifier-border);
}

.tangent-persona-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
}

/* Chat panel persona border */
.tangent-chat-panel[data-persona] {
  border: 2px solid;
  border-radius: 8px;
}
```

## Error Handling

### Persona Loading Errors
- Graceful fallback if persona files are corrupted
- Log errors but don't break plugin functionality
- Provide default persona if loading fails

### File System Errors
- Handle permission issues gracefully
- Provide user feedback for file operation failures
- Retry mechanisms for temporary failures

### Validation Errors
- Validate persona structure on load
- Provide clear error messages for invalid personas
- Skip invalid personas rather than breaking the system

## Testing Strategy

### Unit Tests
- PersonaService methods
- Persona parsing logic
- System prompt integration

### Integration Tests
- Persona selection flow
- File system operations
- UI component interactions

### Manual Testing
- Persona creation and editing
- Visual styling verification
- AI behavior validation

## Migration and Backward Compatibility

### Existing Conversations
- Conversations without personas continue to work normally
- No migration required for existing data
- Persona selection is optional

### Plugin Updates
- Built-in personas are installed on first run
- Custom personas are preserved during updates
- No breaking changes to existing functionality

## Performance Considerations

### Lazy Loading
- Personas are loaded only when needed
- File watching is efficient and doesn't impact performance
- UI updates are debounced to prevent excessive re-renders

### Caching
- Persona data is cached in memory
- File system operations are minimized
- Search results are cached for better performance

## Security Considerations

### File Validation
- Validate persona file content before loading
- Sanitize user input in persona creation
- Prevent path traversal attacks

### Content Safety
- Persona content is treated as trusted user input
- No execution of persona content as code
- Safe integration with system prompt 
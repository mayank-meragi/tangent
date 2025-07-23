# Template Settings Control - Design Document

## Overview
This document outlines the detailed implementation design for the Template Settings Control feature, which allows templates to store and control settings like thinking budget and web search, with automatic activation when templates are inserted.

## Architecture Overview

### Data Model Extensions

#### 1. Extended ConversationTemplate Interface
```typescript
// Extended in tools/types.ts
export interface ConversationTemplate {
  // ... existing fields ...
  settings?: TemplateSettings;
}

export interface TemplateSettings {
  thinkingEnabled?: boolean;      // Enable/disable thinking
  webSearchEnabled?: boolean;     // Enable/disable web search
  modelId?: string;              // Preferred model ID
}
```



### Core Components

#### 1. Enhanced Template Service
**File:** `templateService.ts` (extended)
**Purpose:** Handle settings in template parsing and management

**Key Changes:**
- Parse settings from frontmatter (treated like other template variables)
- Store settings in template objects
- Handle settings in template creation/editing

#### 2. Enhanced Template Insertion Modal
**File:** `src/components/VariableInputModal.tsx` (extended)
**Purpose:** Show template settings and allow user control during insertion

```typescript
interface TemplateInsertionModalProps {
  template: ConversationTemplate;
  onConfirm: (variables: Record<string, any>, settings: TemplateSettings) => void;
  onCancel: () => void;
}
```

## Implementation Details

### Phase 1: Data Model and Template Service Integration

#### 1.1 Extend Type Definitions
**File:** `tools/types.ts`

```typescript
// Add new interface
export interface TemplateSettings {
  thinkingEnabled?: boolean;
  webSearchEnabled?: boolean;
  modelId?: string;
}

// Extend existing interface
export interface ConversationTemplate {
  // ... existing fields ...
  settings?: TemplateSettings;
}
```

#### 1.2 Enhanced Template Insertion Modal
**File:** `src/components/VariableInputModal.tsx` (extended)

The existing VariableInputModal will be enhanced to include template settings control. Users will see the template's suggested settings and can modify them before insertion.

```typescript
interface TemplateInsertionModalProps {
  template: ConversationTemplate;
  onConfirm: (variables: Record<string, any>, settings: TemplateSettings) => void;
  onCancel: () => void;
}
```

### Phase 2: Template Service Integration

#### 2.1 Extend Template Service
**File:** `templateService.ts` (modifications)

```typescript
export class TemplateService {
  // Modify parseTemplateFromFile method
  async parseTemplateFromFile(file: TFile): Promise<ConversationTemplate | null> {
    try {
      const content = await this.app.vault.read(file);
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      
      if (!frontmatterMatch) {
        console.warn(`Template file ${file.path} has no frontmatter`);
        return null;
      }

      const [, frontmatterStr, templateContent] = frontmatterMatch;
      const frontmatter = this.parseFrontmatter(frontmatterStr);
      
      // Parse settings from frontmatter (treated like other variables)
      const settings = this.parseSettingsFromFrontmatter(frontmatter);

      const template: ConversationTemplate = {
        // ... existing fields ...
        settings: settings,
      };

      return template;
    } catch (error) {
      console.error(`Error parsing template file ${file.path}:`, error);
      return null;
    }
  }

  private parseSettingsFromFrontmatter(frontmatter: any): Partial<TemplateSettings> {
    const settings: Partial<TemplateSettings> = {};

    if (frontmatter.settings) {
      const rawSettings = frontmatter.settings;
      
      if (rawSettings.thinkingEnabled !== undefined) {
        settings.thinkingEnabled = Boolean(rawSettings.thinkingEnabled);
      }
      
      if (rawSettings.webSearchEnabled !== undefined) {
        settings.webSearchEnabled = Boolean(rawSettings.webSearchEnabled);
      }
      
      if (rawSettings.modelId !== undefined) {
        settings.modelId = String(rawSettings.modelId);
      }
    }

    return settings;
  }

  // Modify serializeTemplateToFrontmatter method
  serializeTemplateToFrontmatter(template: ConversationTemplate): string {
    const frontmatter: any = {
      // ... existing fields ...
    };

    // Add settings to frontmatter
    if (template.settings) {
      frontmatter.settings = {
        thinkingEnabled: template.settings.thinkingEnabled,
        webSearchEnabled: template.settings.webSearchEnabled,
        modelId: template.settings.modelId
      };
    }

    return `---\n${YAML.stringify(frontmatter)}\n---\n\n${template.content}`;
  }
}
```

### Phase 3: UI Integration

#### 3.1 Enhanced Template Dropdown
**File:** `src/components/Dropdown.tsx` (modifications)

```typescript
// Add settings preview component
const TemplateSettingsPreview: React.FC<{ settings?: TemplateSettings }> = ({ settings }) => {
  if (!settings) return null;

  return (
    <div className="template-settings-preview">
      <div className="settings-icon">
        <LucidIcon name="settings" size={12} />
      </div>
      <div className="settings-list">
        {settings.thinkingEnabled !== undefined && (
          <span className="setting-item">
            <LucidIcon name="brain" size={10} />
            Thinking: {settings.thinkingEnabled ? 'On' : 'Off'}
          </span>
        )}
        {settings.webSearchEnabled !== undefined && (
          <span className="setting-item">
            <LucidIcon name="search" size={10} />
            Web: {settings.webSearchEnabled ? 'On' : 'Off'}
          </span>
        )}
        {settings.modelId !== undefined && (
          <span className="setting-item">
            <LucidIcon name="cpu" size={10} />
            {MODEL_CONFIGS[settings.modelId]?.name || settings.modelId}
          </span>
        )}
      </div>
    </div>
  );
};

// Modify dropdown item rendering to include settings preview
const renderTemplateItem = (item: DropdownItem) => {
  const template = item.template;
  if (!template) return null;

  return (
    <div className="dropdown-item template-item">
      <div className="item-main">
        <div className="item-title">{item.title}</div>
        <div className="item-description">{item.description}</div>
      </div>
      <TemplateSettingsPreview settings={template.settings} />
    </div>
  );
};
```

#### 3.2 Enhanced Chat Panel
**File:** `ChatPanel.tsx` (modifications)

```typescript
// Modify handleTemplateSelect to pass settings to modal
const handleTemplateSelect = async (template: ConversationTemplate) => {
  try {
    // Show enhanced modal with settings control
    setShowVariableInputModal(true);
    setSelectedTemplate(template);
  } catch (error) {
    console.error('Error selecting template:', error);
  }
};

// Modify handleVariableInputConfirm to handle settings
const handleVariableInputConfirm = (variables: Record<string, any>, settings: TemplateSettings) => {
  // Apply settings to chat state (input area)
  if (settings.thinkingEnabled !== undefined) {
    setThinkingEnabled(settings.thinkingEnabled);
  }
  
  if (settings.webSearchEnabled !== undefined) {
    setWebSearchEnabled(settings.webSearchEnabled);
  }
  
  if (settings.modelId !== undefined) {
    const newModel = MODEL_CONFIGS[settings.modelId];
    if (newModel) {
      setSelectedModel(newModel);
    }
  }

  // Insert template with variables
  insertTemplateWithVariables(selectedTemplate!, variables);
  
  setShowVariableInputModal(false);
  setSelectedTemplate(null);
};
```

#### 3.3 Enhanced Variable Input Modal
**File:** `src/components/VariableInputModal.tsx` (extended)

The existing VariableInputModal will be enhanced to include template settings control alongside variable input.

```typescript
interface VariableInputModalProps {
  template: ConversationTemplate;
  onConfirm: (variables: Record<string, any>, settings: TemplateSettings) => void;
  onCancel: () => void;
}

const VariableInputModal: React.FC<VariableInputModalProps> = ({
  template,
  onConfirm,
  onCancel
}) => {
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [settings, setSettings] = useState<TemplateSettings>(
    template.settings || { thinkingEnabled: false, webSearchEnabled: false }
  );

  const handleConfirm = () => {
    onConfirm(variables, settings);
  };

  return (
    <div className="variable-input-modal">
      <h3>Insert Template: {template.title}</h3>
      
      {/* Template Settings Section */}
      <div className="template-settings-section">
        <h4>AI Settings</h4>
        <div className="settings-controls">
          <label>
            <input
              type="checkbox"
              checked={settings.thinkingEnabled ?? false}
              onChange={(e) => setSettings({...settings, thinkingEnabled: e.target.checked})}
            />
            Enable thinking
          </label>
          
          <label>
            <input
              type="checkbox"
              checked={settings.webSearchEnabled ?? false}
              onChange={(e) => setSettings({...settings, webSearchEnabled: e.target.checked})}
            />
            Enable web search
          </label>
          
          <label>
            Model:
            <select
              value={settings.modelId ?? ''}
              onChange={(e) => setSettings({...settings, modelId: e.target.value})}
            >
              <option value="">Use current model</option>
              {Object.entries(MODEL_CONFIGS).map(([id, config]) => (
                <option key={id} value={id}>{config.name}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Variables Section */}
      {template.variables && template.variables.length > 0 && (
        <div className="variables-section">
          <h4>Template Variables</h4>
          {/* ... existing variable input logic ... */}
        </div>
      )}

      <div className="modal-actions">
        <button onClick={onCancel}>Cancel</button>
        <button onClick={handleConfirm}>Insert Template</button>
      </div>
    </div>
  );
};
```

### Phase 4: Template Creation/Editing Integration

#### 4.1 Enhanced Template Creation Modal
**File:** Template creation/editing interface (to be determined based on existing implementation)

When users create or edit templates, they will be able to specify the default settings that should be suggested when the template is inserted.

```typescript
// Template creation/editing will include settings section
const TemplateSettingsSection: React.FC<{
  settings: TemplateSettings;
  onSettingsChange: (settings: TemplateSettings) => void;
}> = ({ settings, onSettingsChange }) => {
  return (
    <div className="template-settings-section">
      <h4>Suggested AI Settings</h4>
      <p className="settings-description">
        These settings will be suggested when users insert this template. Users can modify them before insertion.
      </p>
      
      <div className="settings-controls">
        <label>
          <input
            type="checkbox"
            checked={settings.thinkingEnabled ?? false}
            onChange={(e) => onSettingsChange({...settings, thinkingEnabled: e.target.checked})}
          />
          Suggest enabling thinking
        </label>
        
        <label>
          <input
            type="checkbox"
            checked={settings.webSearchEnabled ?? false}
            onChange={(e) => onSettingsChange({...settings, webSearchEnabled: e.target.checked})}
          />
          Suggest enabling web search
        </label>
        
        <label>
          Suggest model:
          <select
            value={settings.modelId ?? ''}
            onChange={(e) => onSettingsChange({...settings, modelId: e.target.value})}
          >
            <option value="">No preference</option>
            {Object.entries(MODEL_CONFIGS).map(([id, config]) => (
              <option key={id} value={id}>{config.name}</option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
};
```

## CSS Styling

### Template Settings Preview
```css
.template-settings-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 4px;
}

.settings-icon {
  opacity: 0.6;
}

.settings-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  background: var(--background-secondary);
  border-radius: 4px;
  font-size: 10px;
}

.template-settings-section {
  margin: 16px 0;
  padding: 16px;
  background: var(--background-secondary);
  border-radius: 8px;
  border: 1px solid var(--background-modifier-border);
}

.settings-description {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.settings-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.settings-controls label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.settings-controls select {
  margin-left: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid var(--background-modifier-border);
  background: var(--background-primary);
  color: var(--text-normal);
}
```

## Error Handling

### Settings Parsing
- Invalid settings are ignored and default values are used
- Settings are optional and don't prevent template loading
- Simple boolean/string validation without complex error handling

### Backward Compatibility
- Existing templates without settings continue to work
- Default settings are applied for templates without explicit settings
- Settings are optional in the template structure

### Performance Considerations
- Settings are parsed directly from frontmatter like other variables
- No additional validation overhead
- Template loading performance is not impacted by settings parsing

## Testing Strategy

### Unit Tests
- Template settings parsing from frontmatter
- Settings application to input area
- Backward compatibility with existing templates

### Integration Tests
- Template insertion with settings
- Settings control in modal
- UI updates when settings are applied

### User Acceptance Tests
- Template creation with settings
- Settings preview in dropdown
- Settings control during template insertion
- Settings application to input area

## Migration Plan

### Phase 1: Data Model and Template Service
- Implement data model extensions
- Extend template service to parse settings from frontmatter
- Add settings to template serialization

### Phase 2: UI Integration
- Integrate with existing template system
- Add settings preview to dropdown
- Enhance VariableInputModal with settings controls

### Phase 3: Settings Application
- Apply settings to input area when template is inserted
- Handle settings in template creation/editing
- Test settings flow end-to-end

### Phase 4: Polish and Testing
- Add comprehensive error handling
- Optimize performance
- Complete testing and bug fixes 
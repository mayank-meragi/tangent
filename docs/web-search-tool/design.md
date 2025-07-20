# Design Document: Gemini Web Search Grounding Implementation

## Overview
This document outlines the detailed implementation design for integrating Gemini's built-in grounding with Google Search feature into the Tangent plugin. The implementation will add a toggle in the chat input area to enable/disable web search functionality.

## Architecture Overview

### Current Architecture
The Tangent plugin currently uses:
- `ai.ts` - Handles AI communication with Gemini API
- `ChatPanel.tsx` - Main chat interface component
- `main.tsx` - Plugin initialization and settings
- `modelConfigs.ts` - Model configuration definitions

### New Architecture with Web Search
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   ChatPanel     │    │      ai.ts       │    │   Gemini API    │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │ Web Search  │ │───▶│ │ Grounding    │ │───▶│ │ google_     │ │
│ │ Toggle      │ │    │ │ Config       │ │    │ │ search      │ │
│ └─────────────┘ │    │ └──────────────┘ │    │ │ Tool        │ │
│                 │    │                  │    │ └─────────────┘ │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │                 │
│ │ Visual      │ │◀───│ │ Response     │ │◀───│ ┌─────────────┐ │
│ │ Feedback    │ │    │ │ Processing   │ │    │ │ Grounding   │ │
│ └─────────────┘ │    │ └──────────────┘ │    │ │ Metadata    │ │
└─────────────────┘    └──────────────────┘    │ └─────────────┘ │
                                               └─────────────────┘
```

## Implementation Details

### 1. User Story 1: Enable Web Search Toggle

#### 1.1 Settings Storage
**File**: `main.tsx`
- Add `webSearchEnabled: boolean` to `MyPluginSettings` interface
- Set default value to `false` in `DEFAULT_SETTINGS`
- Add setting to `GeminiSettingTab` for global web search toggle

**Code Changes**:
```typescript
interface MyPluginSettings {
  // ... existing settings
  webSearchEnabled: boolean;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
  // ... existing defaults
  webSearchEnabled: false
};
```

#### 1.2 Chat Input Toggle Component
**File**: `ChatPanel.tsx`
- Add web search toggle state: `const [webSearchEnabled, setWebSearchEnabled] = useState(false)`
- Create toggle button component in chat input area
- Position toggle next to send button or in input container
- Add warning modal/notification when switching modes
- Show current mode indicator (Web Search vs Tools)

**Component Design**:
```typescript
const WebSearchToggle: React.FC<{
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}> = ({ enabled, onToggle }) => {
  const handleToggle = () => {
    if (enabled) {
      // Switching from web search to tools
      if (confirm('Disable web search? Other tools will be re-enabled.')) {
        onToggle(false);
      }
    } else {
      // Switching from tools to web search
      if (confirm('Enable web search? This will disable other tools.')) {
        onToggle(true);
      }
    }
  };

  return (
    <button
      className={`web-search-toggle ${enabled ? 'enabled' : 'disabled'}`}
      onClick={handleToggle}
      title={enabled ? 'Web search enabled (other tools disabled)' : 'Web search disabled (other tools enabled)'}
    >
      <LucidIcon name="search" size={16} />
      {enabled && <span className="indicator">ON</span>}
      <span className="mode-indicator">
        {enabled ? 'Web Search' : 'Tools'}
      </span>
    </button>
  );
};
```

#### 1.3 State Persistence
- Store toggle state in plugin settings
- Sync with global setting from settings tab
- Persist across chat sessions and app restarts

### 2. User Story 2: Web Search Integration

#### 2.1 AI Configuration Updates
**File**: `ai.ts`
- Modify `streamAIResponse` function to accept `webSearchEnabled` parameter
- Update `GenerateContentConfig` to include Google Search tool when enabled (EXCLUSIVE with other tools)
- Handle grounding metadata in response processing
- Implement mutual exclusion logic between web search and function calling tools

**Implementation**:
```typescript
export async function streamAIResponse({
  // ... existing parameters
  webSearchEnabled = false,
}: {
  // ... existing types
  webSearchEnabled?: boolean;
}) {
  // ... existing initialization
  
  // Build config with either web search OR function tools, not both
  const config: GenerateContentConfig = {
    tools: []
  };

  if (webSearchEnabled) {
    // Web search mode: only send Google Search tool
    config.tools.push({
      googleSearch: {}
    });
  } else {
    // Function calling mode: send all other tools
    config.tools.push({
      functionDeclarations: toolFunctionDeclarations
    });
  }
  
  // ... rest of implementation
}
```

#### 2.2 Response Processing
- Parse grounding metadata from Gemini response
- Extract search results and citations
- Format response to show search sources
- Handle cases where no search was performed

**Grounding Metadata Processing**:
```typescript
// Process grounding metadata
if (fullResponse?.candidates?.[0]?.groundingMetadata) {
  const metadata = fullResponse.candidates[0].groundingMetadata;
  if (metadata.webSearchQueries) {
    // Format search results for display
    const searchResults = metadata.webSearchQueries.map(query => ({
      query: query.searchQuery,
      results: query.searchResults
    }));
    
    // Add search context to response
    if (onToken) {
      onToken('\n\n**Sources from web search:**\n');
      searchResults.forEach(result => {
        onToken(`- ${result.query}: ${result.results.length} results\n`);
      });
    }
  }
}
```

#### 2.3 Integration with Existing Tools
**IMPORTANT LIMITATION**: When web search is enabled, other tools cannot be used simultaneously. This is a constraint of the Gemini API where web search and function calling tools are mutually exclusive.

**Implementation Strategy**:
- When web search is enabled, only send the `googleSearch: {}` tool to Gemini
- When web search is disabled, send all other function calling tools
- Provide clear user feedback about this limitation
- Add warning/notification when switching between modes

**Code Changes**:
```typescript
// Build config with either web search OR function tools, not both
const config: GenerateContentConfig = {
  tools: []
};

if (webSearchEnabled) {
  // Web search mode: only send Google Search tool
  config.tools.push({
    googleSearch: {}
  });
} else {
  // Function calling mode: send all other tools
  config.tools.push({
    functionDeclarations: toolFunctionDeclarations
  });
}
```

**User Experience**:
- Show warning when enabling web search: "Web search will disable other tools"
- Show warning when disabling web search: "Other tools will be re-enabled"
- Clear visual indication of current mode (Web Search vs Tools)
- Graceful handling of tool switching

### 3. User Story 3: Visual Feedback

#### 3.1 Search Status Indicators
**File**: `ChatPanel.tsx`
- Add visual indicator when web search is active
- Show search progress during API calls
- Display search results in chat messages

**Components**:
```typescript
// Search status indicator
const SearchStatusIndicator: React.FC<{ isSearching: boolean }> = ({ isSearching }) => (
  isSearching && (
    <div className="search-status">
      <LucidIcon name="search" size={12} className="spinning" />
      <span>Searching web...</span>
    </div>
  )
);

// Search results display
const SearchResultsDisplay: React.FC<{ results: any[] }> = ({ results }) => (
  <div className="search-results">
    <h4>Web Search Results:</h4>
    {results.map((result, index) => (
      <div key={index} className="search-result">
        <a href={result.url} target="_blank" rel="noopener noreferrer">
          {result.title}
        </a>
        <p>{result.snippet}</p>
      </div>
    ))}
  </div>
);
```

#### 3.2 Message Formatting
- Format AI responses to clearly indicate when web search was used
- Add source citations and links
- Style search results distinctly from regular responses

#### 3.3 Loading States
- Show loading indicator during web search
- Provide feedback when search is complete
- Handle search failures gracefully

## Technical Implementation

### 1. API Integration
Based on [Google's official documentation](https://ai.google.dev/gemini-api/docs/google-search), the implementation will use:

```typescript
// For Gemini 2.0+ models
const groundingTool = {
  googleSearch: {}
};

const config = {
  tools: [groundingTool]
};
```

### 2. Supported Models
According to the documentation, grounding with Google Search is supported on:
- Gemini 2.5 Pro ✅
- Gemini 2.5 Flash ✅  
- Gemini 2.0 Flash ✅
- Gemini 1.5 Pro ✅
- Gemini 1.5 Flash ✅

### 3. Error Handling
- Handle API rate limits and quotas
- Graceful fallback when web search is unavailable
- User-friendly error messages
- Retry logic for transient failures

### 4. Performance Considerations
- Minimize latency impact of web search
- Cache search results where appropriate
- Optimize API calls to reduce costs
- Handle concurrent requests efficiently

## UI/UX Design

### 1. Toggle Button Design
- **Position**: Bottom of chat input area, next to send button
- **Style**: Icon button with search icon and mode indicator
- **States**: 
  - Disabled: Gray search icon with "Tools" indicator
  - Enabled: Blue search icon with "ON" and "Web Search" indicators
- **Tooltip**: "Enable/disable web search (disables other tools)"
- **Confirmation**: Show confirmation dialog when switching modes

### 2. Visual Feedback Design
- **Search Status**: Small spinner with "Searching web..." text
- **Search Results**: Collapsible section in AI responses
- **Sources**: Clickable links with proper attribution
- **Loading States**: Smooth transitions and clear indicators

### 3. Accessibility
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Clear focus indicators

## CSS Styling

### 1. Toggle Button Styles
```css
.web-search-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  border: 1px solid var(--background-modifier-border);
  border-radius: 4px;
  background: var(--background-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.web-search-toggle.enabled {
  background: var(--color-blue);
  color: white;
  border-color: var(--color-blue);
}

.web-search-toggle .indicator {
  font-size: 10px;
  font-weight: bold;
}

.web-search-toggle .mode-indicator {
  font-size: 9px;
  opacity: 0.8;
  margin-left: 2px;
}
```

### 2. Search Status Styles
```css
.search-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: var(--background-secondary);
  border-radius: 4px;
  font-size: 12px;
  color: var(--text-muted);
}

.search-status .spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

### 3. Search Results Styles
```css
.search-results {
  margin-top: 12px;
  padding: 12px;
  background: var(--background-secondary);
  border-radius: 6px;
  border-left: 3px solid var(--color-blue);
}

.search-result {
  margin-bottom: 8px;
}

.search-result a {
  color: var(--color-blue);
  text-decoration: none;
  font-weight: 500;
}

.search-result p {
  margin: 4px 0 0 0;
  font-size: 13px;
  color: var(--text-muted);
}
```

## Testing Strategy

### 1. Unit Tests
- Test toggle functionality
- Test API integration
- Test error handling
- Test state persistence

### 2. Integration Tests
- Test web search with different queries
- Test integration with existing tools
- Test performance impact
- Test accessibility features

### 3. User Acceptance Tests
- Verify toggle works as expected
- Verify search results are displayed correctly
- Verify visual feedback is clear
- Verify settings persistence

## Security Considerations

### 1. API Key Management
- Secure storage of Gemini API key
- No exposure of API key in client-side code
- Proper error handling for invalid keys

### 2. Data Privacy
- No logging of search queries
- No storage of search results
- Clear privacy policy for web search usage

### 3. Rate Limiting
- Respect API rate limits
- Implement backoff strategies
- Monitor usage to prevent abuse

## Deployment and Rollout

### 1. Feature Flags
- Implement feature flag for gradual rollout
- Allow users to opt-in/opt-out
- Monitor usage and performance

### 2. Monitoring
- Track web search usage
- Monitor API costs
- Track user satisfaction
- Monitor error rates

### 3. Documentation
- Update user documentation
- Add developer documentation
- Create troubleshooting guide
- Provide examples and use cases

## Future Enhancements

### 1. Advanced Configuration
- Custom search filters
- Search result limits
- Domain restrictions
- Language preferences

### 2. Enhanced UI
- Search history
- Favorite sources
- Custom search queries
- Advanced filtering options

### 3. Integration Features
- Export search results
- Save search queries
- Share search results
- Integration with other tools

## Conclusion

This design provides a comprehensive implementation plan for integrating Gemini's built-in grounding with Google Search into the Tangent plugin. The implementation focuses on the three core user stories while maintaining compatibility with existing functionality and ensuring a smooth user experience.

The design leverages Google's official API documentation and best practices to ensure reliable and efficient web search integration. The modular approach allows for easy testing, maintenance, and future enhancements. 
# Personas Feature - Implementation Tasks

## Overview
This document breaks down the implementation of the personas feature into three phases: POC (Proof of Concept), MVP (Minimum Viable Product), and Production. Each phase builds upon the previous one to deliver a complete, polished feature.

## Phase 1: POC (Proof of Concept)

### Task 1.1: Core Persona Data Model
- [X] **1.1.1**: Add Persona interface to `tools/types.ts`
  - [X] Define Persona interface with all required fields (id, name, description, content, color, author, created, updated, filePath)
  - [X] Add Persona type to existing type exports
  - [X] Update any related type definitions if needed

- [X] **1.1.2**: Create basic PersonaService class structure
  - [X] Create `personaService.ts` file
  - [X] Add basic class structure with constructor
  - [X] Add private properties for app, personaFolder, personas Map, and fileWatcher
  - [X] Add isInitialized flag

- [X] **1.1.3**: Implement basic initialization method
  - [X] Add `initialize()` method that sets up the service
  - [X] Add `ensurePersonaFolder()` method to create personas folder
  - [X] Add basic error handling for initialization

### Task 1.2: File System Integration
- [X] **1.2.1**: Implement persona folder management
  - [X] Set persona folder path to `tangent/personas/`
  - [X] Add folder creation logic similar to TemplateService
  - [X] Add folder existence checking

- [X] **1.2.2**: Create basic file parsing functionality
  - [X] Add `parsePersonaFromFile()` method
  - [X] Implement frontmatter extraction using Obsidian's API
  - [X] Add basic validation for required fields
  - [X] Handle parsing errors gracefully

- [X] **1.2.3**: Implement persona loading from files
  - [X] Add `loadPersonasFromFolder()` method
  - [X] Scan personas folder for markdown files
  - [X] Parse each file and add to personas Map
  - [X] Add basic error logging

### Task 1.3: Basic UI Integration
- [X] **1.3.1**: Add persona state to ChatPanel
  - [X] Add `selectedPersona` state variable
  - [X] Add `personas` state variable
  - [X] Add `isPersonaSelectorVisible` state variable
  - [X] Initialize states in ChatPanel component

- [X] **1.3.2**: Create basic PersonaSelector component
  - [X] Create `src/components/PersonaSelector.tsx`
  - [X] Add basic component structure with props interface
  - [X] Add simple display of persona names
  - [X] Add basic click handlers for persona selection

- [X] **1.3.3**: Integrate PersonaSelector into ChatPanel
  - [X] Import PersonaSelector component
  - [X] Add component to ChatPanel render method
  - [X] Pass required props (personas, selectedPersona, onPersonaSelect)
  - [X] Add basic visibility logic

### Task 1.4: System Prompt Integration
- [X] **1.4.1**: Modify systemPrompt.ts
  - [X] Add `createSystemPrompt()` function that accepts optional persona parameter
  - [X] Implement logic to combine base prompt with persona content
  - [X] Add proper formatting for persona integration

- [X] **1.4.2**: Update ChatPanel to use enhanced system prompt
  - [X] Modify `sendMessage()` function to use persona-enhanced system prompt
  - [X] Pass selectedPersona to system prompt creation
  - [X] Test basic integration

### Task 1.5: Create Initial Built-in Personas
- [X] **1.5.1**: Create personas folder structure
  - [X] Create `tangent/personas/` folder
  - [X] Add basic folder structure

- [X] **1.5.2**: Create all built-in personas
  - [X] Create `product-manager.md` with proper frontmatter
  - [X] Create `technical-writer.md` with proper frontmatter
  - [X] Create `prompt-enhancer.md` with proper frontmatter
  - [X] Create `creative-assistant.md` with proper frontmatter
  - [X] Create `code-reviewer.md` with proper frontmatter
  - [X] Add meaningful content for each persona behavior

- [X] **1.5.3**: Bundle personas similar to templates
  - [X] Update esbuild configuration to bundle personas
  - [X] Add bundled persona loading to PersonaService
  - [X] Implement installation logic for bundled personas
  - [X] Test bundling and loading functionality

- [X] **1.5.4**: Test basic persona functionality
  - [X] Verify all personas load correctly
  - [X] Test persona selection in UI
  - [X] Verify system prompt integration works
  - [X] Test basic AI behavior with personas

- [X] **1.5.5**: Fix persona service implementation gaps
  - [X] Add recursive folder loading (like templates)
  - [X] Separate user persona loading from system persona loading
  - [X] Use Obsidian metadata cache for reliable frontmatter parsing
  - [X] Improve error handling and logging
  - [X] Test folder creation and loading improvements

## Phase 2: MVP (Minimum Viable Product)

### Task 2.1: Enhanced PersonaService
- [ ] **2.1.1**: Implement file watching
  - [ ] Add `setupFileWatcher()` method
  - [ ] Implement file change detection
  - [ ] Add `handlePersonaFileChange()` method
  - [ ] Add `handlePersonaFileRemoval()` method
  - [ ] Test real-time updates

- [ ] **2.1.2**: Add comprehensive error handling
  - [ ] Add validation for persona file structure
  - [ ] Implement graceful error recovery
  - [ ] Add detailed error logging
  - [ ] Handle corrupted or invalid persona files

- [ ] **2.1.3**: Implement persona management methods
  - [ ] Add `getAllPersonas()` method
  - [ ] Add `getPersonaById()` method
  - [ ] Add proper error handling for all methods
  - [ ] Add method documentation

### Task 2.2: Complete UI Implementation
- [X] **2.2.1**: Design and implement centered PersonaSelector
  - [X] Create card-style layout for persona selector
  - [X] Add title and subtitle to selector
  - [X] Implement proper centering in empty chat panel
  - [X] Add responsive design considerations

- [X] **2.2.2**: Add persona visual elements
  - [X] Display persona color indicators
  - [X] Show persona names and descriptions
  - [X] Add hover effects and transitions
  - [X] Implement proper spacing and typography

- [X] **2.2.3**: Implement visibility control logic
  - [X] Add logic to show selector only in empty chats
  - [X] Implement `handleFirstMessage()` function
  - [X] Add `handleNewChat()` function
  - [X] Test visibility transitions

- [X] **2.2.4**: Create PersonaBadge component
  - [X] Create `src/components/PersonaBadge.tsx`
  - [X] Display active persona name in chat
  - [X] Show persona color indicator
  - [X] Add persona clearing functionality

### Task 2.3: Visual Styling and Polish
- [X] **2.3.1**: Implement comprehensive CSS styling
  - [X] Add all persona-related CSS classes to `styles.css`
  - [X] Implement card styling for persona selector
  - [X] Add color indicators and borders
  - [X] Implement hover effects and animations

- [X] **2.3.2**: Add chat panel persona styling
  - [X] Implement persona color border around chat panel
  - [X] Add proper border styling and transitions
  - [X] Ensure styling works with existing chat panel design
  - [X] Test with different persona colors

- [X] **2.3.3**: Implement responsive design
  - [X] Ensure persona selector works on different screen sizes
  - [X] Test mobile and tablet layouts
  - [X] Optimize for different Obsidian themes
  - [X] Test with light and dark themes

### Task 2.4: Complete Built-in Personas
- [ ] **2.4.1**: Create all built-in personas
  - [ ] Create `technical-writer.md`
  - [ ] Create `prompt-enhancer.md`
  - [ ] Create `creative-assistant.md`
  - [ ] Create `code-reviewer.md`
  - [ ] Add meaningful content for each persona

- [ ] **2.4.2**: Test all personas
  - [ ] Verify each persona loads correctly
  - [ ] Test persona selection and switching
  - [ ] Verify AI behavior changes appropriately
  - [ ] Test visual indicators for each persona

### Task 2.5: Integration Testing
- [ ] **2.5.1**: Test with existing features
  - [ ] Verify personas work with templates
  - [ ] Test with file uploads
  - [ ] Test with conversation history
  - [ ] Test with all existing tools

- [ ] **2.5.2**: Test persona persistence
  - [ ] Verify selected persona persists during conversation
  - [ ] Test persona switching mid-conversation
  - [ ] Test persona reset on new chat
  - [ ] Test with conversation loading/saving

## Phase 3: Production

### Task 3.1: Performance Optimization
- [ ] **3.1.1**: Optimize file loading
  - [ ] Implement lazy loading for personas
  - [ ] Add caching for persona data
  - [ ] Optimize file watching performance
  - [ ] Add performance monitoring

- [ ] **3.1.2**: Optimize UI rendering
  - [ ] Implement React.memo for persona components
  - [ ] Optimize re-renders and state updates
  - [ ] Add debouncing for file change events
  - [ ] Optimize CSS animations

- [ ] **3.1.3**: Memory management
  - [ ] Implement proper cleanup for file watchers
  - [ ] Add memory leak prevention
  - [ ] Optimize persona data storage
  - [ ] Add garbage collection considerations

### Task 3.2: Error Handling and Validation
- [ ] **3.2.1**: Comprehensive error handling
  - [ ] Add try-catch blocks for all async operations
  - [ ] Implement user-friendly error messages
  - [ ] Add error recovery mechanisms
  - [ ] Test error scenarios thoroughly

- [ ] **3.2.2**: Input validation
  - [ ] Validate persona file structure
  - [ ] Validate color format (hex codes)
  - [ ] Validate required fields
  - [ ] Add validation error messages

- [ ] **3.2.3**: Edge case handling
  - [ ] Handle missing persona files
  - [ ] Handle corrupted persona data
  - [ ] Handle invalid persona configurations
  - [ ] Test with various file system scenarios

### Task 3.3: Security and Safety
- [ ] **3.3.1**: Content safety
  - [ ] Sanitize persona content before system prompt integration
  - [ ] Prevent potential prompt injection attacks
  - [ ] Validate persona content length limits
  - [ ] Add content filtering if needed

- [ ] **3.3.2**: File system security
  - [ ] Validate file paths to prevent traversal attacks
  - [ ] Implement proper file permissions handling
  - [ ] Add file size limits for persona files
  - [ ] Test with various file system configurations

- [ ] **3.3.3**: Data integrity
  - [ ] Implement checksums for persona files
  - [ ] Add backup and recovery mechanisms
  - [ ] Validate persona data consistency
  - [ ] Add data corruption detection

### Task 3.4: Documentation and User Experience
- [ ] **3.4.1**: Create user documentation
  - [ ] Write persona creation guide
  - [ ] Document built-in personas
  - [ ] Create troubleshooting guide
  - [ ] Add examples and best practices

- [ ] **3.4.2**: Add inline help and tooltips
  - [ ] Add tooltips to persona selector
  - [ ] Implement help text for persona creation
  - [ ] Add contextual help for persona features
  - [ ] Create user onboarding flow

- [ ] **3.4.3**: Accessibility improvements
  - [ ] Add proper ARIA labels
  - [ ] Implement keyboard navigation
  - [ ] Add screen reader support
  - [ ] Test with accessibility tools

### Task 3.5: Testing and Quality Assurance
- [ ] **3.5.1**: Comprehensive testing
  - [ ] Write unit tests for PersonaService
  - [ ] Write integration tests for UI components
  - [ ] Test with different Obsidian versions
  - [ ] Test with various operating systems

- [ ] **3.5.2**: User acceptance testing
  - [ ] Test persona creation workflow
  - [ ] Test persona selection and switching
  - [ ] Test visual indicators and styling
  - [ ] Test AI behavior with different personas

- [ ] **3.5.3**: Performance testing
  - [ ] Test with large numbers of personas
  - [ ] Test file system performance
  - [ ] Test memory usage patterns
  - [ ] Test UI responsiveness

### Task 3.6: Final Polish and Deployment
- [ ] **3.6.1**: Code review and cleanup
  - [ ] Review all code for best practices
  - [ ] Remove debug code and console logs
  - [ ] Optimize imports and dependencies
  - [ ] Add comprehensive code documentation

- [ ] **3.6.2**: Final testing and validation
  - [ ] End-to-end testing of complete feature
  - [ ] Test with real user scenarios
  - [ ] Validate all acceptance criteria
  - [ ] Performance and security validation

- [ ] **3.6.3**: Deployment preparation
  - [ ] Update plugin manifest if needed
  - [ ] Prepare release notes
  - [ ] Create migration guide if needed
  - [ ] Prepare for plugin store submission

## Success Criteria

### Phase 1 Success Criteria
- [ ] Basic persona loading and selection works
- [ ] System prompt integration functions correctly
- [ ] At least one built-in persona is available
- [ ] Basic UI shows persona selector in empty chat

### Phase 2 Success Criteria
- [ ] All user stories from spec are implemented
- [ ] Visual indicators work correctly
- [ ] All built-in personas are available and functional
- [ ] File-based persona creation works
- [ ] UI is polished and responsive

### Phase 3 Success Criteria
- [ ] Feature is production-ready with comprehensive error handling
- [ ] Performance is optimized and tested
- [ ] Security measures are implemented
- [ ] Documentation is complete
- [ ] All tests pass and quality standards are met

## Notes
- Each task should be completed and tested before moving to the next
- User confirmation should be sought after completing each phase
- Any issues or blockers should be documented and addressed before proceeding
- Performance and security considerations should be maintained throughout all phases 
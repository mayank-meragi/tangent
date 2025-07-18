# Conversation Starters Implementation Tasks

## Overview
This document contains all the tasks required to implement the conversation starters feature for the Tangent plugin. Tasks are organized by implementation phases with detailed subtasks and acceptance criteria.

## Phase 1: Core Infrastructure (Week 1-2)

### Task 1.1: Create Template Service
**Priority**: High  
**Estimated Time**: 2-3 days

- [X] **1.1.1**: Create `templateService.ts` file in the root directory
- [X] **1.1.2**: Implement `TemplateService` class with basic structure
- [X] **1.1.3**: Add template folder configuration and validation
- [X] **1.1.4**: Implement file scanning and discovery methods
- [X] **1.1.5**: Add frontmatter parsing using Obsidian's built-in parser
- [X] **1.1.6**: Implement template caching and memory management
- [X] **1.1.7**: Add file watcher for automatic template updates
- [X] **1.1.8**: Create template validation and error handling
- [X] **1.1.9**: Add unit tests for template service methods

**Acceptance Criteria**:
- Service can scan configured folder for `.md` files
- Service can parse frontmatter and extract template metadata
- Service automatically detects new files and updates cache
- Service validates frontmatter structure and reports errors
- Service handles file system errors gracefully

### Task 1.2: Create Template Data Models
**Priority**: High  
**Estimated Time**: 1 day

- [X] **1.2.1**: Define `ConversationTemplate` interface in `types.ts`
- [X] **1.2.2**: Define `TemplateCategory` interface
- [X] **1.2.3**: Define `TemplateSearchResult` interface
- [X] **1.2.4**: Define `TemplateVariable` interface
- [X] **1.2.5**: Define `DropdownItem` interface for generic dropdown
- [X] **1.2.6**: Add TypeScript type exports
- [X] **1.2.7**: Create type validation utilities

**Acceptance Criteria**:
- All interfaces are properly typed and documented
- Types are exported and available for import
- Validation utilities can check template structure
- Generic dropdown interface supports both file and template data

### Task 1.3: Create Built-in Templates
**Priority**: High  
**Estimated Time**: 1-2 days

- [X] **1.3.1**: Create `templates/` folder in plugin bundle
- [X] **1.3.2**: Create Writing category templates (5-8 templates)
- [X] **1.3.3**: Create Analysis category templates (5-8 templates)
- [X] **1.3.4**: Create Research category templates (5-8 templates)
- [X] **1.3.5**: Create Productivity category templates (5-8 templates)
- [X] **1.3.6**: Create Creative category templates (5-8 templates)
- [X] **1.3.7**: Create Learning category templates (5-8 templates)
- [X] **1.3.8**: Create Technical category templates (5-8 templates)
- [X] **1.3.9**: Add variable definitions to all templates
- [X] **1.3.10**: Test template parsing and validation

### Task 1.4: Bundle System Templates with Plugin
**Priority**: High  
**Estimated Time**: 1-2 days

- [X] **1.4.1**: Create system template bundling mechanism
- [X] **1.4.2**: Implement template content bundling in build process
- [X] **1.4.3**: Add template metadata to plugin bundle

**Acceptance Criteria**:
- System templates are bundled with plugin distribution
- Templates are automatically installed on plugin initialization

**Acceptance Criteria**:
- All templates have proper frontmatter structure
- Templates include meaningful variables where appropriate
- Templates are well-written and useful for common use cases
- All templates parse correctly without errors

### Task 1.6: Implement Template Search Engine
**Priority**: High  
**Estimated Time**: 1-2 days

- [X] **1.6.1**: Create `TemplateSearchEngine` class
- [X] **1.6.2**: Implement fuzzy search algorithm
- [X] **1.6.3**: Add relevance scoring with weighted fields
- [X] **1.6.4**: Implement search result ranking
- [X] **1.6.5**: Add search result caching
- [X] **1.6.6**: Implement debounced search (300ms)
- [X] **1.6.7**: Add search performance optimization
- [X] **1.6.8**: Create unit tests for search functionality

**Acceptance Criteria**:
- Search responds within 500ms for large template sets
- Search results are ranked by relevance
- Search works across title, description, tags, and content
- Search supports partial matches and fuzzy matching
- Search results are cached for performance


## Phase 2: UI Components (Week 2-3)

### Task 2.1: Create Generic Dropdown Component ✅
**Priority**: High  
**Estimated Time**: 2-3 days

- [x] **2.1.1**: Create `GenericDropdown.tsx` component
- [x] **2.1.2**: Extract existing file dropdown logic into generic component
- [x] **2.1.3**: Implement generic item rendering with icons and metadata
- [x] **2.1.4**: Add configurable placeholder and no-results messages
- [x] **2.1.5**: Implement consistent keyboard navigation (arrow keys, Enter, Escape)
- [x] **2.1.6**: Add flexible item preview with title, description, and category
- [x] **2.1.7**: Create reusable styling and animations
- [x] **2.1.8**: Add accessibility features (ARIA labels, screen reader support)
- [x] **2.1.9**: Test with both file and template data
- [x] **2.1.10**: Ensure backward compatibility with existing file dropdown

**Acceptance Criteria**:
- Generic dropdown works for both files and templates
- Consistent UX between "@" and "/" triggers
- Keyboard navigation works smoothly for both types
- Item selection handles different data types correctly
- Dropdown is accessible and follows Obsidian design patterns

### Task 2.2: Enhance Chat Input Component ✅
**Priority**: High  
**Estimated Time**: 1-2 days

- [x] **2.2.1**: Refactor `ChatInputContainer.tsx` to use generic dropdown
- [x] **2.2.2**: Replace existing file dropdown with generic component
- [x] **2.2.3**: Add template trigger detection ("/") alongside file trigger ("@")
- [x] **2.2.4**: Implement generic item loading for both file and template types
- [x] **2.2.5**: Add template selection handler with variable replacement
- [x] **2.2.6**: Ensure cursor positioning works for both file and template insertion
- [x] **2.2.7**: Test both triggers work independently and together
- [x] **2.2.8**: Maintain backward compatibility with existing file functionality

**Acceptance Criteria**:
- Both "@" and "/" triggers work seamlessly
- Generic dropdown handles both file and template data correctly
- Template content is properly inserted with variable handling
- File selection continues to work as before
- No conflicts between the two trigger types

### Task 2.3: Create Template Manager Component
**Priority**: Medium  
**Estimated Time**: 2-3 days

- [ ] **2.3.1**: Create `TemplateManager.tsx` component
- [ ] **2.3.2**: Implement template list/grid view
- [ ] **2.3.3**: Add category filtering and search
- [ ] **2.3.4**: Create template creation wizard
- [ ] **2.3.5**: Add template editing capabilities
- [ ] **2.3.6**: Implement template deletion and confirmation
- [ ] **2.3.7**: Add favorite/unfavorite functionality
- [ ] **2.3.8**: Create template preview and testing
- [ ] **2.3.9**: Add bulk operations (delete, move, favorite)
- [ ] **2.3.10**: Style manager to match Obsidian theme

**Acceptance Criteria**:
- Manager displays all templates in organized view
- Users can filter by category and search templates
- Template creation wizard guides users through process
- Users can edit templates directly in Obsidian
- Bulk operations work efficiently
- Manager is responsive and user-friendly

### Task 2.4: Add Settings UI
**Priority**: Medium  
**Estimated Time**: 1-2 days

- [ ] **2.4.1**: Create template settings tab in plugin settings
- [ ] **2.4.2**: Add template folder configuration with folder picker
- [ ] **2.4.3**: Implement template validation status display
- [ ] **2.4.4**: Add template scanning and count display
- [ ] **2.4.5**: Create error reporting for invalid templates
- [ ] **2.4.6**: Add quick actions (open folder, create template)
- [ ] **2.4.7**: Implement import/export functionality
- [ ] **2.4.8**: Add built-in template management options
- [ ] **2.4.9**: Style settings to match Obsidian theme
- [ ] **2.4.10**: Test settings persistence and validation

**Acceptance Criteria**:
- Settings UI is intuitive and matches Obsidian design
- Folder picker works correctly
- Template validation provides clear feedback
- Settings are properly saved and loaded
- Import/export functionality works reliably

## Phase 3: Integration and Polish (Week 3-4)

### Task 3.1: Integrate with Chat Panel
**Priority**: High  
**Estimated Time**: 1-2 days

- [X] **3.1.1**: Modify `ChatPanel.tsx` to include template service
- [X] **3.1.2**: Add template dropdown to chat interface
- [X] **3.1.3**: Integrate template selection with message sending
- [X] **3.1.4**: Handle template variable replacement
- [X] **3.1.5**: Add template usage tracking (if needed)
- [X] **3.1.6**: Test integration with existing chat features
- [X] **3.1.7**: Ensure proper error handling
- [X] **3.1.8**: Add loading states for template operations

**Acceptance Criteria**:
- Template dropdown integrates seamlessly with chat
- Template selection works with message sending
- Variables are properly handled
- Integration doesn't break existing functionality
- Error states are handled gracefully

### Task 3.2: Add Keyboard Shortcuts
**Priority**: Medium  
**Estimated Time**: 1 day

- [ ] **3.2.1**: Implement "/" trigger for template search
- [ ] **3.2.2**: Add `Ctrl/Cmd + /` for template manager
- [ ] **3.2.3**: Add `Ctrl/Cmd + Shift + T` for template creation
- [ ] **3.2.4**: Register shortcuts with Obsidian
- [ ] **3.2.5**: Add shortcut documentation
- [ ] **3.2.6**: Test shortcut conflicts and resolution
- [ ] **3.2.7**: Add shortcut customization in settings

**Acceptance Criteria**:
- All shortcuts work reliably
- No conflicts with existing Obsidian shortcuts
- Shortcuts are documented and discoverable
- Users can customize shortcuts if needed

### Task 3.3: Implement Auto-Discovery
**Priority**: Medium  
**Estimated Time**: 1-2 days

- [ ] **3.3.1**: Add file watcher for template folder
- [ ] **3.3.2**: Implement new file detection
- [ ] **3.3.3**: Add frontmatter validation for new files
- [ ] **3.3.4**: Create template auto-registration
- [ ] **3.3.5**: Add error reporting for invalid files
- [ ] **3.3.6**: Implement file change detection
- [ ] **3.3.7**: Add template cache invalidation
- [ ] **3.3.8**: Test auto-discovery with various scenarios

**Acceptance Criteria**:
- New files with valid frontmatter become templates automatically
- Invalid files are ignored with appropriate feedback
- File changes update templates immediately
- Auto-discovery works reliably across different file operations

### Task 3.4: Performance Optimization
**Priority**: Medium  
**Estimated Time**: 1-2 days

- [ ] **3.4.1**: Implement lazy loading for template manager
- [ ] **3.4.2**: Add virtual scrolling for large template lists
- [ ] **3.4.3**: Optimize search performance with indexing
- [ ] **3.4.4**: Implement efficient caching strategies
- [ ] **3.4.5**: Add memory management for large template sets
- [ ] **3.4.6**: Optimize file watcher performance
- [ ] **3.4.7**: Add performance monitoring
- [ ] **3.4.8**: Test performance with large template collections

**Acceptance Criteria**:
- Template manager loads quickly even with many templates
- Search responds within 500ms for large datasets
- Memory usage remains reasonable
- Performance doesn't degrade with template count

### Task 3.5: Error Handling and Edge Cases
**Priority**: Medium  
**Estimated Time**: 1-2 days

- [ ] **3.5.1**: Handle missing template folder gracefully
- [ ] **3.5.2**: Add error recovery for corrupted templates
- [ ] **3.5.3**: Handle file permission issues
- [ ] **3.5.4**: Add fallback for frontmatter parsing errors
- [ ] **3.5.5**: Handle template folder changes
- [ ] **3.5.6**: Add error reporting and logging
- [ ] **3.5.7**: Test error scenarios and recovery
- [ ] **3.5.8**: Add user-friendly error messages

**Acceptance Criteria**:
- Plugin handles all error scenarios gracefully
- Users receive clear error messages
- Plugin recovers from errors automatically when possible
- Error logging helps with debugging

### Task 3.6: Accessibility and Internationalization
**Priority**: Low  
**Estimated Time**: 1 day

- [ ] **3.6.1**: Add ARIA labels and descriptions
- [ ] **3.6.2**: Implement keyboard navigation throughout
- [ ] **3.6.3**: Add screen reader support
- [ ] **3.6.4**: Ensure high contrast mode compatibility
- [ ] **3.6.5**: Add focus management
- [ ] **3.6.6**: Test with accessibility tools
- [ ] **3.6.7**: Add internationalization support (if needed)

**Acceptance Criteria**:
- All components are accessible via keyboard
- Screen readers can navigate and understand the interface
- High contrast mode works properly
- Focus is managed correctly throughout the interface

## Phase 4: Testing and Documentation (Week 4)

### Task 4.1: Comprehensive Testing
**Priority**: High  
**Estimated Time**: 2-3 days

- [ ] **4.1.1**: Create unit tests for template service
- [ ] **4.1.2**: Add integration tests for UI components
- [ ] **4.1.3**: Test template parsing with various frontmatter formats
- [ ] **4.1.4**: Test search functionality with different queries
- [ ] **4.1.5**: Test auto-discovery with file operations
- [ ] **4.1.6**: Test error handling and edge cases
- [ ] **4.1.7**: Test performance with large template sets
- [ ] **4.1.8**: Test accessibility features
- [ ] **4.1.9**: Test integration with existing chat features
- [ ] **4.1.10**: Create automated test suite

**Acceptance Criteria**:
- All core functionality has unit tests
- Integration tests cover main user workflows
- Tests pass consistently across different environments
- Performance tests validate optimization goals
- Accessibility tests ensure compliance

### Task 4.2: User Documentation
**Priority**: Medium  
**Estimated Time**: 1-2 days

- [ ] **4.2.1**: Create user guide for conversation starters
- [ ] **4.2.2**: Document template creation process
- [ ] **4.2.3**: Add template management instructions
- [ ] **4.2.4**: Document keyboard shortcuts
- [ ] **4.2.5**: Create troubleshooting guide
- [ ] **4.2.6**: Add FAQ section
- [ ] **4.2.7**: Create video tutorials (optional)
- [ ] **4.2.8**: Update plugin README with new features

**Acceptance Criteria**:
- Documentation is clear and comprehensive
- Users can easily understand how to use the feature
- Troubleshooting guide covers common issues
- Documentation is accessible and well-organized

### Task 4.3: Developer Documentation
**Priority**: Low  
**Estimated Time**: 1 day

- [ ] **4.3.1**: Document template service API
- [ ] **4.3.2**: Add code comments and JSDoc
- [ ] **4.3.3**: Document component interfaces
- [ ] **4.3.4**: Create architecture documentation
- [ ] **4.3.5**: Document testing strategy
- [ ] **4.3.6**: Add contribution guidelines for templates

**Acceptance Criteria**:
- Code is well-documented and maintainable
- API documentation is complete and accurate
- Architecture decisions are documented
- Future developers can understand and extend the system

### Task 4.4: Final Testing and Bug Fixes
**Priority**: High  
**Estimated Time**: 1-2 days

- [ ] **4.4.1**: Conduct end-to-end testing
- [ ] **4.4.2**: Test with different Obsidian versions
- [ ] **4.4.3**: Test with various template configurations
- [ ] **4.4.4**: Fix any discovered bugs
- [ ] **4.4.5**: Optimize performance issues
- [ ] **4.4.6**: Test edge cases and error scenarios
- [ ] **4.4.7**: Validate accessibility compliance
- [ ] **4.4.8**: Final integration testing

**Acceptance Criteria**:
- All features work correctly in production environment
- No critical bugs remain
- Performance meets requirements
- Accessibility standards are met
- Integration with existing features is stable

## Success Metrics

### Performance Metrics
- [ ] Template search responds within 500ms
- [ ] Template dropdown appears within 100ms
- [ ] Template manager loads within 2 seconds
- [ ] Memory usage remains under 50MB for large template sets

### User Experience Metrics
- [ ] 80% of users can create their first template within 5 minutes
- [ ] Template search finds relevant results in top 3 for 90% of queries
- [ ] No more than 5% of users report template-related errors
- [ ] Average time to start conversation reduced by 50%

### Quality Metrics
- [ ] 90% code coverage in unit tests
- [ ] All accessibility tests pass
- [ ] No critical security vulnerabilities
- [ ] Documentation covers all user scenarios

## Risk Mitigation

### Technical Risks
- **File System Performance**: Implement efficient file watching and caching
- **Memory Usage**: Add memory management and cleanup strategies
- **Search Performance**: Use indexing and optimization techniques
- **Template Validation**: Robust error handling and user feedback

### User Experience Risks
- **Complexity**: Keep interface simple and intuitive
- **Learning Curve**: Provide clear documentation and examples
- **Integration Issues**: Thorough testing with existing features
- **Performance**: Monitor and optimize for large template sets

## Dependencies

### External Dependencies
- Obsidian API for file system operations
- React for UI components
- TypeScript for type safety
- Existing Tangent plugin infrastructure

### Internal Dependencies
- Chat panel integration
- Settings system
- File upload service (for potential template sharing)
- Memory system (for template preferences)

## Timeline Summary

- **Week 1-2**: Core infrastructure and data models
- **Week 2-3**: UI components and user interface
- **Week 3-4**: Integration, optimization, and polish
- **Week 4**: Testing, documentation, and final release

**Total Estimated Time**: 4 weeks
**Total Tasks**: 15 major tasks with 100+ subtasks
**Priority**: High - Core feature for user experience improvement

## Phase 5: Template Variable Enhancements (Future)

### Current Variable Limitations

The current template variable system has the following limitations that should be addressed in future iterations:

**No User Input**: Variables are automatically replaced with defaults
- Variables are replaced with their `default` values when templates are selected
- No prompt is shown for users to enter custom values
- Users must manually edit the inserted content to customize variables

**No Interactive UI**: No prompt for user to enter custom values
- No modal dialog or form for variable input
- No validation of user-provided values against variable types
- No support for select-type variables with dropdown options
- No real-time preview of variable replacement

### Task 5.1: Interactive Variable Input
**Priority**: Medium  
**Estimated Time**: 2-3 days

- [X] **5.1.1**: Create variable input modal component
- [X] **5.1.2**: Implement form generation based on variable definitions
- [X] **5.1.3**: Add type validation for user input
- [X] **5.1.4**: Create select dropdown for choice-based variables
- [X] **5.1.5**: Add real-time preview of variable replacement
- [X] **5.1.6**: Implement variable input persistence
- [X] **5.1.7**: Add keyboard navigation for variable input
- [X] **5.1.8**: Create variable input accessibility features

**Acceptance Criteria**:
- Users can enter custom values for template variables
- Input is validated against variable types
- Select variables show proper dropdown options
- Real-time preview shows how variables will be replaced
- Variable input is accessible and user-friendly

### Task 5.2: Advanced Variable Features
**Priority**: Low  
**Estimated Time**: 3-4 days

- [ ] **5.2.1**: Implement conditional variables (show/hide based on other variables)
- [ ] **5.2.2**: Add variable dependencies and cascading updates
- [ ] **5.2.3**: Create variable templates and reusable patterns
- [ ] **5.2.4**: Add variable history and suggestions
- [ ] **5.2.5**: Implement variable validation rules
- [ ] **5.2.6**: Add support for complex variable types (date, file, etc.)
- [ ] **5.2.7**: Create variable input wizards for complex templates
- [ ] **5.2.8**: Add variable input analytics and usage tracking

**Acceptance Criteria**:
- Complex variable relationships work correctly
- Variable validation prevents invalid input
- Advanced variable types are supported
- Variable input experience is intuitive and powerful

### Task 5.3: Variable System Integration
**Priority**: Medium  
**Estimated Time**: 1-2 days

- [ ] **5.3.1**: Integrate variable input with template manager
- [ ] **5.3.2**: Add variable input to template creation wizard
- [ ] **5.3.3**: Implement variable input in template editing
- [ ] **5.3.4**: Add variable input to template testing
- [ ] **5.3.5**: Create variable input settings and preferences
- [ ] **5.3.6**: Add variable input to template import/export
- [ ] **5.3.7**: Implement variable input in template sharing
- [ ] **5.3.8**: Add variable input documentation and help

**Acceptance Criteria**:
- Variable input is integrated throughout the template system
- Users can test variables during template creation
- Variable input settings are configurable
- Variable input works with template sharing features 
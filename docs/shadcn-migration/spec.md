# shadcn Migration Specification

## Product Requirements Document (PRD)

### Overview
Migrate the Tangent plugin's UI components from custom React components to shadcn/ui components to improve consistency, maintainability, and user experience while maintaining all existing functionality.

### Goals
- Replace custom UI components with shadcn/ui equivalents
- Maintain all existing functionality and user interactions
- Improve visual consistency and accessibility
- Reduce custom CSS and styling complexity
- Enhance component reusability and maintainability
- Ensure compatibility with Obsidian's theming system

### Success Metrics
- All existing features work identically after migration
- Reduced CSS file size by at least 40%
- Improved accessibility scores
- Consistent visual design across all components
- Maintained performance or better

## User Stories

### US1: Chat Interface Components
**As a user**, I want the chat interface to use modern, consistent UI components so that I have a better visual experience and improved accessibility.

**Acceptance Criteria:**
- Chat input container uses shadcn Button, Textarea, and Input components
- File upload button uses shadcn Button with proper styling
- Dropdown components use shadcn Select or Combobox
- All interactive elements have proper hover and focus states
- Components maintain Obsidian theme compatibility

### US2: Message Display Components
**As a user**, I want AI and user messages to be displayed with consistent, modern styling so that I can easily read and interact with conversation content.

**Acceptance Criteria:**
- AI messages use shadcn Card components for better structure
- User messages use shadcn Badge or similar components
- Copy buttons use shadcn Button with proper icons
- Code blocks use shadcn Code components
- Message actions (edit, delete) use shadcn Button components

### US3: Modal and Dialog Components
**As a user**, I want modals and dialogs to use consistent, accessible components so that I can easily interact with configuration and settings.

**Acceptance Criteria:**
- Variable input modal uses shadcn Dialog components
- MCP server manager uses shadcn Modal components
- All form inputs use shadcn Input, Select, and Checkbox components
- Proper focus management and keyboard navigation
- Consistent styling with the rest of the interface

### US4: Navigation and Layout Components
**As a user**, I want navigation elements to be consistent and intuitive so that I can easily move between different sections of the plugin.

**Acceptance Criteria:**
- History tab uses shadcn Tabs components
- File context indicators use shadcn Badge components
- Tool calls and results use shadcn Collapsible components
- All navigation elements have proper hover states and accessibility

### US5: Form and Input Components
**As a user**, I want all forms and inputs to be consistent and accessible so that I can easily configure settings and interact with the plugin.

**Acceptance Criteria:**
- All text inputs use shadcn Input components
- Dropdowns use shadcn Select or Combobox components
- Checkboxes and toggles use shadcn Checkbox and Switch components
- Form validation uses shadcn form patterns
- Error states are clearly indicated with shadcn styling

### US6: Theme Integration
**As a user**, I want the plugin to seamlessly integrate with Obsidian's theming system so that it looks consistent with my chosen theme.

**Acceptance Criteria:**
- All shadcn components respect Obsidian CSS variables
- Dark and light theme compatibility
- Consistent color scheme with Obsidian
- Proper contrast ratios for accessibility
- Smooth transitions between theme changes

### US7: Performance and Bundle Size
**As a user**, I want the plugin to maintain fast performance and reasonable bundle size so that it doesn't impact my Obsidian experience.

**Acceptance Criteria:**
- Bundle size increase is minimal (< 100KB)
- No performance regression in component rendering
- Efficient tree-shaking of unused shadcn components
- Proper code splitting for large components
- Fast initial load times

### US8: Accessibility Compliance
**As a user** with accessibility needs, I want all components to be fully accessible so that I can use the plugin effectively.

**Acceptance Criteria:**
- All components meet WCAG 2.1 AA standards
- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus indicators are clearly visible

## Technical Requirements

### Dependencies
- shadcn/ui components
- Tailwind CSS for styling
- Radix UI primitives (included with shadcn)
- Lucide React for icons (already in use)

### Compatibility
- Obsidian plugin API compatibility
- React 19 compatibility
- TypeScript support
- CSS variable integration with Obsidian themes

### Build System
- esbuild configuration updates
- Tailwind CSS configuration
- Component tree-shaking optimization
- CSS purging for unused styles 
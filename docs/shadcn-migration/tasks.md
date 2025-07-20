# shadcn Migration Tasks

## Overview
This document outlines the implementation tasks for migrating the Tangent plugin to shadcn/ui components, organized by complexity and implementation phases.

## Phase 1: POC (Proof of Concept) - Low Complexity Components

### Foundation Setup
- [ ] **Install shadcn/ui dependencies**
  - [ ] Add `@radix-ui/react-button` to package.json
  - [ ] Add `@radix-ui/react-badge` to package.json
  - [ ] Add `class-variance-authority` to package.json
  - [ ] Add `clsx` to package.json
  - [ ] Add `tailwind-merge` to package.json
  - [ ] Add `tailwindcss-animate` to package.json
  - [ ] Add `tailwindcss` as dev dependency
  - [ ] Add `autoprefixer` as dev dependency
  - [ ] Add `postcss` as dev dependency

- [ ] **Initialize shadcn/ui**
  - [ ] Run `npx shadcn@latest init`
  - [ ] Configure `components.json` with Obsidian-specific paths
  - [ ] Set up Tailwind CSS configuration
  - [ ] Create base component directory structure

- [ ] **Update build system**
  - [ ] Modify `esbuild.config.mjs` to handle Tailwind CSS
  - [ ] Add PostCSS plugin for CSS processing
  - [ ] Configure CSS purging for production builds
  - [ ] Test build process with new dependencies

### Low Complexity Component Migrations

#### IconButton Component (Complexity: Low)
- [ ] **Create shadcn Button component**
  - [ ] Run `npx shadcn@latest add button`
  - [ ] Create `src/components/ui/button.tsx`
  - [ ] Test basic button functionality

- [ ] **Migrate IconButton usage**
  - [ ] Update `src/components/IconButton.tsx` to use shadcn Button
  - [ ] Replace inline styles with Tailwind classes
  - [ ] Maintain existing props interface
  - [ ] Test all IconButton instances in the app

- [ ] **Update IconButton imports**
  - [ ] Find all files importing IconButton
  - [ ] Update imports to use new shadcn-based component
  - [ ] Test functionality in each usage location

#### FileUploadButton Component (Complexity: Low)
- [ ] **Migrate FileUploadButton**
  - [ ] Update `src/components/FileUploadButton.tsx` to use shadcn Button
  - [ ] Replace custom styling with Tailwind classes
  - [ ] Maintain file input functionality
  - [ ] Test file upload behavior

- [ ] **Style integration**
  - [ ] Apply consistent button styling
  - [ ] Ensure proper hover and focus states
  - [ ] Test with different file types
  - [ ] Verify accessibility features

#### UserMessage Component (Complexity: Low)
- [ ] **Add shadcn Badge component**
  - [ ] Run `npx shadcn@latest add badge`
  - [ ] Create `src/components/ui/badge.tsx`
  - [ ] Test badge variants and styling

- [ ] **Migrate UserMessage**
  - [ ] Update `src/components/UserMessage.tsx` to use shadcn Badge
  - [ ] Replace custom message styling
  - [ ] Maintain message content display
  - [ ] Test user message rendering

- [ ] **Message actions**
  - [ ] Add edit/delete buttons using shadcn Button
  - [ ] Style action buttons consistently
  - [ ] Test action functionality
  - [ ] Ensure proper spacing and layout

#### LucidIcon Component (Complexity: Low)
- [ ] **Icon integration**
  - [ ] Ensure Lucide React icons work with shadcn components
  - [ ] Test icon sizing and alignment
  - [ ] Verify icon accessibility
  - [ ] Update icon usage patterns if needed

### Theme Integration - Basic Level
- [ ] **CSS variable mapping**
  - [ ] Create basic CSS variable mapping in `styles.css`
  - [ ] Map primary Obsidian colors to shadcn tokens
  - [ ] Test color consistency across components
  - [ ] Verify dark/light mode compatibility

- [ ] **Tailwind configuration**
  - [ ] Set up `tailwind.config.js` with Obsidian theme variables
  - [ ] Configure color palette mapping
  - [ ] Set up border radius and spacing
  - [ ] Test configuration with sample components

### Testing and Validation
- [ ] **Component testing**
  - [ ] Test each migrated component individually
  - [ ] Verify all props and functionality work
  - [ ] Test component interactions
  - [ ] Validate accessibility features

- [ ] **Integration testing**
  - [ ] Test components work together in the app
  - [ ] Verify no breaking changes to existing functionality
  - [ ] Test with different Obsidian themes
  - [ ] Validate performance impact

## Phase 2: MVP (Minimum Viable Product) - Medium Complexity Components

### Medium Complexity Component Migrations

#### ChatInputContainer Component (Complexity: Medium)
- [ ] **Add shadcn Textarea component**
  - [ ] Run `npx shadcn@latest add textarea`
  - [ ] Create `src/components/ui/textarea.tsx`
  - [ ] Test textarea functionality and styling

- [ ] **Add shadcn Card component**
  - [ ] Run `npx shadcn@latest add card`
  - [ ] Create `src/components/ui/card.tsx`
  - [ ] Test card variants and layout

- [ ] **Migrate ChatInputContainer structure**
  - [ ] Replace main container div with shadcn Card
  - [ ] Update textarea to use shadcn Textarea
  - [ ] Replace action buttons with shadcn Button components
  - [ ] Maintain all existing functionality

- [ ] **File context badges**
  - [ ] Replace file context indicators with shadcn Badge
  - [ ] Style remove buttons consistently
  - [ ] Test file context functionality
  - [ ] Ensure proper spacing and layout

#### Dropdown Component (Complexity: Medium)
- [ ] **Add shadcn Select component**
  - [ ] Run `npx shadcn@latest add select`
  - [ ] Create `src/components/ui/select.tsx`
  - [ ] Test select functionality and styling

- [ ] **Add shadcn Combobox component**
  - [ ] Run `npx shadcn@latest add combobox`
  - [ ] Create `src/components/ui/combobox.tsx`
  - [ ] Test combobox search and selection

- [ ] **Migrate Dropdown component**
  - [ ] Update `src/components/Dropdown.tsx` to use shadcn Select/Combobox
  - [ ] Replace custom dropdown styling
  - [ ] Maintain search functionality
  - [ ] Test dropdown interactions

- [ ] **Dropdown integration**
  - [ ] Update file dropdown usage
  - [ ] Update template dropdown usage
  - [ ] Test dropdown keyboard navigation
  - [ ] Verify accessibility features

#### FilePreviewItem Component (Complexity: Medium)
- [ ] **Migrate FilePreviewItem**
  - [ ] Update `src/components/FilePreviewItem.tsx` to use shadcn components
  - [ ] Replace custom styling with Tailwind classes
  - [ ] Use shadcn Card for file preview structure
  - [ ] Maintain file preview functionality

- [ ] **File preview actions**
  - [ ] Add action buttons using shadcn Button
  - [ ] Style remove and download buttons
  - [ ] Test file preview interactions
  - [ ] Ensure proper hover states

#### CollapsibleThinking Component (Complexity: Medium)
- [ ] **Add shadcn Collapsible component**
  - [ ] Run `npx shadcn@latest add collapsible`
  - [ ] Create `src/components/ui/collapsible.tsx`
  - [ ] Test collapsible functionality

- [ ] **Migrate CollapsibleThinking**
  - [ ] Update `src/components/CollapsibleThinking.tsx` to use shadcn Collapsible
  - [ ] Replace custom collapsible styling
  - [ ] Maintain thinking animation
  - [ ] Test collapsible behavior

### Enhanced Theme Integration
- [ ] **Advanced CSS variable mapping**
  - [ ] Complete CSS variable mapping for all shadcn tokens
  - [ ] Add support for hover and focus states
  - [ ] Implement proper contrast ratios
  - [ ] Test with multiple Obsidian themes

- [ ] **Component theming**
  - [ ] Ensure all components respect Obsidian theme variables
  - [ ] Test theme switching functionality
  - [ ] Verify consistent styling across components
  - [ ] Add theme-specific customizations

### Performance Optimization
- [ ] **Bundle size optimization**
  - [ ] Analyze bundle size impact of shadcn components
  - [ ] Implement tree-shaking for unused components
  - [ ] Optimize CSS bundle size
  - [ ] Monitor performance metrics

- [ ] **Component optimization**
  - [ ] Implement React.memo for expensive components
  - [ ] Optimize re-render patterns
  - [ ] Add lazy loading for heavy components
  - [ ] Test performance improvements

## Phase 3: Production - High Complexity Components

### High Complexity Component Migrations

#### VariableInputModal Component (Complexity: High)
- [ ] **Add shadcn Dialog component**
  - [ ] Run `npx shadcn@latest add dialog`
  - [ ] Create `src/components/ui/dialog.tsx`
  - [ ] Test dialog functionality and accessibility

- [ ] **Add shadcn Form components**
  - [ ] Run `npx shadcn@latest add form`
  - [ ] Create `src/components/ui/form.tsx`
  - [ ] Add react-hook-form integration
  - [ ] Add zod validation support

- [ ] **Add shadcn Input component**
  - [ ] Run `npx shadcn@latest add input`
  - [ ] Create `src/components/ui/input.tsx`
  - [ ] Test input functionality and validation

- [ ] **Add shadcn Switch component**
  - [ ] Run `npx shadcn@latest add switch`
  - [ ] Create `src/components/ui/switch.tsx`
  - [ ] Test switch functionality

- [ ] **Migrate VariableInputModal**
  - [ ] Replace custom modal with shadcn Dialog
  - [ ] Implement form using shadcn Form components
  - [ ] Replace custom inputs with shadcn Input/Switch
  - [ ] Maintain all validation and submission logic

- [ ] **Form validation**
  - [ ] Implement zod schema validation
  - [ ] Add proper error handling and display
  - [ ] Test form submission and validation
  - [ ] Ensure accessibility compliance

#### AIMessage Component (Complexity: High)
- [ ] **Migrate AIMessage structure**
  - [ ] Replace custom message container with shadcn Card
  - [ ] Update message header with shadcn Badge
  - [ ] Style message content with proper typography
  - [ ] Add message actions using shadcn Button

- [ ] **Code block styling**
  - [ ] Add shadcn Code component for code blocks
  - [ ] Style code block containers
  - [ ] Add copy button functionality
  - [ ] Test code block rendering

- [ ] **Tool call integration**
  - [ ] Use shadcn Collapsible for tool calls
  - [ ] Style tool call containers
  - [ ] Add proper tool call indicators
  - [ ] Test tool call interactions

- [ ] **Message actions**
  - [ ] Add copy, edit, and delete actions
  - [ ] Style action buttons consistently
  - [ ] Implement action functionality
  - [ ] Test action accessibility

#### ChatMessageContainer Component (Complexity: Medium)
- [ ] **Migrate ChatMessageContainer**
  - [ ] Update `src/components/ChatMessageContainer.tsx` to use shadcn components
  - [ ] Replace custom container styling
  - [ ] Maintain message layout and spacing
  - [ ] Test message container functionality

#### HistoryTab Component (Complexity: Medium)
- [ ] **Add shadcn Tabs component**
  - [ ] Run `npx shadcn@latest add tabs`
  - [ ] Create `src/components/ui/tabs.tsx`
  - [ ] Test tabs functionality

- [ ] **Migrate HistoryTab**
  - [ ] Update `HistoryTab.tsx` to use shadcn Tabs
  - [ ] Replace custom tab styling
  - [ ] Maintain history functionality
  - [ ] Test tab navigation

### Advanced Features

#### Accessibility Enhancements
- [ ] **ARIA compliance**
  - [ ] Add proper ARIA labels to all components
  - [ ] Implement keyboard navigation
  - [ ] Add focus management for modals
  - [ ] Test with screen readers

- [ ] **WCAG compliance**
  - [ ] Ensure proper color contrast ratios
  - [ ] Add motion reduction support
  - [ ] Implement proper error states
  - [ ] Test accessibility compliance

#### Advanced Styling
- [ ] **Custom component variants**
  - [ ] Create custom button variants for specific use cases
  - [ ] Add custom card variants for different message types
  - [ ] Implement custom badge variants
  - [ ] Test custom variant functionality

- [ ] **Responsive design**
  - [ ] Ensure components work on different screen sizes
  - [ ] Test mobile responsiveness
  - [ ] Optimize layout for different viewports
  - [ ] Test responsive behavior

### Final Integration and Testing

#### Comprehensive Testing
- [ ] **End-to-end testing**
  - [ ] Test complete user workflows
  - [ ] Verify all features work correctly
  - [ ] Test edge cases and error scenarios
  - [ ] Validate performance under load

- [ ] **Cross-browser testing**
  - [ ] Test in different browsers
  - [ ] Verify compatibility with different Obsidian versions
  - [ ] Test with various Obsidian themes
  - [ ] Validate accessibility across browsers

#### Documentation and Cleanup
- [ ] **Update documentation**
  - [ ] Update component documentation
  - [ ] Document new component usage patterns
  - [ ] Update migration guide
  - [ ] Create component reference

- [ ] **Code cleanup**
  - [ ] Remove unused custom CSS
  - [ ] Clean up old component files
  - [ ] Optimize imports and dependencies
  - [ ] Finalize code organization

#### Performance and Optimization
- [ ] **Final performance review**
  - [ ] Measure final bundle size
  - [ ] Test rendering performance
  - [ ] Optimize any remaining issues
  - [ ] Document performance improvements

- [ ] **Production readiness**
  - [ ] Final testing in production environment
  - [ ] Validate all features work correctly
  - [ ] Ensure no regression in functionality
  - [ ] Prepare for release

## Success Criteria

### Phase 1 Success Criteria
- [ ] All low complexity components migrated successfully
- [ ] Basic theme integration working
- [ ] No breaking changes to existing functionality
- [ ] Bundle size increase < 50KB
- [ ] All tests passing

### Phase 2 Success Criteria
- [ ] All medium complexity components migrated
- [ ] Enhanced theme integration complete
- [ ] Performance optimizations implemented
- [ ] Bundle size increase < 100KB
- [ ] Accessibility improvements implemented

### Phase 3 Success Criteria
- [ ] All components migrated to shadcn/ui
- [ ] Full accessibility compliance achieved
- [ ] Performance meets or exceeds original
- [ ] Comprehensive testing completed
- [ ] Production ready for release

## Risk Mitigation

### Technical Risks
- [ ] **Bundle size monitoring**: Regular bundle size checks throughout migration
- [ ] **Performance testing**: Continuous performance monitoring
- [ ] **Compatibility testing**: Regular testing with different Obsidian themes
- [ ] **Rollback plan**: Maintain ability to revert changes if needed

### User Experience Risks
- [ ] **Visual consistency**: Regular visual testing and validation
- [ ] **Functionality preservation**: Continuous testing of existing features
- [ ] **Accessibility maintenance**: Regular accessibility testing
- [ ] **User feedback**: Gather feedback during development phases

This task breakdown ensures a systematic approach to migrating the Tangent plugin to shadcn/ui while maintaining quality and minimizing risks. 
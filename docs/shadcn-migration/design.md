# shadcn Migration Design Document

## Implementation Overview

This document outlines the detailed implementation approach for migrating the Tangent plugin's UI components to shadcn/ui while maintaining compatibility with Obsidian's theming system and ensuring optimal performance.

## Architecture Design

### 1. Component Library Integration Strategy

#### 1.1 shadcn/ui Setup
- **Installation**: Use `npx shadcn@latest init` to set up the component library
- **Configuration**: Create `components.json` with Obsidian-specific paths and styling
- **Theme Integration**: Customize Tailwind config to work with Obsidian CSS variables
- **Bundle Optimization**: Implement tree-shaking to minimize bundle size

#### 1.2 Obsidian Theme Compatibility
- **CSS Variable Mapping**: Map shadcn design tokens to Obsidian CSS variables
- **Dark/Light Mode**: Ensure components respect Obsidian's theme switching
- **Custom Properties**: Extend shadcn components with Obsidian-specific styling

### 2. Component Migration Strategy

#### 2.1 Direct Component Replacements

| Current Component | shadcn Replacement | Migration Complexity |
|------------------|-------------------|---------------------|
| `IconButton` | `Button` with `variant="ghost"` | Low |
| `Dropdown` | `Select` or `Combobox` | Medium |
| `VariableInputModal` | `Dialog` + `Form` | High |
| `FileUploadButton` | `Button` with file input | Low |
| `ChatInputContainer` | `Textarea` + `Button` | Medium |
| `AIMessage` | `Card` + `Button` | Medium |
| `UserMessage` | `Badge` or `Card` | Low |

#### 2.2 Composite Component Mappings

**Chat Interface Components:**
```typescript
// Current: Custom ChatInputContainer
// Target: shadcn components
<Card className="chat-input-container">
  <CardContent>
    <Textarea placeholder="Type your message..." />
    <div className="flex gap-2">
      <Button variant="outline" size="sm">
        <Upload className="h-4 w-4" />
      </Button>
      <Button type="submit">
        <Send className="h-4 w-4" />
      </Button>
    </div>
  </CardContent>
</Card>
```

**Message Display Components:**
```typescript
// Current: Custom AIMessage
// Target: shadcn Card with proper structure
<Card className="ai-message">
  <CardHeader>
    <CardTitle className="text-sm">AI Assistant</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="prose prose-sm max-w-none">
      {messageContent}
    </div>
  </CardContent>
  <CardFooter>
    <Button variant="ghost" size="sm">
      <Copy className="h-4 w-4" />
    </Button>
  </CardFooter>
</Card>
```

### 3. Theme Integration Design

#### 3.1 CSS Variable Mapping
```css
/* Obsidian CSS Variables to shadcn Design Tokens */
:root {
  --background: var(--background-primary);
  --foreground: var(--text-normal);
  --card: var(--background-secondary);
  --card-foreground: var(--text-normal);
  --popover: var(--background-secondary);
  --popover-foreground: var(--text-normal);
  --primary: var(--interactive-accent);
  --primary-foreground: var(--text-on-accent);
  --secondary: var(--background-secondary-alt);
  --secondary-foreground: var(--text-muted);
  --muted: var(--background-modifier-border);
  --muted-foreground: var(--text-faint);
  --accent: var(--interactive-accent-hover);
  --accent-foreground: var(--text-on-accent);
  --destructive: var(--text-error);
  --destructive-foreground: var(--text-on-accent);
  --border: var(--background-modifier-border);
  --input: var(--background-primary);
  --ring: var(--interactive-accent);
  --radius: 6px;
}
```

#### 3.2 Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... other color mappings
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### 4. Build System Integration

#### 4.1 esbuild Configuration Updates
```javascript
// esbuild.config.mjs updates
const esbuild = require('esbuild');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');

esbuild.build({
  entryPoints: ['main.tsx'],
  bundle: true,
  outfile: 'main.js',
  format: 'iife',
  globalName: 'TangentPlugin',
  external: ['obsidian'],
  plugins: [
    // Add PostCSS plugin for Tailwind processing
    {
      name: 'postcss',
      setup(build) {
        build.onLoad({ filter: /\.css$/ }, async (args) => {
          const css = await fs.readFile(args.path, 'utf8');
          const result = await postcss([tailwindcss, autoprefixer]).process(css, {
            from: args.path,
          });
          return {
            contents: result.css,
            loader: 'css',
          };
        });
      },
    },
  ],
});
```

#### 4.2 Package.json Dependencies
```json
{
  "dependencies": {
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-button": "^1.0.4",
    "@radix-ui/react-card": "^1.0.4",
    "@radix-ui/react-badge": "^1.0.4",
    "@radix-ui/react-textarea": "^1.0.4",
    "@radix-ui/react-input": "^1.0.4",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-switch": "^1.0.4",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-collapsible": "^1.0.4",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31"
  }
}
```

### 5. Component-Specific Implementation Details

#### 5.1 Chat Input Container Migration
**Current Implementation:**
- Custom styled div with inline styles
- Manual textarea and button components
- Custom dropdown implementation

**Target Implementation:**
```typescript
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ChatInputContainer: React.FC<ChatInputContainerProps> = ({ ... }) => {
  return (
    <Card className="chat-input-container">
      <CardContent className="p-4">
        {/* File Context Badges */}
        {selectedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedFiles.map((file) => (
              <Badge key={file.path} variant="secondary">
                <FileText className="h-3 w-3 mr-1" />
                {file.name}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1"
                  onClick={() => removeFileFromContext(file.path)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}
        
        {/* Main Input Area */}
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="flex-1 min-h-[60px] resize-none"
          />
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFileDropdown(!showFileDropdown)}
            >
              <FolderOpen className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
            >
              <FileText className="h-4 w-4" />
            </Button>
            <Button
              onClick={sendMessage}
              disabled={isStreaming || !input.trim()}
              className="flex-1"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

#### 5.2 Message Components Migration
**AI Message Component:**
```typescript
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const AIMessage: React.FC<AIMessageProps> = ({ message, onCopy, onEdit }) => {
  return (
    <Card className="ai-message w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="secondary">AI Assistant</Badge>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => onCopy(message.content)}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onEdit(message.id)}>
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        
        {/* Tool Calls */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-4 space-y-2">
            {message.toolCalls.map((toolCall) => (
              <Collapsible key={toolCall.id}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-between">
                    <span>Tool Call: {toolCall.name}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-x-auto">
                    {JSON.stringify(toolCall.arguments, null, 2)}
                  </pre>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
```

#### 5.3 Modal Components Migration
**Variable Input Modal:**
```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const VariableInputModal: React.FC<VariableInputModalProps> = ({ 
  isOpen, 
  onClose, 
  template, 
  onSubmit 
}) => {
  const form = useForm({
    resolver: zodResolver(template.validationSchema),
    defaultValues: template.defaultValues,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{template.title}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {template.variables?.map((variable) => (
              <FormField
                key={variable.name}
                control={form.control}
                name={variable.name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {variable.label}
                      {variable.required && <span className="text-destructive">*</span>}
                    </FormLabel>
                    <FormControl>
                      {variable.type === 'boolean' ? (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      ) : (
                        <Input
                          {...field}
                          placeholder={variable.description}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                Use Template
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
```

### 6. Performance Optimization Strategy

#### 6.1 Bundle Size Optimization
- **Tree Shaking**: Configure esbuild to eliminate unused shadcn components
- **Code Splitting**: Lazy load modal and dialog components
- **CSS Purging**: Remove unused Tailwind classes in production builds
- **Component Lazy Loading**: Implement React.lazy for heavy components

#### 6.2 Runtime Performance
- **Memoization**: Use React.memo for expensive components
- **Virtual Scrolling**: Implement for long message lists
- **Debounced Input**: Optimize search and filtering operations
- **Efficient Re-renders**: Minimize unnecessary component updates

### 7. Accessibility Implementation

#### 7.1 ARIA Compliance
- **Proper Labels**: Ensure all interactive elements have accessible labels
- **Keyboard Navigation**: Full keyboard support for all components
- **Screen Reader**: Optimize for screen reader compatibility
- **Focus Management**: Proper focus trapping in modals and dialogs

#### 7.2 WCAG 2.1 AA Compliance
- **Color Contrast**: Ensure sufficient contrast ratios
- **Text Scaling**: Support for browser text scaling
- **Motion Reduction**: Respect user's motion preferences
- **Error Indication**: Clear error states and messages

### 8. Testing Strategy

#### 8.1 Component Testing
- **Unit Tests**: Test individual shadcn components
- **Integration Tests**: Test component interactions
- **Visual Regression**: Ensure consistent styling across themes
- **Accessibility Tests**: Automated a11y testing

#### 8.2 User Experience Testing
- **Theme Switching**: Test dark/light mode transitions
- **Performance Testing**: Measure render times and bundle sizes
- **Cross-browser Testing**: Ensure compatibility across browsers
- **Mobile Testing**: Test responsive behavior

### 9. Migration Timeline and Phases

#### Phase 1: Foundation Setup (Week 1)
- Install and configure shadcn/ui
- Set up Tailwind CSS with Obsidian theme integration
- Create base component library
- Update build system configuration

#### Phase 2: Core Components (Week 2-3)
- Migrate basic UI components (Button, Input, Textarea)
- Implement theme integration
- Create utility functions for Obsidian compatibility
- Test basic functionality

#### Phase 3: Complex Components (Week 4-5)
- Migrate modal and dialog components
- Implement form components with validation
- Create dropdown and select components
- Test complex interactions

#### Phase 4: Integration and Polish (Week 6)
- Integrate all components into main application
- Performance optimization and testing
- Accessibility improvements
- Final testing and bug fixes

### 10. Risk Mitigation

#### 10.1 Technical Risks
- **Bundle Size**: Monitor bundle size and implement optimization strategies
- **Performance**: Regular performance testing and optimization
- **Compatibility**: Extensive testing with different Obsidian themes
- **Breaking Changes**: Maintain backward compatibility during migration

#### 10.2 User Experience Risks
- **Visual Consistency**: Ensure seamless visual integration
- **Functionality**: Maintain all existing features and interactions
- **Accessibility**: Preserve and improve accessibility standards
- **Performance**: Ensure no performance regression

This design document provides a comprehensive roadmap for migrating the Tangent plugin to shadcn/ui while maintaining compatibility with Obsidian's ecosystem and ensuring optimal user experience. 
# File Upload Feature Design Document

## Overview
This document outlines the technical design for implementing file upload functionality in the Tangent plugin. The design follows modern web standards and integrates seamlessly with the existing chat interface and Gemini AI integration.

## Architecture Overview

### Component Structure
```
ChatPanel.tsx (Main container)
├── ChatInputContainer.tsx (Enhanced with file upload)
│   ├── FileUploadButton.tsx (New component)
│   ├── FilePreviewList.tsx (New component)
│   ├── DragDropZone.tsx (New component)
│   └── FileUploadProgress.tsx (New component)
└── FileUploadService.ts (New service)
```

### Data Flow
1. User selects/drops files → FileUploadService validates and processes
2. Files are encoded and stored in component state
3. Files are displayed in FilePreviewList with previews
4. On message send → Files are included in Gemini API request
5. Gemini processes files and responds

## Detailed Implementation Design

### 1. File Upload Service (`FileUploadService.ts`)

**Purpose**: Centralized file handling, validation, and encoding

**Key Methods**:
```typescript
interface FileUploadService {
  validateFile(file: File): ValidationResult;
  encodeFile(file: File): Promise<EncodedFile>;
  getFileIcon(fileType: string): string;
  isImageFile(fileType: string): boolean;
  createImagePreview(file: File): Promise<string>;
}
```

**File Validation Logic**:
- **Supported Types**: Images (PNG, JPG, JPEG, GIF, WebP, SVG), Documents (PDF, TXT, MD, DOC, DOCX), Data (CSV, JSON, XML), Code files
- **Size Limits**: 10MB per file, 25MB total
- **Security**: MIME type validation, file extension checking

**File Encoding Strategy**:
- **Images**: Base64 encoding for direct Gemini consumption
- **Text Files**: UTF-8 text extraction
- **Documents**: Text extraction where possible, base64 fallback
- **Binary Files**: Base64 encoding with metadata

### 2. Enhanced ChatInputContainer Component

**New Props**:
```typescript
interface ChatInputContainerProps {
  // ... existing props
  uploadedFiles: UploadedFile[];
  onFileUpload: (files: File[]) => void;
  onFileRemove: (fileId: string) => void;
  isDragOver: boolean;
  onDragOver: (isOver: boolean) => void;
}
```

**Layout Changes**:
- Add file upload button next to existing controls
- Insert file preview area between context files and textarea
- Implement drag-drop zone overlay for visual feedback

### 3. File Upload Button Component (`FileUploadButton.tsx`)

**Features**:
- Icon button with upload icon
- Opens native file picker
- Supports multiple file selection
- Visual feedback during selection

**Implementation**:
```typescript
const FileUploadButton: React.FC<{
  onFileSelect: (files: File[]) => void;
  disabled: boolean;
}> = ({ onFileSelect, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleClick = () => fileInputRef.current?.click();
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    onFileSelect(files);
    e.target.value = ''; // Reset for same file selection
  };
  
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="*/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <IconButton
        icon={<LucidIcon name="upload" size={16} />}
        onClick={handleClick}
        disabled={disabled}
        title="Upload files"
      />
    </>
  );
};
```

### 4. File Preview List Component (`FilePreviewList.tsx`)

**Features**:
- Grid layout for file previews
- Image thumbnails for image files
- File type icons for non-image files
- File size and name display
- Remove button for each file

**Implementation**:
```typescript
const FilePreviewList: React.FC<{
  files: UploadedFile[];
  onRemove: (fileId: string) => void;
}> = ({ files, onRemove }) => {
  return (
    <div className="file-preview-list">
      {files.map(file => (
        <FilePreviewItem
          key={file.id}
          file={file}
          onRemove={() => onRemove(file.id)}
        />
      ))}
    </div>
  );
};
```

**File Preview Item**:
- **Images**: `<img>` tag with thumbnail
- **Documents**: Icon + filename + size
- **Code**: Syntax highlighting icon + filename
- **Remove**: X button with hover effects

### 5. Drag and Drop Zone (`DragDropZone.tsx`)

**Features**:
- Overlay during drag operations
- Visual feedback with border highlighting
- File type validation on drop
- Error messaging for invalid files

**Implementation**:
```typescript
const DragDropZone: React.FC<{
  children: React.ReactNode;
  onFilesDrop: (files: File[]) => void;
  isDragOver: boolean;
}> = ({ children, onFilesDrop, isDragOver }) => {
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer?.files || []);
    onFilesDrop(files);
  };
  
  return (
    <div
      className={`drag-drop-zone ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}
    </div>
  );
};
```

### 6. File Upload Progress Component (`FileUploadProgress.tsx`)

**Features**:
- Progress bar for large file encoding
- File name and size display
- Cancel option for long operations
- Success/error status indicators

### 7. Enhanced AI Integration

**Modified Message Structure**:
```typescript
interface ConversationMessage {
  role: 'user' | 'model' | 'system';
  parts: Array<{
    text?: string;
    inlineData?: {
      mimeType: string;
      data: string; // Base64 encoded
    };
    functionCall?: { /* existing */ };
    functionResponse?: { /* existing */ };
  }>;
}
```

**Gemini API Integration**:
- Files are included as `inlineData` parts in the message
- Each file becomes a separate part in the message
- Text content is prepended to file parts
- Proper MIME type detection and transmission

### 8. State Management

**New State in ChatPanel**:
```typescript
interface ChatPanelState {
  // ... existing state
  uploadedFiles: UploadedFile[];
  isDragOver: boolean;
  uploadProgress: Record<string, number>;
}
```

**File State Structure**:
```typescript
interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  preview?: string; // Base64 for images
  encodedData?: string; // Base64 for all files
  textContent?: string; // For text files
  status: 'uploading' | 'ready' | 'error';
  error?: string;
}
```

## UI/UX Design

### Visual Design Principles
- **Consistency**: Follow existing Tangent plugin design patterns
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Responsive**: Works on different screen sizes
- **Performance**: Lazy loading of image previews, efficient encoding

### Color Scheme
- **Primary**: `var(--color-accent)` for upload button
- **Success**: `var(--color-green)` for successful uploads
- **Error**: `var(--color-red)` for validation errors
- **Warning**: `var(--color-orange)` for size warnings

### Typography
- **File names**: `var(--text-normal)`, 14px
- **File sizes**: `var(--text-muted)`, 12px
- **Error messages**: `var(--text-error)`, 13px

### Spacing and Layout
- **File preview grid**: 8px gap between items
- **Preview size**: 80px × 80px for images
- **Button spacing**: 8px from other controls
- **Padding**: 12px around file preview area

## Error Handling

### Validation Errors
- **File type**: "File type not supported. Please select a supported file type."
- **File size**: "File too large. Maximum size is 10MB per file."
- **Total size**: "Total file size exceeds 25MB limit."
- **Empty file**: "File appears to be empty."

### Upload Errors
- **Encoding failure**: "Failed to process file. Please try again."
- **Network error**: "Failed to upload file. Check your connection."
- **Gemini API error**: "Failed to send file to AI. Please try again."

### User Recovery
- Clear error messages with actionable guidance
- Retry mechanisms for failed uploads
- File removal options for problematic files
- Graceful degradation when features fail

## Performance Considerations

### File Processing
- **Async encoding**: Non-blocking file processing
- **Progress indicators**: Visual feedback for large files
- **Memory management**: Efficient handling of large files
- **Cancellation**: Allow users to cancel long operations

### UI Performance
- **Virtual scrolling**: For large file lists
- **Lazy loading**: Image previews loaded on demand
- **Debounced updates**: Prevent excessive re-renders
- **Optimized re-renders**: React.memo for stable components

### Network Optimization
- **Compression**: Gzip for text files
- **Chunked uploads**: For very large files
- **Retry logic**: Exponential backoff for failures
- **Caching**: Avoid re-encoding same files

## Security Considerations

### File Validation
- **MIME type checking**: Validate actual file content
- **Extension validation**: Check file extensions
- **Size limits**: Prevent DoS attacks
- **Malicious file detection**: Basic security scanning

### Data Handling
- **No local storage**: Files not saved to disk
- **Memory cleanup**: Proper disposal of file data
- **Secure transmission**: HTTPS for all uploads
- **Privacy**: No file content logging

## Testing Strategy

### Unit Tests
- File validation logic
- Encoding functions
- Component rendering
- Error handling

### Integration Tests
- File upload flow
- Gemini API integration
- Drag and drop functionality
- Error recovery

### User Acceptance Tests
- All user stories from specification
- Cross-browser compatibility
- Mobile responsiveness
- Accessibility compliance

## Implementation Phases

### Phase 1: Core Upload (Week 1)
- FileUploadService implementation
- Basic file upload button
- File validation and encoding
- Simple file preview list

### Phase 2: Enhanced UI (Week 2)
- Drag and drop functionality
- Image preview thumbnails
- Progress indicators
- Error handling improvements

### Phase 3: AI Integration (Week 3)
- Gemini API integration
- Multi-file message support
- Performance optimizations
- Comprehensive testing

### Phase 4: Polish (Week 4)
- Accessibility improvements
- Cross-browser testing
- Performance tuning
- Documentation and user guides

## Success Criteria
- All user stories from specification are implemented
- File upload works reliably across different file types
- Integration with Gemini AI functions correctly
- UI is responsive and accessible
- Error handling provides clear user guidance
- Performance meets specified requirements 
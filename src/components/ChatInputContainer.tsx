import React from 'react';
import LucidIcon from './LucidIcon';
import IconButton from './IconButton';
import ToggleButton from './ToggleButton';
import { MODEL_CONFIGS } from 'modelConfigs';
import FileUploadButton from './FileUploadButton';
import FilePreviewList from './FilePreviewList';
import { UploadedFile } from '../../FileUploadService';
import Dropdown from './Dropdown';
import { DropdownItem } from '../../tools/types';
import { ConversationTemplate } from '../../tools/types';

type ChatInputContainerProps = {
  selectedFiles: { name: string; content: string; path: string; isCurrentFile?: boolean }[];
  input: string;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  editingMessageId: string | null;
  isStreaming: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleFileSelect: (file: { name: string; path: string }) => void;
  handleCancelEdit: () => void;
  sendMessage: () => void;
  showFileDropdown: boolean;
  filteredFiles: { name: string; path: string }[];
  selectedFileIndex: number;
  setSelectedFileIndex: React.Dispatch<React.SetStateAction<number>>;
  removeFileFromContext: (path: string) => void;
  selectedModel: any;
  setSelectedModel: (model: any) => void;
  thinkingEnabled: boolean;
  setThinkingEnabled: (enabled: boolean) => void;
  setShowFileDropdown: React.Dispatch<React.SetStateAction<boolean>>;
  // File upload props
  uploadedFiles: UploadedFile[];
  onFileUpload: (files: File[]) => void;
  onFileRemove: (fileId: string) => void;
  // Template props
  showTemplateDropdown: boolean;
  setShowTemplateDropdown: React.Dispatch<React.SetStateAction<boolean>>;
  templateItems: DropdownItem[];
  selectedTemplateIndex: number;
  setSelectedTemplateIndex: React.Dispatch<React.SetStateAction<number>>;
  handleTemplateSelect: (template: ConversationTemplate) => void;
  isLoadingTemplates?: boolean;
  templateError?: string | null;
  // Web search props
  webSearchEnabled: boolean;
  setWebSearchEnabled: (enabled: boolean) => void;
  // Cancellation prop
  onCancelStreaming?: () => void;
};

const ChatInputContainer: React.FC<ChatInputContainerProps> = ({
  selectedFiles,
  input,
  textareaRef,
  editingMessageId,
  isStreaming,
  handleInputChange,
  handleFileSelect,
  handleCancelEdit,
  sendMessage,
  showFileDropdown,
  filteredFiles,
  selectedFileIndex,
  setSelectedFileIndex,
  removeFileFromContext,
  selectedModel,
  setSelectedModel,
  thinkingEnabled,
  setThinkingEnabled,
  setShowFileDropdown,
  uploadedFiles = [],
  onFileUpload = () => {},
  onFileRemove = () => {},
  // Template props
  showTemplateDropdown,
  setShowTemplateDropdown,
  templateItems,
  selectedTemplateIndex,
  setSelectedTemplateIndex,
  handleTemplateSelect,
  isLoadingTemplates = false,
  templateError = null,
  // Web search props
  webSearchEnabled,
  setWebSearchEnabled,
  onCancelStreaming,
}) => {
  // Convert files to dropdown items for the generic dropdown
  const fileDropdownItems: DropdownItem[] = filteredFiles.map(file => ({
    id: file.path,
    title: file.name,
    description: file.path,
    category: 'File',
    icon: 'file-text',
    metadata: { file }
  }));

  // Convert templates to dropdown items for the generic dropdown
  const templateDropdownItems: DropdownItem[] = templateItems.map(item => ({
    ...item,
    metadata: { template: item.metadata?.template }
  }));

  // Handle file selection from dropdown
  const handleFileDropdownSelect = (itemId: string) => {
    const file = filteredFiles.find(f => f.path === itemId);
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle template selection from dropdown
  const handleTemplateDropdownSelect = (itemId: string) => {
    try {
      console.log('Template dropdown selection:', { itemId, templateItemsCount: templateItems.length });
      
      const templateItem = templateItems.find(t => t.id === itemId);
      console.log('Found template item:', templateItem);
      
      if (!templateItem) {
        console.error('Template item not found for ID:', itemId);
        return;
      }
      
      if (!templateItem.metadata) {
        console.error('Template item has no metadata:', templateItem);
        return;
      }
      
      if (!templateItem.metadata.template) {
        console.error('Template item metadata has no template:', templateItem.metadata);
        return;
      }
      
      const template = templateItem.metadata.template as ConversationTemplate;
      console.log('Extracted template:', {
        id: template.id,
        title: template.title,
        contentLength: template.content?.length,
        variablesCount: template.variables?.length
      });
      
      handleTemplateSelect(template);
    } catch (error) {
      console.error('Error in handleTemplateDropdownSelect:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        itemId,
        templateItems: templateItems
      });
    }
  };

  return (
    <div className="tangent-chat-input-main-container">
      {/* Context Files */}
      {selectedFiles.length > 0 && (
        <div className="tangent-context-files-container">
          {selectedFiles.map((file, index) => (
            <div key={file.path} className={`tangent-context-file-item ${file.isCurrentFile ? 'current-file' : ''}`}>
              <LucidIcon name="file-text" size={12} />
              <span>{file.name}</span>
              {file.isCurrentFile && (
                <span className="tangent-current-file-indicator">(Current file)</span>
              )}
              <IconButton
                onClick={() => removeFileFromContext(file.path)}
                ariaLabel="Remove file from context"
                icon={<LucidIcon name="x" size={12} />}
              />
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Files Preview */}
      <FilePreviewList
        files={uploadedFiles}
        onRemove={onFileRemove}
      />
      <textarea
        ref={textareaRef}
        value={input}
        placeholder={editingMessageId ? "Edit your message..." : "Type a message... (use @ for files, / for templates)"}
        disabled={isStreaming}
        onChange={handleInputChange}
        onKeyDown={e => { 
          // Only handle Enter for sending message when no dropdown is open
          if (!showFileDropdown && !showTemplateDropdown) {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            } else if (e.key === 'Escape' && editingMessageId) {
              e.preventDefault();
              handleCancelEdit();
            }
          }
          // Let dropdowns handle their own keyboard navigation
        }}
        className="tangent-chat-textarea"
      />
      
      {/* File Dropdown */}
      {showFileDropdown && (
        <div className="tangent-dropdown-container">
          <Dropdown
            items={fileDropdownItems}
            onValueChange={handleFileDropdownSelect}
            placeholder="Select a file..."
            maxHeight={200}
            maxItems={5}
            openUpwards={true}
            autoOpen={true}
            selectedIndex={selectedFileIndex}
            onSelectedIndexChange={setSelectedFileIndex}
            onOpenChange={setShowFileDropdown}
            aria-label="File selection"
          />
        </div>
      )}

      {/* Template Dropdown */}
      {showTemplateDropdown && (
        <div className="tangent-dropdown-container">
          {isLoadingTemplates ? (
            <div className="tangent-loading-templates">
              <LucidIcon name="loader-2" size={16} className="animate-spin" />
              <span>Loading templates...</span>
            </div>
          ) : templateError ? (
            <div className="tangent-template-error">
              <div className="tangent-template-error-header">
                <LucidIcon name="alert-circle" size={16} />
                <strong>Template Error</strong>
              </div>
              <div>{templateError}</div>
            </div>
          ) : (
            <Dropdown
              items={templateDropdownItems}
              onValueChange={handleTemplateDropdownSelect}
              placeholder="Select a template..."
              maxHeight={300}
              maxItems={templateDropdownItems.length > 5 ? 10 : 5}
              openUpwards={true}
              autoOpen={true}
              selectedIndex={selectedTemplateIndex}
              onSelectedIndexChange={setSelectedTemplateIndex}
              onOpenChange={setShowTemplateDropdown}
              aria-label="Template selection"
            />
          )}
        </div>
      )}

      {/* Bottom controls */}
      <div className="tangent-bottom-controls">
        {/* Model Selection - Bottom Left */}
        <div className="tangent-model-selection">
          <select
            value={selectedModel.id}
            onChange={e => {
              const model = MODEL_CONFIGS.find(m => m.id === e.target.value);
              if (model) setSelectedModel(model);
            }}
            disabled={isStreaming}
            aria-label="Select AI model"
            className="tangent-model-select"
          >
            {MODEL_CONFIGS.map(model => (
              <option key={model.id} value={model.id}>
                {model.label}
              </option>
            ))}
          </select>
        </div>

        {/* Toggle Controls - Center */}
        <div className="tangent-toggle-controls">
          {/* Thinking Toggle Control */}
          {selectedModel.supportsThinking && (
            <ToggleButton
              iconName="brain"
              isEnabled={thinkingEnabled}
              onToggle={() => setThinkingEnabled(!thinkingEnabled)}
              disabled={isStreaming}
              enabledTitle="Thinking enabled"
              disabledTitle="Thinking disabled"
              enabledAriaLabel="Disable thinking"
              disabledAriaLabel="Enable thinking"
            />
          )}
          
          {/* Web Search Toggle Control */}
          <ToggleButton
            iconName="search"
            isEnabled={webSearchEnabled}
            onToggle={() => setWebSearchEnabled(!webSearchEnabled)}
            disabled={isStreaming}
            enabledTitle="Web search enabled"
            disabledTitle="Web search disabled"
            enabledAriaLabel="Disable web search"
            disabledAriaLabel="Enable web search"
          />
        </div>

        {/* Action Buttons - Bottom Right */}
        <div className="tangent-action-buttons">
          {/* File Upload Button */}
          <FileUploadButton
            onFileSelect={onFileUpload}
            disabled={isStreaming}
            title="Upload files"
          />
          
          {editingMessageId && (
            <button
              onClick={handleCancelEdit}
              disabled={isStreaming}
              className="tangent-cancel-edit-btn"
              title="Cancel editing"
            >
              <LucidIcon name="x" size={14} />
            </button>
          )}
          <div className="tangent-send-button-container">
            {/* Spinner background when streaming */}
            {isStreaming && (
              <div className="tangent-spinner-background" />
            )}
            <IconButton
              icon={isStreaming ? <LucidIcon name="circle-stop" size={14} /> : <LucidIcon name="arrow-up-from-dot" size={18} />}
              ariaLabel={isStreaming ? "Cancel" : "Send"}
              onClick={isStreaming ? onCancelStreaming : () => sendMessage()}
              disabled={false} // Allow clicking during streaming for cancellation
              title={isStreaming ? "Cancel streaming" : "Send"}
              color={isStreaming ? "var(--color-red)" : "var(--color-accent)"}
              style={{
                position: 'relative',
                zIndex: 2,
                borderRadius: '50%',
                backgroundColor: isStreaming ? 'var(--background-primary)' : undefined,
                border: isStreaming ? '1px solid var(--background-modifier-border)' : undefined
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInputContainer; 
import React, { useState } from 'react';
// Simple Modal component
import { calculateModelCost } from '../utils/costCalculation';

const UsageInfoModal: React.FC<{ open: boolean; onClose: () => void; usageMetadata?: UsageMetadata; selectedModel?: any }> = ({ open, onClose, usageMetadata, selectedModel }) => {
  if (!open) return null;

  // Calculate costs if possible
  let costInfo: { inputCost: number; outputCost: number; totalCost: number } | null = null;
  if (
    usageMetadata &&
    typeof usageMetadata.promptTokenCount === 'number' &&
    typeof usageMetadata.candidatesTokenCount === 'number' &&
    selectedModel && selectedModel.id
  ) {
    costInfo = calculateModelCost(
      selectedModel.id,
      usageMetadata.promptTokenCount,
      usageMetadata.candidatesTokenCount
    );
  }

  return (
    <div style={{
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.35)'
    }}>
      <div style={{
        background: 'var(--background-primary, #23242a)',
        color: 'var(--text-normal, #e0e0e0)',
        borderRadius: 16,
        minWidth: 320,
        maxWidth: 440,
        padding: '2em 2em 1.5em 2em',
        boxShadow: '0 4px 32px 0 rgba(0,0,0,0.25)',
        border: '1px solid var(--background-modifier-border)',
        position: 'relative',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute',
          top: 12,
          right: 12,
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          fontSize: 18
        }} aria-label="Close usage info modal">
          <LucidIcon name="x" size={18} />
        </button>
        <h3 style={{marginTop: 0, marginBottom: 16, fontWeight: 600, fontSize: '1.2em'}}>Token Usage Info</h3>
        <>
          <h6>Prompt tokens: <b>{usageMetadata?.promptTokenCount ?? '?'}</b></h6>
          <h6>Response tokens: <b>{usageMetadata?.candidatesTokenCount ?? '?'}</b></h6>
          <h6>Total tokens: <b>{usageMetadata?.totalTokenCount ?? '?'}</b></h6>
          {typeof usageMetadata?.cachedContentTokenCount === 'number' && (
            <h6>Cached content tokens: <b>{usageMetadata.cachedContentTokenCount}</b></h6>
          )}
          {usageMetadata?.cacheTokensDetails && usageMetadata.cacheTokensDetails.length > 0 && (
            <div style={{marginTop: 8}}>
              <div style={{fontWeight: 500, marginBottom: 2}}>Cache tokens details:</div>
              <ul style={{margin: 0, paddingLeft: 18}}>
                {usageMetadata.cacheTokensDetails.map((d, i) => (
                  <li key={i}>{d.modality}: <b>{d.tokenCount}</b></li>
                ))}
              </ul>
            </div>
          )}
          {usageMetadata?.promptTokensDetails && usageMetadata.promptTokensDetails.length > 0 && (
            <div style={{marginTop: 8}}>
              <div style={{fontWeight: 500, marginBottom: 2}}>Prompt tokens details:</div>
              <ul style={{margin: 0, paddingLeft: 18}}>
                {usageMetadata.promptTokensDetails.map((d, i) => (
                  <li key={i}>{d.modality}: <b>{d.tokenCount}</b></li>
                ))}
              </ul>
            </div>
          )}
          {costInfo && (
            <div style={{marginTop: 12, fontWeight: 500}}>
              <div>Input cost: <b>₹{costInfo.inputCost.toFixed(4)}</b></div>
              <div>Output cost: <b>₹{costInfo.outputCost.toFixed(4)}</b></div>
              <div>Total cost: <b>₹{costInfo.totalCost.toFixed(4)}</b></div>
            </div>
          )}
        </>
      </div>
    </div>
  );
};
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
import { UsageMetadata } from 'ai';

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
  templateItemRenderer?: (item: DropdownItem, isSelected: boolean, isHighlighted: boolean) => React.ReactNode;
  // Web search props
  webSearchEnabled: boolean;
  setWebSearchEnabled: (enabled: boolean) => void;
  // Cancellation prop
  onCancelStreaming?: () => void;
  usageMetadata?: UsageMetadata
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
  templateItemRenderer,
  // Web search props
  webSearchEnabled,
  setWebSearchEnabled,
  onCancelStreaming,
  usageMetadata
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

  const [showUsageModal, setShowUsageModal] = useState(false);

  return (
    <>
      <UsageInfoModal open={showUsageModal} onClose={() => setShowUsageModal(false)} usageMetadata={usageMetadata} selectedModel={selectedModel} />
      <div className="tangent-chat-input-main-container" style={{marginTop: 0}}>
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
              itemRenderer={templateItemRenderer}
              aria-label="Template selection"
            />
          )}
        </div>
      )}

      {/* Bottom controls */}
      <div className="tangent-bottom-controls" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
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
            showSpinner={webSearchEnabled && isStreaming}
          />
        </div>

        {/* Action Buttons - Bottom Right */}
        <div className="tangent-action-buttons" style={{display: 'flex', alignItems: 'center', gap: 8}}>
          {/* Info Icon Button for Usage Metadata */}
          <IconButton
            icon={<LucidIcon name="info" size={16} />}
            ariaLabel="Show token usage info"
            onClick={() => setShowUsageModal(true)}
            disabled={!usageMetadata}
            title="Show token usage info"
            style={{ marginRight: 4, color: 'var(--text-muted)' }}
          />
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
    </>
  );
}

export default ChatInputContainer; 
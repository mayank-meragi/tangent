import React from 'react';
import LucidIcon from './LucidIcon';
import IconButton from './IconButton';
import { MODEL_CONFIGS } from 'modelConfigs';
import FileUploadButton from './FileUploadButton';
import FilePreviewList from './FilePreviewList';
import { UploadedFile } from '../../FileUploadService';


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
}) => (
  <div style={{
    border: '1px solid var(--background-modifier-border)',
    borderRadius: '10px',
    backgroundColor: 'var(--background-secondary)',
    margin: '8px',
    padding: '4px 8px 32px 4px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    position: 'relative',
  }}>
    {/* Context Files */}
    {selectedFiles.length > 0 && (
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: '4px',
      }}>
        {selectedFiles.map((file, index) => (
          <div key={file.path} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'var(--background-primary)',
            border: '1px solid var(--background-modifier-border)',
            borderRadius: '6px',
            padding: '2px 4px',
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontWeight: 500,
            opacity: file.isCurrentFile ? 1 : 0.85,
            height: '25px',
          }}>
            <LucidIcon name="file-text" size={12} />
            <span>{file.name}</span>
            {file.isCurrentFile && (
              <span style={{ color: 'var(--text-faint)', marginLeft: 2 }}>(Current file)</span>
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
      placeholder={editingMessageId ? "Edit your message..." : "Type a message... (use @ to mention files)"}
      disabled={isStreaming}
      onChange={handleInputChange}
      onKeyDown={e => { 
        if (showFileDropdown) {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedFileIndex(prev => 
              prev < filteredFiles.length - 1 ? prev + 1 : prev
            );
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedFileIndex(prev => prev > 0 ? prev - 1 : prev);
          } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredFiles[selectedFileIndex]) {
              handleFileSelect(filteredFiles[selectedFileIndex]);
            }
          } else if (e.key === 'Escape') {
            setShowFileDropdown(false);
          }
        } else if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        } else if (e.key === 'Escape' && editingMessageId) {
          e.preventDefault();
          handleCancelEdit();
        }
      }}
      style={{
        width: '100%',
        minHeight: '44px',
        padding: '2px 8px',
        border: 'none',
        backgroundColor: 'transparent',
        color: 'var(--text-normal)',
        fontSize: '14px',
        outline: 'none',
        resize: 'none',
        overflowY: 'hidden',
        borderRadius: '8px',
        boxSizing: 'border-box',
      }}
    />
    {/* File dropdown */}
    {showFileDropdown && (
      <div style={{
        position: 'absolute',
        bottom: '100%',
        left: 0,
        right: 0,
        maxHeight: '200px',
        overflowY: 'auto',
        backgroundColor: 'var(--background-primary)',
        border: '1px solid var(--background-modifier-border)',
        borderRadius: '8px',
        zIndex: 1000,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        marginBottom: '8px'
      }}>
        {filteredFiles.length > 0 ? (
          filteredFiles.map((file, index) => (
            <div
              key={file.path}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: index < filteredFiles.length - 1 ? '1px solid var(--background-modifier-border)' : 'none',
                fontSize: '13px',
                backgroundColor: index === selectedFileIndex ? 'var(--background-modifier-hover)' : 'transparent',
                color: 'var(--text-normal)'
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                handleFileSelect(file);
              }}
              onMouseEnter={() => {
                setSelectedFileIndex(index);
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <LucidIcon name="file-text" size={12} />
                {file.name}
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>
            No files found
          </div>
        )}
      </div>
    )}
    {/* Bottom controls */}
    <div style={{
      position: 'absolute',
      bottom: '2px',
      left: '8px',
      right: '8px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      pointerEvents: 'none' // Allow clicks to pass through to children
    }}>
      {/* Model Selection and Thinking Budget - Bottom Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', pointerEvents: 'auto' }}>
        <select
          value={selectedModel.id}
          onChange={e => {
            const model = MODEL_CONFIGS.find(m => m.id === e.target.value);
            if (model) setSelectedModel(model);
          }}
          disabled={isStreaming}
          aria-label="Select AI model"
          style={{
            backgroundColor: 'transparent',
            color: 'var(--text-faint)',
            border: 'none',
            borderWidth: '0',
            borderStyle: 'none',
            boxShadow: 'none',
            fontSize: '12px',
            outline: 'none',
            cursor: 'pointer',
            appearance: 'none',
            WebkitAppearance: 'none',
            transition: 'color 0.2s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'var(--text-faint)';
          }}
        >
          {MODEL_CONFIGS.map(model => (
            <option key={model.id} value={model.id}>
              {model.label}
            </option>
          ))}
        </select>
        {/* Thinking Toggle Control */}
        {selectedModel.supportsThinking && (
          <button
            onClick={() => setThinkingEnabled(!thinkingEnabled)}
            disabled={isStreaming}
            aria-label={thinkingEnabled ? "Disable thinking" : "Enable thinking"}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              backgroundColor: 'transparent',
              color: thinkingEnabled ? 'var(--text-accent)' : 'var(--text-faint)',
              border: 'none',
              cursor: 'pointer',
              padding: '2px 4px',
              borderRadius: '4px',
              transition: 'color 0.2s ease',
              opacity: isStreaming ? 0.6 : 1
            }}
            onMouseEnter={e => {
              if (!isStreaming) {
                e.currentTarget.style.backgroundColor = 'var(--background-modifier-hover)';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title={thinkingEnabled ? "Thinking enabled" : "Thinking disabled"}
          >
            <LucidIcon name="brain" size={10} />
            <span>{thinkingEnabled ? "Thinking" : "No thinking"}</span>
          </button>
        )}
      </div>
      {/* Send and Cancel Buttons - Bottom Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'auto' }}>
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
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: 'var(--background-secondary)',
              color: 'var(--text-muted)',
              border: 'none',
              borderRadius: '6px',
              cursor: isStreaming ? 'not-allowed' : 'pointer',
              opacity: isStreaming ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '2px'
            }}
            title="Cancel editing"
          >
            <LucidIcon name="x" size={14} />
          </button>
        )}
        <IconButton
          icon={<LucidIcon name="send" size={18} />}
          ariaLabel="Send"
          onClick={() => sendMessage()}
          disabled={isStreaming}
          title="Send"
          color="var(--color-accent)"
        />
      </div>
    </div>
  </div>
);

export default ChatInputContainer; 
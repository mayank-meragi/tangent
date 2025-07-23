import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { MODEL_CONFIGS, ModelConfig } from './modelConfigs';
import { useChatMessages, ChatMessagesProvider } from './ChatMessagesContext';
import { ConversationMessage } from './ai';
import { createSystemPrompt } from './systemPrompt';
import { PendingToolCall, ToolConfirmationResult } from './tools';
import { ConversationService, Conversation } from './conversationService';
import { TemplateService } from './templateService';
import { PersonaService } from './personaService';
import HistoryTab from './HistoryTab';
import IconButton from './src/components/IconButton';
import ChatMessageContainer from './src/components/ChatMessageContainer';
import LucidIcon from './src/components/LucidIcon';
import AIMessage from './src/components/AIMessage';
import ChatInputContainer from './src/components/ChatInputContainer';
import UserMessage from './src/components/UserMessage';
import { UploadedFile, fileUploadService } from './FileUploadService';
import { DropdownItem, ConversationTemplate, TemplateSettings, Persona } from './tools/types';
import { VariableInputModal } from './src/components/VariableInputModal';
import TemplateSettingsPreview from './src/components/TemplateSettingsPreview';
import PersonaSelector from './src/components/PersonaSelector';
import PersonaBadge from './src/components/PersonaBadge';

export interface ChatPanelProps {
  geminiApiKey: string;
  streamAIResponse: (prompt: string, onToken: (token: string) => void, modelId: string, onToolCall: (toolName: string, toolArgs: any) => void, onToolResult: (toolName: string, result: any) => void, onToolsComplete: (toolResults: string) => void, conversationHistory?: ConversationMessage[], thinkingBudget?: number, onThinking?: (thoughts: string) => void, onToolConfirmationNeeded?: (pendingTool: PendingToolCall) => Promise<ToolConfirmationResult>, webSearchEnabled?: boolean, abortController?: AbortController, onSearchResults?: (searchQuery: string, searchResults: any[]) => void) => Promise<void>;
  app: any; // Obsidian App instance
  unifiedToolManager?: any; // UnifiedToolManager instance
}

// File list result renderer
const FileListResult: React.FC<{ files: { name: string; type: 'file' | 'folder'; path: string }[] }> = ({ files }) => (
  <ul className="tangent-file-list">
    {files.map((file, i) => (
      <li key={i} className="tangent-file-list-item">
        <LucidIcon name={file.type === 'folder' ? 'folder' : 'file-text'} size={12} />
        <span className={`tangent-file-name ${file.type === 'folder' ? 'folder' : ''}`}>{file.name}</span>
        <span className="tangent-file-path">({file.path})</span>
      </li>
    ))}
  </ul>
);

// Collapsible Tool Call
const CollapsibleToolCall: React.FC<{ toolName: string; toolArgs: any }> = ({ toolName, toolArgs }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="tangent-chat-tool-call">
      <span className="tangent-collapsible-trigger" onClick={() => setOpen(o => !o)}>
        <LucidIcon name={open ? 'chevron-down' : 'chevron-right'} size={12} />
        <LucidIcon name="wrench" size={8} />
        <b>Calling tool:</b> {toolName}
      </span>
      {open && toolArgs && (
        <pre className="tangent-tool-args">{JSON.stringify(toolArgs, null, 2)}</pre>
      )}
    </div>
  );
};

// Collapsible Tool Result
const CollapsibleToolResult: React.FC<{ toolName: string; result: any }> = ({ toolName, result }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="tangent-chat-tool-result">
      <span className="tangent-collapsible-trigger" onClick={() => setOpen(o => !o)}>
        <LucidIcon name={open ? 'chevron-down' : 'chevron-right'} size={12} />
        <LucidIcon name="check-circle" size={8} />
        <b>Tool result:</b> {toolName}
      </span>
      {open && (
        <div className="tangent-tool-result-content">
          {result.type === 'file-list' ? (
            <FileListResult files={result.files} />
          ) : result.type === 'text' ? (
            <ReactMarkdown>{result.text}</ReactMarkdown>
          ) : (
            <ReactMarkdown>{typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)}</ReactMarkdown>
          )}
        </div>
      )}
    </div>
  );
};





// Tool Confirmation Component
const ToolConfirmationCard: React.FC<{
  pendingTool: PendingToolCall;
  onApprove: () => void;
  onDeny: () => void;
  approved?: boolean;
}> = ({ pendingTool, onApprove, onDeny, approved }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async () => {
    setIsProcessing(true);
    onApprove();
  };

  const handleDeny = async () => {
    setIsProcessing(true);
    onDeny();
  };

  if (approved !== undefined) {
    // Show result of confirmation
    return (
      <div className={`tangent-tool-confirmation-result ${approved ? 'approved' : 'denied'}`}>
        <div className="tangent-tool-confirmation-title">
          {approved ? '✅ Tool Approved' : '❌ Tool Denied'}
        </div>
        <div className="tangent-tool-confirmation-message">
          {pendingTool.name} {approved ? 'was executed' : 'was cancelled'}
        </div>
      </div>
    );
  }

  return (
    <div className="tangent-tool-confirmation-pending">
      <div className="tangent-tool-confirmation-header">
        🔧 Tool Confirmation Required
      </div>
      <div className="tangent-tool-confirmation-tool">
        <strong>Tool:</strong> {pendingTool.name}
      </div>
      <div className="tangent-tool-confirmation-args">
        <strong>Arguments:</strong>
        <pre>
          {JSON.stringify(pendingTool.args, null, 2)}
        </pre>
      </div>
      <div className="tangent-tool-confirmation-actions">
        <button
          onClick={handleApprove}
          disabled={isProcessing}
          className="tangent-tool-confirmation-btn approve"
        >
          {isProcessing ? 'Processing...' : 'Approve'}
        </button>
        <button
          onClick={handleDeny}
          disabled={isProcessing}
          className="tangent-tool-confirmation-btn deny"
        >
          {isProcessing ? 'Processing...' : 'Deny'}
        </button>
      </div>
    </div>
  );
};

export const ChatPanel: React.FC<ChatPanelProps> = ({ geminiApiKey, streamAIResponse, app, unifiedToolManager }) => {
  const { 
    messages, 
    addMessage, 
    updateMessage,
    removeMessagesAfter,
    addToolCall, 
    addToolResult, 
    loadMessages,
    addPendingToolConfirmation,
    resolvePendingToolConfirmation,
    clearMessages
  } = useChatMessages();
  
  // History-related state
  const [conversationService] = useState(() => new ConversationService(app));
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [autoSaveEnabled] = useState(true);
  const [input, setInput] = React.useState('');
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [selectedModel, setSelectedModel] = React.useState<ModelConfig>(MODEL_CONFIGS[0]);
  const [thinkingEnabled, setThinkingEnabled] = React.useState<boolean>((selectedModel.defaultThinkingBudget || 0) > 0);
  const [selectedFiles, setSelectedFiles] = React.useState<{name: string, content: string, path: string, isCurrentFile?: boolean}[]>([]);
  const [showFileDropdown, setShowFileDropdown] = React.useState(false);
  const [availableFiles, setAvailableFiles] = React.useState<{name: string, path: string}[]>([]);
  const [atMentionQuery, setAtMentionQuery] = React.useState('');
  const [selectedFileIndex, setSelectedFileIndex] = React.useState(0);
  // File upload state
  const [uploadedFiles, setUploadedFiles] = React.useState<UploadedFile[]>([]);
  // Web search state
  const [webSearchEnabled, setWebSearchEnabled] = React.useState(false);
  
  // Template-related state
  const [templateService] = useState(() => new TemplateService(app));
  const [showTemplateDropdown, setShowTemplateDropdown] = React.useState(false);
  const [templateItems, setTemplateItems] = React.useState<DropdownItem[]>([]);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = React.useState(0);
  const [slashTemplateQuery, setSlashTemplateQuery] = React.useState('');
  const [isLoadingTemplates, setIsLoadingTemplates] = React.useState(false);
  const [templateError, setTemplateError] = React.useState<string | null>(null);
  const [showVariableModal, setShowVariableModal] = React.useState(false);
  const [selectedTemplate, setSelectedTemplate] = React.useState<ConversationTemplate | null>(null);

  // Persona-related state
  const [personaService] = useState(() => new PersonaService(app));
  const [selectedPersona, setSelectedPersona] = React.useState<Persona | null>(null);
  const [personas, setPersonas] = React.useState<Persona[]>([]);
  const [isPersonaSelectorVisible, setIsPersonaSelectorVisible] = React.useState(true);

  const [hasUserRemovedCurrentFile, setHasUserRemovedCurrentFile] = React.useState(false);
  const [editingMessageId, setEditingMessageId] = React.useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentMessagesRef = useRef(messages);
  const justSelectedFileRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  // Add AbortController ref for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  // State for which view is active
  const [activeView, setActiveView] = useState<'chat' | 'history' | 'servers'>('chat');
  // Smart scrolling state
  const [userHasScrolledUp, setUserHasScrolledUp] = React.useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Update thinking enabled state when model changes
  useEffect(() => {
    if (selectedModel.defaultThinkingBudget !== undefined) {
      setThinkingEnabled(selectedModel.defaultThinkingBudget > 0);
    }
  }, [selectedModel]);

  // Load personas on component mount
  useEffect(() => {
    const loadPersonas = async () => {
      try {
        const allPersonas = await personaService.getAllPersonas();
        setPersonas(allPersonas);
      } catch (error) {
        console.error('Failed to load personas:', error);
      }
    };
    loadPersonas();
  }, [personaService]);

  // Persona selection handlers
  const handlePersonaSelect = (persona: Persona) => {
    setSelectedPersona(persona);
  };

  const handlePersonaClear = () => {
    setSelectedPersona(null);
  };

  const handleFirstMessage = () => {
    setIsPersonaSelectorVisible(false);
  };

  // Calculate thinking budget based on enabled state
  const getThinkingBudget = () => {
    return thinkingEnabled ? (selectedModel.defaultThinkingBudget || 8192) : 0;
  };

  // Cancel streaming function
  const cancelStreaming = () => {
    if (abortControllerRef.current) {
      console.log('[ChatPanel] Cancelling streaming request');
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  // Tool confirmation handler
  const handleToolConfirmation = async (pendingTool: PendingToolCall): Promise<ToolConfirmationResult> => {
    return new Promise((resolve) => {
      // Add pending confirmation to context
      addPendingToolConfirmation(pendingTool);
      
      // Set up a resolver for this specific tool call
      const confirmationResolver = (approved: boolean) => {
        resolvePendingToolConfirmation(pendingTool.id, approved);
        resolve({
          approved,
          toolCallId: pendingTool.id
        });
      };
      
      // Store resolver temporarily (we'll use it in the component)
      (window as any)[`confirmationResolver_${pendingTool.id}`] = confirmationResolver;
    });
  };

  // Auto-resize textarea function
  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 200; // Match the maxHeight in ChatInputContainer
      
      if (scrollHeight <= maxHeight) {
        // Content fits within max height, auto-resize
        textareaRef.current.style.height = scrollHeight + 'px';
      } else {
        // Content exceeds max height, set to max height and enable scrolling
        textareaRef.current.style.height = maxHeight + 'px';
      }
    }
  };

  // Update the ref whenever messages change
  useEffect(() => {
    currentMessagesRef.current = messages;
  }, [messages]);

  // Smart scrolling: detect if user has scrolled up
  useEffect(() => {
    const messagesContainer = messagesContainerRef.current;
    if (!messagesContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold
      setUserHasScrolledUp(!isAtBottom);
    };

    messagesContainer.addEventListener('scroll', handleScroll);
    return () => messagesContainer.removeEventListener('scroll', handleScroll);
  }, []);

  // Initialize template service
  useEffect(() => {
    const initializeTemplates = async () => {
      try {
        setIsLoadingTemplates(true);
        setTemplateError(null);
        await templateService.initialize();
        console.log('Template service initialized in ChatPanel');
        // Load all templates after initialization
        await getAllTemplates();
      } catch (error) {
        console.error('Failed to initialize template service:', error);
        setTemplateError('Failed to initialize template service');
      } finally {
        setIsLoadingTemplates(false);
      }
    };
    
    initializeTemplates();
  }, [templateService]);

  // Function to get all templates
  const getAllTemplates = async () => {
    try {
      setIsLoadingTemplates(true);
      setTemplateError(null);
      
      console.log('Fetching templates from service...');
      const templates = await templateService.getAllTemplates();
      console.log('Raw templates from service:', templates);
      
      const templateDropdownItems: DropdownItem[] = templates.map(template => {
        console.log('Processing template:', {
          id: template.id,
          title: template.title,
          contentLength: template.content?.length,
          variablesCount: template.variables?.length,
          settings: template.settings
        });
        
        return {
          id: template.id,
          title: template.title,
          description: template.description,
          category: template.category,
          icon: 'message-square',
          metadata: { template }
        };
      });
      
      console.log('Created dropdown items:', templateDropdownItems);
      setTemplateItems(templateDropdownItems.slice(0, 5)); // Limit to 5 for initial display
    } catch (error) {
      console.error('Error getting templates:', error);
      setTemplateError('Failed to load templates');
      setTemplateItems([]);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // Function to filter templates based on search query
  const filterTemplates = async (query: string) => {
    try {
      if (!query.trim()) {
        // For empty query, show all templates (limited to 5 for dropdown)
        const allTemplates = await templateService.getAllTemplates();
        const allTemplateDropdownItems: DropdownItem[] = allTemplates.map(template => ({
          id: template.id,
          title: template.title,
          description: template.description,
          category: template.category,
          icon: 'message-square',
          metadata: { template }
        }));
        setTemplateItems(allTemplateDropdownItems.slice(0, 5));
        return;
      }

      // Use the template search engine for proper search across all templates
      const searchResults = await templateService.searchTemplates(query);
      const searchDropdownItems: DropdownItem[] = searchResults.map(result => ({
        id: result.template.id,
        title: result.template.title,
        description: result.template.description,
        category: result.template.category,
        icon: 'message-square',
        metadata: { template: result.template }
      }));
      
      setTemplateItems(searchDropdownItems);
    } catch (error) {
      console.error('Error filtering templates:', error);
      setTemplateError('Failed to search templates');
      setTemplateItems([]);
    }
  };



  // Custom item renderer for template dropdown items
  const templateItemRenderer = (item: DropdownItem, isSelected: boolean, isHighlighted: boolean) => {
    const template = item.metadata?.template as ConversationTemplate;
    
    return (
      <div className="dropdown-item-content">
        {item.icon && (
          <LucidIcon 
            name={item.icon} 
            size={16} 
            className="dropdown-item-icon"
          />
        )}
        <div className="dropdown-item-text">
          <div className="dropdown-item-title">{item.title}</div>
          {item.description && (
            <div className="dropdown-item-description">{item.description}</div>
          )}
          <TemplateSettingsPreview settings={template?.settings} />
        </div>
        {item.category && (
          <div className="dropdown-item-category">{item.category}</div>
        )}
      </div>
    );
  };

  // Function to handle template selection
  const handleTemplateSelect = async (template: ConversationTemplate) => {
    try {
      setTemplateError(null);
      
      // Validate template structure
      if (!template || typeof template !== 'object') {
        throw new Error('Invalid template object');
      }
      
      if (!template.content || typeof template.content !== 'string') {
        throw new Error('Template content is missing or invalid');
      }
      
      console.log('Processing template:', {
        id: template.id,
        title: template.title,
        contentLength: template.content.length,
        variables: template.variables
      });
      
      // Check if template has variables that need user input
      if (template.variables && template.variables.length > 0) {
        // Show variable input modal
        setSelectedTemplate(template);
        setShowVariableModal(true);
        setShowTemplateDropdown(false);
        setSlashTemplateQuery('');
        setSelectedTemplateIndex(0);
      } else {
        // No variables, insert template directly
        insertTemplateWithVariables(template, {});
      }
    } catch (error) {
      console.error('Error handling template selection:', error);
      console.error('Template object:', template);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        templateId: template?.id,
        templateTitle: template?.title
      });
      setTemplateError('Failed to insert template. Please try again.');
    }
  };

  // Function to insert template with variable values
  const insertTemplateWithVariables = (template: ConversationTemplate, variables: Record<string, any>) => {
    try {
      // Replace the /query with the processed template content
      const slashIndex = input.lastIndexOf('/');
      const beforeSlash = input.slice(0, slashIndex);
      const afterQuery = input.slice(slashIndex + 1 + slashTemplateQuery.length);
      
      // Process template content with provided variable values
      let processedContent = template.content;
      if (template.variables) {
        template.variables.forEach(variable => {
          const placeholder = `{{${variable.name}}}`;
          const value = variables[variable.name] !== undefined ? String(variables[variable.name]) : '';
          const replacement = value || `[${variable.description || variable.name}]`;
          processedContent = processedContent.replace(new RegExp(placeholder, 'g'), replacement);
        });
      }
      
      const newInput = beforeSlash + processedContent + afterQuery;
      setInput(newInput);
      
      // Focus the textarea after template insertion
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          // Position cursor after the inserted template
          const cursorPosition = beforeSlash.length + processedContent.length;
          textareaRef.current.setSelectionRange(cursorPosition, cursorPosition);
        }
      }, 0);
      
      // Track template usage (optional)
      console.log(`Template used: ${template.title} (${template.id})`);
    } catch (error) {
      console.error('Error inserting template with variables:', error);
      setTemplateError('Failed to insert template. Please try again.');
    }
  };

  // Function to handle variable input confirmation
  const handleVariableInputConfirm = (variables: Record<string, any>, settings: TemplateSettings) => {
    if (selectedTemplate) {
      // Apply settings to chat state
      if (settings.thinkingEnabled !== undefined) {
        setThinkingEnabled(settings.thinkingEnabled);
      }
      
      if (settings.webSearchEnabled !== undefined) {
        setWebSearchEnabled(settings.webSearchEnabled);
      }
      
      if (settings.modelId !== undefined) {
        const newModel = MODEL_CONFIGS.find(m => m.id === settings.modelId);
        if (newModel) {
          setSelectedModel(newModel);
        }
      }
      
      insertTemplateWithVariables(selectedTemplate, variables);
    }
    setShowVariableModal(false);
    setSelectedTemplate(null);
  };

  // Function to handle variable input cancellation
  const handleVariableInputCancel = () => {
    setShowVariableModal(false);
    setSelectedTemplate(null);
  };





  // Function to get current active file and add it to context
  const getCurrentFileContext = async () => {
    // Don't auto-add if user has manually removed the current file
    if (hasUserRemovedCurrentFile) {
      return;
    }
    
    try {
      const activeFile = app.workspace.getActiveFile();
      if (activeFile) {
        const content = await app.vault.read(activeFile);
        const currentFile = {
          name: activeFile.name,
          content: content,
          path: activeFile.path,
          isCurrentFile: true
        };
        
        // Remove any existing current file and add the new one
        setSelectedFiles(prev => [
          currentFile,
          ...prev.filter(f => !f.isCurrentFile)
        ]);
      } else {
        // Remove current file if no active file
        setSelectedFiles(prev => prev.filter(f => !f.isCurrentFile));
      }
    } catch (error) {
      console.error('Error getting current file context:', error);
      setSelectedFiles(prev => prev.filter(f => !f.isCurrentFile));
    }
  };

  // Function to get all vault files
  const getAllVaultFiles = async () => {
    try {
      const files = app.vault.getMarkdownFiles();
      const fileList = files.map((file: any) => ({
        name: file.name,
        path: file.path
      }));
      setAvailableFiles(fileList);
    } catch (error) {
      console.error('Error getting vault files:', error);
      setAvailableFiles([]);
    }
  };

  // Function to add a file to selected context
  const addFileToContext = async (filePath: string) => {
    try {
      const file = app.vault.getAbstractFileByPath(filePath);
      if (file && 'path' in file && file.path.endsWith('.md')) {
        const content = await app.vault.read(file as any);
        
        // Check if this is the current active file being added back
        const activeFile = app.workspace.getActiveFile();
        const isCurrentFile = activeFile && activeFile.path === filePath;
        
        const newFile = {
          name: (file as any).name,
          content: content,
          path: (file as any).path,
          isCurrentFile: isCurrentFile
        };
        
        if (isCurrentFile) {
          // Reset the flag since user is manually adding current file back
          setHasUserRemovedCurrentFile(false);
        }
        
        // Check if file is already selected
        if (!selectedFiles.some(f => f.path === filePath)) {
          setSelectedFiles(prev => [...prev, newFile]);
        }
      }
    } catch (error) {
      console.error('Error adding file to context:', error);
    }
  };

  // Function to remove file from context
  const removeFileFromContext = (filePath: string) => {
    setSelectedFiles(prev => {
      const fileToRemove = prev.find(f => f.path === filePath);
      // If removing the current file, remember that user manually removed it
      if (fileToRemove?.isCurrentFile) {
        setHasUserRemovedCurrentFile(true);
      }
      return prev.filter(f => f.path !== filePath);
    });
  };

  // File upload handlers
  const handleFileUpload = async (files: File[]) => {
    // Validate files
    const validation = fileUploadService.validateFiles(files);
    if (!validation.isValid) {
      console.error('File validation failed:', validation.error);
      return;
    }

    // Process each file
    for (const file of files) {
      try {
        // Add file with uploading status
        const uploadingFile: UploadedFile = {
          id: `temp_${Date.now()}_${Math.random()}`,
          name: file.name,
          size: file.size,
          type: file.name.split('.').pop()?.toLowerCase() || 'unknown',
          mimeType: file.type || 'application/octet-stream',
          status: 'uploading'
        };
        
        setUploadedFiles(prev => [...prev, uploadingFile]);

        // Encode file
        const encodedFile = await fileUploadService.encodeFile(file);
        
        // Update file with encoded data
        const readyFile: UploadedFile = {
          ...uploadingFile,
          ...encodedFile,
          status: 'ready'
        };
        
        setUploadedFiles(prev => 
          prev.map(f => f.id === uploadingFile.id ? readyFile : f)
        );
      } catch (error) {
        console.error('Error processing file:', error);
        
        // Update file with error status
        setUploadedFiles(prev => 
          prev.map(f => 
            f.name === file.name && f.status === 'uploading' 
              ? { ...f, status: 'error', error: 'Failed to process file' }
              : f
          )
        );
      }
    }
  };

  const handleFileRemove = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };



  // History-related functions
  const saveCurrentConversation = async () => {
    if (messages.length === 0) return;
    
    try {
      let conversation: Conversation;
      
      if (currentConversation) {
        // Update existing conversation
        conversation = conversationService.updateConversation(currentConversation, messages);
      } else {
        // Create new conversation
        conversation = conversationService.createConversationFromMessages(messages);
        setCurrentConversation(conversation);
      }
      
      await conversationService.saveConversation(conversation);
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  };

  const loadConversation = (conversation: Conversation) => {
    loadMessages(conversation.messages);
    setCurrentConversation(conversation);
    setActiveView('chat'); // Switch to chat view after loading conversation
    // Reset scroll state when loading conversation
    setUserHasScrolledUp(false);
  };

  // Auto-save conversation when messages change
  useEffect(() => {
    if (autoSaveEnabled && messages.length > 0 && !isStreaming) {
      const timeoutId = setTimeout(() => {
        saveCurrentConversation();
      }, 2000); // Save after 2 seconds of inactivity
      
      return () => clearTimeout(timeoutId);
    }
  }, [messages, autoSaveEnabled, isStreaming]);

  // Handle editing a user message
  const handleEditMessage = (messageId: string, currentContent: string) => {
    // Remove file context from the content if it exists
    const cleanContent = currentContent.replace(/\n\n\*📎 Context: .*\*$/, '');
    setInput(cleanContent);
    
    // Store the message ID for editing - we'll remove messages only when sending
    setEditingMessageId(messageId);
    
    // Focus the textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  // Handle canceling edit mode
  const handleCancelEdit = () => {
    setInput('');
    setEditingMessageId(null);
  };

  // Handle input change for @ mentions
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    
    // Auto-resize the textarea
    autoResizeTextarea();
    
    // Don't show dropdown if we just selected a file
    if (justSelectedFileRef.current) {
      return;
    }
    
    // Check for @ mention (files)
    const atIndex = value.lastIndexOf('@');
    if (atIndex !== -1) {
      const query = value.slice(atIndex + 1);
      const beforeAt = value.slice(0, atIndex);
      
      // Only show dropdown if @ is at start or after space AND query doesn't end with .md
      const isComplete = query.endsWith('.md') || query.includes(' ');
      const shouldShow = (atIndex === 0 || beforeAt.endsWith(' ')) && !isComplete;
      
      if (shouldShow) {
        setAtMentionQuery(query);
        // Fetch fresh file list every time @ dropdown is shown
        getAllVaultFiles();
        setShowFileDropdown(true);
        setShowTemplateDropdown(false); // Hide template dropdown
        setSelectedFileIndex(0); // Reset selection when dropdown opens
      } else {
        setShowFileDropdown(false);
      }
    } else {
      setShowFileDropdown(false);
    }
    
    // Check for / mention (templates)
    const slashIndex = value.lastIndexOf('/');
    if (slashIndex !== -1) {
      const query = value.slice(slashIndex + 1);
      const beforeSlash = value.slice(0, slashIndex);
      
      // Only show dropdown if / is at start or after space AND query doesn't include space
      const isComplete = query.includes(' ');
      const shouldShow = (slashIndex === 0 || beforeSlash.endsWith(' ')) && !isComplete;
      
      if (shouldShow) {
        setSlashTemplateQuery(query);
        // Filter templates based on query
        filterTemplates(query).catch(error => {
          console.error('Error filtering templates:', error);
        });
        setShowTemplateDropdown(true);
        setShowFileDropdown(false); // Hide file dropdown
        setSelectedTemplateIndex(0); // Reset selection when dropdown opens
      } else {
        setShowTemplateDropdown(false);
      }
    } else {
      setShowTemplateDropdown(false);
    }
  };

  // Handle file selection from dropdown
  const handleFileSelect = async (file: {name: string, path: string}) => {
    justSelectedFileRef.current = true;
    await addFileToContext(file.path);
    
    // Replace the @query with the file name
    const atIndex = input.lastIndexOf('@');
    const beforeAt = input.slice(0, atIndex);
    const afterQuery = input.slice(atIndex + 1 + atMentionQuery.length);
    setInput(beforeAt + file.name + afterQuery);
    setShowFileDropdown(false);
    
    // Clear the flag after a brief delay to allow for input processing
    setTimeout(() => {
      justSelectedFileRef.current = false;
    }, 100);
  };

  // Filter files based on query
  const filteredFiles = availableFiles.filter(file =>
    file.name.toLowerCase().includes(atMentionQuery.toLowerCase()) ||
    file.path.toLowerCase().includes(atMentionQuery.toLowerCase())
  );

  // Listen for active file changes
  useEffect(() => {
    const handleActiveLeafChange = () => {
      getCurrentFileContext();
    };

    app.workspace.on('active-leaf-change', handleActiveLeafChange);
    // Get initial context
    getCurrentFileContext();

    return () => {
      app.workspace.off('active-leaf-change', handleActiveLeafChange);
    };
  }, [app]);

  // Auto-resize textarea on mount and when input changes
  useEffect(() => {
    autoResizeTextarea();
  }, [input]);

  const continueAIResponse = async (existingConversationHistory?: ConversationMessage[], processedMessageCount?: number) => {
    if (isStreaming) return;
    
    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    
    const currentMessages = currentMessagesRef.current;
    const conversationHistory = existingConversationHistory || [];
    const processedCount = processedMessageCount || 0;
    
    // Add system message if not already present
    if (!conversationHistory.some(msg => msg.role === 'system')) {
      conversationHistory.unshift({
        role: 'system',
        parts: [{ text: createSystemPrompt(selectedPersona || undefined) }]
      });
    }
    
         // Add unprocessed messages to conversation history
     const messagesToProcess = currentMessages.slice(processedCount);
     for (const msg of messagesToProcess) {
       if (msg.role === 'tool-call' || msg.role === 'tool-result') {
         // Skip tool messages - they are handled separately
         continue;
       } else if ((msg as any).role === 'thinking') {
         // Skip thinking messages - they are display only
         continue;
       } else if (msg.role === 'user') {
         conversationHistory.push({
           role: 'user',
           parts: [{ text: msg.content }]
         });
       } else if (msg.role === 'ai') {
         conversationHistory.push({
           role: 'model',
           parts: [{ text: msg.message }]
         });
       }
     }
    
    
    
    let streamingMessageId: string | null = null;
    let lastStreamingMessage = '';
    let streamingThinkingId: string | null = null;
    let lastStreamingThought = '';
    let currentSearchQuery: string | null = null;
    let currentSearchResults: any[] = [];

    try {
      await streamAIResponse(
        '', // Empty prompt since we're using conversation history
        (tokenOrChunk: any) => {
        if (typeof tokenOrChunk === 'string') {
          if (streamingMessageId) {
            lastStreamingMessage += tokenOrChunk;
            updateMessage(streamingMessageId, { message: lastStreamingMessage });
          } else {
            streamingMessageId = Date.now().toString(36) + Math.random().toString(36).substr(2);
            lastStreamingMessage = tokenOrChunk;
            addMessage({
              id: streamingMessageId,
              role: 'ai',
              message: lastStreamingMessage,
              thought: '',
              streaming: true,
              timestamp: formatTimestamp()
            });
          }
        } else if (tokenOrChunk && typeof tokenOrChunk === 'object' && Array.isArray(tokenOrChunk.candidates)) {
          const parts = tokenOrChunk.candidates[0]?.content?.parts || [];
          for (const part of parts) {
            if (part.thought === true && part.text) {
              if (streamingThinkingId) {
                lastStreamingThought += part.text;
                updateMessage(streamingThinkingId, { thought: lastStreamingThought });
              } else {
                streamingThinkingId = Date.now().toString(36) + Math.random().toString(36).substr(2);
                lastStreamingThought = part.text;
                addMessage({
                  id: streamingThinkingId,
                  role: 'ai',
                  message: '',
                  thought: lastStreamingThought,
                  streaming: true,
                  timestamp: formatTimestamp()
                });
              }
            } else if (part.text) {
              if (streamingMessageId) {
                lastStreamingMessage += part.text;
                updateMessage(streamingMessageId, { message: lastStreamingMessage });
              } else {
                streamingMessageId = Date.now().toString(36) + Math.random().toString(36).substr(2);
                lastStreamingMessage = part.text;
                addMessage({
                  id: streamingMessageId,
                  role: 'ai',
                  message: lastStreamingMessage,
                  thought: '',
                  streaming: true,
                  timestamp: formatTimestamp()
                });
              }
            }
          }
        }
      },
      selectedModel.id,
      (toolName: string, toolArgs: any) => {
        // Finalize the current streaming AI message before tool call
        if (streamingMessageId) {
          updateMessage(streamingMessageId, { streaming: false });
          streamingMessageId = null;
          lastStreamingMessage = '';
        }
        if (streamingThinkingId) {
          updateMessage(streamingThinkingId, { streaming: false });
          streamingThinkingId = null;
          lastStreamingThought = '';
        }
        addToolCall(toolName, toolArgs);
      },
      (toolName: string, result: any) => {
        addToolResult(toolName, result);
      },
      (toolResults: string) => {
        // Mark streaming as complete for the last message
        if (streamingMessageId) {
          updateMessage(streamingMessageId, {
            streaming: false
          });
          streamingMessageId = null;
          lastStreamingMessage = '';
        }
        if (streamingThinkingId) {
          updateMessage(streamingThinkingId, { streaming: false });
          streamingThinkingId = null;
          lastStreamingThought = '';
        }
      },
      conversationHistory,
      getThinkingBudget(),
      (thoughts: string) => {
        // Only add non-generic thinking messages as new messages
        if (!/^🧠 The model used \d+ thinking tokens/.test(thoughts)) {
          if (streamingThinkingId) {
            lastStreamingThought += thoughts;
            updateMessage(streamingThinkingId, { thought: lastStreamingThought });
          } else {
            streamingThinkingId = Date.now().toString(36) + Math.random().toString(36).substr(2);
            lastStreamingThought = thoughts;
            addMessage({
              id: streamingThinkingId,
              role: 'ai',
              message: '',
              thought: lastStreamingThought,
              streaming: true,
              timestamp: formatTimestamp()
            });
          }
        }
      },
      handleToolConfirmation,
      webSearchEnabled,
      abortControllerRef.current, // Pass the AbortController
      (searchQuery: string, searchResults: any[]) => {
        // Store search results for the current message
        currentSearchQuery = searchQuery;
        currentSearchResults = searchResults;
        
        // Update the current streaming message with search results
        if (streamingMessageId) {
          updateMessage(streamingMessageId, {
            searchQuery: currentSearchQuery,
            searchResults: currentSearchResults
          });
        }
      }
    );
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('[ChatPanel] Streaming was cancelled');
      // Mark any streaming messages as cancelled
      if (streamingMessageId) {
        updateMessage(streamingMessageId, { 
          streaming: false,
          message: lastStreamingMessage + '\n\n*[Response cancelled by user]*'
        });
      }
      if (streamingThinkingId) {
        updateMessage(streamingThinkingId, { streaming: false });
      }
    } else {
      console.error('[ChatPanel] Error in streaming:', error);
    }
  } finally {
    setIsStreaming(false);
    abortControllerRef.current = null;
  }
  };

  const formatTimestamp = () => {
    const now = new Date();
    return now.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      month: 'short',
      day: 'numeric'
    });
  };

  const sendMessage = async (messageText?: string, hideMessage?: boolean) => {
    // Hide persona selector on first message
    if (isPersonaSelectorVisible) {
      handleFirstMessage();
    }
    
    const textToSend = messageText || input.trim();
    
    if (!textToSend && !hideMessage) return;
    
    if (isStreaming) return;
    
    const timestamp = formatTimestamp();
    
    if (editingMessageId) {
      // Update the original user message
      updateMessage(editingMessageId, { content: textToSend, timestamp });
      // Remove all messages after the edited message
      removeMessagesAfter(editingMessageId);
      setEditingMessageId(null); // Clear editing state
      setInput(''); // Clear input after editing
    }

    // Build conversation history
    const conversationHistory: ConversationMessage[] = [];
    const systemMessage = createSystemPrompt(selectedPersona || undefined);
    conversationHistory.push({
      role: 'system',
      parts: [{ text: systemMessage }]
    });
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (msg.role === 'tool-call' || msg.role === 'tool-result') continue;
      if ((msg as any).role === 'thinking') continue;
      if ((msg as any).role === 'tool-confirmation') continue;
      if (msg.role === 'user') {
        // If editing, use the new content for the edited message
        let content = msg.content;
        if (editingMessageId && msg.id === editingMessageId) {
          content = textToSend;
        }
        conversationHistory.push({
          role: 'user',
          parts: [{ text: content }]
        });
        // If editing, stop after the edited message
        if (editingMessageId && msg.id === editingMessageId) break;
      } else if (msg.role === 'ai') {
        conversationHistory.push({
          role: 'model',
          parts: [{ text: msg.message }]
        });
      }
    }
    // If not editing, add the new user message to the conversation history
    if (!editingMessageId && !hideMessage) {
      let aiMessage = textToSend;
      if (selectedFiles.length > 0) {
        const fileContext = selectedFiles.map(file => `## ${file.name}\n\n${file.content}`).join('\n\n');
        aiMessage = `${fileContext}\n\n---\n\n${textToSend}`;
      }
      
      // Build message parts including uploaded files
      const messageParts: any[] = [];
      
      // Add text content if present
      if (aiMessage.trim()) {
        messageParts.push({ text: aiMessage });
      }
      
      // Add uploaded files as inlineData
      const readyFiles = uploadedFiles.filter(f => f.status === 'ready');
      for (const file of readyFiles) {
        if (file.encodedData) {
          messageParts.push({
            inlineData: {
              mimeType: file.mimeType,
              data: file.encodedData
            }
          });
        }
      }
      
      conversationHistory.push({
        role: 'user',
        parts: messageParts
      });
      
      // Add to chat UI (display version without file content)
      addMessage({
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        role: 'user',
        content: textToSend,
        files: uploadedFiles.filter(f => f.status === 'ready' && f.preview),
        timestamp
      });
      setInput(''); // Clear input immediately after sending
      
      // Clear uploaded files after sending
      setUploadedFiles([]);
    }

    setIsStreaming(true);
    try {
      await continueAIResponse(conversationHistory, conversationHistory.length);
      // Save conversation after AI response completes
      if (autoSaveEnabled) {
        setTimeout(() => saveCurrentConversation(), 1000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsStreaming(false);
      // Always clear input after sending, regardless of editing state
      setInput('');
    }
  };

  // Smart auto-scrolling: only scroll to bottom if streaming or user is at bottom
  useEffect(() => {
    // Only auto-scroll if:
    // 1. We're streaming (new content is being added)
    // 2. OR user hasn't scrolled up (they're at the bottom)
    if (isStreaming || !userHasScrolledUp) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isStreaming, userHasScrolledUp]);

  // Add keyboard shortcuts for text selection and copying
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + C to copy selected text
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) {
          // The browser will handle the copy automatically
          // We just need to ensure our text is selectable
          return;
        }
      }
      
      // Ctrl/Cmd + A to select all text in the current message
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.classList.contains('ai-message-content')) {
          e.preventDefault();
          const range = document.createRange();
          range.selectNodeContents(activeElement);
          const selection = window.getSelection();
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // MCP Server Manager props (get from plugin context)
  const plugin = (window as any).tangentPluginInstance; // You may need to set this in main.tsx for access
  const mcpServerManager = plugin?.mcpServerManager;
  
  // Get fresh data from server manager
  const getMCPServerStatuses = () => mcpServerManager?.getAllServerStatuses() || [];
  
  const handleNewChat = () => {
    // Cancel any ongoing streaming
    if (isStreaming) {
      cancelStreaming();
    }
    
    clearMessages();
    setCurrentConversation(null);
    setInput('');
    setSelectedFiles([]);
    setUploadedFiles([]);
    setEditingMessageId(null);
    setShowFileDropdown(false);
    setShowTemplateDropdown(false);
    setAtMentionQuery('');
    setSlashTemplateQuery('');
    setSelectedFileIndex(0);
    setSelectedTemplateIndex(0);
    setActiveView('chat');
    // Reset scroll state for new chat
    setUserHasScrolledUp(false);
    // Reset persona state for new chat
    setSelectedPersona(null);
    setIsPersonaSelectorVisible(true);
  };

  return (
    <div className={`tangent-chat-panel-root tangent-chat-panel-main ${selectedPersona ? 'with-persona' : ''}`}>
      {/* Top Bar with Icon Buttons */}
      <div className="tangent-chat-panel-top-bar">
        <div className="tangent-chat-panel-title">TANGENT</div>
        <div className="tangent-chat-panel-actions">
          <IconButton
            icon={<LucidIcon name="history" size={18} />}
            ariaLabel="History"
            title="History"
            onClick={() => setActiveView('history')}
          />
          <IconButton
            icon={<LucidIcon name="refresh-cw" size={18} />}
            ariaLabel="Refresh"
            title="Refresh"
            onClick={handleNewChat}
          />
          <IconButton
            icon={<LucidIcon name="server" size={18} />}
            ariaLabel="Servers"
            title="Servers"
            onClick={() => setActiveView('servers')}
          />
        </div>
      </div>

      {/* Main Content */}
      {activeView === 'chat' && (
        <>
          {/* Messages */}
          <div className="tangent-chat-panel-messages" ref={messagesContainerRef}>
            {/* Persona Badge */}
            {selectedPersona && messages.length > 0 && (
              <PersonaBadge 
                persona={selectedPersona} 
              />
            )}

            {/* Persona Selector - integrated into messages flow */}
            {isPersonaSelectorVisible && messages.length === 0 && (
              <PersonaSelector
                personas={personas}
                selectedPersona={selectedPersona}
                onPersonaSelect={handlePersonaSelect}
                onPersonaClear={handlePersonaClear}
              />
            )}

        {messages.map((msg, idx) => {
          if (msg.role === 'tool-call') {
            return (
              <CollapsibleToolCall key={idx} toolName={msg.toolName} toolArgs={msg.toolArgs} />
            );
          } else if (msg.role === 'tool-result') {
            return (
              <CollapsibleToolResult key={idx} toolName={msg.toolName} result={msg.result} />
            );
          } else if ((msg as any).role === 'tool-confirmation') {
            const confirmationMsg = msg as any;
            const resolver = (window as any)[`confirmationResolver_${confirmationMsg.pendingTool.id}`];
            
            return (
              <ToolConfirmationCard
                key={idx}
                pendingTool={confirmationMsg.pendingTool}
                approved={confirmationMsg.approved}
                onApprove={() => {
                  if (resolver) {
                    resolver(true);
                    delete (window as any)[`confirmationResolver_${confirmationMsg.pendingTool.id}`];
                  }
                }}
                onDeny={() => {
                  if (resolver) {
                    resolver(false);
                    delete (window as any)[`confirmationResolver_${confirmationMsg.pendingTool.id}`];
                  }
                }}
              />
            );
          }
          
          const isUser = msg.role === 'user';
          const isAI = msg.role === 'ai';
          
          return (
            <ChatMessageContainer
              key={msg.id || idx}
              isUser={isUser}
            >
              {isUser ? (
                <UserMessage
                  content={msg.content}
                  files={msg.files}
                  onEdit={() => handleEditMessage(msg.id, msg.content)}
                  showEdit={true}
                />
              ) : isAI ? (
                <AIMessage 
                  thought={msg.thought} 
                  message={msg.message} 
                  searchQuery={msg.searchQuery}
                  searchResults={msg.searchResults}
                />
              ) : null}
            </ChatMessageContainer>
          );
        })}
        <div ref={messagesEndRef} />
      </div>



      {/* Input Area */}
      <div className="tangent-chat-panel-input-area">
        <ChatInputContainer
          selectedFiles={selectedFiles}
          input={input}
          textareaRef={textareaRef}
          editingMessageId={editingMessageId}
          isStreaming={isStreaming}
          handleInputChange={handleInputChange}
          handleFileSelect={handleFileSelect}
          handleCancelEdit={handleCancelEdit}
          sendMessage={sendMessage}
          showFileDropdown={showFileDropdown}
          filteredFiles={filteredFiles}
          selectedFileIndex={selectedFileIndex}
          setSelectedFileIndex={setSelectedFileIndex}
          removeFileFromContext={removeFileFromContext}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          thinkingEnabled={thinkingEnabled}
          setThinkingEnabled={setThinkingEnabled}
          setShowFileDropdown={setShowFileDropdown}
          uploadedFiles={uploadedFiles}
          onFileUpload={handleFileUpload}
          onFileRemove={handleFileRemove}
          // Template props
          showTemplateDropdown={showTemplateDropdown}
          setShowTemplateDropdown={setShowTemplateDropdown}
          templateItems={templateItems}
          selectedTemplateIndex={selectedTemplateIndex}
          setSelectedTemplateIndex={setSelectedTemplateIndex}
          handleTemplateSelect={handleTemplateSelect}
          isLoadingTemplates={isLoadingTemplates}
          templateError={templateError}
          templateItemRenderer={templateItemRenderer}
          // Web search props
          webSearchEnabled={webSearchEnabled}
          setWebSearchEnabled={setWebSearchEnabled}
          // Cancellation prop
          onCancelStreaming={cancelStreaming}
        />
      </div>
        </>
      )}
      
      {/* Variable Input Modal */}
      <VariableInputModal
        isVisible={showVariableModal}
        template={selectedTemplate}
        onConfirm={handleVariableInputConfirm}
        onCancel={handleVariableInputCancel}
      />
      
      {activeView === 'history' && (
        <HistoryTab
          conversationService={conversationService}
          onLoadConversation={loadConversation}
          onClose={() => setActiveView('chat')}
        />
      )}
      {activeView === 'servers' && (
        <div className="tangent-servers-view">
          <h3>MCP Servers</h3>
          <p>Server management has been simplified. Use the settings to configure MCP servers.</p>
          <p>Current server statuses:</p>
          <ul>
            {getMCPServerStatuses().map((status: any) => (
              <li key={status.name}>
                {status.name}: {status.status}
                {status.lastError && <span className="tangent-server-error"> - {status.lastError}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default function ChatPanelWithProvider(props: ChatPanelProps) {
  return (
    <ChatMessagesProvider>
      <ChatPanel {...props} />
    </ChatMessagesProvider>
  );
} 
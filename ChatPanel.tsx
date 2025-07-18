import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { MODEL_CONFIGS, ModelConfig } from './modelConfigs';
import { useChatMessages, ChatMessagesProvider } from './ChatMessagesContext';
import { ConversationMessage } from './ai';
import { systemPrompt } from './systemPrompt';
import { PendingToolCall, ToolConfirmationResult } from './tools';
import { ConversationService, Conversation } from './conversationService';
import HistoryTab from './HistoryTab';
import IconButton from './src/components/IconButton';
import ChatMessageContainer from './src/components/ChatMessageContainer';
import LucidIcon from './src/components/LucidIcon';
import AIMessage from './src/components/AIMessage';
import ChatInputContainer from './src/components/ChatInputContainer';
import UserMessage from './src/components/UserMessage';

export interface ChatPanelProps {
  geminiApiKey: string;
  streamAIResponse: (prompt: string, onToken: (token: string) => void, modelId: string, onToolCall: (toolName: string, toolArgs: any) => void, onToolResult: (toolName: string, result: any) => void, onToolsComplete: (toolResults: string) => void, conversationHistory?: ConversationMessage[], thinkingBudget?: number, onThinking?: (thoughts: string) => void, onToolConfirmationNeeded?: (pendingTool: PendingToolCall) => Promise<ToolConfirmationResult>) => Promise<void>;
  app: any; // Obsidian App instance
  unifiedToolManager?: any; // UnifiedToolManager instance
}

// File list result renderer
const FileListResult: React.FC<{ files: { name: string; type: 'file' | 'folder'; path: string }[] }> = ({ files }) => (
  <ul style={{ paddingLeft: 20, margin: 0 }}>
    {files.map((file, i) => (
      <li key={i} style={{ listStyle: 'none', marginBottom: 2, display: 'flex', alignItems: 'center', gap: '6px' }}>
        <LucidIcon name={file.type === 'folder' ? 'folder' : 'file-text'} size={12} />
        <span style={{ fontWeight: file.type === 'folder' ? 600 : 400 }}>{file.name}</span>
        <span style={{ fontSize: '0.7em', color: 'var(--text-muted)', marginLeft: '8px' }}>({file.path})</span>
      </li>
    ))}
  </ul>
);

// Collapsible Tool Call
const CollapsibleToolCall: React.FC<{ toolName: string; toolArgs: any }> = ({ toolName, toolArgs }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="tangent-chat-tool-call">
      <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => setOpen(o => !o)}>
        <LucidIcon name={open ? 'chevron-down' : 'chevron-right'} size={12} />
        <LucidIcon name="wrench" size={12} />
        <b>Calling tool:</b> {toolName}
      </span>
      {open && toolArgs && (
        <pre style={{ margin: '4px 0 0 0', fontSize: '0.9em', color: '#888', background: 'none', border: 'none', padding: 0 }}>{JSON.stringify(toolArgs, null, 2)}</pre>
      )}
    </div>
  );
};

// Collapsible Tool Result
const CollapsibleToolResult: React.FC<{ toolName: string; result: any }> = ({ toolName, result }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="tangent-chat-tool-result">
      <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => setOpen(o => !o)}>
        <LucidIcon name={open ? 'chevron-down' : 'chevron-right'} size={12} />
        <LucidIcon name="check-circle" size={12} />
        <b>Tool result:</b> {toolName}
      </span>
      {open && (
        <div style={{ marginTop: 4 }}>
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
      <div style={{
        padding: '12px 16px',
        backgroundColor: approved ? 'var(--color-green-bg)' : 'var(--color-red-bg)',
        borderRadius: '8px',
        border: `1px solid ${approved ? 'var(--color-green)' : 'var(--color-red)'}`,
        margin: '8px 0'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
          {approved ? '✅ Tool Approved' : '❌ Tool Denied'}
        </div>
        <div style={{ fontSize: '13px', opacity: 0.8 }}>
          {pendingTool.name} {approved ? 'was executed' : 'was cancelled'}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '12px 16px',
      backgroundColor: 'var(--background-secondary)',
      borderRadius: '8px',
      border: '1px solid var(--color-orange)',
      margin: '8px 0'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '8px', color: 'var(--color-orange)' }}>
        🔧 Tool Confirmation Required
      </div>
      <div style={{ marginBottom: '8px' }}>
        <strong>Tool:</strong> {pendingTool.name}
      </div>
      <div style={{ marginBottom: '12px', fontSize: '12px', fontFamily: 'monospace', backgroundColor: 'var(--background-primary)', padding: '8px', borderRadius: '4px' }}>
        <strong>Arguments:</strong>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
          {JSON.stringify(pendingTool.args, null, 2)}
        </pre>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleApprove}
          disabled={isProcessing}
          style={{
            padding: '6px 12px',
            backgroundColor: 'var(--color-green)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            opacity: isProcessing ? 0.6 : 1
          }}
        >
          {isProcessing ? 'Processing...' : 'Approve'}
        </button>
        <button
          onClick={handleDeny}
          disabled={isProcessing}
          style={{
            padding: '6px 12px',
            backgroundColor: 'var(--color-red)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            opacity: isProcessing ? 0.6 : 1
          }}
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

  const [hasUserRemovedCurrentFile, setHasUserRemovedCurrentFile] = React.useState(false);
  const [editingMessageId, setEditingMessageId] = React.useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentMessagesRef = useRef(messages);
  const justSelectedFileRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  // State for which view is active
  const [activeView, setActiveView] = useState<'chat' | 'history' | 'servers'>('chat');

  // Update thinking enabled state when model changes
  useEffect(() => {
    if (selectedModel.defaultThinkingBudget !== undefined) {
      setThinkingEnabled(selectedModel.defaultThinkingBudget > 0);
    }
  }, [selectedModel]);

  // Calculate thinking budget based on enabled state
  const getThinkingBudget = () => {
    return thinkingEnabled ? (selectedModel.defaultThinkingBudget || 8192) : 0;
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
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  };

  // Update the ref whenever messages change
  useEffect(() => {
    currentMessagesRef.current = messages;
  }, [messages]);





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
    
    // Check for @ mention
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
        setSelectedFileIndex(0); // Reset selection when dropdown opens
      } else {
        setShowFileDropdown(false);
      }
    } else {
      setShowFileDropdown(false);
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
    
    const currentMessages = currentMessagesRef.current;
    const conversationHistory = existingConversationHistory || [];
    const processedCount = processedMessageCount || 0;
    
    // Add system message if not already present
    if (!conversationHistory.some(msg => msg.role === 'system')) {
      conversationHistory.unshift({
        role: 'system',
        parts: [{ text: systemPrompt }]
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
      handleToolConfirmation
    );
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
    }

    // Build conversation history
    const conversationHistory: ConversationMessage[] = [];
    const systemMessage = systemPrompt;
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
      conversationHistory.push({
        role: 'user',
        parts: [{ text: aiMessage }]
      });
      // Add to chat UI (display version without file content)
      addMessage({
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        role: 'user',
        content: textToSend,
        timestamp
      });
      setInput(''); // Clear input immediately after sending
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
      if (!editingMessageId) {
        setInput('');
      }
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    clearMessages();
    setCurrentConversation(null);
    setInput('');
    setSelectedFiles([]);
    setEditingMessageId(null);
    setShowFileDropdown(false);
    setAtMentionQuery('');
    setSelectedFileIndex(0);
    setActiveView('chat');
  };

  return (
    <div className="tangent-chat-panel-root" style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: 'var(--background-primary)'
    }}>
      {/* Top Bar with Icon Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: '1.2em', letterSpacing: 1 }}>TANGENT</div>
        <div style={{ display: 'flex', gap: 8 }}>
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
          <div style={{ 
            flex: 1, 
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
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
                  onEdit={() => handleEditMessage(msg.id, msg.content)}
                  showEdit={true}
                />
              ) : isAI ? (
                <AIMessage thought={msg.thought} message={msg.message} />
              ) : null}
            </ChatMessageContainer>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        padding: '0',
        borderTop: '1px solid var(--background-modifier-border)',
        backgroundColor: 'var(--background-primary)'
      }}>
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
        />
      </div>
        </>
      )}
      {activeView === 'history' && (
        <HistoryTab
          conversationService={conversationService}
          onLoadConversation={loadConversation}
          onClose={() => setActiveView('chat')}
        />
      )}
      {activeView === 'servers' && (
        <div style={{ padding: '16px' }}>
          <h3>MCP Servers</h3>
          <p>Server management has been simplified. Use the settings to configure MCP servers.</p>
          <p>Current server statuses:</p>
          <ul>
            {getMCPServerStatuses().map((status: any) => (
              <li key={status.name}>
                {status.name}: {status.status}
                {status.lastError && <span style={{ color: 'red' }}> - {status.lastError}</span>}
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
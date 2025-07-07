import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { MODEL_CONFIGS, ModelConfig } from './modelConfigs';
import { useChatMessages, ChatMessagesProvider } from './ChatMessagesContext';
import { ConversationMessage } from './ai';
import { SYSTEM_PROMPT } from './systemPrompt';
import { HumanMessage, AIMessage, ToolMessage, SystemMessage } from '@langchain/core/messages';
import { setIcon } from 'obsidian';

export interface ChatPanelProps {
  geminiApiKey: string;
  streamAIResponse: (prompt: string, onToken: (token: string) => void, modelId: string, onToolCall: (toolName: string, toolArgs: any) => void, onToolResult: (toolName: string, result: any) => void, onToolsComplete: (toolResults: string) => void, conversationHistory?: ConversationMessage[]) => Promise<void>;
  app: any; // Obsidian App instance
}

// Message type compatible with Langchain ChatMessage
type ChatMessage =
  | { role: 'user' | 'ai'; content: string; streaming?: boolean; timestamp?: string }
  | { role: 'tool-call'; toolName: string; toolArgs: any }
  | { role: 'tool-result'; toolName: string; result: any };

// Icon component for Lucid icons
const LucidIcon: React.FC<{ name: string; size?: number; className?: string }> = ({ name, size = 16, className = '' }) => {
  const iconRef = useRef<HTMLSpanElement>(null);
  
  useEffect(() => {
    if (iconRef.current) {
      setIcon(iconRef.current, name);
    }
  }, [name]);
  
  return (
    <span 
      ref={iconRef}
      className={className}
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        width: size, 
        height: size 
      }}
    />
  );
};

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

export const ChatPanel: React.FC<ChatPanelProps> = ({ geminiApiKey, streamAIResponse, app }) => {
  const { messages, addMessage, addToolCall, addToolResult, clearMessages } = useChatMessages();
  const [input, setInput] = React.useState('');
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [selectedModel, setSelectedModel] = React.useState<ModelConfig>(MODEL_CONFIGS[0]);
  const [selectedFiles, setSelectedFiles] = React.useState<{name: string, content: string, path: string, isCurrentFile?: boolean}[]>([]);
  const [showFileDropdown, setShowFileDropdown] = React.useState(false);
  const [availableFiles, setAvailableFiles] = React.useState<{name: string, path: string}[]>([]);
  const [atMentionQuery, setAtMentionQuery] = React.useState('');
  const [selectedFileIndex, setSelectedFileIndex] = React.useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentMessagesRef = useRef(messages);
  const justSelectedFileRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Type guard for SystemMessage
  const isSystemMessage = (msg: any) => msg instanceof SystemMessage || msg.role === 'system';

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
        const newFile = {
          name: (file as any).name,
          content: content,
          path: (file as any).path
        };
        
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
    setSelectedFiles(prev => prev.filter(f => f.path !== filePath));
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
    console.log('[AI DEBUG] Continuing AI response with current messages:', currentMessagesRef.current);
    
    let aiContent = '';
    
    // Use existing conversation history if provided, otherwise build from current messages
    let conversationHistory: ConversationMessage[] = [];
    
    if (existingConversationHistory) {
      conversationHistory = [...existingConversationHistory];
      
      // Add any new tool results that weren't in the original conversation history
      const startIndex = processedMessageCount || 0;
      const newMessages = currentMessagesRef.current.slice(startIndex);
      
      const newConvertedMessages = newMessages.map(msg => {
        if (msg.role === 'tool-call') {
          // Convert tool call to assistant message with tool_calls
          return new AIMessage({
            content: '',
            tool_calls: [{
              id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              type: 'tool_call' as const,
              name: (msg as any).toolName,
              args: (msg as any).toolArgs
            }]
          });
        } else if (msg.role === 'tool-result') {
          // Convert tool result to tool message
          let content = '';
          const result = (msg as any).result;
          if (result && typeof result === 'object') {
            if (result.type === 'file-list') {
              content = result.files.map((f: any) => `${f.type === 'folder' ? '📁' : '📄'} ${f.name} (${f.path})`).join('\n');
            } else if (result.type === 'text') {
              content = result.text;
            } else {
              content = JSON.stringify(result, null, 2);
            }
          } else {
            content = String(result);
          }
          return new ToolMessage({
            content: content,
            name: (msg as any).toolName,
            tool_call_id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          });
        }
        return null; // Skip user/ai messages as they're already in the conversation history
      }).filter(msg => msg !== null);
      
      conversationHistory.push(...newConvertedMessages);
    } else {
      // Build conversation history from current messages
      // Only add the system prompt if the first message is not already a SystemMessage
      if (
        currentMessagesRef.current.length === 0 ||
        !isSystemMessage(currentMessagesRef.current[0])
      ) {
        let systemPrompt = SYSTEM_PROMPT;
        
        // Add context files to the system prompt if any are selected
        if (selectedFiles.length > 0) {
          const contextMessage = selectedFiles.map(file => {
            const prefix = file.isCurrentFile ? 'CURRENT FILE' : 'CONTEXT FILE';
            return `${prefix}: ${file.name} (${file.path})\n\n${file.content}`;
          }).join('\n\n---\n\n');
          
          systemPrompt += `\n\nHere are the relevant files for context:\n\n${contextMessage}`;
        }
        
        conversationHistory.push(new SystemMessage(systemPrompt));
      }
      
      // Convert current messages to conversation history format
      const convertedMessages = currentMessagesRef.current.map(msg => {
        if (msg.role === 'user') {
          return new HumanMessage((msg as any).content);
        } else if (msg.role === 'ai') {
          return new AIMessage((msg as any).content);
        } else if (msg.role === 'tool-call') {
          // Convert tool call to assistant message with tool_calls
          return new AIMessage({
            content: '',
            tool_calls: [{
              id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              type: 'tool_call' as const,
              name: (msg as any).toolName,
              args: (msg as any).toolArgs
            }]
          });
               } else if (msg.role === 'tool-result') {
           // Convert tool result to tool message
           let content = '';
           const result = (msg as any).result;
           if (result && typeof result === 'object') {
             if (result.type === 'file-list') {
               content = result.files.map((f: any) => `${f.type === 'folder' ? '📁' : '📄'} ${f.name} (${f.path})`).join('\n');
             } else if (result.type === 'text') {
               content = result.text;
             } else {
             content = JSON.stringify(result, null, 2);
             }
           } else {
             content = String(result);
           }
           return new ToolMessage({
             content: content,
             name: (msg as any).toolName,
             tool_call_id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
           });
         }
        return new HumanMessage(''); // fallback
      });
      
      // Add converted messages to conversation history
      conversationHistory.push(...convertedMessages);
    }
    
    console.log('[AI DEBUG] Final conversation history being sent to AI:', conversationHistory);
    
    await streamAIResponse(
      '', // Empty prompt since we're continuing
      (token: string) => {
        aiContent += token;
        // Update the last AI message
        addMessage({ role: 'ai', content: aiContent, streaming: true });
      },
      selectedModel.id,
      (toolName: string, toolArgs: any) => {
        addToolCall(toolName, toolArgs);
      },
      (toolName: string, result: any) => {
        addToolResult(toolName, result);
      },
      (toolResults: string) => {
        // Tools completed - trigger AI to continue with tool results in context
        console.log('[AI DEBUG] Tool results completed:', toolResults);
        
        // Wait a brief moment for tool results to be added to state, then continue AI response
        setTimeout(() => {
          console.log('[AI DEBUG] Triggering AI continuation with tool results in context');
          // Continue the AI response with updated conversation history that includes tool results
          continueAIResponse(conversationHistory, 0);
        }, 100);
      },
      conversationHistory
    );
    setIsStreaming(false);
  };

  // Function to format timestamp
  const formatTimestamp = () => {
    const now = new Date();
    const month = now.toLocaleString('default', { month: 'short' });
    const day = String(now.getDate()).padStart(2, '0');
    const year = now.getFullYear();
    return `${month} ${day}, ${year}.md`;
  };

  const sendMessage = async (messageText?: string, hideMessage?: boolean) => {
    const inputText = messageText || input;
    if (!inputText.trim() || isStreaming) return;

    setIsStreaming(true);
    setInput('');

    const timestamp = formatTimestamp();
    
    let aiContent = '';
    
    // Build conversation history
    const conversationHistory: ConversationMessage[] = [];
    // Only add the system prompt if the first message is not already a SystemMessage
    if (
      messages.length === 0 ||
      !isSystemMessage(messages[0])
    ) {
      let systemPrompt = SYSTEM_PROMPT;
      
      // Add context files to the system prompt if any are selected
      if (selectedFiles.length > 0) {
        const contextMessage = selectedFiles.map(file => {
          const prefix = file.isCurrentFile ? 'CURRENT FILE' : 'CONTEXT FILE';
          return `${prefix}: ${file.name} (${file.path})\n\n${file.content}`;
        }).join('\n\n---\n\n');
        
        systemPrompt += `\n\nHere are the relevant files for context:\n\n${contextMessage}`;
      }
      
      conversationHistory.push(new SystemMessage(systemPrompt));
    }
    
    // Convert existing messages to conversation history format
    const convertedMessages = messages.map(msg => {
      if (msg.role === 'user') {
        return new HumanMessage((msg as any).content);
      } else if (msg.role === 'ai') {
        return new AIMessage((msg as any).content);
      } else if (msg.role === 'tool-call') {
        // Convert tool call to assistant message with tool_calls
        return new AIMessage({
          content: '',
          tool_calls: [{
            id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'tool_call' as const,
            name: (msg as any).toolName,
            args: (msg as any).toolArgs
          }]
        });
             } else if (msg.role === 'tool-result') {
         // Convert tool result to tool message
         let content = '';
         const result = (msg as any).result;
         if (result && typeof result === 'object') {
           if (result.type === 'file-list') {
             content = result.files.map((f: any) => `${f.type === 'folder' ? '📁' : '📄'} ${f.name} (${f.path})`).join('\n');
           } else if (result.type === 'text') {
             content = result.text;
           } else {
             content = JSON.stringify(result, null, 2);
           }
         } else {
           content = String(result);
         }
         return new ToolMessage({
           content: content,
           name: (msg as any).toolName,
           tool_call_id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
         });
       }
      return new HumanMessage(''); // fallback
    });
    
    // Add converted messages to conversation history
    conversationHistory.push(...convertedMessages);
    
    // Add the new user message as HumanMessage
    if (!hideMessage) {
      conversationHistory.push(new HumanMessage(inputText));
    }

    // Add user message to UI state
    if (!hideMessage) {
      addMessage({ role: 'user', content: inputText, timestamp });
    }
    
    console.log('[AI DEBUG] Final conversation history being sent to AI:', conversationHistory);
    
    await streamAIResponse(
      inputText,
      (token: string) => {
        aiContent += token;
        // Update the last AI message
        addMessage({ role: 'ai', content: aiContent, streaming: true });
      },
      selectedModel.id,
      (toolName: string, toolArgs: any) => {
        addToolCall(toolName, toolArgs);
      },
      (toolName: string, result: any) => {
        addToolResult(toolName, result);
      },
      (toolResults: string) => {
        // Tools completed - trigger AI to continue with tool results in context
        console.log('[AI DEBUG] Tool results completed:', toolResults);
        
        // Wait a brief moment for tool results to be added to state, then continue AI response
        setTimeout(() => {
          console.log('[AI DEBUG] Triggering AI continuation with tool results in context');
          // Continue the AI response with updated conversation history that includes tool results
          continueAIResponse(conversationHistory, messages.length + 1);
        }, 100);
      },
      conversationHistory
    );
    // Mark the last AI message as complete
    // (Optional) You can add a method to mark the last AI message as complete in the provider if needed
    setIsStreaming(false);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="tangent-chat-panel-root" style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: 'var(--background-primary)'
    }}>
      {/* Header */}
      <div style={{ 
        padding: '12px 16px', 
        borderBottom: '1px solid var(--background-modifier-border)',
        backgroundColor: 'var(--background-primary)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{ 
          margin: 0, 
          fontSize: '16px', 
          fontWeight: 700, 
          color: 'var(--text-normal)',
          letterSpacing: '0.5px'
        }}>
          TANGENT
        </h2>
                 <button
           onClick={() => {
             clearMessages();
             setSelectedFiles([]);
             setInput('');
           }}
           style={{
             background: 'none',
             border: 'none',
             color: 'var(--text-muted)',
             cursor: 'pointer',
             padding: '4px',
             display: 'flex',
             alignItems: 'center',
             borderRadius: '4px'
           }}
           title="New chat"
         >
           <LucidIcon name="refresh-cw" size={16} />
         </button>
      </div>
      
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
          }
          
          const isUser = (msg as any).role === 'user';
          const isAI = (msg as any).role === 'ai';
          
          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{
                backgroundColor: isUser ? 'var(--background-secondary)' : 'transparent',
                padding: isUser ? '12px 16px' : '0',
                borderRadius: isUser ? '8px' : '0',
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: isUser ? '80%' : '100%',
                border: isUser ? '1px solid var(--background-modifier-border)' : 'none'
              }}>
                <div style={{
                  color: 'var(--text-normal)',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  <ReactMarkdown>{(msg as any).content}</ReactMarkdown>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid var(--background-modifier-border)',
          backgroundColor: 'var(--background-primary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {selectedFiles.map((file, index) => (
            <div key={file.path} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              justifyContent: 'space-between'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--text-muted)',
                fontSize: '12px'
              }}>
                <LucidIcon name="file-text" size={14} />
                <span>{file.name}</span>
                {file.isCurrentFile && (
                  <span style={{ color: 'var(--text-faint)' }}>(Current file)</span>
                )}
              </div>
              <button
                onClick={() => removeFileFromContext(file.path)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  opacity: 0.8
                }}
                title="Remove file from context"
              >
                <LucidIcon name="x" size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

            {/* Input Area */}
      <div style={{
        padding: '0',
        borderTop: '1px solid var(--background-modifier-border)',
        backgroundColor: 'var(--background-primary)'
      }}>
        <div style={{ 
          position: 'relative',
          border: '1px solid var(--background-modifier-border)',
          borderRadius: '8px',
          backgroundColor: 'var(--background-secondary)',
          paddingBottom: '40px' // Space for controls at bottom
        }}>
          <textarea
            ref={textareaRef}
            value={input}
            placeholder="Type a message... (use @ to mention files)"
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
              }
            }}
            style={{
              width: '100%',
              minHeight: '44px',
              padding: '12px 8px',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--text-normal)',
              fontSize: '14px',
              outline: 'none',
              resize: 'none',
              overflowY: 'hidden'
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
            bottom: '8px',
            left: '8px',
            right: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pointerEvents: 'none' // Allow clicks to pass through to children
          }}>
            {/* Model Selection - Bottom Left */}
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
                pointerEvents: 'auto',
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
            
            {/* Send Button - Bottom Right */}
            <button
              onClick={() => sendMessage()}
              disabled={isStreaming}
              style={{
                width: '32px',
                height: '32px',
                backgroundColor: 'var(--interactive-accent)',
                color: 'var(--text-on-accent)',
                border: 'none',
                borderRadius: '6px',
                cursor: isStreaming ? 'not-allowed' : 'pointer',
                opacity: isStreaming ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'auto'
              }}
              title={isStreaming ? 'Sending...' : 'Send message'}
            >
              {isStreaming ? (
                <div style={{ 
                  width: '12px', 
                  height: '12px', 
                  border: '2px solid currentColor',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'tangent-spin 1s linear infinite'
                }} />
              ) : (
                <LucidIcon name="send" size={14} />
              )}
            </button>
          </div>
        </div>
      </div>
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
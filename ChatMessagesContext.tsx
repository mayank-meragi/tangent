import React, { createContext, useContext, useState, ReactNode } from 'react';
import { PendingToolCall } from './tools';
import { UploadedFile } from './FileUploadService';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export type ChatMessage =
  | { id: string; role: 'user'; content: string; files?: UploadedFile[]; contextFiles?: { name: string; path: string; isCurrentFile?: boolean }[]; timestamp?: string }
  | { id: string; role: 'ai'; message: string; thought: string; streaming?: boolean; timestamp?: string; searchQuery?: string; searchResults?: SearchResult[] }
  | { id: string; role: 'tool-call'; toolName: string; toolArgs: any }
  | { id: string; role: 'tool-result'; toolName: string; result: any }
  | { id: string; role: 'tool-confirmation'; pendingTool: PendingToolCall; approved?: boolean };

interface ChatMessagesContextType {
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  editUserMessage: (id: string, newContent: string) => void;
  removeMessagesAfter: (messageId: string) => void;
  addToolCall: (toolName: string, toolArgs: any) => void;
  addToolResult: (toolName: string, result: any) => void;
  clearMessages: () => void;
  loadMessages: (messages: ChatMessage[]) => void;
  pendingToolConfirmations: Map<string, PendingToolCall>;
  addPendingToolConfirmation: (pendingTool: PendingToolCall) => void;
  resolvePendingToolConfirmation: (toolCallId: string, approved: boolean) => void;
}

const ChatMessagesContext = createContext<ChatMessagesContextType | undefined>(undefined);

// Helper function to generate unique IDs
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const ChatMessagesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingToolConfirmations, setPendingToolConfirmations] = useState<Map<string, PendingToolCall>>(new Map());

  function isValidChatMessage(msg: any): msg is ChatMessage {
    if (msg.role === 'ai') return typeof msg.message === 'string' && typeof msg.thought === 'string';
    if (msg.role === 'user') return typeof msg.content === 'string';
    if (msg.role === 'tool-call') return typeof msg.toolName === 'string';
    if (msg.role === 'tool-result') return typeof msg.toolName === 'string';
    if (msg.role === 'tool-confirmation') return typeof msg.pendingTool !== 'undefined';
    return false;
  }

  function addMessageHelper(prev: ChatMessage[], msg: ChatMessage): ChatMessage[] {
    // Always append a new message for each turn, never merge
    let messageWithId: ChatMessage;
    if (msg.role === 'ai') {
      messageWithId = {
        id: msg.id || generateId(),
        role: 'ai',
        message: msg.message,
        thought: msg.thought,
        streaming: msg.streaming,
        timestamp: msg.timestamp,
        searchQuery: msg.searchQuery,
        searchResults: msg.searchResults
      };
    } else if (msg.role === 'user') {
      messageWithId = {
        id: msg.id || generateId(),
        role: 'user',
        content: msg.content,
        files: msg.files,
        contextFiles: (msg as any).contextFiles,
        timestamp: msg.timestamp
      };
    } else if (msg.role === 'tool-call') {
      messageWithId = {
        id: msg.id || generateId(),
        role: 'tool-call',
        toolName: msg.toolName,
        toolArgs: msg.toolArgs
      };
    } else if (msg.role === 'tool-result') {
      messageWithId = {
        id: msg.id || generateId(),
        role: 'tool-result',
        toolName: msg.toolName,
        result: msg.result
      };
    } else if (msg.role === 'tool-confirmation') {
      messageWithId = {
        id: msg.id || generateId(),
        role: 'tool-confirmation',
        pendingTool: msg.pendingTool,
        approved: msg.approved
      };
    } else {
      throw new Error('Unknown message type');
    }
    return [...prev, messageWithId].filter(isValidChatMessage) as ChatMessage[];
  }

  const addMessage = (msg: ChatMessage) =>
    setMessages((prev: any): ChatMessage[] => addMessageHelper(prev, msg));

  const updateMessage = (id: string, updates: Partial<ChatMessage>) =>
    setMessages((prev: any) =>
      prev.map((msg: any) => msg.id === id ? { ...msg, ...updates } : msg)
    );

  const editUserMessage = (id: string, newContent: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === id && msg.role === 'user'
          ? { ...msg, content: newContent, timestamp: new Date().toISOString() }
          : msg
      )
    );
  };

  const removeMessagesAfter = (messageId: string) => {
    setMessages(prev => {
      const messageIndex = prev.findIndex(msg => msg.id === messageId);
      if (messageIndex !== -1) {
        return prev.slice(0, messageIndex + 1);
      }
      return prev;
    });
  };

  const addToolCall = (toolName: string, toolArgs: any) =>
    setMessages(prev => [...prev, { id: generateId(), role: 'tool-call', toolName, toolArgs }]);

  const addToolResult = (toolName: string, result: any) =>
    setMessages(prev => [...prev, { id: generateId(), role: 'tool-result', toolName, result }]);

  const clearMessages = () => {
    setMessages([]);
    setPendingToolConfirmations(new Map());
  };

  const loadMessages = (messages: ChatMessage[]) => {
    setMessages([...messages]);
    setPendingToolConfirmations(new Map());
  };

  const addPendingToolConfirmation = (pendingTool: PendingToolCall) => {
    setPendingToolConfirmations(prev => new Map(prev.set(pendingTool.id, pendingTool)));
    // Add confirmation message to chat
    addMessage({
      id: generateId(),
      role: 'tool-confirmation',
      pendingTool
    } as any);
  };

  const resolvePendingToolConfirmation = (toolCallId: string, approved: boolean) => {
    setPendingToolConfirmations(prev => {
      const newMap = new Map(prev);
      newMap.delete(toolCallId);
      return newMap;
    });

    // Update the confirmation message in chat
    setMessages(prev => prev.map(msg =>
      msg.role === 'tool-confirmation' &&
        (msg as any).pendingTool.id === toolCallId
        ? { ...msg, approved } as any
        : msg
    ));
  };

  return (
    <ChatMessagesContext.Provider value={{
      messages,
      addMessage,
      updateMessage,
      editUserMessage,
      removeMessagesAfter,
      addToolCall,
      addToolResult,
      clearMessages,
      loadMessages,
      pendingToolConfirmations,
      addPendingToolConfirmation,
      resolvePendingToolConfirmation
    }}>
      {children}
    </ChatMessagesContext.Provider>
  );
};

export const useChatMessages = (): ChatMessagesContextType => {
  const context = useContext(ChatMessagesContext);
  if (!context) {
    throw new Error('useChatMessages must be used within a ChatMessagesProvider');
  }
  return context;
}; 
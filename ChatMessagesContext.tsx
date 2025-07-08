import React, { createContext, useContext, useState, ReactNode } from 'react';
import { PendingToolCall, ToolConfirmationResult } from './tools';

export type ChatMessage =
  | { id: string; role: 'user' | 'ai'; content: string; streaming?: boolean; timestamp?: string }
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

  const addMessage = (msg: ChatMessage) =>
    setMessages(prev => {
      const lastMsg = prev[prev.length - 1];
      if (
        msg.role === 'ai' && msg.streaming &&
        prev.length > 0 &&
        lastMsg.role === 'ai' &&
        typeof (lastMsg as any).content === 'string' &&
        (lastMsg as any).streaming
      ) {
        // Update the last streaming AI message instead of appending
        const updatedLastMsg: ChatMessage = {
          ...lastMsg,
          content: (lastMsg as any).content + msg.content
        };
        const newMessages: ChatMessage[] = [...prev.slice(0, -1), updatedLastMsg];
        return newMessages;
      }
      // Otherwise, add a new message with an ID if it doesn't have one
      const messageWithId = msg.id ? msg : { ...msg, id: generateId() };
      const newMessages: ChatMessage[] = [...prev, messageWithId];
      return newMessages;
    });

  const updateMessage = (id: string, updates: Partial<ChatMessage>) =>
    setMessages(prev => 
      prev.map(msg => msg.id === id ? { ...msg, ...updates } : msg)
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
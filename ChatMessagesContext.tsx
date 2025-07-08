import React, { createContext, useContext, useState, ReactNode } from 'react';
import { PendingToolCall, ToolConfirmationResult } from './tools';

export type ChatMessage =
  | { role: 'user' | 'ai'; content: string; streaming?: boolean; timestamp?: string }
  | { role: 'tool-call'; toolName: string; toolArgs: any }
  | { role: 'tool-result'; toolName: string; result: any }
  | { role: 'tool-confirmation'; pendingTool: PendingToolCall; approved?: boolean };

interface ChatMessagesContextType {
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  addToolCall: (toolName: string, toolArgs: any) => void;
  addToolResult: (toolName: string, result: any) => void;
  clearMessages: () => void;
  pendingToolConfirmations: Map<string, PendingToolCall>;
  addPendingToolConfirmation: (pendingTool: PendingToolCall) => void;
  resolvePendingToolConfirmation: (toolCallId: string, approved: boolean) => void;
}

const ChatMessagesContext = createContext<ChatMessagesContextType | undefined>(undefined);

export const ChatMessagesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingToolConfirmations, setPendingToolConfirmations] = useState<Map<string, PendingToolCall>>(new Map());

  const addMessage = (msg: ChatMessage) =>
    setMessages(prev => {
      if (
        msg.role === 'ai' && msg.streaming &&
        prev.length > 0 &&
        prev[prev.length - 1].role === 'ai' &&
        (prev[prev.length - 1] as any).streaming
      ) {
        // Update the last streaming AI message
        return [
          ...prev.slice(0, -1),
          { ...prev[prev.length - 1], content: msg.content }
        ];
      }
      // Otherwise, add a new message
      return [...prev, msg];
    });
    
  const addToolCall = (toolName: string, toolArgs: any) =>
    setMessages(prev => [...prev, { role: 'tool-call', toolName, toolArgs }]);
    
  const addToolResult = (toolName: string, result: any) =>
    setMessages(prev => [...prev, { role: 'tool-result', toolName, result }]);
    
  const clearMessages = () => {
    setMessages([]);
    setPendingToolConfirmations(new Map());
  };

  const addPendingToolConfirmation = (pendingTool: PendingToolCall) => {
    setPendingToolConfirmations(prev => new Map(prev.set(pendingTool.id, pendingTool)));
    // Add confirmation message to chat
    addMessage({
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
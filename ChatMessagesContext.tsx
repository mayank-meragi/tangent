import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ChatMessage =
  | { role: 'user' | 'ai'; content: string; streaming?: boolean; timestamp?: string }
  | { role: 'tool-call'; toolName: string; toolArgs: any }
  | { role: 'tool-result'; toolName: string; result: any };

interface ChatMessagesContextType {
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  addToolCall: (toolName: string, toolArgs: any) => void;
  addToolResult: (toolName: string, result: any) => void;
  clearMessages: () => void;
}

const ChatMessagesContext = createContext<ChatMessagesContextType | undefined>(undefined);

export const ChatMessagesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

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
  const clearMessages = () => setMessages([]);

  return (
    <ChatMessagesContext.Provider value={{ messages, addMessage, addToolCall, addToolResult, clearMessages }}>
      {children}
    </ChatMessagesContext.Provider>
  );
};

export function useChatMessages() {
  const ctx = useContext(ChatMessagesContext);
  if (!ctx) throw new Error('useChatMessages must be used within a ChatMessagesProvider');
  return ctx;
} 
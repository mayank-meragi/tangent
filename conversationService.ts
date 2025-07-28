import { App, TFile } from 'obsidian';
import { ChatMessage } from './ChatMessagesContext';
import { ConversationMessage } from './ai';
import { Persona } from './tools/types';

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  selectedPersona?: Persona;
}

export class ConversationService {
  private app: App;
  private conversationsFolder = 'tangent/conversations';

  constructor(app: App) {
    this.app = app;
  }

  async ensureConversationsFolder(): Promise<void> {
    const folder = this.app.vault.getAbstractFileByPath(this.conversationsFolder);
    if (!folder) {
      await this.app.vault.createFolder(this.conversationsFolder);
    }
  }

  async saveConversation(conversation: Conversation): Promise<void> {
    await this.ensureConversationsFolder();
    
    const filename = `${conversation.id}.json`;
    const filepath = `${this.conversationsFolder}/${filename}`;
    
    const content = JSON.stringify(conversation, null, 2);
    
    try {
      const existingFile = this.app.vault.getAbstractFileByPath(filepath);
      if (existingFile instanceof TFile) {
        await this.app.vault.modify(existingFile, content);
      } else {
        await this.app.vault.create(filepath, content);
      }
    } catch (error) {
      console.error('Failed to save conversation:', error);
      throw error;
    }
  }

  async loadConversation(conversationId: string): Promise<Conversation | null> {
    const filename = `${conversationId}.json`;
    const filepath = `${this.conversationsFolder}/${filename}`;
    
    try {
      const file = this.app.vault.getAbstractFileByPath(filepath);
      if (file instanceof TFile) {
        const content = await this.app.vault.read(file);
        return JSON.parse(content);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
    
    return null;
  }

  async getAllConversations(): Promise<Conversation[]> {
    await this.ensureConversationsFolder();
    
    const conversations: Conversation[] = [];
    const folder = this.app.vault.getAbstractFileByPath(this.conversationsFolder);
    
    if (folder && 'children' in folder) {
      for (const child of (folder as any).children) {
        if (child instanceof TFile && child.extension === 'json') {
          try {
            const content = await this.app.vault.read(child);
            const conversation = JSON.parse(content);
            conversations.push(conversation);
          } catch (error) {
            console.error(`Failed to load conversation from ${child.path}:`, error);
          }
        }
      }
    }
    
    // Sort by updatedAt descending (most recent first)
    return conversations.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async deleteConversation(conversationId: string): Promise<void> {
    const filename = `${conversationId}.json`;
    const filepath = `${this.conversationsFolder}/${filename}`;
    
    try {
      const file = this.app.vault.getAbstractFileByPath(filepath);
      if (file instanceof TFile) {
        await this.app.vault.delete(file);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      throw error;
    }
  }

  createConversationFromMessages(messages: ChatMessage[], title?: string, selectedPersona?: Persona): Conversation {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const now = new Date().toISOString();
    
    // Generate title from first user message if not provided
    if (!title) {
      const firstUserMessage = messages.find(msg => msg.role === 'user');
      title = firstUserMessage && 'content' in firstUserMessage
        ? firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '')
        : 'New Conversation';
    }
    
    return {
      id,
      title,
      messages: [...messages],
      createdAt: now,
      updatedAt: now,
      selectedPersona: selectedPersona || undefined
    };
  }

  updateConversation(conversation: Conversation, messages: ChatMessage[], selectedPersona?: Persona): Conversation {
    return {
      ...conversation,
      messages: [...messages],
      updatedAt: new Date().toISOString(),
      selectedPersona: selectedPersona || conversation.selectedPersona
    };
  }

  // Convert ChatMessage[] to ConversationMessage[] for AI processing
  convertToConversationMessages(messages: ChatMessage[]): ConversationMessage[] {
    const result: ConversationMessage[] = [];
    
    for (const msg of messages) {
      if (msg.role === 'user') {
        result.push({
          role: 'user',
          parts: [{ text: msg.content }]
        });
      } else if (msg.role === 'ai') {
        result.push({
          role: 'model',
          parts: [{ text: msg.message }]
        });
      }
    }
    
    return result;
  }
} 
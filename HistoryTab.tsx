import React, { useState, useEffect } from 'react';
import { Conversation, ConversationService } from './conversationService';
import { setIcon } from 'obsidian';

interface HistoryTabProps {
  conversationService: ConversationService;
  onLoadConversation: (conversation: Conversation) => void;
  onClose: () => void;
}

const HistoryTab: React.FC<HistoryTabProps> = ({ 
  conversationService, 
  onLoadConversation, 
  onClose 
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const convos = await conversationService.getAllConversations();
      setConversations(convos);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      try {
        setDeletingId(conversationId);
        await conversationService.deleteConversation(conversationId);
        setConversations(prev => prev.filter(c => c.id !== conversationId));
      } catch (error) {
        console.error('Failed to delete conversation:', error);
        alert('Failed to delete conversation. Please try again.');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getMessageCount = (conversation: Conversation) => {
    return conversation.messages.filter(msg => msg.role === 'user' || msg.role === 'ai').length;
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        color: 'var(--text-muted)' 
      }}>
        Loading conversations...
      </div>
    );
  }

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: 'var(--background-primary)'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid var(--background-modifier-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
          Conversation History
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Close history"
        >
          <span ref={(el) => { if (el) setIcon(el, 'x'); }} />
        </button>
      </div>

      {/* Conversations List */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        padding: '8px'
      }}>
        {conversations.length === 0 ? (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: 'var(--text-muted)'
          }}>
            <div style={{ marginBottom: '8px' }}>
              <span ref={(el) => { if (el) setIcon(el, 'message-circle'); }} style={{ fontSize: '24px' }} />
            </div>
            <div>No conversations yet</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              Start a new conversation to see it here
            </div>
          </div>
        ) : (
          conversations.map(conversation => (
            <div
              key={conversation.id}
              onClick={() => onLoadConversation(conversation)}
              style={{
                padding: '12px',
                border: '1px solid var(--background-modifier-border)',
                borderRadius: '8px',
                marginBottom: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--background-secondary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--background-primary)';
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '4px'
              }}>
                <div style={{
                  fontWeight: 500,
                  fontSize: '14px',
                  lineHeight: '1.4',
                  flex: 1,
                  marginRight: '8px'
                }}>
                  {conversation.title}
                </div>
                <button
                  onClick={(e) => handleDeleteConversation(conversation.id, e)}
                  disabled={deletingId === conversation.id}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px',
                    borderRadius: '4px',
                    opacity: deletingId === conversation.id ? 0.5 : 0.6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Delete conversation"
                >
                  <span ref={(el) => { if (el) setIcon(el, 'trash-2'); }} style={{ fontSize: '12px' }} />
                </button>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px',
                color: 'var(--text-muted)'
              }}>
                <span>{getMessageCount(conversation)} messages</span>
                <span>{formatDate(conversation.updatedAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HistoryTab; 
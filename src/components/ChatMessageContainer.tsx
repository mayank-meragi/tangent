import React from 'react';

interface ChatMessageContainerProps {
  isUser: boolean;
  children: React.ReactNode;
  timestamp?: string;
  style?: React.CSSProperties;
  'data-message-id'?: string;
}

const ChatMessageContainer: React.FC<ChatMessageContainerProps> = ({
  isUser,
  children,
  timestamp,
  style = {},
  'data-message-id': dataMessageId,
}) => {
  return (
    <div
      style={{
        backgroundColor: isUser ? 'var(--background-secondary)' : 'transparent',
        padding: isUser ? '1px 16px' : '0',
        borderRadius: isUser ? '8px' : '0',
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '100%',
        width: '100%', // Always take full width for both user and AI messages
        border: isUser ? '1px solid var(--background-modifier-border)' : 'none',
        position: 'relative',
        userSelect: 'text',
        WebkitUserSelect: 'text',
        MozUserSelect: 'text',
        msUserSelect: 'text',
        ...style,
      }}
      className={isUser ? 'user-message-container' : 'ai-message-wrapper'}
      data-message-id={dataMessageId}
    >
      {children}
      {timestamp && (
        <div style={{
          fontSize: '11px',
          color: 'var(--text-faint)',
          textAlign: isUser ? 'right' : 'left',
          marginTop: 4,
        }}>
          {timestamp}
        </div>
      )}
    </div>
  );
};

export default ChatMessageContainer; 
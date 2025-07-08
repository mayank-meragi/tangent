import React from 'react';

interface ChatMessageContainerProps {
  isUser: boolean;
  children: React.ReactNode;
  timestamp?: string;
  style?: React.CSSProperties;
}

const ChatMessageContainer: React.FC<ChatMessageContainerProps> = ({
  isUser,
  children,
  timestamp,
  style = {},
}) => {
  return (
    <div
      style={{
        backgroundColor: isUser ? 'var(--background-secondary)' : 'transparent',
        padding: isUser ? '1px 16px' : '0',
        borderRadius: isUser ? '8px' : '0',
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '100%',
        width: isUser ? '100%' : undefined,
        border: isUser ? '1px solid var(--background-modifier-border)' : 'none',
        position: 'relative',
        ...style,
      }}
      className={isUser ? 'user-message-container' : ''}
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
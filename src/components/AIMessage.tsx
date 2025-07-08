import React from 'react';
import ReactMarkdown from 'react-markdown';
import CollapsibleThinking from './CollapsibleThinking';

interface AIMessageProps {
  thought?: string;
  message?: string;
  style?: React.CSSProperties;
}

const AIMessage: React.FC<AIMessageProps> = ({
  thought,
  message,
  style = {},
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', ...style }}>
      {thought && <CollapsibleThinking content={thought} />}
      {message && (
        <div style={{
          color: 'var(--text-normal)',
          fontSize: '14px',
          lineHeight: '1.5',
        }}>
          <ReactMarkdown>{message}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default AIMessage; 
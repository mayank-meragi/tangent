import React, { useState } from 'react';
import LucidIcon from './LucidIcon';
import ReactMarkdown from 'react-markdown';

interface CollapsibleThinkingProps {
  content: string;
}

const CollapsibleThinking: React.FC<CollapsibleThinkingProps> = ({ content }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="tangent-chat-thinking" style={{ 
      padding: '8px 12px', 
      backgroundColor: 'var(--background-secondary)',
      borderRadius: '6px',
      border: '1px solid var(--background-modifier-border)',
      marginBottom: '8px'
    }}>
      <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => setOpen(o => !o)}>
        <LucidIcon name={open ? 'chevron-down' : 'chevron-right'} size={12} />
        <LucidIcon name="brain" size={12} />
        <b style={{ color: 'var(--text-accent)' }}>Thinking...</b>
      </span>
      {open && (
        <div style={{ marginTop: 8, fontSize: '0.9em', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default CollapsibleThinking; 
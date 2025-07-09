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
    }}>
      <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => setOpen(o => !o)}>
        <LucidIcon name={open ? 'chevron-down' : 'chevron-right'} size={10} />
        <LucidIcon name="brain" size={10} />
        <b style={{ color: 'var(--text-accent)', fontSize: '10px' }}>Thinking...</b>
      </span>
      {open && (
        <div style={{ marginTop: 8, fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default CollapsibleThinking; 
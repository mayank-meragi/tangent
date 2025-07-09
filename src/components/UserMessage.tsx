import React from 'react';
import ReactMarkdown from 'react-markdown';
import IconButton from './IconButton';
import LucidIcon from './LucidIcon';

interface UserMessageProps {
  content: string;
  onEdit?: () => void;
  showEdit?: boolean;
  style?: React.CSSProperties;
}

const UserMessage: React.FC<UserMessageProps> = ({
  content,
  onEdit,
  showEdit = false,
  style = {},
}) => {
  return (
    <div style={{ position: 'relative', ...style }}>
      {showEdit && (
        <div style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          display: 'flex',
          gap: '4px',
          zIndex: 1,
        }} className="message-actions">
          <IconButton
            icon={<LucidIcon name="edit-3" size={12} />}
            ariaLabel="Edit message"
            onClick={onEdit}
            title="Edit message"
            size={12}
            color="var(--text-muted)"
          />
        </div>
      )}
      <div style={{
        color: 'var(--text-normal)',
        fontSize: '14px',
        lineHeight: '1.5',
      }}>
        <ReactMarkdown
        components={{
          p: ({node, ...props}) => (
            <p style={{ margin: 4 }} {...props} />
          )
        }}
        >{content}</ReactMarkdown>
      </div>
    </div>
  );
};

export default UserMessage; 
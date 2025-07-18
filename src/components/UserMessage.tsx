import React from 'react';
import ReactMarkdown from 'react-markdown';
import IconButton from './IconButton';
import LucidIcon from './LucidIcon';
import { UploadedFile } from '../../FileUploadService';

interface UserMessageProps {
  content: string;
  files?: UploadedFile[];
  onEdit?: () => void;
  showEdit?: boolean;
  style?: React.CSSProperties;
}

const UserMessage: React.FC<UserMessageProps> = ({
  content,
  files = [],
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
      {/* Uploaded Files Preview */}
      {files.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: 6 }}>
          {files.map(file => file.preview ? (
            <div key={file.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 100 }}>
              <img
                src={file.preview}
                alt={file.name}
                style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--background-modifier-border)' }}
              />
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, textAlign: 'center', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
            </div>
          ) : (
            <div key={file.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 100 }}>
              <LucidIcon name="file-text" size={32} />
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, textAlign: 'center', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
              <div style={{ fontSize: 9, color: 'var(--text-faint)' }}>{(file.size / 1024).toFixed(1)} KB</div>
            </div>
          ))}
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
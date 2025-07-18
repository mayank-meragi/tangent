import React from 'react';
import { UploadedFile } from '../../FileUploadService';
import FilePreviewItem from './FilePreviewItem';

interface FilePreviewListProps {
  files: UploadedFile[];
  onRemove: (fileId: string) => void;
  className?: string;
}

const FilePreviewList: React.FC<FilePreviewListProps> = ({
  files = [],
  onRemove,
  className = ''
}) => {
  if (!files || files.length === 0) {
    return null;
  }

  return (
    <div 
      className={`file-preview-list ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        gap: '8px',
        padding: '8px 0',
        marginBottom: '8px'
      }}
    >
      {files.map((file) => (
        <FilePreviewItem
          key={file.id}
          file={file}
          onRemove={() => onRemove(file.id)}
        />
      ))}
    </div>
  );
};

export default FilePreviewList; 
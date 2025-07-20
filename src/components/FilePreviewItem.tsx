import React, { useState } from 'react';
import { UploadedFile, fileUploadService } from '../../FileUploadService';
import IconButton from './IconButton';
import LucidIcon from './LucidIcon';

interface FilePreviewItemProps {
  file: UploadedFile;
  onRemove: () => void;
}

const FilePreviewItem: React.FC<FilePreviewItemProps> = ({
  file,
  onRemove
}) => {
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);

  const handleRemoveClick = () => {
    if (showRemoveConfirm) {
      onRemove();
    } else {
      setShowRemoveConfirm(true);
      // Auto-hide confirmation after 3 seconds
      setTimeout(() => setShowRemoveConfirm(false), 3000);
    }
  };

  const handleImageError = () => {
    setImageLoadError(true);
  };

  const isImage = fileUploadService.isImageFile(file.mimeType);
  const fileIcon = fileUploadService.getFileIcon(file.mimeType);
  const fileSize = fileUploadService.formatFileSize(file.size);

  return (
    <div
      className="file-preview-item"
      style={{
        position: 'relative',
        background: 'var(--background-primary)',
        border: '1px solid var(--background-modifier-border)',
        borderRadius: '8px',
        padding: '8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        minHeight: '100px',
        transition: 'all 0.2s ease',
        cursor: 'pointer'
      }}
      onMouseEnter={() => setShowRemoveConfirm(false)}
    >
      {/* File Preview */}
      <div
        style={{
          width: '80px',
          height: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
          overflow: 'hidden',
          background: 'var(--background-secondary)',
          border: '1px solid var(--background-modifier-border)'
        }}
      >
        {isImage && file.preview && !imageLoadError ? (
          <img
            src={file.preview}
            alt={file.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '2px'
            }}
            onError={handleImageError}
          />
                 ) : (
           <LucidIcon 
             name={fileIcon as any} 
             size={32} 
             className="file-icon"
           />
         )}
      </div>

      {/* File Name */}
      <div
        style={{
          fontSize: '11px',
          fontWeight: 500,
          color: 'var(--text-normal)',
          textAlign: 'center',
          lineHeight: '1.2',
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
        title={file.name}
      >
        {file.name}
      </div>

      {/* File Size */}
      <div
        style={{
          fontSize: '10px',
          color: 'var(--text-muted)',
          textAlign: 'center'
        }}
      >
        {fileSize}
      </div>

      {/* Status Indicator */}
      {file.status === 'uploading' && (
        <div
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--color-orange)',
            animation: 'pulse 1.5s infinite'
          }}
        />
      )}

      {file.status === 'error' && (
        <div
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--color-red)'
          }}
        />
      )}

      {/* Remove Button */}
      <div
        style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          opacity: 0,
          transition: 'opacity 0.2s ease',
          zIndex: 1
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0';
        }}
      >
        <IconButton
          icon={
            showRemoveConfirm ? (
              <LucidIcon name="trash-2" size={12} />
            ) : (
              <LucidIcon name="x" size={12} />
            )
          }
          onClick={handleRemoveClick}
          ariaLabel={showRemoveConfirm ? "Confirm remove file" : "Remove file"}
          title={showRemoveConfirm ? "Click again to confirm removal" : "Remove file"}
          style={{
            width: '20px',
            height: '20px',
            backgroundColor: showRemoveConfirm ? 'var(--color-red)' : 'var(--background-secondary)',
            color: showRemoveConfirm ? 'white' : 'var(--text-muted)',
            border: '1px solid var(--background-modifier-border)',
            borderRadius: '4px',
            transition: 'background-color 0.2s ease'
          }}
        />
      </div>

      {/* Error Message */}
      {file.status === 'error' && file.error && (
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            background: 'var(--color-red-bg)',
            color: 'var(--color-red)',
            fontSize: '9px',
            padding: '2px 4px',
            textAlign: 'center',
            borderBottomLeftRadius: '7px',
            borderBottomRightRadius: '7px'
          }}
        >
          {file.error}
        </div>
      )}
    </div>
  );
};

export default FilePreviewItem; 
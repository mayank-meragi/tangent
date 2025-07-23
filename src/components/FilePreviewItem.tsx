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
      className="file-preview-item tangent-file-preview-item"
      onMouseEnter={() => setShowRemoveConfirm(false)}
    >
      {/* File Preview */}
      <div className="tangent-file-preview-area">
        {isImage && file.preview && !imageLoadError ? (
          <img
            src={file.preview}
            alt={file.name}
            className="tangent-file-preview-image"
            onError={handleImageError}
          />
                 ) : (
           <LucidIcon 
             name={fileIcon as any} 
             size={24} 
             className="file-icon"
           />
         )}
      </div>

      {/* File Details */}
      <div className="tangent-file-details">
        {/* File Name */}
        <div
          className="tangent-file-preview-name"
          title={file.name}
        >
          {file.name}
        </div>

        {/* File Size */}
        <div className="tangent-file-preview-size">
          {fileSize}
        </div>
      </div>

      {/* Status Indicator */}
      {file.status === 'uploading' && (
        <div className="tangent-file-status-indicator uploading" />
      )}

      {file.status === 'error' && (
        <div className="tangent-file-status-indicator error" />
      )}

      {/* Remove Button */}
      <div className="tangent-file-remove-container">
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
        <div className="tangent-file-error-message">
          {file.error}
        </div>
      )}
    </div>
  );
};

export default FilePreviewItem; 
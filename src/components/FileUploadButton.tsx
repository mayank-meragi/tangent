import React, { useRef, ChangeEvent } from 'react';
import IconButton from './IconButton';
import LucidIcon from './LucidIcon';

interface FileUploadButtonProps {
  onFileSelect: (files: File[]) => void;
  disabled?: boolean;
  multiple?: boolean;
  accept?: string;
  title?: string;
}

const FileUploadButton: React.FC<FileUploadButtonProps> = ({
  onFileSelect,
  disabled = false,
  multiple = true,
  accept = '*/*',
  title = 'Upload files'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFileSelect(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };
  
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        aria-label={title}
      />
      <IconButton
        icon={<LucidIcon name="upload" size={16} />}
        onClick={handleClick}
        disabled={disabled}
        title={title}
        ariaLabel={title}
      />
    </>
  );
};

export default FileUploadButton; 
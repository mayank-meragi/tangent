// File Upload Service for Tangent Plugin
// Handles file validation, encoding, and processing

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

export interface EncodedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  mimeType: string;
  encodedData: string;
  textContent?: string;
  preview?: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  mimeType: string;
  preview?: string;
  encodedData?: string;
  textContent?: string;
  status: 'uploading' | 'ready' | 'error';
  error?: string;
}

// Supported file types and their MIME types
const SUPPORTED_FILE_TYPES = {
  // Images
  'image/png': { icon: 'image', extensions: ['.png'] },
  'image/jpeg': { icon: 'image', extensions: ['.jpg', '.jpeg'] },
  'image/gif': { icon: 'image', extensions: ['.gif'] },
  'image/webp': { icon: 'image', extensions: ['.webp'] },
  'image/svg+xml': { icon: 'image', extensions: ['.svg'] },
  
  // Documents
  'application/pdf': { icon: 'file-text', extensions: ['.pdf'] },
  'text/plain': { icon: 'file-text', extensions: ['.txt', '.md'] },
  'text/markdown': { icon: 'file-text', extensions: ['.md', '.markdown'] },
  'application/msword': { icon: 'file-text', extensions: ['.doc'] },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: 'file-text', extensions: ['.docx'] },
  
  // Data files
  'text/csv': { icon: 'table', extensions: ['.csv'] },
  'application/json': { icon: 'code', extensions: ['.json'] },
  'application/xml': { icon: 'code', extensions: ['.xml'] },
  'text/xml': { icon: 'code', extensions: ['.xml'] },
  
  // Code files
  'text/javascript': { icon: 'code', extensions: ['.js', '.jsx'] },
  'text/typescript': { icon: 'code', extensions: ['.ts', '.tsx'] },
  'text/css': { icon: 'code', extensions: ['.css'] },
  'text/html': { icon: 'code', extensions: ['.html', '.htm'] },
  'text/x-python': { icon: 'code', extensions: ['.py'] },
  'text/x-java-source': { icon: 'code', extensions: ['.java'] },
  'text/x-c++src': { icon: 'code', extensions: ['.cpp', '.cc', '.cxx'] },
  'text/x-csrc': { icon: 'code', extensions: ['.c'] },
  'text/x-php': { icon: 'code', extensions: ['.php'] },
  'text/x-ruby': { icon: 'code', extensions: ['.rb'] },
  'text/x-go': { icon: 'code', extensions: ['.go'] },
  'text/x-rust': { icon: 'code', extensions: ['.rs'] },
  'text/x-swift': { icon: 'code', extensions: ['.swift'] },
  'text/x-kotlin': { icon: 'code', extensions: ['.kt'] },
  'text/x-scala': { icon: 'code', extensions: ['.scala'] },
  'text/x-r': { icon: 'code', extensions: ['.r'] },
  'text/x-matlab': { icon: 'code', extensions: ['.m'] },
  'text/x-sql': { icon: 'code', extensions: ['.sql'] },
  'text/x-yaml': { icon: 'code', extensions: ['.yml', '.yaml'] },
  'text/x-toml': { icon: 'code', extensions: ['.toml'] },
  'text/x-ini': { icon: 'code', extensions: ['.ini', '.cfg'] },
  'text/x-shellscript': { icon: 'code', extensions: ['.sh', '.bash', '.zsh'] },
  'text/x-batch': { icon: 'code', extensions: ['.bat', '.cmd'] },
  'text/x-powershell': { icon: 'code', extensions: ['.ps1'] },
};

// File size limits
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const MAX_TOTAL_SIZE = 25 * 1024 * 1024; // 25MB total
const MIN_FILE_SIZE = 1024; // 1KB minimum

export class FileUploadService {
  
  /**
   * Validates a single file
   */
  validateFile(file: File): ValidationResult {
    // Check file size
    if (file.size < MIN_FILE_SIZE) {
      return {
        isValid: false,
        error: 'File appears to be empty. Please select a file with content.'
      };
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File too large. Maximum size is ${this.formatFileSize(MAX_FILE_SIZE)}.`
      };
    }
    
    // Check file type
    const mimeType = file.type;
    const extension = this.getFileExtension(file.name);
    
    // Check if MIME type is supported
    if (mimeType && SUPPORTED_FILE_TYPES[mimeType as keyof typeof SUPPORTED_FILE_TYPES]) {
      return { isValid: true };
    }
    
    // Check if extension is supported (fallback for files without MIME type)
    for (const [, info] of Object.entries(SUPPORTED_FILE_TYPES)) {
      if (info.extensions.includes(extension.toLowerCase())) {
        return { isValid: true };
      }
    }
    
    return {
      isValid: false,
      error: 'File type not supported. Please select a supported file type.'
    };
  }
  
  /**
   * Validates multiple files and total size
   */
  validateFiles(files: File[]): ValidationResult {
    let totalSize = 0;
    
    for (const file of files) {
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        return validation;
      }
      totalSize += file.size;
    }
    
    if (totalSize > MAX_TOTAL_SIZE) {
      return {
        isValid: false,
        error: `Total file size exceeds ${this.formatFileSize(MAX_TOTAL_SIZE)} limit.`
      };
    }
    
    return { isValid: true };
  }
  
  /**
   * Encodes a file for transmission to Gemini API
   */
  async encodeFile(file: File): Promise<EncodedFile> {
    const mimeType = this.getMimeType(file);
    const isTextFile = this.isTextFile(mimeType);
    
    let encodedData = '';
    let textContent: string | undefined;
    
    if (isTextFile) {
      // For text files, extract text content
      textContent = await this.extractTextContent(file);
      encodedData = btoa(unescape(encodeURIComponent(textContent)));
    } else {
      // For binary files, encode as base64
      encodedData = await this.encodeToBase64(file);
    }
    
    return {
      id: this.generateFileId(),
      name: file.name,
      size: file.size,
      type: this.getFileType(file.name),
      mimeType,
      encodedData,
      textContent,
      preview: await this.createImagePreview(file)
    };
  }
  
  /**
   * Creates an image preview for image files
   */
  async createImagePreview(file: File): Promise<string | undefined> {
    if (!this.isImageFile(file.type)) {
      return undefined;
    }
    
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate thumbnail size (max 100px height, maintain aspect ratio)
        const maxHeight = 100;
        const maxWidth = 100;
        let { width, height } = img;
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw image with smoothing
        ctx!.imageSmoothingEnabled = true;
        ctx!.imageSmoothingQuality = 'high';
        ctx!.drawImage(img, 0, 0, width, height);
        
        // Convert to base64
        const preview = canvas.toDataURL('image/jpeg', 0.8);
        resolve(preview);
      };
      
      img.onerror = () => {
        resolve(undefined);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }
  
  /**
   * Gets the appropriate icon for a file type
   */
  getFileIcon(fileType: string): string {
    const mimeType = fileType.toLowerCase();
    
    // Check exact MIME type match
    if (SUPPORTED_FILE_TYPES[mimeType as keyof typeof SUPPORTED_FILE_TYPES]) {
      return SUPPORTED_FILE_TYPES[mimeType as keyof typeof SUPPORTED_FILE_TYPES].icon;
    }
    
    // Check by file extension
    const extension = this.getFileExtension(fileType);
    for (const [, info] of Object.entries(SUPPORTED_FILE_TYPES)) {
      if (info.extensions.includes(extension.toLowerCase())) {
        return info.icon;
      }
    }
    
    // Default icon
    return 'file';
  }
  
  /**
   * Checks if a file is an image
   */
  isImageFile(fileType: string): boolean {
    return fileType.startsWith('image/');
  }
  
  /**
   * Checks if a file is a text file
   */
  isTextFile(fileType: string): boolean {
    return fileType.startsWith('text/') || 
           fileType === 'application/json' ||
           fileType === 'application/xml';
  }
  
  /**
   * Formats file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  /**
   * Gets file extension from filename
   */
  private getFileExtension(filename: string): string {
    return filename.substring(filename.lastIndexOf('.'));
  }
  
  /**
   * Gets MIME type for a file
   */
  private getMimeType(file: File): string {
    // Use file.type if available, otherwise infer from extension
    if (file.type) {
      return file.type;
    }
    
    const extension = this.getFileExtension(file.name).toLowerCase();
    
    // Map common extensions to MIME types
    const extensionMap: Record<string, string> = {
      '.txt': 'text/plain',
      '.md': 'text/markdown',
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.csv': 'text/csv',
      '.js': 'text/javascript',
      '.ts': 'text/typescript',
      '.css': 'text/css',
      '.html': 'text/html',
      '.htm': 'text/html',
      '.py': 'text/x-python',
      '.java': 'text/x-java-source',
      '.cpp': 'text/x-c++src',
      '.c': 'text/x-csrc',
      '.php': 'text/x-php',
      '.rb': 'text/x-ruby',
      '.go': 'text/x-go',
      '.rs': 'text/x-rust',
      '.swift': 'text/x-swift',
      '.kt': 'text/x-kotlin',
      '.scala': 'text/x-scala',
      '.r': 'text/x-r',
      '.m': 'text/x-matlab',
      '.sql': 'text/x-sql',
      '.yml': 'text/x-yaml',
      '.yaml': 'text/x-yaml',
      '.toml': 'text/x-toml',
      '.ini': 'text/x-ini',
      '.cfg': 'text/x-ini',
      '.sh': 'text/x-shellscript',
      '.bash': 'text/x-shellscript',
      '.zsh': 'text/x-shellscript',
      '.bat': 'text/x-batch',
      '.cmd': 'text/x-batch',
      '.ps1': 'text/x-powershell',
    };
    
    return extensionMap[extension] || 'application/octet-stream';
  }
  
  /**
   * Gets file type category
   */
  private getFileType(filename: string): string {
    const extension = this.getFileExtension(filename).toLowerCase();
    
    if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(extension)) {
      return 'image';
    }
    
    if (['.pdf', '.doc', '.docx', '.txt', '.md'].includes(extension)) {
      return 'document';
    }
    
    if (['.csv', '.json', '.xml'].includes(extension)) {
      return 'data';
    }
    
    return 'code';
  }
  
  /**
   * Extracts text content from a text file
   */
  private async extractTextContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        resolve(reader.result as string);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file content'));
      };
      
      reader.readAsText(file, 'UTF-8');
    });
  }
  
  /**
   * Encodes a file to base64
   */
  private async encodeToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix if present
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to encode file'));
      };
      
      reader.readAsDataURL(file);
    });
  }
  
  /**
   * Generates a unique file ID
   */
  private generateFileId(): string {
    return 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

// Export singleton instance
export const fileUploadService = new FileUploadService(); 
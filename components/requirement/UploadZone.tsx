import React, { useRef } from 'react';
import { UploadIcon, XIcon, DocumentTextIcon } from '../icons/Icons';

interface UploadZoneProps {
  file: File | null;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  acceptedTypes?: string[];
  maxSize?: number; // in bytes
  disabled?: boolean;
}

const UploadZone: React.FC<UploadZoneProps> = ({
  file,
  onFileSelect,
  onFileRemove,
  acceptedTypes = ['.docx', '.md', '.txt'], // PDF temporarily disabled
  maxSize = 5 * 1024 * 1024, // 5MB default
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];

      // Validate file type
      const fileExtension = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
      if (!acceptedTypes.includes(fileExtension)) {
        alert(`File type không được hỗ trợ. Chỉ chấp nhận: ${acceptedTypes.join(', ')}`);
        return;
      }

      // Validate file size
      if (selectedFile.size > maxSize) {
        alert(`File quá lớn. Kích thước tối đa: ${(maxSize / 1024 / 1024).toFixed(0)}MB`);
        return;
      }

      onFileSelect(selectedFile);
      // Reset input để có thể chọn lại file cùng tên
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDropZoneClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      e.currentTarget.classList.add('border-accent-cyan');
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('border-accent-cyan');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('border-accent-cyan');

    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];

      // Validate file type
      const fileExtension = '.' + droppedFile.name.split('.').pop()?.toLowerCase();
      if (!acceptedTypes.includes(fileExtension)) {
        alert(`File type không được hỗ trợ. Chỉ chấp nhận: ${acceptedTypes.join(', ')}`);
        return;
      }

      // Validate file size
      if (droppedFile.size > maxSize) {
        alert(`File quá lớn. Kích thước tối đa: ${(maxSize / 1024 / 1024).toFixed(0)}MB`);
        return;
      }

      onFileSelect(droppedFile);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  if (file) {
    return (
      <div className="bg-surface2 rounded-lg p-4 border border-surface2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <DocumentTextIcon className="w-8 h-8 text-accent-cyan flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-primary truncate">{file.name}</p>
              <p className="text-xs text-primary-muted">{formatFileSize(file.size)}</p>
            </div>
          </div>
          {!disabled && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFileRemove();
              }}
              className="p-2 rounded-lg hover:bg-surface text-primary-muted hover:text-primary transition-colors"
              aria-label="Remove file"
            >
              <XIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        border-2 border-dashed rounded-lg p-8 text-center relative cursor-pointer
        transition-all duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed border-surface2' : 'border-surface2 hover:border-accent-cyan hover:bg-surface/50'}
      `}
      onClick={handleDropZoneClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <UploadIcon className="mx-auto h-12 w-12 text-primary-muted mb-3" />
      <p className="text-sm font-medium text-primary mb-1">
        {disabled ? 'Đang xử lý...' : 'Kéo thả file hoặc click để chọn'}
      </p>
      <p className="text-xs text-primary-muted">
        Hỗ trợ: {acceptedTypes.join(', ')}
      </p>
      <p className="text-xs text-primary-muted mt-1">
        Kích thước tối đa: {(maxSize / 1024 / 1024).toFixed(0)}MB
      </p>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
};

export default UploadZone;


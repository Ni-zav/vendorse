import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from './Button';

interface FileUploadProps {
  onUpload: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number;
  accept?: Record<string, string[]>;
  error?: string;
}

export function FileUpload({
  onUpload,
  maxFiles = 1,
  maxSize = 5 * 1024 * 1024, // 5MB default
  accept,
  error,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      const newFiles = [...files, ...acceptedFiles].slice(0, maxFiles);
      setFiles(newFiles);
      onUpload(newFiles);

      const errors = rejectedFiles.map((file) => {
        if (file.size > maxSize) {
          return `${file.name} is too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`;
        }
        if (file.type && !Object.keys(accept || {}).includes(file.type)) {
          return `${file.name} has an unsupported file type`;
        }
        return `${file.name} could not be uploaded`;
      });

      setUploadErrors(errors);
    },
    [files, maxFiles, maxSize, accept, onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    maxSize,
    accept,
  });

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onUpload(newFiles);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${error ? 'border-red-300' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 14v20c0 4.418 3.582 8 8 8h16c4.418 0 8-3.582 8-8V14M8 14c0-4.418 3.582-8 8-8h16c4.418 0 8 3.582 8 8m-9 8l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-sm text-gray-600">
            {isDragActive
              ? 'Drop the files here...'
              : 'Drag and drop files here, or click to select files'}
          </p>
          <p className="text-xs text-gray-500">
            Maximum {maxFiles} file{maxFiles > 1 ? 's' : ''}, up to{' '}
            {Math.round(maxSize / 1024 / 1024)}MB each
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {uploadErrors.length > 0 && (
        <div className="bg-red-50 p-4 rounded-md">
          {uploadErrors.map((error, index) => (
            <p key={index} className="text-sm text-red-600">
              {error}
            </p>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li
              key={index}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
            >
              <span className="text-sm text-gray-600">{file.name}</span>
              <Button
                variant="danger"
                size="sm"
                onClick={() => removeFile(index)}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
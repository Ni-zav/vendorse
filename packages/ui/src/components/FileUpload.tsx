'use client';

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

function formatSize(size: number) {
  if (size < 1024 * 1024) {
    return Math.max(1, Math.round(size / 1024)) + ' KB';
  }

  return (size / 1024 / 1024).toFixed(1) + ' MB';
}

export function FileUpload({
  onUpload,
  maxFiles = 1,
  maxSize = 5 * 1024 * 1024,
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

      const errors = rejectedFiles.map((rejection) => {
        const file = rejection.file || rejection;

        if (file.size > maxSize) {
          return (
            file.name +
            ' is too large. Maximum size is ' +
            Math.round(maxSize / 1024 / 1024) +
            'MB.'
          );
        }

        if (file.type && !Object.keys(accept || {}).includes(file.type)) {
          return file.name + ' has an unsupported file type.';
        }

        return file.name + ' could not be added.';
      });

      setUploadErrors(errors);
    },
    [files, maxFiles, maxSize, accept, onUpload],
  );

  const { getRootProps, getInputProps, isDragActive, isFocused } = useDropzone({
    onDrop,
    maxFiles,
    maxSize,
    accept,
  });

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, fileIndex) => fileIndex !== index);
    setFiles(newFiles);
    onUpload(newFiles);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={[
          'group flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-8 text-center transition',
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50',
          isFocused ? 'ring-2 ring-blue-500 ring-offset-2' : '',
          error ? 'border-red-300' : '',
        ].join(' ')}
      >
        <input {...getInputProps()} />
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition group-hover:bg-white">
          <svg
            className="h-6 w-6"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M12 16V4m0 0L8 8m4-4 4 4M5 13v5a2 2 0 002 2h10a2 2 0 002-2v-5"
            />
          </svg>
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-900">
          {isDragActive ? 'Drop documents to add them' : 'Upload proposal documents'}
        </p>
        <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
          Drag and drop or choose files. Up to {maxFiles} document
          {maxFiles > 1 ? 's' : ''}, {Math.round(maxSize / 1024 / 1024)}MB each.
        </p>
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      {uploadErrors.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          {uploadErrors.map((message) => (
            <p key={message} className="text-sm text-red-700">
              {message}
            </p>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <ul className="space-y-2" aria-label="Selected proposal documents">
          {files.map((file, index) => (
            <li
              key={file.name + '-' + file.lastModified}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">
                  {file.name}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {formatSize(file.size)}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeFile(index)}
                className="w-full sm:w-auto"
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

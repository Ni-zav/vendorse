'use client';

import { useState } from 'react';
import { Button } from './Button';
import { FileUpload } from './FileUpload';

interface BidDocumentPayload {
  filePath: string;
  signatureHash: string;
}

interface BidFormProps {
  onSubmit: (data: { documents: BidDocumentPayload[] }) => Promise<void> | void;
  isLoading?: boolean;
}

async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function uploadProposalFile(file: File): Promise<BidDocumentPayload> {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  const uploadUrlResponse = await fetch('/api/files/upload-url', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
    }),
  });

  const uploadUrlPayload = await uploadUrlResponse.json();

  if (!uploadUrlResponse.ok || !uploadUrlPayload?.url || !uploadUrlPayload?.fields?.key) {
    throw new Error(
      uploadUrlPayload?.message ||
        uploadUrlPayload?.error ||
        'Could not prepare the proposal upload.',
    );
  }

  const uploadResponse = await fetch(uploadUrlPayload.url, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error('A proposal document could not be uploaded.');
  }

  return {
    filePath: uploadUrlPayload.fields.key,
    signatureHash: await hashFile(file),
  };
}

export function BidForm({ onSubmit, isLoading = false }: BidFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (files.length === 0) {
      setError('Upload at least one proposal document before submitting.');
      return;
    }

    setIsUploading(true);

    try {
      const documents = await Promise.all(files.map(uploadProposalFile));
      await onSubmit({ documents });
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : 'The bid could not be submitted.',
      );
    } finally {
      setIsUploading(false);
    }
  };

  const busy = isLoading || isUploading;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
        <p className="text-sm font-semibold text-slate-900">Proposal package</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Upload the signed proposal documents that contain your commercial offer,
          delivery commitments, technical response, and required evidence.
        </p>
      </div>

      <FileUpload
        onUpload={setFiles}
        maxFiles={5}
        maxSize={10 * 1024 * 1024}
        accept={{
          'application/pdf': ['.pdf'],
          'application/msword': ['.doc'],
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
            '.docx',
          ],
        }}
        error={error || undefined}
      />

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-xs leading-5 text-amber-900">
          Submission is final for this MVP. Review the document set carefully before
          sending it; structured pricing and delivery fields are tracked as a follow-up
          product migration.
        </p>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button
          type="submit"
          isLoading={busy}
          disabled={busy}
          className="w-full sm:w-auto"
        >
          {isUploading ? 'Uploading proposal' : 'Submit bid'}
        </Button>
      </div>
    </form>
  );
}

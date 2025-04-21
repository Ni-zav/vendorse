'use client';

import { useState } from 'react';
import { Button } from './Button';
import { FileUpload } from './FileUpload';

interface BidFormProps {
  onSubmit: (data: {
    price: number;
    deliveryTimeInDays: number;
    description: string;
    files: File[];
  }) => void;
  isLoading?: boolean;
}

export function BidForm({ onSubmit, isLoading }: BidFormProps) {
  const [price, setPrice] = useState('');
  const [deliveryTimeInDays, setDeliveryTimeInDays] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      newErrors.price = 'Please enter a valid price';
    }

    if (!deliveryTimeInDays || isNaN(Number(deliveryTimeInDays)) || Number(deliveryTimeInDays) <= 0) {
      newErrors.deliveryTimeInDays = 'Please enter a valid delivery time';
    }

    if (!description.trim()) {
      newErrors.description = 'Please provide a description';
    }

    if (files.length === 0) {
      newErrors.files = 'Please upload at least one file';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    onSubmit({
      price: Number(price),
      deliveryTimeInDays: Number(deliveryTimeInDays),
      description,
      files,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="price" className="block text-sm font-medium text-gray-700">
          Price
        </label>
        <div className="mt-1">
          <input
            type="number"
            id="price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Enter your bid amount"
          />
          {errors.price && (
            <p className="mt-1 text-sm text-red-600">{errors.price}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="deliveryTime" className="block text-sm font-medium text-gray-700">
          Delivery Time (in days)
        </label>
        <div className="mt-1">
          <input
            type="number"
            id="deliveryTime"
            value={deliveryTimeInDays}
            onChange={(e) => setDeliveryTimeInDays(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Enter estimated delivery time"
          />
          {errors.deliveryTimeInDays && (
            <p className="mt-1 text-sm text-red-600">{errors.deliveryTimeInDays}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <div className="mt-1">
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Describe your proposal"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Supporting Documents
        </label>
        <div className="mt-1">
          <FileUpload
            onUpload={setFiles}
            maxFiles={5}
            maxSize={10 * 1024 * 1024} // 10MB
            accept={{
              'application/pdf': ['.pdf'],
              'application/msword': ['.doc'],
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            }}
            error={errors.files}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" isLoading={isLoading}>
          Submit Bid
        </Button>
      </div>
    </form>
  );
}
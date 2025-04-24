# Vendorse UI Component Library

## Technology Stack

- React 18.2+ (peer dependency)
- TypeScript 5.8
- TailwindCSS 4.1
- HeadlessUI 1.7
- React Dropzone 14.2

## Installation

```bash
# Within the monorepo
pnpm install @vendorse/ui@workspace:*
```

## Components

### Forms

#### BidForm
Form component for submitting bids with file uploads and validation.
```tsx
import { BidForm } from '@vendorse/ui';

<BidForm onSubmit={handleSubmit} isLoading={isSubmitting} />
```

#### FileUpload
Drag-and-drop file upload component with preview.
```tsx
import { FileUpload } from '@vendorse/ui';

<FileUpload 
  onUpload={handleUpload}
  accept={['application/pdf']}
  maxSize={5242880} // 5MB
/>
```

#### TenderEvaluation
Evaluation form with weighted scoring and recommendations.
```tsx
import { TenderEvaluation } from '@vendorse/ui';

<TenderEvaluation
  bidId={bid.id}
  criteria={[
    { id: '1', name: 'Technical', weight: 40 },
    { id: '2', name: 'Price', weight: 30 },
    { id: '3', name: 'Timeline', weight: 30 }
  ]}
  onSubmit={handleEvaluate}
/>
```

### Display Components

#### TenderCard
Card component for displaying tender information.
```tsx
import { TenderCard } from '@vendorse/ui';

<TenderCard
  tender={tenderData}
  onPublish={handlePublish}
  onDelete={handleDelete}
/>
```

#### Button
Reusable button component with variants.
```tsx
import { Button } from '@vendorse/ui';

<Button
  variant="primary"
  size="lg"
  isLoading={loading}
  onClick={handleClick}
>
  Submit
</Button>
```

### Form Elements

#### Form Fields
Various form input components:
- Text input
- Text area
- Select
- Radio group
- Checkbox
- File input

```tsx
import { FormField } from '@vendorse/ui';

<FormField
  label="Field Label"
  error={errors.field}
  required
>
  <Input
    type="text"
    value={value}
    onChange={handleChange}
  />
</FormField>
```

## Development

```bash
# Install dependencies
pnpm install

# Start development with watch mode
pnpm dev

# Build for production
pnpm build

# Clean build files
pnpm clean
```

## Contributing

1. Components should be fully typed
2. Include proper prop documentation
3. Follow the existing style patterns
4. Add proper error handling
5. Test all variants and states

## Related Documentation

- [Main Project Documentation](../../README.md)
- [Web Application](../../apps/web/README.md)
- [API Documentation](../../apps/api/README.md)
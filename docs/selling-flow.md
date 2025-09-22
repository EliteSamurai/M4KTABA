# M4KTABA Selling Flow Documentation

## Overview

The M4KTABA selling flow has been consolidated into a single, unified experience that provides a streamlined process for sellers to list their books. This replaces the previous dual implementation with a modern, progressive disclosure approach.

## Architecture

### Main Component

- **`UnifiedSellingFlow`** - The primary selling component located at `/components/UnifiedSellingFlow.tsx`
- **`SellingProcessWrapper`** - Dynamic wrapper for SSR compatibility
- **Entry Point** - `/sell` page mounts the unified flow

### Flow Structure

The selling process is organized into 4 non-blocking sections:

1. **Basic Information** (`basic`)
   - Book title, author, description
   - ISBN (optional)
   - Language selection
   - Category selection

2. **Condition & Pricing** (`pricing`)
   - Book condition selection
   - Price setting
   - Quantity specification

3. **Photos** (`photos`)
   - Image upload (drag & drop or file selection)
   - Image preview and management
   - Support for up to 10 images

4. **Review & Publish** (`review`)
   - Live preview of the listing
   - Final validation
   - Publish action

## Key Features

### Progressive Disclosure

- Users can navigate freely between sections
- Optional fields never block progression
- Visual progress indicator shows completion status

### Real-time Validation

- Immediate feedback on form fields
- Zod schema validation
- User-friendly error messages

### Draft System

- "Save Draft" functionality (placeholder for future API integration)
- Visual save status indicator
- Prevents data loss

### Mobile-First Design

- Responsive layout that works on all devices
- Touch-friendly interface elements
- Optimized for mobile workflows

## API Endpoints (Planned)

The following API endpoints will be implemented in future PRs:

- `POST /api/listings` - Create new listing draft
- `PATCH /api/listings/:id` - Update existing listing
- `POST /api/listings/:id/publish` - Publish listing
- `GET /api/listings/:id` - Retrieve listing data
- `GET /api/lookup/isbn?isbn=` - ISBN lookup service
- `GET /api/suggestions/price?isbn=&condition=` - Price suggestions

## Validation Schema

The form uses Zod for validation with the following schema:

```typescript
const listingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  author: z
    .string()
    .min(1, 'Author is required')
    .max(100, 'Author name too long'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description too long'),
  price: z
    .number()
    .min(0.01, 'Price must be greater than 0')
    .max(10000, 'Price too high'),
  condition: z.string().min(1, 'Please select a condition'),
  quantity: z
    .number()
    .min(1, 'Quantity must be at least 1')
    .max(100, 'Quantity too high'),
  isbn: z.string().optional(),
  language: z.string().min(1, 'Language is required'),
  category: z.string().min(1, 'Category is required'),
});
```

## Usage

### Basic Usage

```tsx
import UnifiedSellingFlow from '@/components/UnifiedSellingFlow';

function SellPage() {
  return (
    <div>
      <h1>Sell Your Books</h1>
      <UnifiedSellingFlow />
    </div>
  );
}
```

### With Initial Data

```tsx
<UnifiedSellingFlow
  initialData={{
    title: 'Sample Book',
    author: 'Sample Author',
    // ... other fields
  }}
  onComplete={data => {
    console.log('Listing completed:', data);
  }}
/>
```

## Migration from Legacy

### Removed Components

- `itemListingForm.jsx` - Legacy form component (removed)
- `ImprovedSellingProcess.tsx` - Replaced by `UnifiedSellingFlow.tsx`

### Updated References

- All imports of `itemListingForm` have been updated to use `UnifiedSellingFlow`
- Test files updated to use the new component
- No breaking changes to the `/sell` page interface

## Future Enhancements

The following features will be added in subsequent PRs:

1. **API Integration** - Real Sanity CMS integration
2. **Autosave** - Debounced saving of form data
3. **Mobile Optimizations** - Camera capture, haptic feedback
4. **Smart Features** - ISBN lookup, price suggestions
5. **Analytics** - Event tracking and performance metrics

## Testing

The component includes comprehensive tests covering:

- Form validation
- Image upload functionality
- Navigation between sections
- Error handling

Run tests with:

```bash
pnpm test
```

## Browser Support

- Modern browsers with ES6+ support
- Mobile browsers (iOS Safari, Chrome Mobile)
- Progressive enhancement for older browsers

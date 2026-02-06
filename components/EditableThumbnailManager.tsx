import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Trash2, Star, Upload, GripVertical } from 'lucide-react';
import { urlFor } from '@/utils/imageUrlBuilder';
import { cn } from '@/lib/utils';
import { uploadImagesToSanity } from '@/utils/uploadImageToSanity';

let heic2any: ((input: File) => Promise<Blob>) | undefined;

if (typeof window !== 'undefined') {
  import('heic2any').then(module => {
    heic2any = module.default as any;
  });
}

interface EditableThumbnailManagerProps {
  photos: { _key?: string; asset?: { _ref?: string } }[];
  bookId: string;
  onChange: (
    updatedPhotos: { _key?: string; asset?: { _ref?: string } }[]
  ) => void;
  isLoading?: boolean;
}

export default function EditableThumbnailManager({
  photos,
  bookId,
  onChange,
  isLoading = false,
}: EditableThumbnailManagerProps) {
  const [localPhotos, setLocalPhotos] = useState<
    { _key?: string; asset?: { _ref?: string } }[]
  >([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setLocalPhotos(photos || []);
  }, [photos]);

  const mainImage = localPhotos[0];

  const handleDelete = (index: number) => {
    // Prevent deletion if there's only one image
    if (localPhotos.length === 1) return;

    const updated = [...localPhotos];

    // Remove the image at the specified index
    updated.splice(index, 1);

    // If we delete the main image (index 0), the next image becomes the main one
    if (index === 0 && updated.length > 0) {
      // Move the next image to the front
      const newMain = updated[0];
      setLocalPhotos([newMain, ...updated.slice(1)]);
    } else {
      setLocalPhotos(updated);
    }

    onChange(updated);
  };

  const handleMakeMain = async (index: number) => {
    if (index === 0) return; // Prevent making the main image main again

    const newMain = localPhotos[index];
    const rest = localPhotos.filter((_, i) => i !== index);
    const reordered = [newMain, ...rest];

    // Update local state immediately for better UX
    setLocalPhotos(reordered);
    onChange(reordered);

    // Persist to database
    try {
      const response = await fetch(`/api/books/${bookId}/main-image`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageKey: newMain._key,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update main image');
      }
    } catch (error) {
      console.error('Error updating main image:', error);
      // Revert local state on error
      setLocalPhotos(localPhotos);
      onChange(localPhotos);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newPhotos = [...localPhotos];
    const draggedPhoto = newPhotos[draggedIndex];

    // Remove the dragged item
    newPhotos.splice(draggedIndex, 1);

    // Insert it at the new position
    newPhotos.splice(dropIndex, 0, draggedPhoto);

    setLocalPhotos(newPhotos);
    onChange(newPhotos);
    setDraggedIndex(null);

    // Persist the new order to the database
    try {
      const response = await fetch(`/api/my-books/${bookId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photos: newPhotos,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update image order');
      }
    } catch (error) {
      console.error('Error updating image order:', error);
      // Revert on error
      setLocalPhotos(localPhotos);
      onChange(localPhotos);
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);

    // Convert HEIC files to JPEG on the frontend
    const convertedFiles = await Promise.all(
      filesArray.map(async file => {
        if (file.type === 'image/heic' || file.name.endsWith('.heic')) {
          try {
            const blob = await (heic2any as any)({
              blob: file,
              toType: 'image/jpeg',
            });

            return new File(
              [blob as BlobPart],
              file.name.replace(/\.heic$/, '.jpg'),
              {
                type: 'image/jpeg',
              }
            );
          } catch (error) {
            console.error('HEIC conversion failed:', error);
            return null;
          }
        }

        return file; // Non-HEIC files are returned as-is
      })
    );

    const filteredFiles = convertedFiles.filter((file): file is File => !!file);

    try {
      const uploadedImages = await uploadImagesToSanity(filteredFiles);

      if (uploadedImages.length > 0) {
        const updatedPhotos = uploadedImages.map(image => ({
          _type: 'image',
          _key: image._key,
          asset: {
            _type: 'reference',
            _ref: image.asset._ref,
          },
        }));

        const updated = [...localPhotos, ...updatedPhotos];
        setLocalPhotos(updated);
        onChange(updated);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  // Disable upload button if there are 5 or more images
  const canUpload = localPhotos.length < 5;

  return (
    <div className='space-y-4'>
      {mainImage && (
        <div className='relative overflow-hidden rounded-lg border bg-background aspect-square'>
          <Image
            src={urlFor(mainImage?.asset?._ref) || '/islamiclibrary.jpg'}
            alt='Main image'
            className='h-full w-full object-contain'
            width={600}
            height={600}
          />
        </div>
      )}

      {/* Only show the upload button if there are less than or equal to 5 images */}
      {canUpload && (
        <div className='flex gap-2'>
          <Button
            onClick={handleUploadClick}
            variant='secondary'
            disabled={isLoading || localPhotos.length >= 5} // Disable if there are 5 or more images
          >
            {isLoading ? (
              <div className='flex items-center'>
                <div className='h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2' />
                Updating...
              </div>
            ) : (
              <>
                <Upload className='w-4 h-4 mr-2' /> Upload Image
              </>
            )}
          </Button>

          <input
            ref={fileInputRef}
            type='file'
            accept='image/*'
            hidden
            onChange={handleFileChange}
            disabled={isLoading}
          />
        </div>
      )}

      {/* Display thumbnails of images */}
      <div className='grid grid-cols-4 gap-4'>
        {localPhotos.map((photo, index) => (
          <div
            key={photo._key || index}
            className={cn(
              'relative aspect-square overflow-hidden rounded-lg border bg-background cursor-move',
              'transition-all hover:border-primary',
              index === 0 && 'ring-2 ring-primary ring-offset-2', // Highlight the main image
              isLoading && 'opacity-50',
              draggedIndex === index && 'opacity-50 scale-95'
            )}
            draggable={!isLoading}
            onDragStart={e => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={e => handleDrop(e, index)}
          >
            {/* Drag handle */}
            <div className='absolute top-1 left-1 z-10'>
              <div className='bg-black/50 rounded p-1'>
                <GripVertical className='h-3 w-3 text-white' />
              </div>
            </div>

            <Image
              src={urlFor(photo?.asset?._ref) || '/islamiclibrary.jpg'}
              alt={`Thumbnail ${index + 1}`}
              className='h-full w-full object-cover'
              width={150}
              height={150}
              onClick={() => !isLoading && handleMakeMain(index)}
            />

            {/* Show the 'Make Main' button only if it's not the main image */}
            {index !== 0 && (
              <div className='absolute top-1 right-1'>
                <Button
                  size='icon'
                  variant='secondary'
                  onClick={e => {
                    e.stopPropagation();
                    if (!isLoading) handleMakeMain(index);
                  }}
                  disabled={isLoading}
                >
                  <Star className='h-4 w-4' />
                </Button>
              </div>
            )}

            {/* Only show delete button if there's more than 1 image */}
            {localPhotos.length > 1 && index !== 0 && (
              <div className='absolute bottom-1 right-1'>
                <Button
                  size='icon'
                  variant='destructive'
                  onClick={e => {
                    e.stopPropagation();
                    if (!isLoading) handleDelete(index);
                  }}
                  disabled={isLoading || localPhotos.length === 1} // Disable if there is only 1 image
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </div>
            )}

            {/* Main image indicator */}
            {index === 0 && (
              <div className='absolute bottom-1 left-1'>
                <div className='bg-primary text-primary-foreground text-xs px-2 py-1 rounded'>
                  Main
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

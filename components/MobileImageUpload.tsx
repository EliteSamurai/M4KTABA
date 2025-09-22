'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Camera,
  Upload,
  RotateCw,
  Trash2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import {
  compressImage,
  isValidImage,
  isFileSizeValid,
  formatFileSize,
  rotateImage,
  CompressedImage,
} from '@/lib/imageUtils';
import { useToast } from '@/hooks/use-toast';

interface MobileImageUploadProps {
  images: File[];
  onImagesChange: (images: File[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
  className?: string;
}

export default function MobileImageUpload({
  images,
  onImagesChange,
  maxImages = 10,
  maxSizeMB = 10,
  className,
}: MobileImageUploadProps) {
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionResults, setCompressionResults] = useState<
    CompressedImage[]
  >([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Handle file selection
  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return;

      const fileArray = Array.from(files);

      // Validate files
      const validFiles = fileArray.filter(file => {
        if (!isValidImage(file)) {
          toast({
            title: 'Invalid File',
            description: `${file.name} is not a valid image file.`,
            variant: 'destructive',
          });
          return false;
        }

        if (!isFileSizeValid(file, maxSizeMB)) {
          toast({
            title: 'File Too Large',
            description: `${file.name} is larger than ${maxSizeMB}MB.`,
            variant: 'destructive',
          });
          return false;
        }

        return true;
      });

      if (validFiles.length === 0) return;

      // Check if adding these files would exceed the limit
      if (images.length + validFiles.length > maxImages) {
        toast({
          title: 'Too Many Images',
          description: `You can only upload up to ${maxImages} images.`,
          variant: 'destructive',
        });
        return;
      }

      setIsCompressing(true);

      try {
        // Debug: Log file information
        console.log(
          'Processing files:',
          validFiles.map(f => ({
            name: f.name,
            size: f.size,
            type: f.type,
            lastModified: f.lastModified,
          }))
        );

        // Compress images
        const compressedResults = await Promise.all(
          validFiles.map(async (file, index) => {
            try {
              console.log(
                `Compressing file ${index + 1}/${validFiles.length}:`,
                file.name
              );
              const result = await compressImage(file, {
                maxWidth: 1600,
                maxHeight: 1600,
              });
              console.log(`Compression successful for ${file.name}:`, {
                originalSize: result.originalSize,
                compressedSize: result.compressedSize,
                compressionRatio: result.compressionRatio,
              });
              return result;
            } catch (error) {
              console.error(`Compression failed for ${file.name}:`, error);
              throw error;
            }
          })
        );

        setCompressionResults(compressedResults);

        // Add compressed files to images
        const newImages = [
          ...images,
          ...compressedResults.map(result => result.file),
        ];
        onImagesChange(newImages);

        // Show compression summary
        const totalOriginalSize = compressedResults.reduce(
          (sum, result) => sum + result.originalSize,
          0
        );
        const totalCompressedSize = compressedResults.reduce(
          (sum, result) => sum + result.compressedSize,
          0
        );
        const avgCompression =
          ((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100;

        toast({
          title: 'Images Compressed',
          description: `Compressed ${validFiles.length} images, saved ${avgCompression.toFixed(1)}% space.`,
        });
      } catch (error) {
        console.error('Error compressing images:', error);
        toast({
          title: 'Compression Failed',
          description: 'Failed to compress images. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsCompressing(false);
      }
    },
    [images, maxImages, maxSizeMB, onImagesChange, toast]
  );

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  // Remove image
  const removeImage = useCallback(
    (index: number) => {
      const newImages = images.filter((_, i) => i !== index);
      onImagesChange(newImages);
    },
    [images, onImagesChange]
  );

  // Rotate image
  const rotateImageFile = useCallback(
    async (index: number) => {
      const file = images[index];
      if (!file) return;

      try {
        const rotatedFile = await rotateImage(file, 90);
        const newImages = [...images];
        newImages[index] = rotatedFile;
        onImagesChange(newImages);
      } catch (error) {
        console.error('Error rotating image:', error);
        toast({
          title: 'Rotation Failed',
          description: 'Failed to rotate image. Please try again.',
          variant: 'destructive',
        });
      }
    },
    [images, onImagesChange, toast]
  );

  // Open file picker
  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className='space-y-4'>
          <div className='mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center'>
            {isCompressing ? (
              <div className='w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin' />
            ) : (
              <Upload className='w-8 h-8 text-muted-foreground' />
            )}
          </div>

          <div>
            <h3 className='text-lg font-semibold mb-2'>
              {isCompressing ? 'Compressing Images...' : 'Upload Photos'}
            </h3>
            <p className='text-sm text-muted-foreground mb-4'>
              Drag and drop images here, or click to select
            </p>

            <div className='flex flex-col sm:flex-row gap-2 justify-center'>
              <Button
                type='button'
                onClick={openFilePicker}
                disabled={isCompressing || images.length >= maxImages}
                className='w-full sm:w-auto'
              >
                <Upload className='w-4 h-4 mr-2' />
                Choose Images
              </Button>

              <Button
                type='button'
                variant='outline'
                onClick={openFilePicker}
                disabled={isCompressing || images.length >= maxImages}
                className='w-full sm:w-auto'
              >
                <Camera className='w-4 h-4 mr-2' />
                Take Photo
              </Button>
            </div>
          </div>

          <div className='text-xs text-muted-foreground'>
            <p>• Upload up to {maxImages} images</p>
            <p>• Maximum {maxSizeMB}MB per image</p>
            <p>• Images will be automatically compressed</p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type='file'
          multiple
          accept='image/*'
          capture='environment'
          onChange={e => handleFiles(e.target.files)}
          className='hidden'
        />
      </div>

      {/* Compression Results */}
      {compressionResults.length > 0 && (
        <Alert>
          <CheckCircle className='h-4 w-4' />
          <AlertDescription>
            <div className='space-y-1'>
              <p className='font-medium'>Images compressed successfully!</p>
              <div className='text-sm space-y-1'>
                {compressionResults.map((result, index) => (
                  <div key={index} className='flex justify-between'>
                    <span>{result.file.name}</span>
                    <span className='text-muted-foreground'>
                      {formatFileSize(result.originalSize)} →{' '}
                      {formatFileSize(result.compressedSize)}(
                      {result.compressionRatio.toFixed(1)}% saved)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h4 className='font-medium'>
              Uploaded Images ({images.length}/{maxImages})
            </h4>
            <Badge variant='outline'>
              {images.length} image{images.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
            {images.map((file, index) => (
              <Card key={index} className='relative group'>
                <CardContent className='p-2'>
                  <div className='aspect-square relative overflow-hidden rounded'>
                    <Image
                      src={URL.createObjectURL(file)}
                      alt={`Upload ${index + 1}`}
                      fill
                      className='object-cover'
                    />

                    {/* Overlay with actions */}
                    <div className='absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2'>
                      <Button
                        type='button'
                        size='sm'
                        variant='secondary'
                        onClick={() => rotateImageFile(index)}
                        className='h-8 w-8 p-0'
                      >
                        <RotateCw className='w-4 h-4' />
                      </Button>
                      <Button
                        type='button'
                        size='sm'
                        variant='destructive'
                        onClick={() => removeImage(index)}
                        className='h-8 w-8 p-0'
                      >
                        <Trash2 className='w-4 h-4' />
                      </Button>
                    </div>
                  </div>

                  <div className='mt-2 text-xs text-muted-foreground text-center'>
                    {formatFileSize(file.size)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Mobile-specific instructions */}
      <div className='md:hidden'>
        <Alert>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>
            <div className='space-y-1'>
              <p className='font-medium'>Mobile Tips:</p>
              <ul className='text-sm space-y-1 list-disc list-inside'>
                <li>Tap "Take Photo" to use your camera</li>
                <li>Hold and drag to reorder images</li>
                <li>Tap and hold an image to rotate or delete</li>
                <li>Images are automatically compressed to save space</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}

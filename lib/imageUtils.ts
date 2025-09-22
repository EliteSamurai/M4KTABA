/**
 * Image compression and manipulation utilities
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export interface CompressedImage {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * Compress an image file to reduce file size
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<CompressedImage> {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.8,
    format = 'jpeg',
  } = options;

  // Validate file before processing
  if (!file || !file.type.startsWith('image/')) {
    throw new Error(
      `Invalid file type: ${file?.type || 'unknown'}. Please select a valid image file.`
    );
  }

  if (file.size === 0) {
    throw new Error('File is empty. Please select a valid image file.');
  }

  // Check for supported image formats
  const supportedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];
  if (!supportedTypes.includes(file.type.toLowerCase())) {
    throw new Error(
      `Unsupported image format: ${file.type}. Supported formats: ${supportedTypes.join(', ')}`
    );
  }

  // Check file size (max 50MB)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    throw new Error(
      `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum size: 50MB`
    );
  }

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    // Use FileReader instead of Image + blob URL to avoid CSP issues
    const reader = new FileReader();

    reader.onerror = () => {
      reject(
        new Error(
          `Failed to read file "${file.name}". Please ensure it's a valid image file.`
        )
      );
    };

    reader.onload = e => {
      const img = new Image();

      img.onerror = error => {
        console.error('Image load error:', {
          error,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          fileLastModified: file.lastModified,
        });

        reject(
          new Error(
            `Failed to load image "${file.name}" (${file.type}, ${file.size} bytes). Please ensure it's a valid image file and try again.`
          )
        );
      };

      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        reject(new Error(`Image load timeout: ${file.name}`));
      }, 10000); // 10 second timeout

      img.onload = () => {
        clearTimeout(timeout);
        try {
          // Validate image dimensions
          if (img.width === 0 || img.height === 0) {
            throw new Error(
              'Invalid image dimensions - image appears to be corrupted'
            );
          }

          // Calculate new dimensions while maintaining aspect ratio
          let { width, height } = img;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
          }

          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            blob => {
              if (!blob) {
                reject(
                  new Error('Failed to compress image - no blob generated')
                );
                return;
              }

              const compressedFile = new File([blob], file.name, {
                type: `image/${format}`,
                lastModified: Date.now(),
              });

              const originalSize = file.size;
              const compressedSize = blob.size;
              const compressionRatio =
                ((originalSize - compressedSize) / originalSize) * 100;

              resolve({
                file: compressedFile,
                originalSize,
                compressedSize,
                compressionRatio: Math.round(compressionRatio),
              });
            },
            `image/${format}`,
            quality
          );
        } catch (error) {
          clearTimeout(timeout);
          reject(
            new Error(
              `Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
          );
        }
      };

      // Set the image source from the FileReader result
      img.src = e.target?.result as string;
    };

    // Read the file as data URL to avoid CSP issues with blob URLs
    reader.readAsDataURL(file);
  });
}

/**
 * Compress multiple images in parallel
 */
export async function compressImages(
  files: File[],
  options?: CompressOptions
): Promise<CompressedImage[]> {
  const compressionPromises = files.map(file => compressImage(file, options));
  return Promise.all(compressionPromises);
}

/**
 * Check if file is a valid image
 */
export function isValidImage(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Check if file size is within limits
 */
export function isFileSizeValid(file: File, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Get file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Generate a thumbnail for an image
 */
export async function generateThumbnail(
  file: File,
  size: number = 150
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate thumbnail dimensions
      const ratio = Math.min(size / img.width, size / img.height);
      const width = img.width * ratio;
      const height = img.height * ratio;

      canvas.width = width;
      canvas.height = height;

      // Draw thumbnail
      ctx?.drawImage(img, 0, 0, width, height);

      const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
      resolve(thumbnailUrl);
    };

    img.onerror = () => reject(new Error('Failed to generate thumbnail'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Rotate an image by 90 degrees
 */
export async function rotateImage(
  file: File,
  degrees: number = 90
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Set canvas size based on rotation
      if (degrees === 90 || degrees === 270) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }

      // Rotate and draw
      ctx?.translate(canvas.width / 2, canvas.height / 2);
      ctx?.rotate((degrees * Math.PI) / 180);
      ctx?.drawImage(img, -img.width / 2, -img.height / 2);

      canvas.toBlob(
        blob => {
          if (!blob) {
            reject(new Error('Failed to rotate image'));
            return;
          }

          const rotatedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });

          resolve(rotatedFile);
        },
        file.type,
        0.9
      );
    };

    img.onerror = () => reject(new Error('Failed to load image for rotation'));
    img.src = URL.createObjectURL(file);
  });
}

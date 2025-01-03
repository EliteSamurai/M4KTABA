"use client";

import { useState } from "react";
import Image from "next/image";
import { urlFor } from "@/utils/imageUrlBuilder";
import { cn } from "@/lib/utils";
import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ThumbnailSwitcherProps {
  photos: any[];
}

export default function ThumbnailSwitcher({ photos }: ThumbnailSwitcherProps) {
  const [mainImage, setMainImage] = useState(photos[0] || null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });

  // Filter thumbnails using a unique identifier like `_key` or asset reference
  const thumbnails = photos.filter(
    (photo) =>
      (mainImage && photo.src !== mainImage.src) ||
      ((!photo?._key || photo?._key !== mainImage?._key) &&
        (!photo?.asset?._ref || photo?.asset?._ref !== mainImage?.asset?._ref))
  );

  const handleThumbnailClick = (selectedImage: any) => {
    setMainImage(selectedImage);
    setIsZoomed(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setZoomPosition({ x, y });
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-lg border bg-background">
        <div
          className="group relative aspect-square cursor-zoom-in"
          onMouseMove={handleMouseMove}
          onClick={toggleZoom}
        >
          {mainImage && (
            <>
              <Image
                src={urlFor(mainImage?.asset?._ref || mainImage)}
                alt="Product image"
                className={cn(
                  "h-full w-full object-contain transition-transform duration-300",
                  isZoomed && "scale-150"
                )}
                style={
                  isZoomed
                    ? {
                        transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                      }
                    : undefined
                }
                width={600}
                height={600}
                priority
              />
              <Button
                size="icon"
                variant="secondary"
                className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleZoom();
                }}
              >
                {isZoomed ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {thumbnails.map((photo, i) => (
          <button
            key={photo._key || `thumbnail-${i}`}
            onClick={() => handleThumbnailClick(photo)}
            className={cn(
              "relative aspect-square overflow-hidden rounded-lg border bg-background",
              "transition-all hover:border-primary",
              mainImage === photo && "ring-2 ring-primary ring-offset-2"
            )}
          >
            <Image
              src={urlFor(photo?.asset?._ref || photo)}
              alt={`Product thumbnail ${i + 1}`}
              className="h-full w-full object-cover"
              width={150}
              height={150}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

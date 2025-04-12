"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ReservationImageProps {
  src: string;
  alt?: string;
  className?: string;
  isBeforeImage?: boolean;
}

export function ReservationImage({ src, alt = "Rezervasyon fotoğrafı", className, isBeforeImage }: ReservationImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  return (
    <div className={cn("relative aspect-square rounded-md overflow-hidden border", className)}>
      {isLoading && <Skeleton className="w-full h-full absolute inset-0" />}
      
      {hasError ? (
        <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-sm">
          Fotoğraf yüklenemedi
        </div>
      ) : (
        <img 
          src={src} 
          alt={alt}
          className="w-full h-full object-cover"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
            console.error("Fotoğraf yüklenirken hata:", src);
          }}
        />
      )}
      
      {isBeforeImage !== undefined && !hasError && !isLoading && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
          {isBeforeImage ? "Öncesi" : "Sonrası"}
        </div>
      )}
    </div>
  );
} 
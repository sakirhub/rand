"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface ImageUploaderProps {
  onImagesSelected: (files: File[]) => void;
  maxImages?: number;
  label?: string;
  isUploading?: boolean;
}

export function ImageUploader({
  onImagesSelected,
  maxImages = 5,
  label = "Fotoğraf Yükle",
  isUploading = false,
}: ImageUploaderProps) {
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      
      // Maksimum fotoğraf sayısı kontrolü
      if (selectedFiles.length > maxImages) {
        alert(`En fazla ${maxImages} fotoğraf yükleyebilirsiniz.`);
        return;
      }
      
      // Önizleme URL'leri oluştur
      const urls = selectedFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(urls);
      
      // Seçilen dosyaları üst bileşene bildir
      onImagesSelected(selectedFiles);
    }
  };
  
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleRemoveImage = (index: number) => {
    // Önizleme URL'ini temizle
    URL.revokeObjectURL(previewUrls[index]);
    
    // Önizleme URL'lerini güncelle
    const newPreviewUrls = [...previewUrls];
    newPreviewUrls.splice(index, 1);
    setPreviewUrls(newPreviewUrls);
    
    // Dosya input'unu sıfırla
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
    // Seçilen dosyaları temizle
    onImagesSelected([]);
  };
  
  const handleRemoveAllImages = () => {
    // Tüm önizleme URL'lerini temizle
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setPreviewUrls([]);
    
    // Dosya input'unu sıfırla
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
    // Seçilen dosyaları temizle
    onImagesSelected([]);
  };
  
  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
      />
      
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={handleButtonClick}
          disabled={isUploading || previewUrls.length >= maxImages}
        >
          <Upload className="mr-2 h-4 w-4" />
          {label}
        </Button>
        
        {previewUrls.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemoveAllImages}
            disabled={isUploading}
          >
            <X className="mr-2 h-4 w-4" />
            Tümünü Kaldır
          </Button>
        )}
      </div>
      
      {previewUrls.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {previewUrls.map((url, index) => (
            <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
              <Image
                src={url}
                alt={`Önizleme ${index + 1}`}
                fill
                className="object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 rounded-full"
                onClick={() => handleRemoveImage(index)}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
      
      {previewUrls.length === 0 && (
        <div className="border border-dashed rounded-md p-8 flex flex-col items-center justify-center text-muted-foreground">
          <ImageIcon className="h-8 w-8 mb-2" />
          <p>Fotoğraf yüklemek için tıklayın veya sürükleyin</p>
          <p className="text-xs mt-1">En fazla {maxImages} fotoğraf, her biri 10MB'a kadar</p>
        </div>
      )}
    </div>
  );
} 
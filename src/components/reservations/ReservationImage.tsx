"use client";

import {useState} from "react";
import {Skeleton} from "@/components/ui/skeleton";
import {cn} from "@/lib/utils";
import Image from "next/image";

interface ReservationImageProps {
    id: string;
    imageUrl: string;
    alt: string;
}

export function ReservationImage({ id, imageUrl, alt }: ReservationImageProps) {
    const [error, setError] = useState(false);

    return (
        <div className="relative aspect-square rounded-md overflow-hidden border">
            <img
                src={error ? "/placeholder-image.jpg" : imageUrl}
                alt={alt}
                className="w-full h-full object-cover"
                onError={() => {
                    console.error("Resim yüklenirken hata:", imageUrl);
                    setError(true);
                }}
            />
        </div>
    );
} 
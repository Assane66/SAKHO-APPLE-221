// src/components/home-carousel.tsx
'use client';

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Image from "next/image";
import Link from "next/link";
import type { DocumentData } from "firebase/firestore";

interface HomeCarouselProps {
    banners: DocumentData[];
}

export function HomeCarousel({ banners }: HomeCarouselProps) {
    if (banners.length === 0) {
        return (
             <div className="aspect-[16/6] bg-muted animate-pulse rounded-lg" />
        );
    }

    return (
        <Carousel className="w-full" opts={{ loop: true }}>
            <CarouselContent>
                {banners.map((banner) => (
                    <CarouselItem key={banner.id}>
                        <Link href={banner.link || '#'} target="_blank" rel="noopener noreferrer">
                            <div className="relative aspect-[16/6] overflow-hidden rounded-lg">
                                <Image
                                    src={banner.imageUrl}
                                    priority
                                    fill
                                    alt={banner.name}
                                    className="object-cover"
                                />
                            </div>
                        </Link>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10 hidden sm:flex" />
            <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10 hidden sm:flex" />
        </Carousel>
    )
}

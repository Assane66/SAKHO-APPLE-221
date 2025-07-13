// src/components/home-carousel.tsx
'use client';

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import type { DocumentData } from "firebase/firestore";

interface HomeCarouselProps {
    banners: DocumentData[];
}

export function HomeCarousel({ banners }: HomeCarouselProps) {
    if (banners.length === 0) {
        return (
            <div className="mx-auto w-full lg:order-last">
                <Card className="overflow-hidden">
                    <CardContent className="p-0">
                    <Image
                        src="https://placehold.co/600x600.png"
                        width={600}
                        height={600}
                        alt="Placeholder Banner"
                        className="mx-auto aspect-square overflow-hidden rounded-xl object-cover"
                    />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <Carousel className="w-full" opts={{ loop: true }}>
            <CarouselContent>
                {banners.map((banner) => (
                    <CarouselItem key={banner.id}>
                        <Link href={banner.link || '#'} target="_blank" rel="noopener noreferrer">
                            <Card className="overflow-hidden">
                                <CardContent className="p-0">
                                    <Image
                                        src={banner.imageUrl}
                                        width={600}
                                        height={600}
                                        alt={banner.name}
                                        className="mx-auto aspect-square overflow-hidden rounded-xl object-cover"
                                    />
                                </CardContent>
                            </Card>
                        </Link>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
        </Carousel>
    )
}

import React from 'react';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';

const sponsorImages = [
  'https://res.cloudinary.com/dhf7udqhi/image/upload/v1763391453/WhatsApp_Image_2025-11-17_at_20.21.00_a67734fa_fgbqdl.jpg',
  'https://res.cloudinary.com/dhf7udqhi/image/upload/v1763391437/WhatsApp_Image_2025-11-17_at_20.20.59_7307ca2c_uruxho.jpg',
  'https://res.cloudinary.com/dhf7udqhi/image/upload/v1763391423/WhatsApp_Image_2025-11-17_at_20.24.21_a80e705c_tprez9.jpg',
  'https://res.cloudinary.com/dhf7udqhi/image/upload/v1763391405/WhatsApp_Image_2025-11-17_at_20.24.22_7bb44bfa_h3afw4.jpg',
  'https://res.cloudinary.com/dhf7udqhi/image/upload/v1763391387/WhatsApp_Image_2025-11-17_at_20.24.22_399f83c7_f2inni.jpg',
  'https://res.cloudinary.com/dhf7udqhi/image/upload/v1763391364/WhatsApp_Image_2025-11-17_at_20.25.42_e83a3d45_qpbxgc.jpg',
];

const beltImages = [...sponsorImages, ...sponsorImages];

function optimizeCloudinaryUrl(url: string) {
  const uploadSegment = '/upload/';
  if (!url.includes('res.cloudinary.com') || !url.includes(uploadSegment)) return url;

  const [prefix, rest] = url.split(uploadSegment);
  if (!rest || rest.startsWith('f_auto')) return url;

  return `${prefix}${uploadSegment}f_auto,q_auto,w_800/${rest}`;
}

const SponsorCarousel: React.FC = () => {
  const [api, setApi] = React.useState<CarouselApi | null>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;

    const interval = setInterval(() => {
      api.scrollPrev();
    }, 3000);

    return () => clearInterval(interval);
  }, [api]);

  React.useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setActiveIndex(api.selectedScrollSnap());
    };

    onSelect();
    api.on('select', onSelect);

    return () => {
      api.off('select', onSelect);
    };
  }, [api]);

  return (
    <section className="py-10 bg-gray-50 dark:bg-gray-900/60 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
              Our Sponsors
            </p>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
              Our valuable partners
            </h2>
          </div>
        </div>

        <div className="relative">
          <Carousel
            setApi={setApi}
            opts={{ align: 'center', loop: true }}
            className="w-full"
          >
            <CarouselContent className="items-center">
              {beltImages.map((url, index) => {
                const isActive = index === activeIndex;

                return (
                  <CarouselItem
                    key={index}
                    className="basis-[80%] sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6 flex items-center"
                  >
                    <div className="h-32 sm:h-40 w-full flex items-center justify-center px-4 sm:px-6 py-3">
                      <img
                        src={optimizeCloudinaryUrl(url)}
                        alt="Sponsor logo"
                        loading="lazy"
                        decoding="async"
                        className={cn(
                          'w-auto object-contain drop-shadow-sm transition-transform duration-300 max-h-[65%]',
                          isActive
                            ? 'scale-110 grayscale-0 opacity-100 -translate-y-1'
                            : 'scale-95 grayscale opacity-70 translate-y-0'
                        )}
                      />
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </section>
  );
};

export default SponsorCarousel;

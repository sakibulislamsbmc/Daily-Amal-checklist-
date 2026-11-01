import React, { useState, useEffect, useRef } from 'react';

const BANNER_IMAGES = [
  'https://www.image2url.com/r2/default/images/1793555758856-a8e28f56-e07f-4567-97d3-f584fc306990.jpg',
  'https://www.image2url.com/r2/default/images/1793555778701-fba08872-0c6c-4963-9a93-121db3cd2257.jpg',
  'https://www.image2url.com/r2/default/images/1793555830020-129d60c3-5bd2-4735-b6aa-2a5239d8c645.jpg',
  'https://www.image2url.com/r2/default/images/1793558346889-ed8fe70c-5bfd-4a85-a172-d669f6c502bc.png',
  'https://www.image2url.com/r2/default/images/1793556647518-9f4b99cd-9df1-4dea-88b8-14f165553e5a.png',
  'https://www.image2url.com/r2/default/images/1793556717281-a0c79d50-7e9a-4d82-b727-cc40b2986fe4.jfif',
  'https://www.image2url.com/r2/default/images/1793557814615-7d2146ae-bf5e-4b45-9d99-5c2aa952a31b.jpg',
  'https://www.image2url.com/r2/default/images/1793558533949-fadf910f-4258-4e9b-a105-92ef85e74db3.png',
];

// Append first slide at the end to create a seamless one-way (right-to-left) infinite loop
const EXTENDED_SLIDES = [...BANNER_IMAGES, BANNER_IMAGES[0]];

export const BannerAdsCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setCurrentIndex((prev) => prev + 1);
    }, 6000); // 6 seconds per slide (5.2s display + 0.8s smooth slide)

    return () => clearInterval(interval);
  }, []);

  // When reaching the cloned last slide, silently jump back to index 0 without reverse animation
  useEffect(() => {
    if (currentIndex === BANNER_IMAGES.length) {
      timeoutRef.current = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(0);
      }, 800); // Match transition duration (800ms)
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentIndex]);

  return (
    <div className="w-full my-2.5 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div
        className={`flex ${
          isTransitioning ? 'transition-transform duration-800 ease-in-out' : 'transition-none'
        }`}
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {EXTENDED_SLIDES.map((src, index) => (
          <div key={index} className="w-full shrink-0 flex items-center justify-center bg-slate-50">
            <img
              src={src}
              alt={`Banner ${(index % BANNER_IMAGES.length) + 1}`}
              className="w-full h-auto block object-cover"
              loading="eager"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

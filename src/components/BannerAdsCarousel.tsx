import React, { useState, useEffect } from 'react';

const BANNER_IMAGES = [
  'https://www.image2url.com/r2/default/images/1793555758856-a8e28f56-e07f-4567-97d3-f584fc306990.jpg',
  'https://www.image2url.com/r2/default/images/1793555778701-fba08872-0c6c-4963-9a93-121db3cd2257.jpg',
  'https://www.image2url.com/r2/default/images/1793555830020-129d60c3-5bd2-4735-b6aa-2a5239d8c645.jpg',
];

export const BannerAdsCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % BANNER_IMAGES.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full my-2.5 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {BANNER_IMAGES.map((src, index) => (
          <div key={index} className="w-full shrink-0">
            <img
              src={src}
              alt={`Banner ${index + 1}`}
              className="w-full h-auto block object-cover"
              loading="eager"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

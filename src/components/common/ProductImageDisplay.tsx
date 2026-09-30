import React, { useState } from 'react';

interface ProductImageDisplayProps {
  src: string;
  alt: string;
  category?: string;
  className?: string;
  aspectRatio?: 'square' | 'portrait' | 'landscape';
}

export const ProductImageDisplay: React.FC<ProductImageDisplayProps> = ({
  src,
  alt,
  category = 'Fashion',
  className = '',
  aspectRatio = 'portrait',
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const aspectClass =
    aspectRatio === 'square'
      ? 'aspect-square'
      : aspectRatio === 'landscape'
      ? 'aspect-[16/10]'
      : 'aspect-[3/4]';

  if (hasError || !src) {
    return (
      <div
        className={`relative w-full ${aspectClass} overflow-hidden bg-stone-100 flex flex-col items-center justify-center p-6 text-stone-500 border border-stone-200/50 ${className}`}
      >
        {/* Subtle geometric luxury backdrop */}
        <div className="absolute inset-0 bg-gradient-to-tr from-stone-200/60 via-stone-100/40 to-stone-200/30" />
        <div className="relative z-10 text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border border-stone-300 flex items-center justify-center mb-3 text-stone-600 bg-white/80 shadow-xs">
            <svg
              className="w-6 h-6 stroke-current"
              fill="none"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"
              />
            </svg>
          </div>
          <span className="text-[11px] tracking-widest uppercase font-medium text-stone-600">
            {category}
          </span>
          <p className="text-xs text-stone-700 font-serif italic mt-1 line-clamp-1 max-w-[180px]">
            {alt}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${aspectClass} overflow-hidden bg-stone-100 ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-stone-200 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};

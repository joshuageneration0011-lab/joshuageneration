import React, { useState, useEffect, useRef } from 'react';

interface SmoothImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  priority?: boolean;
}

export const SmoothImage: React.FC<SmoothImageProps> = ({ 
  src, 
  alt, 
  className, 
  priority = false, 
  ...props 
}) => {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (imgRef.current) {
      if (imgRef.current.complete) {
        setLoaded(true);
      } else {
        setLoaded(false);
      }
    } else {
      setLoaded(false);
    }
  }, [src]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-100">
      {/* Shimmering loading skeleton overlay */}
      {!loaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:400%_100%] animate-pulse" />
      )}
      <img
        ref={(el) => {
          imgRef.current = el;
          if (el && el.complete && !loaded) {
            setLoaded(true);
          }
        }}
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchpriority={priority ? 'high' : 'auto'}
        onLoad={() => setLoaded(true)}
        className={`${className || ''} transition-opacity duration-500 ease-in-out ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        {...props}
      />
    </div>
  );
};

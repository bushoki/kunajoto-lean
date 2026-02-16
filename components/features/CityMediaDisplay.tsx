/**
 * CityMediaDisplay Component
 * Displays embedded media content (YouTube, Vimeo videos, photo slideshows) for cities
 * Responsive design with support for multiple media types
 */

import React, { useState, useEffect } from 'react';
import { CityMedia } from '../../services/cityMediaService';

interface CityMediaDisplayProps {
  mediaItems: CityMedia[];
}

export default function CityMediaDisplay({ mediaItems }: CityMediaDisplayProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<{ [key: string]: number }>({});

  // Auto-advance photo slideshows every 5 seconds
  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];

    mediaItems.forEach((item) => {
      if (item.media_type === 'photo_slideshow' && item.photo_urls && item.photo_urls.length > 1) {
        const interval = setInterval(() => {
          setCurrentPhotoIndex((prev) => ({
            ...prev,
            [item.id]: ((prev[item.id] || 0) + 1) % item.photo_urls!.length
          }));
        }, 5000);
        intervals.push(interval);
      }
    });

    return () => {
      intervals.forEach((interval) => clearInterval(interval));
    };
  }, [mediaItems]);

  if (!mediaItems || mediaItems.length === 0) {
    return null;
  }

  const renderMedia = (item: CityMedia) => {
    switch (item.media_type) {
      case 'youtube':
        return (
          <div className="relative w-full" style={{ paddingBottom: '56.25%' /* 16:9 aspect ratio */ }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full rounded-lg"
              src={`https://www.youtube.com/embed/${item.video_id}?rel=0&modestbranding=1`}
              title={item.title || 'YouTube video'}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );

      case 'vimeo':
        return (
          <div className="relative w-full" style={{ paddingBottom: '56.25%' /* 16:9 aspect ratio */ }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full rounded-lg"
              src={`https://player.vimeo.com/video/${item.video_id}?title=0&byline=0&portrait=0`}
              title={item.title || 'Vimeo video'}
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
        );

      case 'photo_slideshow':
        if (!item.photo_urls || item.photo_urls.length === 0) return null;
        
        const currentIndex = currentPhotoIndex[item.id] || 0;
        const currentPhoto = item.photo_urls[currentIndex];

        return (
          <div className="relative w-full">
            {/* Photo Display */}
            <div className="relative w-full" style={{ paddingBottom: '56.25%' /* 16:9 aspect ratio */ }}>
              <img
                src={currentPhoto}
                alt={`${item.title || 'Photo'} ${currentIndex + 1}`}
                className="absolute top-0 left-0 w-full h-full object-cover rounded-lg"
              />
            </div>

            {/* Navigation Dots */}
            {item.photo_urls.length > 1 && (
              <div className="flex justify-center gap-2 mt-3">
                {item.photo_urls.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPhotoIndex((prev) => ({ ...prev, [item.id]: index }))}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      index === currentIndex
                        ? 'bg-orange-500 w-6'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to photo ${index + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Navigation Arrows for larger screens */}
            {item.photo_urls.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentPhotoIndex((prev) => ({
                    ...prev,
                    [item.id]: (currentIndex - 1 + item.photo_urls!.length) % item.photo_urls!.length
                  }))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200"
                  aria-label="Previous photo"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentPhotoIndex((prev) => ({
                    ...prev,
                    [item.id]: (currentIndex + 1) % item.photo_urls!.length
                  }))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200"
                  aria-label="Next photo"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <section className="space-y-6">
      {mediaItems.map((item) => (
        <div
          key={item.id}
          className="bg-white rounded-2xl shadow-lg p-6 transition-all duration-200 hover:shadow-xl"
        >
          {/* Title */}
          {item.title && (
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              {item.title}
            </h3>
          )}

          {/* Media Content */}
          {renderMedia(item)}

          {/* Description */}
          {item.description && (
            <p className="text-gray-600 mt-4 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>
      ))}
    </section>
  );
}

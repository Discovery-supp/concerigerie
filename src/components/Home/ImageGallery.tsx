import React from 'react';
import OptimizedImage from '../Common/OptimizedImage';

const ImageGallery: React.FC = () => {
  const images = [
    'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg',
    'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg',
    'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg',
    'https://images.pexels.com/photos/1396132/pexels-photo-1396132.jpeg',
    'https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg'
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-primary mb-4">
            Nos Propriétés
          </h2>
          <p className="text-lg text-secondary max-w-2xl mx-auto">
            Découvrez notre sélection d'hébergements de qualité supérieure
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative aspect-square overflow-hidden rounded-xl shadow-lg group"
            >
              <OptimizedImage
                src={image}
                alt={`Propriété ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ImageGallery;

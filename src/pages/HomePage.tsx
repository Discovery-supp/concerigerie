import React from 'react';
import Hero from '../components/Home/Hero';
import SearchSection from '../components/Home/SearchSection';
import ImageGallery from '../components/Home/ImageGallery';
import FeaturedProperties from '../components/Home/FeaturedProperties';
import ServicesSection from '../components/Home/ServicesSection';
import WhyChooseUs from '../components/Home/WhyChooseUs';

const HomePage: React.FC = () => {
  return (
    <div>
      <Hero />
      <SearchSection />
      <ImageGallery />
      <FeaturedProperties />
      <ServicesSection />
      <WhyChooseUs />
    </div>
  );
};

export default HomePage;
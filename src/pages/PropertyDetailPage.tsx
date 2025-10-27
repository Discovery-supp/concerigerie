import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Star, MapPin, Users, Bed, Bath, Wifi, Car, School as Pool, ChevronLeft, ChevronRight, Calendar, CreditCard } from 'lucide-react';
import OptimizedImage from '../components/Common/OptimizedImage';

const PropertyDetailPage: React.FC = () => {
  const { id } = useParams();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showBookingForm, setShowBookingForm] = useState(false);

  // Données d'exemple pour la propriété
  const property = {
    id: '1',
    title: 'Magnifique appartement avec vue sur le fleuve Congo',
    location: 'Gombe, Kinshasa',
    price: 85,
    rating: 4.8,
    reviews: 127,
    guests: 4,
    bedrooms: 2,
    bathrooms: 2,
    beds: 2,
    surface: 120,
    images: [
      'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg',
      'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg',
      'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg',
      'https://images.pexels.com/photos/1396132/pexels-photo-1396132.jpeg',
      'https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg'
    ],
    amenities: ['wifi', 'parking', 'pool', 'kitchen', 'tv', 'ac'],
    type: 'Appartement',
    description: 'Superbe appartement moderne situé au cœur de Gombe avec une vue imprenable sur le fleuve Congo. Parfait pour les voyageurs d\'affaires et les touristes souhaitant découvrir Kinshasa dans le confort et l\'élégance.',
    neighborhood: 'Gombe',
    beachAccess: false,
    category: 'Luxe',
    cleaningFee: 25,
    serviceFee: 0.12,
    checkIn: '15:00',
    checkOut: '11:00',
    rules: [
      'Pas de fêtes ou d\'événements',
      'Pas de fumée',
      'Pas d\'animaux domestiques',
      'Arrivée autonome avec boîte à clés'
    ],
    host: {
      name: 'Marie Kabila',
      image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
      joinedYear: 2020,
      reviewsCount: 89,
      rating: 4.9
    }
  };

  const amenityIcons = {
    wifi: { icon: Wifi, label: 'Wi-Fi' },
    parking: { icon: Car, label: 'Parking' },
    pool: { icon: Pool, label: 'Piscine' },
    kitchen: { icon: Users, label: 'Cuisine' },
    tv: { icon: Users, label: 'Télévision' },
    ac: { icon: Users, label: 'Climatisation' }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
  };

  const calculateTotal = (nights: number) => {
    const subtotal = nights * property.price;
    const cleaning = property.cleaningFee;
    const serviceFee = (subtotal + cleaning) * property.serviceFee;
    return subtotal + cleaning + serviceFee;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-heading text-primary mb-2">
            {property.title}
          </h1>
          <div className="flex items-center space-x-4 text-secondary">
            <div className="flex items-center">
              <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
              <span className="font-medium">{property.rating}</span>
              <span className="ml-1">({property.reviews} avis)</span>
            </div>
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{property.location}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenu principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Galerie d'images */}
            <div className="relative">
              <div className="aspect-video bg-gray-200 rounded-2xl overflow-hidden">
                <OptimizedImage
                  src={property.images[currentImageIndex]}
                  alt={`Image ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                
                {/* Contrôles de navigation */}
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white bg-opacity-80 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white bg-opacity-80 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Indicateurs */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {property.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                      }`}
                    />
                  ))}
                </div>

                {/* Compteur d'images */}
                <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {property.images.length}
                </div>
              </div>

              {/* Miniatures */}
              <div className="grid grid-cols-5 gap-2 mt-4">
                {property.images.slice(0, 5).map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Miniature ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Informations sur l'hôte */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center space-x-4 mb-4">
                <img
                  src={property.host.image}
                  alt={property.host.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h3 className="text-xl font-semibold text-primary">
                    Hébergement proposé par {property.host.name}
                  </h3>
                  <div className="flex items-center space-x-4 text-secondary text-sm">
                    <span>{property.guests} voyageurs</span>
                    <span>{property.bedrooms} chambres</span>
                    <span>{property.beds} lits</span>
                    <span>{property.bathrooms} salles de bain</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-secondary">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                  <span>{property.host.rating} ({property.host.reviewsCount} avis)</span>
                </div>
                <span>Hôte depuis {property.host.joinedYear}</span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold font-heading text-primary mb-4">
                À propos de ce logement
              </h3>
              <p className="text-secondary leading-relaxed">
                {property.description}
              </p>
            </div>

            {/* Équipements */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold font-heading text-primary mb-4">
                Équipements proposés
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {property.amenities.map((amenity, index) => {
                  const amenityInfo = amenityIcons[amenity as keyof typeof amenityIcons];
                  return amenityInfo ? (
                    <div key={index} className="flex items-center space-x-3">
                      <amenityInfo.icon className="w-5 h-5 text-primary" />
                      <span className="text-secondary">{amenityInfo.label}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>

            {/* Règles de la maison */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold font-heading text-primary mb-4">
                Règles de la maison
              </h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span className="text-secondary">Arrivée : après {property.checkIn}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span className="text-secondary">Départ : avant {property.checkOut}</span>
                </div>
                {property.rules.map((rule, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-secondary">{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar de réservation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-8">
              <div className="flex items-baseline justify-between mb-6">
                <div>
                  <span className="text-2xl font-bold text-primary">${property.price}</span>
                  <span className="text-secondary ml-1">par nuit</span>
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                  <span className="font-medium">{property.rating}</span>
                  <span className="text-secondary ml-1">({property.reviews})</span>
                </div>
              </div>

              {!showBookingForm ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="border border-light-gray rounded-lg p-3">
                      <label className="block text-xs font-medium text-secondary mb-1">ARRIVÉE</label>
                      <input
                        type="date"
                        className="w-full text-sm border-none p-0 focus:ring-0"
                      />
                    </div>
                    <div className="border border-light-gray rounded-lg p-3">
                      <label className="block text-xs font-medium text-secondary mb-1">DÉPART</label>
                      <input
                        type="date"
                        className="w-full text-sm border-none p-0 focus:ring-0"
                      />
                    </div>
                  </div>

                  <div className="border border-light-gray rounded-lg p-3">
                    <label className="block text-xs font-medium text-secondary mb-1">VOYAGEURS</label>
                    <select className="w-full text-sm border-none p-0 focus:ring-0">
                      <option>1 voyageur</option>
                      <option>2 voyageurs</option>
                      <option>3 voyageurs</option>
                      <option>4 voyageurs</option>
                    </select>
                  </div>

                  <button
                    onClick={() => setShowBookingForm(true)}
                    className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-light transition-colors"
                  >
                    Réserver
                  </button>

                  <p className="text-center text-sm text-secondary">
                    Aucun montant ne vous sera débité pour le moment
                  </p>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>${property.price} × 3 nuits</span>
                      <span>${property.price * 3}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Frais de ménage</span>
                      <span>${property.cleaningFee}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Frais de service</span>
                      <span>${((property.price * 3 + property.cleaningFee) * property.serviceFee).toFixed(2)}</span>
                    </div>
                    <hr className="my-2" />
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>${calculateTotal(3).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="font-semibold text-primary">Finaliser la réservation</h4>
                  
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Prénom"
                      className="w-full px-3 py-2 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Nom"
                      className="w-full px-3 py-2 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      className="w-full px-3 py-2 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <input
                      type="tel"
                      placeholder="Téléphone"
                      className="w-full px-3 py-2 border border-light-gray rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <h5 className="font-medium text-primary mb-2">Mode de paiement</h5>
                    <div className="space-y-2">
                      <label className="flex items-center p-3 border border-light-gray rounded-lg cursor-pointer hover:border-primary">
                        <input type="radio" name="payment" className="mr-3 text-primary" />
                        <CreditCard className="w-4 h-4 mr-2" />
                        <span className="text-sm">Carte bancaire</span>
                      </label>
                      <label className="flex items-center p-3 border border-light-gray rounded-lg cursor-pointer hover:border-primary">
                        <input type="radio" name="payment" className="mr-3 text-primary" />
                        <span className="text-sm">Mobile Money</span>
                      </label>
                      <label className="flex items-center p-3 border border-light-gray rounded-lg cursor-pointer hover:border-primary">
                        <input type="radio" name="payment" className="mr-3 text-primary" />
                        <span className="text-sm">Espèces</span>
                      </label>
                    </div>
                  </div>

                  <button className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-light transition-colors">
                    Confirmer et payer
                  </button>

                  <button
                    onClick={() => setShowBookingForm(false)}
                    className="w-full py-2 text-secondary hover:text-primary transition-colors"
                  >
                    Retour
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailPage;
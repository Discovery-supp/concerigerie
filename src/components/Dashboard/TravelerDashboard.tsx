import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Calendar, 
  MapPin, 
  Star, 
  MessageCircle, 
  Search, 
  Bell, 
  Gift, 
  Headphones,
  Clock,
  CheckCircle,
  AlertCircle,
  Heart,
  Filter,
  TrendingUp,
  DollarSign
} from 'lucide-react';

interface Reservation {
  id: string;
  property_id: string;
  check_in: string;
  check_out: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'pending' | 'paid' | 'refunded';
  property_title?: string;
  property_address?: string;
  property_images?: string[];
  special_requests?: string;
}

interface Review {
  id: string;
  property_id: string;
  rating: number;
  comment: string;
  created_at: string;
  property_title?: string;
}

interface Property {
  id: string;
  title: string;
  address: string;
  price_per_night: number;
  images: string[];
  rating: number;
  reviews_count: number;
  type: string;
  max_guests: number;
}

interface TravelerStats {
  totalReservations: number;
  completedStays: number;
  totalSpent: number;
  averageRating: number;
  favoriteDestinations: number;
}

const TravelerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<TravelerStats>({
    totalReservations: 0,
    completedStays: 0,
    totalSpent: 0,
    averageRating: 0,
    favoriteDestinations: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('current');
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [propertyType, setPropertyType] = useState('all');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Charger les réservations du voyageur
      const { data: reservationsData } = await supabase
        .from('reservations')
        .select(`
          *,
          properties!reservations_property_id_fkey(title, address, images)
        `)
        .eq('guest_id', user.id)
        .order('created_at', { ascending: false });

      setReservations(reservationsData || []);

      // Charger les avis du voyageur
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select(`
          *,
          properties!reviews_property_id_fkey(title)
        `)
        .eq('guest_id', user.id)
        .order('created_at', { ascending: false });

      setReviews(reviewsData || []);

      // Charger les propriétés disponibles
      const { data: propertiesData } = await supabase
        .from('properties')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(20);

      setProperties(propertiesData || []);

      // Calculer les statistiques
      calculateStats(reservationsData || [], reviewsData || []);

    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (reservations: Reservation[], reviews: Review[]) => {
    const completedStays = reservations.filter(r => r.status === 'completed').length;
    const totalSpent = reservations
      .filter(r => r.status === 'confirmed' || r.status === 'completed')
      .reduce((sum, r) => sum + r.total_amount, 0);

    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;

    setStats({
      totalReservations: reservations.length,
      completedStays,
      totalSpent,
      averageRating,
      favoriteDestinations: new Set(reservations.map(r => r.property_id)).size
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        property.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrice = property.price_per_night >= priceRange[0] && property.price_per_night <= priceRange[1];
    const matchesType = propertyType === 'all' || property.type === propertyType;
    
    return matchesSearch && matchesPrice && matchesType;
  });

  const currentReservations = reservations.filter(r => 
    r.status === 'confirmed' || r.status === 'pending'
  );

  const pastReservations = reservations.filter(r => 
    r.status === 'completed' || r.status === 'cancelled'
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord Voyageur</h1>
        <p className="text-gray-600 mt-1">Découvrez et gérez vos séjours</p>
      </div>

      {/* Statistiques personnelles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<Calendar className="w-8 h-8 text-blue-600" />}
          title="Réservations"
          value={stats.totalReservations}
          subtitle={`${stats.completedStays} séjours terminés`}
          bgColor="bg-blue-50"
        />
        <StatCard
          icon={<DollarSign className="w-8 h-8 text-green-600" />}
          title="Total dépensé"
          value={`€${stats.totalSpent.toFixed(2)}`}
          subtitle="Tous séjours confondus"
          bgColor="bg-green-50"
        />
        <StatCard
          icon={<Star className="w-8 h-8 text-yellow-600" />}
          title="Note moyenne"
          value={stats.averageRating.toFixed(1)}
          subtitle={`${reviews.length} avis donnés`}
          bgColor="bg-yellow-50"
        />
        <StatCard
          icon={<MapPin className="w-8 h-8 text-purple-600" />}
          title="Destinations"
          value={stats.favoriteDestinations}
          subtitle="Propriétés visitées"
          bgColor="bg-purple-50"
        />
      </div>

      {/* Actions rapides */}
      <div className="mt-8 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            title="Rechercher des propriétés"
            description="Trouvez votre prochaine destination"
            icon={<Search className="w-6 h-6" />}
            color="blue"
            onClick={() => navigate('/properties')}
          />
          <QuickActionCard
            title="Mes réservations"
            description="Gérer vos séjours"
            icon={<Calendar className="w-6 h-6" />}
            color="green"
            onClick={() => navigate('/my-reservations')}
          />
          <QuickActionCard
            title="Messages"
            description="Communiquer avec les hôtes"
            icon={<MessageCircle className="w-6 h-6" />}
            color="purple"
            onClick={() => navigate('/messages')}
          />
          <QuickActionCard
            title="Mes avis"
            description="Partager vos expériences"
            icon={<Star className="w-6 h-6" />}
            color="orange"
            onClick={() => navigate('/reviews')}
          />
        </div>
      </div>

      {/* Navigation par onglets */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'current', label: 'Réservations actuelles', icon: Calendar },
            { id: 'history', label: 'Historique', icon: Clock },
            { id: 'search', label: 'Rechercher', icon: Search },
            { id: 'reviews', label: 'Mes avis', icon: Star },
            { id: 'messages', label: 'Messages', icon: MessageCircle },
            { id: 'offers', label: 'Offres spéciales', icon: Gift }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                selectedTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Contenu des onglets */}
      {selectedTab === 'current' && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Réservations actuelles</h2>
          {currentReservations.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune réservation en cours</h3>
              <p className="text-gray-600 mb-4">Commencez par rechercher votre prochain séjour</p>
              <button
                onClick={() => setSelectedTab('search')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Rechercher des propriétés
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentReservations.map((reservation) => (
                <ReservationCard key={reservation.id} reservation={reservation} />
              ))}
            </div>
          )}
        </div>
      )}

      {selectedTab === 'history' && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Historique des séjours</h2>
          {pastReservations.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun séjour dans l'historique</h3>
              <p className="text-gray-600">Vos séjours terminés apparaîtront ici</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastReservations.map((reservation) => (
                <ReservationCard key={reservation.id} reservation={reservation} />
              ))}
            </div>
          )}
        </div>
      )}

      {selectedTab === 'search' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Rechercher des propriétés</h2>
            
            {/* Barre de recherche */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Rechercher par nom ou adresse..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Search className="w-4 h-4" />
              </button>
            </div>

            {/* Filtres */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prix par nuit</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type de propriété</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tous les types</option>
                  <option value="appartement">Appartement</option>
                  <option value="maison">Maison</option>
                  <option value="villa">Villa</option>
                  <option value="studio">Studio</option>
                </select>
              </div>
              <div className="flex items-end">
                <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                  <Filter className="w-4 h-4 inline mr-2" />
                  Plus de filtres
                </button>
              </div>
            </div>
          </div>

          {/* Résultats de recherche */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </div>
      )}

      {selectedTab === 'reviews' && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Mes avis</h2>
          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun avis donné</h3>
              <p className="text-gray-600">Laissez des avis après vos séjours</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {review.property_title}
                      </h3>
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= review.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedTab === 'messages' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Messages</h2>
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun message</h3>
            <p className="text-gray-600">Communiquez avec les propriétaires et l'administration</p>
          </div>
        </div>
      )}

      {selectedTab === 'offers' && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Offres spéciales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <OfferCard
              title="Réduction de 20%"
              description="Sur votre prochaine réservation"
              code="WELCOME20"
              validUntil="31/12/2024"
            />
            <OfferCard
              title="Séjour gratuit"
              description="Après 5 réservations"
              code="LOYALTY"
              validUntil="31/12/2024"
            />
            <OfferCard
              title="Week-end spécial"
              description="Réduction de 15% sur les week-ends"
              code="WEEKEND15"
              validUntil="31/12/2024"
            />
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  bgColor: string;
}> = ({ icon, title, value, subtitle, bgColor }) => (
  <div className={`${bgColor} rounded-xl p-6 shadow-sm`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div>{icon}</div>
    </div>
  </div>
);

const ReservationCard: React.FC<{ reservation: Reservation }> = ({ reservation }) => (
  <div className="bg-white rounded-lg shadow-sm border p-6">
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900">{reservation.property_title}</h3>
        <p className="text-sm text-gray-500">{reservation.property_address}</p>
      </div>
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
        reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
        reservation.status === 'cancelled' ? 'bg-red-100 text-red-800' :
        'bg-blue-100 text-blue-800'
      }`}>
        {reservation.status}
      </span>
    </div>
    <div className="space-y-2 text-sm text-gray-600">
      <div className="flex items-center space-x-2">
        <Calendar className="w-4 h-4" />
        <span>
          {new Date(reservation.check_in).toLocaleDateString('fr-FR')} - 
          {new Date(reservation.check_out).toLocaleDateString('fr-FR')}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold text-gray-900">€{reservation.total_amount}</span>
        <button className="text-blue-600 hover:text-blue-700 text-sm">
          Voir détails
        </button>
      </div>
    </div>
  </div>
);

const PropertyCard: React.FC<{ property: Property }> = ({ property }) => (
  <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
    {property.images && property.images.length > 0 && (
      <img
        src={property.images[0]}
        alt={property.title}
        className="w-full h-48 object-cover"
      />
    )}
    <div className="p-4">
      <h3 className="text-lg font-medium text-gray-900 mb-2">{property.title}</h3>
      <p className="text-sm text-gray-500 mb-2">{property.address}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Star className="w-4 h-4 text-yellow-400 fill-current" />
          <span className="text-sm text-gray-600">{property.rating}</span>
          <span className="text-sm text-gray-500">({property.reviews_count})</span>
        </div>
        <span className="text-lg font-semibold text-gray-900">€{property.price_per_night}/nuit</span>
      </div>
      <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        Voir détails
      </button>
    </div>
  </div>
);

const OfferCard: React.FC<{
  title: string;
  description: string;
  code: string;
  validUntil: string;
}> = ({ title, description, code, validUntil }) => (
  <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-sm text-blue-100 mb-4">{description}</p>
    <div className="bg-white bg-opacity-20 rounded-lg p-3 mb-4">
      <p className="text-sm font-mono text-center">{code}</p>
    </div>
    <p className="text-xs text-blue-200">Valide jusqu'au {validUntil}</p>
  </div>
);

const QuickActionCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}> = ({ title, description, icon, color, onClick }) => {
  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    orange: 'bg-orange-600 hover:bg-orange-700'
  };

  return (
    <button
      onClick={onClick}
      className={`${colorClasses[color as keyof typeof colorClasses]} text-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all text-left cursor-pointer`}
    >
      <div className="flex items-start space-x-4">
        <div className="bg-white bg-opacity-20 rounded-lg p-3">{icon}</div>
        <div>
          <h3 className="text-lg font-semibold mb-1">{title}</h3>
          <p className="text-sm text-white text-opacity-90">{description}</p>
        </div>
      </div>
    </button>
  );
};

export default TravelerDashboard;


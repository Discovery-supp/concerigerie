import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PropertyManagementForm from '../components/Forms/PropertyManagementForm';
import { ArrowLeft, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';

interface Property {
  id: string;
  title: string;
  description: string;
  type: string;
  address: string;
  price_per_night: number;
  images: string[];
  is_published: boolean;
  created_at: string;
}

const PropertyManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<string | null>(null);

  React.useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Erreur chargement propriétés:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePublish = async (propertyId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ is_published: !currentStatus })
        .eq('id', propertyId);

      if (error) throw error;

      setProperties(prev =>
        prev.map(p =>
          p.id === propertyId ? { ...p, is_published: !currentStatus } : p
        )
      );
    } catch (error) {
      console.error('Erreur mise à jour:', error);
    }
  };

  const deleteProperty = async (propertyId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette propriété ?')) return;

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;

      setProperties(prev => prev.filter(p => p.id !== propertyId));
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingProperty(null);
    loadProperties();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour au tableau de bord</span>
          </button>

          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Gestion des propriétés
              </h1>
              <p className="text-gray-600 mt-1">
                Gérez vos annonces et propriétés
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle propriété</span>
            </button>
          </div>
        </div>

        {showForm && (
          <div className="mb-8">
            <PropertyManagementForm
              propertyId={editingProperty || undefined}
              onSuccess={handleFormSuccess}
              onCancel={() => {
                setShowForm(false);
                setEditingProperty(null);
              }}
            />
          </div>
        )}

        {/* Liste des propriétés */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Mes propriétés ({properties.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Chargement...</p>
            </div>
          ) : properties.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune propriété
              </h3>
              <p className="text-gray-600 mb-4">
                Commencez par créer votre première propriété
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Créer une propriété
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {properties.map((property) => (
                <div key={property.id} className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {property.images.length > 0 ? (
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400 text-sm">Pas d'image</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {property.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {property.address}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {property.type} • €{property.price_per_night}/nuit
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              property.is_published
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {property.is_published ? (
                                <>
                                  <Eye className="w-3 h-3 mr-1" />
                                  Publié
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3 h-3 mr-1" />
                                  Brouillon
                                </>
                              )}
                            </span>
                            <span className="text-xs text-gray-500">
                              Créé le {new Date(property.created_at).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => togglePublish(property.id, property.is_published)}
                            className={`p-2 rounded-lg ${
                              property.is_published
                                ? 'text-orange-600 hover:bg-orange-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={property.is_published ? 'Dépublier' : 'Publier'}
                          >
                            {property.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => {
                              setEditingProperty(property.id);
                              setShowForm(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteProperty(property.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyManagementPage;

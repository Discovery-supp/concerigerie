import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, ArrowRight, Home, Image, DollarSign, CheckCircle, MapPin } from 'lucide-react';

const AddPropertyPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    // Étape 1: Informations de base
    property_type: '',
    title: '',
    description: '',
    max_guests: 1,
    bedrooms: 0,
    beds: 1,
    
    // Étape 2: Détails de la propriété
    address: '',
    commune: '',
    latitude: null as number | null,
    longitude: null as number | null,
    surface: 0,
    bathrooms: 0,
    check_in_time: '14:00',
    check_out_time: '11:00',
    
    // Étape 3: Équipements et services
    amenities: [] as string[],
    services: [] as string[],
    cancellation_policy: 'moderate',
    rules: [] as string[],
    house_rules_text: '',
    
    // Étape 4: Photos
    images: [] as string[],
    image_captions: [] as { url: string; caption: string }[],
    
    // Étape 5: Tarifs et disponibilités
    price_per_night: 0,
    cleaning_fee: 0,
    min_nights: 1,
    max_nights: 365,
    long_stay_discount_7: 0,
    long_stay_discount_30: 0,
  });

  const propertyTypes = [
    'Maison entière',
    'Appartement',
    'Chambre privée',
    'Studio',
    'Villa',
    'Chalet',
    'Chambre partagée'
  ];

  const baseAmenities = [
    'Wi-Fi',
    'Cuisine',
    'Télévision',
    'Parking gratuit',
    'Climatisation',
    'Chauffage',
    'Chauffe-eau'
  ];

  const additionalAmenities = [
    'Piscine',
    'Jacuzzi',
    'Salle de sport',
    'Petit déjeuner',
    'Espace de travail',
    'Barbecue',
    'Jouets pour enfants'
  ];

  const includedServices = [
    'Draps et serviettes',
    'Service de ménage',
    'Arrivée autonome'
  ];

  const cancellationPolicies = [
    { value: 'flexible', label: 'Flexible - Remboursement intégral jusqu\'à 7 jours avant', description: 'Remboursement intégral jusqu\'à 7 jours avant l\'arrivée' },
    { value: 'moderate', label: 'Modérée - Remboursement de 50% jusqu\'à 5 jours avant', description: 'Remboursement de 50% jusqu\'à 5 jours avant l\'arrivée' },
    { value: 'strict', label: 'Stricte - Remboursement intégral jusqu\'à 24h avant', description: 'Remboursement intégral jusqu\'à 24h avant l\'arrivée, puis aucun remboursement' }
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Supprimer l'erreur du champ modifié
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleCheckboxChange = (category: 'amenities' | 'services' | 'rules', value: string) => {
    setFormData(prev => {
      const current = prev[category];
      const index = current.indexOf(value);
      if (index > -1) {
        return { ...prev, [category]: current.filter(item => item !== value) };
      } else {
        return { ...prev, [category]: [...current, value] };
      }
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Limiter à 8 photos au total
    const remainingSlots = 8 - formData.images.length;
    if (remainingSlots <= 0) {
      alert('Vous ne pouvez ajouter que 8 photos maximum');
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Veuillez vous connecter pour ajouter des photos');
        return;
      }

      const uploadPromises = filesToUpload.map(async (file) => {
        // Vérifier la taille du fichier (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          alert(`Le fichier ${file.name} dépasse la taille maximale de 10MB`);
          return null;
        }

        // Vérifier le type de fichier
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!validTypes.includes(file.type)) {
          alert(`Le fichier ${file.name} n'est pas un format accepté (JPG ou PNG uniquement)`);
          return null;
        }

        const fileExt = file.name.split('.').pop()?.toLowerCase();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `properties/${fileName}`;

        try {
          // Upload vers Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('property-images')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            // Si le bucket n'existe pas, utiliser une URL temporaire ou base64
            console.warn('Erreur upload vers Supabase:', uploadError);
            
            // Alternative : convertir en base64 pour stockage temporaire
            return new Promise<string | null>((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                const base64 = e.target?.result as string;
                resolve(base64);
              };
              reader.onerror = () => resolve(null);
              reader.readAsDataURL(file);
            });
          }

          // Obtenir l'URL publique
          const { data: urlData } = supabase.storage
            .from('property-images')
            .getPublicUrl(filePath);

          return urlData.publicUrl;
        } catch (error) {
          console.error('Erreur lors de l\'upload:', error);
          // En cas d'erreur, utiliser base64 comme fallback
          return new Promise<string | null>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const base64 = e.target?.result as string;
              resolve(base64);
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
          });
        }
      });

      const uploadedUrls = (await Promise.all(uploadPromises)).filter(url => url !== null) as string[];
      
      if (uploadedUrls.length > 0) {
        setFormData(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls].slice(0, 8) }));
      }
    } catch (error: any) {
      console.error('Erreur générale upload:', error);
      alert('Erreur lors de l\'upload des photos: ' + error.message);
    }

    // Réinitialiser l'input pour permettre de sélectionner les mêmes fichiers
    event.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );

    if (files.length === 0) {
      alert('Veuillez glisser uniquement des fichiers image');
      return;
    }

    // Créer un faux événement pour réutiliser handleImageUpload
    const fakeEvent = {
      target: {
        files: files,
        value: ''
      }
    } as any;

    await handleImageUpload(fakeEvent);
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.property_type) newErrors.property_type = 'Type de propriété requis';
      if (!formData.title.trim()) newErrors.title = 'Titre requis';
      if (!formData.description.trim()) newErrors.description = 'Description requise';
      if (formData.max_guests < 1) newErrors.max_guests = 'Au moins 1 voyageur';
    }

    if (step === 2) {
      if (!formData.address.trim()) newErrors.address = 'Adresse requise';
      if (!formData.commune?.trim()) newErrors.commune = 'Commune requise';
      if (formData.surface <= 0) newErrors.surface = 'Superficie requise';
      if (formData.bathrooms < 0) newErrors.bathrooms = 'Nombre de salles de bain invalide';
    }

    if (step === 4) {
      if (formData.images.length === 0) newErrors.images = 'Au moins une photo est requise';
    }

    if (step === 5) {
      if (formData.price_per_night <= 0) newErrors.price_per_night = 'Prix par nuit requis';
      if (formData.min_nights < 1) newErrors.min_nights = 'Minimum 1 nuit';
      if (formData.max_nights < formData.min_nights) newErrors.max_nights = 'Maximum doit être supérieur au minimum';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const calculatePricePreview = (nights: number = 3) => {
    const basePrice = formData.price_per_night * nights;
    let discount = 0;
    
    if (nights >= 30 && formData.long_stay_discount_30 > 0) {
      discount = (basePrice * formData.long_stay_discount_30) / 100;
    } else if (nights >= 7 && formData.long_stay_discount_7 > 0) {
      discount = (basePrice * formData.long_stay_discount_7) / 100;
    }
    
    const subtotal = basePrice - discount;
    const cleaning = formData.cleaning_fee;
    const total = subtotal + cleaning;
    
    return { basePrice, discount, subtotal, cleaning, total, nights };
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      // Préparer les données pour l'insertion
      // S'assurer que les images sont bien formatées (pas de base64 si possible)
      const imagesArray = formData.images.length > 0 
        ? formData.images.filter(img => img && img.trim() !== '')
        : [];
      
      // Log pour déboguer
      console.log('Images à sauvegarder:', imagesArray);
      console.log('Nombre d\'images:', imagesArray.length);
      
      // Construire l'adresse complète avec commune
      const fullAddress = formData.commune 
        ? `${formData.address}, ${formData.commune}`
        : formData.address;

      const insertData = {
        owner_id: user.id,
        type: formData.property_type,
        title: formData.title,
        description: formData.description,
        address: fullAddress,
        commune: formData.commune || null,
        latitude: formData.latitude,
        longitude: formData.longitude,
        surface: formData.surface,
        max_guests: formData.max_guests,
        bedrooms: formData.bedrooms,
        beds: formData.beds,
        bathrooms: formData.bathrooms,
        price_per_night: formData.price_per_night,
        cleaning_fee: formData.cleaning_fee || 0,
        min_nights: formData.min_nights,
        max_nights: formData.max_nights,
        amenities: Array.isArray(formData.amenities) && formData.amenities.length > 0 ? formData.amenities : [],
        images: imagesArray,
        image_captions: formData.image_captions.length > 0 ? JSON.stringify(formData.image_captions) : null,
        cancellation_policy: formData.cancellation_policy,
        check_in_time: formData.check_in_time,
        check_out_time: formData.check_out_time,
        is_published: false,
        rules: formData.rules.length > 0 ? formData.rules : (formData.house_rules_text ? [formData.house_rules_text] : []),
        category: formData.property_type.toLowerCase()
      };
      
      console.log('Données à insérer:', { ...insertData, images: `[${imagesArray.length} images]` });

      const { data, error } = await supabase
        .from('properties')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Demander à l'utilisateur s'il veut publier maintenant
      const shouldPublish = confirm('Annonce créée avec succès !\n\nSouhaitez-vous la publier maintenant ?\n\n(Cliquez sur Annuler pour la publier plus tard depuis votre dashboard)');
      
      if (shouldPublish) {
        // Publier l'annonce immédiatement
        const { error: updateError } = await supabase
          .from('properties')
          .update({ is_published: true })
          .eq('id', data.id);
        
        if (updateError) {
          console.error('Erreur publication:', updateError);
          alert('Annonce créée mais erreur lors de la publication. Vous pourrez la publier depuis votre dashboard.');
        } else {
          alert('Annonce créée et publiée avec succès !');
        }
      }
      
      navigate(`/dashboard`);
    } catch (error: any) {
      console.error('Erreur création annonce:', error);
      alert('Erreur lors de la création de l\'annonce: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const preview = calculatePricePreview();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Créer une annonce</h1>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              Annuler
            </button>
          </div>

          {/* Barre de progression */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3, 4, 5].map(step => (
                <div key={step} className="flex items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      step <= currentStep
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step < currentStep ? <CheckCircle className="w-6 h-6" /> : step}
                  </div>
                  {step < 5 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        step < currentStep ? 'bg-primary' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Informations</span>
              <span>Détails</span>
              <span>Équipements</span>
              <span>Photos</span>
              <span>Tarifs</span>
            </div>
          </div>

          {/* Étape 1: Informations de base */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Informations de base</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de propriété *
                </label>
                <select
                  value={formData.property_type}
                  onChange={(e) => handleInputChange('property_type', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary ${
                    errors.property_type ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Sélectionnez un type</option>
                  {propertyTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.property_type && (
                  <p className="text-red-500 text-sm mt-1">{errors.property_type}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre de l'annonce *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Ex: Magnifique appartement avec vue sur mer"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={6}
                  placeholder="Décrivez votre propriété..."
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Voyageurs (1-20)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={formData.max_guests}
                    onChange={(e) => handleInputChange('max_guests', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chambres (0-20)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={formData.bedrooms}
                    onChange={(e) => handleInputChange('bedrooms', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lits (1-30)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.beds}
                    onChange={(e) => handleInputChange('beds', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Étape 2: Détails de la propriété */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Détails de la propriété</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse complète *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Ex: 123 Rue de la Plage"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary ${
                    errors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.address && (
                  <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commune *
                </label>
                <input
                  type="text"
                  value={formData.commune}
                  onChange={(e) => handleInputChange('commune', e.target.value)}
                  placeholder="Ex: Paris, Abidjan, etc."
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary ${
                    errors.commune ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.commune && (
                  <p className="text-red-500 text-sm mt-1">{errors.commune}</p>
                )}
              </div>

              {(formData.address || formData.commune) && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={async () => {
                      const fullAddress = `${formData.address}, ${formData.commune}`;
                      try {
                        // Utiliser l'API de géocodage (exemple avec Nominatim)
                        const response = await fetch(
                          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`
                        );
                        const data = await response.json();
                        if (data && data.length > 0) {
                          handleInputChange('latitude', parseFloat(data[0].lat));
                          handleInputChange('longitude', parseFloat(data[0].lon));
                          alert('Localisation trouvée ! Vous pouvez voir l\'emplacement sur la carte.');
                        } else {
                          alert('Adresse non trouvée. Veuillez vérifier l\'adresse.');
                        }
                      } catch (error) {
                        console.error('Erreur géocodage:', error);
                        alert('Erreur lors de la recherche de l\'adresse.');
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>Localiser sur la carte</span>
                  </button>
                  {formData.latitude && formData.longitude && (
                    <div className="mt-4">
                      <iframe
                        width="100%"
                        height="300"
                        style={{ border: 0 }}
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${formData.longitude - 0.01},${formData.latitude - 0.01},${formData.longitude + 0.01},${formData.latitude + 0.01}&layer=mapnik&marker=${formData.latitude},${formData.longitude}`}
                        allowFullScreen
                      ></iframe>
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${formData.latitude}&mlon=${formData.longitude}#map=15/${formData.latitude}/${formData.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 text-sm mt-2 inline-block"
                      >
                        Voir sur OpenStreetMap
                      </a>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Superficie (m²) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.surface}
                    onChange={(e) => handleInputChange('surface', parseFloat(e.target.value))}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary ${
                      errors.surface ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.surface && (
                    <p className="text-red-500 text-sm mt-1">{errors.surface}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Salles de bain (0-10)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={formData.bathrooms}
                    onChange={(e) => handleInputChange('bathrooms', parseInt(e.target.value))}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary ${
                      errors.bathrooms ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Heure d'arrivée
                  </label>
                  <input
                    type="time"
                    value={formData.check_in_time}
                    onChange={(e) => handleInputChange('check_in_time', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Heure de départ
                  </label>
                  <input
                    type="time"
                    value={formData.check_out_time}
                    onChange={(e) => handleInputChange('check_out_time', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Étape 3: Équipements et services */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Équipements et services</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Équipements de base
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {baseAmenities.map(amenity => (
                    <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.amenities.includes(amenity)}
                        onChange={() => handleCheckboxChange('amenities', amenity)}
                        className="w-4 h-4 text-primary rounded focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Équipements supplémentaires
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {additionalAmenities.map(amenity => (
                    <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.amenities.includes(amenity)}
                        onChange={() => handleCheckboxChange('amenities', amenity)}
                        className="w-4 h-4 text-primary rounded focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Services inclus
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {includedServices.map(service => (
                    <label key={service} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.services.includes(service)}
                        onChange={() => handleCheckboxChange('services', service)}
                        className="w-4 h-4 text-primary rounded focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700">{service}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Politique d'annulation *
                </label>
                <div className="space-y-2">
                  {cancellationPolicies.map(policy => (
                    <label
                      key={policy.value}
                      className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        formData.cancellation_policy === policy.value
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="cancellation_policy"
                        value={policy.value}
                        checked={formData.cancellation_policy === policy.value}
                        onChange={(e) => handleInputChange('cancellation_policy', e.target.value)}
                        className="mt-1 mr-3"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{policy.label}</p>
                        <p className="text-sm text-gray-600">{policy.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Règles de la maison
                </label>
                <textarea
                  value={formData.house_rules_text}
                  onChange={(e) => handleInputChange('house_rules_text', e.target.value)}
                  rows={4}
                  placeholder="Ex: Pas de fête, Pas de fumeurs, Animaux non acceptés..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {/* Étape 4: Photos */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Photos de votre propriété</h2>

              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
                onClick={() => document.getElementById('image-upload')?.click()}
              >
                <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <p className="text-primary hover:text-primary-light font-medium mb-2">
                  Cliquez pour télécharger ou glissez-déposez vos photos ici
                </p>
                <p className="text-sm text-gray-500">
                  Formats acceptés: JPG, PNG (max 10MB par image)
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Maximum 8 photos • {formData.images.length}/8 ajoutées
                </p>
              </div>

              {formData.images.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Aperçu des photos ({formData.images.length}/8) *
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Ajoutez une légende pour chaque photo pour identifier les pièces (ex: Salon, Chambre principale, Cuisine, etc.)
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.images.map((url, index) => {
                      const captionData = formData.image_captions.find(c => c.url === url);
                      return (
                        <div key={index} className="relative group border border-gray-200 rounded-lg overflow-hidden">
                          <img
                            src={url}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-32 object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Image';
                            }}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData(prev => ({
                                ...prev,
                                images: prev.images.filter((_, i) => i !== index),
                                image_captions: prev.image_captions.filter(c => c.url !== url)
                              }));
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            title="Supprimer cette photo"
                          >
                            ✕
                          </button>
                          <div className="p-2 bg-white">
                            <input
                              type="text"
                              value={captionData?.caption || ''}
                              onChange={(e) => {
                                const newCaptions = [...formData.image_captions];
                                const existingIndex = newCaptions.findIndex(c => c.url === url);
                                if (existingIndex >= 0) {
                                  newCaptions[existingIndex] = { url, caption: e.target.value };
                                } else {
                                  newCaptions.push({ url, caption: e.target.value });
                                }
                                handleInputChange('image_captions', newCaptions);
                              }}
                              placeholder="Légende (ex: Salon)"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary"
                            />
                          </div>
                        </div>
                      );
                    })}
                    {formData.images.length < 8 && (
                      <div
                        onClick={() => document.getElementById('image-upload')?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
                      >
                        <Image className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-xs text-gray-500">Ajouter</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {formData.images.length === 0 && (
                <div className="text-center py-8 text-red-500">
                  <p className="text-sm font-medium">⚠️ Aucune photo ajoutée</p>
                  <p className="text-xs mt-1">Les photos sont obligatoires pour créer une annonce</p>
                </div>
              )}
              {errors.images && (
                <p className="text-red-500 text-sm mt-2">{errors.images}</p>
              )}
            </div>
          )}

          {/* Étape 5: Tarifs et disponibilités */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Tarifs et disponibilités</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix par nuit ($) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price_per_night}
                    onChange={(e) => handleInputChange('price_per_night', parseFloat(e.target.value))}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary ${
                      errors.price_per_night ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.price_per_night && (
                    <p className="text-red-500 text-sm mt-1">{errors.price_per_night}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frais de ménage ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cleaning_fee}
                    onChange={(e) => handleInputChange('cleaning_fee', parseFloat(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nuitées minimum (1-30)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.min_nights}
                    onChange={(e) => handleInputChange('min_nights', parseInt(e.target.value))}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary ${
                      errors.min_nights ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nuitées maximum (1-365)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={formData.max_nights}
                    onChange={(e) => handleInputChange('max_nights', parseInt(e.target.value))}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary ${
                      errors.max_nights ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remise séjour 7 jours (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.long_stay_discount_7}
                    onChange={(e) => handleInputChange('long_stay_discount_7', parseFloat(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remise séjour 30 jours (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.long_stay_discount_30}
                    onChange={(e) => handleInputChange('long_stay_discount_30', parseFloat(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Aperçu des prix */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold mb-4">Aperçu des prix (exemple pour {preview.nights} nuits)</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>{formData.price_per_night} $ × {preview.nights} nuits</span>
                    <span>{preview.basePrice.toFixed(2)} $</span>
                  </div>
                  {preview.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Remise ({preview.nights >= 30 ? '30 jours' : '7 jours'})</span>
                      <span>-{preview.discount.toFixed(2)} $</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Frais de ménage</span>
                    <span>{preview.cleaning.toFixed(2)} $</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{preview.total.toFixed(2)} $</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Boutons de navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <button
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Précédent</span>
            </button>
            {currentStep < 5 ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-light flex items-center space-x-2"
              >
                <span>Suivant</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-light disabled:opacity-50 flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Création...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Publier l'annonce</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPropertyPage;


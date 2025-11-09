import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, X, Save, Lock, Unlock, Eye, EyeOff } from 'lucide-react';

interface PropertyAvailabilityManagerProps {
  propertyId: string;
  onClose: () => void;
}

const PropertyAvailabilityManager: React.FC<PropertyAvailabilityManagerProps> = ({ propertyId, onClose }) => {
  const [manuallyBlockedDates, setManuallyBlockedDates] = useState<string[]>([]);
  const [reservedDates, setReservedDates] = useState<string[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    loadPropertyData();
  }, [propertyId]);

  const loadPropertyData = async () => {
    try {
      // Charger les dates bloquées manuellement depuis la propriété
      const { data: property } = await supabase
        .from('properties')
        .select('blocked_dates, is_published')
        .eq('id', propertyId)
        .single();

      if (property) {
        setIsPublished(property.is_published || false);
        if (property.blocked_dates) {
          const dates = typeof property.blocked_dates === 'string' 
            ? JSON.parse(property.blocked_dates)
            : property.blocked_dates;
          setManuallyBlockedDates(Array.isArray(dates) ? dates : []);
        } else {
          setManuallyBlockedDates([]);
        }
      }

      // Charger aussi les dates bloquées par les réservations
      const { data: reservations } = await supabase
        .from('reservations')
        .select('check_in, check_out, status')
        .eq('property_id', propertyId)
        .in('status', ['confirmed', 'pending']);

      const reservationDates: string[] = [];
      reservations?.forEach(res => {
        const start = new Date(res.check_in);
        const end = new Date(res.check_out);
        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
          reservationDates.push(d.toISOString().split('T')[0]);
        }
      });

      setReservedDates(reservationDates);
    } catch (error) {
      console.error('Erreur chargement disponibilité:', error);
    }
  };

  const toggleDate = (dateString: string) => {
    // Ne pas permettre de bloquer les dates déjà réservées
    if (reservedDates.includes(dateString)) {
      alert('Cette date est déjà réservée et ne peut pas être modifiée');
      return;
    }

    // Vérifier si la date est déjà bloquée manuellement
    const isCurrentlyBlocked = manuallyBlockedDates.includes(dateString);
    const isInSelected = selectedDates.includes(dateString);

    setSelectedDates(prev => {
      if (isInSelected) {
        // Retirer de la sélection
        return prev.filter(d => d !== dateString);
      } else if (isCurrentlyBlocked) {
        // Si déjà bloquée, l'ajouter à la sélection pour la débloquer
        return [...prev, dateString];
      } else {
        // Ajouter à la sélection pour bloquer
        return [...prev, dateString];
      }
    });
  };

  const saveBlockedDates = async () => {
    setLoading(true);
    try {
      // Fusionner : ajouter les nouvelles sélections et retirer celles qui étaient déjà bloquées
      const updatedBlocked = [...manuallyBlockedDates];
      
      selectedDates.forEach(dateString => {
        if (manuallyBlockedDates.includes(dateString)) {
          // Si la date était déjà bloquée et est dans selectedDates, on la débloque
          const index = updatedBlocked.indexOf(dateString);
          if (index > -1) {
            updatedBlocked.splice(index, 1);
          }
        } else {
          // Si la date n'était pas bloquée et est dans selectedDates, on la bloque
          if (!updatedBlocked.includes(dateString) && !reservedDates.includes(dateString)) {
            updatedBlocked.push(dateString);
          }
        }
      });

      const { error } = await supabase
        .from('properties')
        .update({ 
          blocked_dates: updatedBlocked.length > 0 ? updatedBlocked : null,
          is_published: isPublished
        })
        .eq('id', propertyId);

      if (error) throw error;
      alert('Disponibilité mise à jour avec succès');
      loadPropertyData();
      setSelectedDates([]);
    } catch (error: any) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePublish = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('properties')
        .update({ is_published: !isPublished })
        .eq('id', propertyId);

      if (error) throw error;
      setIsPublished(!isPublished);
    } catch (error: any) {
      console.error('Erreur:', error);
      alert('Erreur lors de la mise à jour: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Jours du mois précédent
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Jours du mois actuel
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const isDateBlocked = (date: Date) => {
    const dateString = formatDate(date);
    return manuallyBlockedDates.includes(dateString) || selectedDates.includes(dateString);
  };

  const isDateReserved = (date: Date) => {
    const dateString = formatDate(date);
    return reservedDates.includes(dateString);
  };

  const days = getDaysInMonth(currentMonth);
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Gestion de la disponibilité</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Statut de publication */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Statut de la propriété</h3>
                <p className="text-sm text-gray-600">
                  {isPublished ? 'Propriété visible par les voyageurs' : 'Propriété masquée (non visible)'}
                </p>
              </div>
              <button
                onClick={togglePublish}
                disabled={loading}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                  isPublished
                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{isPublished ? 'Masquer' : 'Publier'}</span>
              </button>
            </div>
          </div>

          {/* Calendrier */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ←
              </button>
              <h3 className="text-lg font-semibold">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                →
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-4">
              {dayNames.map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-700 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {days.map((date, index) => {
                if (!date) {
                  return <div key={index} className="aspect-square"></div>;
                }

                const dateString = formatDate(date);
                const isBlocked = manuallyBlockedDates.includes(dateString);
                const isReserved = isDateReserved(date);
                const isSelected = selectedDates.includes(dateString);
                const isToday = formatDate(new Date()) === dateString;
                const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

                // Déterminer l'état visuel
                let bgColor = 'bg-white text-gray-900 border border-gray-200';
                let titleText = 'Cliquez pour bloquer cette date';
                
                if (isReserved) {
                  bgColor = 'bg-red-200 text-red-800 cursor-not-allowed';
                  titleText = 'Date réservée (non modifiable)';
                } else if (isSelected) {
                  if (isBlocked) {
                    bgColor = 'bg-orange-500 text-white';
                    titleText = 'Sélectionné pour débloquer - Cliquez pour annuler';
                  } else {
                    bgColor = 'bg-blue-600 text-white';
                    titleText = 'Sélectionné pour bloquer - Cliquez pour annuler';
                  }
                } else if (isBlocked) {
                  bgColor = 'bg-gray-400 text-white';
                  titleText = 'Date bloquée manuellement - Cliquez pour débloquer';
                } else if (isPast) {
                  bgColor = 'bg-gray-100 text-gray-400 cursor-not-allowed';
                  titleText = 'Date passée';
                } else if (isToday) {
                  bgColor = 'bg-blue-100 text-blue-700 border-2 border-blue-500';
                  titleText = "Aujourd'hui - Cliquez pour bloquer";
                }

                return (
                  <button
                    key={index}
                    onClick={() => !isReserved && !isPast && toggleDate(dateString)}
                    disabled={isReserved || isPast}
                    className={`aspect-square p-2 rounded-lg text-sm transition-colors hover:opacity-80 ${bgColor}`}
                    title={titleText}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Instructions */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-2">Comment utiliser le calendrier :</p>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Cliquez sur une date disponible (blanche) pour la bloquer</li>
                <li>Cliquez sur une date bloquée (gris foncé) pour la débloquer</li>
                <li>Les dates réservées (rouge) ne peuvent pas être modifiées</li>
                <li>N'oubliez pas de cliquer sur "Enregistrer" pour sauvegarder vos modifications</li>
              </ul>
            </div>

            {/* Légende */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-white border border-gray-200 rounded"></div>
                <span>Disponible</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-600 rounded"></div>
                <span>Sélectionné pour bloquer</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span>Sélectionné pour débloquer</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-400 rounded"></div>
                <span>Bloqué manuellement</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-200 rounded"></div>
                <span>Réservé (non modifiable)</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={saveBlockedDates}
              disabled={loading || selectedDates.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>
                    Enregistrer
                    {selectedDates.length > 0 && (
                      <span className="ml-2 bg-white bg-opacity-20 px-2 py-0.5 rounded-full text-xs">
                        {selectedDates.length} modification{selectedDates.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyAvailabilityManager;


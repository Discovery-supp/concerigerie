import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, Plus, Save, Trash2 } from 'lucide-react';

interface SpecialOffer {
  id?: string;
  property_id: string;
  title?: string | null;
  start_date: string;
  end_date: string;
  special_price_per_night: number;
  is_active: boolean;
}

interface SpecialOffersManagerProps {
  propertyId: string;
  onClose: () => void;
}

const createEmptyOffer = (propertyId: string): SpecialOffer => ({
  property_id: propertyId,
  title: '',
  start_date: '',
  end_date: '',
  special_price_per_night: 0,
  is_active: true,
});

const SpecialOffersManager: React.FC<SpecialOffersManagerProps> = ({
  propertyId,
  onClose,
}) => {
  const [offers, setOffers] = useState<SpecialOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadOffers();
  }, [propertyId]);

  const loadOffers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('special_offers')
        .select('*')
        .eq('property_id', propertyId)
        .order('start_date', { ascending: true });

      if (error) throw error;

      setOffers(
        (data || []).map((o: any) => ({
          ...o,
          special_price_per_night: Number(o.special_price_per_night) || 0,
        }))
      );
    } catch (e: any) {
      console.error('Erreur chargement offres spéciales:', e);
      setError(e.message || 'Impossible de charger les offres spéciales.');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (
    index: number,
    field: keyof SpecialOffer,
    value: string | number | boolean
  ) => {
    setOffers((prev) => {
      const updated = [...prev];
      const offer = { ...updated[index] };

      if (field === 'special_price_per_night') {
        const num = Number(value);
        offer.special_price_per_night = Number.isFinite(num) ? num : 0;
      } else if (field === 'is_active') {
        offer.is_active = Boolean(value);
      } else {
        // @ts-expect-error assign generic field
        offer[field] = value;
      }

      updated[index] = offer;
      return updated;
    });
  };

  const handleAddOffer = () => {
    setOffers((prev) => [createEmptyOffer(propertyId), ...prev]);
  };

  const handleDeleteOffer = async (offer: SpecialOffer, index: number) => {
    if (offer.id && !confirm('Supprimer cette offre spéciale ?')) return;

    try {
      if (offer.id) {
        const { error } = await supabase
          .from('special_offers')
          .delete()
          .eq('id', offer.id);
        if (error) throw error;
      }

      setOffers((prev) => prev.filter((_, i) => i !== index));
      setSuccess('Offre supprimée.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      console.error('Erreur suppression offre spéciale:', e);
      setError(e.message || 'Impossible de supprimer cette offre.');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const validOffers = offers.filter(
        (o) =>
          o.start_date &&
          o.end_date &&
          Number(o.special_price_per_night) > 0
      );

      for (const offer of validOffers) {
        if (!offer.id) {
          const { error } = await supabase.from('special_offers').insert({
            property_id: propertyId,
            title: offer.title || null,
            start_date: offer.start_date,
            end_date: offer.end_date,
            special_price_per_night: Number(offer.special_price_per_night),
            is_active: offer.is_active ?? true,
          });
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('special_offers')
            .update({
              title: offer.title || null,
              start_date: offer.start_date,
              end_date: offer.end_date,
              special_price_per_night: Number(offer.special_price_per_night),
              is_active: offer.is_active ?? true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', offer.id);
          if (error) throw error;
        }
      }

      setSuccess('Offres spéciales enregistrées.');
      await loadOffers();
    } catch (e: any) {
      console.error('Erreur enregistrement offres spéciales:', e);
      setError(e.message || 'Impossible d\'enregistrer les offres spéciales.');
    } finally {
      setSaving(false);
      setTimeout(() => setSuccess(null), 4000);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-2 py-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col">
        {/* Header fixe */}
        <div className="p-4 md:p-6 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">
              Offres spéciales / Tarifs saisonniers
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-green-700 disabled:bg-gray-400"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-800 text-sm px-2 py-1"
            >
              Fermer
            </button>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <p className="text-sm text-gray-600 mb-4">
            Définissez des prix spéciaux par nuit pour des périodes précises
            (par exemple, haute saison : juillet, août, novembre, décembre).
          </p>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-sm text-red-700 rounded-lg mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 text-sm text-green-700 rounded-lg mb-4">
              {success}
            </div>
          )}

          <div className="flex justify-start items-center mb-4">
            <button
              type="button"
              onClick={handleAddOffer}
              className="px-3 py-2 bg-primary text-white rounded-lg text-sm flex items-center gap-2 hover:bg-primary-light"
            >
              <Plus className="w-4 h-4" />
              Ajouter une offre
            </button>
          </div>

          {loading ? (
            <div className="py-6 text-center text-sm text-gray-500">
              Chargement des offres...
            </div>
          ) : offers.length === 0 ? (
            <div className="py-6 text-center text-sm text-gray-500">
              Aucune offre spéciale pour l&apos;instant. Cliquez sur
              &quot;Ajouter une offre&quot; pour commencer.
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {offers.map((offer, index) => (
                <div
                  key={offer.id || `offer-${index}`}
                  className="border border-gray-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
                >
                  <div className="md:col-span-3">
                    <label className="block text-xs text-gray-500 mb-1">
                      Nom de l&apos;offre (optionnel)
                    </label>
                    <input
                      type="text"
                      value={offer.title || ''}
                      onChange={(e) =>
                        handleFieldChange(index, 'title', e.target.value)
                      }
                      placeholder="Ex : Haute saison été"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs text-gray-500 mb-1">
                      Date de début
                    </label>
                    <input
                      type="date"
                      value={offer.start_date}
                      onChange={(e) =>
                        handleFieldChange(index, 'start_date', e.target.value)
                      }
                      min={today}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs text-gray-500 mb-1">
                      Date de fin
                    </label>
                    <input
                      type="date"
                      value={offer.end_date}
                      onChange={(e) =>
                        handleFieldChange(index, 'end_date', e.target.value)
                      }
                      min={offer.start_date || today}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">
                      Prix spécial / nuit
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-gray-500">
                        €
                      </span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={offer.special_price_per_night}
                        onChange={(e) =>
                          handleFieldChange(
                            index,
                            'special_price_per_night',
                            e.target.value
                          )
                        }
                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-xs text-gray-500 mb-1">
                      Actif
                    </label>
                    <label className="inline-flex items-center mt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={offer.is_active}
                        onChange={(e) =>
                          handleFieldChange(
                            index,
                            'is_active',
                            e.target.checked
                          )
                        }
                        className="rounded text-primary"
                      />
                      <span className="ml-2 text-xs text-gray-700">
                        {offer.is_active ? 'Oui' : 'Non'}
                      </span>
                    </label>
                  </div>
                  <div className="md:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleDeleteOffer(offer, index)}
                      className="px-2 py-1 text-xs text-red-600 hover:text-red-800 border border-red-100 hover:border-red-300 rounded-lg flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Supprimer
                    </button>
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

export default SpecialOffersManager;



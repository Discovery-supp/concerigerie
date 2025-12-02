import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Save, Trash2, RefreshCw } from 'lucide-react';

interface GlobalService {
  id: string;
  name: string;
  description: string | null;
  unit_price: number;
  billing_type: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

const emptyService = (): GlobalService => ({
  id: '',
  name: '',
  description: '',
  unit_price: 0,
  billing_type: 'per_day',
  is_active: true,
});

const GlobalServicesManager: React.FC = () => {
  const [services, setServices] = useState<GlobalService[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('global_services')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      setServices(
        (data || []).map((svc: any) => ({
          ...svc,
          unit_price: Number(svc.unit_price) || 0,
        }))
      );
    } catch (e: any) {
      console.error('Erreur chargement services globaux:', e);
      setError(e.message || 'Impossible de charger les services globaux.');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (
    index: number,
    field: keyof GlobalService,
    value: string | number | boolean
  ) => {
    setServices((prev) => {
      const updated = [...prev];
      const svc = { ...updated[index] };

      if (field === 'unit_price') {
        const num = Number(value);
        svc.unit_price = Number.isFinite(num) ? num : 0;
      } else if (field === 'is_active') {
        svc.is_active = Boolean(value);
      } else {
        // @ts-expect-error - assign generic field
        svc[field] = value;
      }

      updated[index] = svc;
      return updated;
    });
  };

  const handleAddService = () => {
    setServices((prev) => [emptyService(), ...prev]);
  };

  const handleDeleteService = async (service: GlobalService, index: number) => {
    if (service.id && !confirm('Supprimer définitivement ce service ?')) {
      return;
    }

    try {
      if (service.id) {
        const { error } = await supabase
          .from('global_services')
          .delete()
          .eq('id', service.id);
        if (error) throw error;
      }

      setServices((prev) => prev.filter((_, i) => i !== index));
      setSuccess('Service supprimé.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      console.error('Erreur suppression service global:', e);
      setError(e.message || 'Impossible de supprimer le service.');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Validation minimale
      const toSave = services.filter((s) => s.name.trim() !== '');

      const inserts = toSave.filter((s) => !s.id);
      const updates = toSave.filter((s) => s.id);

      if (inserts.length > 0) {
        const { error: insertError } = await supabase.from('global_services').insert(
          inserts.map((s) => ({
            name: s.name.trim(),
            description: s.description || null,
            unit_price: Number(s.unit_price) || 0,
            billing_type: s.billing_type || 'per_day',
            is_active: s.is_active ?? true,
          }))
        );
        if (insertError) throw insertError;
      }

      for (const s of updates) {
        const { error: updateError } = await supabase
          .from('global_services')
          .update({
            name: s.name.trim(),
            description: s.description || null,
            unit_price: Number(s.unit_price) || 0,
            billing_type: s.billing_type || 'per_day',
            is_active: s.is_active ?? true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', s.id);

        if (updateError) throw updateError;
      }

      setSuccess('Services globaux enregistrés avec succès.');
      await loadServices();
    } catch (e: any) {
      console.error('Erreur sauvegarde services globaux:', e);
      setError(e.message || 'Impossible d\'enregistrer les services.');
    } finally {
      setSaving(false);
      setTimeout(() => setSuccess(null), 4000);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            Gestion des services globaux
          </h3>
          <p className="text-sm text-gray-500">
            Configurez les services supplémentaires disponibles pour toutes les propriétés
            (prix fixes par jour).
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadServices}
            className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Recharger
          </button>
          <button
            type="button"
            onClick={handleAddService}
            className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Ajouter un service
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-light disabled:bg-gray-400 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">
          {success}
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-gray-500 text-sm">
          Chargement des services...
        </div>
      ) : services.length === 0 ? (
        <div className="py-8 text-center text-gray-500 text-sm">
          Aucun service configuré pour l&apos;instant. Cliquez sur &quot;Ajouter un service&quot; pour commencer.
        </div>
      ) : (
        <div className="space-y-4">
          {services.map((service, index) => (
            <div
              key={service.id || `new-${index}`}
              className="border border-gray-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-start"
            >
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Nom du service
                </label>
                <input
                  type="text"
                  value={service.name}
                  onChange={(e) =>
                    handleFieldChange(index, 'name', e.target.value)
                  }
                  placeholder="Ex : Ménage supplémentaire"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div className="md:col-span-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Description (optionnelle)
                </label>
                <input
                  type="text"
                  value={service.description || ''}
                  onChange={(e) =>
                    handleFieldChange(index, 'description', e.target.value)
                  }
                  placeholder="Détail du service pour les voyageurs"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Prix par jour
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500 text-xs">
                    €
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={service.unit_price}
                    onChange={(e) =>
                      handleFieldChange(index, 'unit_price', e.target.value)
                    }
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Type de facturation
                </label>
                <select
                  value={service.billing_type}
                  onChange={(e) =>
                    handleFieldChange(index, 'billing_type', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="per_day">Par jour</option>
                  <option value="per_stay">Par séjour</option>
                </select>
                <p className="mt-1 text-[10px] text-gray-400">
                  Actuellement, seuls les services &quot;par jour&quot; sont utilisés
                  dans le module de réservation.
                </p>
              </div>
              <div className="md:col-span-1 flex flex-col items-start md:items-center justify-between h-full">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Actif
                  </label>
                  <label className="inline-flex items-center mt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={service.is_active}
                      onChange={(e) =>
                        handleFieldChange(index, 'is_active', e.target.checked)
                      }
                      className="rounded text-primary"
                    />
                    <span className="ml-2 text-xs text-gray-700">
                      {service.is_active ? 'Oui' : 'Non'}
                    </span>
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteService(service, index)}
                  className="mt-3 md:mt-0 px-2 py-1 text-xs text-red-600 hover:text-red-800 border border-red-100 hover:border-red-300 rounded-lg flex items-center gap-1"
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
  );
};

export default GlobalServicesManager;





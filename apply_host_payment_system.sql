-- Script pour appliquer la migration du système de paiements aux hôtes
-- À exécuter dans l'interface Supabase SQL Editor

-- Table pour les configurations de commission
CREATE TABLE IF NOT EXISTS commission_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_percentage decimal(5,2) NOT NULL DEFAULT 10.00,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table pour les paiements aux hôtes
CREATE TABLE IF NOT EXISTS host_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  year integer NOT NULL CHECK (year >= 2020),
  total_reservations integer DEFAULT 0,
  total_revenue decimal(12,2) DEFAULT 0,
  commission_amount decimal(12,2) DEFAULT 0,
  host_earnings decimal(12,2) DEFAULT 0,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'paid', 'failed')),
  payment_method text,
  payment_reference text,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(host_id, month, year)
);

-- Table pour les détails des paiements par réservation
CREATE TABLE IF NOT EXISTS host_payment_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_payment_id uuid NOT NULL REFERENCES host_payments(id) ON DELETE CASCADE,
  reservation_id uuid NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  reservation_amount decimal(10,2) NOT NULL,
  commission_amount decimal(10,2) NOT NULL,
  host_amount decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Table pour les statistiques globales de l'application
CREATE TABLE IF NOT EXISTS app_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  year integer NOT NULL CHECK (year >= 2020),
  total_reservations integer DEFAULT 0,
  total_revenue decimal(12,2) DEFAULT 0,
  total_commission decimal(12,2) DEFAULT 0,
  total_host_payments decimal(12,2) DEFAULT 0,
  net_earnings decimal(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(month, year)
);

-- Activer RLS
ALTER TABLE commission_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_payment_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_earnings ENABLE ROW LEVEL SECURITY;

-- Politiques pour commission_settings (lecture publique, modification admin)
CREATE POLICY "Anyone can view commission settings"
  ON commission_settings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only admins can modify commission settings"
  ON commission_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  );

-- Politiques pour host_payments
CREATE POLICY "Hosts can view own payments"
  ON host_payments
  FOR SELECT
  TO authenticated
  USING (host_id = auth.uid());

CREATE POLICY "Admins can view all host payments"
  ON host_payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  );

CREATE POLICY "Admins can manage host payments"
  ON host_payments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  );

-- Politiques pour host_payment_details
CREATE POLICY "Hosts can view own payment details"
  ON host_payment_details
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM host_payments 
      WHERE id = host_payment_details.host_payment_id 
      AND host_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all payment details"
  ON host_payment_details
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  );

-- Politiques pour app_earnings
CREATE POLICY "Admins can view app earnings"
  ON app_earnings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  );

CREATE POLICY "Admins can manage app earnings"
  ON app_earnings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  );

-- Insérer les paramètres de commission par défaut
INSERT INTO commission_settings (commission_percentage, is_active) 
VALUES (10.00, true)
ON CONFLICT DO NOTHING;

-- Fonction pour calculer automatiquement les paiements aux hôtes
CREATE OR REPLACE FUNCTION calculate_host_payments(target_month integer, target_year integer)
RETURNS void AS $$
DECLARE
  commission_rate decimal(5,2);
  host_record RECORD;
  total_revenue decimal(12,2);
  commission_amount decimal(12,2);
  host_earnings decimal(12,2);
  reservation_count integer;
BEGIN
  -- Récupérer le taux de commission actuel
  SELECT commission_percentage INTO commission_rate
  FROM commission_settings 
  WHERE is_active = true 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  IF commission_rate IS NULL THEN
    commission_rate := 10.00; -- Valeur par défaut
  END IF;
  
  -- Parcourir tous les hôtes qui ont des réservations payées ce mois
  FOR host_record IN 
    SELECT DISTINCT p.owner_id as host_id
    FROM properties p
    INNER JOIN reservations r ON p.id = r.property_id
    WHERE EXTRACT(MONTH FROM r.created_at) = target_month
    AND EXTRACT(YEAR FROM r.created_at) = target_year
    AND r.payment_status = 'paid'
    AND r.status IN ('confirmed', 'completed')
  LOOP
    -- Calculer le total des revenus pour ce hôte ce mois
    SELECT 
      COALESCE(SUM(r.total_amount), 0),
      COUNT(r.id)
    INTO total_revenue, reservation_count
    FROM reservations r
    INNER JOIN properties p ON r.property_id = p.id
    WHERE p.owner_id = host_record.host_id
    AND EXTRACT(MONTH FROM r.created_at) = target_month
    AND EXTRACT(YEAR FROM r.created_at) = target_year
    AND r.payment_status = 'paid'
    AND r.status IN ('confirmed', 'completed');
    
    -- Calculer la commission et les gains du hôte
    commission_amount := total_revenue * (commission_rate / 100);
    host_earnings := total_revenue - commission_amount;
    
    -- Insérer ou mettre à jour le paiement du hôte
    INSERT INTO host_payments (
      host_id, month, year, total_reservations, total_revenue, 
      commission_amount, host_earnings, payment_status
    ) VALUES (
      host_record.host_id, target_month, target_year, reservation_count,
      total_revenue, commission_amount, host_earnings, 'pending'
    )
    ON CONFLICT (host_id, month, year) 
    DO UPDATE SET
      total_reservations = EXCLUDED.total_reservations,
      total_revenue = EXCLUDED.total_revenue,
      commission_amount = EXCLUDED.commission_amount,
      host_earnings = EXCLUDED.host_earnings,
      updated_at = now();
    
    -- Insérer les détails des paiements par réservation
    DELETE FROM host_payment_details 
    WHERE host_payment_id IN (
      SELECT id FROM host_payments 
      WHERE host_id = host_record.host_id 
      AND month = target_month 
      AND year = target_year
    );
    
    INSERT INTO host_payment_details (
      host_payment_id, reservation_id, reservation_amount, 
      commission_amount, host_amount
    )
    SELECT 
      hp.id,
      r.id,
      r.total_amount,
      r.total_amount * (commission_rate / 100),
      r.total_amount * (1 - commission_rate / 100)
    FROM reservations r
    INNER JOIN properties p ON r.property_id = p.id
    INNER JOIN host_payments hp ON hp.host_id = p.owner_id
    WHERE p.owner_id = host_record.host_id
    AND EXTRACT(MONTH FROM r.created_at) = target_month
    AND EXTRACT(YEAR FROM r.created_at) = target_year
    AND r.payment_status = 'paid'
    AND r.status IN ('confirmed', 'completed')
    AND hp.month = target_month
    AND hp.year = target_year;
  END LOOP;
  
  -- Calculer les statistiques globales de l'application
  SELECT 
    COALESCE(SUM(hp.total_reservations), 0),
    COALESCE(SUM(hp.total_revenue), 0),
    COALESCE(SUM(hp.commission_amount), 0),
    COALESCE(SUM(hp.host_earnings), 0)
  INTO reservation_count, total_revenue, commission_amount, host_earnings
  FROM host_payments hp
  WHERE hp.month = target_month AND hp.year = target_year;
  
  INSERT INTO app_earnings (
    month, year, total_reservations, total_revenue, 
    total_commission, total_host_payments, net_earnings
  ) VALUES (
    target_month, target_year, reservation_count, total_revenue,
    commission_amount, host_earnings, commission_amount
  )
  ON CONFLICT (month, year) 
  DO UPDATE SET
    total_reservations = EXCLUDED.total_reservations,
    total_revenue = EXCLUDED.total_revenue,
    total_commission = EXCLUDED.total_commission,
    total_host_payments = EXCLUDED.total_host_payments,
    net_earnings = EXCLUDED.net_earnings,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Fonction pour marquer un paiement comme effectué
CREATE OR REPLACE FUNCTION mark_host_payment_paid(
  payment_id uuid,
  payment_method_param text,
  payment_reference_param text
)
RETURNS void AS $$
BEGIN
  UPDATE host_payments 
  SET 
    payment_status = 'paid',
    payment_method = payment_method_param,
    payment_reference = payment_reference_param,
    paid_at = now(),
    updated_at = now()
  WHERE id = payment_id;
END;
$$ LANGUAGE plpgsql;



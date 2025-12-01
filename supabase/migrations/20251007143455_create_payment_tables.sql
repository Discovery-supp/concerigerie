/*
  # Création des tables de paiement et transactions

  1. Nouvelles Tables
    - `payment_methods`: Méthodes de paiement disponibles
      - `id` (uuid, primary key)
      - `name` (text): Nom de la méthode (Airtel Money, M-Pesa, Orange Money, Visa, etc.)
      - `type` (text): Type (mobile_money, bank_card, bank_transfer)
      - `provider` (text): Fournisseur
      - `is_active` (boolean): Actif ou non
      - `icon` (text): URL de l'icône
      - `created_at` (timestamptz)
      
    - `transactions`: Historique des transactions
      - `id` (uuid, primary key)
      - `reservation_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `amount` (numeric): Montant
      - `currency` (text): Devise (USD, CDF)
      - `payment_method_id` (uuid, foreign key)
      - `payment_method_type` (text): Type de méthode
      - `status` (text): pending, processing, completed, failed, refunded
      - `transaction_reference` (text): Référence unique
      - `phone_number` (text): Pour mobile money
      - `payment_details` (jsonb): Détails additionnels
      - `error_message` (text): Message d'erreur si échec
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can view their own transactions
    - Only authenticated users can create transactions
    - Admins can view all transactions
*/

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('mobile_money', 'bank_card', 'bank_transfer', 'cash')),
  provider text NOT NULL,
  is_active boolean DEFAULT true,
  icon text,
  created_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid REFERENCES reservations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'CDF')),
  payment_method_id uuid REFERENCES payment_methods(id),
  payment_method_type text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  transaction_reference text UNIQUE,
  phone_number text,
  payment_details jsonb DEFAULT '{}'::jsonb,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policies for payment_methods (public read)
CREATE POLICY "Anyone can view active payment methods"
  ON payment_methods
  FOR SELECT
  TO public
  USING (is_active = true);

-- Policies for transactions
CREATE POLICY "Users can view own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pending transactions"
  ON transactions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid());

-- Insert default payment methods
INSERT INTO payment_methods (name, type, provider, is_active) VALUES
  ('Airtel Money', 'mobile_money', 'Airtel', true),
  ('M-Pesa (Vodacom)', 'mobile_money', 'Vodacom', true),
  ('Orange Money', 'mobile_money', 'Orange', true),
  ('Visa', 'bank_card', 'Visa', true),
  ('Mastercard', 'bank_card', 'Mastercard', true),
  ('Virement Bancaire', 'bank_transfer', 'Bank', true),
  ('Espèces', 'cash', 'Cash', true)
ON CONFLICT DO NOTHING;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_reservation_id ON transactions(reservation_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
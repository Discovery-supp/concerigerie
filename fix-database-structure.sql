-- Fix database structure issues
-- Run this in Supabase SQL Editor

-- 1. Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 2. Ensure guest_id column exists in reviews table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'guest_id'
  ) THEN
    ALTER TABLE reviews ADD COLUMN guest_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_guest_id ON reviews(guest_id);
CREATE INDEX IF NOT EXISTS idx_reviews_property_id ON reviews(property_id);

-- 4. Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for notifications
DROP POLICY IF EXISTS "Users can read their own notifications" ON notifications;
CREATE POLICY "Users can read their own notifications" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 6. Fix reviews RLS policies
DROP POLICY IF EXISTS "Anyone can read reviews" ON reviews;
CREATE POLICY "Anyone can read reviews" ON reviews
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Guests can create reviews" ON reviews;
CREATE POLICY "Guests can create reviews" ON reviews
  FOR INSERT TO authenticated
  WITH CHECK (guest_id = auth.uid());

-- 7. Insert some sample notifications for testing
INSERT INTO notifications (user_id, type, title, message, data)
SELECT 
  id,
  'welcome',
  'Bienvenue sur Nzoo Immo !',
  'Découvrez nos propriétés exceptionnelles et réservez votre séjour de rêve.',
  '{"action": "explore_properties"}'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM notifications WHERE type = 'welcome')
ON CONFLICT DO NOTHING;

-- 8. Show success message
SELECT 'Database structure fixed successfully!' as message;

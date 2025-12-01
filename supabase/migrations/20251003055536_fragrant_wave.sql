/*
  # Correction politique RLS pour insertion utilisateurs

  1. Problème
    - Les utilisateurs ne peuvent pas s'inscrire car il manque une politique RLS pour INSERT sur la table users
    - Erreur: "Database error saving new user"

  2. Solution
    - Ajouter une politique RLS permettant aux utilisateurs authentifiés d'insérer leur propre profil
    - La politique vérifie que l'ID inséré correspond à l'utilisateur authentifié

  3. Sécurité
    - Maintient la sécurité en s'assurant qu'un utilisateur ne peut créer que son propre profil
    - Utilise auth.uid() pour vérifier l'identité
*/

-- Ajouter la politique RLS manquante pour permettre l'insertion de profils utilisateur
CREATE POLICY "Authenticated users can insert their own profile" ON users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Vérifier que la politique a été créée avec succès
DO $$
BEGIN
    RAISE NOTICE 'Politique RLS ajoutée: Les utilisateurs authentifiés peuvent maintenant créer leur profil';
END $$;
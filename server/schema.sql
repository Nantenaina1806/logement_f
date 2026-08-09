-- ============================================================
-- LOGEMENTMAD - BASE DE DONNEES POSTGRESQL
-- A copier/coller dans pgAdmin, dans la base : logement_vente_location
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'agent' CHECK (role IN ('admin', 'agent')),
  photo_profil TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(60) UNIQUE NOT NULL,
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quartiers (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(100) UNIQUE NOT NULL,
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS logements (
  id SERIAL PRIMARY KEY,
  titre VARCHAR(180) NOT NULL,
  prix NUMERIC(14, 2) NOT NULL CHECK (prix > 0),
  description TEXT NOT NULL,
  type VARCHAR(30) NOT NULL CHECK (type IN ('à louer', 'à vendre')),
  categorie VARCHAR(60) NOT NULL,
  quartier VARCHAR(100),
  traite BOOLEAN NOT NULL DEFAULT FALSE,
  image_principale TEXT,
  image_secondaire TEXT,
  image_tertiaire TEXT,
  id_utilisateur INTEGER REFERENCES users(id) ON DELETE SET NULL,
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ajout automatique des colonnes si la table logements existait déjà sans elles
ALTER TABLE logements ADD COLUMN IF NOT EXISTS quartier VARCHAR(100);
ALTER TABLE logements ADD COLUMN IF NOT EXISTS traite BOOLEAN NOT NULL DEFAULT FALSE;

-- S'assure que les quartiers déjà utilisés dans les logements existants
-- apparaissent aussi dans la liste gérable depuis l'admin.
INSERT INTO quartiers (nom)
SELECT DISTINCT quartier FROM logements
WHERE quartier IS NOT NULL AND TRIM(quartier) <> ''
ON CONFLICT (nom) DO NOTHING;

CREATE TABLE IF NOT EXISTS commandes (
  id SERIAL PRIMARY KEY,
  id_logement INTEGER REFERENCES logements(id) ON DELETE CASCADE,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  telephone VARCHAR(30) NOT NULL,
  adresse TEXT NOT NULL,
  message TEXT,
  statut VARCHAR(30) NOT NULL DEFAULT 'nouvelle' CHECK (statut IN ('nouvelle', 'traitée', 'annulée')),
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS historiques (
  id SERIAL PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  details TEXT,
  id_utilisateur INTEGER REFERENCES users(id) ON DELETE SET NULL,
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO categories (nom) VALUES ('Famille'), ('Étudiant'), ('Simple')
ON CONFLICT (nom) DO NOTHING;

INSERT INTO quartiers (nom) VALUES ('Andraivato'), ('Ambalavao'), ('Tanambao')
ON CONFLICT (nom) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_logements_type ON logements(type);
CREATE INDEX IF NOT EXISTS idx_logements_quartier ON logements(quartier);
CREATE INDEX IF NOT EXISTS idx_logements_traite ON logements(traite);
CREATE INDEX IF NOT EXISTS idx_logements_categorie ON logements(categorie);
CREATE INDEX IF NOT EXISTS idx_logements_date_creation ON logements(date_creation);
CREATE INDEX IF NOT EXISTS idx_commandes_statut ON commandes(statut);
CREATE INDEX IF NOT EXISTS idx_commandes_date_creation ON commandes(date_creation);
CREATE INDEX IF NOT EXISTS idx_historiques_date_creation ON historiques(date_creation);

-- Administrateur par défaut : admin@logement.mg / admin123
-- Si pgcrypto est disponible, le mot de passe sera stocké en bcrypt.
INSERT INTO users (nom, email, password, role)
VALUES ('Administrateur', 'admin@logement.mg', crypt('admin123', gen_salt('bf', 10)), 'admin')
ON CONFLICT (email)
DO UPDATE SET
  nom = EXCLUDED.nom,
  password = EXCLUDED.password,
  role = 'admin';

INSERT INTO historiques (action, details)
VALUES ('Initialisation', 'Base de données LogementMad initialisée avec succès.')
ON CONFLICT DO NOTHING;

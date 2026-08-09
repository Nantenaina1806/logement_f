const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { compresserImageUnique } = require('../middleware/compresserImages');

const router = express.Router();
const dossierUploads = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(dossierUploads)) {
  fs.mkdirSync(dossierUploads, { recursive: true });
}

const stockage = multer.diskStorage({
  destination: (_requete, _fichier, callback) => callback(null, dossierUploads),
  filename: (_requete, fichier, callback) => {
    const nomOriginal = fichier.originalname.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '');
    callback(null, `${Date.now()}-profil-${nomOriginal}`);
  },
});

const uploadProfil = multer({
  storage: stockage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_requete, fichier, callback) => {
    if (!fichier.mimetype.startsWith('image/')) {
      return callback(new Error('Seuls les fichiers images sont acceptés pour la photo de profil.'));
    }
    return callback(null, true);
  },
});

const tableExiste = async (nomTable) => {
  const resultat = await pool.query('SELECT to_regclass($1) AS table', [`public.${nomTable}`]);
  return Boolean(resultat.rows[0].table);
};

const colonneExiste = async (nomTable, nomColonne) => {
  const resultat = await pool.query(
    `SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2
    ) AS existe`,
    [nomTable, nomColonne]
  );
  return Boolean(resultat.rows[0].existe);
};

const enregistrerHistorique = async ({ action, details, idUtilisateur = null }) => {
  try {
    if (!(await tableExiste('historiques'))) return;
    await pool.query(
      'INSERT INTO historiques (action, details, id_utilisateur, date_creation) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
      [action, details, idUtilisateur]
    );
  } catch (erreur) {
    console.error('Erreur historique auth :', erreur.message);
  }
};

router.post('/login', async (requete, reponse) => {
  const { email, password } = requete.body;

  if (!email || !password) {
    return reponse.status(400).json({ message: 'Veuillez remplir l’email et le mot de passe.' });
  }

  try {
    if (!(await tableExiste('users'))) {
      return reponse.status(500).json({ message: 'La table users n’existe pas encore. Exécutez le script SQL fourni dans PostgreSQL.' });
    }

    const resultatUtilisateur = await pool.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email.trim()]);

    if (resultatUtilisateur.rows.length === 0) {
      return reponse.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    const utilisateur = resultatUtilisateur.rows[0];
    const motDePasseStocke = utilisateur.password || '';
    const motDePasseEstHashe = motDePasseStocke.startsWith('$2a$') || motDePasseStocke.startsWith('$2b$') || motDePasseStocke.startsWith('$2y$');
    const motDePasseValide = motDePasseEstHashe
      ? await bcrypt.compare(password, motDePasseStocke)
      : password === motDePasseStocke;

    if (!motDePasseValide) {
      return reponse.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    const token = jwt.sign(
      { id: utilisateur.id, email: utilisateur.email, role: utilisateur.role || 'agent' },
      process.env.JWT_SECRET || 'logement_mad_secret',
      { expiresIn: '8h' }
    );

    await enregistrerHistorique({
      action: 'Connexion',
      details: `Connexion de ${utilisateur.nom || utilisateur.email}`,
      idUtilisateur: utilisateur.id,
    });

    return reponse.json({
      message: 'Connexion réussie.',
      token,
      user: {
        id: utilisateur.id,
        nom: utilisateur.nom || utilisateur.name || 'Administrateur',
        email: utilisateur.email,
        role: utilisateur.role || 'agent',
        photoProfil: utilisateur.photo_profil || utilisateur.photoProfil || utilisateur.avatar || null,
      },
    });
  } catch (erreur) {
    console.error('Erreur de connexion :', erreur);
    return reponse.status(500).json({ message: 'Erreur serveur pendant la connexion.' });
  }
});

router.get('/utilisateurs', verifyToken, requireAdmin, async (_requete, reponse) => {
  try {
    if (!(await tableExiste('users'))) return reponse.json([]);

    const resultat = await pool.query(
      'SELECT id, nom, email, role, photo_profil, created_at FROM users ORDER BY id ASC'
    );

    return reponse.json(resultat.rows.map((ligne) => ({
      id: ligne.id,
      nom: ligne.nom,
      email: ligne.email,
      role: ligne.role || 'agent',
      photoProfil: ligne.photo_profil || null,
      dateCreation: ligne.created_at || null,
    })));
  } catch (erreur) {
    console.error('Erreur liste utilisateurs :', erreur);
    return reponse.status(500).json({ message: 'Impossible de charger les utilisateurs.', error: erreur.message });
  }
});

router.post('/register', verifyToken, requireAdmin, async (requete, reponse) => {
  try {
    const { nom, email, password, role } = requete.body;

    if (!nom || !email || !password) {
      return reponse.status(400).json({ message: 'Veuillez remplir le nom, l’email et le mot de passe.' });
    }

    if (!(await tableExiste('users'))) {
      return reponse.status(500).json({ message: 'La table users n’existe pas encore. Exécutez le script SQL fourni dans PostgreSQL.' });
    }

    const roleFinal = role === 'admin' ? 'admin' : 'agent';

    const existant = await pool.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email.trim()]);
    if (existant.rows.length > 0) {
      return reponse.status(409).json({ message: 'Un compte existe déjà avec cet email.' });
    }

    const motDePasseHache = await bcrypt.hash(password, 10);

    const resultat = await pool.query(
      'INSERT INTO users (nom, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, nom, email, role, photo_profil, created_at',
      [nom.trim(), email.trim(), motDePasseHache, roleFinal]
    );

    const utilisateurCree = resultat.rows[0];

    await enregistrerHistorique({
      action: 'Ajout utilisateur',
      details: `Nouvel utilisateur créé : ${utilisateurCree.nom} (${utilisateurCree.role})`,
      idUtilisateur: requete.body.idAuteur || null,
    });

    return reponse.status(201).json({
      message: 'Utilisateur créé avec succès.',
      user: {
        id: utilisateurCree.id,
        nom: utilisateurCree.nom,
        email: utilisateurCree.email,
        role: utilisateurCree.role,
        photoProfil: utilisateurCree.photo_profil || null,
        dateCreation: utilisateurCree.created_at || null,
      },
    });
  } catch (erreur) {
    console.error('Erreur création utilisateur :', erreur);
    return reponse.status(500).json({ message: 'Impossible de créer l’utilisateur.', error: erreur.message });
  }
});

router.delete('/utilisateurs/:id', verifyToken, requireAdmin, async (requete, reponse) => {
  try {
    if (!(await tableExiste('users'))) return reponse.status(404).json({ message: 'Table users introuvable.' });

    const resultat = await pool.query('DELETE FROM users WHERE id = $1 RETURNING nom, email', [requete.params.id]);
    if (resultat.rows.length === 0) return reponse.status(404).json({ message: 'Utilisateur introuvable.' });

    await enregistrerHistorique({
      action: 'Suppression utilisateur',
      details: `Utilisateur supprimé : ${resultat.rows[0].nom || resultat.rows[0].email}`,
    });

    return reponse.json({ message: 'Utilisateur supprimé avec succès.' });
  } catch (erreur) {
    console.error('Erreur suppression utilisateur :', erreur);
    return reponse.status(500).json({ message: 'Impossible de supprimer l’utilisateur.', error: erreur.message });
  }
});

router.put('/profil/:id/photo', verifyToken, uploadProfil.single('photoProfil'), compresserImageUnique, async (requete, reponse) => {
  try {
    const estProprietaire = String(requete.utilisateur?.id) === String(requete.params.id);
    if (!estProprietaire && requete.utilisateur?.role !== 'admin') {
      return reponse.status(403).json({ message: 'Vous ne pouvez modifier que votre propre photo de profil.' });
    }

    if (!(await tableExiste('users'))) {
      return reponse.status(500).json({ message: 'La table users n’existe pas encore.' });
    }

    if (!(await colonneExiste('users', 'photo_profil'))) {
      return reponse.status(500).json({ message: 'La colonne photo_profil est absente. Exécutez le nouveau script SQL fourni.' });
    }

    if (!requete.file) {
      return reponse.status(400).json({ message: 'Veuillez choisir une photo de profil.' });
    }

    const cheminPhoto = `/uploads/${requete.file.filename}`;
    const resultat = await pool.query(
      'UPDATE users SET photo_profil = $1 WHERE id = $2 RETURNING id, nom, email, role, photo_profil',
      [cheminPhoto, requete.params.id]
    );

    if (resultat.rows.length === 0) {
      return reponse.status(404).json({ message: 'Utilisateur introuvable.' });
    }

    const utilisateur = resultat.rows[0];
    await enregistrerHistorique({
      action: 'Profil',
      details: `Photo de profil mise à jour pour ${utilisateur.nom || utilisateur.email}`,
      idUtilisateur: utilisateur.id,
    });

    return reponse.json({
      message: 'Photo de profil mise à jour avec succès.',
      user: {
        id: utilisateur.id,
        nom: utilisateur.nom,
        email: utilisateur.email,
        role: utilisateur.role,
        photoProfil: utilisateur.photo_profil,
      },
    });
  } catch (erreur) {
    console.error('Erreur mise à jour profil :', erreur);
    return reponse.status(500).json({ message: 'Impossible de mettre à jour la photo de profil.', error: erreur.message });
  }
});

module.exports = router;

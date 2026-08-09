const express = require('express');
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

const tableExiste = async (nomTable) => {
  const resultat = await pool.query('SELECT to_regclass($1) AS table', [`public.${nomTable}`]);
  return Boolean(resultat.rows[0].table);
};

const enregistrerHistorique = async ({ action, details, idUtilisateur = null }) => {
  try {
    if (!(await tableExiste('historiques'))) return;
    await pool.query(
      'INSERT INTO historiques (action, details, id_utilisateur, date_creation) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
      [action, details, idUtilisateur]
    );
  } catch (erreur) {
    console.error('Erreur historique catégorie :', erreur.message);
  }
};

const normaliserCategorie = (ligne) => ({
  id: ligne.id,
  nom: ligne.nom,
  dateCreation: ligne.date_creation || null,
});

router.get('/', async (_requete, reponse) => {
  try {
    if (!(await tableExiste('categories'))) return reponse.json([]);
    const resultat = await pool.query('SELECT * FROM categories ORDER BY nom ASC');
    return reponse.json(resultat.rows.map(normaliserCategorie));
  } catch (erreur) {
    console.error('Erreur liste catégories :', erreur);
    return reponse.status(500).json({ message: 'Impossible de charger les catégories.', error: erreur.message });
  }
});

router.post('/', verifyToken, async (requete, reponse) => {
  try {
    const nom = (requete.body.nom || '').trim();
    if (!nom) return reponse.status(400).json({ message: 'Le nom de la catégorie est obligatoire.' });

    if (!(await tableExiste('categories'))) {
      return reponse.status(500).json({ message: 'La table categories n’existe pas encore. Exécutez le fichier server/schema.sql dans PostgreSQL.' });
    }

    const existante = await pool.query('SELECT * FROM categories WHERE LOWER(nom) = LOWER($1) LIMIT 1', [nom]);
    if (existante.rows.length > 0) {
      return reponse.status(409).json({ message: 'Cette catégorie existe déjà.' });
    }

    const resultat = await pool.query('INSERT INTO categories (nom) VALUES ($1) RETURNING *', [nom]);
    await enregistrerHistorique({ action: 'Ajout catégorie', details: `Nouvelle catégorie ajoutée : ${nom}` });

    return reponse.status(201).json(normaliserCategorie(resultat.rows[0]));
  } catch (erreur) {
    console.error('Erreur ajout catégorie :', erreur);
    return reponse.status(500).json({ message: 'Impossible d’ajouter la catégorie.', error: erreur.message });
  }
});

router.delete('/:id', verifyToken, async (requete, reponse) => {
  try {
    if (!(await tableExiste('categories'))) return reponse.status(404).json({ message: 'Table categories introuvable.' });

    const resultat = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING *', [requete.params.id]);
    if (resultat.rows.length === 0) return reponse.status(404).json({ message: 'Catégorie introuvable.' });

    await enregistrerHistorique({ action: 'Suppression catégorie', details: `Catégorie supprimée : ${resultat.rows[0].nom}` });
    return reponse.json({ message: 'Catégorie supprimée avec succès.' });
  } catch (erreur) {
    console.error('Erreur suppression catégorie :', erreur);
    return reponse.status(500).json({ message: 'Impossible de supprimer la catégorie.', error: erreur.message });
  }
});

module.exports = router;

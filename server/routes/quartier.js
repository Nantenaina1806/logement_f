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
    console.error('Erreur historique quartier :', erreur.message);
  }
};

const normaliserQuartier = (ligne) => ({
  id: ligne.id,
  nom: ligne.nom,
  dateCreation: ligne.date_creation || null,
});

router.get('/', async (_requete, reponse) => {
  try {
    if (!(await tableExiste('quartiers'))) return reponse.json([]);
    const resultat = await pool.query('SELECT * FROM quartiers ORDER BY nom ASC');
    return reponse.json(resultat.rows.map(normaliserQuartier));
  } catch (erreur) {
    console.error('Erreur liste quartiers :', erreur);
    return reponse.status(500).json({ message: 'Impossible de charger les quartiers.', error: erreur.message });
  }
});

router.post('/', verifyToken, async (requete, reponse) => {
  try {
    const nom = (requete.body.nom || '').trim();
    if (!nom) return reponse.status(400).json({ message: 'Le nom du quartier est obligatoire.' });

    if (!(await tableExiste('quartiers'))) {
      return reponse.status(500).json({ message: 'La table quartiers n’existe pas encore. Exécutez le fichier server/schema.sql dans PostgreSQL.' });
    }

    const existante = await pool.query('SELECT * FROM quartiers WHERE LOWER(nom) = LOWER($1) LIMIT 1', [nom]);
    if (existante.rows.length > 0) {
      return reponse.status(409).json({ message: 'Ce quartier existe déjà.' });
    }

    const resultat = await pool.query('INSERT INTO quartiers (nom) VALUES ($1) RETURNING *', [nom]);
    await enregistrerHistorique({ action: 'Ajout quartier', details: `Nouveau quartier ajouté : ${nom}` });

    return reponse.status(201).json(normaliserQuartier(resultat.rows[0]));
  } catch (erreur) {
    console.error('Erreur ajout quartier :', erreur);
    return reponse.status(500).json({ message: 'Impossible d’ajouter le quartier.', error: erreur.message });
  }
});

router.delete('/:id', verifyToken, async (requete, reponse) => {
  try {
    if (!(await tableExiste('quartiers'))) return reponse.status(404).json({ message: 'Table quartiers introuvable.' });

    const resultat = await pool.query('DELETE FROM quartiers WHERE id = $1 RETURNING *', [requete.params.id]);
    if (resultat.rows.length === 0) return reponse.status(404).json({ message: 'Quartier introuvable.' });

    await enregistrerHistorique({ action: 'Suppression quartier', details: `Quartier supprimé : ${resultat.rows[0].nom}` });
    return reponse.json({ message: 'Quartier supprimé avec succès.' });
  } catch (erreur) {
    console.error('Erreur suppression quartier :', erreur);
    return reponse.status(500).json({ message: 'Impossible de supprimer le quartier.', error: erreur.message });
  }
});

module.exports = router;

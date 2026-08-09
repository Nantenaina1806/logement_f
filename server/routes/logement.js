const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');
const { compresserImagesFields } = require('../middleware/compresserImages');

const router = express.Router();
const dossierUploads = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(dossierUploads)) {
  fs.mkdirSync(dossierUploads, { recursive: true });
}

const stockage = multer.diskStorage({
  destination: (_requete, _fichier, callback) => callback(null, dossierUploads),
  filename: (_requete, fichier, callback) => {
    const nomOriginal = fichier.originalname.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '');
    callback(null, `${Date.now()}-${nomOriginal}`);
  },
});

const upload = multer({
  storage: stockage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_requete, fichier, callback) => {
    if (!fichier.mimetype.startsWith('image/')) {
      return callback(new Error('Seuls les fichiers images sont acceptés.'));
    }
    return callback(null, true);
  },
});

const champsImages = upload.fields([
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'image3', maxCount: 1 },
]);

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

const choisirColonne = async (nomTable, colonnesPossibles) => {
  for (const colonne of colonnesPossibles) {
    if (await colonneExiste(nomTable, colonne)) return colonne;
  }
  return null;
};

const compterTable = async (nomTable) => {
  if (!(await tableExiste(nomTable))) return 0;
  const resultat = await pool.query(`SELECT COUNT(*)::int AS total FROM ${nomTable}`);
  return resultat.rows[0].total || 0;
};

const enregistrerHistorique = async ({ action, details, idUtilisateur = null }) => {
  try {
    if (!(await tableExiste('historiques'))) return;
    await pool.query(
      'INSERT INTO historiques (action, details, id_utilisateur, date_creation) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
      [action, details, idUtilisateur]
    );
  } catch (erreur) {
    console.error('Erreur historique :', erreur.message);
  }
};

const cheminImage = (fichier) => (fichier ? `/uploads/${fichier.filename}` : null);

const normaliserLogement = (ligne) => {
  const imagePrincipale = ligne.image_principale || ligne.image1 || ligne.photo_principale || null;
  const imageSecondaire = ligne.image_secondaire || ligne.image2 || null;
  const imageTertiaire = ligne.image_tertiaire || ligne.image3 || null;

  return {
    id: ligne.id,
    titre: ligne.titre || ligne.title || ligne.nom || 'Sans titre',
    prix: ligne.prix || ligne.price || 0,
    description: ligne.description || ligne.desc || '',
    type: ligne.type || 'Non précisé',
    categorie: ligne.categorie || ligne.category || 'Non précisée',
    imagePrincipale,
    imageSecondaire,
    imageTertiaire,
    images: [imagePrincipale, imageSecondaire, imageTertiaire].filter(Boolean),
    quartier: ligne.quartier || null,
    traite: ligne.traite === true || ligne.traite === 't' || ligne.traite === 1,
    idUtilisateur: ligne.id_utilisateur || ligne.user_id || ligne.userid || null,
    nomAgent: ligne.nom_agent || ligne.agent || null,
    dateCreation: ligne.date_creation || ligne.created_at || ligne.createdat || null,
  };
};

const normaliserCommande = (ligne) => ({
  id: ligne.id,
  idLogement: ligne.id_logement || ligne.logement_id || ligne.idlogement || null,
  nom: ligne.nom || '',
  prenom: ligne.prenom || ligne.prénom || '',
  telephone: ligne.telephone || ligne.tel || '',
  adresse: ligne.adresse || '',
  message: ligne.message || '',
  statut: ligne.statut || ligne.status || 'nouvelle',
  titreLogement: ligne.titre_logement || ligne.title || ligne.titre || null,
  prixLogement: ligne.prix_logement != null ? Number(ligne.prix_logement) : null,
  dateCreation: ligne.date_creation || ligne.created_at || null,
});

const normaliserHistorique = (ligne) => ({
  id: ligne.id,
  action: ligne.action || '',
  details: ligne.details || '',
  idUtilisateur: ligne.id_utilisateur || null,
  nomUtilisateur: ligne.nom_utilisateur || ligne.nom || null,
  emailUtilisateur: ligne.email_utilisateur || ligne.email || null,
  dateCreation: ligne.date_creation || ligne.created_at || null,
});

const obtenirColonneDate = async (nomTable) => choisirColonne(nomTable, ['date_creation', 'created_at', 'createdat']);
const obtenirColonneCategorie = async () => choisirColonne('logements', ['categorie', 'category']);
const obtenirColonneType = async () => choisirColonne('logements', ['type']);

router.get('/stats', verifyToken, async (_requete, reponse) => {
  try {
    const logementsExiste = await tableExiste('logements');
    const commandesExiste = await tableExiste('commandes');

    const totalLogements = await compterTable('logements');
    const totalUtilisateurs = await compterTable('users');
    const totalCommandes = await compterTable('commandes');

    let logementsAujourdhui = 0;
    let logementsHier = 0;
    let logementsAvantHier = 0;
    let commandesAujourdhui = 0;
    let nouvellesCommandes = 0;
    let evolutionQuotidienne = [];
    let repartitionTypes = [];
    let repartitionCategories = [];

    if (logementsExiste) {
      const colonneDate = await obtenirColonneDate('logements');
      const colonneType = await obtenirColonneType();
      const colonneCategorie = await obtenirColonneCategorie();

      if (colonneDate) {
        const comparaison = await pool.query(
          `SELECT
            COUNT(*) FILTER (WHERE ${colonneDate}::date = CURRENT_DATE)::int AS aujourd_hui,
            COUNT(*) FILTER (WHERE ${colonneDate}::date = CURRENT_DATE - INTERVAL '1 day')::int AS hier,
            COUNT(*) FILTER (WHERE ${colonneDate}::date = CURRENT_DATE - INTERVAL '2 day')::int AS avant_hier
          FROM logements`
        );
        logementsAujourdhui = comparaison.rows[0].aujourd_hui || 0;
        logementsHier = comparaison.rows[0].hier || 0;
        logementsAvantHier = comparaison.rows[0].avant_hier || 0;

        const evolution = await pool.query(
          `SELECT TO_CHAR(jour, 'DD/MM') AS jour,
                  COALESCE(COUNT(l.id), 0)::int AS logements
           FROM generate_series(CURRENT_DATE - INTERVAL '6 day', CURRENT_DATE, INTERVAL '1 day') jour
           LEFT JOIN logements l ON l.${colonneDate}::date = jour::date
           GROUP BY jour
           ORDER BY jour`
        );
        evolutionQuotidienne = evolution.rows;
      } else {
        logementsAujourdhui = totalLogements;
        evolutionQuotidienne = [{ jour: 'Total', logements: totalLogements }];
      }

      if (colonneType) {
        const types = await pool.query(
          `SELECT COALESCE(${colonneType}, 'Non précisé') AS nom, COUNT(*)::int AS valeur
           FROM logements GROUP BY ${colonneType} ORDER BY valeur DESC`
        );
        repartitionTypes = types.rows;
      }

      if (colonneCategorie) {
        const categories = await pool.query(
          `SELECT COALESCE(${colonneCategorie}, 'Non précisée') AS nom, COUNT(*)::int AS valeur
           FROM logements GROUP BY ${colonneCategorie} ORDER BY valeur DESC LIMIT 8`
        );
        repartitionCategories = categories.rows;
      }
    }

    if (commandesExiste) {
      const colonneDateCommandes = await obtenirColonneDate('commandes');
      if (colonneDateCommandes) {
        const resultatCommandes = await pool.query(
          `SELECT COUNT(*) FILTER (WHERE ${colonneDateCommandes}::date = CURRENT_DATE)::int AS aujourd_hui FROM commandes`
        );
        commandesAujourdhui = resultatCommandes.rows[0].aujourd_hui || 0;
      }

      const colonneStatut = await choisirColonne('commandes', ['statut', 'status']);
      if (colonneStatut) {
        const resultatNouvelles = await pool.query(`SELECT COUNT(*)::int AS total FROM commandes WHERE ${colonneStatut} = 'nouvelle'`);
        nouvellesCommandes = resultatNouvelles.rows[0].total || 0;
      }
    }

    return reponse.json({
      totalLogements,
      totalUtilisateurs,
      totalCommandes,
      logementsAujourdhui,
      logementsHier,
      logementsAvantHier,
      commandesAujourdhui,
      nouvellesCommandes,
      evolutionQuotidienne,
      repartitionTypes,
      repartitionCategories,
      total_pub: totalLogements,
      total_users: totalUtilisateurs,
    });
  } catch (erreur) {
    console.error('Erreur statistiques :', erreur);
    return reponse.status(500).json({ message: 'Impossible de charger les statistiques.', error: erreur.message });
  }
});

router.get('/notifications', verifyToken, async (_requete, reponse) => {
  try {
    if (!(await tableExiste('commandes'))) {
      return reponse.json({ totalNouvellesCommandes: 0, dernieresCommandes: [] });
    }

    const colonneStatut = await choisirColonne('commandes', ['statut', 'status']);
    const colonneLienCommande = await choisirColonne('commandes', ['id_logement', 'logement_id', 'idlogement']);
    const colonneTitre = (await tableExiste('logements')) ? await choisirColonne('logements', ['titre', 'title', 'nom']) : null;

    let totalNouvellesCommandes = 0;
    if (colonneStatut) {
      const resultatTotal = await pool.query(`SELECT COUNT(*)::int AS total FROM commandes WHERE ${colonneStatut} = 'nouvelle'`);
      totalNouvellesCommandes = resultatTotal.rows[0].total || 0;
    } else {
      const resultatTotal = await pool.query('SELECT COUNT(*)::int AS total FROM commandes');
      totalNouvellesCommandes = resultatTotal.rows[0].total || 0;
    }

    let requeteSql = 'SELECT c.*';
    if (colonneLienCommande && colonneTitre) {
      requeteSql += `, l.${colonneTitre} AS titre_logement FROM commandes c LEFT JOIN logements l ON l.id = c.${colonneLienCommande}`;
    } else {
      requeteSql += ' FROM commandes c';
    }
    if (colonneStatut) requeteSql += ` WHERE c.${colonneStatut} = 'nouvelle'`;
    requeteSql += ' ORDER BY c.id DESC LIMIT 5';

    const resultat = await pool.query(requeteSql);

    return reponse.json({
      totalNouvellesCommandes,
      dernieresCommandes: resultat.rows.map(normaliserCommande),
    });
  } catch (erreur) {
    console.error('Erreur notifications :', erreur);
    return reponse.status(500).json({ message: 'Impossible de charger les notifications.', error: erreur.message });
  }
});

router.get('/historique', verifyToken, async (_requete, reponse) => {
  try {
    if (!(await tableExiste('historiques'))) return reponse.json([]);

    let requeteSql = 'SELECT h.*';
    if (await tableExiste('users')) {
      requeteSql += ', u.nom AS nom_utilisateur, u.email AS email_utilisateur FROM historiques h LEFT JOIN users u ON u.id = h.id_utilisateur';
    } else {
      requeteSql += ' FROM historiques h';
    }
    requeteSql += ' ORDER BY h.id DESC LIMIT 300';

    const resultat = await pool.query(requeteSql);
    return reponse.json(resultat.rows.map(normaliserHistorique));
  } catch (erreur) {
    console.error('Erreur historique :', erreur);
    return reponse.status(500).json({ message: 'Impossible de charger l’historique.', error: erreur.message });
  }
});

router.delete('/historique', verifyToken, async (_requete, reponse) => {
  try {
    if (!(await tableExiste('historiques'))) return reponse.json({ message: 'Historique déjà vide.' });

    await pool.query('DELETE FROM historiques');
    return reponse.json({ message: 'Historique vidé avec succès.' });
  } catch (erreur) {
    console.error('Erreur suppression historique :', erreur);
    return reponse.status(500).json({ message: 'Impossible de vider l’historique.', error: erreur.message });
  }
});

router.delete('/historique/:id', verifyToken, async (requete, reponse) => {
  try {
    if (!(await tableExiste('historiques'))) return reponse.status(404).json({ message: 'Table historiques introuvable.' });

    const resultat = await pool.query('DELETE FROM historiques WHERE id = $1 RETURNING *', [requete.params.id]);
    if (resultat.rows.length === 0) return reponse.status(404).json({ message: 'Entrée d’historique introuvable.' });

    return reponse.json({ message: 'Entrée supprimée avec succès.' });
  } catch (erreur) {
    console.error('Erreur suppression entrée historique :', erreur);
    return reponse.status(500).json({ message: 'Impossible de supprimer cette entrée.', error: erreur.message });
  }
});

router.get('/commandes', verifyToken, async (_requete, reponse) => {
  try {
    if (!(await tableExiste('commandes'))) return reponse.json([]);

    const colonneLienCommande = await choisirColonne('commandes', ['id_logement', 'logement_id', 'idlogement']);
    const colonneTitre = (await tableExiste('logements')) ? await choisirColonne('logements', ['titre', 'title', 'nom']) : null;
    const colonnePrix = (await tableExiste('logements')) ? await choisirColonne('logements', ['prix', 'price']) : null;

    let requeteSql = 'SELECT c.*';
    if (colonneLienCommande && (colonneTitre || colonnePrix)) {
      const colonnesLogement = [
        colonneTitre ? `l.${colonneTitre} AS titre_logement` : null,
        colonnePrix ? `l.${colonnePrix} AS prix_logement` : null,
      ].filter(Boolean).join(', ');
      requeteSql += `, ${colonnesLogement} FROM commandes c LEFT JOIN logements l ON l.id = c.${colonneLienCommande}`;
    } else {
      requeteSql += ' FROM commandes c';
    }
    requeteSql += ' ORDER BY c.id DESC';

    const resultat = await pool.query(requeteSql);
    return reponse.json(resultat.rows.map(normaliserCommande));
  } catch (erreur) {
    console.error('Erreur liste commandes :', erreur);
    return reponse.status(500).json({ message: 'Impossible de charger les commandes.', error: erreur.message });
  }
});

router.patch('/commandes/:id/statut', verifyToken, async (requete, reponse) => {
  try {
    if (!(await tableExiste('commandes'))) return reponse.status(404).json({ message: 'Table commandes introuvable.' });

    const colonneStatut = await choisirColonne('commandes', ['statut', 'status']);
    if (!colonneStatut) return reponse.status(500).json({ message: 'Colonne statut introuvable dans la table commandes.' });

    const statut = requete.body.statut || 'traitée';
    const resultat = await pool.query(`UPDATE commandes SET ${colonneStatut} = $1 WHERE id = $2 RETURNING *`, [statut, requete.params.id]);
    if (resultat.rows.length === 0) return reponse.status(404).json({ message: 'Commande introuvable.' });

    await enregistrerHistorique({ action: 'Commande', details: `Statut de la commande #${requete.params.id} modifié en ${statut}` });
    return reponse.json(normaliserCommande(resultat.rows[0]));
  } catch (erreur) {
    console.error('Erreur statut commande :', erreur);
    return reponse.status(500).json({ message: 'Impossible de modifier le statut de la commande.', error: erreur.message });
  }
});

router.get('/', async (requete, reponse) => {
  try {
    if (!(await tableExiste('logements'))) return reponse.json([]);

    const inclureTraites = requete.query.inclureTraites === 'true' || requete.query.admin === 'true';
    const colonneTraite = await colonneExiste('logements', 'traite');

    const requeteSql = (!inclureTraites && colonneTraite)
      ? 'SELECT * FROM logements WHERE traite IS NOT TRUE ORDER BY id DESC'
      : 'SELECT * FROM logements ORDER BY id DESC';

    const resultat = await pool.query(requeteSql);
    return reponse.json(resultat.rows.map(normaliserLogement));
  } catch (erreur) {
    console.error('Erreur liste logements :', erreur);
    return reponse.status(500).json({ message: 'Impossible de charger les logements.', error: erreur.message });
  }
});

router.get('/:id', async (requete, reponse) => {
  try {
    const { id } = requete.params;
    if (!(await tableExiste('logements'))) return reponse.status(404).json({ message: 'Table logements introuvable.' });

    const resultat = await pool.query('SELECT * FROM logements WHERE id = $1 LIMIT 1', [id]);
    if (resultat.rows.length === 0) return reponse.status(404).json({ message: 'Logement introuvable.' });

    return reponse.json(normaliserLogement(resultat.rows[0]));
  } catch (erreur) {
    console.error('Erreur détail logement :', erreur);
    return reponse.status(500).json({ message: 'Impossible de charger ce logement.', error: erreur.message });
  }
});

router.patch('/:id/traite', verifyToken, async (requete, reponse) => {
  try {
    if (!(await tableExiste('logements'))) return reponse.status(404).json({ message: 'Table logements introuvable.' });

    const colonneTraite = await colonneExiste('logements', 'traite');
    if (!colonneTraite) {
      return reponse.status(500).json({ message: 'La colonne traite est absente. Exécutez le nouveau script server/schema.sql dans PostgreSQL.' });
    }

    const { id } = requete.params;
    const traite = requete.body.traite === true || requete.body.traite === 'true';

    const resultat = await pool.query('UPDATE logements SET traite = $1 WHERE id = $2 RETURNING *', [traite, id]);
    if (resultat.rows.length === 0) return reponse.status(404).json({ message: 'Logement introuvable.' });

    const logementMisAJour = normaliserLogement(resultat.rows[0]);

    await enregistrerHistorique({
      action: traite ? 'Logement traité' : 'Logement remis en ligne',
      details: `${traite ? 'Logement marqué comme traité (masqué du site public)' : 'Logement remis visible sur le site public'} : ${logementMisAJour.titre}`,
      idUtilisateur: requete.body.idUtilisateur || null,
    });

    return reponse.json(logementMisAJour);
  } catch (erreur) {
    console.error('Erreur changement statut traité :', erreur);
    return reponse.status(500).json({ message: 'Impossible de modifier le statut du logement.', error: erreur.message });
  }
});

router.post('/', verifyToken, champsImages, compresserImagesFields, async (requete, reponse) => {
  try {
    if (!(await tableExiste('logements'))) {
      return reponse.status(500).json({ message: 'La table logements n’existe pas encore. Exécutez le fichier server/schema.sql dans PostgreSQL.' });
    }

    const titre = requete.body.titre || requete.body.title;
    const prix = requete.body.prix || requete.body.price;
    const description = requete.body.description;
    const type = requete.body.type;
    const categorie = requete.body.categorie || requete.body.category;
    const quartier = requete.body.quartier || null;
    const idUtilisateur = requete.body.idUtilisateur || requete.body.userId || requete.body.user_id;

    if (!titre || !prix || !description || !type || !categorie) {
      return reponse.status(400).json({ message: 'Veuillez remplir tous les champs obligatoires.' });
    }

    const correspondances = [
      { valeur: titre.trim(), colonnes: ['titre', 'title'] },
      { valeur: prix, colonnes: ['prix', 'price'] },
      { valeur: description.trim(), colonnes: ['description'] },
      { valeur: type, colonnes: ['type'] },
      { valeur: categorie, colonnes: ['categorie', 'category'] },
      { valeur: quartier, colonnes: ['quartier'], optionnel: true },
      { valeur: idUtilisateur || null, colonnes: ['id_utilisateur', 'user_id', 'userid'], optionnel: true },
      { valeur: cheminImage(requete.files?.image1?.[0]), colonnes: ['image_principale', 'image1', 'photo_principale'], optionnel: true },
      { valeur: cheminImage(requete.files?.image2?.[0]), colonnes: ['image_secondaire', 'image2'], optionnel: true },
      { valeur: cheminImage(requete.files?.image3?.[0]), colonnes: ['image_tertiaire', 'image3'], optionnel: true },
    ];

    const colonnes = [];
    const valeurs = [];

    for (const correspondance of correspondances) {
      const colonne = await choisirColonne('logements', correspondance.colonnes);
      if (colonne && (correspondance.valeur !== null || !correspondance.optionnel)) {
        colonnes.push(colonne);
        valeurs.push(correspondance.valeur);
      }
    }

    const colonneDate = await obtenirColonneDate('logements');
    if (colonneDate === 'date_creation' || colonneDate === 'created_at') {
      colonnes.push(colonneDate);
      valeurs.push(new Date());
    }

    const parametres = valeurs.map((_, index) => `$${index + 1}`).join(', ');
    const requeteInsertion = `INSERT INTO logements (${colonnes.join(', ')}) VALUES (${parametres}) RETURNING *`;
    const resultat = await pool.query(requeteInsertion, valeurs);
    const logementCree = normaliserLogement(resultat.rows[0]);

    await enregistrerHistorique({
      action: 'Ajout logement',
      details: `Logement ajouté : ${logementCree.titre}`,
      idUtilisateur: idUtilisateur || null,
    });

    return reponse.status(201).json(logementCree);
  } catch (erreur) {
    console.error('Erreur ajout logement :', erreur);
    return reponse.status(500).json({ message: 'Impossible d’ajouter le logement.', error: erreur.message });
  }
});

router.put('/:id', verifyToken, champsImages, compresserImagesFields, async (requete, reponse) => {
  try {
    const { id } = requete.params;

    if (!(await tableExiste('logements'))) {
      return reponse.status(500).json({ message: 'La table logements n’existe pas encore. Exécutez le fichier server/schema.sql dans PostgreSQL.' });
    }

    const logementExistant = await pool.query('SELECT * FROM logements WHERE id = $1 LIMIT 1', [id]);
    if (logementExistant.rows.length === 0) {
      return reponse.status(404).json({ message: 'Logement introuvable.' });
    }

    const titre = requete.body.titre || requete.body.title;
    const prix = requete.body.prix || requete.body.price;
    const description = requete.body.description;
    const type = requete.body.type;
    const categorie = requete.body.categorie || requete.body.category;
    const quartier = requete.body.quartier || null;

    if (!titre || !prix || !description || !type || !categorie) {
      return reponse.status(400).json({ message: 'Veuillez remplir tous les champs obligatoires.' });
    }

    const correspondances = [
      { valeur: titre.trim(), colonnes: ['titre', 'title'] },
      { valeur: prix, colonnes: ['prix', 'price'] },
      { valeur: description.trim(), colonnes: ['description'] },
      { valeur: type, colonnes: ['type'] },
      { valeur: categorie, colonnes: ['categorie', 'category'] },
      { valeur: quartier, colonnes: ['quartier'], optionnel: true },
    ];

    if (requete.files?.image1?.[0]) {
      correspondances.push({ valeur: cheminImage(requete.files.image1[0]), colonnes: ['image_principale', 'image1', 'photo_principale'], optionnel: true });
    }
    if (requete.files?.image2?.[0]) {
      correspondances.push({ valeur: cheminImage(requete.files.image2[0]), colonnes: ['image_secondaire', 'image2'], optionnel: true });
    }
    if (requete.files?.image3?.[0]) {
      correspondances.push({ valeur: cheminImage(requete.files.image3[0]), colonnes: ['image_tertiaire', 'image3'], optionnel: true });
    }

    const affectations = [];
    const valeurs = [];

    for (const correspondance of correspondances) {
      const colonne = await choisirColonne('logements', correspondance.colonnes);
      if (colonne && (correspondance.valeur !== null || !correspondance.optionnel)) {
        valeurs.push(correspondance.valeur);
        affectations.push(`${colonne} = $${valeurs.length}`);
      }
    }

    if (affectations.length === 0) {
      return reponse.status(400).json({ message: 'Aucune donnée valide à mettre à jour.' });
    }

    valeurs.push(id);
    const requeteMiseAJour = `UPDATE logements SET ${affectations.join(', ')} WHERE id = $${valeurs.length} RETURNING *`;
    const resultat = await pool.query(requeteMiseAJour, valeurs);
    const logementMisAJour = normaliserLogement(resultat.rows[0]);

    await enregistrerHistorique({
      action: 'Modification logement',
      details: `Logement modifié : ${logementMisAJour.titre}`,
      idUtilisateur: requete.body.idUtilisateur || null,
    });

    return reponse.json(logementMisAJour);
  } catch (erreur) {
    console.error('Erreur modification logement :', erreur);
    return reponse.status(500).json({ message: 'Impossible de modifier le logement.', error: erreur.message });
  }
});

router.post('/:id/commandes', async (requete, reponse) => {
  try {
    if (!(await tableExiste('commandes'))) {
      return reponse.status(500).json({ message: 'La table commandes n’existe pas encore. Exécutez le fichier server/schema.sql dans PostgreSQL.' });
    }

    const { id } = requete.params;
    const { nom, prenom, telephone, adresse, message } = requete.body;

    if (!nom || !prenom || !telephone || !adresse) {
      return reponse.status(400).json({ message: 'Nom, prénom, téléphone et adresse sont obligatoires.' });
    }

    const telephoneValide = /^\+?[0-9\s]{7,20}$/.test(String(telephone).trim());
    if (!telephoneValide) {
      return reponse.status(400).json({ message: 'Le téléphone doit contenir uniquement des chiffres, espaces ou +.' });
    }

    const correspondances = [
      { valeur: id, colonnes: ['id_logement', 'logement_id', 'idlogement'] },
      { valeur: nom.trim(), colonnes: ['nom'] },
      { valeur: prenom.trim(), colonnes: ['prenom'] },
      { valeur: telephone.trim(), colonnes: ['telephone', 'tel'] },
      { valeur: adresse.trim(), colonnes: ['adresse'] },
      { valeur: message?.trim() || null, colonnes: ['message'], optionnel: true },
      { valeur: 'nouvelle', colonnes: ['statut', 'status'], optionnel: true },
    ];

    const colonnes = [];
    const valeurs = [];

    for (const correspondance of correspondances) {
      const colonne = await choisirColonne('commandes', correspondance.colonnes);
      if (colonne && (correspondance.valeur !== null || !correspondance.optionnel)) {
        colonnes.push(colonne);
        valeurs.push(correspondance.valeur);
      }
    }

    const colonneDate = await obtenirColonneDate('commandes');
    if (colonneDate === 'date_creation' || colonneDate === 'created_at') {
      colonnes.push(colonneDate);
      valeurs.push(new Date());
    }

    const parametres = valeurs.map((_, index) => `$${index + 1}`).join(', ');
    const requeteInsertion = `INSERT INTO commandes (${colonnes.join(', ')}) VALUES (${parametres}) RETURNING *`;
    const resultat = await pool.query(requeteInsertion, valeurs);
    const commandeCreee = normaliserCommande(resultat.rows[0]);

    await enregistrerHistorique({
      action: 'Nouvelle commande',
      details: `Demande envoyée par ${nom.trim()} ${prenom.trim()} pour le logement #${id}`,
    });

    return reponse.status(201).json(commandeCreee);
  } catch (erreur) {
    console.error('Erreur ajout commande :', erreur);
    return reponse.status(500).json({ message: 'Impossible d’enregistrer la commande.', error: erreur.message });
  }
});

router.delete('/:id', verifyToken, async (requete, reponse) => {
  try {
    const { id } = requete.params;
    if (!(await tableExiste('logements'))) return reponse.status(404).json({ message: 'Table logements introuvable.' });

    const resultat = await pool.query('DELETE FROM logements WHERE id = $1 RETURNING *', [id]);
    if (resultat.rows.length === 0) return reponse.status(404).json({ message: 'Logement introuvable.' });

    const logementSupprime = normaliserLogement(resultat.rows[0]);
    await enregistrerHistorique({
      action: 'Suppression logement',
      details: `Logement supprimé : ${logementSupprime.titre}`,
      idUtilisateur: logementSupprime.idUtilisateur || null,
    });

    return reponse.json({ message: 'Suppression réussie : le logement a été supprimé avec succès.' });
  } catch (erreur) {
    console.error('Erreur suppression logement :', erreur);
    return reponse.status(500).json({ message: 'Impossible de supprimer le logement.', error: erreur.message });
  }
});

module.exports = router;

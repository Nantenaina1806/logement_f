const jwt = require('jsonwebtoken');

// Vérifie que la requête contient un token JWT valide (header "Authorization: Bearer <token>").
// Bloque l'accès (401) si le token est absent, invalide ou expiré.
const verifyToken = (requete, reponse, suivant) => {
  const enTete = requete.headers.authorization || '';
  const token = enTete.startsWith('Bearer ') ? enTete.slice(7).trim() : null;

  if (!token) {
    return reponse.status(401).json({ message: 'Authentification requise. Veuillez vous connecter.' });
  }

  try {
    const donneesToken = jwt.verify(token, process.env.JWT_SECRET || 'logement_mad_secret');
    requete.utilisateur = donneesToken; // { id, email, role }
    return suivant();
  } catch (erreur) {
    return reponse.status(401).json({ message: 'Session expirée ou invalide. Veuillez vous reconnecter.' });
  }
};

// À utiliser APRÈS verifyToken. Bloque l'accès (403) si l'utilisateur n'est pas admin.
const requireAdmin = (requete, reponse, suivant) => {
  if (requete.utilisateur?.role !== 'admin') {
    return reponse.status(403).json({ message: 'Accès réservé aux administrateurs.' });
  }
  return suivant();
};

module.exports = { verifyToken, requireAdmin };

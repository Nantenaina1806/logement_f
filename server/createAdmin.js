const bcrypt = require('bcryptjs');
const pool = require('./db');

async function creerAdministrateur() {
  try {
    const motDePasseHashe = await bcrypt.hash('admin123', 10);

    await pool.query(
      `INSERT INTO users (nom, email, password, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email)
       DO UPDATE SET nom = EXCLUDED.nom, password = EXCLUDED.password, role = EXCLUDED.role`,
      ['Administrateur', 'admin@logement.mg', motDePasseHashe, 'admin']
    );

    console.log('Administrateur prêt : admin@logement.mg / admin123');
  } catch (erreur) {
    console.error('Impossible de créer l’administrateur :', erreur);
  } finally {
    await pool.end();
  }
}

creerAdministrateur();

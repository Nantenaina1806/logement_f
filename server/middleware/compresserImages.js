const sharp = require('sharp');

// Mandà ny sary voa-upload (avy amin'ny multer .fields() na .single()) mba
// hampihenana ny lanjan'ny fichier (largeur max 1600px, compression) alohan'ny
// hitehirizana azy. Manova ny fichier eo an-toerana (overwrite), tsy manova
// ny anaram-pichier.
const compresserSary = async (fichier) => {
  try {
    const cheminTampony = `${fichier.path}.tmp`;
    await sharp(fichier.path)
      .rotate() // manaraka ny orientation EXIF
      .resize({ width: 1600, withoutEnlargement: true })
      .jpeg({ quality: 78, mozjpeg: true })
      .toFile(cheminTampony);

    const fs = require('fs');
    fs.renameSync(cheminTampony, fichier.path);
  } catch (erreur) {
    // Raha misy olana amin'ny compression (ex: format tsy ampoizina), aza
    // atsahatra ny requête - ampiasaina ny sary tsy voa-compresser.
    console.error(`Compression sary tsy nety ho an'ny ${fichier.filename} :`, erreur.message);
  }
};

// Ho an'ny upload.fields([...]) : requete.files = { image1: [file], image2: [file], ... }
const compresserImagesFields = async (requete, _reponse, suivant) => {
  try {
    const tousLesFichiers = Object.values(requete.files || {}).flat();
    await Promise.all(tousLesFichiers.map(compresserSary));
    suivant();
  } catch (erreur) {
    suivant(erreur);
  }
};

// Ho an'ny upload.single('champ') : requete.file = file
const compresserImageUnique = async (requete, _reponse, suivant) => {
  try {
    if (requete.file) await compresserSary(requete.file);
    suivant();
  } catch (erreur) {
    suivant(erreur);
  }
};

module.exports = { compresserImagesFields, compresserImageUnique };

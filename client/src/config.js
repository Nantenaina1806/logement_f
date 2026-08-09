// Lien vers la page Facebook officielle de LogementMad.
// Azonao ovaina amin'ny fametrahana ny fichier .env (client/.env) miaraka amin'ny :
// VITE_FACEBOOK_URL=https://facebook.com/ilay-page-facebook-tena-izy
export const URL_FACEBOOK =
  import.meta.env.VITE_FACEBOOK_URL || 'https://facebook.com/logementmad.fianarantsoa';

// Nomerao antsoina mivantana ho an'ny commande (bokotra "Appeler" any @ pejin'ny logement).
// Azonao ovaina amin'ny fametrahana ny fichier .env (client/.env) miaraka amin'ny :
// VITE_TELEPHONE_CONTACT=+261384629096
export const TELEPHONE_CONTACT =
  import.meta.env.VITE_TELEPHONE_CONTACT || '0384629096';

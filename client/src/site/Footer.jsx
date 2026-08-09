import FacebookIcon from '../components/FacebookIcon';
import { URL_FACEBOOK } from '../config';

export default function Footer() {
  return (
    <footer className="mt-auto bg-slate-950 px-6 py-10 text-center text-white">
      <p className="font-semibold">© 2026 LogementMad — Gestion immobilière moderne et sécurisée.</p>
      <p className="mt-2 text-sm text-slate-400">Location, vente et suivi des commandes à Fianarantsoa, depuis un seul espace.</p>

      <a
        href={URL_FACEBOOK}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-bold text-white transition hover:bg-white/10"
      >
        <FacebookIcon size={18} /> Suivez-nous sur Facebook
      </a>
    </footer>
  );
}

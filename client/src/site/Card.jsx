import { MapPin, Tag } from 'lucide-react';
import { urlServeur } from '../api';

export default function Card({ titre, prix, type, categorie, quartier, images = [] }) {
  const imagePrincipale = images.find(Boolean);

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <div className="relative h-56 overflow-hidden">
        {imagePrincipale ? (
          <img
            src={urlServeur(imagePrincipale)}
            alt={titre}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-sm font-semibold text-slate-400">
            Aucune image
          </div>
        )}
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-amber-700 shadow-sm backdrop-blur">
          {type || 'Non précisé'}
        </span>
      </div>

      <div className="space-y-3 p-5">
        <h3 className="line-clamp-2 text-lg font-extrabold text-slate-900">{titre}</h3>
        <p className="text-2xl font-black text-amber-700">
          {prix ? `${Number(prix).toLocaleString('fr-FR')} Ar` : 'Prix à confirmer'}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
            <Tag size={14} /> {categorie || 'Catégorie'}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
            <MapPin size={14} /> {quartier ? `${quartier}, Fianarantsoa` : 'Fianarantsoa'}
          </span>
        </div>
      </div>
    </article>
  );
}

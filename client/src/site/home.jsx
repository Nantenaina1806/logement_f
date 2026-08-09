import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, HomeIcon } from 'lucide-react';
import Card from './Card';
import Hero from './Hero';

const LOGEMENTS_PAR_PAGE = 9;

export default function Home({ logements = [], type, category, quartier, search, chargement }) {
  const rechercheNormalisee = search.trim().toLowerCase();

  const logementsFiltres = logements.filter((logement) => {
    const correspondAuType = type === 'tous' || logement.type === type;
    const correspondALaCategorie = category === 'toutes' || logement.categorie === category;
    const correspondAuQuartier = !quartier || quartier === 'tous' || logement.quartier === quartier;
    const correspondALaRecherche = !rechercheNormalisee
      || logement.titre?.toLowerCase().includes(rechercheNormalisee)
      || String(logement.prix ?? '').includes(rechercheNormalisee);
    return correspondAuType && correspondALaCategorie && correspondAuQuartier && correspondALaRecherche;
  });

  // Pagination côté client : on affiche par lot pour éviter de charger
  // d'un coup toutes les images (meilleure performance sur mobile / connexion lente).
  const [nombreAffiches, setNombreAffiches] = useState(LOGEMENTS_PAR_PAGE);

  useEffect(() => {
    setNombreAffiches(LOGEMENTS_PAR_PAGE);
  }, [type, category, quartier, search]);

  const logementsAffiches = logementsFiltres.slice(0, nombreAffiches);
  const resteAAfficher = logementsFiltres.length - logementsAffiches.length;

  return (
    <>
      <Hero />

      <section id="logements" className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700">
              <HomeIcon size={16} /> Offres disponibles
            </p>
            <h2 className="text-4xl font-black text-slate-950">Logements publiés</h2>
            <p className="mt-2 text-slate-500">Sélectionnez une offre et envoyez votre commande en quelques clics.</p>
          </div>
          <p className="rounded-2xl bg-white px-5 py-3 font-bold text-slate-600 shadow-sm">
            {logementsFiltres.length} résultat(s)
          </p>
        </div>

        {chargement ? (
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="animate-pulse overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
                <div className="h-56 bg-slate-200" />
                <div className="space-y-3 p-5">
                  <div className="h-5 w-3/4 rounded bg-slate-200" />
                  <div className="h-7 w-1/2 rounded bg-slate-200" />
                  <div className="h-4 w-2/3 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : logementsFiltres.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3">
              {logementsAffiches.map((logement) => (
                <div key={logement.id} className="flex flex-col">
                  <Card {...logement} />
                  <Link
                    to={`/details/${logement.id}`}
                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white transition hover:bg-amber-700"
                  >
                    Voir les détails <ArrowRight size={18} />
                  </Link>
                </div>
              ))}
            </div>

            {resteAAfficher > 0 && (
              <div className="mt-10 flex justify-center">
                <button
                  onClick={() => setNombreAffiches((n) => n + LOGEMENTS_PAR_PAGE)}
                  className="rounded-2xl bg-white px-8 py-4 font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
                >
                  Voir plus ({resteAAfficher} restant{resteAAfficher > 1 ? 's' : ''})
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <p className="text-xl font-bold text-slate-700">Aucun logement ne correspond à votre recherche.</p>
            <p className="mt-2 text-slate-500">Modifiez les filtres ou réessayez avec un autre mot-clé.</p>
          </div>
        )}
      </section>
    </>
  );
}

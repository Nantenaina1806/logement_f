import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Search } from 'lucide-react';
import api, { urlServeur } from '../api';

export default function Navbar({ setType, setCategory, setQuartier, setSearch, logements = [] }) {
  const navigate = useNavigate();
  const [typeActif, setTypeActif] = useState('tous');
  const [categories, setCategories] = useState([]);
  const [texteRecherche, setTexteRecherche] = useState('');
  const [suggestionsVisibles, setSuggestionsVisibles] = useState(false);
  const zoneRechercheRef = useRef(null);

  useEffect(() => {
    let composantActif = true;

    const chargerCategories = async () => {
      try {
        const reponse = await api.get('/categories');
        if (composantActif) setCategories(Array.isArray(reponse.data) ? reponse.data : []);
      } catch (erreur) {
        console.error('Erreur pendant le chargement des catégories :', erreur);
      }
    };

    chargerCategories();
    return () => { composantActif = false; };
  }, []);

  useEffect(() => {
    const surClicExterieur = (evenement) => {
      if (zoneRechercheRef.current && !zoneRechercheRef.current.contains(evenement.target)) {
        setSuggestionsVisibles(false);
      }
    };
    document.addEventListener('mousedown', surClicExterieur);
    return () => document.removeEventListener('mousedown', surClicExterieur);
  }, []);

  const suggestions = useMemo(() => {
    const requete = texteRecherche.trim().toLowerCase();
    if (!requete) return [];
    return logements
      .filter((logement) => (
        logement.titre?.toLowerCase().includes(requete)
        || String(logement.prix ?? '').includes(requete)
      ))
      .slice(0, 6);
  }, [texteRecherche, logements]);

  const formaterPrix = (prix) => (
    prix ? `${Number(prix).toLocaleString('fr-FR')} Ar` : 'Prix à confirmer'
  );

  const choisirSuggestion = (logement) => {
    setSuggestionsVisibles(false);
    setTexteRecherche(logement.titre || '');
    setSearch(logement.titre || '');
    navigate(`/details/${logement.id}`);
  };

  const quartiers = useMemo(() => {
    const valeurs = logements
      .map((logement) => logement.quartier)
      .filter(Boolean);
    return Array.from(new Set(valeurs)).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [logements]);

  const choisirType = (type) => {
    setTypeActif(type);
    setType(type);
  };

  const styleBouton = (type, couleur = 'amber') => {
    const actif = typeActif === type;
    if (actif) return couleur === 'green' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-amber-700 text-white shadow-lg';
    return 'bg-slate-100 text-slate-600 hover:bg-slate-200';
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-4 py-4 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-700 text-white shadow-lg">
            <Building2 size={24} />
          </span>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950">LogementMad</h1>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Fianarantsoa - Vente & location</p>
          </div>
        </Link>

        <div className="flex flex-1 flex-col gap-3 lg:max-w-5xl lg:flex-row lg:items-center lg:justify-end">
          <div className="relative w-full lg:max-w-xs" ref={zoneRechercheRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={texteRecherche}
              placeholder="Rechercher par titre ou prix..."
              onChange={(e) => {
                setTexteRecherche(e.target.value);
                setSearch(e.target.value);
                setSuggestionsVisibles(true);
              }}
              onFocus={() => setSuggestionsVisibles(true)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 outline-none transition focus:border-amber-500 focus:bg-white"
            />

            {suggestionsVisibles && texteRecherche.trim() && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
                {suggestions.length > 0 ? (
                  suggestions.map((logement) => {
                    const imagePrincipale = Array.isArray(logement.images) ? logement.images.find(Boolean) : null;
                    return (
                      <button
                        key={logement.id}
                        type="button"
                        onClick={() => choisirSuggestion(logement)}
                        className="flex w-full items-center gap-3 border-b border-slate-100 p-3 text-left transition last:border-b-0 hover:bg-slate-50"
                      >
                        {imagePrincipale ? (
                          <img
                            src={urlServeur(imagePrincipale)}
                            alt={logement.titre}
                            className="h-12 w-12 flex-shrink-0 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 flex-shrink-0 rounded-xl bg-slate-100" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-slate-900">{logement.titre}</p>
                          <p className="text-sm font-black text-amber-700">{formaterPrix(logement.prix)}</p>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <p className="p-4 text-center text-sm font-semibold text-slate-400">
                    Aucun résultat pour « {texteRecherche} »
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => choisirType('tous')} className={`rounded-2xl px-4 py-3 font-bold transition ${styleBouton('tous')}`}>Tous</button>
            <button onClick={() => choisirType('à vendre')} className={`rounded-2xl px-4 py-3 font-bold transition ${styleBouton('à vendre')}`}>À vendre</button>
            <button onClick={() => choisirType('à louer')} className={`rounded-2xl px-4 py-3 font-bold transition ${styleBouton('à louer', 'green')}`}>À louer</button>
          </div>

          <select
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-600 outline-none focus:border-amber-500"
          >
            <option value="toutes">Toutes les catégories</option>
            {categories.map((categorie) => (
              <option key={categorie.id} value={categorie.nom}>{categorie.nom}</option>
            ))}
          </select>

          <select
            onChange={(e) => setQuartier(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-600 outline-none focus:border-amber-500"
          >
            <option value="tous">Tous les quartiers</option>
            {quartiers.map((quartier) => (
              <option key={quartier} value={quartier}>{quartier}</option>
            ))}
          </select>

        </div>
      </div>
    </nav>
  );
}

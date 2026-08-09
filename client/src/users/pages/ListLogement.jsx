import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownUp, CheckCircle2, Eye, EyeOff, Pencil, Plus, Printer, Search, Trash2 } from 'lucide-react';
import api, { urlServeur } from '../../api';

export default function ListLogement() {
  const [logements, setLogements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [typeFiltre, setTypeFiltre] = useState('Tous');
  const [categorieFiltre, setCategorieFiltre] = useState('Tous');
  const [quartierFiltre, setQuartierFiltre] = useState('Tous');
  const [recherche, setRecherche] = useState('');
  const [tri, setTri] = useState('recent');
  const [chargement, setChargement] = useState(true);
  const [messageErreur, setMessageErreur] = useState('');
  const [messageSucces, setMessageSucces] = useState('');
  const utilisateurConnecte = JSON.parse(localStorage.getItem('user') || 'null');
  const estAdministrateur = utilisateurConnecte?.role === 'admin';

  const chargerLogements = async () => {
    try {
      setChargement(true);
      const reponse = await api.get('/logements', { params: { inclureTraites: true } });
      setLogements(Array.isArray(reponse.data) ? reponse.data : []);
    } catch (erreur) {
      setMessageErreur(erreur.response?.data?.message || 'Impossible de charger la liste des logements.');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerLogements();

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

  const quartiers = useMemo(() => {
    const valeurs = logements.map((logement) => logement.quartier).filter(Boolean);
    return Array.from(new Set(valeurs)).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [logements]);

  const logementsFiltres = useMemo(() => {
    const rechercheNormalisee = recherche.trim().toLowerCase();

    return logements
      .filter((logement) => {
        const correspondAuType = typeFiltre === 'Tous' || logement.type === typeFiltre;
        const correspondALaCategorie = categorieFiltre === 'Tous' || logement.categorie === categorieFiltre;
        const correspondAuQuartier = quartierFiltre === 'Tous' || logement.quartier === quartierFiltre;
        const correspondALaRecherche = !rechercheNormalisee
          || logement.titre?.toLowerCase().includes(rechercheNormalisee)
          || String(logement.prix ?? '').includes(rechercheNormalisee);
        return correspondAuType && correspondALaCategorie && correspondAuQuartier && correspondALaRecherche;
      })
      .sort((a, b) => {
        if (tri === 'prix_asc') return Number(a.prix || 0) - Number(b.prix || 0);
        if (tri === 'prix_desc') return Number(b.prix || 0) - Number(a.prix || 0);
        if (tri === 'titre') return (a.titre || '').localeCompare(b.titre || '', 'fr');
        return Number(b.id) - Number(a.id);
      });
  }, [logements, typeFiltre, categorieFiltre, quartierFiltre, recherche, tri]);

  const supprimerLogement = async (id) => {
    const confirmation = window.confirm('Voulez-vous vraiment supprimer ce logement ?');
    if (!confirmation) return;

    setMessageErreur('');
    setMessageSucces('');

    try {
      const reponse = await api.delete(`/logements/${id}`);
      setLogements((ancienneListe) => ancienneListe.filter((logement) => logement.id !== id));
      setMessageSucces(reponse.data?.message || 'Logement supprimé avec succès.');
      window.setTimeout(() => setMessageSucces(''), 4000);
    } catch (erreur) {
      setMessageErreur(erreur.response?.data?.message || 'Suppression impossible.');
    }
  };

  const basculerStatutTraite = async (logement) => {
    setMessageErreur('');
    setMessageSucces('');

    try {
      const reponse = await api.patch(`/logements/${logement.id}/traite`, {
        traite: !logement.traite,
        idUtilisateur: utilisateurConnecte?.id || null,
      });
      setLogements((ancienneListe) => ancienneListe.map((element) => (
        element.id === logement.id ? { ...element, traite: reponse.data.traite } : element
      )));
      setMessageSucces(reponse.data.traite
        ? 'Logement marqué comme traité : il n’apparaît plus sur le site public.'
        : 'Logement remis en ligne sur le site public.');
      window.setTimeout(() => setMessageSucces(''), 4000);
    } catch (erreur) {
      setMessageErreur(erreur.response?.data?.message || 'Impossible de modifier le statut du logement.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end no-print">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-amber-700">Gestion des biens</p>
          <h1 className="mt-2 text-4xl font-black text-slate-950">Liste des logements</h1>
          <p className="mt-2 text-slate-500">Recherchez, filtrez, triez, imprimez ou supprimez une publication.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-700 shadow-sm transition hover:bg-slate-50">
            <Printer size={18} /> Imprimer
          </button>
          {estAdministrateur && (
            <Link to="/admin/add-logement" className="inline-flex items-center gap-2 rounded-2xl bg-amber-700 px-5 py-3 font-bold text-white shadow-lg transition hover:bg-amber-800">
              <Plus size={18} /> Ajouter
            </Link>
          )}
        </div>
      </div>

      {messageSucces && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-semibold text-emerald-700">
          <CheckCircle2 size={20} /> {messageSucces}
        </div>
      )}
      {messageErreur && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">{messageErreur}</div>}

      <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm no-print">
        <div className="grid gap-4 md:grid-cols-6">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un logement (titre ou prix)..."
              className="w-full rounded-2xl border border-slate-200 py-3 pl-10 pr-4 outline-none focus:border-amber-500"
            />
          </div>

          <select value={typeFiltre} onChange={(e) => setTypeFiltre(e.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none focus:border-amber-500">
            <option value="Tous">Tous les types</option>
            <option value="à louer">À louer</option>
            <option value="à vendre">À vendre</option>
          </select>

          <select value={categorieFiltre} onChange={(e) => setCategorieFiltre(e.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none focus:border-amber-500">
            <option value="Tous">Toutes les catégories</option>
            {categories.map((categorie) => (
              <option key={categorie.id} value={categorie.nom}>{categorie.nom}</option>
            ))}
          </select>

          <select value={quartierFiltre} onChange={(e) => setQuartierFiltre(e.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none focus:border-amber-500">
            <option value="Tous">Tous les quartiers</option>
            {quartiers.map((quartier) => (
              <option key={quartier} value={quartier}>{quartier}</option>
            ))}
          </select>

          <div className="relative">
            <ArrowDownUp className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select value={tri} onChange={(e) => setTri(e.target.value)} className="w-full rounded-2xl border border-slate-200 py-3 pl-10 pr-4 font-semibold outline-none focus:border-amber-500">
              <option value="recent">Trier par : plus récent</option>
              <option value="titre">Trier par : titre</option>
              <option value="prix_asc">Trier par : prix croissant</option>
              <option value="prix_desc">Trier par : prix décroissant</option>
            </select>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm print-table">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-xl font-black text-slate-950">{logementsFiltres.length} logement(s)</h2>
        </div>

        {/* Vue mobile/tablette : cartes empilées, plus lisibles qu'un tableau qui déborde. */}
        <div className="divide-y divide-slate-100 lg:hidden">
          {chargement ? (
            <p className="px-6 py-10 text-center text-slate-500">Chargement...</p>
          ) : logementsFiltres.length > 0 ? (
            logementsFiltres.map((logement) => (
              <div key={logement.id} className="flex gap-4 p-4 sm:p-5">
                {logement.imagePrincipale ? (
                  <img src={urlServeur(logement.imagePrincipale)} alt={logement.titre} className="h-28 w-28 flex-shrink-0 rounded-2xl object-cover sm:h-32 sm:w-32" />
                ) : (
                  <div className="flex h-28 w-28 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xs font-semibold text-slate-400 sm:h-32 sm:w-32">Aucune</div>
                )}

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-slate-900">{logement.titre}</p>
                    <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${logement.traite ? 'bg-slate-200 text-slate-600' : 'bg-emerald-50 text-emerald-700'}`}>
                      {logement.traite ? 'Traité' : 'En ligne'}
                    </span>
                  </div>
                  <p className="text-lg font-black text-amber-700">{Number(logement.prix || 0).toLocaleString('fr-FR')} Ar</p>
                  <div className="flex flex-wrap gap-1.5 text-xs font-semibold text-slate-500">
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">{logement.type}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1">{logement.categorie}</span>
                    {logement.quartier && <span className="rounded-full bg-slate-100 px-2.5 py-1">{logement.quartier}</span>}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1 no-print">
                    <button
                      onClick={() => basculerStatutTraite(logement)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-bold transition ${logement.traite ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                      {logement.traite ? <><Eye size={15} /> Remettre en ligne</> : <><EyeOff size={15} /> Marquer traité</>}
                    </button>
                    {estAdministrateur && (
                      <Link to={`/admin/edit-logement/${logement.id}`} className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-2.5 py-2 text-sm font-bold text-amber-700 transition hover:bg-amber-100">
                        <Pencil size={15} /> Modifier
                      </Link>
                    )}
                    <button onClick={() => supprimerLogement(logement.id)} className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-2.5 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100">
                      <Trash2 size={15} /> Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="px-6 py-10 text-center text-slate-500">Aucun logement trouvé.</p>
          )}
        </div>

        {/* Vue grand écran : tableau complet. */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-slate-50 text-sm uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Image</th>
                <th className="px-6 py-4">Titre</th>
                <th className="px-6 py-4">Prix</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Catégorie</th>
                <th className="px-6 py-4">Quartier</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 no-print">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {chargement ? (
                <tr><td colSpan="8" className="px-6 py-10 text-center text-slate-500">Chargement...</td></tr>
              ) : logementsFiltres.length > 0 ? (
                logementsFiltres.map((logement) => (
                  <tr key={logement.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4">
                      {logement.imagePrincipale ? (
                        <img src={urlServeur(logement.imagePrincipale)} alt={logement.titre} className="h-24 w-32 rounded-2xl object-cover" />
                      ) : (
                        <div className="flex h-24 w-32 items-center justify-center rounded-2xl bg-slate-100 text-xs font-semibold text-slate-400">Aucune</div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">{logement.titre}</td>
                    <td className="px-6 py-4 font-black text-amber-700">{Number(logement.prix || 0).toLocaleString('fr-FR')} Ar</td>
                    <td className="px-6 py-4"><span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-bold text-amber-700">{logement.type}</span></td>
                    <td className="px-6 py-4 text-slate-600">{logement.categorie}</td>
                    <td className="px-6 py-4 text-slate-600">{logement.quartier || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-sm font-bold ${logement.traite ? 'bg-slate-200 text-slate-600' : 'bg-emerald-50 text-emerald-700'}`}>
                        {logement.traite ? 'Traité (masqué)' : 'En ligne'}
                      </span>
                    </td>
                    <td className="px-6 py-4 no-print">
                      <div className="flex flex-wrap gap-2">
                        <button
                          key={logement.traite ? `traite-${logement.id}` : `actif-${logement.id}`}
                          onClick={() => basculerStatutTraite(logement)}
                          className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 font-bold transition ${logement.traite ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                        >
                          {logement.traite ? (
                            <span className="notranslate inline-flex items-center gap-2"><Eye size={16} /> Remettre en ligne</span>
                          ) : (
                            <span className="notranslate inline-flex items-center gap-2"><EyeOff size={16} /> Marquer traité</span>
                          )}
                        </button>
                        {estAdministrateur && (
                          <Link
                            to={`/admin/edit-logement/${logement.id}`}
                            className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 font-bold text-amber-700 transition hover:bg-amber-100"
                          >
                            <Pencil size={16} /> Modifier
                          </Link>
                        )}
                        <button onClick={() => supprimerLogement(logement.id)} className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 font-bold text-red-600 transition hover:bg-red-100">
                          <Trash2 size={16} /> Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="8" className="px-6 py-10 text-center text-slate-500">Aucun logement trouvé.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

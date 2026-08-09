import { useEffect, useMemo, useState } from 'react';
import { ArrowDownUp, Clock3, History, Printer, Search, Trash2 } from 'lucide-react';
import api from '../../api';

export default function Historique() {
  const [historiques, setHistoriques] = useState([]);
  const [recherche, setRecherche] = useState('');
  const [tri, setTri] = useState('recent');
  const [chargement, setChargement] = useState(true);
  const [messageErreur, setMessageErreur] = useState('');
  const [messageSucces, setMessageSucces] = useState('');
  const utilisateurConnecte = JSON.parse(localStorage.getItem('user') || 'null');
  const estAdministrateur = utilisateurConnecte?.role === 'admin';

  useEffect(() => {
    let composantActif = true;

    const chargerHistorique = async () => {
      try {
        const reponse = await api.get('/logements/historique');
        if (composantActif) setHistoriques(Array.isArray(reponse.data) ? reponse.data : []);
      } catch (erreur) {
        if (composantActif) setMessageErreur(erreur.response?.data?.message || 'Impossible de charger l’historique.');
      } finally {
        if (composantActif) setChargement(false);
      }
    };

    chargerHistorique();
    return () => { composantActif = false; };
  }, []);

  const viderHistorique = async () => {
    const confirmation = window.confirm('Voulez-vous vraiment supprimer tout l’historique ? Cette action est irréversible.');
    if (!confirmation) return;

    setMessageErreur('');
    setMessageSucces('');

    try {
      await api.delete('/logements/historique');
      setHistoriques([]);
      setMessageSucces('Historique vidé avec succès.');
      window.setTimeout(() => setMessageSucces(''), 4000);
    } catch (erreur) {
      setMessageErreur(erreur.response?.data?.message || 'Impossible de vider l’historique.');
    }
  };

  const supprimerLigne = async (id) => {
    const confirmation = window.confirm('Voulez-vous vraiment supprimer cette entrée de l’historique ?');
    if (!confirmation) return;

    setMessageErreur('');
    setMessageSucces('');

    try {
      await api.delete(`/logements/historique/${id}`);
      setHistoriques((ancienneListe) => ancienneListe.filter((ligne) => ligne.id !== id));
    } catch (erreur) {
      setMessageErreur(erreur.response?.data?.message || 'Suppression impossible.');
    }
  };

  const historiquesFiltres = useMemo(() => {
    const rechercheNormalisee = recherche.trim().toLowerCase();

    return historiques
      .filter((ligne) => {
        if (!rechercheNormalisee) return true;
        return [ligne.action, ligne.details, ligne.nomUtilisateur, ligne.emailUtilisateur]
          .filter(Boolean)
          .some((valeur) => valeur.toLowerCase().includes(rechercheNormalisee));
      })
      .sort((a, b) => {
        if (tri === 'ancien') return Number(a.id) - Number(b.id);
        if (tri === 'action') return (a.action || '').localeCompare(b.action || '', 'fr');
        return Number(b.id) - Number(a.id);
      });
  }, [historiques, recherche, tri]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end no-print">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-amber-700">Traçabilité</p>
          <h1 className="mt-2 text-4xl font-black text-slate-950">Historique</h1>
          <p className="mt-2 text-slate-500">Suivez les actions importantes effectuées dans l’application.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-700 shadow-sm transition hover:bg-slate-50">
            <Printer size={18} /> Imprimer
          </button>
          {estAdministrateur && historiques.length > 0 && (
            <button onClick={viderHistorique} className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-3 font-bold text-white shadow-lg transition hover:bg-red-700">
              <Trash2 size={18} /> Vider l’historique
            </button>
          )}
        </div>
      </div>

      {messageSucces && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-semibold text-emerald-700">
          <Trash2 size={20} /> {messageSucces}
        </div>
      )}

      {messageErreur && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">{messageErreur}</div>}

      <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm no-print">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher action, détail ou utilisateur..."
              className="w-full rounded-2xl border border-slate-200 py-3 pl-10 pr-4 outline-none focus:border-amber-500"
            />
          </div>
          <div className="relative">
            <ArrowDownUp className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select value={tri} onChange={(e) => setTri(e.target.value)} className="w-full rounded-2xl border border-slate-200 py-3 pl-10 pr-4 font-semibold outline-none focus:border-amber-500">
              <option value="recent">Trier par : plus récent</option>
              <option value="ancien">Trier par : plus ancien</option>
              <option value="action">Trier par : action</option>
            </select>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm print-table">
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
          <div className="rounded-2xl bg-amber-700 p-3 text-white"><History size={22} /></div>
          <div>
            <h2 className="text-xl font-black text-slate-950">{historiquesFiltres.length} action(s)</h2>
            <p className="text-sm text-slate-500">Journal des activités.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left">
            <thead className="bg-slate-50 text-sm uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Détails</th>
                <th className="px-6 py-4">Utilisateur</th>
                <th className="px-6 py-4 no-print">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {chargement ? (
                <tr><td colSpan="5" className="px-6 py-10 text-center text-slate-500">Chargement...</td></tr>
              ) : historiquesFiltres.length > 0 ? (
                historiquesFiltres.map((ligne) => (
                  <tr key={ligne.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-600">
                      <span className="inline-flex items-center gap-2 font-semibold"><Clock3 size={16} /> {ligne.dateCreation ? new Date(ligne.dateCreation).toLocaleString('fr-FR') : '-'}</span>
                    </td>
                    <td className="px-6 py-4"><span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-black text-amber-700">{ligne.action}</span></td>
                    <td className="px-6 py-4 text-slate-700">{ligne.details || '-'}</td>
                    <td className="px-6 py-4 text-slate-600">{ligne.nomUtilisateur || ligne.emailUtilisateur || 'Système'}</td>
                    <td className="px-6 py-4 no-print">
                      <button onClick={() => supprimerLigne(ligne.id)} className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 font-bold text-red-600 transition hover:bg-red-100">
                        <Trash2 size={16} /> Supprimer
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="px-6 py-10 text-center text-slate-500">Aucun historique disponible.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

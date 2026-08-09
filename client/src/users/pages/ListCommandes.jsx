import { useEffect, useMemo, useState } from 'react';
import { ArrowDownUp, CheckCircle2, Printer, Search, ShoppingCart } from 'lucide-react';
import api from '../../api';

export default function ListCommandes() {
  const [commandes, setCommandes] = useState([]);
  const [recherche, setRecherche] = useState('');
  const [tri, setTri] = useState('recent');
  const [chargement, setChargement] = useState(true);
  const [messageErreur, setMessageErreur] = useState('');
  const [messageSucces, setMessageSucces] = useState('');

  const chargerCommandes = async () => {
    try {
      setChargement(true);
      const reponse = await api.get('/logements/commandes');
      setCommandes(Array.isArray(reponse.data) ? reponse.data : []);
    } catch (erreur) {
      setMessageErreur(erreur.response?.data?.message || 'Impossible de charger les commandes.');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerCommandes();
  }, []);

  const commandesFiltrees = useMemo(() => {
    const rechercheNormalisee = recherche.trim().toLowerCase();

    return commandes
      .filter((commande) => {
        if (!rechercheNormalisee) return true;
        return [commande.nom, commande.prenom, commande.telephone, commande.adresse, commande.titreLogement, commande.statut, commande.prixLogement != null ? String(commande.prixLogement) : null]
          .filter(Boolean)
          .some((valeur) => String(valeur).toLowerCase().includes(rechercheNormalisee));
      })
      .sort((a, b) => {
        if (tri === 'client') return `${a.nom || ''} ${a.prenom || ''}`.localeCompare(`${b.nom || ''} ${b.prenom || ''}`, 'fr');
        if (tri === 'logement') return (a.titreLogement || '').localeCompare(b.titreLogement || '', 'fr');
        if (tri === 'statut') return (a.statut || '').localeCompare(b.statut || '', 'fr');
        return Number(b.id) - Number(a.id);
      });
  }, [commandes, recherche, tri]);

  const marquerCommeTraitee = async (id) => {
    setMessageSucces('');
    setMessageErreur('');

    try {
      const reponse = await api.patch(`/logements/commandes/${id}/statut`, { statut: 'traitée' });
      setCommandes((ancienneListe) => ancienneListe.map((commande) => (
        commande.id === id ? { ...commande, ...reponse.data } : commande
      )));
      setMessageSucces('Commande marquée comme traitée avec succès.');
      window.setTimeout(() => setMessageSucces(''), 3500);
    } catch (erreur) {
      setMessageErreur(erreur.response?.data?.message || 'Impossible de modifier le statut de la commande.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end no-print">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-amber-700">Suivi commercial</p>
          <h1 className="mt-2 text-4xl font-black text-slate-950">Liste des commandes</h1>
          <p className="mt-2 text-slate-500">Consultez les demandes envoyées depuis les fiches logements.</p>
        </div>
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-700 shadow-sm transition hover:bg-slate-50">
          <Printer size={18} /> Imprimer
        </button>
      </div>

      {messageSucces && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-semibold text-emerald-700">
          <CheckCircle2 size={20} /> {messageSucces}
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
              placeholder="Rechercher client, téléphone, logement, statut..."
              className="w-full rounded-2xl border border-slate-200 py-3 pl-10 pr-4 outline-none focus:border-amber-500"
            />
          </div>
          <div className="relative">
            <ArrowDownUp className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select value={tri} onChange={(e) => setTri(e.target.value)} className="w-full rounded-2xl border border-slate-200 py-3 pl-10 pr-4 font-semibold outline-none focus:border-amber-500">
              <option value="recent">Trier par : plus récent</option>
              <option value="client">Trier par : client</option>
              <option value="logement">Trier par : logement</option>
              <option value="statut">Trier par : statut</option>
            </select>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm print-table">
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
          <div className="rounded-2xl bg-amber-700 p-3 text-white"><ShoppingCart size={22} /></div>
          <div>
            <h2 className="text-xl font-black text-slate-950">{commandesFiltrees.length} commande(s)</h2>
            <p className="text-sm text-slate-500">Demandes clients enregistrées.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left">
            <thead className="bg-slate-50 text-sm uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Téléphone</th>
                <th className="px-6 py-4">Adresse</th>
                <th className="px-6 py-4">Logement</th>
                <th className="px-6 py-4">Prix</th>
                <th className="px-6 py-4">Message</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 no-print">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {chargement ? (
                <tr><td colSpan="9" className="px-6 py-10 text-center text-slate-500">Chargement...</td></tr>
              ) : commandesFiltrees.length > 0 ? (
                commandesFiltrees.map((commande) => (
                  <tr key={commande.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-900">{commande.nom} {commande.prenom}</td>
                    <td className="px-6 py-4 text-slate-700">{commande.telephone}</td>
                    <td className="px-6 py-4 text-slate-600">{commande.adresse}</td>
                    <td className="px-6 py-4 font-semibold text-amber-700">{commande.titreLogement || `Logement #${commande.idLogement || '-'}`}</td>
                    <td className="px-6 py-4 font-black text-emerald-700">
                      {commande.prixLogement ? `${Number(commande.prixLogement).toLocaleString('fr-FR')} Ar` : 'Prix à confirmer'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{commande.message || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-sm font-black ${commande.statut === 'nouvelle' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {commande.statut || 'nouvelle'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{commande.dateCreation ? new Date(commande.dateCreation).toLocaleDateString('fr-FR') : '-'}</td>
                    <td className="px-6 py-4 no-print">
                      {commande.statut === 'nouvelle' ? (
                        <button onClick={() => marquerCommeTraitee(commande.id)} className="rounded-xl bg-emerald-50 px-3 py-2 font-bold text-emerald-700 transition hover:bg-emerald-100">
                          Traiter
                        </button>
                      ) : (
                        <span className="text-sm font-semibold text-slate-400">Déjà traitée</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="9" className="px-6 py-10 text-center text-slate-500">Aucune commande enregistrée.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Plus, MapPin, Trash2 } from 'lucide-react';
import api from '../../api';

export default function Quartiers() {
  const utilisateurConnecte = JSON.parse(localStorage.getItem('user') || 'null');
  const estAdministrateur = utilisateurConnecte?.role === 'admin';

  const [quartiers, setQuartiers] = useState([]);
  const [nouvelleQuartier, setNouvelleQuartier] = useState('');
  const [chargement, setChargement] = useState(true);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [messageSucces, setMessageSucces] = useState('');
  const [messageErreur, setMessageErreur] = useState('');

  const chargerQuartiers = async () => {
    try {
      setChargement(true);
      const reponse = await api.get('/quartiers');
      setQuartiers(Array.isArray(reponse.data) ? reponse.data : []);
    } catch (erreur) {
      setMessageErreur(erreur.response?.data?.message || 'Impossible de charger les quartiers.');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerQuartiers();
  }, []);

  const ajouterQuartier = async (evenement) => {
    evenement.preventDefault();
    setMessageErreur('');
    setMessageSucces('');

    if (!nouvelleQuartier.trim()) {
      setMessageErreur('Veuillez saisir un nom de quartier.');
      return;
    }

    try {
      setEnvoiEnCours(true);
      await api.post('/quartiers', { nom: nouvelleQuartier.trim() });
      setNouvelleQuartier('');
      setMessageSucces('Quartier ajouté avec succès.');
      chargerQuartiers();
      window.setTimeout(() => setMessageSucces(''), 4000);
    } catch (erreur) {
      setMessageErreur(erreur.response?.data?.message || 'Impossible d’ajouter le quartier.');
    } finally {
      setEnvoiEnCours(false);
    }
  };

  const supprimerQuartier = async (id) => {
    const confirmation = window.confirm('Voulez-vous vraiment supprimer ce quartier ?');
    if (!confirmation) return;

    setMessageErreur('');
    setMessageSucces('');

    try {
      await api.delete(`/quartiers/${id}`);
      setQuartiers((ancienneListe) => ancienneListe.filter((c) => c.id !== id));
      setMessageSucces('Quartier supprimé avec succès.');
      window.setTimeout(() => setMessageSucces(''), 4000);
    } catch (erreur) {
      setMessageErreur(erreur.response?.data?.message || 'Suppression impossible.');
    }
  };

  if (!estAdministrateur) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-amber-200 bg-amber-50 p-8 text-amber-800 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <AlertTriangle size={28} />
          <h1 className="text-2xl font-black">Accès réservé à l’administrateur</h1>
        </div>
        <p className="leading-7">Seul un compte administrateur peut gérer les quartiers de logements.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-amber-700">Classification</p>
        <h1 className="mt-2 text-4xl font-black text-slate-950">Quartiers</h1>
        <p className="mt-2 text-slate-500">Ajoutez de nouveaux quartiers utilisés lors de la publication des logements.</p>
      </div>

      {messageSucces && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-semibold text-emerald-700">
          <CheckCircle2 size={20} /> {messageSucces}
        </div>
      )}
      {messageErreur && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">{messageErreur}</div>}

      <form onSubmit={ajouterQuartier} className="flex flex-col gap-3 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:flex-row">
        <input
          value={nouvelleQuartier}
          onChange={(e) => setNouvelleQuartier(e.target.value)}
          type="text"
          placeholder="Exemple : Andraivato"
          className="flex-1 rounded-2xl border border-slate-200 p-4 outline-none focus:border-amber-500"
        />
        <button
          disabled={envoiEnCours}
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-700 px-6 py-4 font-black text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus size={18} /> {envoiEnCours ? 'Ajout...' : 'Ajouter'}
        </button>
      </form>

      <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
          <div className="rounded-2xl bg-amber-700 p-3 text-white"><MapPin size={22} /></div>
          <h2 className="text-xl font-black text-slate-950">{quartiers.length} quartier(s)</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {chargement ? (
            <div className="px-6 py-10 text-center text-slate-500">Chargement...</div>
          ) : quartiers.length > 0 ? (
            quartiers.map((quartier) => (
              <div key={quartier.id} className="flex items-center justify-between px-6 py-4">
                <span className="font-bold text-slate-900">{quartier.nom}</span>
                <button
                  onClick={() => supprimerQuartier(quartier.id)}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 font-bold text-red-600 transition hover:bg-red-100"
                >
                  <Trash2 size={16} /> Supprimer
                </button>
              </div>
            ))
          ) : (
            <div className="px-6 py-10 text-center text-slate-500">Aucun quartier enregistré.</div>
          )}
        </div>
      </section>
    </div>
  );
}

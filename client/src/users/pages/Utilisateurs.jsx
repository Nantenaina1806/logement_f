import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Mail, Plus, ShieldCheck, Trash2, UserPlus, X } from 'lucide-react';
import api, { urlServeur } from '../../api';

const formulaireInitial = {
  nom: '',
  email: '',
  password: '',
  role: 'agent',
};

export default function Utilisateurs() {
  const utilisateurConnecte = JSON.parse(localStorage.getItem('user') || 'null');
  const estAdministrateur = utilisateurConnecte?.role === 'admin';

  const [utilisateurs, setUtilisateurs] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [formulaireVisible, setFormulaireVisible] = useState(false);
  const [formulaire, setFormulaire] = useState(formulaireInitial);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [messageSucces, setMessageSucces] = useState('');
  const [messageErreur, setMessageErreur] = useState('');

  const chargerUtilisateurs = async () => {
    try {
      setChargement(true);
      const reponse = await api.get('/auth/utilisateurs');
      setUtilisateurs(Array.isArray(reponse.data) ? reponse.data : []);
    } catch (erreur) {
      setMessageErreur(erreur.response?.data?.message || 'Impossible de charger les utilisateurs.');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    if (estAdministrateur) chargerUtilisateurs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const modifierChamp = (champ, valeur) => {
    setFormulaire((ancien) => ({ ...ancien, [champ]: valeur }));
  };

  const soumettreFormulaire = async (evenement) => {
    evenement.preventDefault();
    setMessageErreur('');
    setMessageSucces('');

    if (!formulaire.nom.trim() || !formulaire.email.trim() || !formulaire.password.trim()) {
      setMessageErreur('Veuillez remplir le nom, l’email et le mot de passe.');
      return;
    }

    if (formulaire.password.trim().length < 6) {
      setMessageErreur('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    try {
      setEnvoiEnCours(true);
      await api.post('/auth/register', {
        nom: formulaire.nom.trim(),
        email: formulaire.email.trim(),
        password: formulaire.password,
        role: formulaire.role,
        idAuteur: utilisateurConnecte?.id || null,
      });
      setMessageSucces('Utilisateur créé avec succès.');
      setFormulaire(formulaireInitial);
      setFormulaireVisible(false);
      chargerUtilisateurs();
      window.setTimeout(() => setMessageSucces(''), 4000);
    } catch (erreur) {
      setMessageErreur(erreur.response?.data?.message || 'Impossible de créer l’utilisateur.');
    } finally {
      setEnvoiEnCours(false);
    }
  };

  const supprimerUtilisateur = async (id) => {
    if (id === utilisateurConnecte?.id) {
      setMessageErreur('Vous ne pouvez pas supprimer votre propre compte.');
      return;
    }

    const confirmation = window.confirm('Voulez-vous vraiment supprimer cet utilisateur ?');
    if (!confirmation) return;

    setMessageErreur('');
    setMessageSucces('');

    try {
      await api.delete(`/auth/utilisateurs/${id}`);
      setUtilisateurs((ancienneListe) => ancienneListe.filter((u) => u.id !== id));
      setMessageSucces('Utilisateur supprimé avec succès.');
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
        <p className="leading-7">Seul un compte administrateur peut gérer les utilisateurs de la plateforme.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-amber-700">Équipe</p>
          <h1 className="mt-2 text-4xl font-black text-slate-950">Utilisateurs</h1>
          <p className="mt-2 text-slate-500">Gérez les comptes administrateurs et agents de l’application.</p>
        </div>
        <button
          onClick={() => { setFormulaireVisible(true); setMessageErreur(''); setMessageSucces(''); }}
          className="inline-flex items-center gap-2 rounded-2xl bg-amber-700 px-5 py-3 font-bold text-white shadow-lg transition hover:bg-amber-800"
        >
          <UserPlus size={18} /> Ajouter un nouvel utilisateur
        </button>
      </div>

      {messageSucces && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-semibold text-emerald-700">
          <CheckCircle2 size={20} /> {messageSucces}
        </div>
      )}
      {messageErreur && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">{messageErreur}</div>}

      <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-xl font-black text-slate-950">{utilisateurs.length} utilisateur(s)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead className="bg-slate-50 text-sm uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Utilisateur</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Rôle</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {chargement ? (
                <tr><td colSpan="4" className="px-6 py-10 text-center text-slate-500">Chargement...</td></tr>
              ) : utilisateurs.length > 0 ? (
                utilisateurs.map((u) => (
                  <tr key={u.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {u.photoProfil ? (
                          <img src={urlServeur(u.photoProfil)} alt={u.nom} className="h-10 w-10 rounded-2xl object-cover" />
                        ) : (
                          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-700 text-sm font-black uppercase text-white">
                            {u.nom?.[0] || 'A'}
                          </span>
                        )}
                        <span className="font-bold text-slate-900">{u.nom}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="inline-flex items-center gap-2"><Mail size={14} /> {u.email}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold ${u.role === 'admin' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                        <ShieldCheck size={14} /> {u.role === 'admin' ? 'Administrateur' : 'Agent'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => supprimerUtilisateur(u.id)}
                        disabled={u.id === utilisateurConnecte?.id}
                        className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 size={16} /> Supprimer
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" className="px-6 py-10 text-center text-slate-500">Aucun utilisateur trouvé.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {formulaireVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-amber-700">Nouveau compte</p>
                <h2 className="text-2xl font-black text-slate-950">Ajouter un utilisateur</h2>
              </div>
              <button onClick={() => setFormulaireVisible(false)} className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={soumettreFormulaire} className="space-y-4">
              <input
                value={formulaire.nom}
                onChange={(e) => modifierChamp('nom', e.target.value)}
                type="text"
                placeholder="Nom complet"
                className="w-full rounded-2xl border border-slate-200 p-3 outline-none focus:border-amber-500"
                required
              />
              <input
                value={formulaire.email}
                onChange={(e) => modifierChamp('email', e.target.value)}
                type="email"
                placeholder="Adresse email"
                className="w-full rounded-2xl border border-slate-200 p-3 outline-none focus:border-amber-500"
                required
              />
              <input
                value={formulaire.password}
                onChange={(e) => modifierChamp('password', e.target.value)}
                type="password"
                placeholder="Mot de passe (6 caractères minimum)"
                className="w-full rounded-2xl border border-slate-200 p-3 outline-none focus:border-amber-500"
                required
              />
              <select
                value={formulaire.role}
                onChange={(e) => modifierChamp('role', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 p-3 font-semibold outline-none focus:border-amber-500"
              >
                <option value="agent">Agent</option>
                <option value="admin">Administrateur</option>
              </select>
              <button
                disabled={envoiEnCours}
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-700 px-5 py-3 font-bold text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus size={18} /> {envoiEnCours ? 'Création en cours...' : 'Créer l’utilisateur'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

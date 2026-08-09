import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ImagePlus, Save } from 'lucide-react';
import api from '../../api';

const formulaireInitial = {
  titre: '',
  prix: '',
  description: '',
  type: 'à louer',
  categorie: '',
  quartier: '',
  imagePrincipale: null,
  imageSecondaire: null,
  imageTertiaire: null,
};

export default function AddLogement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const enModification = Boolean(id);

  const [formulaire, setFormulaire] = useState(formulaireInitial);
  const [categories, setCategories] = useState([]);
  const [quartiers, setQuartiers] = useState([]);
  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(enModification);
  const [messageSucces, setMessageSucces] = useState('');
  const [messageErreur, setMessageErreur] = useState('');
  const utilisateurConnecteInitial = JSON.parse(localStorage.getItem('user') || 'null');
  const estAdministrateur = utilisateurConnecteInitial?.role === 'admin';

  useEffect(() => {
    let composantActif = true;

    const chargerCategories = async () => {
      try {
        const reponse = await api.get('/categories');
        const listeCategories = Array.isArray(reponse.data) ? reponse.data : [];
        if (composantActif) {
          setCategories(listeCategories);
          if (listeCategories.length > 0 && !enModification) {
            setFormulaire((ancien) => ({ ...ancien, categorie: ancien.categorie || listeCategories[0].nom }));
          }
        }
      } catch (erreur) {
        console.error('Erreur pendant le chargement des catégories :', erreur);
      }
    };

    chargerCategories();
    return () => { composantActif = false; };
  }, []);

  useEffect(() => {
    let composantActif = true;

    const chargerQuartiers = async () => {
      try {
        const reponse = await api.get('/quartiers');
        const listeQuartiers = Array.isArray(reponse.data) ? reponse.data : [];
        if (composantActif) {
          setQuartiers(listeQuartiers);
          if (listeQuartiers.length > 0 && !enModification) {
            setFormulaire((ancien) => ({ ...ancien, quartier: ancien.quartier || listeQuartiers[0].nom }));
          }
        }
      } catch (erreur) {
        console.error('Erreur pendant le chargement des quartiers :', erreur);
      }
    };

    chargerQuartiers();
    return () => { composantActif = false; };
  }, []);

  useEffect(() => {
    if (!enModification) return;
    let composantActif = true;

    const chargerLogement = async () => {
      try {
        setChargementInitial(true);
        const reponse = await api.get(`/logements/${id}`);
        const logement = reponse.data;
        if (composantActif && logement) {
          setFormulaire((ancien) => ({
            ...ancien,
            titre: logement.titre || '',
            prix: logement.prix || '',
            description: logement.description || '',
            type: logement.type || 'à louer',
            categorie: logement.categorie || '',
            quartier: logement.quartier || '',
          }));
        }
      } catch (erreur) {
        if (composantActif) {
          setMessageErreur(erreur.response?.data?.message || 'Impossible de charger ce logement.');
        }
      } finally {
        if (composantActif) setChargementInitial(false);
      }
    };

    chargerLogement();
    return () => { composantActif = false; };
  }, [id, enModification]);

  const modifierChamp = (champ, valeur) => {
    setFormulaire((ancienFormulaire) => ({ ...ancienFormulaire, [champ]: valeur }));
  };

  const soumettreFormulaire = async (evenement) => {
    evenement.preventDefault();
    setMessageSucces('');
    setMessageErreur('');

    const utilisateurStocke = localStorage.getItem('user');
    const utilisateurConnecte = utilisateurStocke ? JSON.parse(utilisateurStocke) : null;

    if (!utilisateurConnecte?.id) {
      setMessageErreur('Session expirée. Veuillez vous reconnecter avant d’ajouter un logement.');
      return;
    }

    if (!formulaire.titre.trim() || !formulaire.prix || !formulaire.description.trim()) {
      setMessageErreur('Veuillez remplir le titre, le prix et la description.');
      return;
    }

    if (Number(formulaire.prix) <= 0) {
      setMessageErreur('Le prix doit être un nombre supérieur à zéro.');
      return;
    }

    const donnees = new FormData();
    donnees.append('titre', formulaire.titre.trim());
    donnees.append('prix', formulaire.prix);
    donnees.append('description', formulaire.description.trim());
    donnees.append('type', formulaire.type);
    donnees.append('categorie', formulaire.categorie);
    donnees.append('quartier', formulaire.quartier.trim());
    donnees.append('idUtilisateur', utilisateurConnecte.id);

    if (formulaire.imagePrincipale) donnees.append('image1', formulaire.imagePrincipale);
    if (formulaire.imageSecondaire) donnees.append('image2', formulaire.imageSecondaire);
    if (formulaire.imageTertiaire) donnees.append('image3', formulaire.imageTertiaire);

    try {
      setChargement(true);
      if (enModification) {
        await api.put(`/logements/${id}`, donnees, { headers: { 'Content-Type': 'multipart/form-data' } });
        setMessageSucces('Le logement a été modifié avec succès.');
        window.setTimeout(() => navigate('/admin/logements'), 1200);
      } else {
        await api.post('/logements', donnees, { headers: { 'Content-Type': 'multipart/form-data' } });
        setMessageSucces('Le logement a été ajouté avec succès.');
        setFormulaire(formulaireInitial);
      }
    } catch (erreur) {
      setMessageErreur(erreur.response?.data?.message || erreur.response?.data?.error || 'Une erreur est survenue pendant l’enregistrement.');
    } finally {
      setChargement(false);
    }
  };

  if (!estAdministrateur) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-amber-200 bg-amber-50 p-8 text-amber-800 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <AlertTriangle size={28} />
          <h1 className="text-2xl font-black">Accès réservé à l’administrateur</h1>
        </div>
        <p className="leading-7">Seul un compte administrateur peut ajouter un nouveau logement. Les agents peuvent consulter les logements, les commandes et l’historique.</p>
      </div>
    );
  }

  if (chargementInitial) {
    return (
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-100 bg-white p-10 text-center text-slate-500 shadow-sm">
        Chargement du logement...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-amber-700">{enModification ? 'Modification' : 'Nouvelle publication'}</p>
        <h1 className="mt-2 text-4xl font-black text-slate-950">{enModification ? 'Modifier le logement' : 'Ajouter un logement'}</h1>
        <p className="mt-2 text-slate-500">{enModification ? 'Mettez à jour les informations de cette annonce.' : 'Remplissez les informations avec soin pour obtenir une annonce professionnelle.'}</p>
      </div>

      {messageSucces && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-semibold text-emerald-700">
          <CheckCircle2 size={20} /> {messageSucces}
        </div>
      )}
      {messageErreur && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">{messageErreur}</div>}

      <form onSubmit={soumettreFormulaire} className="grid gap-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Titre du logement</label>
            <input
              type="text"
              value={formulaire.titre}
              placeholder="Exemple : Appartement moderne T3 à Fianarantsoa"
              onChange={(e) => modifierChamp('titre', e.target.value)}
              className="w-full rounded-2xl border border-slate-200 p-4 outline-none transition focus:border-amber-500"
              required
            />
          </div>

          <div className="grid gap-5 md:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Prix en Ar</label>
              <input
                type="number"
                min="1"
                value={formulaire.prix}
                placeholder="Exemple : 850000"
                onChange={(e) => modifierChamp('prix', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 p-4 outline-none transition focus:border-amber-500"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Type</label>
              <select
                value={formulaire.type}
                onChange={(e) => modifierChamp('type', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 p-4 outline-none transition focus:border-amber-500"
              >
                <option value="à louer">À louer</option>
                <option value="à vendre">À vendre</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Catégorie</label>
              <select
                value={formulaire.categorie}
                onChange={(e) => modifierChamp('categorie', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 p-4 outline-none transition focus:border-amber-500"
              >
                {categories.length === 0 && <option value="">Aucune catégorie</option>}
                {categories.map((categorie) => (
                  <option key={categorie.id} value={categorie.nom}>{categorie.nom}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-400">Gérez les catégories dans le menu « Catégories ».</p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Quartier</label>
              <select
                value={formulaire.quartier}
                onChange={(e) => modifierChamp('quartier', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 p-4 outline-none transition focus:border-amber-500"
              >
                {quartiers.length === 0 && <option value="">Aucun quartier</option>}
                {quartiers.map((quartier) => (
                  <option key={quartier.id} value={quartier.nom}>{quartier.nom}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-400">Gérez les quartiers dans le menu « Quartiers ».</p>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Description détaillée</label>
            <textarea
              value={formulaire.description}
              placeholder="Décrivez le logement : emplacement, nombre de pièces, sécurité, accès, conditions..."
              rows="8"
              onChange={(e) => modifierChamp('description', e.target.value)}
              className="w-full rounded-2xl border border-slate-200 p-4 outline-none transition focus:border-amber-500"
              required
            />
          </div>
        </div>

        <aside className="space-y-4 rounded-3xl bg-slate-50 p-5">
          <div className="flex items-center gap-3 text-slate-700">
            <div className="rounded-2xl bg-amber-700 p-3 text-white"><ImagePlus size={22} /></div>
            <div>
              <h2 className="font-black">Images</h2>
              <p className="text-sm text-slate-500">{enModification ? 'Laissez vide pour garder les photos actuelles.' : 'Ajoutez jusqu’à 3 photos.'}</p>
            </div>
          </div>

          <label className="block rounded-2xl border border-dashed border-slate-300 bg-white p-4">
            <span className="mb-2 block text-sm font-bold text-slate-700">Image principale</span>
            <input type="file" accept="image/*" onChange={(e) => modifierChamp('imagePrincipale', e.target.files?.[0] || null)} className="text-sm" />
          </label>
          <label className="block rounded-2xl border border-dashed border-slate-300 bg-white p-4">
            <span className="mb-2 block text-sm font-bold text-slate-700">Image secondaire</span>
            <input type="file" accept="image/*" onChange={(e) => modifierChamp('imageSecondaire', e.target.files?.[0] || null)} className="text-sm" />
          </label>
          <label className="block rounded-2xl border border-dashed border-slate-300 bg-white p-4">
            <span className="mb-2 block text-sm font-bold text-slate-700">Image complémentaire</span>
            <input type="file" accept="image/*" onChange={(e) => modifierChamp('imageTertiaire', e.target.files?.[0] || null)} className="text-sm" />
          </label>

          <button disabled={chargement} type="submit" className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-700 px-5 py-4 font-black text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60">
            <Save size={20} /> {chargement ? 'Enregistrement...' : (enModification ? 'Enregistrer les modifications' : 'Ajouter')}
          </button>
        </aside>
      </form>
    </div>
  );
}

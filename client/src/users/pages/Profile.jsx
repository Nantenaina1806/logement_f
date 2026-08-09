import { useMemo, useState } from 'react';
import { Camera, CheckCircle2, Mail, ShieldCheck, UploadCloud, UserRound } from 'lucide-react';
import api, { urlServeur } from '../../api';

export default function Profile() {
  const [utilisateur, setUtilisateur] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const [photoSelectionnee, setPhotoSelectionnee] = useState(null);
  const [apercuPhoto, setApercuPhoto] = useState('');
  const [chargement, setChargement] = useState(false);
  const [messageSucces, setMessageSucces] = useState('');
  const [messageErreur, setMessageErreur] = useState('');

  const initiale = utilisateur?.nom?.[0] || utilisateur?.email?.[0] || 'A';
  const photoProfil = utilisateur?.photoProfil || utilisateur?.photo_profil || null;

  const imageAffichee = useMemo(() => {
    if (apercuPhoto) return apercuPhoto;
    if (photoProfil) return urlServeur(photoProfil);
    return '';
  }, [apercuPhoto, photoProfil]);

  const choisirPhoto = (fichier) => {
    setMessageSucces('');
    setMessageErreur('');
    setPhotoSelectionnee(fichier || null);

    if (fichier) {
      setApercuPhoto(URL.createObjectURL(fichier));
    } else {
      setApercuPhoto('');
    }
  };

  const enregistrerPhoto = async () => {
    if (!photoSelectionnee) {
      setMessageErreur('Veuillez sélectionner une image avant d’enregistrer.');
      return;
    }

    if (!utilisateur?.id) {
      setMessageErreur('Session expirée. Veuillez vous reconnecter.');
      return;
    }

    const donnees = new FormData();
    donnees.append('photoProfil', photoSelectionnee);

    try {
      setChargement(true);
      const reponse = await api.put(`/auth/profil/${utilisateur.id}/photo`, donnees, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const utilisateurMisAJour = { ...utilisateur, ...reponse.data.user };
      localStorage.setItem('user', JSON.stringify(utilisateurMisAJour));
      setUtilisateur(utilisateurMisAJour);
      window.dispatchEvent(new Event('profil-mis-a-jour'));
      setMessageSucces('Photo de profil mise à jour avec succès.');
      setPhotoSelectionnee(null);
    } catch (erreur) {
      setMessageErreur(erreur.response?.data?.message || 'Impossible de mettre à jour la photo de profil.');
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-amber-700">Compte utilisateur</p>
        <h1 className="mt-2 text-4xl font-black text-slate-950">Profil</h1>
        <p className="mt-2 text-slate-500">Gérez l’identité affichée dans l’espace d’administration.</p>
      </div>

      {messageSucces && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-semibold text-emerald-700">
          <CheckCircle2 size={20} /> {messageSucces}
        </div>
      )}
      {messageErreur && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">{messageErreur}</div>}

      <section className="grid gap-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-3xl bg-slate-50 p-6 text-center">
          <div className="mx-auto flex h-44 w-44 items-center justify-center overflow-hidden rounded-[2rem] bg-amber-700 text-6xl font-black uppercase text-white shadow-xl">
            {imageAffichee ? (
              <img src={imageAffichee} alt="Photo de profil" className="h-full w-full object-cover" />
            ) : (
              initiale
            )}
          </div>
          <h2 className="mt-5 text-2xl font-black text-slate-950">{utilisateur?.nom || 'Utilisateur'}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">{utilisateur?.role || 'agent'}</p>
        </div>

        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400"><UserRound size={16} /> Nom</p>
              <p className="mt-2 text-lg font-black text-slate-950">{utilisateur?.nom || 'Non renseigné'}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400"><Mail size={16} /> Email</p>
              <p className="mt-2 text-lg font-black text-slate-950">{utilisateur?.email || 'Non renseigné'}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 p-4 md:col-span-2">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400"><ShieldCheck size={16} /> Rôle</p>
              <p className="mt-2 text-lg font-black text-slate-950">{utilisateur?.role || 'agent'}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-amber-700 p-3 text-white"><Camera size={22} /></div>
              <div>
                <h3 className="font-black text-slate-950">Modifier la photo</h3>
                <p className="text-sm text-slate-500">Format conseillé : image carrée, JPG ou PNG.</p>
              </div>
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => choisirPhoto(e.target.files?.[0] || null)}
              className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-600"
            />

            <button
              type="button"
              disabled={chargement}
              onClick={enregistrerPhoto}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-700 px-5 py-4 font-black text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <UploadCloud size={20} /> {chargement ? 'Enregistrement...' : 'Enregistrer la photo'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

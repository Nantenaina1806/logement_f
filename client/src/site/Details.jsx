import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Home, Phone } from 'lucide-react';
import api, { urlServeur } from '../api';
import FacebookIcon from '../components/FacebookIcon';
import { TELEPHONE_CONTACT, URL_FACEBOOK } from '../config';

export default function Details({ logements = [] }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [logement, setLogement] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [messageErreur, setMessageErreur] = useState('');

  const logementLocal = useMemo(
    () => logements.find((element) => Number(element.id) === Number(id)),
    [logements, id]
  );

  useEffect(() => {
    let composantActif = true;

    const chargerLogement = async () => {
      if (logementLocal) {
        setLogement(logementLocal);
        setChargement(false);
        return;
      }

      try {
        const reponse = await api.get(`/logements/${id}`);
        if (composantActif) setLogement(reponse.data);
      } catch (erreur) {
        console.error('Erreur pendant le chargement du logement :', erreur);
        if (composantActif) setMessageErreur('Logement introuvable ou serveur indisponible.');
      } finally {
        if (composantActif) setChargement(false);
      }
    };

    chargerLogement();
    return () => { composantActif = false; };
  }, [id, logementLocal]);

  if (chargement) {
    return <div className="mx-auto max-w-6xl p-8 text-slate-500">Chargement du logement...</div>;
  }

  if (!logement) {
    return (
      <div className="mx-auto max-w-6xl p-8">
        <button onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-2 text-amber-700">
          <ArrowLeft size={18} /> Retour
        </button>
        <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
          <p className="text-lg font-semibold text-red-600">{messageErreur || 'Ce logement est introuvable.'}</p>
        </div>
      </div>
    );
  }

  const images = logement.images?.filter(Boolean) || [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <button onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-2 font-semibold text-amber-700 hover:text-amber-900">
        <ArrowLeft size={18} /> Retour aux logements
      </button>

      {messageErreur && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{messageErreur}</div>
      )}

      <section className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            {(images.length ? images : [null, null, null]).slice(0, 3).map((image, index) => (
              <div key={index} className={`${index === 0 ? 'md:col-span-2 md:row-span-2 h-96' : 'h-46'} overflow-hidden rounded-3xl bg-slate-200 shadow-sm`}>
                {image ? (
                  <img src={urlServeur(image)} alt={`${logement.titre} ${index + 1}`} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-400">Aucune image</div>
                )}
              </div>
            ))}
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h1 className="text-4xl font-black text-slate-950">{logement.titre}</h1>
            <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
              <span className="rounded-full bg-amber-50 px-4 py-2 text-amber-700">{logement.type}</span>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-slate-700">{logement.categorie}</span>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-slate-700">{logement.quartier ? `${logement.quartier}, Fianarantsoa` : 'Fianarantsoa'}</span>
            </div>
            <p className="mt-6 whitespace-pre-line leading-8 text-slate-600">{logement.description || 'Aucune description détaillée pour ce logement.'}</p>
          </div>
        </div>

        <aside className="h-fit rounded-3xl border border-slate-100 bg-white p-8 shadow-sm lg:sticky lg:top-28">
          <div className="mb-6 flex items-center gap-3 text-slate-500">
            <Home size={22} /> Offre immobilière
          </div>
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">Prix</p>
          <p className="mt-2 text-4xl font-black text-amber-700">
            {logement.prix ? `${Number(logement.prix).toLocaleString('fr-FR')} Ar` : 'À confirmer'}
          </p>
          <a
            href={`tel:${TELEPHONE_CONTACT}`}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-700 px-6 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-amber-800"
          >
            <Phone size={20} /> Appeler {TELEPHONE_CONTACT}
          </a>
          <p className="mt-4 text-center text-sm text-slate-500">Appelez directement l’agent pour ce logement.</p>

          <a
            href={URL_FACEBOOK}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 font-bold text-[#1877F2] shadow-sm transition hover:bg-blue-50"
          >
            <FacebookIcon size={20} /> Contacter via Facebook
          </a>
        </aside>
      </section>
    </div>
  );
}

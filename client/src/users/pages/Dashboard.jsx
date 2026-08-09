import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Building2, CalendarDays, ShoppingCart, TrendingUp, UsersRound } from 'lucide-react';
import api from '../../api';

const couleursGraphique = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#7c3aed', '#0f172a'];

const carteStatistique = ({ titre, valeur, aide, icone: Icone, accent }) => (
  <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-slate-400">{titre}</p>
        <h2 className="mt-3 text-4xl font-black text-slate-950">{valeur}</h2>
        <p className="mt-2 text-sm text-slate-500">{aide}</p>
      </div>
      <div className={`rounded-2xl p-3 text-white ${accent}`}>
        <Icone size={24} />
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const [statistiques, setStatistiques] = useState({
    totalLogements: 0,
    totalUtilisateurs: 0,
    totalCommandes: 0,
    logementsAujourdhui: 0,
    logementsHier: 0,
    logementsAvantHier: 0,
    commandesAujourdhui: 0,
    evolutionQuotidienne: [],
    repartitionTypes: [],
    repartitionCategories: [],
  });
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    let composantActif = true;

    const chargerStatistiques = async () => {
      try {
        const reponse = await api.get('/logements/stats');
        if (composantActif) setStatistiques((anciennesStatistiques) => ({ ...anciennesStatistiques, ...reponse.data }));
      } catch (erreur) {
        console.error('Erreur pendant le chargement des statistiques :', erreur);
      } finally {
        if (composantActif) setChargement(false);
      }
    };

    chargerStatistiques();
    return () => { composantActif = false; };
  }, []);

  const donneesComparaison = useMemo(() => ([
    { jour: 'Avant-hier', logements: statistiques.logementsAvantHier || 0 },
    { jour: 'Hier', logements: statistiques.logementsHier || 0 },
    { jour: 'Aujourd’hui', logements: statistiques.logementsAujourdhui || 0 },
  ]), [statistiques]);

  const donneesType = statistiques.repartitionTypes?.length
    ? statistiques.repartitionTypes
    : [{ nom: 'Aucune donnée', valeur: 1 }];

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-amber-700">Vue d’ensemble</p>
          <h1 className="mt-2 text-4xl font-black text-slate-950">Tableau de bord</h1>
          <p className="mt-2 text-slate-500">Suivi professionnel des logements, commandes et performances.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-600 shadow-sm">
          <CalendarDays size={18} /> Mise à jour automatique
        </div>
      </div>

      {chargement && <div className="rounded-3xl bg-white p-6 text-slate-500 shadow-sm">Chargement des statistiques...</div>}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {carteStatistique({ titre: 'Logements', valeur: statistiques.totalLogements, aide: 'Publications enregistrées', icone: Building2, accent: 'bg-amber-700' })}
        {carteStatistique({ titre: 'Commandes', valeur: statistiques.totalCommandes, aide: `${statistiques.commandesAujourdhui || 0} aujourd’hui`, icone: ShoppingCart, accent: 'bg-emerald-600' })}
        {carteStatistique({ titre: 'Utilisateurs', valeur: statistiques.totalUtilisateurs, aide: 'Agents et administrateurs', icone: UsersRound, accent: 'bg-slate-900' })}
        {carteStatistique({ titre: 'Aujourd’hui', valeur: statistiques.logementsAujourdhui, aide: 'Nouveaux logements publiés', icone: TrendingUp, accent: 'bg-amber-500' })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-black text-slate-950">Évolution des publications</h2>
              <p className="text-sm text-slate-500">Courbe des 7 derniers jours.</p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={statistiques.evolutionQuotidienne || []} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="courbeLogements" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="jour" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="logements" name="Logements" stroke="#2563eb" strokeWidth={3} fill="url(#courbeLogements)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Répartition par type</h2>
          <p className="text-sm text-slate-500">Location / vente.</p>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donneesType} dataKey="valeur" nameKey="nom" innerRadius={65} outerRadius={100} paddingAngle={4}>
                  {donneesType.map((_, index) => <Cell key={index} fill={couleursGraphique[index % couleursGraphique.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {statistiques.repartitionTypes?.map((element, index) => (
              <div key={element.nom} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold">
                <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: couleursGraphique[index % couleursGraphique.length] }} />{element.nom}</span>
                <span>{element.valeur}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Aujourd’hui, hier et avant-hier</h2>
          <p className="text-sm text-slate-500">Comparaison rapide des publications.</p>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={donneesComparaison} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="jour" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="logements" name="Logements" radius={[12, 12, 0, 0]} fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Catégories les plus publiées</h2>
          <p className="text-sm text-slate-500">Famille, étudiant, simple...</p>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statistiques.repartitionCategories || []} layout="vertical" margin={{ left: 20, right: 10, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis type="category" dataKey="nom" width={90} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="valeur" name="Logements" radius={[0, 12, 12, 0]} fill="#16a34a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}

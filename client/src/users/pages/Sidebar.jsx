import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Building,
  History,
  LayoutDashboard,
  LogOut,
  MapPin,
  PlusCircle,
  Tags,
  UserRound,
  Users,
  X,
} from 'lucide-react';

export default function Sidebar({ utilisateur, onFermer }) {
  const location = useLocation();
  const navigate = useNavigate();
  const roleUtilisateur = utilisateur?.role || 'agent';
  const estAdministrateur = roleUtilisateur === 'admin';

  const lienActif = (chemin) => (
    location.pathname === chemin
      ? 'bg-amber-700 text-white shadow-lg shadow-amber-950/20'
      : 'text-slate-300 hover:bg-white/10 hover:text-white'
  );

  const deconnecter = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const clicSurLien = () => {
    if (onFermer) onFermer();
  };

  return (
    <nav className="flex h-full w-72 max-w-[85vw] flex-col justify-between bg-slate-950 p-6 text-white shadow-xl">
      <div>
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-700 text-white shadow-lg">
              <BookOpen size={24} />
            </span>
            <div>
              <h2 className="text-2xl font-black text-white">LogementMad</h2>
              <p className="mt-1 text-sm font-semibold text-slate-400">Administration</p>
            </div>
          </div>
          {onFermer && (
            <button
              onClick={onFermer}
              className="rounded-xl bg-white/10 p-2 text-white transition hover:bg-white/20 lg:hidden"
              aria-label="Fermer le menu"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <ul className="space-y-2">
          <li>
            <Link onClick={clicSurLien} to="/admin" className={`flex items-center gap-3 rounded-2xl p-3 font-bold transition ${lienActif('/admin')}`}>
              <LayoutDashboard size={20} /> Tableau de bord
            </Link>
          </li>
          <li>
            <Link onClick={clicSurLien} to="/admin/logements" className={`flex items-center gap-3 rounded-2xl p-3 font-bold transition ${lienActif('/admin/logements')}`}>
              <Building size={20} /> Logements
            </Link>
          </li>
          {estAdministrateur && (
            <li>
              <Link onClick={clicSurLien} to="/admin/add-logement" className={`flex items-center gap-3 rounded-2xl p-3 font-bold transition ${lienActif('/admin/add-logement')}`}>
                <PlusCircle size={20} /> Ajouter
              </Link>
            </li>
          )}
          {estAdministrateur && (
            <li>
              <Link onClick={clicSurLien} to="/admin/categories" className={`flex items-center gap-3 rounded-2xl p-3 font-bold transition ${lienActif('/admin/categories')}`}>
                <Tags size={20} /> Catégories
              </Link>
            </li>
          )}
          {estAdministrateur && (
            <li>
              <Link onClick={clicSurLien} to="/admin/quartiers" className={`flex items-center gap-3 rounded-2xl p-3 font-bold transition ${lienActif('/admin/quartiers')}`}>
                <MapPin size={20} /> Quartiers
              </Link>
            </li>
          )}
          {estAdministrateur && (
            <li>
              <Link onClick={clicSurLien} to="/admin/utilisateurs" className={`flex items-center gap-3 rounded-2xl p-3 font-bold transition ${lienActif('/admin/utilisateurs')}`}>
                <Users size={20} /> Utilisateurs
              </Link>
            </li>
          )}
          <li>
            <Link onClick={clicSurLien} to="/admin/historique" className={`flex items-center gap-3 rounded-2xl p-3 font-bold transition ${lienActif('/admin/historique')}`}>
              <History size={20} /> Historique
            </Link>
          </li>
          
        </ul>
      </div>

      <button
        onClick={deconnecter}
        className="flex items-center gap-3 rounded-2xl p-3 font-bold text-red-300 transition hover:bg-red-500/15 hover:text-red-100"
      >
        <LogOut size={20} /> Déconnexion
      </button>
    </nav>
  );
}

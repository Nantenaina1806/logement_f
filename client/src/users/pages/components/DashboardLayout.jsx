import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from '../Sidebar';
import { urlServeur } from '../../../api';

export default function DashboardLayout() {
  const [utilisateur, setUtilisateur] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const [menuMobileOuvert, setMenuMobileOuvert] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!utilisateur || !token) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      navigate('/login');
    }
  }, [utilisateur, navigate]);

  useEffect(() => {
    const synchroniserUtilisateur = () => {
      setUtilisateur(JSON.parse(localStorage.getItem('user') || 'null'));
    };

    window.addEventListener('storage', synchroniserUtilisateur);
    window.addEventListener('profil-mis-a-jour', synchroniserUtilisateur);
    return () => {
      window.removeEventListener('storage', synchroniserUtilisateur);
      window.removeEventListener('profil-mis-a-jour', synchroniserUtilisateur);
    };
  }, []);

  // Ferme le menu mobile automatiquement à chaque changement de page.
  useEffect(() => {
    setMenuMobileOuvert(false);
  }, [location.pathname]);

  if (!utilisateur) return null;

  const initiale = utilisateur?.nom?.[0] || utilisateur?.email?.[0] || 'A';
  const photoProfil = utilisateur?.photoProfil || utilisateur?.photo_profil || null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* Sidebar fixe sur grand écran */}
      <aside className="hidden flex-shrink-0 lg:block">
        <Sidebar utilisateur={utilisateur} />
      </aside>

      {/* Menu tiroir (drawer) pour mobile et tablette */}
      {menuMobileOuvert && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setMenuMobileOuvert(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full animate-[slideIn_0.2s_ease-out]">
            <Sidebar utilisateur={utilisateur} onFermer={() => setMenuMobileOuvert(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print flex h-16 flex-shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 shadow-sm sm:h-20 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              onClick={() => setMenuMobileOuvert(true)}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden"
              aria-label="Ouvrir le menu"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <p className="hidden text-xs font-bold uppercase tracking-wider text-slate-400 sm:block">Espace professionnel</p>
              <h1 className="truncate text-base font-black text-slate-950 sm:text-xl">Gestion immobilière</h1>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2 sm:gap-4">
            <div className="hidden text-right md:block">
              <p className="font-black text-slate-900">{utilisateur?.nom || 'Administrateur'}</p>
              <p className="text-sm text-slate-500">{utilisateur?.email}</p>
            </div>

            <Link
              to="/admin/profil"
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 pr-2 shadow-sm transition hover:bg-slate-50 sm:gap-3 sm:p-2 sm:pr-3"
            >
              {photoProfil ? (
                <img src={urlServeur(photoProfil)} alt="Profil utilisateur" className="h-9 w-9 rounded-2xl object-cover sm:h-11 sm:w-11" />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-700 text-base font-black uppercase text-white sm:h-11 sm:w-11 sm:text-lg">
                  {initiale}
                </span>
              )}
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>

        <footer className="no-print flex h-12 flex-shrink-0 items-center justify-center border-t border-slate-200 bg-white px-4 text-center text-xs font-semibold text-slate-500 sm:text-sm">
          © 2026 LogementMad - Système professionnel de gestion immobilière
        </footer>
      </div>
    </div>
  );
}

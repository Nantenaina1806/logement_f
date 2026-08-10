import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, LogIn, Eye, EyeOff } from 'lucide-react';
import api from '../../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const navigate = useNavigate();

  const connecterUtilisateur = async (evenement) => {
    evenement.preventDefault();
    setErreur('');

    try {
      setChargement(true);
      const reponse = await api.post('/auth/login', {
        email: email.trim(),
        password: motDePasse,
      });

      localStorage.setItem('user', JSON.stringify(reponse.data.user));
      if (reponse.data.token) localStorage.setItem('token', reponse.data.token);
      navigate('/admin');
    } catch (err) {
      setErreur(err.response?.data?.message || 'Impossible de se connecter. Vérifiez vos identifiants.');
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#1d4ed8,transparent_35%),radial-gradient(circle_at_bottom_right,#0f766e,transparent_35%)] opacity-70" />
      <form onSubmit={connecterUtilisateur} className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-700 text-white shadow-lg">
            <Building2 size={30} />
          </div>
          <h1 className="text-3xl font-black text-slate-950">Connexion admin</h1>
          <p className="mt-2 text-slate-500">Accédez à votre tableau de bord LogementMad.</p>
        </div>

        {erreur && <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-center text-sm font-semibold text-red-700">{erreur}</p>}

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Adresse email"
            className="w-full rounded-2xl border border-slate-200 p-4 outline-none transition focus:border-amber-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Mot de passe"
              className="w-full rounded-2xl border border-slate-200 p-4 pr-10 outline-none transition focus:border-amber-500"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 p-1"
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button disabled={chargement} type="submit" className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-700 p-4 font-black text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60">
          <LogIn size={20} /> {chargement ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}

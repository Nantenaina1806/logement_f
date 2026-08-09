import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
});

// Ajoute automatiquement le token JWT (s'il existe) à chaque requête vers l'API.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si le serveur répond 401 (session expirée/invalide), on déconnecte
// automatiquement et on renvoie l'utilisateur vers la page de connexion.
api.interceptors.response.use(
  (reponse) => reponse,
  (erreur) => {
    if (erreur.response?.status === 401) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(erreur);
  }
);

export const urlServeur = (chemin) => {
  if (!chemin) return '';
  if (chemin.startsWith('http')) return chemin;
  return `${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}${chemin}`;
};

export default api;

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';

import Navbar from './site/Navbar';
import Home from './site/home';
import Details from './site/Details';
import Footer from './site/Footer';

import Login from './users/pages/login';
import Dashboard from './users/pages/Dashboard';
import ListLogement from './users/pages/ListLogement';
import AddLogement from './users/pages/AddLogement';
import ListCommandes from './users/pages/ListCommandes';
import Profile from './users/pages/Profile';
import Historique from './users/pages/Historique';
import Utilisateurs from './users/pages/Utilisateurs';
import Categories from './users/pages/Categories';
import Quartiers from './users/pages/Quartiers';
import DashboardLayout from './users/pages/components/DashboardLayout';
import api from './api';

export default function App() {
  const [logements, setLogements] = useState([]);
  const [typeSelectionne, setTypeSelectionne] = useState('tous');
  const [categorieSelectionnee, setCategorieSelectionnee] = useState('toutes');
  const [quartierSelectionne, setQuartierSelectionne] = useState('tous');
  const [recherche, setRecherche] = useState('');
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    let composantActif = true;

    const chargerLogements = async () => {
      try {
        const reponse = await api.get('/logements');
        if (composantActif) setLogements(Array.isArray(reponse.data) ? reponse.data : []);
      } catch (erreur) {
        console.error('Erreur pendant le chargement des logements :', erreur);
        if (composantActif) setLogements([]);
      } finally {
        if (composantActif) setChargement(false);
      }
    };

    chargerLogements();
    return () => { composantActif = false; };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <div className="flex min-h-screen flex-col bg-slate-50">
            <Navbar
              setType={setTypeSelectionne}
              setCategory={setCategorieSelectionnee}
              setQuartier={setQuartierSelectionne}
              setSearch={setRecherche}
              logements={logements}
            />
            <main className="flex-grow">
              <Home
                logements={logements}
                type={typeSelectionne}
                category={categorieSelectionnee}
                quartier={quartierSelectionne}
                search={recherche}
                chargement={chargement}
              />
            </main>
            <Footer />
          </div>
        } />

        <Route path="/details/:id" element={
          <div className="flex min-h-screen flex-col bg-slate-50">
            <Navbar
              setType={setTypeSelectionne}
              setCategory={setCategorieSelectionnee}
              setQuartier={setQuartierSelectionne}
              setSearch={setRecherche}
              logements={logements}
            />
            <main className="flex-grow">
              <Details logements={logements} />
            </main>
            <Footer />
          </div>
        } />

        <Route path="/login" element={<Login />} />

        <Route path="/admin" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="logements" element={<ListLogement />} />
          <Route path="add-logement" element={<AddLogement />} />
          <Route path="edit-logement/:id" element={<AddLogement />} />
          <Route path="categories" element={<Categories />} />
          <Route path="quartiers" element={<Quartiers />} />
          <Route path="commandes" element={<ListCommandes />} />
          <Route path="utilisateurs" element={<Utilisateurs />} />
          <Route path="historique" element={<Historique />} />
          <Route path="profil" element={<Profile />} />
        </Route>
      </Routes>
    </Router>
  );
}

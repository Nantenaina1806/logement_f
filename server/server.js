require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const logementRoutes = require('./routes/logement');
const categorieRoutes = require('./routes/categorie');
const quartierRoutes = require('./routes/quartier');

const app = express();
const PORT = process.env.PORT || 5000;

// Raha misy CLIENT_URL voafaritra ao amin'ny .env (ohatra: ny adiresy Vercel),
// dia io ihany no ekena. Raha tsy misy (fampiasana eo an-toerana), dia ekena daholo.
const originsEkena = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim())
  : true;
app.use(cors({ origin: originsEkena }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/logements', logementRoutes);
app.use('/api/categories', categorieRoutes);
app.use('/api/quartiers', quartierRoutes);

app.get('/', (_requete, reponse) => {
  reponse.send('API LogementMad opérationnelle.');
});

app.use((_requete, reponse) => {
  reponse.status(404).json({ message: 'Route introuvable.' });
});

app.listen(PORT, () => {
  console.log(`API LogementMad démarrée sur le port ${PORT}`);
});

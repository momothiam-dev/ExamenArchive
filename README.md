# [ExamArchive](https://examenarchive.netlify.app/)

Plateforme numérique d'archivage, de recherche et de consultation des sujets d'examen universitaire.

## Présentation
ExamArchive est une application web destinée à centraliser et organiser les anciens sujets d'examen. Ce projet est la version V1 développée en HTML, CSS, et JavaScript (Vanilla) et fonctionnant sans serveur backend, avec `localStorage` pour la persistance des données.

## Fonctionnalités
- Consultation des archives
- Recherche en temps réel
- Filtres (Filière, Année, Semestre, Matière)
- Tri des résultats
- Consultation du texte intégral d'un examen
- Ajout, modification, et suppression locale de sujets
- Fonctionnement hors ligne

## Installation et Utilisation
Puisque le projet est entièrement statique (HTML/CSS/JS), il vous suffit d'ouvrir le fichier `index.html` dans un navigateur moderne pour l'utiliser. 

Pour une meilleure expérience (par exemple pour contourner certaines restrictions CORS locales si vous ajoutez plus tard des modules ou imports), vous pouvez lancer un serveur local :

```bash
python -m http.server 8000
```
Puis rendez-vous sur `http://localhost:8000`.

## Configuration backend et clés API

Les appels Gemini et OCR passent par des fonctions Netlify. Les clés ne sont pas incluses dans le dépôt, ne sont pas affichées dans le navigateur et ne sont jamais envoyées au frontend.

Dans Netlify, ouvrez `Site configuration > Environment variables` et ajoutez :

- `GEMINI_API_KEY` : clé Google AI Studio autorisée pour Gemini
- `OCR_API_KEY` : clé OCR.space

Après l'ajout ou la modification d'une variable, relancez un déploiement. Les fonctions utilisées sont `/.netlify/functions/gemini` et `/.netlify/functions/ocr`. Le fichier `netlify.toml` configure automatiquement leur dossier.

Pour le développement local des fonctions, utilisez Netlify CLI avec `netlify dev` plutôt que d'ouvrir directement `index.html`. Limitez les quotas des fournisseurs et révoquez toute clé déjà exposée.

## Architecture
- `index.html` : Structure de l'application
- `css/style.css` : Styles et design responsive
- `js/app.js` : Logique principale de l'interface
- `js/data.js` : Données et métadonnées initiales
- `js/textes.js` : Textes OCR des sujets
- `js/search.js` : Logique de recherche et de filtrage
- `js/storage.js` : Gestion du localStorage
- `netlify/functions/` : Proxy backend sécurisé pour Gemini et OCR
- `netlify.toml` : Configuration du déploiement Netlify
- `sujet/` : Dossier contenant les images originales (facultatif pour la V1)

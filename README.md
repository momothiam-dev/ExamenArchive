# [ExamArchive](https://examenarchive.netlify.app/)

Plateforme numérique d'archivage, de recherche et de consultation des sujets d'examen universitaire.

## Présentation

ExamArchive est une application web destinée à centraliser et organiser les anciens sujets d'examen. Ce projet est la **version V2** développée en HTML, CSS et JavaScript (Vanilla), fonctionnant sans serveur backend, avec `localStorage` pour la persistance des données.

Cette refonte complète apporte :
- Un design moderne avec système de thèmes (clair / sombre / système)
- Une interface responsive (mobile-first)
- Des cartes de sujets enrichies avec aperçu d'image et actions rapides
- Une recherche et des filtres avec pagination
- Des modales retravaillées (détail, ajout, modification, paramètres)
- Des notifications toast et un meilleur retour utilisateur
- L'accessibilité (ARIA, focus clavier, contraste)

## Fonctionnalités

- Consultation des archives
- Recherche en temps réel (titre, matière, code, contenu)
- Filtres (Filière, Année, Semestre, Matière) et tri
- Pagination des résultats
- Consultation du texte intégral d'un examen (avec copier / imprimer)
- Carrousel d'images pour les sujets multi-pages
- Analyse IA des schémas et figures (via Gemini Vision, côté serveur)
- Ajout, modification, et suppression locale de sujets (mode admin)
- Extraction automatique des métadonnées via OCR à l'import
- Fonctionnement hors ligne
- Thème clair/sombre mémorisé

## Installation et Utilisation

Puisque le projet est entièrement statique (HTML/CSS/JS), il vous suffit d'ouvrir le fichier `index.html` dans un navigateur moderne pour l'utiliser.

Pour une meilleure expérience (par exemple pour contourner certaines restrictions CORS locales si vous ajoutez plus tard des modules ou imports), vous pouvez lancer un serveur local :

```bash
python -m http.server 8000
```
Puis rendez-vous sur `http://localhost:8000`.

## Mode Administrateur

Ajoutez `#admin-VotreMotDePasse` à l'URL pour activer le mode admin (ex: `index.html#admin-secret123`). Cela débloque :
- L'ajout d'archives (avec OCR + analyse IA des figures)
- La modification et la suppression de sujets
- L'accès aux paramètres

## Configuration backend et clés API

Les appels Gemini et OCR passent par des fonctions Netlify. Les clés ne sont pas incluses dans le dépôt, ne sont pas affichées dans le navigateur et ne sont jamais envoyées au frontend.

Dans Netlify, ouvrez `Site configuration > Environment variables` et ajoutez :

- `GEMINI_API_KEY` : clé Google AI Studio autorisée pour Gemini
- `OCR_API_KEY` : clé OCR.space

Après l'ajout ou la modification d'une variable, relancez un déploiement. Les fonctions utilisées sont `/.netlify/functions/gemini` et `/.netlify/functions/ocr`. Le fichier `netlify.toml` configure automatiquement leur dossier.

Pour le développement local des fonctions, utilisez Netlify CLI avec `netlify dev` plutôt que d'ouvrir directement `index.html`. Limitez les quotas des fournisseurs et révoquez toute clé déjà exposée.

## Architecture

- `index.html` : Structure de l'application (V2)
- `css/style.css` : Système de design, thèmes, responsive (V2)
- `js/app.js` : Logique principale de l'interface (V2)
- `js/data.js` : Données et métadonnées initiales
- `js/textes.js` : Textes OCR de secours
- `js/search.js` : Logique de recherche, filtrage et tri
- `js/storage.js` : Gestion du localStorage
- `netlify/functions/` : Proxy backend sécurisé pour Gemini et OCR
- `netlify.toml` : Configuration du déploiement Netlify
- `sujet/` : Dossier contenant les images originales

> **Note** : `js/storage.js` réinjecte `data.js` dans le `localStorage` à chaque chargement (`StorageManager.init()`). Les sujets ajoutés via l'interface sont donc conservés le temps de la session, mais réinitialisés à la recharge de la page si aucune donnée persistante externe n'est configurée.
